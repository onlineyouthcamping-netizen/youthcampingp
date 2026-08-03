const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = new PrismaClient();

async function main() {
  const tripId = "SPT-1";
  const departureDate = new Date("2026-08-04T00:00:00.000Z");
  console.log(`🚀 Populating Ops Hotel Bookings for Trip ${tripId} on ${departureDate.toISOString().substring(0, 10)}`);

  // Fetch vendors
  const mountainVista = await prisma.opsVendor.findFirst({ where: { name: "Mountain Vista" } });
  const mehakResort = await prisma.opsVendor.findFirst({ where: { name: "Mehak Resort" } });
  const appleBlossom = await prisma.opsVendor.findFirst({ where: { name: "Apple Blossom" } });
  const spitiSiddharth = await prisma.opsVendor.findFirst({ where: { name: "Spiti Siddharth" } });
  const chandratalTents = await prisma.opsVendor.findFirst({ where: { name: "Chandratal Luxury Tents" } });
  const manaliGrand = await prisma.opsVendor.findFirst({ where: { name: "Manali Grand Hotel" } });
  const kulluCamps = await prisma.opsVendor.findFirst({ where: { name: "Kullu Stay Camps" } });

  const hotelsData = [
    {
      tripId,
      departureDate,
      vendorId: mountainVista?.id,
      hotelName: "Mountain Vista",
      location: "Shimla",
      confirmed: "CONFIRMED",
      totalAmount: 17000,
      advancePaid: 17000,
      balanceAmount: 0,
      numberOfRooms: 5,
      notes: "(Double Sharing = 2600 x 5 = 13000) + (Extra persons = 5 x 800 = 4000) = 17000"
    },
    {
      tripId,
      departureDate,
      vendorId: mehakResort?.id,
      hotelName: "Mehak Resort",
      location: "Sangla",
      confirmed: "CONFIRMED",
      totalAmount: 18400,
      advancePaid: 18400,
      balanceAmount: 0,
      numberOfRooms: 5,
      notes: "(Double Sharing = 1400 x 2 = 2800) + (Triple & Quad Sharing = 13 x 1200 = 15600) = 18400"
    },
    {
      tripId,
      departureDate,
      vendorId: appleBlossom?.id,
      hotelName: "Apple Blossom",
      location: "Tabo",
      confirmed: "CONFIRMED",
      totalAmount: 18000,
      advancePaid: 18000,
      balanceAmount: 0,
      numberOfRooms: 5,
      notes: "15 x 1200 = 18000"
    },
    {
      tripId,
      departureDate,
      vendorId: spitiSiddharth?.id,
      hotelName: "Spiti Siddharth",
      location: "Kaza",
      confirmed: "CONFIRMED",
      totalAmount: 33000,
      advancePaid: 33000,
      balanceAmount: 0,
      numberOfRooms: 5,
      notes: "(15 x 1100 = 16500) x 2 days = 33000"
    },
    {
      tripId,
      departureDate,
      vendorId: chandratalTents?.id,
      hotelName: "Chandratal Luxury Tents",
      location: "Chandratal",
      confirmed: "CONFIRMED",
      totalAmount: 27750,
      advancePaid: 27750,
      balanceAmount: 0,
      numberOfRooms: 4,
      notes: "15 x 1850 = 27750"
    },
    {
      tripId,
      departureDate,
      vendorId: manaliGrand?.id,
      hotelName: "Manali Grand Hotel",
      location: "Manali",
      confirmed: "CONFIRMED",
      totalAmount: 12600,
      advancePaid: 12600,
      balanceAmount: 0,
      numberOfRooms: 5,
      notes: "(Double Sharing = 2 x 1100 = 2200) + (Triple & Quad = 13 x 800 = 10400) = 12600"
    },
    {
      tripId,
      departureDate,
      vendorId: kulluCamps?.id,
      hotelName: "Kullu Stay Camps",
      location: "Kullu",
      confirmed: "CONFIRMED",
      totalAmount: 2000,
      advancePaid: 2000,
      balanceAmount: 0,
      numberOfRooms: 4,
      notes: "4 tents x 500 = 2000"
    }
  ];

  await prisma.opsHotelBooking.deleteMany({
    where: { tripId, departureDate }
  });

  for (const h of hotelsData) {
    await prisma.opsHotelBooking.create({ data: h });
    console.log(`✅ Created OpsHotelBooking: ${h.hotelName} (${h.location}) - ₹${h.totalAmount}`);
  }

  console.log("\n🎉 All 7 Hotel Bookings seeded into Departure Workspace successfully!");
}

main()
  .catch(e => console.error("❌ Error:", e))
  .finally(async () => await prisma.$disconnect());
