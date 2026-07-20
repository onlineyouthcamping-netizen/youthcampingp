const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const mkaDates = [
  '2026-01-03', '2026-01-10', '2026-01-17', '2026-01-24', '2026-01-31',
  '2026-02-07', '2026-02-14', '2026-02-21', '2026-02-28',
  '2026-03-07', '2026-03-14', '2026-03-21', '2026-03-28',
  '2026-04-04', '2026-04-11', '2026-04-18', '2026-04-25',
  '2026-09-06', '2026-09-13', '2026-09-20', '2026-09-27',
  '2026-10-04', '2026-10-11', '2026-10-18', '2026-10-25',
  '2026-11-06', '2026-11-08', '2026-11-15', '2026-11-22', '2026-11-29',
  '2026-12-06', '2026-12-13', '2026-12-20', '2026-12-26', '2026-12-27', '2026-12-29'
];

const sptDates = [
  '2026-06-02', '2026-06-09', '2026-06-16', '2026-06-23', '2026-06-30',
  '2026-07-07', '2026-07-14', '2026-07-21', '2026-07-28',
  '2026-08-04', '2026-08-11', '2026-08-18', '2026-08-25',
  '2026-09-01', '2026-09-08', '2026-09-15', '2026-09-22', '2026-09-29'
];

const mkaItinerary = [
  { day: 1, title: 'Train Journey to Jalandhar', description: '• Starting location: Ahmedabad / Gandhinagar / Mumbai / Surat / Vadodara\n• Destination: Jalandhar\n• Transport details: Sleeper class train tickets (3 Tier AC available as upgrade)\n• Important instructions: Meet YC representative at railway station in morning. Contact details will be sent to you by WhatsApp one day before departure.' },
  { day: 2, title: 'Visit Wagha Border & Golden Temple', description: '• Destination: Amritsar / Kasol\n• Activities and sightseeing: Attend Wagha Border Indo-Pak Historic Ceremonial Parade (if it does not take place, proceed to Jallianwala Bagh). Visit Golden Temple and explore Amritsar market.\n• Night journey: Night drive to Kasol\n• Meals: Breakfast, Lunch, Dinner' },
  { day: 3, title: 'Day for Kasol & Parvati valley Exploration', description: '• Starting location: Kasol\n• Departure/reporting time: Reach Kasol Campsite by 11:00 AM\n• Activities and sightseeing: Free time after breakfast. After lunch, hike to Chalal Village (2 Hours Hike). Evening visit to Manikarn Gurudhwara & Kasol Local Market. Group games, bonfire, and music.\n• Meals: Breakfast, Lunch, Dinner\n• Hotel/stay: Camping/cottage in Kasol' },
  { day: 4, title: 'Bijli Mahadev Trek', description: '• Activities and sightseeing: Trek with a small backpack. 360* view of the snowclad Himalayas.\n• Destination: Kullu\n• Transport details: Drive to Kullu after completing trek.\n• Meals: Breakfast, Lunch, Dinner\n• Hotel/stay: Swiss Camp in Kullu' },
  { day: 5, title: 'Day for Adventure Activities: Rafting & Paragliding', description: '• Activities and sightseeing: Early morning rope adventure activities. Highest paragliding (selfpaid) spot in manali. 8KM white water rafting (Complimentary). Visit kullu shawl factory.\n• Meals: Breakfast, Lunch, Dinner\n• Hotel/stay: Hotel or Cottages in Manali' },
  { day: 6, title: 'Solang Valley - Atal tunnel - Sissu', description: '• Activities and sightseeing: Drive to Solang Valley & adventure activities in snow. Visit ATAL tunnel (Asia’s Longest) & explore Sissu lake. Can Rent A Bike on This Day.\n• Important instructions: In Heavy Snowfall Atal tunnel & Sissu will be closed by Border Road Orginization.\n• Meals: Breakfast, Lunch, Dinner\n• Hotel/stay: Hotel or Cottages in Manali' },
  { day: 7, title: 'Manali Sightseeing & Jogini Waterfall', description: '• Activities and sightseeing: Visit vasisth temple, Jogini Waterfall Trek. Visit Mall Road, Hadimba Temple, Old Manali.\n• Meals: Breakfast, Lunch\n• Night journey: Night drive to Una/Jalandhar' },
  { day: 8, title: 'Return Train Journey', description: '• Starting location: Jalandhar/Una\n• Destination: Ahmedabad\n• Transport details: Return train journey\n• Important instructions: Reach Railway Station 04 Hours prior to Train Departure Time' },
  { day: 9, title: 'Arrive at Your city', description: '• Destination: Your city\n• Activities: Trip ends with lots of memories.' }
];

const sptItinerary = [
  { day: 1, title: 'Train Journey Ahmedabad to Chandigrah/Jalandhar', description: '• Starting location: Ahmedabad\n• Destination: Chandigarh / Jalandhar\n• Transport details: Overnight train journey (Non-AC Sleeper / 3 Tier AC available)\n• Route: Passing through Gujarat, Rajasthan, and Haryana. Stops at Abu Road and Jaipur.\n• Activities and sightseeing: Bond with fellow travelers through fun activities, soak in local flavors.\n• Important instructions: Please note that if you have a connecting train from Ahmedabad/Gandhinagar to Surat, Baroda, Mumbai, or Pune, inter-station transfers are not included.' },
  { day: 2, title: 'Drive to Shimla/Narkanda', description: '• Starting location: Chandigarh / Jalandhar\n• Destination: Shimla\n• Departure/reporting time: 8:00 AM (Arrival in Chandigarh or Jalandhar)\n• Transport details: Depart for Shimla by Traveler/Taxi\n• Activities and sightseeing: Enjoy the scenic drive. If time permits, explore Shimla’s famous Mall Road and shop for souvenirs.\n• Meals: Dinner Included\n• Hotel/stay: Hotel in Shimla' },
  { day: 3, title: 'Shimla to Chitkul, last village on Indo-Tibetan border', description: '• Starting location: Shimla\n• Destination: Chitkul\n• Activities and sightseeing: Drive through the stunning landscapes of Kinnaur Valley. Visit Chitkul, the last village on the old Hindustan-Tibet trade route.\n• Meals: Breakfast, Dinner Included\n• Hotel/stay: Cottage in Chitkul/Sangla' },
  { day: 4, title: 'Travel from Chitkul to Tabo, via Nako Lake', description: '• Starting location: Chitkul\n• Destination: Tabo\n• Activities and sightseeing: Drive along the India-Tibet border, passing through Khab, the confluence of the Spiti & Sutlej Rivers. Stop by the beautiful Nako Lake for a peaceful retreat.\n• Meals: Breakfast, Dinner Included\n• Hotel/stay: Homestay in Tabo' },
  { day: 5, title: 'Explore Tabo and Dhankar Village', description: '• Starting location: Tabo\n• Destination: Kaza\n• Activities and sightseeing: Visit the 1000-year-old Tabo Monastery. Explore Dhankar Village & Gompa. Stroll through Kaza Market.\n• Meals: Breakfast, Dinner Included\n• Hotel/stay: Homestay in Kaza' },
  { day: 6, title: 'Explore Key, Komic, Langza, and Hikkim in a day', description: '• Starting location: Kaza\n• Destination: Kaza\n• Activities and sightseeing: Visit Key Monastery. Explore Komic (world’s highest motorable village). Witness the majestic Buddha Statue at Langza. Send a postcard from Hikkim.\n• Meals: Breakfast, Dinner Included\n• Hotel/stay: Homestay in Kaza' },
  { day: 7, title: 'Visit Kibber and Chicham, then head towards Chandra Taal', description: '• Starting location: Kaza\n• Destination: Chandra Taal\n• Activities and sightseeing: Visit Kibber, cross the Chicham Bridge. Travel to Chandra Taal.\n• Meals: Breakfast, Dinner Included\n• Hotel/stay: Chandrataal Camp\n• Important instructions: Chandra Taal Lake usually opens by late Mid June. If inaccessible, we stay in Kaza and reroute via Kalpa and Shimla.' },
  { day: 8, title: 'Journey to Manali through the Atal Tunnel', description: '• Starting location: Chandra Taal\n• Destination: Manali\n• Transport details: Travel via Chhatru through Atal Tunnel.\n• Activities and sightseeing: Morning visit to the stunning Chandra Taal Lake.\n• Meals: Breakfast, Dinner Included\n• Hotel/stay: Hotel in Manali' },
  { day: 9, title: 'Explore Manali & adventure activities', description: '• Starting location: Manali\n• Destination: Manali\n• Activities and sightseeing: Explore Manali.\n• Meals: Breakfast Included' },
  { day: 10, title: 'Train Journey to Chandigrah / Jalandhar', description: '• Starting location: Manali\n• Destination: Chandigarh/Jalandhar\n• Transport details: Board the return train.' },
  { day: 11, title: 'Arrival in your city', description: '• Destination: Your city\n• Activities: Trip ends.' }
];

async function updateTrip(tripId, newDates, newItinerary) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) {
    console.log(`Trip ${tripId} not found.`);
    return;
  }
  
  let currentDates = trip.availableDates || [];
  if (!Array.isArray(currentDates)) currentDates = [];
  
  let dateAdded = 0;
  for (const dateStr of newDates) {
    const exists = currentDates.find(d => d.date === dateStr);
    if (!exists) {
      currentDates.push({ date: dateStr, capacity: 50, bookedCount: 0 });
      dateAdded++;
    }
  }
  
  // sort dates
  currentDates.sort((a,b) => new Date(a.date) - new Date(b.date));
  
  await prisma.trip.update({
    where: { id: tripId },
    data: {
      availableDates: currentDates,
      itinerary: newItinerary
    }
  });
  
  console.log(`Updated ${tripId}: Added ${dateAdded} new dates. Itinerary updated.`);
}

async function run() {
  await updateTrip('MKA-1', mkaDates, mkaItinerary);
  await updateTrip('SPT-1', sptDates, sptItinerary);
}

run().catch(console.error).finally(() => prisma.$disconnect());
