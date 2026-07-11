const { prisma } = require('../src/lib/prisma');

const bookingsData = [
  {
    name: "Jeel",
    age: 23,
    gender: "Male",
    phone: "8469449663",
    advancePaid: 5000,
    remainingAmount: 18000,
    paymentDate: new Date("2026-06-12"),
    upiReference: "UPI DEVARSH",
    persons: [
      { name: "Jeel", age: 23, gender: "Male" }
    ]
  },
  {
    name: "Vatsal",
    age: 22,
    gender: "Male",
    phone: "8140106004",
    advancePaid: 10000,
    remainingAmount: 36000,
    paymentDate: new Date("2026-06-12"),
    upiReference: "UPI DEVARSH",
    persons: [
      { name: "Vatsal", age: 22, gender: "Male" },
      { name: "Shubham", age: 23, gender: "Male" }
    ]
  },
  {
    name: "Diya",
    age: 19,
    gender: "Female",
    phone: "9054367893",
    advancePaid: 5000,
    remainingAmount: 18000,
    paymentDate: new Date("2026-06-13"),
    upiReference: "UPI DEVARSH",
    persons: [
      { name: "Diya", age: 19, gender: "Female" }
    ]
  },
  {
    name: "Yashvi",
    age: 19,
    gender: "Female",
    phone: "9428018748",
    advancePaid: 5000,
    remainingAmount: 18000,
    paymentDate: new Date("2026-06-12"),
    upiReference: "UPI",
    persons: [
      { name: "Yashvi", age: 19, gender: "Female" }
    ]
  },
  {
    name: "Janki",
    age: 21,
    gender: "Female",
    phone: "9054057893",
    advancePaid: 5000,
    remainingAmount: 18000,
    paymentDate: new Date("2026-06-13"),
    upiReference: "UPI DEVARSH",
    persons: [
      { name: "Janki", age: 21, gender: "Female" }
    ]
  },
  {
    name: "Nishit",
    age: 24,
    gender: "Male",
    phone: "9998507722",
    advancePaid: 5000,
    remainingAmount: 24000,
    paymentDate: new Date("2026-06-18"),
    upiReference: "UPI DEVARSH",
    notes: "1 ROOM",
    persons: [
      { name: "Nishit", age: 24, gender: "Male" }
    ]
  },
  {
    name: "Manasvi",
    age: 27,
    gender: "Female",
    phone: "8238101523",
    advancePaid: 5000,
    remainingAmount: 18750,
    paymentDate: new Date("2026-05-22"),
    upiReference: "UPI",
    persons: [
      { name: "Manasvi", age: 27, gender: "Female" }
    ]
  },
  {
    name: "Tanvi",
    age: 21,
    gender: "Female",
    phone: "9327606091",
    advancePaid: 5000,
    remainingAmount: 18500,
    paymentDate: new Date("2026-05-22"),
    upiReference: "CHAKABHAI",
    persons: [
      { name: "Tanvi", age: 21, gender: "Female" }
    ]
  },
  {
    name: "Rajveer",
    age: 19,
    gender: "Male",
    phone: "7861982461",
    advancePaid: 5000,
    remainingAmount: 18500,
    paymentDate: new Date("2026-06-29"),
    upiReference: "CHAKABHAI",
    persons: [
      { name: "Rajveer", age: 19, gender: "Male" }
    ]
  },
  {
    name: "Manthan",
    age: 19,
    gender: "Male",
    phone: "9023145489",
    advancePaid: 20000,
    remainingAmount: 0,
    paymentDate: new Date("2026-07-01"),
    upiReference: "CHAKABHAI",
    persons: [
      { name: "Manthan", age: 19, gender: "Male" }
    ]
  },
  {
    name: "Darshana",
    age: 22,
    gender: "Female",
    phone: "8401975612",
    advancePaid: 5250,
    remainingAmount: 18500,
    paymentDate: new Date("2026-07-03"),
    upiReference: "YAC",
    persons: [
      { name: "Darshana", age: 22, gender: "Female" }
    ]
  },
  {
    name: "Jatinsinh",
    age: 45,
    gender: "Male",
    phone: "9825731498",
    advancePaid: 5250,
    remainingAmount: 18500,
    paymentDate: new Date("2026-07-03"),
    upiReference: "YAC",
    persons: [
      { name: "Jatinsinh", age: 45, gender: "Male" }
    ]
  },
  {
    name: "Rutvik",
    age: 23,
    gender: "Male",
    phone: "6354482523",
    advancePaid: 5250,
    remainingAmount: 18500,
    paymentDate: new Date("2026-07-05"),
    upiReference: "YAC",
    persons: [
      { name: "Rutvik", age: 23, gender: "Male" }
    ]
  },
  {
    name: "Foram",
    age: 23,
    gender: "Female",
    phone: "9913396791",
    advancePaid: 5250,
    remainingAmount: 18500,
    paymentDate: new Date("2026-07-06"),
    upiReference: "YAC",
    persons: [
      { name: "Foram", age: 23, gender: "Female" }
    ]
  }
];

async function main() {
  const trip = await prisma.trip.findUnique({
    where: { id: "SPT-1" }
  });

  if (!trip) {
    console.error("Trip SPT-1 not found!");
    return;
  }

  console.log("Trip Spiti Valley Road Trip found. Creating bookings...");

  for (const data of bookingsData) {
    const bookingId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
    const totalAmount = data.advancePaid + data.remainingAmount;

    await prisma.booking.create({
      data: {
        tenantId: "default",
        bookingId,
        tripId: "SPT-1",
        tripName: trip.title,
        status: "confirmed",
        name: data.name,
        fullName: data.name,
        phone: data.phone,
        mobile: data.phone,
        email: `${data.name.toLowerCase()}@test.com`,
        age: data.age,
        gender: data.gender,
        numberOfTravelers: data.persons.length,
        baseAmount: totalAmount,
        totalAmount,
        amount: totalAmount,
        advancePaid: data.advancePaid,
        remainingAmount: data.remainingAmount,
        paymentMode: "upi",
        paymentStatus: data.remainingAmount === 0 ? "Fully Paid" : "Partially Paid",
        payment_status: data.remainingAmount === 0 ? "paid" : "partially_paid",
        upi_reference: data.upiReference,
        adminNotes: data.notes || null,
        departureDate: new Date("2026-07-02"), // As per trip date in schema for SPT-1
        passengers: {
          details: {
            gstAmount: 0
          },
          persons: data.persons
        },
        trainTicketRequired: true,
        trainTicketStatus: "CONFIRMED"
      }
    });
    console.log(`Created booking ${bookingId} for ${data.name}`);
  }

  console.log("All bookings successfully added to Spiti Valley Road Trip!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
