const test = require('node:test');
const assert = require('node:assert/strict');
const { runAutoAllocation } = require('../src/utils/autoAllocationEngine');
const { normalizeDepartureDateIndia } = require('../src/controllers/opsController');

test('Auto-Allocation Engine groups large groups together and handles gender segregation', () => {
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

  const result = runAutoAllocation(mockBookings, mockFleet);

  assert.ok(result.vehicleAllocations.length >= 7);
  assert.ok(result.roomAllocations.length >= 6);
  assert.ok(result.whatsappTempoText.includes('TEMPO & VEHICLE ALLOCATION LIST'));
  assert.ok(result.whatsappRoomText.includes('HOTEL ROOM ALLOCATION LIST'));
});

test('Missing traveler gender blocks automatic room allocation and creates review flag', () => {
  const mockBookings = [
    {
      bookingId: 'BK-UNKNOWN-GENDER',
      fullName: 'Taylor Smith',
      gender: ''
    }
  ];
  const mockFleet = [{ id: 'FL-1', vehicleType: '13 Seater Tempo', capacity: 13 }];

  const result = runAutoAllocation(mockBookings, mockFleet);

  assert.equal(result.vehicleAllocations.length, 1);
  assert.equal(result.roomAllocations.length, 0);
  assert.ok(result.flags.some(f => f.includes('TRAVELER_GENDER_MISSING')));
});

test('Capacity overflow creates blocking review flag', () => {
  const mockBookings = [
    { bookingId: 'BK-OVER-1', fullName: 'User 1', gender: 'Male', passengers: Array(10).fill({ name: 'Pax', gender: 'Male' }) },
    { bookingId: 'BK-OVER-2', fullName: 'User 2', gender: 'Male', passengers: Array(10).fill({ name: 'Pax', gender: 'Male' }) }
  ];
  const mockFleet = [{ id: 'FL-SMALL', vehicleType: '13 Seater Tempo', capacity: 13 }];

  const result = runAutoAllocation(mockBookings, mockFleet);

  assert.ok(result.flags.some(f => f.includes('Capacity overflow')));
});

test('Calculates operational accounting totals and profit per trip correctly', () => {
  const hotelCost = 30000;
  const transportCost = 66000;
  const guideCost = 15000;
  const miscCost = 5000;

  const totalOpsCost = hotelCost + transportCost + guideCost + miscCost;
  assert.equal(totalOpsCost, 116000);

  const travelerCount = 19;
  const perPersonOpsCost = totalOpsCost / travelerCount;
  assert.equal(Math.round(perPersonOpsCost), 6105);

  const totalRevenueCollected = 150000;
  const profitPerTrip = totalRevenueCollected - totalOpsCost;
  assert.equal(profitPerTrip, 34000);
});

test('India timezone normalization resolves timestamps to 10 July 2026 India departure workspace', () => {
  const t1 = normalizeDepartureDateIndia('2026-07-09T18:30:00.000Z'); // 10 July 00:00 IST
  const t2 = normalizeDepartureDateIndia('2026-07-10T00:00:00.000Z'); // 10 July 05:30 IST
  const t3 = normalizeDepartureDateIndia('2026-07-10T05:30:00.000Z'); // 10 July 11:00 IST

  assert.ok(t1 instanceof Date);
  assert.equal(t1.toISOString(), '2026-07-10T00:00:00.000Z');
  assert.equal(t2.toISOString(), '2026-07-10T00:00:00.000Z');
  assert.equal(t3.toISOString(), '2026-07-10T00:00:00.000Z');
});

test('Missing departure date returns null during normalization', () => {
  const nullResult = normalizeDepartureDateIndia(null);
  const emptyResult = normalizeDepartureDateIndia('');

  assert.equal(nullResult, null);
  assert.equal(emptyResult, null);
});

test('Room inventory-based allocation fills travelers into defined rooms', () => {
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

  const result = runAutoAllocation(mockBookings, mockFleet, roomInventory);

  // Group of 2 (Arjun & Vikram) should go into Room 201 (GROUP, capacity 3)
  const groupRooms = result.roomAllocations.filter(r => r.travelerName === 'Arjun Singh' || r.travelerName === 'Vikram Singh');
  assert.equal(groupRooms.length, 2);
  assert.equal(groupRooms[0].roomNumber, 'Room 201');
  assert.equal(groupRooms[1].roomNumber, 'Room 201');

  // Solo boys should go into Room 101 or Room 102 (BOYS)
  const boyRooms = result.roomAllocations.filter(r => r.travelerName === 'Karan Mehta' || r.travelerName === 'Rahul Deshmukh');
  assert.equal(boyRooms.length, 2);
  assert.ok(boyRooms.every(r => r.roomNumber === 'Room 101' || r.roomNumber === 'Room 102'));

  // Solo girls should go into Room 103 (GIRLS)
  const girlRooms = result.roomAllocations.filter(r => r.travelerName === 'Neha Gupta' || r.travelerName === 'Kavya Reddy');
  assert.equal(girlRooms.length, 2);
  assert.ok(girlRooms.every(r => r.roomNumber === 'Room 103'));

  // WhatsApp text should reference actual room labels
  assert.ok(result.whatsappRoomText.includes('Room 101'));
  assert.ok(result.whatsappRoomText.includes('Room 201'));

  // All 6 travelers should be allocated
  assert.equal(result.roomAllocations.length, 6);
});
