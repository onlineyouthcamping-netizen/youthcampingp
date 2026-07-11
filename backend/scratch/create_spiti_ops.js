const { prisma } = require('../src/lib/prisma');

async function main() {
  const tripId = "SPT-1";
  const departureDate = new Date("2026-07-14");

  // Clean existing entries for this departure to prevent duplicates
  await prisma.opsHotelBooking.deleteMany({
    where: { tripId, departureDate }
  });
  await prisma.opsTransportFleet.deleteMany({
    where: { tripId, departureDate }
  });
  await prisma.opsGuidePayment.deleteMany({
    where: { tripId, departureDate }
  });

  console.log("Creating transport bookings...");
  await prisma.opsTransportFleet.create({
    data: {
      tenantId: "default",
      tripId,
      departureDate,
      vehicleType: "17 Seater Tempo",
      capacity: 17,
      driverName: "Dikshu bhai",
      driverPhone: "8219733094",
      totalAmount: 63000,
      advancePaid: 0,
      balanceAmount: 63000,
      notes: "17 Seater Tempo = 63000 (15th till 23rd July 2026)"
    }
  });

  console.log("Creating guide bookings...");
  await prisma.opsGuidePayment.create({
    data: {
      tenantId: "default",
      tripId,
      departureDate,
      guideName: "Dikshu Sir",
      daysWorked: 9,
      agreedAmount: 10000,
      advancePaid: 0,
      balanceAmount: 10000,
      paymentStatus: "PENDING"
    }
  });

  console.log("Creating hotel bookings...");
  const hotels = [
    { 
      name: "Mountain Vista", 
      location: "Shimla", 
      date: new Date("2026-07-15"), 
      rooms: 5, 
      total: 17000, 
      notes: "(Double Sharing = 2600 x 5 = 13000) + (Extra persons = 5 x 800 = 4000) = 17000" 
    },
    { 
      name: "Mehak Resort", 
      location: "Sangla", 
      date: new Date("2026-07-16"), 
      rooms: 5, 
      total: 18400, 
      notes: "(Double Sharing = 1400 x 2 = 2800) + (Triple & Quad Sharing = 13 x 1200 = 15600) = 18400" 
    },
    { 
      name: "Apple Blossom", 
      location: "Tabo", 
      date: new Date("2026-07-17"), 
      rooms: 5, 
      total: 18000, 
      notes: "15 x 1200 = 18000" 
    },
    { 
      name: "Spiti Siddharth", 
      location: "Kaza", 
      date: new Date("2026-07-18"), 
      rooms: 5, 
      total: 33000, 
      notes: "(15 x 1100 = 16500) x 2 days = 33000 (18-07-2026 & 19-07-2026)" 
    },
    { 
      name: "Chandratal Stay", 
      location: "Chandratal", 
      date: new Date("2026-07-20"), 
      rooms: 4, 
      total: 27750, 
      notes: "15 x 1850 = 27750" 
    },
    { 
      name: "Manali Hotel", 
      location: "Manali", 
      date: new Date("2026-07-21"), 
      rooms: 5, 
      total: 12600, 
      notes: "(Double Sharing = 2 x 1100 = 2200) + (Triple & Quad = 13 x 800 = 10400) = 12600" 
    },
    { 
      name: "Kullu Stay", 
      location: "Kullu", 
      date: new Date("2026-07-22"), 
      rooms: 4, 
      total: 2000, 
      notes: "4 tents x 500 = 2000" 
    }
  ];

  for (const h of hotels) {
    await prisma.opsHotelBooking.create({
      data: {
        tenantId: "default",
        tripId,
        departureDate,
        hotelName: h.name,
        location: h.location,
        checkIn: h.date,
        checkOut: new Date(h.date.getTime() + 24 * 60 * 60 * 1000),
        numberOfRooms: h.rooms,
        totalAmount: h.total,
        advancePaid: 0,
        balanceAmount: h.total,
        confirmed: "CONFIRMED",
        notes: h.notes
      }
    });
  }

  console.log("Operations payments, hotels and vendors successfully added for 14th July Spiti Valley Trip!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
