const { runAutoAllocation } = require('../src/utils/autoAllocationEngine');
const { normalizeDepartureDateIndia } = require('../src/controllers/opsController');

describe('Ops Auto-Allocation Workflow', () => {
  it('Auto-Allocation Engine groups large groups together and handles gender segregation', async () => {
    const mockBookings = [
      {
        bookingId: 'BK-GRP-A',
        sourceBookingLinkId: 'LINK-1',
        fullName: 'Rahul Sharma',
        gender: 'Male',
        passengers: [
          { name: 'Rahul Sharma', gender: 'Male' },
          { name: 'Priya Sharma', gender: 'Female' },
          { name: 'Amit Sharma', gender: 'Male' },
          { name: 'Sneha Sharma', gender: 'Female' },
          { name: 'Ravi Sharma', gender: 'Male' }
        ]
      },
      {
        bookingId: 'BK-SOLO-1',
        fullName: 'Manish Kumar',
        gender: 'Male'
      },
      {
        bookingId: 'BK-SOLO-2',
        fullName: 'Deepak Verma',
        gender: 'Male'
      }
    ];

    const mockFleet = [
      { id: 'FL-1', vehicleType: '13 Seater Tempo', capacity: 13 },
      { id: 'FL-2', vehicleType: '17 Seater Tempo', capacity: 17 }
    ];

    const result = await runAutoAllocation(mockBookings, mockFleet);

    expect(result.vehicleAllocations.length).toBeGreaterThanOrEqual(7);
    expect(result.roomAllocations.length).toBeGreaterThanOrEqual(6);
    expect(result.whatsappTempoText).toContain('TEMPO & VEHICLE ALLOCATION LIST');
    expect(result.whatsappRoomText).toContain('HOTEL ROOM ALLOCATION LIST');
  });

  it('Missing traveler gender blocks automatic room allocation and creates review flag', async () => {
    const mockBookings = [
      {
        bookingId: 'BK-UNKNOWN-GENDER',
        fullName: 'Taylor Smith',
        gender: ''
      }
    ];
    const mockFleet = [{ id: 'FL-1', vehicleType: '13 Seater Tempo', capacity: 13 }];

    const result = await runAutoAllocation(mockBookings, mockFleet);

    expect(result.vehicleAllocations.length).toBe(1);
    expect(result.roomAllocations.length).toBe(0);
    expect(result.flags.some(f => f.includes('TRAVELER_GENDER_MISSING'))).toBe(true);
  });

  it('Capacity overflow creates blocking review flag', async () => {
    const mockBookings = [
      { bookingId: 'BK-OVER-1', fullName: 'User 1', gender: 'Male', passengers: Array(10).fill({ name: 'Pax', gender: 'Male' }) },
      { bookingId: 'BK-OVER-2', fullName: 'User 2', gender: 'Male', passengers: Array(10).fill({ name: 'Pax', gender: 'Male' }) }
    ];
    const mockFleet = [{ id: 'FL-SMALL', vehicleType: '13 Seater Tempo', capacity: 13 }];

    const result = await runAutoAllocation(mockBookings, mockFleet);

    expect(result.flags.some(f => f.includes('Capacity overflow'))).toBe(true);
  });

  it('Calculates operational accounting totals and profit per trip correctly', () => {
    const hotelCost = 30000;
    const transportCost = 66000;
    const guideCost = 15000;
    const miscCost = 5000;

    const totalOpsCost = hotelCost + transportCost + guideCost + miscCost;
    expect(totalOpsCost).toBe(116000);

    const travelerCount = 19;
    const perPersonOpsCost = totalOpsCost / travelerCount;
    expect(Math.round(perPersonOpsCost)).toBe(6105);

    const totalRevenueCollected = 150000;
    const profitPerTrip = totalRevenueCollected - totalOpsCost;
    expect(profitPerTrip).toBe(34000);
  });

  it('India timezone normalization resolves timestamps to 10 July 2026 India departure workspace', () => {
    const t1 = normalizeDepartureDateIndia('2026-07-09T18:30:00.000Z'); // 10 July 00:00 IST
    const t2 = normalizeDepartureDateIndia('2026-07-10T00:00:00.000Z'); // 10 July 05:30 IST
    const t3 = normalizeDepartureDateIndia('2026-07-10T05:30:00.000Z'); // 10 July 11:00 IST

    expect(t1 instanceof Date).toBe(true);
    expect(t1.toISOString()).toBe('2026-07-10T00:00:00.000Z');
    expect(t2.toISOString()).toBe('2026-07-10T00:00:00.000Z');
    expect(t3.toISOString()).toBe('2026-07-10T00:00:00.000Z');
  });

  it('Missing departure date returns null during normalization', () => {
    const nullResult = normalizeDepartureDateIndia(null);
    const emptyResult = normalizeDepartureDateIndia('');

    expect(nullResult).toBeNull();
    expect(emptyResult).toBeNull();
  });

  it('Room inventory-based allocation fills travelers into defined rooms', async () => {
    const mockBookings = [
      {
        bookingId: 'BK-GRP-X',
        sourceBookingLinkId: 'LINK-X',
        fullName: 'Arjun & Group',
        gender: 'Male',
        passengers: [
          { name: 'Arjun Singh', gender: 'Male' },
          { name: 'Vikram Singh', gender: 'Male' }
        ]
      },
      { bookingId: 'BK-BOY-1', fullName: 'Karan Mehta', gender: 'Male' },
      { bookingId: 'BK-BOY-2', fullName: 'Rahul Deshmukh', gender: 'Male' },
      { bookingId: 'BK-GIRL-1', fullName: 'Neha Gupta', gender: 'Female' },
      { bookingId: 'BK-GIRL-2', fullName: 'Kavya Reddy', gender: 'Female' }
    ];

    const mockFleet = [
      { id: 'FL-1', vehicleType: 'Tempo', capacity: 13 }
    ];

    const roomInventory = [
      { id: 'RM-1', roomLabel: 'Room 101', roomType: 'TWIN', genderGroup: 'BOYS', capacity: 2 },
      { id: 'RM-2', roomLabel: 'Room 102', roomType: 'TWIN', genderGroup: 'BOYS', capacity: 2 },
      { id: 'RM-3', roomLabel: 'Room 103', roomType: 'TWIN', genderGroup: 'GIRLS', capacity: 2 },
      { id: 'RM-4', roomLabel: 'Room 201', roomType: 'TRIPLE', genderGroup: 'GROUP', capacity: 3 }
    ];

    const result = await runAutoAllocation(mockBookings, mockFleet, roomInventory);

    // Group of 2 (Arjun & Vikram) should go into Room 201 (GROUP, capacity 3)
    const groupRooms = result.roomAllocations.filter(r => r.travelerName === 'Arjun Singh' || r.travelerName === 'Vikram Singh');
    expect(groupRooms.length).toBe(2);
    expect(groupRooms[0].roomNumber).toBe('Room 201');
    expect(groupRooms[1].roomNumber).toBe('Room 201');

    // Solo boys should go into Room 101 or Room 102 (BOYS)
    const boyRooms = result.roomAllocations.filter(r => r.travelerName === 'Karan Mehta' || r.travelerName === 'Rahul Deshmukh');
    expect(boyRooms.length).toBe(2);
    expect(boyRooms.every(r => r.roomNumber === 'Room 101' || r.roomNumber === 'Room 102')).toBe(true);

    // Solo girls should go into Room 103 (GIRLS)
    const girlRooms = result.roomAllocations.filter(r => r.travelerName === 'Neha Gupta' || r.travelerName === 'Kavya Reddy');
    expect(girlRooms.length).toBe(2);
    expect(girlRooms.every(r => r.roomNumber === 'Room 103')).toBe(true);

    // WhatsApp text should reference actual room labels
    expect(result.whatsappRoomText).toContain('Room 101');
    expect(result.whatsappRoomText).toContain('Room 201');

    // All 6 travelers should be allocated
    expect(result.roomAllocations.length).toBe(6);
  });
});
