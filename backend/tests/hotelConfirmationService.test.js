const { confirmHotel } = require("../src/services/hotelConfirmationService");
const { prisma } = require("../src/lib/prisma");

jest.mock("../src/lib/prisma", () => ({
  prisma: {
    opsHotelBooking: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    opsVendorLedger: {
      create: jest.fn()
    }
  }
}));

describe("Hotel Confirmation Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should confirm hotel and create vendor ledger invoice", async () => {
    const mockBooking = {
      id: "b1",
      vendorId: "v1",
      hotelName: "Mock Hotel",
      totalAmount: 10000,
      tripId: "t1",
      metadata: { communicationLog: [] }
    };

    prisma.opsHotelBooking.findUnique.mockResolvedValue(mockBooking);
    prisma.opsHotelBooking.update.mockResolvedValue({ ...mockBooking, confirmed: "CONFIRMED" });
    prisma.opsVendorLedger.create.mockResolvedValue({ id: "ledger1" });

    const result = await confirmHotel("b1", {
      confirmationNumber: "REF123",
      confirmedBy: "Ops User",
      remarks: "All good"
    });

    expect(prisma.opsHotelBooking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "b1" },
        data: expect.objectContaining({
          confirmed: "CONFIRMED",
          metadata: expect.objectContaining({
            confirmationNumber: "REF123",
            confirmedBy: "Ops User",
            communicationLog: expect.arrayContaining([
              expect.objectContaining({ action: "Hotel Confirmed" })
            ])
          })
        })
      })
    );

    expect(prisma.opsVendorLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          vendorId: "v1",
          entryType: "INVOICE",
          amount: 10000,
          balance: 10000,
          referenceNo: "REF123",
          remarks: "Hotel Confirmation for Trip t1 - Mock Hotel"
        }
      })
    );
  });
});
