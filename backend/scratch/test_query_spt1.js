const { prisma } = require('../src/lib/prisma');

async function main() {
  const id = 'MKA-2';
  const tenantId = 'default';

  // 1. Delete previous/duplicate bookings on 2026-07-14 to keep it clean
  await prisma.booking.deleteMany({
    where: {
      tripId: "SPT-1",
      departureDate: new Date("2026-07-14"),
      // Do not delete the ones we are about to move
      NOT: {
        name: {
          in: ["Jeel", "Vatsal", "Diya", "Yashvi", "Janki", "Nishit", "Manasvi", "Tanvi", "Rajveer", "Manthan", "Darshana", "Jatinsinh", "Rutvik", "Foram"]
        }
      }
    }
  });

  // 2. Move our 14 bookings (15 passengers) to 2026-07-14
  const updateResult = await prisma.booking.updateMany({
    where: {
      tripId: "SPT-1",
      name: {
        in: ["Jeel", "Vatsal", "Diya", "Yashvi", "Janki", "Nishit", "Manasvi", "Tanvi", "Rajveer", "Manthan", "Darshana", "Jatinsinh", "Rutvik", "Foram"]
      }
    },
    data: {
      departureDate: new Date("2026-07-14")
    }
  });

  console.log("UPDATED BOOKINGS TO 2026-07-14:", updateResult.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
