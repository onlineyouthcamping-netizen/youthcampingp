# Nginx Performance Configuration Rollout Plan

This document outlines a deployment-ready Nginx configuration block to enable compression, HTTP/2, keepalive connections, and secure reverse proxying.

---

## 1. Safe Nginx Configuration Snippet (For Review Only)

Add this configuration to your site-specific configuration file (e.g. `/etc/nginx/sites-available/youthcamping`):

```nginx
# 1. Upstream block for Keep-Alive Connections to PM2 Backend
upstream backend_server {
    server 127.0.0.1:3001;
    keepalive 32; # Keep up to 32 idle connections open to prevent connection recreation overhead
}

server {
    listen 80;
    server_name youthcamping.online www.youthcamping.online admin.youthcamping.online;
    
    # Redirect all HTTP requests to HTTPS (HTTP/2 requires SSL)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2; # HTTP/2 enabled only on secure listener
    server_name youthcamping.online www.youthcamping.online admin.youthcamping.online;

    ssl_certificate /etc/letsencrypt/live/youthcamping.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/youthcamping.online/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # 2. Compression Configuration (Gzip & Brotli)
    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_types
        text/plain
        text/css
        application/javascript
        application/json
        image/svg+xml
        application/xml
        text/xml;

    # Optional Brotli configuration (only uncomment if native ngx_brotli module is installed)
    # brotli on;
    # brotli_comp_level 4;
    # brotli_types text/plain text/css application/javascript application/json image/svg+xml;

    # 3. Static Assets Caching (Next.js / Vite Static Assets)
    location /_next/static/ {
        alias /var/www/youthcamping/frontend/.next/static/;
        expires 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    location /assets/ {
        alias /var/www/youthcamping/ADMIN-PANEL/dist/assets/;
        expires 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # 4. Reverse Proxy to Node.js Backend API
    location /api/ {
        proxy_pass http://backend_server;
        
        # HTTP/1.1 and empty Connection header enable Upstream Keep-Alive
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        # Standard Secure Proxy Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable all caching for APIs (particularly private booking/payments/ops)
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;
        add_header Pragma "no-cache" always;
        expires off;
    }

    # 5. Default Route (Public Frontend)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 2. Rollback Steps
If Nginx fails to restart or exhibits routing issues:
1. Revert to the previous Nginx configuration file:
   ```bash
   cp /etc/nginx/sites-available/youthcamping.bak /etc/nginx/sites-available/youthcamping
   ```
2. Test configuration sanity:
   ```bash
   nginx -t
   ```
3. Reload Nginx to apply rollback safely:
   ```bash
   systemctl reload nginx
   ```
