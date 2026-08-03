const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = new PrismaClient();

async function main() {
  const tripId = "SPT-1";
  const departureDate = new Date("2026-08-04T00:00:00.000Z");
  console.log(`🚀 Seeding Ops Transport Fleet & Guide Payments for Trip ${tripId} on ${departureDate.toISOString().substring(0, 10)}`);

  const smddTransport = await prisma.opsVendor.findFirst({ where: { name: "SMDD Transport Fleets" } });
  const dikshuGuide = await prisma.opsVendor.findFirst({ where: { name: { contains: "Dikshu" } } });

  // 1. Seed Transport Fleet
  await prisma.opsTransportFleet.deleteMany({
    where: { tripId, departureDate }
  });

  const transportFleet = await prisma.opsTransportFleet.create({
    data: {
      tenantId: "default",
      tripId,
      departureDate,
      vendorId: smddTransport?.id,
      vehicleType: "17-Seater Tempo Traveller",
      vehicleNumber: "HP-01-AT-1717",
      capacity: 17,
      driverName: "Suresh Rathod",
      driverPhone: "+91 98166 00000",
      confirmationStatus: "CONFIRMED",
      totalAmount: 63000,
      advancePaid: 63000,
      balanceAmount: 0,
      notes: "17 Seater Tempo = 63000"
    }
  });
  console.log(`✅ Created OpsTransportFleet: ${transportFleet.vehicleType} (${transportFleet.driverName}) - ₹${transportFleet.totalAmount}`);

  // 2. Seed Guide Payment
  await prisma.opsGuidePayment.deleteMany({
    where: { tripId, departureDate }
  });

  const guidePayment = await prisma.opsGuidePayment.create({
    data: {
      tenantId: "default",
      tripId,
      departureDate,
      vendorId: dikshuGuide?.id,
      guideName: "Dikshu Sir (Guide)",
      assignmentType: "PRIMARY_GUIDE",
      assignmentStatus: "CONFIRMED",
      daysWorked: 9,
      agreedAmount: 10000,
      advancePaid: 10000,
      balanceAmount: 0,
      paymentStatus: "PAID",
      emergencyContact: "8219733094",
      notes: "(9 days x 1000 = 9000) + (Food = 1000) = 10000"
    }
  });
  console.log(`✅ Created OpsGuidePayment: ${guidePayment.guideName} - ₹${guidePayment.agreedAmount}`);

  console.log("\n🎉 Transport Fleet & Guide Payments successfully seeded!");
}

main()
  .catch(e => console.error("❌ Seed Error:", e))
  .finally(async () => await prisma.$disconnect());
