# Production API Performance and Payload Measurement

This document details how to measure key performance indicators for the YouthCamping API, database, and frontends using developer diagnostics tools (browser Network tab) and system logging (PM2 logs).

---

## 1. Enabling Metrics Middleware
Metrics tracking is opt-in and disabled by default to protect production performance. To enable it, define this environment variable:
```bash
ENABLE_PERFORMANCE_METRICS=true
```
When enabled:
- The backend appends a `Server-Timing: app;dur=<ms>` header to all `/api` responses.
- Standard requests and responses are logged to stdout with path, status code, duration, and payload size.
- Slow requests (>1000ms) trigger a warning log.
- Slow database queries (>500ms) trigger a slow-query log.

---

## 2. Metrics Measurement Strategy

### A. Measuring p50 and p95 API Durations
1. **Using PM2 Logs**:
   Parse stdout logs matching `[METRICS]`. Use command-line tools to extract durations and sort them to compute percentiles:
   ```bash
   # Extract durations from PM2 logs and sort
   pm2 logs youthcamping-backend --raw | Select-String "\[METRICS\]" | ForEach-Object {
     if ($_ -match "Duration: (\d+)ms") { $Matches[1] }
   } | Sort-Object -Double
   ```
   - **p50 (Median)**: The middle value of the sorted list.
   - **p95**: The value at the 95th percentile rank.

2. **Using APM / Log Analyzers**:
   In production, pipe the standardized JSON or plaintext output to a log manager (like Datadog, ELK, or CloudWatch) to graph p50/p95 aggregations over time.

### B. Identifying the Slowest Route
- Scan PM2 log files or standard error output for warnings matching `[SLOW REQUEST]`.
- This logs requests taking more than 1000ms:
  ```text
  [SLOW REQUEST] [METRICS] Method: GET, Path: /api/bookings, Status: 200, Duration: 1450ms, Size: 2450 bytes
  ```
- Alternatively, sort HTTP response times under the **Network** tab in your browser's Developer Tools by clicking on the **Time** column header.

### C. Measuring Payload Sizes
- Every `/api` request prints its size in the logged metrics (`Size: <bytes> bytes`).
- Under the browser's **Network** tab, inspect the **Size** or **Transferred** column.
- For API responses, look for the `Content-Length` response header.

### D. Finding Slow Prisma Queries
- Database query execution times are monitored without capturing raw query text or parameters.
- Query durations exceeding 500ms log a warning:
  ```text
  [SLOW DATABASE QUERY] Model: Booking, Action: findMany, Duration: 620ms
  ```
- Correlate these logs with the concurrent slow request warnings to identify bottlenecks.

### E. Measuring Admin Page Response Size
- Admin pages load their shells dynamically. Under the browser **Network** tab:
  1. Open Developer Tools (F12) and switch to the **Network** tab.
  2. Filter by `Fetch/XHR` or `JS` files.
  3. Look at the **Size** column for JSON API payloads and JS chunk sizes.

### F. Verifying Public Homepage Cache and Response Behavior
- Open the Network tab and request the homepage (`/`).
- Inspect the response headers:
  - `X-Cache` or `Cache-Control` will indicate cache-control directives (e.g. `s-maxage=30`).
  - Next.js ISR responses show header statuses like `x-nextjs-cache: HIT` or `x-nextjs-cache: MISS`.
