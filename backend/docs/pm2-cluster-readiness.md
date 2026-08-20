# PM2 Cluster Mode Readiness Audit

This document outlines the statelessness audit of the YouthCamping API, identifies blockers, and details the recommended PM2 ecosystem configuration for production cluster mode rollout.

---

## 1. Statelessness Audit & Blockers

An audit of the backend API reveals that it is mostly stateless and suitable for running in PM2 Cluster Mode:

| Feature | Audit Status | Detail / Blocker | Recommendation |
| :--- | :--- | :--- | :--- |
| **Authentication** | Stateless | Uses client-side JWT authentication. | No action required. |
| **Uploads** | Stateless | Uploads are routed directly to Cloudinary; no local files are written. | No action required. |
| **Scheduler** | Safe | `scheduler.js` is a stub and no singleton cron timers/intervals exist. | If background tasks are added, run them in a single dedicated worker. |
| **WebSockets** | Stateless | No WebSockets/real-time socket connections exist. | No action required. |
| **Rate Limiter** | State Leak | Uses memory-store `express-rate-limit` which does not share state. | Replace with `rate-limit-redis` when enabling cluster mode. |

---

## 2. Recommended PM2 Ecosystem Configuration

Create an `ecosystem.config.js` file in the project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'youthcamping-backend',
      script: 'backend/src/server.js',
      exec_mode: 'cluster',
      instances: 'max', // Scale to all available CPU cores
      env: {
        NODE_ENV: 'production'
      },
      env_development: {
        NODE_ENV: 'development'
      },
      // Graceful shutdown config
      listen_timeout: 10000, // Wait up to 10s for connections to drain
      kill_timeout: 5000,    // Wait up to 5s before force killing
      max_memory_restart: '1G' // Auto-restart if memory exceeds 1GB
    }
  ]
};
```

---

## 3. Operations & Load-Testing Checklist

Before activating cluster mode:
1. **Load Test**: Use a tool like `k6` or `autocannon` to verify that performance scales linearly with the number of instances.
2. **Graceful Reload**: Verify that `pm2 reload youthcamping-backend` achieves zero-downtime deployment by spinning up new processes before terminating old ones.
3. **Session Consistency**: Ensure that no stateful route (like multi-step auth or in-memory wizard) requires sticky sessions.
4. **Log Aggregation**: Set up PM2 logs to append process IDs, since standard console logs will merge stdout from multiple clusters.

---

## 4. Rollback Plan
If cluster mode causes database connection pool saturation or unexpected memory leaks:
1. Revert PM2 config back to fork mode:
   ```bash
   pm2 start backend/src/server.js --name "youthcamping-backend" -f
   ```
2. Or use `ecosystem.config.js` with `exec_mode: 'fork'` and `instances: 1`.
