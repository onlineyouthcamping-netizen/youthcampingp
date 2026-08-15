/**
 * Comprehensive Automated Test Suite for YouthCamping OS Finance Module Backend
 * Run with: node tests/test_finance_module.js
 */

require("dotenv").config();
require("../src/lib/env");
const { prisma } = require("../src/lib/prisma");
const jwt = require("jsonwebtoken");
const http = require("http");

let serverProcess = null;
const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}/api/finance`;

// Test Admin IDs
let salesAdmin = null;
let controllerAdmin = null;
let testBooking = null;
let testTrip = null;
let salesToken = "";
let controllerToken = "";

async function setupTestData() {
  console.log("\n📦 Setting up test database records...");

  // 1. Fetch or create test admins
  salesAdmin = await prisma.admin.findFirst({
    where: { email: "sales_test@youthcamping.internal" },
  });
  if (!salesAdmin) {
    salesAdmin = await prisma.admin.create({
      data: {
        email: "sales_test@youthcamping.internal",
        name: "Sales Rep Test",
        password: "hashed_dummy_password",
        role: "sales",
        customPermissions: ["accounting.submit", "finance.refund.create", "finance.tasks.manage"],
      },
    });
  }

  controllerAdmin = await prisma.admin.findFirst({
    where: { email: "controller_test@youthcamping.internal" },
  });
  if (!controllerAdmin) {
    controllerAdmin = await prisma.admin.create({
      data: {
        email: "controller_test@youthcamping.internal",
        name: "Finance Controller Test",
        password: "hashed_dummy_password",
        role: "finance_controller",
      },
    });
  }

  salesToken = jwt.sign(
    { id: salesAdmin.id, role: salesAdmin.role, customPermissions: salesAdmin.customPermissions, tenantId: "default" },
    process.env.JWT_SECRET
  );

  controllerToken = jwt.sign(
    { id: controllerAdmin.id, role: controllerAdmin.role, tenantId: "default" },
    process.env.JWT_SECRET
  );

  // 2. Fetch or create test Trip
  testTrip = await prisma.trip.findFirst({
    where: { slug: "manali-kasol-adventure" },
  });
  if (!testTrip) {
    testTrip = await prisma.trip.create({
      data: {
        title: "Manali Kasol Adventure",
        slug: "manali-kasol-adventure",
        location: "Himachal Pradesh",
        price: 8500,
        duration: "5 Days 4 Nights",
        description: "Test trip description",
      },
    });
  }

  // 3. Fetch or create test Booking
  const testBId = "BK-FIN-TEST-001";
  testBooking = await prisma.booking.findFirst({
    where: { bookingId: testBId },
  });
  if (!testBooking) {
    testBooking = await prisma.booking.create({
      data: {
        bookingId: testBId,
        tripId: testTrip.id,
        tripName: testTrip.title,
        name: "Rahul Sharma",
        fullName: "Rahul Sharma",
        phone: "+919876543210",
        totalAmount: 17000,
        amount: 17000,
        advancePaid: 10000,
        remainingAmount: 7000,
        paymentStatus: "Partial",
        salesAdminId: salesAdmin.id,
      },
    });
  }
  console.log("✅ Test database records ready!");
}

async function request(method, path, body = null, token = null) {
  const activeToken = token || controllerToken;
  return new Promise((resolve, reject) => {
    const fullPath = "/api/finance" + (path.startsWith("/") ? path : "/" + path);
    const dataString = body ? JSON.stringify(body) : null;

    const options = {
      hostname: "localhost",
      port: PORT,
      path: fullPath,
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${activeToken}`,
      },
    };

    if (dataString) {
      options.headers["Content-Length"] = Buffer.byteLength(dataString);
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = res.headers["content-type"]?.includes("application/json")
            ? JSON.parse(data)
            : data;
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch {
          resolve({ status: res.statusCode, data, raw: data });
        }
      });
    });

    req.on("error", (err) => reject(err));
    if (dataString) req.write(dataString);
    req.end();
  });
}

function assert(condition, message, context = null) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    if (context) console.error("   Context:", JSON.stringify(context, null, 2));
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("🚀 STARTING YOUTHCAMPING FINANCE MODULE AUTOMATED TESTS");
  console.log("=======================================================\n");

  await setupTestData();

  let createdRefundId = null;
  let creditRefundId = null;

  // ─────────────────────────────────────────────────────────────
  // 1. REFUND & CREDIT NOTE TESTS
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- [TEST GROUP 1] Refund & Credit Note Workflows ---");

  // 1.1 Create Refund Request (as Sales)
  {
    const res = await request(
      "POST",
      "/refunds",
      {
        bookingId: testBooking.bookingId,
        refundReason: "CUSTOMER_CANCELLATION",
        refundMethod: "CASH_REFUND",
        refundAmount: 3000,
        creditNoteAmount: 0,
      },
      salesToken
    );
    assert(res.status === 201, "Create refund request returns 201 Created", res);
    assert(res.data?.data?.status === "PENDING_APPROVAL", "New refund is in PENDING_APPROVAL status", res);
    createdRefundId = res.data?.data?.id;
  }

  // 1.2 Creator cannot self-approve (Separation of Duties)
  {
    const res = await request("PATCH", `/refunds/${createdRefundId}/approve`, {}, salesToken);
    assert(
      res.status === 403,
      "Creator self-approval is blocked with 403 Forbidden (Creator != Approver)"
    );
  }

  // 1.3 Finance Controller approves Cash Refund with manual UTR reference
  {
    const res = await request(
      "PATCH",
      `/refunds/${createdRefundId}/approve`,
      { refundReference: "UTR-HDFC-998877" },
      controllerToken
    );
    assert(res.status === 200, "Finance Controller approves cash refund returns 200 OK");
    assert(res.data.data.status === "COMPLETED", "Approved refund status is COMPLETED");
    assert(res.data.data.refundReference === "UTR-HDFC-998877", "Refund reference is captured");
  }

  // 1.4 Create Credit Note & Hybrid Refund
  {
    const res = await request(
      "POST",
      "/refunds",
      {
        bookingId: testBooking.bookingId,
        refundReason: "TRIP_RESCHEDULE",
        refundMethod: "HYBRID",
        refundAmount: 1000,
        creditNoteAmount: 4000,
      },
      salesToken
    );
    assert(res.status === 201, "Create hybrid refund with credit note returns 201 Created");
    creditRefundId = res.data.data.id;

    // Approve credit note
    const appRes = await request(
      "PATCH",
      `/refunds/${creditRefundId}/approve`,
      { validityMonths: 12 },
      controllerToken
    );
    assert(appRes.status === 200, "Approve hybrid refund activates credit note");
    assert(appRes.data.data.creditNoteStatus === "ACTIVE", "Credit note status is ACTIVE");
  }

  // 1.5 Get Credit Note Details & Balance
  {
    const res = await request("GET", `/credits/${creditRefundId}`);
    assert(res.status === 200, "Get credit details returns 200 OK");
    assert(res.data.data.remainingBalance === 4000, "Credit note remaining balance is 4000");
  }

  // 1.6 Overuse Prevention Rule (Requesting 5000 when balance is 4000)
  {
    const res = await request("PATCH", `/credits/${creditRefundId}/apply`, {
      targetBookingId: testBooking.bookingId,
      amountToUse: 5000,
    });
    assert(res.status === 400, "Overuse prevented: cannot apply more than remaining balance (400 Bad Request)");
  }

  // 1.7 Partial Credit Usage Application
  {
    const res = await request("PATCH", `/credits/${creditRefundId}/apply`, {
      targetBookingId: testBooking.bookingId,
      amountToUse: 2500,
      notes: "Applied 2500 credit to booking",
    });
    assert(res.status === 200, "Partial credit note applied successfully");
    assert(res.data.data.balanceAfter === 1500, "Remaining balance accurately updated to 1500");
    assert(res.data.data.creditNoteStatus === "PARTIALLY_USED", "Credit note marked PARTIALLY_USED");
  }

  // 1.8 Active Credit Notes Query with Expiry Warnings
  {
    const res = await request("GET", "/credits/active");
    assert(res.status === 200, "Get active credit notes returns 200 OK");
    assert(Array.isArray(res.data.data), "Active credits returns array");
    const found = res.data.data.find((c) => c.refundId === creditRefundId);
    assert(!!found, "Active credit note appears in active credits list");
  }

  // ─────────────────────────────────────────────────────────────
  // 2. COUPON MANAGEMENT & AUTHORITATIVE VALIDATION
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- [TEST GROUP 2] Coupon Management & Server Validation ---");

  const testCode = `SUMMER${Date.now().toString().slice(-4)}`;

  // 2.1 Create Coupon
  {
    const res = await request("POST", "/coupons", {
      code: testCode,
      description: "Flat 10% discount capped at ₹1,000",
      discountType: "PERCENTAGE",
      discountValue: 10,
      maxDiscountAmount: 1000,
      minBookingAmount: 5000,
      maxUsesTotal: 50,
      validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    assert(res.status === 201, "Create coupon returns 201 Created");
    assert(res.data.data.code === testCode, "Coupon code saved in uppercase");
  }

  // 2.2 Authoritative Validation (Percentage calculation with max cap)
  {
    // Booking amount 15,000 -> 10% = 1,500, capped at 1,000
    const res = await request("POST", `/coupons/${testCode}/validate`, {
      bookingAmount: 15000,
      tripId: testTrip.id,
    });
    assert(res.status === 200, "Validate coupon returns 200 OK");
    assert(res.data.isValid === true, "Coupon marked as valid");
    assert(res.data.data.discountAmount === 1000, "Max discount cap of ₹1,000 enforced");
    assert(res.data.data.finalAmount === 14000, "Final amount correctly computed as ₹14,000");
  }

  // 2.3 Min Booking Amount Rejection
  {
    const res = await request("POST", `/coupons/${testCode}/validate`, {
      bookingAmount: 3000, // Below min 5,000
    });
    assert(res.status === 400, "Coupon rejected if booking amount is below minBookingAmount");
  }

  // ─────────────────────────────────────────────────────────────
  // 3. FINANCE TICKET REPOSITORY & BULK INGESTION
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- [TEST GROUP 3] Finance Ticket Repository & Auditing ---");

  let createdTicketId = null;
  const testPnr = `PNR${Date.now().toString().slice(-6)}`;

  // 3.1 Create Single Ticket
  {
    const res = await request("POST", "/tickets", {
      bookingId: testBooking.bookingId,
      type: "TRAIN",
      pnr: testPnr,
      ticketNumber: "TK-10029",
      provider: "IRCTC",
      source: "New Delhi",
      destination: "Chandigarh",
      cost: 1450,
      packageAllowance: 2000,
      passengers: [{ name: "Rahul Sharma", berth: "B2-45" }],
    });
    assert(res.status === 201, "Create finance ticket returns 201 Created");
    assert(res.data.data.ticketingMargin === 550, "Ticketing margin correctly computed as ₹550");
    createdTicketId = res.data.data.id;
  }

  // 3.2 Search Tickets by PNR
  {
    const res = await request("GET", `/tickets/search?pnr=${testPnr}`);
    assert(res.status === 200, "Search tickets returns 200 OK");
    assert(res.data.data.length > 0, "Ticket found by PNR");
  }

  // 3.3 Verify Ticket Price & Margin
  {
    const res = await request("PATCH", `/tickets/${createdTicketId}/verify`, {
      cost: 1400,
      packageAllowance: 2000,
      notes: "Audited against IRCTC invoice",
    });
    assert(res.status === 200, "Verify ticket returns 200 OK");
    assert(res.data.data.status === "VERIFIED", "Ticket status is VERIFIED");
    assert(res.data.data.ticketingMargin === 600, "Updated margin is ₹600");
  }

  // 3.4 Bulk Ingest Tickets with Duplicate & Unmatched Handling
  {
    const bulkPayload = [
      {
        pnr: `BULK-PNR-A-${Date.now().toString().slice(-4)}`,
        bookingId: testBooking.bookingId,
        cost: 1200,
      },
      {
        pnr: testPnr, // Duplicate of previous ticket
        bookingId: testBooking.bookingId,
        cost: 1400,
      },
      {
        pnr: "BULK-UNMATCHED",
        bookingId: "NON_EXISTENT_BOOKING_999", // Unmatched
        cost: 900,
      },
    ];

    const res = await request("POST", "/tickets/bulk-upload", { tickets: bulkPayload });
    assert(res.status === 200, "Bulk upload returns 200 OK");
    assert(res.data.data.ingestedCount === 1, "1 valid ticket ingested");
    assert(res.data.data.duplicateCount === 1, "1 duplicate detected and skipped");
    assert(res.data.data.unmatchedCount === 1, "1 unmatched booking detected and reported");
  }

  // ─────────────────────────────────────────────────────────────
  // 4. SERVICE REGISTRY
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- [TEST GROUP 4] Booking Service Registry ---");

  let serviceId = null;

  // 4.1 Register Service
  {
    const res = await request("POST", "/services", {
      bookingId: testBooking.bookingId,
      serviceType: "HOTEL",
      serviceName: "Manali Riverfront Resort Deluxe Room",
      costPrice: 4200,
      sellingPrice: 6000,
      confirmationRef: "HTL-MNL-2026",
    });
    assert(res.status === 201, "Create service registry entry returns 201 Created");
    assert(res.data.data.status === "PENDING", "New service status is PENDING");
    serviceId = res.data.data.id;
  }

  // 4.2 Verify Service Entry
  {
    const res = await request("PATCH", `/services/${serviceId}`, {
      status: "VERIFIED",
      notes: "Hotel reservation confirmed with manager",
    });
    assert(res.status === 200, "Verify service returns 200 OK");
    assert(res.data.data.status === "VERIFIED", "Service status updated to VERIFIED");
  }

  // 4.3 Query Booking Services
  {
    const res = await request("GET", `/bookings/${testBooking.bookingId}/services`);
    assert(res.status === 200, "Get booking services returns 200 OK");
    assert(res.data.data.length > 0, "Registered services returned for booking");
  }

  // ─────────────────────────────────────────────────────────────
  // 5. OPERATIONAL TASK ALLOTMENT & WORKLOAD
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- [TEST GROUP 5] Task Allotment & Workload Engine ---");

  let taskId = null;

  // 5.1 Create Task
  {
    const res = await request("POST", "/tasks", {
      title: "Confirm Volvo Bus Seats for Departure",
      description: "Verify passenger count and Volvo seat numbers with transport operator",
      taskType: "TRANSPORT_ARRANGE",
      priority: "HIGH",
      assignedToId: controllerAdmin.id,
      bookingId: testBooking.bookingId,
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    });
    assert(res.status === 201, "Create task returns 201 Created");
    assert(res.data.data.priority === "HIGH", "Task priority is HIGH");
    taskId = res.data.data.id;
  }

  // 5.2 Add Comment to Task
  {
    const res = await request("POST", `/tasks/${taskId}/comments`, {
      comment: "Spoke with operator. 18 seats locked on Bus HR-38-9900",
    });
    assert(res.status === 201, "Add task comment returns 201 Created");
    assert(res.data.data.comment.includes("HR-38-9900"), "Comment content stored");
  }

  // 5.3 Complete Task
  {
    const res = await request("PATCH", `/tasks/${taskId}/status`, {
      status: "COMPLETED",
      note: "Bus arrangement finalized",
    });
    assert(res.status === 200, "Update task status returns 200 OK");
    assert(res.data.data.status === "COMPLETED", "Task status is COMPLETED");
  }

  // 5.4 Task Dashboard Analytics
  {
    const res = await request("GET", "/tasks/dashboard");
    assert(res.status === 200, "Task dashboard returns 200 OK");
    assert(res.data.data.totalTasks > 0, "Total tasks count > 0");
    assert(Array.isArray(res.data.data.workloadByPerson), "Workload by person returned");
  }

  // ─────────────────────────────────────────────────────────────
  // 6. FINANCIAL AUDIT TRAIL
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- [TEST GROUP 6] Immutable Financial Audit Trail ---");

  // 6.1 Query Audit Logs
  {
    const res = await request("GET", "/audit");
    assert(res.status === 200, "Get audit logs returns 200 OK");
    assert(Array.isArray(res.data.data), "Audit logs returns list");
    assert(res.data.data.length > 0, "Audit logs recorded from prior mutations");
  }

  // 6.2 Trail by Entity (JSON & CSV export)
  {
    const res = await request("GET", `/audit/reports/trail-by-entity?entityType=REFUND&entityId=${createdRefundId}`);
    assert(res.status === 200, "Trail by entity JSON returns 200 OK");
    assert(res.data.count > 0, "Audit trail contains change records for refund");

    const csvRes = await request("GET", `/audit/reports/trail-by-entity?entityType=REFUND&entityId=${createdRefundId}&format=csv`);
    assert(csvRes.status === 200, "Trail by entity CSV returns 200 OK");
    assert(csvRes.raw.includes("Timestamp,ActorID,ChangedBy,Action"), "CSV headers present");
  }

  // ─────────────────────────────────────────────────────────────
  // 7. PER-TRIP ACCOUNTING & P&L SNAPSHOTS
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- [TEST GROUP 7] Trip Accounting & P&L Calculation ---");

  // 7.1 Trip Real-time P&L
  {
    const res = await request("GET", `/trip-accounting/${testTrip.id}`);
    assert(res.status === 200, "Get trip P&L returns 200 OK");
    assert(res.data.data.revenue.netRevenue !== undefined, "Net revenue calculated");
    assert(res.data.data.directCosts.totalDirectCost !== undefined, "Direct costs aggregated");
    assert(res.data.data.profitability.grossProfit !== undefined, "Gross profit computed");
  }

  // 7.2 Trip Snapshot Creation
  {
    const res = await request("POST", "/trip-accounting/snapshot", {
      tripId: testTrip.id,
    });
    assert(res.status === 200, "Create trip P&L snapshot returns 200 OK");
    assert(Array.isArray(res.data.data), "Snapshot records generated");
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL 24 TEST SUITE ASSERTIONS PASSED WITH 100% SUCCESS!");
  console.log("=======================================================\n");
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Test suite execution failed:", err);
    process.exit(1);
  });
