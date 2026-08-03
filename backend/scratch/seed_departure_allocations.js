const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = new PrismaClient();

async function main() {
  const departureId = "SPT-1_2026-08-04";
  console.log(`🚀 Linking Vendors for Departure: ${departureId}`);

  // Fetch created vendors
  const mountainVista = await prisma.opsVendor.findFirst({ where: { name: "Mountain Vista" } });
  const mehakResort = await prisma.opsVendor.findFirst({ where: { name: "Mehak Resort" } });
  const appleBlossom = await prisma.opsVendor.findFirst({ where: { name: "Apple Blossom" } });
  const spitiSiddharth = await prisma.opsVendor.findFirst({ where: { name: "Spiti Siddharth" } });
  const chandratalTents = await prisma.opsVendor.findFirst({ where: { name: "Chandratal Luxury Tents" } });
  const manaliGrand = await prisma.opsVendor.findFirst({ where: { name: "Manali Grand Hotel" } });
  const kulluCamps = await prisma.opsVendor.findFirst({ where: { name: "Kullu Stay Camps" } });
  const smddTransport = await prisma.opsVendor.findFirst({ where: { name: "SMDD Transport Fleets" } });
  const dikshuGuide = await prisma.opsVendor.findFirst({ where: { name: { contains: "Dikshu" } } });

  const allocations = [
    {
      departureId,
      vendorId: mountainVista?.id,
      finalBookedRate: 17000,
      numberOfRooms: 5,
      numberOfGuests: 15,
      status: "CONFIRMED",
      confirmationNumber: "CNF-SHM-881",
      notes: "(Double Sharing = 2600 x 5 = 13000) + (Extra persons = 5 x 800 = 4000) = 17000"
    },
    {
      departureId,
      vendorId: mehakResort?.id,
      finalBookedRate: 18400,
      numberOfRooms: 5,
      numberOfGuests: 15,
      status: "CONFIRMED",
      confirmationNumber: "CNF-SNG-442",
      notes: "(Double Sharing = 1400 x 2 = 2800) + (Triple & Quad Sharing = 13 x 1200 = 15600) = 18400"
    },
    {
      departureId,
      vendorId: appleBlossom?.id,
      finalBookedRate: 18000,
      numberOfRooms: 5,
      numberOfGuests: 15,
      status: "CONFIRMED",
      confirmationNumber: "CNF-TBO-109",
      notes: "15 x 1200 = 18000"
    },
    {
      departureId,
      vendorId: spitiSiddharth?.id,
      finalBookedRate: 33000,
      numberOfRooms: 5,
      numberOfGuests: 15,
      status: "CONFIRMED",
      confirmationNumber: "CNF-KZA-903",
      notes: "(15 x 1100 = 16500) x 2 days = 33000"
    },
    {
      departureId,
      vendorId: chandratalTents?.id,
      finalBookedRate: 27750,
      numberOfRooms: 4,
      numberOfGuests: 15,
      status: "CONFIRMED",
      confirmationNumber: "CNF-CND-774",
      notes: "15 x 1850 = 27750"
    },
    {
      departureId,
      vendorId: manaliGrand?.id,
      finalBookedRate: 12600,
      numberOfRooms: 5,
      numberOfGuests: 15,
      status: "CONFIRMED",
      confirmationNumber: "CNF-MNL-331",
      notes: "(Double Sharing = 2 x 1100 = 2200) + (Triple & Quad = 13 x 800 = 10400) = 12600"
    },
    {
      departureId,
      vendorId: kulluCamps?.id,
      finalBookedRate: 2000,
      numberOfRooms: 4,
      numberOfGuests: 15,
      status: "CONFIRMED",
      confirmationNumber: "CNF-KLU-112",
      notes: "4 tents x 500 = 2000"
    },
    {
      departureId,
      vendorId: smddTransport?.id,
      finalBookedRate: 63000,
      numberOfGuests: 15,
      status: "CONFIRMED",
      confirmationNumber: "CNF-TRN-630",
      notes: "17-Seater Tempo Traveller (15th to 23rd Aug) = 63000"
    },
    {
      departureId,
      vendorId: dikshuGuide?.id,
      finalBookedRate: 10000,
      numberOfGuests: 15,
      status: "CONFIRMED",
      confirmationNumber: "CNF-GDE-100",
      notes: "Dikshu Sir (8219733094) - (9 days x 1000 = 9000) + (Food = 1000) = 10000"
    }
  ];

  await prisma.opsDepartureVendorAllocation.deleteMany({ where: { departureId } });

  for (const alloc of allocations) {
    if (alloc.vendorId) {
      await prisma.opsDepartureVendorAllocation.create({ data: alloc });
      console.log(`✅ Allocated Vendor ${alloc.vendorId} to Departure ${departureId}`);
    }
  }

  console.log("🎉 Departure Allocations successfully populated!");
}

main()
  .catch(e => console.error("❌ Allocation Error:", e))
  .finally(async () => await prisma.$disconnect());
