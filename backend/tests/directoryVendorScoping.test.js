jest.mock("../src/lib/prisma", () => ({
  prisma: {
    opsVendor: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

jest.mock("../src/utils/vendorPricingEngine", () => ({}));

const { prisma } = require("../src/lib/prisma");
const {
  getDirectoryVendors,
} = require("../src/controllers/directoryVendorController");

describe("trip-scoped vendor directory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.opsVendor.findMany.mockResolvedValue([]);
    prisma.opsVendor.count.mockResolvedValue(0);
    prisma.opsVendor.groupBy.mockResolvedValue([]);
  });

  test("filters OpsVendor through OpsTripVendor when tripId is provided", async () => {
    const req = {
      query: { tripId: "trip-1", type: "TRANSPORT", limit: "100" },
      user: { tenantId: "default" },
    };
    const res = {
      json: jest.fn(),
    };

    await getDirectoryVendors(req, res, jest.fn());

    const query = prisma.opsVendor.findMany.mock.calls[0][0];
    expect(query.where.AND).toEqual(
      expect.arrayContaining([
        { tenantId: "default" },
        { tripVendors: { some: { tripId: "trip-1" } } },
        { type: "TRANSPORT" },
        { isActive: true },
      ]),
    );
    expect(query.include.transportRates).toBe(true);
    expect(query.include.routePricingGroups.include.vehicleRates.include.vehicle).toBe(
      true,
    );
  });

  test("does not add trip relation filter for explicit GLOBAL scope", async () => {
    const req = {
      query: { tripId: "GLOBAL", type: "TRANSPORT" },
      user: { tenantId: "default" },
    };
    const res = { json: jest.fn() };

    await getDirectoryVendors(req, res, jest.fn());

    const serializedWhere = JSON.stringify(
      prisma.opsVendor.findMany.mock.calls[0][0].where,
    );
    expect(serializedWhere).not.toContain("tripVendors");
  });
});
