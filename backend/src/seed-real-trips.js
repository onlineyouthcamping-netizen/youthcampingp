const mongoose = require('mongoose');
require('dotenv').config();

const Trip = require('./models/Trip');

const trips = [
  {
    id: "manali-kasol-amritsar",
    title: "Manali Kasol Amritsar Backpacking Trip",
    shortName: "Manali Kasol Amritsar",
    originalUrl: "https://www.youthcamping.in/tours/manali-kasol-amritsar-adventure-trip-140500",
    location: "Himachal Pradesh & Punjab",
    duration: "8 Nights 9 Days",
    price: 11999,
    category: "himalayan",
    departureCity: "Ahmedabad / Vadodara / Surat",
    ageLimit: "12–35 years only",
    bookingUrl: "https://www.youthcamping.in/itineraries/bookings/new?lang=en&trip_key=140500",
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
    images: [
      "https://vl-prod-static.b-cdn.net/system/images/000/888/076/6f012c2f939c45fd491d86b3d33b0cbb/original/IMG_3309.jpg}"
    ],
    gallery: [{url: 
      "https://vl-prod-static.b-cdn.net/system/images/000/888/076/6f012c2f939c45fd491d86b3d33b0cbb/original/IMG_3309.jpg}"
    ],
    tags: ["backpacking", "himalayan", "kasol", "amritsar", "manali", "from-gujarat"],
    isFeatured: true,
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
    originalUrl: "https://www.youthcamping.in/tours/spiti-valley-road-trip-137856",
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
    images: [
      "https://vl-prod-static.b-cdn.net/system/images/000/751/384/13bebee8f5dfb67ee1756619de11e44a/original/Untitled_design__50_.png}"
    ],
    gallery: [{url: 
      "https://vl-prod-static.b-cdn.net/system/images/000/751/383/f9e9b476346ed8ae84d29f5837f6e093/original/Untitled_design__51_.png}",
      "https://vl-prod-static.b-cdn.net/system/images/000/751/385/0b859075c5accb9bb1decb348aa419ad/original/Untitled_design__49_.png}"
    ],
    tags: ["road-trip", "spiti", "himalayan", "chandratal"],
    isFeatured: true,
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
    originalUrl: "https://www.youthcamping.in/tours/magical-kashmir-backpacking-trip-138723",
    location: "Kashmir",
    duration: "9 Nights 10 Days",
    price: 22499,
    category: "himalayan",
    departureCity: "Ahmedabad",
    description: "Kashmir, referred to as 'Paradise on Earth,' renowned for snow-capped mountains, lush valleys, and iconic Dal Lake with floating gardens and houseboats.",
    highlights: ["Dal Lake houseboat stay", "Shikara ride", "Gulmarg gondola", "Pahalgam shepherd valley", "Sonamarg gold meadow"],
    images: ["https://vl-prod-static.b-cdn.net/system/images/000/795/283/de9764fba137abc8fbbb2be98bf0a119/original/27121997__27_.jpg}"],
    gallery: [{url: 
      "https://vl-prod-static.b-cdn.net/system/images/000/751/331/e74c08989c1a3ac852770bc07aab60f2/original/Untitled_design__34_.png}",
      "https://vl-prod-static.b-cdn.net/system/images/000/751/332/a846b84a4f8f9bba8383a2266cf3b96d/original/Untitled_design__33_.png}"
    ],
    tags: ["kashmir", "houseboat", "nature", "paradise"],
    isFeatured: true,
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
    originalUrl: "https://www.youthcamping.in/tours/kedarnath-tungnath-rishikesh-multiple-starting-points-as-addons-138288",
    location: "Uttarakhand",
    duration: "8 Nights 7 Days",
    price: 19499,
    category: "spiritual",
    departureCity: "Delhi",
    description: "Sacred Chota Char Dham and Panch Kedar pilgrimage. Breathtaking views and spiritual peace at world's highest Shiva temple.",
    highlights: ["Ganga Aarti Rishikesh", "Kedarnath 21km Trek", "Tungnath (highest Shiva temple)", "Badrinath Temple", "Mana Village"],
    images: ["https://vl-prod-static.b-cdn.net/system/images/000/748/925/95ce9359f68bd2d93dee6aa2e3a18d17/original/Untitled_design__11_.png}"],
    gallery: [{url: "https://vl-prod-static.b-cdn.net/system/images/000/748/920/5abeca5343adce67a22013a929647f71/original/Untitled_design__12_.png}"],
    tags: ["spiritual", "kedarnath", "chardham", "trek"],
    isFeatured: true,
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
  },
  {
    id: "leh-ladakh-bike-expedition-2026",
    title: "Leh Ladakh Bike Expedition 2026",
    shortName: "Ladakh Bike",
    originalUrl: "https://www.youthcamping.in/tours/leh-to-leh-bike-expedition-2026-youth-camping-164365",
    location: "Ladakh",
    duration: "6 Nights 7 Days",
    price: 18999,
    category: "adventure-bike",
    departureCity: "Leh",
    description: "Starting and ending in Leh, this journey takes you across world's highest motorable roads, stunning valleys, and crystal-clear lakes.",
    highlights: ["Khardung La Pass", "Nubra Valley desert", "Pangong Lake Tso", "Magnetic Hill", "Shanti Stupa"],
    images: ["https://vl-prod-static.b-cdn.net/system/images/000/888/077/e84148f8d1adacaa5dc96e8f834b8cdd/original/t2-graphy-IJfpVYlRv5I-unsplash.jpg}"],
    gallery: [{url: "https://vl-prod-static.b-cdn.net/system/images/000/888/133/bae231ef3cdd69e7dc0d467e3ba04cbe/original/Website_Itinerary_Ohotos__4_.jpg}"],
    tags: ["bike", "ladakh", "adventure", "roadtrip"],
    isFeatured: true,
    itinerary: [
        { day: 1, title: "Leh Arrival", location: "Leh", activities: ["Acclimatization day"], meals: "Dinner" },
        { day: 2, title: "Leh Sightseeing", location: "Leh", activities: ["Magnetic Hill", "Sangam"], meals: "Breakfast & Dinner" },
        { day: 3, title: "Khardung La to Nubra", location: "Nubra", activities: ["Khardung La (18,380 ft)", "Hunder Dunes"], meals: "Breakfast & Dinner" },
        { day: 4, title: "Turtuk Village", location: "Turtuk", activities: ["Last border village"], meals: "Breakfast & Dinner" },
        { day: 5, title: "Pangong Lake", location: "Pangong", activities: ["Shyok valley drive", "Lake sunset"], meals: "Breakfast & Dinner" },
        { day: 6, title: "Return to Leh", location: "Leh", activities: ["Chang La Pass", "Thiksey Monastery"], meals: "Breakfast & Dinner" },
        { day: 7, title: "Departure", location: "Leh Airport", activities: ["Drop-off"] }
    ]
  },
  {
    id: "winter-spiti-road-trip",
    title: "Winter Spiti Road Trip",
    shortName: "Winter Spiti",
    originalUrl: "https://www.youthcamping.in/tours/winter-spiti-156526",
    location: "Spiti Valley",
    duration: "9 Nights 10 Days",
    price: 19999,
    category: "himalayan",
    departureCity: "Ahmedabad",
    description: "Spiti in winter is a world straight out of a postcard — blanketed in pristine white snow, frozen rivers, and towering peaks.",
    highlights: ["Frozen Spiti River", "Key Monastery in snow", "Hikkim (14k ft)", "Stargazing", "Snowy Manali"],
    images: ["https://vl-prod-static.b-cdn.net/system/images/000/862/062/b7cb9dc7ccc9fe863f0f009c4fe1746f/original/Website_Itinerary_Ohotos__2_.png}"],
    gallery: [{url: "https://vl-prod-static.b-cdn.net/system/images/000/862/061/9b72e8a2d0b5f7708ed73d1c712eed1a/original/Website_Itinerary_Ohotos__3_.png}"],
    tags: ["winter", "spiti", "snow", "offbeat"],
    isFeatured: false,
    itinerary: [
        { day: 1, title: "Gujarat to Chandigarh", location: "Train", activities: ["Overnight train"] },
        { day: 2, title: "Shimla Arrive", location: "Shimla", activities: ["Mall Road"] },
        { day: 3, title: "Kinnaur Valley", location: "Sangla", activities: ["Chitkul in winter"] },
        { day: 4, title: "Frozen Nako", location: "Tabo", activities: ["Frozen Nako Lake"] },
        { day: 5, title: "Kaza Arrival", location: "Kaza", activities: ["White Spiti arrival"] },
        { day: 6, title: "High Villages", location: "Kaza", activities: ["Hikkim", "Key in snow"] }
    ]
  },
  {
    id: "kerala-getaway",
    title: "Kerala Getaway",
    shortName: "Kerala",
    originalUrl: "https://www.youthcamping.in/tours/kerala-getaway-165724",
    location: "Kerala",
    duration: "4 Nights 5 Days",
    price: 15999,
    category: "south-india",
    departureCity: "Kochi",
    description: "Experience 'God's Own Country' — from misty Munnar tea plantations to Alleppey backwaters on a houseboat.",
    highlights: ["Munnar Tea Plantations", "Periyar Sanctuary", "Alleppey Houseboat", "Waterfalls enroute"],
    images: ["https://vl-prod-static.b-cdn.net/system/images/000/899/117/e79b48de54e83646c865c90dee281eb2/original/ravi-sangar-dfB4L6PfS4w-unsplash__1_.jpg}"],
    gallery: [{url: "https://vl-prod-static.b-cdn.net/system/images/000/899/117/e79b48de54e83646c865c90dee281eb2/original/ravi-sangar-dfB4L6PfS4w-unsplash__1_.jpg}"],
    tags: ["kerala", "houseboat", "nature", "coastal"],
    isFeatured: false,
    itinerary: [
        { day: 1, title: "Munnar Drive", location: "Munnar", activities: ["Waterfalls enroute"], stay: "Hotel", meals: "Dinner" },
        { day: 2, title: "Munnar Local", location: "Munnar", activities: ["Tea plantations", "National Park"], meals: "Breakfast & Dinner" },
        { day: 3, title: "Thekkady Spice", location: "Thekkady", activities: ["Spice markets", "Safari"], meals: "Breakfast & Dinner" },
        { day: 4, title: "Alleppey Backwaters", location: "Alleppey", activities: ["Houseboat cruise"], stay: "Houseboat", meals: "Breakfast, Lunch & Dinner" },
        { day: 5, title: "Kochi Drop", location: "Kochi", activities: ["Airport drop"], meals: "Breakfast" }
    ]
  },
  {
    id: "shimla-manali-dalhousie",
    title: "Shimla Manali Dalhousie Dharamshala",
    shortName: "HP Grand Circuit",
    originalUrl: "https://www.youthcamping.in/tours/shimla-manali-dalhousie-dharamshala-155815",
    location: "Himachal Pradesh",
    duration: "9 Nights 10 Days",
    price: 16999,
    category: "himalayan",
    departureCity: "Ahmedabad",
    description: "Colonial charm of Shimla, snow of Manali, spiritual Dharamshala, and serene Dalhousie.",
    highlights: ["Mini Switzerland Khajjiar", "Dalai Lama Temple", "Solang Valley", "Colonial Shimla"],
    images: ["https://vl-prod-static.b-cdn.net/system/images/000/856/207/68ae0d6c7bcc0a7716d1c860e7f2c58d/original/42294194395"],
    tags: ["family", "himalayas", "longtrip", "hp"],
    itinerary: [
        { day: 1, title: "Gujarat to CDG", location: "Train", activities: ["Sleeper journey"] },
        { day: 2, title: "Dharamshala", location: "McLeodganj", activities: ["Tibetan Market"] },
        { day: 3, title: "Dalhousie", location: "Dalhousie", activities: ["Bhagsu fall"] },
        { day: 4, title: "Khajjiar", location: "Khajjiar", activities: ["Mini Switzerland meadows"] }
    ]
  },
  {
    id: "shimla-manali-kullu",
    title: "Shimla Manali Kullu",
    shortName: "Classic Himachal",
    originalUrl: "https://www.youthcamping.in/tours/shimla-manali-kullu-138567",
    location: "Himachal Pradesh",
    duration: "7 Nights 8 Days",
    price: 13999,
    category: "himalayan",
    departureCity: "Ahmedabad",
    description: "Classic circuit covering colonial Shimla, adventure Manali, and scenic Kullu Valley.",
    highlights: ["Mall Road", "Hadimba Temple", "River Rafting", "Atal Tunnel"],
    images: ["https://vl-prod-static.b-cdn.net/system/images/000/795/284/3bba832671671da87e0f23ce9864e6c1/original/27121997__26_.jpg}"],
    tags: ["beginner", "budget", "himachal"],
    itinerary: [
        { day: 1, title: "Train Journey", location: "Train", activities: ["Gujarat to Punjab"] },
        { day: 2, title: "Shimla Arrive", location: "Shimla", activities: ["Mall Road walk"] },
        { day: 3, title: "Shimla City", location: "Shimla", activities: ["Jakhu Temple"] }
    ]
  },
  {
    id: "bhrigu-lake-summer",
    title: "Manali Kasol Amritsar (Summer 2026)",
    shortName: "Bhrigu Lake Variant",
    originalUrl: "https://www.youthcamping.in/tours/manali-kasol-amritsar-trip-137683",
    location: "Himachal & Punjab",
    duration: "9 Nights 10 Days",
    price: 13999,
    category: "himalayan",
    departureCity: "Ahmedabad",
    description: "Summer special including Bhrigu Lake Trek — a high-altitude alpine lake at 14,100 ft.",
    highlights: ["Bhrigu Lake (14k ft)", "Alpine Meadows", "Kasol Vibe", "Golden Temple"],
    images: ["https://vl-prod-static.b-cdn.net/system/images/000/887/000/placeholder/manali_kasol.jpg}"],
    tags: ["trekking", "summer", "backpacking"],
    itinerary: [
        { day: 1, title: "Gujarat to Punjab", location: "Train", activities: ["Group bonding"] },
        { day: 5, title: "Bhrigu Trek Base", location: "Vashisht", activities: ["Cimbing meadows"] },
        { day: 6, title: "Summit 14k ft", location: "Bhrigu Lake", activities: ["High lake summit"] }
    ]
  },
  {
    id: "kedarnath-tungnath-basic",
    title: "Kedarnath Tungnath & Rishikesh Trip",
    shortName: "Basic Kedarnath",
    originalUrl: "https://www.youthcamping.in/tours/kedarnath-tungnath-rishikesh-backpacking-trip",
    location: "Uttarakhand",
    duration: "5 Nights 6 Days",
    price: 14999,
    category: "spiritual",
    departureCity: "Delhi",
    description: "Focussed spiritual trek covering the essential Kedarnath and Tungnath temples.",
    highlights: ["Kedarnath Temple", "Ganga Aarti", "Highest Shiva Temple"],
    images: ["https://vl-prod-static.b-cdn.net/system/images/000/748/931/95ce9359f68bd2d93dee6aa2e3a18d17/original/Untitled_design__11_.png}"],
    tags: ["spiritual", "trek", "efficient"],
    itinerary: [
        { day: 1, title: "Rishikesh Aarti", location: "Rishikesh", activities: ["Spiritual start"] },
        { day: 3, title: "Kedar Trek", location: "Kedarnath", activities: ["21km trek ascent"] }
    ]
  }
];

async function seedTrips() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected for Complete Trip Seeding...');

    await Trip.deleteMany({});
    console.log('Cleared existing trips');

    for (const tripData of trips) {
      const trip = new Trip(tripData);
      await trip.save();
      console.log(`✅ Seeded: ${trip.title} — ₹${trip.price}`);
    }

    console.log('\n🎉 Successfully seeded 11 trips with real CDN images!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedTrips();
