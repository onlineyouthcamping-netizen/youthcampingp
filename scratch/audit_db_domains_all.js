const { prisma } = require('../backend/src/lib/prisma');

const searchPatterns = [
  /localhost/i,
  /127\.0\.0\.1/,
  /onrender\.com/i,
  /vercel\.app/i,
  /ssr-taupe/i,
  /youthcamping\.in/i
];

async function checkTable(modelName, finder) {
  console.log(`\nChecking ${modelName} table...`);
  try {
    const records = await finder();
    for (const record of records) {
      const str = JSON.stringify(record);
      for (const pattern of searchPatterns) {
        if (pattern.test(str)) {
          console.log(`⚠️ Found match in ${modelName} ID: ${record.id || 'N/A'}`);
          // Extract specific match
          const matchRegex = /(https?:\/\/[^\s"',]+|admin@youthcamping\.in|dev@youthcamping\.in)/g;
          const matches = str.match(matchRegex) || [];
          const badMatches = matches.filter(m => {
            return searchPatterns.some(p => p.test(m));
          });
          console.log('  Matches:', [...new Set(badMatches)]);
          break; // Show once per record
        }
      }
    }
  } catch (err) {
    console.error(`Error checking ${modelName}:`, err.message);
  }
}

async function audit() {
  console.log('--- ALL DB DOMAINS AUDIT START ---');
  
  await checkTable('Admin', () => prisma.admin.findMany());
  await checkTable('User', () => prisma.user.findMany());
  await checkTable('Inquiry', () => prisma.inquiry.findMany());
  await checkTable('Vendor', () => prisma.vendor.findMany());
  await checkTable('TripVendor', () => prisma.tripVendor.findMany());
  await checkTable('Blog', () => prisma.blog.findMany());
  await checkTable('Review', () => prisma.review.findMany());
  await checkTable('Payment', () => prisma.payment.findMany());
  await checkTable('Quotation', () => prisma.quotation.findMany());
  await checkTable('Trip', () => prisma.trip.findMany());
  await checkTable('Booking', () => prisma.booking.findMany());
  await checkTable('BookingEmailLog', () => prisma.bookingEmailLog.findMany());
  await checkTable('PageBuilder', () => prisma.pageBuilder.findMany());
  await checkTable('Setting', () => prisma.setting.findMany());
  await checkTable('Theme', () => prisma.theme.findMany());

  console.log('\n--- ALL DB DOMAINS AUDIT END ---');
}

audit().catch(console.error).finally(() => prisma.$disconnect());
