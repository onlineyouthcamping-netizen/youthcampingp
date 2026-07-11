# Database Indexes Performance Review

This document contains recommendations for creating composite indexes on high-traffic fields. Index creation must be performed in a separate release via dedicated Prisma schema changes and database migrations. Do not apply migrations directly.

---

## Recommended Indexes

### 1. Booking Departure Date Index
* **Endpoint / Query Path**: `GET /api/bookings` (Filtering and paging bookings by trip and departure)
* **Current Filters / Sort**: `where: { tenantId, tripId, departureDate }, orderBy: { createdAt: 'desc' }`
* **Proposed Composite Index**: 
  ```prisma
  @@index([tenantId, tripId, departureDate, createdAt])
  ```
* **Reason**: Speeds up filtering of bookings for operations workspaces and trip departures. Adding `createdAt` facilitates fast sorting without in-memory sorting overhead.
* **Expected Benefit**: Reduces execution time of paginated list queries from ~150ms to <15ms.
* **Write-Cost Tradeoff**: Minimal; bookings are created once and updated occasionally. Index size overhead is very small.
* **Covered by Existing Index**: No. Existing index only covers single columns (`tripId` or `tenantId` separately).

### 2. Train Ticket Approval Queue Index
* **Endpoint / Query Path**: `GET /api/train-tickets/approvals` (Filtering ticket approvals by status and date)
* **Current Filters / Sort**: `where: { tenantId, approvalStatus }, orderBy: { updatedAt: 'desc' }`
* **Proposed Composite Index**: 
  ```prisma
  @@index([tenantId, approvalStatus, updatedAt])
  ```
* **Reason**: Optimizes server-side pagination for ticket managers looking at the approvals queue.
* **Expected Benefit**: Immediate pagination response times, preventing table lag as the list grows to thousands of tickets.
* **Write-Cost Tradeoff**: Medium; ticket approvals undergo frequent updates when verified or resubmitted. However, the search performance gain outweighs the slight write overhead.
* **Covered by Existing Index**: No.

### 3. Accounting Entries Status Index
* **Endpoint / Query Path**: `GET /api/accounting/entries` (Manager dashboard payment approvals)
* **Current Filters / Sort**: `where: { tenantId, status }, orderBy: { createdAt: 'desc' }`
* **Proposed Composite Index**: 
  ```prisma
  @@index([tenantId, status, createdAt])
  ```
* **Reason**: Speeds up retrieval of pending payment approvals for the accounting dashboard.
* **Expected Benefit**: Drastically decreases scan times for paginated accounting entries.
* **Write-Cost Tradeoff**: Minimal; new accounting entries are appended sequentially, and status transitions occur once (Approve/Reject).
* **Covered by Existing Index**: No.

### 4. Operations Departure Workspace Index
* **Endpoint / Query Path**: `GET /api/ops/summary/:tripId` (Lightweight Operations workspace loading)
* **Current Filters / Sort**: `where: { tenantId, tripId, departureDate }`
* **Proposed Composite Index**: 
  ```prisma
  @@index([tenantId, tripId, departureDate])
  ```
* **Reason**: Accelerates operations summary fetches across checklist, seat configs, incidents, and hotel bookings.
* **Expected Benefit**: Fast execution of `buildBookingOpsSummary` and `getWorkspaceSummary` query sets.
* **Write-Cost Tradeoff**: Low; operations allocation structures are static per departure.
* **Covered by Existing Index**: No.
