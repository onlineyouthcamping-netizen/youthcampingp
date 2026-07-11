# Background Job Queue Rollout Plan

This document outlines the prerequisites, target jobs, security rules, and activation/rollback guidelines for deploying a background job queue (BullMQ + Redis) for the YouthCamping API.

---

## 1. Jobs Targeted for Background Queueing
The following heavy/external tasks are safe and recommended to run asynchronously:

- **Heavy Data Exports**: Generating large CSV/Excel reports for accounting ledger rows or traveler lists.
- **Train Ticket Reminders**: Periodic matching and sending of pending ticket reminders to admins.
- **Accounting Reminders**: Automated email/WhatsApp notifications for pending traveler balances.
- **Operations Departure Alerts**: System notifications when travelers have missing paperwork or checklists.

---

## 2. Idempotency Key Format
To prevent duplicate job creation during high-concurrency requests or network retries, every queued job must have a unique, deterministic idempotency key.
- **Format**: `job:<job_type>:<entity_id>:<unique_timestamp_or_version>`
- **Examples**:
  - Export: `job:export:accounting:tenant_123:2026-06-28_11-30-00`
  - Ticket Reminder: `job:ticket_reminder:booking_8923:2026-06-28`
  - Balance Notification: `job:balance_alert:booking_8923:v1`

---

## 3. Security & Permission Rules
- **Access Check**: The API request handler must verify the requesting user's roles and permissions (e.g. `reports.export` or `operations.edit`) **before** placing a job onto the queue.
- **Payload Encryption**: Never write raw customer passwords, tokens, or full credit card details in the queue job payload. Only pass referencing IDs (e.g. `bookingId`, `tenantId`).
- **Context Isolation**: The worker must retrieve fresh records from the database using the IDs passed in the payload, ensuring proper tenant-isolation (`where: { tenantId }`) is enforced.

---

## 4. Operational Architecture: One-Worker Rule
- **Scheduler Isolation**: Scheduled cron/alert scanning jobs must run on exactly **one** worker process at a time.
- Running scheduler ticks across multiple web clusters causes duplicated alert deliveries.
- Use a dedicated PM2 process for the queue worker (`exec_mode: fork`, `instances: 1`), keeping it separate from load-balanced web clusters.

---

## 5. Prerequisites & Activation Steps
To activate the background queue in production:
1. **Prerequisite**: Redis must be installed and active (see `docs/redis-cache-rollout.md`).
2. Install queue dependencies in the backend:
   ```bash
   cd backend
   npm install bullmq
   ```
3. Configure the worker in a separate PM2 process (e.g. `worker.js`) listening to the Redis queue.
4. Set the env variable:
   ```bash
   ENABLE_BACKGROUND_WORKERS=true
   ```

---

## 6. Rollback Plan
If workers experience delays, high CPU usage, or connection issues:
1. Turn off worker processing by setting:
   ```bash
   ENABLE_BACKGROUND_WORKERS=false
   ```
2. Restart the PM2 backend processes:
   ```bash
   pm2 restart youthcamping-backend
   ```
3. The API will fall back to processing operations inline synchronously, or return an error for unavailable heavy tasks instead of filling up memory queues.
