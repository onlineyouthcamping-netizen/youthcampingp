const { generateAccommodationPlan } = require("../src/services/accommodationPlanner");
const { prisma } = require("../src/lib/prisma");

jest.mock("../src/lib/prisma", () => ({
  prisma: {
    itinerary: {
      findFirst: jest.fn()
    }
  }
}));

describe("Accommodation Planner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should group consecutive days into a single stay", async () => {
    prisma.itinerary.findFirst.mockResolvedValue({
      id: "itin1",
      days: [
        { dayNumber: "1", stay: "Manali" },
        { dayNumber: "2", stay: "Manali" },
        { dayNumber: "3", stay: "Kasol" },
        { dayNumber: "4", stay: "—" }, // Travel back
      ]
    });

    const result = await generateAccommodationPlan("tripId", "2026-06-01", { Twin: 10 });
    
    expect(result.length).toBe(2);
    // First stay: Manali for 2 nights
    expect(result[0].city).toBe("Manali");
    expect(result[0].nights).toBe(2);
    expect(result[0].checkIn).toBe("2026-06-01");
    expect(result[0].checkOut).toBe("2026-06-03"); // 2 nights later

    // Second stay: Kasol for 1 night
    expect(result[1].city).toBe("Kasol");
    expect(result[1].nights).toBe(1);
    expect(result[1].checkIn).toBe("2026-06-03");
    expect(result[1].checkOut).toBe("2026-06-04");
  });

  it("should return empty array if no default itinerary found", async () => {
    prisma.itinerary.findFirst.mockResolvedValue(null);
    const result = await generateAccommodationPlan("tripId", "2026-06-01", {});
    expect(result).toEqual([]);
  });
});
