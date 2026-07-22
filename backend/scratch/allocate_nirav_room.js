const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const booking = await prisma.booking.findFirst({
    where: { bookingId: 'BK-SPITI-G2' }
  });

  if (!booking) {
    console.log("Booking BK-SPITI-G2 not found!");
    return;
  }

  let passengers = typeof booking.passengers === 'string' ? JSON.parse(booking.passengers) : booking.passengers;
  
  if (!passengers.details) passengers.details = {};
  
  // Set the specific room details for Nirav and Jayshree
  passengers.details.personsRoomDetails = {
    "Nirav": { roomType: "Couple", coupleWith: "Jayshree", roomNo: "Room 1" },
    "Jayshree": { roomType: "Couple", coupleWith: "Nirav", roomNo: "Room 1" }
  };

  await prisma.booking.update({
    where: { id: booking.id },
    data: { passengers }
  });

  console.log("Successfully linked Nirav and Jayshree as a Couple in Room 1!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
