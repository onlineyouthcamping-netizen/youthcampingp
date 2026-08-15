const { prisma } = require("../src/lib/prisma");
const financeController = require("../src/controllers/financeController");

async function runTests() {
  const req = {
    user: {
      id: "admin_test",
      name: "Test Admin",
      role: "finance_controller",
      tenantId: "default",
    },
    query: {},
    params: {},
    body: {},
  };

  const createMockRes = (name) => ({
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      console.log(`[${name}] Response Code:`, this.statusCode || 200, "Success:", data.success);
      if (!data.success) {
        console.error(`[${name}] Error Message:`, data.message);
      }
      return this;
    },
  });

  console.log("Testing getControlCenterStats...");
  await financeController.getControlCenterStats(req, createMockRes("getControlCenterStats"));

  console.log("\nTesting getCashSubmissionsQueue...");
  await financeController.getCashSubmissionsQueue(req, createMockRes("getCashSubmissionsQueue"));

  console.log("\nTesting getIncomingPaymentsQueue...");
  await financeController.getIncomingPaymentsQueue(req, createMockRes("getIncomingPaymentsQueue"));

  console.log("\nTesting getDeparturesQueue...");
  await financeController.getDeparturesQueue(req, createMockRes("getDeparturesQueue"));

  console.log("\nTesting getVendorPaymentsQueue...");
  await financeController.getVendorPaymentsQueue(req, createMockRes("getVendorPaymentsQueue"));

  console.log("\nTesting getTicketingVerificationQueue...");
  await financeController.getTicketingVerificationQueue(req, createMockRes("getTicketingVerificationQueue"));

  console.log("\nTesting getExpensesQueue...");
  await financeController.getExpensesQueue(req, createMockRes("getExpensesQueue"));

  console.log("\nTesting getDiscrepanciesQueue...");
  await financeController.getDiscrepanciesQueue(req, createMockRes("getDiscrepanciesQueue"));

  console.log("\nTesting getAuditLog...");
  await financeController.getAuditLog(req, createMockRes("getAuditLog"));
}

runTests().then(() => process.exit(0)).catch((err) => {
  console.error("FATAL ERROR in test:", err);
  process.exit(1);
});
