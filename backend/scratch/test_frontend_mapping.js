const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = new PrismaClient();

async function run() {
  try {
    const bookings = await prisma.booking.findMany({
      where: { tripId: 'SPT-1', status: 'confirmed' }
    });

    console.log(`Retrieved ${bookings.length} confirmed bookings from DB.`);

    const arr = [];
    bookings.forEach((b) => {
      let passengersObj = b.passengers;
      if (typeof passengersObj === 'string') {
        try {
          passengersObj = JSON.parse(passengersObj);
        } catch (e) {
          passengersObj = {};
        }
      }

      const leadName = b.fullName || b.name;
      const paxList = passengersObj?.persons || [];
      const filteredCoPax = paxList.filter((p) => p.name !== leadName);
      const passengerCount = filteredCoPax.length + 1;

      console.log(`Booking: ${b.bookingId} (${leadName}) - paxList length: ${paxList.length}, filteredCoPax length: ${filteredCoPax.length}`);

      // Simulating base passenger addition
      arr.push({ id: b.id, name: leadName, isLead: true });

      if (Array.isArray(passengersObj?.persons)) {
        passengersObj.persons.forEach((p, idx) => {
          if (p.name === leadName) return;
          arr.push({ id: `${b.id}-co-${idx}`, name: p.name, isLead: false });
        });
      }
    });

    console.log(`Total Passengers mapped: ${arr.length}`);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
