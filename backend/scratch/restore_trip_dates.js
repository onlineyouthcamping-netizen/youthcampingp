const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const manaliDates = [
    { "date": "2026-06-06", "capacity": 30, "bookedCount": 0 },
    { "date": "2026-06-13", "capacity": 30, "bookedCount": 0 },
    { "date": "2026-06-20", "capacity": 30, "bookedCount": 0 },
    { "date": "2026-06-27", "capacity": 99, "bookedCount": 0 },
    { "date": "2026-07-04", "capacity": 30, "bookedCount": 0 },
    { "date": "2026-07-11", "capacity": 30, "bookedCount": 0 },
    { "date": "2026-07-27", "capacity": 99, "bookedCount": 0 },
    { "date": "2026-08-03", "capacity": 99, "bookedCount": 0 },
    { "date": "2026-08-10", "capacity": 99, "bookedCount": 0 },
    { "date": "2026-08-17", "capacity": 99, "bookedCount": 0 },
    { "date": "2026-09-27", "capacity": 99, "bookedCount": 0 },
    { "date": "2027-07-05", "capacity": 30, "bookedCount": 0 }
  ];

  const spitiDates = [
    { "date": "2026-06-06", "capacity": 25, "bookedCount": 0 },
    { "date": "2026-06-13", "capacity": 25, "bookedCount": 0 },
    { "date": "2026-06-20", "capacity": 25, "bookedCount": 0 },
    { "date": "2026-06-27", "capacity": 25, "bookedCount": 0 },
    { "date": "2026-07-02", "capacity": 99, "bookedCount": 34 },
    { "date": "2026-07-04", "capacity": 25, "bookedCount": 0 },
    { "date": "2026-07-11", "capacity": 25, "bookedCount": 0 },
    { "date": "2026-07-14", "capacity": 99, "bookedCount": 0 },
    { "date": "2026-07-18", "capacity": 25, "bookedCount": 0 },
    { "date": "2026-07-21", "capacity": 99, "bookedCount": 0 },
    { "date": "2026-07-25", "capacity": 25, "bookedCount": 0 },
    { "date": "2026-08-01", "capacity": 25, "bookedCount": 0 },
    { "date": "2026-08-08", "capacity": 25, "bookedCount": 0 },
    { "date": "2026-09-08", "capacity": 99, "bookedCount": 0 }
  ];

  await prisma.trip.updateMany({
    where: { title: 'Manali Kasol Amritsar Backpacking Trip' },
    data: { availableDates: manaliDates }
  });

  await prisma.trip.updateMany({
    where: { title: 'Spiti Valley Road Trip' },
    data: { availableDates: spitiDates }
  });
  
  console.log("Restored all available dates for both trips!");
}

run().catch(console.error).finally(() => prisma.$disconnect());
