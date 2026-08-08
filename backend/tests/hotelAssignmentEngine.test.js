const { generateHotelAssignments } = require("../src/services/hotelAssignmentEngine");
const { prisma } = require("../src/lib/prisma");

// Mock prisma
jest.mock("../src/lib/prisma", () => ({
  prisma: {
    opsVendor: {
      findMany: jest.fn()
    }
  }
}));

describe("Hotel Assignment Engine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseStay = {
    city: "Manali",
    checkIn: "2026-06-01",
    checkOut: "2026-06-03",
    nights: 2,
    requirements: {
      Twin: 12,
      Triple: 6,
      Quad: 2
    }
  };

  it("should handle no vendors found", async () => {
    prisma.opsVendor.findMany.mockResolvedValue([]);
    const result = await generateHotelAssignments(baseStay);
    expect(result.status).toBe("Manual Review");
    expect(result.assignments.length).toBe(0);
    expect(result.exceptions[0]).toContain("No active vendors found");
  });

  it("should assign a single hotel if capacity is sufficient", async () => {
    prisma.opsVendor.findMany.mockResolvedValue([
      {
        id: "V1", companyName: "Hotel Snow View",
        twinRate: 2000, rating: 4, performanceScore: 90,
        totalRooms: 30,
        hotelBookings: []
      }
    ]);

    const result = await generateHotelAssignments(baseStay);
    expect(result.status).toBe("Ready");
    expect(result.assignments.length).toBe(1);
    expect(result.assignments[0].vendorId).toBe("V1");
    // Should have satisfied all demand: 12 + 6 + 2 = 20 rooms. Total rooms 30.
    expect(result.assignments[0].allocatedRooms.Twin).toBe(12);
    expect(result.assignments[0].allocatedRooms.Triple).toBe(6);
    expect(result.assignments[0].allocatedRooms.Quad).toBe(2);
  });

  it("should split booking across multiple hotels if first hotel lacks capacity", async () => {
    // Requires 20 rooms total. 
    // Hotel A has 15 rooms. Hotel B has 10 rooms.
    prisma.opsVendor.findMany.mockResolvedValue([
      {
        id: "V1", companyName: "Hotel Best", // Should have higher score
        twinRate: 1500, rating: 5, performanceScore: 95,
        totalRooms: 15,
        hotelBookings: []
      },
      {
        id: "V2", companyName: "Hotel Okay", // Lower score
        twinRate: 2500, rating: 3, performanceScore: 80,
        totalRooms: 10,
        hotelBookings: []
      }
    ]);

    const result = await generateHotelAssignments(baseStay);
    expect(result.status).toBe("Split Review");
    expect(result.assignments.length).toBe(2);
    expect(result.assignments[0].vendorId).toBe("V1");
    expect(result.assignments[1].vendorId).toBe("V2");
    
    // First hotel gets 15 rooms (probably 12 Twin, 3 Triple depending on iteration order)
    const totalAllocatedV1 = Object.values(result.assignments[0].allocatedRooms).reduce((a,b)=>a+b,0);
    const totalAllocatedV2 = Object.values(result.assignments[1].allocatedRooms).reduce((a,b)=>a+b,0);
    
    expect(totalAllocatedV1).toBe(15);
    expect(totalAllocatedV2).toBe(5);
  });

  it("should return Manual Review if total capacity is exceeded", async () => {
    // Need 20 rooms. Only 5 available.
    prisma.opsVendor.findMany.mockResolvedValue([
      {
        id: "V1", companyName: "Hotel Tiny",
        twinRate: 1500, rating: 5, performanceScore: 95,
        totalRooms: 5,
        hotelBookings: []
      }
    ]);

    const result = await generateHotelAssignments(baseStay);
    expect(result.status).toBe("Manual Review");
    expect(result.assignments.length).toBe(1);
    expect(result.exceptions[0]).toContain("Insufficient hotel capacity");
  });
});
