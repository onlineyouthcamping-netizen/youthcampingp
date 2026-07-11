import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://127.0.0.1:3000';

test.describe('SEO Environment Routing and Configuration', () => {

  // 1. Robots.txt on staging (youthcamping.online)
  test('should return disallow-all robots.txt on youthcamping.online', async ({ request }) => {
    const response = await request.get(`${FRONTEND_URL}/robots.txt`, {
      headers: {
        'Host': 'youthcamping.online'
      }
    });
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body.toLowerCase()).toContain('user-agent: *');
    expect(body).toContain('Disallow: /');
    expect(body).not.toContain('Allow: /');
    expect(body).not.toContain('Sitemap:');
  });

  // 2. Robots.txt on production (youthcamping.in)
  test('should return allow-all robots.txt with sitemap on youthcamping.in', async ({ request }) => {
    const response = await request.get(`${FRONTEND_URL}/robots.txt`, {
      headers: {
        'Host': 'youthcamping.in'
      }
    });
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body.toLowerCase()).toContain('user-agent: *');
    expect(body).toContain('Allow: /');
    expect(body).not.toContain('Disallow: /');
    expect(body).toContain('Sitemap: https://youthcamping.in/sitemap.xml');
  });

  // 3. Sitemap on staging (youthcamping.online)
  test('should return 404 for sitemap.xml on youthcamping.online', async ({ request }) => {
    const response = await request.get(`${FRONTEND_URL}/sitemap.xml`, {
      headers: {
        'Host': 'youthcamping.online'
      }
    });
    expect(response.status()).toBe(404);
  });

  // 4. Sitemap on production (youthcamping.in)
  test('should return 200 for sitemap.xml on youthcamping.in', async ({ request }) => {
    const response = await request.get(`${FRONTEND_URL}/sitemap.xml`, {
      headers: {
        'Host': 'youthcamping.in'
      }
    });
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('<urlset');
    expect(body).toContain('https://youthcamping.in');
  });

  // 5. Meta robots and canonical URL on staging homepage
  test('should inject noindex/nofollow and correct canonical on youthcamping.online homepage', async ({ request }) => {
    const response = await request.get(`${FRONTEND_URL}/`, {
      headers: {
        'Host': 'youthcamping.online'
      }
    });
    expect(response.status()).toBe(200);
    const body = await response.text();
    
    // Check injected meta tag
    expect(body).toContain('content="noindex, nofollow');
    
    // Check Google Search Console verification tag
    expect(body).toContain('<meta name="google-site-verification" content="Hy949F--o_wnmU-WH5arwK1zE038hpIyxYIauQQv-FA"');

    // Check canonical link points to youthcamping.in
    expect(body).toContain('<link rel="canonical" href="https://youthcamping.in"');
  });

  // 6. Meta robots and canonical URL on production homepage
  test('should NOT inject noindex/nofollow but have correct canonical on youthcamping.in homepage', async ({ request }) => {
    const response = await request.get(`${FRONTEND_URL}/`, {
      headers: {
        'Host': 'youthcamping.in'
      }
    });
    expect(response.status()).toBe(200);
    const body = await response.text();
    
    // Check index/follow meta tag or default Next.js index/follow metadata
    expect(body).not.toContain('content="noindex, nofollow');
    
    // Check Google Search Console verification tag is NOT present
    expect(body).not.toContain('<meta name="google-site-verification" content="Hy949F--o_wnmU-WH5arwK1zE038hpIyxYIauQQv-FA"');

    // Check canonical link points to youthcamping.in
    expect(body).toContain('<link rel="canonical" href="https://youthcamping.in"');
  });

  // 7. Meta robots and canonical URL on staging subpage
  test('should inject noindex/nofollow and correct canonical on youthcamping.online subpage', async ({ request }) => {
    const response = await request.get(`${FRONTEND_URL}/about-us`, {
      headers: {
        'Host': 'youthcamping.online'
      }
    });
    expect(response.status()).toBe(200);
    const body = await response.text();
    
    // Check injected meta tag
    expect(body).toContain('content="noindex, nofollow');
    
    // Check Google Search Console verification tag
    expect(body).toContain('<meta name="google-site-verification" content="Hy949F--o_wnmU-WH5arwK1zE038hpIyxYIauQQv-FA"');

    // Check canonical link points to youthcamping.in/about-us
    expect(body).toContain('<link rel="canonical" href="https://youthcamping.in/about-us"');
  });

  // 8. Meta robots and canonical URL on production subpage
  test('should NOT inject noindex/nofollow but have correct canonical on youthcamping.in subpage', async ({ request }) => {
    const response = await request.get(`${FRONTEND_URL}/about-us`, {
      headers: {
        'Host': 'youthcamping.in'
      }
    });
    expect(response.status()).toBe(200);
    const body = await response.text();
    
    // Check noindex/nofollow is not present
    expect(body).not.toContain('content="noindex, nofollow');
    
    // Check Google Search Console verification tag is NOT present
    expect(body).not.toContain('<meta name="google-site-verification" content="Hy949F--o_wnmU-WH5arwK1zE038hpIyxYIauQQv-FA"');

    // Check canonical link points to youthcamping.in/about-us
    expect(body).toContain('<link rel="canonical" href="https://youthcamping.in/about-us"');
  });

});

