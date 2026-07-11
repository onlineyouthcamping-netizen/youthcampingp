const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  const liveUrl = process.env.DATABASE_URL;
  if (!liveUrl) {
    throw new Error("DATABASE_URL is not set in .env");
  }

  console.log("⚡ Connecting to live production database...");
  const livePrisma = new PrismaClient({
    datasources: {
      db: { url: liveUrl }
    }
  });

  console.log("📋 Fetching live production data...");
  const admins = await livePrisma.admin.findMany();
  const trips = await livePrisma.trip.findMany();
  const bookings = await livePrisma.booking.findMany();
  const reviews = await livePrisma.review.findMany();
  const blogs = await livePrisma.blog.findMany();
  const settings = await livePrisma.setting.findMany();
  const themes = await livePrisma.theme.findMany();
  const attractions = await livePrisma.attraction.findMany();
  const inquiries = await livePrisma.inquiry.findMany();
  const bookingLinks = await livePrisma.bookingLink.findMany();

  console.log(`\n📦 Live records retrieved:
    - ${admins.length} admins
    - ${trips.length} trips
    - ${bookings.length} bookings
    - ${reviews.length} reviews
    - ${blogs.length} blogs
    - ${settings.length} settings
    - ${themes.length} themes
    - ${attractions.length} attractions
    - ${inquiries.length} inquiries
    - ${bookingLinks.length} booking links
  `);

  await livePrisma.$disconnect();

  // Load local env config
  const localEnvContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
  const localUrlMatch = localEnvContent.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
  if (!localUrlMatch) {
    throw new Error("Could not find DATABASE_URL in .env.local");
  }
  const localUrl = localUrlMatch[1];
  console.log("\n⚡ Connecting to local database...");

  const localPrisma = new PrismaClient({
    datasources: {
      db: { url: localUrl }
    }
  });

  console.log("🧹 Clearing local tables...");
  
  const tablesToDelete = [
    'bookingVerificationLog', 'bookingVerification', 'trainTicketTraveller', 
    'trainTicketLog', 'trainTicketRequest', 'trainTicketHistory', 'trainTicketApproval', 
    'trainTicket', 'trainTicketGroup', 'trainTemplate', 'bookingEmailLog', 
    'bookingActivityLog', 'bookingTask', 'accountingEntryLog', 'accountingEntry', 
    'bookingLinkEvent', 'tripAssignment', 'tripVendor', 'vendor', 
    'opsVehicleAllocation', 'opsRoomAllocation', 'opsTripExpense', 
    'opsTripLeaderActivity', 'opsTripLeader', 'opsIncidentActivity', 
    'opsIncidentLog', 'opsGuidePayment', 'opsMiscExpense', 'opsDayItinerary', 
    'opsChecklistActivity', 'opsTripChecklist', 'opsRoomInventory', 
    'opsAllocationRun', 'opsAllocationOverride', 'opsHotelBooking', 
    'opsTransportFleet', 'opsSeatConfig', 'trainTicketAlert', 'auditLog',
    'booking', 'bookingLink', 'trip', 'admin', 'review', 'blog', 
    'setting', 'theme', 'attraction', 'inquiry', 'user'
  ];

  for (const table of tablesToDelete) {
    try {
      if (localPrisma[table]) {
        await localPrisma[table].deleteMany({});
      }
    } catch (e) {
      console.log(`⚠️ Note: Could not clear table ${table} (might not exist locally): ${e.message}`);
    }
  }

  console.log("📥 Seeding data into local database...");

  // 1. Admins
  for (const x of admins) {
    await localPrisma.admin.create({ data: x });
  }
  // 2. Settings & Themes
  for (const x of settings) {
    await localPrisma.setting.create({ data: x });
  }
  for (const x of themes) {
    await localPrisma.theme.create({ data: x });
  }
  // 3. Attractions
  for (const x of attractions) {
    await localPrisma.attraction.create({ data: x });
  }
  // 4. Blogs & Reviews
  for (const x of blogs) {
    await localPrisma.blog.create({ data: x });
  }
  for (const x of reviews) {
    await localPrisma.review.create({ data: x });
  }
  // 5. Trips
  for (const x of trips) {
    await localPrisma.trip.create({ data: x });
  }
  // 6. Booking Links
  for (const x of bookingLinks) {
    await localPrisma.bookingLink.create({ data: x });
  }
  // 7. Bookings
  for (const x of bookings) {
    await localPrisma.booking.create({ data: x });
  }
  // 8. Inquiries
  for (const x of inquiries) {
    await localPrisma.inquiry.create({ data: x });
  }

  console.log("\n🎉 Live database records successfully synchronized to local database!");
  await localPrisma.$disconnect();
}

main().catch(console.error);
