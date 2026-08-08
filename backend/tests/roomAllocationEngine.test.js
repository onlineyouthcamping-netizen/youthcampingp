const { generateLogicalRooms } = require("../src/services/roomAllocationEngine");

describe("Room Allocation Engine", () => {
  it("should handle a 2 passenger couple", () => {
    const input = {
      summary: { total: 2 },
      groups: {
        couples: [
          { bookingId: "B1", passengerIds: ["P1", "P2"] }
        ],
        families: [], male: [], female: []
      }
    };
    const result = generateLogicalRooms(input);
    expect(result.allocation.Twin).toBe(1);
    expect(result.logicalRooms.length).toBe(1);
    expect(result.logicalRooms[0].type).toBe("Twin");
    expect(result.logicalRooms[0].passengers).toEqual(["P1", "P2"]);
    expect(result.readiness.status).toBe("Ready");
  });

  it("should handle a 3-person family", () => {
    const input = {
      groups: {
        couples: [],
        families: [
          { bookingId: "B2", passengerIds: ["P1", "P2", "P3"] }
        ],
        male: [], female: []
      }
    };
    const result = generateLogicalRooms(input);
    expect(result.allocation.Triple).toBe(1);
    expect(result.logicalRooms[0].type).toBe("Triple");
    expect(result.logicalRooms[0].passengers.length).toBe(3);
  });

  it("should handle a 5-person family requiring manual split", () => {
    const input = {
      groups: {
        couples: [],
        families: [
          { bookingId: "B3", passengerIds: ["P1", "P2", "P3", "P4", "P5"] }
        ],
        male: [], female: []
      }
    };
    const result = generateLogicalRooms(input);
    expect(result.allocation.Quad).toBe(1);
    expect(result.allocation.ExtraBed).toBe(1);
    expect(result.logicalRooms.length).toBe(2);
    expect(result.logicalRooms[0].type).toBe("Quad");
    expect(result.logicalRooms[1].type).toBe("Single");
    expect(result.readiness.status).toBe("Manual Review");
    expect(result.readiness.exceptions[0]).toContain("manual split");
  });

  it("should group remaining females into triples and handle odd numbers", () => {
    const input = {
      groups: {
        couples: [], families: [], male: [],
        // 4 females
        female: ["F1", "F2", "F3", "F4"]
      }
    };
    const result = generateLogicalRooms(input);
    expect(result.allocation.Triple).toBe(1);
    expect(result.allocation.Single).toBe(1);
    expect(result.logicalRooms.length).toBe(2);
    expect(result.readiness.status).toBe("Manual Review");
    expect(result.readiness.exceptions[0]).toContain("Only one female passenger remaining");
  });

  it("should ignore passengers already assigned as couples when grouping by gender", () => {
    const input = {
      groups: {
        couples: [
          { bookingId: "B1", passengerIds: ["M1", "F1"] }
        ],
        families: [],
        male: ["M1", "M2"],
        female: ["F1", "F2", "F3"]
      }
    };
    const result = generateLogicalRooms(input);
    // M1 and F1 are a couple.
    // Remaining male: M2 (1 pax -> single)
    // Remaining female: F2, F3 (2 pax -> twin)
    expect(result.allocation.Twin).toBe(2); // 1 couple twin, 1 female twin
    expect(result.allocation.Single).toBe(1); // 1 male single
    
    const singleRooms = result.logicalRooms.filter(r => r.type === "Single");
    expect(singleRooms[0].passengers).toEqual(["M2"]);
    
    expect(result.readiness.status).toBe("Manual Review");
  });

  it("should allocate rooms for guides and drivers", () => {
    const input = {
      summary: { guides: 3, drivers: 2 },
      groups: {}
    };
    const result = generateLogicalRooms(input);
    // Guides: 3 -> 1 Twin (2 pax), 1 Single (1 pax)
    // Drivers: 2 -> 2 DriverRoom
    expect(result.allocation.Twin).toBe(1);
    expect(result.allocation.Single).toBe(1);
    expect(result.allocation.DriverRoom).toBe(2);
    
    const guideTwins = result.logicalRooms.filter(r => r.type === "Twin" && r.reason === "Guides");
    expect(guideTwins.length).toBe(1);
  });
});
