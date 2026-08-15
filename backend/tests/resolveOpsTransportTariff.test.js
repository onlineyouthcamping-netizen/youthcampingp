const {
  mapTripVendorRates,
  mapVehicleRatesFromGroups,
  mapLegacyTransportRates,
  mergeRateMaps,
  matchTariffForVehicle,
  attachTariffsToFleet,
} = require("../src/utils/resolveOpsTransportTariff");

describe("resolveOpsTransportTariff", () => {
  test("trip-scoped transport rate wins over vendor catalog rates", () => {
    const tripRates = mapTripVendorRates(
      [
        {
          vendorId: "ops-v1",
          rates: [
            {
              id: "trip-rate-1",
              rateType: "TRANSPORT",
              vehicleType: "17 Seater Tempo Traveller",
              routeName: "Spiti",
              amount: 50000,
              sellableSeats: 16,
              active: true,
              validFrom: new Date("2026-01-01"),
              validTo: new Date("2026-12-31"),
            },
          ],
        },
      ],
      new Date("2026-08-15"),
    );
    const catalogRates = mapLegacyTransportRates([
      {
        id: "legacy-1",
        vendorId: "ops-v1",
        routeName: "Spiti",
        vehicleType: "17 Seater Tempo Traveller",
        totalVehicleCost: 52000,
      },
    ]);
    const merged = mergeRateMaps(tripRates, catalogRates);
    const match = matchTariffForVehicle(
      {
        vendorId: "ops-v1",
        route: "Spiti",
        vehicleType: "17 Seater Tempo Traveller",
      },
      merged["ops-v1"],
    );
    expect(match).toMatchObject({
      source: "OpsTripVendorRate",
      amount: 50000,
    });
  });

  test("maps OpsVehicleRate fields from vehicleName / advertisedCapacity", () => {
    const byVendor = mapVehicleRatesFromGroups([
      {
        vendorId: "ops-v1",
        routeName: "Spiti Circuit",
        vehicleRates: [
          {
            id: "rate-1",
            vehicleNameSnapshot: "20 Seater Tempo Traveller",
            sellableSeats: 17,
            totalVehicleAmount: 80000,
            vehicle: {
              vehicleName: "20 Seater Tempo Traveller",
              advertisedCapacity: 20,
              sellableSeats: 17,
            },
          },
        ],
      },
    ]);

    expect(byVendor["ops-v1"]).toHaveLength(1);
    expect(byVendor["ops-v1"][0]).toMatchObject({
      source: "OpsVehicleRate",
      rateId: "rate-1",
      routeName: "Spiti Circuit",
      vehicleType: "20 Seater Tempo Traveller",
      capacity: 20,
      sellableSeats: 17,
      amount: 80000,
    });
  });

  test("matches fleet row and leaves totalAmount snapshot untouched", () => {
    const ratesByVendor = mergeRateMaps(
      mapVehicleRatesFromGroups([
        {
          vendorId: "ops-v1",
          routeName: "Spiti",
          vehicleRates: [
            {
              id: "rate-1",
              vehicleNameSnapshot: "17 Seater Tempo Traveller",
              sellableSeats: 16,
              totalVehicleAmount: 52000,
              vehicle: { vehicleName: "17 Seater Tempo Traveller", advertisedCapacity: 17 },
            },
          ],
        },
      ]),
      mapLegacyTransportRates([
        {
          id: "legacy-1",
          vendorId: "ops-v1",
          routeName: "Spiti",
          vehicleType: "17 Seater Tempo Traveller",
          advertisedCapacity: 17,
          sellableSeats: 16,
          totalVehicleCost: 48000,
        },
      ]),
    );

    const fleet = [
      {
        id: "fleet-1",
        vendorId: "ops-v1",
        vehicleType: "17 Seater Tempo Traveller",
        route: "Spiti",
        totalAmount: 55000,
      },
    ];

    const resolved = attachTariffsToFleet(fleet, ratesByVendor);
    expect(resolved[0].totalAmount).toBe(55000);
    expect(resolved[0].tariff).toMatchObject({
      amount: 52000,
      source: "OpsVehicleRate",
      rateId: "rate-1",
    });
  });

  test("falls back to OpsTransportRate when no OpsVehicleRate matches", () => {
    const rates = mapLegacyTransportRates([
      {
        id: "legacy-1",
        vendorId: "ops-v2",
        routeName: "Manali",
        vehicleType: "Innova",
        advertisedCapacity: 7,
        sellableSeats: 5,
        totalVehicleCost: 40000,
      },
    ])["ops-v2"];

    const match = matchTariffForVehicle(
      { vendorId: "ops-v2", vehicleType: "Innova", route: "Manali" },
      rates,
    );
    expect(match).toMatchObject({
      source: "OpsTransportRate",
      amount: 40000,
      rateId: "legacy-1",
    });
  });

  test("returns null tariff when no rates match", () => {
    const resolved = attachTariffsToFleet(
      [{ id: "f1", vendorId: "ops-x", vehicleType: "Bus", totalAmount: 10 }],
      {},
    );
    expect(resolved[0].tariff).toBeNull();
    expect(resolved[0].totalAmount).toBe(10);
  });
});
