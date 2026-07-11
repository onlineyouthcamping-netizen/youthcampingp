const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Searching for 'Shubham' in passengers and bookings...");
    // Let's find all bookings in the database to see what data exists.
    const allBookings = await prisma.booking.findMany({});

    console.log(`Total bookings: ${allBookings.length}`);

    let matches = [];
    for (const b of allBookings) {
      // Check booking fields
      if (b.name && b.name.toLowerCase().includes('shubham')) {
        matches.push({ type: 'booking_name', bookingId: b.id, name: b.name, b_id: b.id, bookingIdStr: b.bookingId });
      }
      if (b.fullName && b.fullName.toLowerCase().includes('shubham')) {
        matches.push({ type: 'booking_fullname', bookingId: b.id, name: b.fullName, b_id: b.id, bookingIdStr: b.bookingId });
      }
      if (b.passengers) {
        let pList = [];
        if (typeof b.passengers === 'string') {
          try {
            pList = JSON.parse(b.passengers);
          } catch(e) {}
        } else if (Array.isArray(b.passengers)) {
          pList = b.passengers;
        }
        for (const p of pList) {
          if (p.name && p.name.toLowerCase().includes('shubham')) {
            matches.push({ type: 'passenger', bookingId: b.id, bookingIdStr: b.bookingId, name: p.name, p });
          }
        }
      }
    }

    console.log("Matches found:", JSON.stringify(matches, null, 2));

  } catch (err) {
    console.error("Error querying database:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
