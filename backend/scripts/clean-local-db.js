const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load and parse .env.local explicitly
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error(`❌ .env.local not found at ${envPath}`);
  process.exit(1);
}
const envContent = fs.readFileSync(envPath, 'utf8');
const urlMatch = envContent.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
if (!urlMatch) {
  console.error("❌ DATABASE_URL not found in .env.local");
  process.exit(1);
}
const localUrl = urlMatch[1];

// Security check: ensure we are targeting a local database
if (!localUrl.includes('127.0.0.1') && !localUrl.includes('localhost')) {
  console.error("❌ Safety check failed: DATABASE_URL in .env.local does not point to localhost or 127.0.0.1.");
  console.error(`URL: ${localUrl}`);
  process.exit(1);
}

async function cleanLocalDb() {
  console.log("⚡ Connecting to local database...");
  const prisma = new PrismaClient({
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
      if (prisma[table]) {
        const result = await prisma[table].deleteMany({});
        if (result.count > 0) {
          console.log(`✅ Cleared ${result.count} records from ${table}`);
        }
      }
    } catch (e) {
      console.log(`⚠️ Note: Could not clear table ${table}: ${e.message}`);
    }
  }

  console.log("\n🎉 Local database successfully cleaned!");
  await prisma.$disconnect();
}

cleanLocalDb().catch(e => {
  console.error("❌ Cleaning failed:", e);
  process.exit(1);
});
