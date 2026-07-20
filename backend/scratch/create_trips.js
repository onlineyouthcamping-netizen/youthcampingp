const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const wSpitiDates = [
  '2026-10-02', '2026-10-09', '2026-10-16', '2026-10-23', '2026-10-30',
  '2026-11-06', '2026-11-13', '2026-11-20', '2026-11-27',
  '2026-12-04', '2026-12-11', '2026-12-18', '2026-12-25',
  '2027-01-01', '2027-01-08', '2027-01-15', '2027-01-22', '2027-01-29',
  '2027-02-05', '2027-02-12', '2027-02-19', '2027-02-26',
  '2027-03-05', '2027-03-12', '2027-03-19', '2027-03-26',
  '2027-04-02', '2027-04-09', '2027-04-16', '2027-04-23', '2027-04-30',
  '2027-05-07', '2027-05-14', '2027-05-21', '2027-05-28'
].map(d => ({ date: d, capacity: 50, bookedCount: 0 }));

const keralaDates = [
  '2026-08-04', '2026-08-10', '2026-08-18', '2026-08-25',
  '2026-09-01', '2026-09-08', '2026-09-15', '2026-09-22', '2026-09-29'
].map(d => ({ date: d, capacity: 50, bookedCount: 0 }));

const wSpitiItinerary = [
  { day: 1, title: 'Departure from Your City by train', description: 'Begin your journey with a train to Chandigarh.' },
  { day: 2, title: 'Chandigarh to Narkanda', description: 'Drive from Chandigarh to Narkanda. Enjoy dinner and stay.' },
  { day: 3, title: 'Narkanda to Chitkul & Sangla', description: 'Travel through the Kinnaur Valley.' },
  { day: 4, title: 'Sangla to Tabo via Khab Sangam & Nako Lake', description: 'Visit the scenic Nako Lake and Khab Sangam.' },
  { day: 5, title: 'Tabo to Kaza via Lingti Frozen WaterFall, Key & Chicham Bridge', description: 'Explore ancient monasteries and frozen waterfalls.' },
  { day: 6, title: 'Hikkim, Komic & Langza', description: 'Visit the highest post office and village. Stay in Kaza.' },
  { day: 7, title: 'Kaza to Kalpa via Dhankar', description: 'Enjoy the view of the Kinnaur Kailash range.' },
  { day: 8, title: 'Kalpa to Shimla | Local Sightseeing', description: 'Return to Shimla and explore local spots.' },
  { day: 9, title: 'Shimla to Chandigarh | Train to Ahmedabad', description: 'Catch your train back from Chandigarh.' },
  { day: 10, title: 'Arrival in your city', description: 'Trip ends with great memories.' }
];

const keralaItinerary = [
  { day: 1, title: 'Ahmedabad to Cochin Train Journey', description: 'Overnight train journey to Kochi.' },
  { day: 2, title: 'Arrival in Cochin', description: 'Settle in after your long train journey. Stay in Cochin.' },
  { day: 3, title: 'Scenic Drive to Munnar', description: 'Witness the beauty of Valara & Cheeyappara Waterfalls and Spice Plantations.' },
  { day: 4, title: 'Explore the Beauty of Munnar', description: 'Visit Mattupetty Dam, Echo Point, Kundala Dam, and Eravikulam National Park.' },
  { day: 5, title: 'Thekkady – Wildlife & Cultural Experience', description: 'Scenic drive to Thekkady. Optional Periyar Lake cruise. Kalaripayattu and Kathakali show.' },
  { day: 6, title: 'Explore Chinese Fishing Net & Local Market', description: 'Discover local heritage and shopping.' },
  { day: 7, title: 'Alleppey backwaters Experience', description: 'Enjoy the iconic Kerala backwaters.' },
  { day: 8, title: 'Cochin to Ahmedabad Train Journey', description: 'Board your return train.' },
  { day: 9, title: 'Arrival in Ahmedabad', description: 'Arrive home with beautiful memories.' }
];

async function run() {
  await prisma.trip.create({
    data: {
      id: 'WSPT-1',
      title: 'Winter Spiti Road Trip',
      slug: 'winter-spiti-road-trip',
      location: 'Spiti Valley, Himachal Pradesh',
      price: 21499,
      duration: '10D/09N',
      description: 'Experience the magic of Spiti in winter.',
      category: 'himalayan',
      isActive: true,
      status: 'published',
      availableDates: wSpitiDates,
      itinerary: wSpitiItinerary,
      images: []
    }
  });

  await prisma.trip.create({
    data: {
      id: 'KRL-1',
      title: 'Kerala Trip',
      slug: 'kerala-trip',
      location: 'Kerala',
      price: 22499,
      duration: '09D/08N',
      description: 'Backwaters • Waterfalls • Beaches • Hills',
      category: 'south-india',
      isActive: true,
      status: 'published',
      availableDates: keralaDates,
      itinerary: keralaItinerary,
      images: []
    }
  });
  
  console.log("Trips WSPT-1 and KRL-1 created successfully!");
}

run().catch(console.error).finally(() => prisma.$disconnect());
