const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

const trips = [
  {
    id: "manali-kasol-amritsar",
    title: "Manali Kasol Amritsar Backpacking Trip",
    shortName: "Manali Kasol Amritsar",
    location: "Himachal Pradesh & Punjab",
    duration: "8 Nights 9 Days",
    price: 11999,
    category: "himalayan",
    departureCity: "Ahmedabad / Vadodara / Surat",
    ageLimit: "12–35 years only",
    bookingUrl: "https://youthcamping.online/itineraries/bookings/new?lang=en&trip_key=140500",
    description: "Get ready for an unforgettable journey through Northern India! Begin with a train journey to Jalandhar. Explore cultural richness at Wagah Border and the serene Golden Temple in Amritsar. Next, venture to Kasol for riverside camping and immerse yourself in the vibrant Kasol market.",
    highlights: [
      "Wagah Border ceremony",
      "Golden Temple Amritsar & langar prasad",
      "Riverside camping in Kasol",
      "Manikaran Gurudwara hot springs (5700 ft)",
      "Bijli Mahadev Trek (360° Himalayan views)",
      "Atal Tunnel — Manali to Lahaul",
      "River rafting in Kullu"
    ],
    inclusions: [
      "Train journey Ahmedabad ↔ Jalandhar (Sleeper class)",
      "All road transfers by Tempo Traveller",
      "8 nights accommodation (camping/cottage/hotel)",
      "Meals (Breakfast & Dinner as per itinerary)",
      "Trip leader throughout",
      "Bijli Mahadev trek",
      "River rafting in Kullu"
    ],
    exclusions: [
      "Personal expenses",
      "Entry tickets",
      "Adventure activities not mentioned",
      "Travel insurance",
      "GST"
    ],
    heroImage: "https://vl-prod-static.b-cdn.net/system/images/000/888/076/6f012c2f939c45fd491d86b3d33b0cbb/original/IMG_3309.jpg",
    images: [
      "https://vl-prod-static.b-cdn.net/system/images/000/888/076/6f012c2f939c45fd491d86b3d33b0cbb/original/IMG_3309.jpg"
    ],
    slug: "manali-kasol-amritsar",
    itinerary: [
      { day: 1, title: "Train Journey from Ahmedabad/Vadodara/Surat to Jalandhar/Una", location: "Ahmedabad → Train", activities: ["Meet YouthCamping rep at Sabarmati", "Group briefing"] },
      { day: 2, title: "Arrival at Jalandhar & Drive to Amritsar", location: "Amritsar", activities: ["Wagah Border", "Golden Temple"], meals: "Breakfast" },
      { day: 3, title: "Kasol & Parvati Valley Exploration", location: "Kasol", activities: ["Manikaran hot spring", "Chalal hike"], stay: "Riverside Camping", meals: "Breakfast, Lunch, Dinner" },
      { day: 4, title: "Bijli Mahadev Trek", location: "Bijli Mahadev", activities: ["360° Himalayan views", "Temple darshan"] },
      { day: 5, title: "Drive to Manali & Local Sightseeing", location: "Manali", activities: ["Hadimba Temple", "Old Manali cafes"], stay: "Hotel" },
      { day: 6, title: "Solang Valley & Atal Tunnel Day", location: "Solang Valley", activities: ["Atal Tunnel crossing", "Sissu village"] },
      { day: 7, title: "Kullu River Rafting & Departure", location: "Kullu", activities: ["River rafting", "Board overnight train"] },
      { day: 8, title: "Train Journey Back", location: "Train", activities: ["Scenic return journey"] },
      { day: 9, title: "Arrival at Home City", location: "Gujarat", activities: ["Trip ends"] }
    ]
  },
  {
    id: "spiti-valley-road-trip",
    title: "Spiti Valley Road Trip",
    shortName: "Spiti Valley",
    location: "Himachal Pradesh",
    duration: "10 Nights 11 Days",
    price: 21499,
    category: "himalayan",
    departureCity: "Sabarmati / Gandhinagar",
    description: "Explore quaint villages like Sangla, Chitkul, and Tabo. Discover ancient monasteries and stunning landscapes. Visit Kaza, home to Hikkim, Komic, Langza, and Kibber, and don't miss the breathtaking Chandrataal Lake.",
    highlights: [
      "Chitkul — last village on Indo-Tibetan border",
      "1000-year-old Tabo Monastery",
      "Dhankar Village & Gompa",
      "Hikkim — world's highest post office",
      "Chandrataal Lake",
      "Atal Tunnel crossing"
    ],
    inclusions: [
      "Train Ahmedabad ↔ Chandigarh",
      "Road transfers (Tempo Traveller/Taxi)",
      "10 nights accommodation",
      "Meals as per itinerary",
      "Trip leader"
    ],
    heroImage: "https://vl-prod-static.b-cdn.net/system/images/000/751/384/13bebee8f5dfb67ee1756619de11e44a/original/Untitled_design__50_.png",
    images: [
      "https://vl-prod-static.b-cdn.net/system/images/000/751/384/13bebee8f5dfb67ee1756619de11e44a/original/Untitled_design__50_.png"
    ],
    slug: "spiti-valley-road-trip",
    itinerary: [
      { day: 1, title: "Ahmedabad to Chandigarh", location: "Train", activities: ["Boarding train"] },
      { day: 2, title: "Drive to Shimla", location: "Shimla", activities: ["Mall Road walk"], stay: "Hotel" },
      { day: 3, title: "Shimla to Chitkul", location: "Chitkul", activities: ["Kinnaur Valley drive"], stay: "Cottage", meals: "Breakfast, Dinner" },
      { day: 4, title: "Chitkul to Tabo", location: "Tabo", activities: ["Khab confluence", "Nako Lake"], stay: "Homestay", meals: "Breakfast, Dinner" },
      { day: 5, title: "Tabo to Kaza", location: "Kaza", activities: ["Tabo Monastery", "Dhankar Gompa"], stay: "Homestay", meals: "Breakfast, Dinner" },
      { day: 6, title: "Spiti Wonders", location: "Kaza", activities: ["Key Monastery", "Hikkim Post Office"], stay: "Homestay", meals: "Breakfast, Dinner" },
      { day: 7, title: "Kaza to Chandrataal", location: "Chandrataal", activities: ["Drive to lake", "Camping"], stay: "Camp" },
      { day: 8, title: "Chandrataal to Manali", location: "Manali", activities: ["Atal Tunnel crossing"], stay: "Hotel" },
      { day: 9, title: "Manali Local", location: "Manali", activities: ["Hadimba Temple", "Mall Road"] },
      { day: 10, title: "Return Drive", location: "Chandigarh", activities: ["Overnight drive"] },
      { day: 11, title: "Arrival Home", location: "Gujarat", activities: ["Trip concludes"] }
    ]
  },
  {
    id: "jannat-e-kashmir",
    title: "Jannat-e-Kashmir",
    shortName: "Kashmir",
    location: "Kashmir",
    duration: "9 Nights 10 Days",
    price: 22499,
    category: "himalayan",
    departureCity: "Ahmedabad",
    description: "Kashmir, referred to as 'Paradise on Earth,' renowned for snow-capped mountains, lush valleys, and iconic Dal Lake with floating gardens and houseboats.",
    highlights: ["Dal Lake houseboat stay", "Shikara ride", "Gulmarg gondola", "Pahalgam shepherd valley", "Sonamarg gold meadow"],
    heroImage: "https://vl-prod-static.b-cdn.net/system/images/000/795/283/de9764fba137abc8fbbb2be98bf0a119/original/27121997__27_.jpg",
    images: ["https://vl-prod-static.b-cdn.net/system/images/000/795/283/de9764fba137abc8fbbb2be98bf0a119/original/27121997__27_.jpg"],
    slug: "jannat-e-kashmir",
    itinerary: [
      { day: 1, title: "Ahmedabad to Jammu", location: "Train", activities: ["Journey begins"] },
      { day: 2, title: "Drive to Srinagar", location: "Srinagar", activities: ["Jammu arrival", "Houseboat check-in"] },
      { day: 3, title: "Srinagar Local", location: "Srinagar", activities: ["Mughal Gardens", "Shikara Ride"], stay: "Houseboat" },
      { day: 4, title: "Gulmarg Trip", location: "Gulmarg", activities: ["Gondola Phase 1 & 2"] },
      { day: 5, title: "Pahalgam Trip", location: "Pahalgam", activities: ["Betaab Valley", "Lidder River"] },
      { day: 6, title: "Sonamarg Trip", location: "Sonamarg", activities: ["Thajiwas Glacier"] },
      { day: 7, title: "Free Day", location: "Srinagar", activities: ["Shopping at Lal Chowk"] },
      { day: 8, title: "Jammu Return", location: "Jammu", activities: ["Drive back to Jammu"] },
      { day: 9, title: "Jammu to Ahmedabad", location: "Train", activities: ["Return train"] },
      { day: 10, title: "Home", location: "Ahmedabad", activities: ["Arrival"] }
    ]
  },
  {
    id: "kedarnath-badrinath",
    title: "Kedarnath Badrinath — Tungnath & Rishikesh",
    shortName: "Kedarnath Badrinath",
    location: "Uttarakhand",
    duration: "8 Nights 7 Days",
    price: 19499,
    category: "spiritual",
    departureCity: "Delhi",
    description: "Sacred Chota Char Dham and Panch Kedar pilgrimage. Breathtaking views and spiritual peace at world's highest Shiva temple.",
    highlights: ["Ganga Aarti Rishikesh", "Kedarnath 21km Trek", "Tungnath (highest Shiva temple)", "Badrinath Temple", "Mana Village"],
    heroImage: "https://vl-prod-static.b-cdn.net/system/images/000/748/925/95ce9359f68bd2d93dee6aa2e3a18d17/original/Untitled_design__11_.png",
    images: ["https://vl-prod-static.b-cdn.net/system/images/000/748/925/95ce9359f68bd2d93dee6aa2e3a18d17/original/Untitled_design__11_.png"],
    slug: "kedarnath-badrinath",
    itinerary: [
      { day: 0, title: "Delhi Departure", location: "Delhi", activities: ["11 PM reporting"] },
      { day: 1, title: "Rishikesh Arrival", location: "Rishikesh", activities: ["Ganga dip", "Ganga Aarti"], stay: "Rishikesh", meals: "Breakfast & Dinner" },
      { day: 2, title: "Devprayag to Sitapur", location: "Sitapur", activities: ["River confluences", "Dharidevi Temple"], stay: "Sitapur", meals: "Breakfast & Dinner" },
      { day: 3, title: "Kedarnath Trek", location: "Kedarnath", activities: ["21km trek", "Evening Aarti"], stay: "Kedarnath", meals: "Breakfast & Dinner" },
      { day: 4, title: "Trek Down", location: "Sitapur", activities: ["Morning darshan", "Descent"], stay: "Sitapur", meals: "Breakfast & Dinner" },
      { day: 5, title: "Tungnath Trek", location: "Chopta", activities: ["Highest Shiva temple", "Chandrashila"], stay: "Chopta", meals: "Breakfast & Dinner" },
      { day: 6, title: "Badrinath Darshan", location: "Badrinath", activities: ["Temple visit", "Mana Village"], stay: "Badrinath", meals: "Breakfast & Dinner" },
      { day: 7, title: "Return to Delhi", location: "Delhi", activities: ["Overnight drive"], meals: "Breakfast" }
    ]
  }
];

async function main() {
  console.log('Seeding Trips via Prisma...');
  
  for (const tripData of trips) {
    const { id, ...rest } = tripData;
    await prisma.trip.upsert({
      where: { slug: rest.slug },
      update: { ...rest, price: parseFloat(rest.price) },
      create: { ...rest, price: parseFloat(rest.price) },
    });
    console.log(`✅ Seeded: ${rest.title}`);
  }
  
  console.log('🎉 Successfully seeded trips!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
