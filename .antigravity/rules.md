# Antigravity Operating Rules & Guidelines

## 1. Port & Dev URL Configs
* **ycadmin Panel:** `http://localhost:8080` (falls back to `8081`)
* **Backend Database API:** `http://localhost:3001`
* **Frontend Portal:** `http://localhost:3000`

---

## 2. Verification Protocol
* **Browser First:** Before marking any task complete, open a browser instance and manually verify the rendered state.
* **Do Not Rely Only on Compile Success:** A successful build (`npm run build` or TS check) is a dependency, not verification.
* **Audit Trail:** Maintain the database audit logger and navigation persistence state strictly across updates.

---

## 3. Git Commit Policy
* **Immediate Commits:** Commit code changes immediately following verification of each component/sub-task.
* **Separate Repositories:** Ensure commits are separated correctly into `ycadmin` (frontend) and `backend` (Prisma/Express) repositories with clear messages.

---

## 4. Acceptance Checklist (Travel Desk Module)
* [ ] **Accordion behaviour:** Sidebar accordion only has one section open at a time.
* [ ] **Nav persistence:** Expanded module persists in DB and restores correctly on fresh login.
* [ ] **Chevron exceptions:** Travel Desk and Approval Center never show a chevron or expand in the sidebar.
* [ ] **Visa conditions:** Visa Information tab is hidden for domestic trips.
* [ ] **Notice integrity:** Must-read banner pulls real rows from `trip_notices`, not placeholder text.
* [ ] **Grid integrity:** Card grid renders from `knowledge_sections` table, count matches actual `item_count`.
* [ ] **Spacing adherence:** All spacing uses the 4px-multiple scale, no arbitrary padding values.
* [ ] **Verification run:** PM2 restarted / dev server reloaded and manually clicked through before reporting done.
