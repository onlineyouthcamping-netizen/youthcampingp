require('./src/utils/testSafety').assertReadOnlyTestSafety();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing exact getBookingLinks query...');
  try {
    const links = await prisma.bookingLink.findMany({
      where: { tenantId: 'default' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tenantId: true,
        createdByAdminId: true,
        tripId: true,
        tripName: true,
        departureDate: true,
        pickupCity: true,
        paymentMode: true,
        customAmount: true,
        customTime: true,
        headerTitle: true,
        headerSubtitle: true,
        expiresAt: true,
        status: true,
        tokenPrefix: true,
        shareUrl: true,
        openedCount: true,
        firstOpenedAt: true,
        lastOpenedAt: true,
        completedCount: true,
        lastCompletedAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
    console.log('Successfully completed exact query! Result count:', links.length);
  } catch (error) {
    console.error('ERROR during exact query:', error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
