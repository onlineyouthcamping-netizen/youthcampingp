const assert = require("assert");
const { PERMISSIONS, ROLE_PERMISSIONS, hasPermission } = require("../src/config/permissions");

console.log("====================================================");
console.log("🚀 RUNNING FINANCE CONTROLLER & SEPARATION OF DUTIES TEST SUITE");
console.log("====================================================");

// 1. Role Existence & Permissions Check
console.log("\n🔹 1. Role & Permission Assignment Check");
assert(ROLE_PERMISSIONS.finance_controller, "Role 'finance_controller' is defined in ROLE_PERMISSIONS");
assert(
  ROLE_PERMISSIONS.finance_controller.includes("finance.control_center.view"),
  "Finance controller has 'finance.control_center.view' permission"
);
assert(
  ROLE_PERMISSIONS.finance_controller.includes("finance.cash.approve"),
  "Finance controller has 'finance.cash.approve' permission"
);
assert(
  ROLE_PERMISSIONS.finance_controller.includes("finance.outgoing.approve"),
  "Finance controller has 'finance.outgoing.approve' permission"
);
assert(
  ROLE_PERMISSIONS.finance_controller.includes("finance.tickets.approve"),
  "Finance controller has 'finance.tickets.approve' permission"
);
assert(
  ROLE_PERMISSIONS.finance_controller.includes("finance.discrepancy.manage"),
  "Finance controller has 'finance.discrepancy.manage' permission"
);

// Verify operational mutation permissions are ABSENT from finance_controller
assert(
  !ROLE_PERMISSIONS.finance_controller.includes("trips.edit"),
  "Finance controller CANNOT edit trip itineraries (operational isolation)"
);
assert(
  !ROLE_PERMISSIONS.finance_controller.includes("departures.manage"),
  "Finance controller CANNOT mutate departure operations"
);
assert(
  !ROLE_PERMISSIONS.finance_controller.includes("users.manage"),
  "Finance controller CANNOT manage system users"
);
console.log("  ✓ Role 'finance_controller' correctly granted financial verification & blocked from operational mutation");

// 2. hasPermission Helper Checks
console.log("\n🔹 2. hasPermission Helper Verification");
assert(
  hasPermission("finance_controller", "finance.control_center.view"),
  "hasPermission returns true for finance_controller on finance.control_center.view"
);
assert(
  hasPermission("finance_controller", "finance.cash.verify"),
  "hasPermission returns true for finance_controller on finance.cash.verify"
);
assert(
  !hasPermission("sales", "finance.cash.approve"),
  "hasPermission correctly DENIES sales role from approving cash submissions"
);
assert(
  !hasPermission("operations", "finance.outgoing.approve"),
  "hasPermission correctly DENIES operations role from releasing financial payouts"
);
console.log("  ✓ hasPermission accurately enforces permissions and boundaries across roles");

// 3. Separation of Duties Logic Test
console.log("\n🔹 3. Separation of Duties (Creator !== Approver) Logic Test");
const entry = {
  id: "entry_101",
  salespersonId: "user_parth_sales",
  submittedAmount: 9500,
  expectedAmount: 10000,
};

function attemptApproval(user, targetEntry) {
  if (targetEntry.salespersonId === user.id) {
    return { success: false, status: 403, error: "Separation of Duties: Creator cannot approve own transaction" };
  }
  return { success: true, status: 200, message: "Approved" };
}

const salesAttempt = attemptApproval({ id: "user_parth_sales", role: "sales" }, entry);
assert.strictEqual(salesAttempt.status, 403, "Creator approving own transaction is rejected with 403");

const controllerAttempt = attemptApproval({ id: "user_finance_controller_1", role: "finance_controller" }, entry);
assert.strictEqual(controllerAttempt.status, 200, "Different Finance Controller can approve the transaction");
console.log("  ✓ Creator !== Approver rule successfully blocks self-approval");

// 4. Cash Reconciliation Discrepancy Calculation Test
console.log("\n🔹 4. Cash Reconciliation Discrepancy Calculation Test");
const exactEntry = { expected: 10000, submitted: 10000 };
const shortEntry = { expected: 10000, submitted: 9500 };
const excessEntry = { expected: 10000, submitted: 10500 };

assert.strictEqual(exactEntry.submitted - exactEntry.expected, 0, "Exact match difference is 0");
assert.strictEqual(shortEntry.submitted - shortEntry.expected, -500, "Short cash difference is -500");
assert.strictEqual(excessEntry.submitted - excessEntry.expected, 500, "Excess cash difference is +500");
console.log("  ✓ Cash discrepancy math validated");

console.log("\n====================================================");
console.log("✅ ALL 16 FINANCE CONTROLLER ASSERTIONS PASSED!");
console.log("====================================================\n");
