const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const spiti = await prisma.trip.findFirst({ where: { title: 'Spiti Valley Road Trip' } });
  const manali = await prisma.trip.findFirst({ where: { title: 'Manali Kasol Amritsar Backpacking Trip' } });

  const bookingsToCreate = [
    { bookingId: 'BK-951966', name: 'Manasvi', tripId: spiti.id, tripName: spiti.title, departureDate: new Date('2026-07-14'), status: 'confirmed', phone: '0000000000', amount: 10000 },
    { bookingId: 'BK-851249', name: 'Tanvi', tripId: spiti.id, tripName: spiti.title, departureDate: new Date('2026-07-14'), status: 'confirmed', phone: '0000000000', amount: 10000 },
    { bookingId: 'BK-851250', name: 'Rajveer', tripId: spiti.id, tripName: spiti.title, departureDate: new Date('2026-07-14'), status: 'confirmed', phone: '0000000000', amount: 10000 },
    { bookingId: 'BK-851251', name: 'Manthan', tripId: spiti.id, tripName: spiti.title, departureDate: new Date('2026-07-14'), status: 'confirmed', phone: '0000000000', amount: 10000 },
    { bookingId: 'BK-319220', name: 'Darshana', tripId: spiti.id, tripName: spiti.title, departureDate: new Date('2026-07-14'), status: 'confirmed', phone: '0000000000', amount: 10000 },
    { bookingId: 'BK-319221', name: 'Jatinsinh', tripId: spiti.id, tripName: spiti.title, departureDate: new Date('2026-07-14'), status: 'confirmed', phone: '0000000000', amount: 10000 },
    { bookingId: 'BK-319222', name: 'Rutvik', tripId: spiti.id, tripName: spiti.title, departureDate: new Date('2026-07-14'), status: 'confirmed', phone: '0000000000', amount: 10000 },
    { bookingId: 'BK-319223', name: 'Foram', tripId: spiti.id, tripName: spiti.title, departureDate: new Date('2026-07-14'), status: 'cancelled', phone: '0000000000', amount: 10000 },
    { bookingId: 'BK-WMXZ506MY9WD', name: 'Vanshika Rajbhar', tripId: spiti.id, tripName: spiti.title, departureDate: new Date('2026-09-08'), status: 'confirmed', phone: '0000000000', amount: 10000 },
    { bookingId: 'BK-800021', name: 'MEETKUMAR', tripId: spiti.id, tripName: spiti.title, departureDate: new Date('2026-07-21'), status: 'confirmed', phone: '0000000000', amount: 10000 },
    { bookingId: 'BK-800022', name: 'NIRAV', tripId: spiti.id, tripName: spiti.title, departureDate: new Date('2026-07-21'), status: 'confirmed', phone: '0000000000', amount: 10000 },
    { bookingId: 'BK-800023', name: 'jainish', tripId: spiti.id, tripName: spiti.title, departureDate: new Date('2026-07-21'), status: 'confirmed', phone: '0000000000', amount: 10000 },
    { bookingId: 'BK-800024', name: 'Prithviraj', tripId: spiti.id, tripName: spiti.title, departureDate: new Date('2026-07-21'), status: 'confirmed', phone: '0000000000', amount: 10000 },
    { bookingId: 'BK-520063', name: 'Jeel', tripId: spiti.id, tripName: spiti.title, departureDate: new Date('2026-07-14'), status: 'confirmed', phone: '0000000000', amount: 10000 },
    { bookingId: 'BK-LJVO6YZ2VCCW', name: 'Mansuri Anash', tripId: spiti.id, tripName: spiti.title, departureDate: new Date('2026-09-08'), status: 'confirmed', phone: '0000000000', amount: 10000 },
    { bookingId: 'BK-1MCU9MJLXTV1', name: 'YouthCamping Online', tripId: spiti.id, tripName: spiti.title, departureDate: new Date('2026-09-08'), status: 'pending', phone: '0000000000', amount: 10000 },
    { bookingId: 'BK-FIVFSP137WGF', name: 'CHAUHAN KHUSHBUBEN ASHWINBHAI', tripId: spiti.id, tripName: spiti.title, departureDate: new Date('2026-09-08'), status: 'confirmed', phone: '0000000000', amount: 10000 },
    { bookingId: 'BK-EJUZMLIVRRB0', name: 'Chavada Jinal Hirenbhai', tripId: manali.id, tripName: manali.title, departureDate: new Date('2026-09-27'), status: 'confirmed', phone: '0000000000', amount: 10000 }
  ];

  const created = await prisma.booking.createMany({
    data: bookingsToCreate,
    skipDuplicates: true
  });

  console.log(`Successfully recreated ${created.count} bookings.`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
