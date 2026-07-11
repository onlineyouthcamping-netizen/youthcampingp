# Optional Redis Cache Rollout Plan

This document details the architecture, configuration, supported cache keys, activation, and rollback steps for the optional Redis cache layer in the YouthCamping platform.

---

## 1. Supported Cache Keys & TTLs
Caching is restricted to public data and safe, aggregated, non-PII Admin summaries.

### A. Public Content Caching (TTL: 60 to 300 seconds)
- **Homepage Sections**: `public:page:home` (TTL: 300s)
- **Theme and Branding Settings**: `public:theme` (TTL: 300s)
- **Footer Configuration**: `public:footer` (TTL: 300s)
- **Published Trip Cards**: `public:trips:cards:<filters_hash>` (TTL: 60s)
- **Published Reviews**: `public:reviews:list` (TTL: 300s)
- **Published Blogs**: `public:blogs:list:<filters_hash>` (TTL: 300s)

### B. Admin Summary Caching (TTL: 15 seconds)
- **Booking details summary**: `admin:summary:booking:<tenantId>:<bookingId>` (TTL: 15s)
- **Operations workspace summary**: `admin:summary:ops:<tenantId>:<tripId>:<departureDate>` (TTL: 15s)
- **Accounting summary cards**: `admin:summary:accounting:<tenantId>` (TTL: 15s)
- **Ticket approval count summaries**: `admin:summary:tickets:approvals:<tenantId>` (TTL: 15s)

---

## 2. Privacy & Security Rules (PII Protection)
To comply with data privacy policies, the following data **MUST NEVER** be cached:
- Personal Identifiable Information (PII) including full traveler name, email, phone, gender, and age.
- Security tokens, passwords, session data, or booking link access tokens.
- Sensitive financials including payment references, invoices, GST numbers, refunds, or vendor cost details.
- Internal notes, ticket history logs, or checklist logs.

---

## 3. Required Environment Variables
The caching layer reads the following optional environment variables:
- `REDIS_URL` - The connection URL for the Redis server.

---

## 4. Manual Activation Steps
1. Install `ioredis` dependency in the backend project:
   ```bash
   cd backend
   npm install ioredis
   ```
2. Configure the Redis server URL in the server's environment settings:
   ```bash
   REDIS_URL=redis://username:password@host:port
   ```
3. Restart the backend process:
   ```bash
   pm2 restart youthcamping-backend
   ```
4. Verify connection status in the logs:
   ```bash
   pm2 logs youthcamping-backend --lines 50 | grep "Redis cache connected"
   ```

---

## 5. Rollback Steps
If Redis becomes slow, unstable, or throws errors:
1. Remove or comment out the `REDIS_URL` environment variable.
2. Restart the backend process:
   ```bash
   pm2 restart youthcamping-backend
   ```
3. **Fail-Open Verification**: The cache adapter will dynamically detect that `REDIS_URL` is missing, skip the load phase, and route all requests directly to the database without throwing any exceptions or failing requests.
