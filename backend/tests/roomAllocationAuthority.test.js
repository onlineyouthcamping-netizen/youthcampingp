/**
 * Unit helpers for room-allocation authority rules.
 */
const {
  findConfirmedRoomFields,
  mergePassengerPreferences,
  mirrorConfirmedRooms,
} = require("../src/utils/roomAllocationAuthority");

describe("roomAllocationAuthority", () => {
  test("detects confirmed room fields on booking update payloads", () => {
    expect(
      findConfirmedRoomFields({
        roomAllocation: "R1",
        passengers: {
          details: {
            personsRoomDetails: {
              Alice: { roomNo: "201", roomType: "Double" },
            },
          },
        },
      }),
    ).toEqual(
      expect.arrayContaining([
        "roomAllocation",
        "passengers.details.personsRoomDetails.Alice.roomNo",
      ]),
    );
  });

  test("merges preference fields without wiping unrelated passenger JSON", () => {
    const merged = mergePassengerPreferences(
      {
        details: {
          trainClass: "3A",
          personsRoomDetails: {
            Alice: { roomType: "Double", coupleWith: "Bob", pickup: "Station" },
          },
        },
        persons: [{ name: "Alice" }],
      },
      {
        details: {
          personsRoomDetails: {
            Alice: { roomType: "Triple", roomNo: "SHOULD_STRIP" },
          },
        },
      },
    );

    expect(merged.details.trainClass).toBe("3A");
    expect(merged.details.personsRoomDetails.Alice).toEqual({
      roomType: "Triple",
      coupleWith: "Bob",
      pickup: "Station",
    });
    expect(merged.details.personsRoomDetails.Alice.roomNo).toBeUndefined();
    expect(merged.persons).toEqual([{ name: "Alice" }]);
  });

  test("mirrors confirmed Ops rooms into booking JSON display cache", () => {
    const mirrored = mirrorConfirmedRooms(
      {
        details: {
          trainClass: "SL",
          personsRoomDetails: { Alice: { roomType: "Double" } },
        },
        persons: [{ name: "Alice" }],
      },
      [{ travelerName: "Alice", roomNumber: "301" }],
    );

    expect(mirrored.details.trainClass).toBe("SL");
    expect(mirrored.details.personsRoomDetails.Alice).toEqual({
      roomType: "Double",
      roomNo: "301",
    });
  });
});
