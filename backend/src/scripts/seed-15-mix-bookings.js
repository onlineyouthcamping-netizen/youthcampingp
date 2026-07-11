const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tripId = "MKA-1";
  const departureDate = new Date("2026-07-11T00:00:00.000Z");
  const tenantId = "default";
  const adminId = "admin_master_prod";

  console.log(`🚀 Seeding 15 mixed test bookings for trip ${tripId} on departure date 2026-07-11...`);

  // Clean up existing bookings for this trip & departure date
  await prisma.accountingEntry.deleteMany({
    where: { booking: { tripId, departureDate } }
  });
  await prisma.booking.deleteMany({
    where: { tripId, departureDate }
  });

  const testData = [
    { name: "Aarav Sharma", gender: "MALE", age: 24, phone: "9876543201", status: "confirmed", paymentStatus: "Paid", total: 12000, paid: 12000, travelers: 1 },
    { name: "Priya Patel", gender: "FEMALE", age: 22, phone: "9876543202", status: "confirmed", paymentStatus: "Paid", total: 12000, paid: 12000, travelers: 1 },
    { name: "Rohan & Ananya Verma", gender: "MALE", age: 26, phone: "9876543203", status: "confirmed", paymentStatus: "Paid", total: 24000, paid: 24000, travelers: 2, extraPerson: { name: "Ananya Verma", gender: "FEMALE", age: 25 } },
    { name: "Vikram Singh", gender: "MALE", age: 28, phone: "9876543204", status: "confirmed", paymentStatus: "Partial", total: 12000, paid: 5000, travelers: 1 },
    { name: "Neha Gupta", gender: "FEMALE", age: 23, phone: "9876543205", status: "confirmed", paymentStatus: "Partial", total: 12000, paid: 6000, travelers: 1 },
    { name: "Siddharth Malhotra", gender: "MALE", age: 29, phone: "9876543206", status: "confirmed", paymentStatus: "Paid", total: 12000, paid: 12000, travelers: 1 },
    { name: "Kavya Reddy", gender: "FEMALE", age: 21, phone: "9876543207", status: "confirmed", paymentStatus: "Pending", total: 12000, paid: 0, travelers: 1 },
    { name: "Unknown Traveler Alert Test", gender: "UNKNOWN", age: 25, phone: "9876543208", status: "confirmed", paymentStatus: "Paid", total: 12000, paid: 12000, travelers: 1 },
    { name: "Amit Joshi", gender: "MALE", age: 27, phone: "9876543209", status: "confirmed", paymentStatus: "Paid", total: 12000, paid: 12000, travelers: 1 },
    { name: "Pooja Shah", gender: "FEMALE", age: 24, phone: "9876543210", status: "confirmed", paymentStatus: "Paid", total: 12000, paid: 12000, travelers: 1 },
    { name: "Rahul Deshmukh", gender: "MALE", age: 30, phone: "9876543211", status: "confirmed", paymentStatus: "Partial", total: 12000, paid: 4000, travelers: 1 },
    { name: "Sneha Rao", gender: "FEMALE", age: 22, phone: "9876543212", status: "confirmed", paymentStatus: "Paid", total: 12000, paid: 12000, travelers: 1 },
    { name: "Karan Mehta", gender: "MALE", age: 25, phone: "9876543213", status: "confirmed", paymentStatus: "Paid", total: 12000, paid: 12000, travelers: 1 },
    { name: "Divya Nair", gender: "FEMALE", age: 26, phone: "9876543214", status: "confirmed", paymentStatus: "Paid", total: 12000, paid: 12000, travelers: 1 },
    { name: "Arjun & Group", gender: "MALE", age: 24, phone: "9876543215", status: "confirmed", paymentStatus: "Paid", total: 36000, paid: 36000, travelers: 3, extraPerson: [{ name: "Varun Roy", gender: "MALE", age: 24 }, { name: "Simran Kaur", gender: "FEMALE", age: 23 }] }
  ];

  for (let i = 0; i < testData.length; i++) {
    const item = testData[i];
    const bookingId = `BK-MKA-${101 + i}`;

    const personsList = [
      { name: item.name, gender: item.gender, age: item.age, phone: item.phone }
    ];

    if (item.extraPerson) {
      if (Array.isArray(item.extraPerson)) {
        personsList.push(...item.extraPerson);
      } else {
        personsList.push(item.extraPerson);
      }
    }

    const booking = await prisma.booking.create({
      data: {
        tenantId,
        bookingId,
        tripId,
        tripName: "Manali Kasol Amritsar Backpacking Trip",
        status: item.status,
        name: item.name,
        fullName: item.name,
        phone: item.phone,
        email: `traveler${i + 1}@example.com`,
        age: item.age,
        gender: item.gender,
        numberOfTravelers: item.travelers,
        baseAmount: item.total,
        totalAmount: item.total,
        amount: item.total,
        advancePaid: item.paid,
        remainingAmount: item.total - item.paid,
        paymentStatus: item.paymentStatus,
        departureDate,
        pickupCity: "Ahmedabad",
        salesAdminId: adminId,
        passengers: {
          persons: personsList,
          details: { accommodationType: "Quad Sharing" }
        }
      }
    });

    // Accounting entries for payments
    if (item.paid > 0) {
      await prisma.accountingEntry.create({
        data: {
          tenantId,
          bookingId: booking.bookingId,
          amount: item.paid,
          paymentMode: "UPI",
          status: "APPROVED",
          salespersonId: adminId,
          notes: `Seeded test payment for ${booking.bookingId}`
        }
      });
    }

    console.log(`  [${i + 1}/15] Seeded ${bookingId}: ${item.name} (${item.travelers} pax, ${item.paymentStatus})`);
  }

  console.log(`\n🎉 Successfully seeded 15 mixed test bookings for trip MKA-1 on 2026-07-11!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
