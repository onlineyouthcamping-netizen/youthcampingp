const { generateLogicalRooms } = require("../src/services/roomAllocationEngine");

describe("Room Allocation Engine", () => {
  it("should handle a 2 passenger couple from the same booking", () => {
    const input = {
      allPassengers: [
        { id: "P1", bookingId: "B1", name: "Alice", gender: "Female", roomSharing: "Double Sharing" },
        { id: "P2", bookingId: "B1", name: "Bob", gender: "Male", roomSharing: "Double Sharing" },
      ]
    };
    const result = generateLogicalRooms(input);
    expect(result.summary.breakdown.Twin).toBe(1);
    expect(result.logicalRooms.length).toBe(1);
    expect(result.logicalRooms[0].type).toBe("Twin");
    expect(result.logicalRooms[0].passengers.map(p => p.id)).toEqual(["P1", "P2"]);
  });

  it("should handle a 3-person family from the same booking", () => {
    const input = {
      allPassengers: [
        { id: "P1", bookingId: "B2", name: "Dad", gender: "Male" },
        { id: "P2", bookingId: "B2", name: "Mom", gender: "Female" },
        { id: "P3", bookingId: "B2", name: "Kid", gender: "Male" },
      ]
    };
    const result = generateLogicalRooms(input);
    expect(result.summary.breakdown.Triple).toBe(1);
    expect(result.logicalRooms[0].type).toBe("Triple");
    expect(result.logicalRooms[0].passengers.length).toBe(3);
  });

  it("should group unrelated females together by gender", () => {
    const input = {
      allPassengers: [
        { id: "F1", bookingId: "B_SOLO_1", name: "Female 1", gender: "Female" },
        { id: "F2", bookingId: "B_SOLO_2", name: "Female 2", gender: "Female" },
        { id: "F3", bookingId: "B_SOLO_3", name: "Female 3", gender: "Female" },
        { id: "F4", bookingId: "B_SOLO_4", name: "Female 4", gender: "Female" },
      ]
    };
    const result = generateLogicalRooms(input);
    expect(result.summary.breakdown.Triple).toBe(1);
    expect(result.summary.breakdown.Single).toBe(1);
    expect(result.logicalRooms.length).toBe(2);
  });

  it("should separate unrelated solo males and females into gender-specific rooms", () => {
    const input = {
      allPassengers: [
        { id: "M1", bookingId: "B_SOLO_M1", name: "Male 1", gender: "Male" },
        { id: "M2", bookingId: "B_SOLO_M2", name: "Male 2", gender: "Male" },
        { id: "F1", bookingId: "B_SOLO_F1", name: "Female 1", gender: "Female" },
      ]
    };
    const result = generateLogicalRooms(input);
    expect(result.summary.breakdown.Twin).toBe(1);
    expect(result.summary.breakdown.Single).toBe(1);
    expect(result.logicalRooms.length).toBe(2);
  });
});
