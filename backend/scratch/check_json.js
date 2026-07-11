const axios = require('axios');

async function main() {
  try {
    // We can simulate the API response or call the local backend if it's running.
    // Or we can query the database directly and JSON.stringify it to see.
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const bookings = await prisma.booking.findMany({
      where: { tripId: 'SPT-1' },
      select: { id: true, departureDate: true }
    });
    
    console.log("JSON serialized:");
    console.log(JSON.stringify(bookings.slice(0, 3), null, 2));
    
    prisma.$disconnect();
  } catch (err) {
    console.error(err);
  }
}

main();
