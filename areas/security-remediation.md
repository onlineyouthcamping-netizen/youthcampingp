# Security Remediation Log

## Incident: Hardcoded Credential Exposures (Aug 2026)

### 1. Supabase Postgres Credentials
*   **Location:** `inspect_booking.js:4`
*   **Severity:** 🔴 CRITICAL
*   **Status:** Removed from working tree.
*   **Required Action:** Reset `postgres` password in Supabase Dashboard (SQL Editor: `ALTER ROLE postgres WITH PASSWORD 'new_password';`). Update `.env` with the new `DATABASE_URL`.

### 2. MongoDB Connection String & Password
*   **Location:** `check-db.js:6`
*   **Severity:** 🔴 CRITICAL
*   **Status:** Removed from working tree.
*   **Required Action:** Change the database user (`parthyouthcamping_db_user`) password in MongoDB Atlas. Update `.env` with the new `MONGODB_URI`.

### 3. Google Maps API Key
*   **Location:** `backend/scripts/migrations/legacy-youthcamping/raw/spiti-valley-road-trip-137856.html:1258` (and other legacy files)
*   **Severity:** 🔴 CRITICAL
*   **Status:** Redacted in working tree (replaced with `REDACTED_API_KEY`).
*   **Required Action:** Delete the exposed key (`AIzaSyAGHUBpsnQpCdzltj5NSNuhLJPBhWgI1x8`) in Google Cloud Console. Create a new key and restrict it by domain/IP. Update `.env` with the new `GOOGLE_MAPS_API_KEY`.

### 4. Supabase Postgres (Test File Leak)
*   **Location:** `tests/unit/env.test.ts:54`
*   **Severity:** 🟡 MODERATE (Appears to be a mock string or a real project ID with a fake password).
*   **Status:** Redacted in working tree (replaced with `db.fake-host-for-testing.local`).
*   **Required Action:** If the `myncdgifgxsworewkukj` project ID is real, ensure the Postgres password is rotated via the Supabase Dashboard. 

---

### Codebase Audit Status
*   **`postgres:` search:** Clean (only mock test data remains).
*   **`mongodb+srv:` search:** Clean (only documentation/examples remain).
*   **`AIza` search:** Clean.
*   **`.gitignore` Update:** Updated to ignore `scratch/`, `**/check-db.js`, `**/inspect_booking.js`, and `backend/scripts/migrations/legacy-youthcamping/raw/*.html`.

### Next Steps for History Rewrite
The git history still contains these credentials. Before rewriting history, ensure your working directory is clean (commit or stash changes). Then run:

```bash
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch backend/scripts/migrations/legacy-youthcamping/raw/*.html scratch/check_db.js scratch/inspect_booking.js" --prune-empty --tag-name-filter cat -- --all
git push origin --force --all
```
