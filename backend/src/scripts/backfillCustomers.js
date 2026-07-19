const { prisma } = require('../lib/prisma');

async function backfill() {
  console.log('--- DRY RUN BACKFILL CUSTOMERS ---');
  let matched = 0;
  let unmatched = 0;
  let ambiguous = 0;

  const bookings = await prisma.booking.findMany({ where: { customerId: null } });
  
  for (const booking of bookings) {
    if (!booking.email && !booking.phone) {
      unmatched++;
      continue;
    }

    const whereOr = [];
    if (booking.email && booking.phone) {
      whereOr.push({ email: booking.email, phone: booking.phone });
    } else if (booking.email) {
      whereOr.push({ email: booking.email });
    } else if (booking.phone) {
      whereOr.push({ phone: booking.phone });
    }

    const users = await prisma.user.findMany({
      where: {
        tenantId: booking.tenantId,
        OR: whereOr
      }
    });

    if (users.length === 1) {
      matched++;
      // Uncomment to apply:
      // await prisma.booking.update({ where: { id: booking.id }, data: { customerId: users[0].id } });
    } else if (users.length > 1) {
      ambiguous++;
    } else {
      unmatched++;
    }
  }

  console.log(`Matched: ${matched}, Unmatched: ${unmatched}, Ambiguous: ${ambiguous}`);
  process.exit(0);
}

backfill();
