const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Seeding Demo Departure: 04th Aug, 2026 Summer Spiti Valley (15 Pax)");

  // 1. Create/Upsert Vendors from Excel Screenshots
  const vendorsData = [
    {
      vendorCode: "VND-SPI-SHM",
      name: "Mountain Vista",
      type: "HOTEL",
      accommodationType: "Hotel",
      city: "Shimla",
      location: "Shimla",
      state: "Himachal Pradesh",
      contactPerson: "Rajesh Kumar",
      phone: "+91 98160 11111",
      starRating: 4,
      mealPlans: "EP, CP, MAP",
      isPreferred: true,
      notes: "(Double Sharing = 2600 x 5 = 13000) + (Extra persons = 5 x 800 = 4000) = 17000"
    },
    {
      vendorCode: "VND-SPI-SNG",
      name: "Mehak Resort",
      type: "HOTEL",
      accommodationType: "Resort",
      city: "Sangla",
      location: "Sangla",
      state: "Himachal Pradesh",
      contactPerson: "Sanjeev Thakur",
      phone: "+91 98160 22222",
      starRating: 4,
      mealPlans: "EP, CP, MAP",
      isPreferred: true,
      notes: "(Double Sharing = 1400 x 2 = 2800) + (Triple & Quad Sharing = 13 x 1200 = 15600) = 18400"
    },
    {
      vendorCode: "VND-SPI-TBO",
      name: "Apple Blossom",
      type: "HOTEL",
      accommodationType: "Hotel",
      city: "Tabo",
      location: "Tabo",
      state: "Himachal Pradesh",
      contactPerson: "Tenzin Norbu",
      phone: "+91 98160 33333",
      starRating: 3,
      mealPlans: "EP, CP, MAP",
      isPreferred: true,
      notes: "15 x 1200 = 18000"
    },
    {
      vendorCode: "VND-SPI-KZA",
      name: "Spiti Siddharth",
      type: "HOTEL",
      accommodationType: "Hotel",
      city: "Kaza",
      location: "Kaza",
      state: "Himachal Pradesh",
      contactPerson: "Chhering Dorje",
      phone: "+91 98160 44444",
      starRating: 4,
      mealPlans: "EP, CP, MAP",
      isPreferred: true,
      notes: "(15 x 1100 = 16500) x 2 days = 33000"
    },
    {
      vendorCode: "VND-SPI-CND",
      name: "Chandratal Luxury Tents",
      type: "HOTEL",
      accommodationType: "Camp",
      city: "Chandratal",
      location: "Chandratal",
      state: "Himachal Pradesh",
      contactPerson: "Stanzin Bodh",
      phone: "+91 98160 55555",
      starRating: 4,
      mealPlans: "EP, CP, MAP",
      isPreferred: true,
      notes: "15 x 1850 = 27750"
    },
    {
      vendorCode: "VND-SPI-MNL",
      name: "Manali Grand Hotel",
      type: "HOTEL",
      accommodationType: "Hotel",
      city: "Manali",
      location: "Manali",
      state: "Himachal Pradesh",
      contactPerson: "Vikas Sharma",
      phone: "+91 98160 66666",
      starRating: 4,
      mealPlans: "EP, CP, MAP",
      isPreferred: true,
      notes: "(Double Sharing = 2 x 1100 = 2200) + (Triple & Quad = 13 x 800 = 10400) = 12600"
    },
    {
      vendorCode: "VND-SPI-KLU",
      name: "Kullu Stay Camps",
      type: "HOTEL",
      accommodationType: "Camp",
      city: "Kullu",
      location: "Kullu",
      state: "Himachal Pradesh",
      contactPerson: "Sunil Verma",
      phone: "+91 98160 77777",
      starRating: 3,
      mealPlans: "EP, CP",
      isPreferred: false,
      notes: "4 tents x 500 = 2000"
    },
    {
      vendorCode: "VND-SPI-TRN",
      name: "SMDD Transport Fleets",
      type: "TRANSPORT",
      city: "Chandigarh / Delhi",
      location: "Chandigarh",
      state: "Punjab",
      contactPerson: "Suresh Rathod",
      phone: "+91 98166 00000",
      isPreferred: true,
      notes: "17-Seater Tempo Traveller | 17 Seater Tempo = 63000"
    },
    {
      vendorCode: "VND-SPI-GDE",
      name: "Dikshu Sir (Guide)",
      type: "GUIDE",
      city: "Shimla / Manali",
      location: "Shimla",
      state: "Himachal Pradesh",
      contactPerson: "Dikshu bhai",
      phone: "8219733094",
      isPreferred: true,
      notes: "Mountain Expedition Leader | (9 days x 1000 = 9000) + (Food = 1000 if he charges any) = 10000"
    }
  ];

  for (const vData of vendorsData) {
    let vendor = await prisma.opsVendor.findFirst({
      where: {
        OR: [
          { vendorCode: vData.vendorCode },
          { name: vData.name }
        ]
      }
    });
    if (!vendor) {
      vendor = await prisma.opsVendor.create({
        data: { tenantId: "default", ...vData }
      });
      console.log(`✅ Created Vendor: ${vendor.name} (${vendor.vendorCode})`);
    } else {
      const { vendorCode, ...updateFields } = vData;
      vendor = await prisma.opsVendor.update({
        where: { id: vendor.id },
        data: updateFields
      });
      console.log(`🔄 Updated Vendor: ${vendor.name} (${vendor.vendorCode})`);
    }
  }

  // 2. Create/Update Demo Booking: 04th Aug 2026 Summer Spiti Valley (15 Pax)
  const bookingId = "BK-SPI-AUG04";
  let booking = await prisma.booking.findFirst({
    where: { bookingId }
  });

  const bookingPayload = {
    tenantId: "default",
    bookingId,
    tripId: "SPT-1",
    tripName: "Summer Spiti Valley (15 Persons)",
    status: "confirmed",
    name: "Dikshu Sir Group",
    fullName: "Dikshu Sir & 14 Pax Group",
    phone: "8219733094",
    mobile: "8219733094",
    email: "spitigroup@youthcamping.in",
    age: 26,
    gender: "Group",
    numberOfTravelers: 15,
    baseAmount: 186750,
    totalAmount: 186750,
    amount: 186750,
    advancePaid: 186750,
    remainingAmount: 0,
    paymentMode: "BANK_TRANSFER",
    paymentStatus: "Paid",
    payment_status: "paid",
    adminNotes: "04th Aug, 2026 Summer Spiti Valley Group (15 Persons)",
    departureDate: new Date("2026-08-04T00:00:00.000Z"),
    passengers: {
      details: { roomType: "5 Rooms / 4 Tents", paxCount: 15 },
      persons: [
        { name: "Leader Dikshu Sir", phone: "8219733094", roomSharing: "Double" },
        { name: "Traveler 2", roomSharing: "Double" },
        { name: "Traveler 3", roomSharing: "Double" },
        { name: "Traveler 4", roomSharing: "Double" },
        { name: "Traveler 5", roomSharing: "Double" },
        { name: "Traveler 6", roomSharing: "Triple" },
        { name: "Traveler 7", roomSharing: "Triple" },
        { name: "Traveler 8", roomSharing: "Triple" },
        { name: "Traveler 9", roomSharing: "Triple" },
        { name: "Traveler 10", roomSharing: "Triple" },
        { name: "Traveler 11", roomSharing: "Quad" },
        { name: "Traveler 12", roomSharing: "Quad" },
        { name: "Traveler 13", roomSharing: "Quad" },
        { name: "Traveler 14", roomSharing: "Quad" },
        { name: "Traveler 15", roomSharing: "Quad" }
      ]
    }
  };

  if (!booking) {
    booking = await prisma.booking.create({ data: bookingPayload });
    console.log(`✅ Created Demo Departure Booking: ${booking.tripName} (${booking.bookingId})`);
  } else {
    booking = await prisma.booking.update({ where: { id: booking.id }, data: bookingPayload });
    console.log(`🔄 Updated Demo Departure Booking: ${booking.tripName} (${booking.bookingId})`);
  }

  console.log("\n🎉 Demo 04th Aug 2026 Summer Spiti Valley seeded successfully!");
}

main()
  .catch(e => console.error("❌ Seed Error:", e))
  .finally(async () => await prisma.$disconnect());
