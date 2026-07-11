const mongoose = require('mongoose');
require('dotenv').config();
const Trip = require('./models/Trip');

const tripData = {
  title: "Manali Kasol Amritsar Backpacking Trip",
  shortName: "Manali Kasol Amritsar",
  originalUrl: "https://www.youthcamping.in/tours/manali-kasol-amritsar-adventure-trip-140500",
  location: "Himachal Pradesh & Punjab",
  duration: "8 Nights 9 Days",
  price: 11999,
  category: "Backpacking",
  departureCity: "Ahmedabad / Vadodara / Surat",
  ageLimit: "12–35 years only",
  bookingUrl: "https://www.youthcamping.in/itineraries/bookings/new?lang=en&trip_key=140500",
  heroImage: "https://vl-prod-static.b-cdn.net/system/images/000/888/076/6f012c2f939c45fd491d86b3d33b0cbb/original/IMG_3309.jpg",
  description: `Get ready for an unforgettable journey through Northern India! Begin with a train journey from your city to Jalandhar. Explore the cultural richness at Wagah Border and the serene beauty of the Golden Temple in Amritsar. Next, venture to Kasol for a relaxing riverside camping experience and immerse yourself in the vibrant atmosphere of the Kasol market. Don't forget to visit the tranquil Manikaran Gurudwara and trek to the picturesque Chalal village.

Experience the breathtaking beauty of the Bijli Mahadev trek, which offers stunning views amidst lush green meadows and dense forests. Upon reaching Manali, explore its charm by visiting attractions like the Hadimba Devi Temple, Jogini Waterfall and the serene Vashisht Hot Springs. Take leisurely walks along the Mall Road, soaking in the scenic vistas.

In Manali, explore the enchanting Solang Valley, known for its picturesque landscapes and serene ambiance. Traverse the Atal Tunnel, an engineering marvel connecting Manali to the Lahaul-Spiti valley. Explore the quaint village of Sissu, nestled amidst stunning natural beauty.

To add an extra thrill to your journey, head to Kullu for exciting rafting adventures on the river. Conclude your trip with a scenic drive back to Jalandhar, before catching the train home, filled with cherished memories of your Northern India expedition.

Note: Only People of age 12 to 35 years of age are allowed to join this trip as it is a complete backpacking itinerary and runs on a schedule which is power-packed.`,

  highlights: [
    "Bijli Mahadev Trek & Jogini Waterfall Trek",
    "Mall Road & Hadimba Temple",
    "Visit the holy Golden Temple & Wagah Border in Amritsar",
    "Rope Adventure Activities & Campfire",
    "Solang Valley & Sissu Lake",
    "Hiking through forests & multiple rope adventure activities",
    "Manikaran Gurudwara",
    "Experience the Beauty of Parvati Valley",
    "Chalal Village Trek",
    "Visit Atal Tunnel (world's longest tunnel above 10000ft)",
    "Musical Night with Campfire",
    "8 KMs Long River Rafting Included",
    "Paragliding from the highest point in Kullu (paid)"
  ],

  inclusions: [
    "Meals as per the detailed itinerary",
    "Complimentary Adventurous Rope Activities",
    "Complimentary River Rafting (Sanitized Raft)",
    "Train tickets as per your package (subject to availability)",
    "Sanitized transportation in tempo traveller/bus/car from Jalandhar",
    "Govt. Certified instructors & drivers with health certificates",
    "Basic First Aid Support",
    "4 Sharing Stay in Hotel/Cottage/Tents",
    "Sanitized Accommodation in tents/cottages/hotel",
    "Kasol Parvati Valley Chalal Village Trek",
    "Team Building Games",
    "Permit Charges, Forest Entry Fees, Trek Permission, Camp Fire with Music",
    "Toll Tax, Parking Charges and driver allowance",
    "Solang Valley, Sissu, Atal Tunnel Visit (if open)",
    "Kasol Sightseeing – Manikaran Gurudwara & Kasol Market Visit",
    "Wagah Border & Golden Temple visit",
    "Bijli Mahadev Trek, Jogini Waterfall Trek & Manali Local Sightseeing"
  ],

  exclusions: [
    "Food during travelling",
    "Anything not listed above",
    "Paid Activities like paragliding & adventure activities at Solang Valley",
    "Any additional meals or stays other than mentioned in itinerary",
    "Personal Expense of any kind, anything not specifically mentioned under 'Includes'",
    "We shall not be responsible for alterations due to natural hazards, flight/train cancellation or delay, weather or political closures"
  ],

  images: [
    "https://vl-prod-static.b-cdn.net/system/images/000/888/076/6f012c2f939c45fd491d86b3d33b0cbb/original/IMG_3309.jpg",
    "https://www.youthcamping.in/system/images/000/787/631/0bb3888fc4691faec634a98da33a1830/original/Untitled_design__22_.jpg",
    "https://www.youthcamping.in/system/images/000/787/774/d87cfa734abe02e2f9f30667d5104d45/original/Untitled_design__25_.jpg",
    "https://www.youthcamping.in/system/images/000/787/877/6d489b3b6c434fe4f28cf52029f87fee/original/Untitled_design__27_.jpg",
    "https://www.youthcamping.in/system/images/000/787/617/0584482e182e9ab64e9223acc28a6ba1/original/Untitled_design__13_.jpg",
    "https://www.youthcamping.in/system/images/000/787/886/12ef64016f1d4804482c8755b751fc41/original/Untitled_design__30_.jpg"
  ],

  gallery: [
    "https://vl-prod-static.b-cdn.net/system/images/000/888/076/6f012c2f939c45fd491d86b3d33b0cbb/original/IMG_3309.jpg",
    "https://www.youthcamping.in/system/images/000/787/631/0bb3888fc4691faec634a98da33a1830/original/Untitled_design__22_.jpg",
    "https://www.youthcamping.in/system/images/000/787/774/d87cfa734abe02e2f9f30667d5104d45/original/Untitled_design__25_.jpg",
    "https://www.youthcamping.in/system/images/000/787/877/6d489b3b6c434fe4f28cf52029f87fee/original/Untitled_design__27_.jpg",
    "https://www.youthcamping.in/system/images/000/787/617/0584482e182e9ab64e9223acc28a6ba1/original/Untitled_design__13_.jpg",
    "https://www.youthcamping.in/system/images/000/787/886/12ef64016f1d4804482c8755b751fc41/original/Untitled_design__30_.jpg",
    "https://www.youthcamping.in/system/images/000/787/619/34999a34a2c2bcbdf67362800a93aa34/original/Untitled_design__11_.jpg",
    "https://www.youthcamping.in/system/images/000/787/903/c0e8d6f5037bd807569d8f872220dc32/original/Untitled_design__32_.jpg"
  ],

  tags: ["backpacking", "himalayan", "kasol", "amritsar", "manali", "from-gujarat", "rafting", "trekking"],
  isFeatured: true,
  status: "published",

  itinerary: [
    {
      day: 1,
      title: "Train Journey from Ahmedabad/Vadodara/Surat to Firozpur/Kotkapura",
      location: "Sabarmati Railway Station",
      description: "Meet the YouthCamping representative at the railway station in the morning. The contact details, timing, and exact pickup point will be shared with you via WhatsApp one day before departure. The group will gather at the Ahmedabad boarding station 1 hour before departure. Our trip leader will provide a briefing about the trip, followed by an ice-breaking session where travellers can get to know each other. This is a crucial part of the journey, as it sets the tone for the entire trip. By connecting with fellow travellers at the start, you'll build camaraderie, making the rest of the adventure even more enjoyable.",
      activities: ["Meet YouthCamping representative", "Group briefing & ice-breaking session", "Overnight train journey"],
      stay: "Train",
      meals: "",
      photos: [
        "https://www.youthcamping.in/system/images/000/787/633/7dba267328e361ea13ef20b042c6f62f/original/Untitled_design__20_.jpg",
        "https://www.youthcamping.in/system/images/000/787/634/f33dabee521f79533d40b6fe4f3af9ed/original/Untitled_design__19_.jpg"
      ]
    },
    {
      day: 2,
      title: "Arrival at Firozpur/Kotkapura & Drive to Amritsar",
      location: "Amritsar, Punjab",
      description: "Morning you will be greeted by green fields around train track in Punjab & you can try Punjabi chole kulche in breakfast. After reaching Punjab, put your luggage into a tempo traveller — all big bags will be tied on top, so separate out warm clothes & a pair of clothes for Amritsar in a small backpack. Visit Wagah Border, Golden Temple (don't miss Prasad from one of the world's largest kitchens), Jallianwala Bagh, explore Amritsar market, and taste Amritsari Kulcha. Night journey from Amritsar to Kasol around 10:00 PM — prefer light dinner if you have motion sickness.",
      activities: ["Wagah Border ceremony", "Golden Temple & Langar Prasad", "Jallianwala Bagh visit", "Amritsar market & Amritsari Kulcha", "Night drive to Kasol"],
      stay: "Overnight travel to Kasol",
      meals: "Breakfast",
      photos: [
        "https://www.youthcamping.in/system/images/000/787/631/0bb3888fc4691faec634a98da33a1830/original/Untitled_design__22_.jpg",
        "https://www.youthcamping.in/system/images/000/787/773/bceac4229abf3309e0dfea61163c1a71/original/Untitled_design__26_.jpg",
        "https://www.youthcamping.in/system/images/000/787/632/a156aadc5783dfead2f549c8211b3629/original/Untitled_design__21_.jpg"
      ]
    },
    {
      day: 3,
      title: "Day for Kasol & Parvati Valley Exploration",
      location: "Kasol, Parvati Valley",
      description: "Arrive at Kasol early morning — check-in, rest, hot breakfast & freshen up. Visit Manikaran Gurudwara located at 5700ft where you can have a sacred bath in hot springs. Enjoy a hot lunch at camp and rest for a few hours. Visit Kasol Market, explore cafes, take a short hike to Chalal Village via Parvati Valley — don't forget to click amazing photos at Chalal Bridge and visit the musical cafe. Return to camp for an exquisite dinner, camping near Parvati River under a million stars.",
      activities: ["Manikaran Gurudwara hot springs (5700ft)", "Kasol Market & cafes", "Chalal Village trek via Parvati Valley", "Chalal Bridge photos", "Musical cafe visit", "Riverside camping under stars"],
      stay: "Riverside Camping in Kasol or Cottages",
      meals: "Breakfast, Lunch, Dinner",
      photos: [
        "https://www.youthcamping.in/system/images/000/787/774/d87cfa734abe02e2f9f30667d5104d45/original/Untitled_design__25_.jpg",
        "https://www.youthcamping.in/system/images/000/787/776/0e08bf4d71b782ef7326f694868844fe/original/Untitled_design__23_.jpg",
        "https://www.youthcamping.in/system/images/000/787/775/13bf0187a5b9f05f97ca84b789aef68d/original/Untitled_design__24_.jpg"
      ]
    },
    {
      day: 4,
      title: "Start Bijli Mahadev Trek",
      location: "Bijli Mahadev, Kullu",
      description: "After having breakfast early in the morning, depart to Bijli Mahadev Base Village which is a 3-4 hour journey. Leave all your luggage in the tempo traveller and trek with a small backpack (water, snacks, raincoat) & warm clothing. At the summit, you get a breathtaking 360° view of the snow-clad Himalayas. After the trek, drive to Manali for overnight stay.",
      activities: ["Drive to Bijli Mahadev Base Village (3-4 hrs)", "Bijli Mahadev Trek", "360° Himalayan panoramic views", "Temple darshan at summit"],
      stay: "Hotel/Cottage in Manali",
      meals: "Breakfast, Packed Lunch, Dinner",
      photos: [
        "https://www.youthcamping.in/system/images/000/787/877/6d489b3b6c434fe4f28cf52029f87fee/original/Untitled_design__27_.jpg",
        "https://www.youthcamping.in/system/images/000/787/620/a8a4e1de0ed1a633065d22a5bc33e8a6/original/Untitled_design__10_.jpg"
      ]
    },
    {
      day: 5,
      title: "Rafting & Paragliding at Manali — Adventurous Day",
      location: "Manali & Kullu Valley",
      description: "Early morning breakfast then go for outdoor camp activities like rock climbing, burma bridge, commando net climb, bamboo bridge & other rope adventure activities available on the campsite. After camp activities, move to the highest paragliding spot in Manali for a bird's eye view of Kullu Valley (self-paid). After paragliding, go for 8KM white water rafting (complimentary included in package). Visit Kullu Shawl Factory before overnight journey towards Jalandhar/Una.",
      activities: ["Rock climbing & burma bridge", "Commando net climb & rope activities", "Paragliding — bird's eye view of Kullu Valley (self-paid)", "8KM white water rafting (complimentary)", "Kullu Shawl Factory"],
      stay: "Overnight journey",
      meals: "Breakfast, Lunch",
      photos: [
        "https://www.youthcamping.in/system/images/000/787/619/34999a34a2c2bcbdf67362800a93aa34/original/Untitled_design__11_.jpg",
        "https://www.youthcamping.in/system/images/000/787/616/f359dc68e98e6be4d1c1f53160d5fa16/original/Untitled_design__14_.jpg"
      ]
    },
    {
      day: 6,
      title: "Bike Ride to Solang Valley — Atal Tunnel — Sissu",
      location: "Solang Valley, Atal Tunnel, Sissu",
      description: "After getting breakfast at 7:00 AM, trek down for Manali. After lunch, it's time for a bike ride! Visit Solang Valley & Atal Tunnel (please note: in heavy snowfall sometimes Atal Tunnel & Sissu are inaccessible by road). Explore the stunning Sissu village and lake. Return to Kullu for camping.",
      activities: ["Solang Valley visit", "Atal Tunnel crossing", "Sissu village & lake exploration", "Bike ride through mountains"],
      stay: "Camping in Kullu",
      meals: "Breakfast, Packed Lunch, Dinner",
      photos: [
        "https://www.youthcamping.in/system/images/000/787/886/12ef64016f1d4804482c8755b751fc41/original/Untitled_design__30_.jpg",
        "https://www.youthcamping.in/system/images/000/787/885/33a286a462e319bddb19402f64b8b393/original/Untitled_design__28_.jpg"
      ]
    },
    {
      day: 7,
      title: "Manali Sightseeing & Jogini Waterfall",
      location: "Manali",
      description: "Wake up and have a healthy breakfast. Drive to Vashisht Village & visit Vashisht Temple. Start Jogini Waterfall Trek — a 160-foot cascade that crashes over the mountains into the Beas River and Kullu Valley below (Trek distance: 3 KM, Height: 9350 feet). Move to visit Mall Road, Hadimba Temple, and Club House. Explore Manali. Back to camp for dinner and night stay.",
      activities: ["Vashisht Village & Temple", "Jogini Waterfall Trek (3KM, 9350ft)", "160-foot waterfall", "Mall Road, Hadimba Temple, Club House", "Explore Manali"],
      stay: "Hotel/Cottage in Manali",
      meals: "Breakfast, Packed Lunch, Dinner",
      photos: [
        "https://www.youthcamping.in/system/images/000/787/617/0584482e182e9ab64e9223acc28a6ba1/original/Untitled_design__13_.jpg",
        "https://www.youthcamping.in/system/images/000/787/612/cf30ef2599b628a94da590cef25de689/original/Untitled_design__18_.jpg",
        "https://www.youthcamping.in/system/images/000/787/903/c0e8d6f5037bd807569d8f872220dc32/original/Untitled_design__32_.jpg"
      ]
    },
    {
      day: 8,
      title: "Firozpur/Kotkapura to Gandhinagar/Sabarmati Train Journey",
      location: "Firozpur/Kotkapura Railway Station",
      description: "Board a train from Firozpur/Kotkapura railway station and start your journey towards your city. It is advised to book your slots early to enjoy hassle-free train journeys — book your slot at least 45 days prior to get confirmed both-side tickets.",
      activities: ["Board return train", "Overnight train journey home"],
      stay: "Train",
      meals: "",
      photos: [
        "https://www.youthcamping.in/system/images/000/787/633/7dba267328e361ea13ef20b042c6f62f/original/Untitled_design__20_.jpg"
      ]
    },
    {
      day: 9,
      title: "Arrive at Gandhinagar",
      location: "Gandhinagar / Home City",
      description: "Arrival at Gandhinagar Junction or at your Hometown according to train timing. The trip will end with beautiful memories. Au revoir!",
      activities: ["Arrival at home city", "Trip concludes with cherished memories"],
      stay: "",
      meals: "",
      photos: []
    }
  ],

  faqs: [
    {
      question: "What Will Be the Group Size for This Himachal Tour?",
      answer: "Our trips are curated for youth aged 12–35 with group sizes typically between 15–30 travellers. This ensures a fun, social experience while keeping things manageable."
    },
    {
      question: "Who All Will Be Accompanying The Group During The Himachal Tour?",
      answer: "A certified YouthCamping trip leader accompanies the group throughout the journey along with govt. certified drivers and instructors for adventure activities."
    },
    {
      question: "Being The Only Girl In The Group, Will The Journey Be Safe For Me?",
      answer: "Absolutely! Safety is our top priority. We have female-friendly accommodations, separate tent/room arrangements, and our trip leaders ensure a comfortable and safe environment for all travellers."
    },
    {
      question: "What Type of Ground Transportation Will Be Used on the Trip?",
      answer: "Sanitized Tempo Traveller/Bus/Car depending on group size. All vehicles are maintained and driven by certified, experienced drivers."
    },
    {
      question: "Do I Need to Buy Trekking Shoes for the Himachal Tour?",
      answer: "Yes, good trekking/sport shoes with rubber soles are essential for the Bijli Mahadev and Jogini Waterfall treks. Regular shoes won't provide adequate grip on mountain trails."
    },
    {
      question: "What Are the Washroom/Toilet Facilities on the Himachal Tour?",
      answer: "Hotels and cottages have attached washrooms. During camping, clean portable/common washrooms are provided. During treks, nature is your washroom!"
    },
    {
      question: "What Type of Food Is Served During the Trip?",
      answer: "We serve a mix of North Indian, Himachali, and Punjabi cuisine — mostly vegetarian with some non-veg options. Meals include breakfast and dinner as per itinerary with packed lunches on trek days."
    },
    {
      question: "Do You Prefer I Should Bring Some Medicines With Me?",
      answer: "Yes, carry personal medicines including motion sickness pills, basic painkillers, and any prescription medicines. We carry a basic first aid kit, but personal medicine is always recommended."
    }
  ]
};

async function seedFullTrip() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for full trip seeding...');

    // Find and update existing trip, or create new one
    const existing = await Trip.findOne({ 
      $or: [
        { slug: 'manali-kasol-amritsar-backpacking-trip' },
        { originalUrl: tripData.originalUrl }
      ]
    });

    if (existing) {
      // Update existing trip with full data
      Object.assign(existing, tripData);
      await existing.save();
      console.log(`✅ Updated existing trip: ${existing.title}`);
      console.log(`   ID: ${existing._id}`);
      console.log(`   Slug: ${existing.slug}`);
      console.log(`   Itinerary Days: ${existing.itinerary.length}`);
      console.log(`   Images: ${existing.images.length}`);
      console.log(`   Highlights: ${existing.highlights.length}`);
      console.log(`   Inclusions: ${existing.inclusions.length}`);
      console.log(`   FAQs: ${existing.faqs.length}`);
    } else {
      const trip = new Trip(tripData);
      await trip.save();
      console.log(`✅ Created new trip: ${trip.title}`);
      console.log(`   ID: ${trip._id}`);
      console.log(`   Slug: ${trip.slug}`);
      console.log(`   Itinerary Days: ${trip.itinerary.length}`);
    }

    console.log('\n🎉 Manali Kasol Amritsar trip fully seeded with complete data!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedFullTrip();
