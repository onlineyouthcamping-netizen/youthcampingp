const financeController = require("../src/controllers/financeController");

describe('Finance Controller Endpoints Unit Tests', () => {
  it('should export all required controller handler functions', () => {
    expect(typeof financeController.getControlCenterStats).toBe('function');
    expect(typeof financeController.getCashSubmissionsQueue).toBe('function');
    expect(typeof financeController.getIncomingPaymentsQueue).toBe('function');
    expect(typeof financeController.getDeparturesQueue).toBe('function');
    expect(typeof financeController.getVendorPaymentsQueue).toBe('function');
    expect(typeof financeController.getTicketingVerificationQueue).toBe('function');
    expect(typeof financeController.getExpensesQueue).toBe('function');
    expect(typeof financeController.getDiscrepanciesQueue).toBe('function');
    expect(typeof financeController.getAuditLog).toBe('function');
  });
});
