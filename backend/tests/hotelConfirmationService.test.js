jest.mock("../src/lib/prisma", () => ({
  prisma: {
    opsHotelBooking: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    opsHotelCommunication: {
      create: jest.fn()
    }
  }
}));

const { confirmHotel } = require("../src/services/hotelConfirmationService");
const { prisma } = require("../src/lib/prisma");

describe("Hotel Confirmation Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should confirm hotel and create system communication log", async () => {
    const mockBooking = {
      id: "b1",
      vendorId: "v1",
      hotelName: "Mock Hotel",
      totalAmount: 10000,
      tripId: "t1",
      isLocked: false
    };

    prisma.opsHotelBooking.findUnique.mockResolvedValue(mockBooking);
    prisma.opsHotelBooking.update.mockResolvedValue({ ...mockBooking, confirmed: "CONFIRMED", isLocked: true });
    prisma.opsHotelCommunication.create.mockResolvedValue({ id: "comm1" });

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
          confirmationNumber: "REF123",
          confirmedBy: "Ops User",
          remarks: "All good",
          isLocked: true
        })
      })
    );

    expect(prisma.opsHotelCommunication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hotelBookingId: "b1",
          type: "SYSTEM",
          message: "Hotel Confirmed",
          reference: "REF123",
          createdBy: "Ops User"
        })
      })
    );

    expect(result.confirmed).toBe("CONFIRMED");
  });
});
