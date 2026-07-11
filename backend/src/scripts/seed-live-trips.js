const { prisma } = require('../lib/prisma');
const slugify = require('slugify');

const SCRAPED_TRIPS = [
  {
    "title": "Manali Kasol Amritsar Backpacking Trip",
    "price": 11999,
    "duration": "8 Nights 9 Days",
    "location": "Manali, Kasol, Amritsar",
    "category": "Backpacking",
    "description": "Get ready for an unforgettable journey through Northern India! Begin with a train journey from your city to Jalandhar. Explore the cultural richness at Wagah Border and the serene beauty of the Golden Temple in Amritsar. Next, venture to Kasol for a relaxing riverside camping experience and immerse yourself in the vibrant atmosphere of the Kasol market...",
    "heroImage": "https://images.unsplash.com/photo-1597037750734-450f6f406560?q=80&w=2000",
    "itinerary": [
      {"day": 1, "title": "Train Journey to Firozpur/Kotkapura"},
      {"day": 2, "title": "Arrival at Firozpur/Kotkapura & Drive to Amritsar"},
      {"day": 3, "title": "Day for Kasol & Parvati valley exploration"},
      {"day": 4, "title": "Start Bijli Mahadev Trek"},
      {"day": 5, "title": "Rafting & Paragliding at Manali"},
      {"day": 6, "title": "Bikeride to Solang Valley - Atal tunnel - Sissu"},
      {"day": 7, "title": "Manali Sightseeing & Jogini Waterfall"},
      {"day": 8, "title": "Return Train Journey"},
      {"day": 9, "title": "Arrive at Destination"}
    ],
    "highlights": ["Bijli Mahadev trek", "Jogini Waterfall Trek", "Mall Road", "Hidimba Temple", "Golden Temple & Wagah border", "River Rafting", "Atal Tunnel & Sissu Lake"]
  },
  {
    "title": "Winter Spiti Road Trip",
    "price": 19999,
    "duration": "9 Nights 10 Days",
    "location": "Spiti Valley",
    "category": "Road Trip",
    "description": "Spiti in winter is a world straight out of a postcard—blanketed in pristine white snow, frozen rivers, and towering Himalayan peaks. The valley transforms into a serene, untouched paradise where ancient monasteries stand tall amidst snow-capped mountains...",
    "heroImage": "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c?q=80&w=2000",
    "itinerary": [
      {"day": 1, "title": "Train Journey to Chandigarh"},
      {"day": 2, "title": "Chandigarh to Narkanda"},
      {"day": 3, "title": "Narkanda to Chitkul | Stay in Sangla"},
      {"day": 4, "title": "Sangla to Tabo via Khab Sangam & Nako Lake"},
      {"day": 5, "title": "Tabo to Kaza via Lingti Falls, Key & Chicham"},
      {"day": 6, "title": "Hikkim, Komic & Langza"},
      {"day": 7, "title": "Kaza to Kalpa via Dhankar"},
      {"day": 8, "title": "Kalpa to Shimla | Local Sightseeing"},
      {"day": 9, "title": "Shimla to Chandigarh | Train Home"},
      {"day": 10, "title": "Arrival at Destination"}
    ],
    "highlights": ["Chicham Bridge", "World's Highest Post Office - Hikkim", "Key and Dhankar Monasteries", "Authentic Homestay Experience"]
  },
  {
    "title": "Spiti Valley Road Trip",
    "price": 21499,
    "duration": "10 Nights 11 Days",
    "location": "Spiti Valley",
    "category": "Road Trip",
    "description": "Experience an amazing journey through Himachal Pradesh! Explore quaint villages like Sangla, Chitkul, and Tabo. Discover ancient monasteries and stunning landscapes. Visit Kaza, home to unique places like Hikkim, Komic, Langza, and Kibber, and don't miss the breathtaking Chandrataal Lake.",
    "heroImage": "https://images.unsplash.com/photo-1544735716-392fe2709496?q=80&w=2000",
    "itinerary": [
      {"day": 1, "title": "Train Journey Ahmedabad to Chandigarh"},
      {"day": 2, "title": "Drive to Shimla & day tour"},
      {"day": 3, "title": "Shimla to Chitkul"},
      {"day": 4, "title": "Chitkul to Tabo via Nako Lake"},
      {"day": 5, "title": "Explore Tabo and Dhankar Village"},
      {"day": 6, "title": "Explore Key, Komic, Langza, and Hikkim"},
      {"day": 7, "title": "Visit Kibber and Chicham, then Chandra Taal"},
      {"day": 8, "title": "Journey to Manali through the Atal Tunnel"},
      {"day": 9, "title": "Explore Manali & adventure activities"},
      {"day": 10, "title": "Reach Jalandhar & board return train"},
      {"day": 11, "title": "Arrival in Ahmedabad"}
    ],
    "highlights": ["Chitkul & Tabo villages", "Dhankar Monastery", "Chandrataal Lake", "Atal Tunnel"]
  },
  {
    "title": "Shimla Manali Dalhousie Dharamshala",
    "price": 16999,
    "duration": "9 Nights 10 Days",
    "location": "Himachal Pradesh",
    "category": "Backpacking",
    "description": "A stunning 10-day journey through the majestic hills of Himachal Pradesh — from the colonial charm of Shimla, the snowy adventures of Manali, the spiritual calm of Dharamshala, to the pine-clad serenity of Dalhousie.",
    "heroImage": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2000",
    "itinerary": [
      {"day": 1, "title": "Train Journey to Chandigarh/Jalandhar"},
      {"day": 2, "title": "Reach Chandigarh and Drive to McLeodganj"},
      {"day": 3, "title": "Explore McLeodganj & Drive to Dalhousie"},
      {"day": 4, "title": "Explore Khajjiar Drive to Manali"},
      {"day": 5, "title": "Rafting & Paragliding"},
      {"day": 6, "title": "Solang valley Atal tunnel sissu"},
      {"day": 7, "title": "Jogini Waterfall & Manali Sightseeing"},
      {"day": 8, "title": "Kullu to Shimla sightseeing"},
      {"day": 9, "title": "Departure From Jalandhar/Chandigarh"},
      {"day": 10, "title": "Arrive your city"}
    ],
    "highlights": ["Mall Road Shimla", "Jakhoo Temple", "Khajjiar - Mini Switzerland", "Dharamshala Stadium"]
  },
  {
    "title": "Kedarnath Badrinath - Tungnath & Rishikesh",
    "price": 19499,
    "duration": "8 Nights 7 Days",
    "location": "Uttarakhand",
    "category": "Pilgrimage",
    "description": "A sacred pilgrimage to Kedarnath, Badrinath, Tungnath, and Rishikesh. Visit two of the twelve Jyotirlingas and explore the spiritual heart of the Garhwal Himalayas.",
    "heroImage": "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c?q=80&w=2000",
    "itinerary": [
      {"day": 1, "title": "Haridwar – Rishikesh – Ganga Aarti"},
      {"day": 2, "title": "Rishikesh – Devprayag – Rudraprayag – Sitapur"},
      {"day": 3, "title": "Kedarnath Trek"},
      {"day": 4, "title": "Kedarnath – Trek Down – Sitapur"},
      {"day": 5, "title": "Chopta – Tungnath Trek"},
      {"day": 6, "title": "Badrinath – Mana Village"},
      {"day": 7, "title": "Badrinath – Return to Delhi"}
    ],
    "highlights": ["Kedarnath Dham Trek", "Badrinath Temple", "Tungnath - Highest Shiva Temple", "Rishikesh Ganga Aarti"]
  },
  {
    "title": "Leh Ladakh Bike Expedition 2026",
    "price": 18999,
    "duration": "6 Nights 7 Days",
    "location": "Leh, Ladakh",
    "category": "Adventure",
    "description": "Experience the raw beauty of the Himalayas on this thrilling bike expedition. Ride through Khardung La, Nubra Valley, Turtuk, and Pangong Lake.",
    "heroImage": "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=2000",
    "itinerary": [
      {"day": 1, "title": "Arrival in Leh & Acclimatization"},
      {"day": 2, "title": "Leh Local Sightseeing"},
      {"day": 3, "title": "Leh to Nubra Valley via Khardung La"},
      {"day": 4, "title": "Nubra Valley to Turtuk Village"},
      {"day": 5, "title": "Nubra Valley to Pangong Lake"},
      {"day": 6, "title": "Pangong Lake to Leh"},
      {"day": 7, "title": "Departure from Leh"}
    ],
    "highlights": ["Khardung La Pass", "Nubra Valley Camels", "Turtuk Border Village", "Pangong Tso Blue Waters"]
  },
  {
    "title": "Jannat-e-Kashmir",
    "price": 22499,
    "duration": "9 Nights 10 Days",
    "location": "Srinagar, Kashmir",
    "category": "Leisure",
    "description": "Kashmir, often referred to as 'Paradise on Earth,' offers majestic snow-capped mountains, lush green valleys, and serene lakes like the iconic Dal Lake.",
    "heroImage": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=2000",
    "itinerary": [
      {"day": 1, "title": "Arrival in Srinagar & Houseboat Stay"},
      {"day": 2, "title": "Srinagar Local Mughal Gardens"},
      {"day": 3, "title": "Day trip to Sonmarg"},
      {"day": 4, "title": "Day trip to Gulmarg & Gondola Ride"},
      {"day": 5, "title": "Srinagar to Pahalgam"},
      {"day": 6, "title": "Explore Pahalgam - Betaab Valley"},
      {"day": 7, "title": "Pahalgam to Srinagar"},
      {"day": 8, "title": "Shopping & Shikara Ride"},
      {"day": 9, "title": "Departure from Srinagar"}
    ],
    "highlights": ["Dal Lake Houseboat", "Gulmarg Gondola", "Betaab Valley Pahalgam", "Shikara Ride"]
  },
  {
    "title": "Kerala Getaway",
    "price": 15999,
    "duration": "4 Nights 5 Days",
    "location": "Kerala",
    "category": "Leisure",
    "description": "Experience the magic of 'God’s Own Country' – Kerala. From the misty tea plantations of Munnar to the wildlife-rich forests of Thekkady and backwaters of Alleppey.",
    "heroImage": "https://images.unsplash.com/photo-1602216056096-3c40cc0c9944?q=80&w=2000",
    "itinerary": [
      {"day": 1, "title": "Kochi to Munnar"},
      {"day": 2, "title": "Munnar Sightseeing"},
      {"day": 3, "title": "Munnar to Thekkady"},
      {"day": 4, "title": "Thekkady to Alleppey Houseboat"},
      {"day": 5, "title": "Alleppey to Kochi Departure"}
    ],
    "highlights": ["Munnar Tea Gardens", "Periyar Wildlife Sanctuary", "Alleppey Houseboat Stay", "Backwater Cruising"]
  }
];

async function seed() {
  console.log("🚀 Starting Prisma Seed with live trip data...");
  
  try {
    // We'll use upsert to avoid breaking foreign key constraints with existing bookings
    // const deleted = await prisma.trip.deleteMany({});
    // console.log(`🗑️ Cleared ${deleted.count} existing trips.`);

    for (const tripData of SCRAPED_TRIPS) {
      const slug = slugify(tripData.title, { lower: true, strict: true });
      
      const tripUpdateData = {
        title: tripData.title,
        price: tripData.price,
        location: tripData.location,
        duration: tripData.duration,
        description: tripData.description,
        category: tripData.category.toLowerCase(),
        heroImage: tripData.heroImage,
        images: [tripData.heroImage],
        itinerary: tripData.itinerary,
        highlights: tripData.highlights,
        status: "published",
        isActive: true,
        inclusions: ["Accommodation", "Transfers", "Breakfast & Dinner", "Trip Captain", "Sightseeing"],
        exclusions: ["Lunch", "Personal Expenses", "Entry Tickets", "GST 5%"],
        availableDates: [
          { date: "2026-05-15", capacity: 20 },
          { date: "2026-06-10", capacity: 20 },
          { date: "2026-07-05", capacity: 20 }
        ],
        travelOptions: [
          { label: "Standard Bus/Train", priceDelta: 0 },
          { label: "Semi-Sleeper Volvo", priceDelta: 1500 },
          { label: "AC Sleeper", priceDelta: 2500 }
        ],
        roomOptions: [
          { label: "Quad Sharing", priceDelta: 0 },
          { label: "Triple Sharing", priceDelta: 1200 },
          { label: "Double Sharing", priceDelta: 3000 }
        ]
      };

      await prisma.trip.upsert({
        where: { slug: slug },
        update: tripUpdateData,
        create: {
          ...tripUpdateData,
          slug: slug
        }
      });
      console.log(`✅ Seeded: ${tripData.title}`);
    }

    console.log("\n🌟 ALL TRIPS SEEDED SUCCESSFULLY!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
