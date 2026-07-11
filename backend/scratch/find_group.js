const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const names = ["JEEL", "VATSAL", "SHUBHAM", "DIYA", "YASHVI", "JANKI", "NISHIT", "MANASVI", "TANVI", "RAJVEER", "MANTHAN", "DARSHANA", "JATINSINH", "RUTVIK", "FORAM"];

async function main() {
  try {
    const allBookings = await prisma.booking.findMany({});
    console.log(`Checking ${allBookings.length} bookings for names:`, names);

    for (const b of allBookings) {
      let matchedNames = [];
      
      const checkName = (n) => {
        if (!n) return;
        for (const target of names) {
          if (n.toUpperCase().includes(target)) {
            matchedNames.push(target);
          }
        }
      };

      checkName(b.name);
      checkName(b.fullName);
      
      let pList = [];
      if (b.passengers) {
        if (typeof b.passengers === 'string') {
          try { pList = JSON.parse(b.passengers); } catch(e) {}
        } else if (Array.isArray(b.passengers)) {
          pList = b.passengers;
        }
      }

      for (const p of pList) {
        checkName(p.name);
      }

      if (matchedNames.length > 0) {
        console.log(`Booking ID: ${b.id} (${b.bookingId})`);
        console.log(`  Customer: ${b.name} (${b.fullName})`);
        console.log(`  Matched: ${[...new Set(matchedNames)].join(', ')}`);
        console.log(`  Total Passengers inside booking field 'passengers':`, pList.length);
        console.log(`  Passengers details:`, JSON.stringify(pList, null, 2));
      }
    }
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
