# YouthCamping OS
## Internal Operating System for a Travel Company

This document defines the core product vision, design philosophy, implementation rules, and architectural guidelines for **YouthCamping OS**. All developers, designers, and AI agents must adhere to these guidelines for all current and future module builds.

---

### Core Principle
Everything in YouthCamping OS revolves around **Bookings**. The Booking workspace acts as the central hub of the system. Sales, departures, operations, tickets, finance, vendors, documents, tasks, approvals, customer history, and reporting must all connect back to a booking.

---

### Design & Spacing Rules
* **UI Style:** Minimal, premium, extremely fast, information-dense, modern SaaS (e.g., Salesforce x Linear x Notion). 
* **Spacing Standard:**
  - Page Padding: `24px`
  - Cards: `16px`
  - Gaps: `8px`
* **Visuals:** Rounded corners, soft shadows, premium typography, white background, light gray panels, orange primary accents, green success indicators, red alert indicators, and blue links.
* **Information Density:** Prioritize showing maximum useful information on one page without unnecessary white space.

---

### Module Architecture

#### 1. CRM & Leads
* Channels: Meta, Web, WhatsApp, Manual
* Status Flow: New ➔ Contacted ➔ Interested ➔ Follow Up ➔ Negotiation ➔ Won ➔ Lost ➔ Duplicate
* Features: Notes, WhatsApp log, call log, timeline, task ownership, lead scores.

#### 2. Booking Workspace (360° View)
* Tabbed components: Customer Profile, Passengers Manifest, Payments, Documents, Tickets, Notes, Internal Task Board, Communication Feed, History, and Audit Log.
* Actionable states: Add passenger, record payments, assign tickets, and trigger emails.

#### 3. Departures & Trips
* Departure consists of a trip + departure date (e.g., Manali, June 5th).
* Includes passenger manifest, vehicle/driver info, guide assignment, hotel bookings, room allocation, vendor payments, and departure checklist.

#### 4. Train Ticketing Queue
* Ticket Statuses: Pending, Booked, Waitlisted, Confirmed, RAC, Self Booked.
* Workflow: PNR verification repository, passenger mapping, verification queue, senior approval, and booking-level ticket visibility.

#### 5. Accounting & Expenses
* Revenue, collections, outstanding payments, vendor invoices, refunds, Daily Cash Closing, and trip-wise profit calculation.

---

### Audit & Traceability Rules
* All modifications (e.g., status changes, pricing, salesperson reassignment) must log an audit history: **Who** changed it, **What** changed, **When** it changed, and **Why**.

---

### Recommended Module Build Order
1. **Booking Workspace (Final Redesign)**
2. **Customer Profile**
3. **Departure Workspace**
4. **Trip Workspace**
5. **Operations Module**
6. **Accounting Module**
7. **Vendor Management**
8. **Dashboard & Analytics**
9. **Settings & RBAC (Roles & Permissions)**

---

### Reticle Verification & Runtime Proof
* **Verification Rule**: Verify runtime behavior, API network requests (expecting status 200 OK), store state updates, and console error absence (`console.error` absent) on key edits using Reticle tools before declaring feature completeness.

---

### Frontend Design Lock & Data-Design Separation
* **Design Status**: **PRODUCTION LOCKED**. The visual appearance, component styling, color palette, typography, spacing scale, and layout structure are frozen.
* **Admin vs Frontend Contract**:
  - **Admin Panel / API**: Modifies DATA ONLY (trip names, prices, descriptions, itinerary items, dates, photos, FAQs, reviews).
  - **Frontend**: Renders dynamic data inside LOCKED UI templates without mutating layout, fonts, colors, or structural dimensions.
* **Emergency Override**: Visual design modifications are strictly forbidden unless accompanied by explicit instruction: `"Override Design Lock: [specific change needed]"`.
