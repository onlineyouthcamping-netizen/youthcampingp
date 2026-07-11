const { prisma } = require('../backend/src/lib/prisma');

const searchPatterns = [
  /patelparth3315/i,
  /ctrls-projects/i,
  /ssr-git-main/i
];

async function checkTable(modelName, finder) {
  try {
    const records = await finder();
    for (const record of records) {
      const str = JSON.stringify(record);
      for (const pattern of searchPatterns) {
        if (pattern.test(str)) {
          console.log(`⚠️ Found Vercel preview URL match in ${modelName} ID: ${record.id || 'N/A'}`);
          console.log('Record content:', str);
          break;
        }
      }
    }
  } catch (err) {
    console.error(`Error checking ${modelName}:`, err.message);
  }
}

async function audit() {
  console.log('Searching database for Vercel preview URLs...');
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
  console.log('Search finished.');
}

audit().catch(console.error).finally(() => prisma.$disconnect());
