require('dotenv').config();
const mongoose = require('mongoose');
const Trip = require('../src/models/Trip');

const tripsData = [
  {
    "title": "Manali Kasol Amritsar Backpacking Trip",
    "location": "Manali, Kasol, Amritsar",
    "duration": "8 Nights 9 Days",
    "price": 11999,
    "description": "Get ready for an unforgettable journey through Northern India! Begin with a train journey from your city to Jalandhar. Explore the cultural richness at Wagah Border and the serene beauty of the Golden Temple in Amritsar. Next, venture to Kasol for a relaxing riverside camping experience and immerse yourself in the vibrant atmosphere of the Kasol market. Don't forget to visit the tranquil Manikaran Gurudwara and trek to the picturesque Chalal village. Experience the breathtaking beauty of the Bijli Mahadev trek, which offers stunning views amidst lush green meadows and dense forests. Upon reaching Manali, explore its charm by visiting attractions like the Hadimba Devi Temple, Jogini Waterfall and the serene Vashisht Hot Springs.",
    "images": ["https://www.youthcamping.in/assets/banner-manali.jpg"],
    "itinerary": [
      { "day": 1, "title": "Train Journey from Ahmedabad/Vadodara/Surat to Firozpur/Kotkapura", "description": "Meet the YouthCamping representative at the railway station. Briefing about the trip followed by an ice-breaking session." },
      { "day": 2, "title": "Arrival at Firozpur/Kotkapura & Drive to Amritsar", "description": "Visit Wagah border, Golden Temple, Jallianwala Bagh. Explore Amritsar market. Depart for Kasol at night." },
      { "day": 3, "title": "Day for Kasol & Parvati valley exploration", "description": "Visit Manikaran Gurudwara, relax in hot springs. Explore Kasol Market and trek to Chalal village. Riverside camping." }
    ],
    "inclusions": ["Meals as per itinerary", "River Rafting", "Train tickets", "Tempo traveller transport", "Camping/Stay"],
    "exclusions": ["Food during travel", "Personal expenses", "Paid adventure activities (Paragliding)"],
    "highlights": ["Bijli Mahadev Trek", "Golden Temple & Wagah Border", "River Rafting", "Atal Tunnel Visit"],
    "category": "adventure"
  },
  {
    "title": "Manali Kasol Amritsar Backpacking Trip (Summer 2026)",
    "location": "Manali, Kasol, Amritsar",
    "duration": "8 Nights 9 Days",
    "price": 11999,
    "description": "Experience the breathtaking beauty of the Bhrigu Lake trek, which offers stunning views amidst lush green meadows and dense forests. This special summer edition includes the trek to Bhrigu Lake base camp at 10,000 ft, offering a unique high-altitude experience.",
    "images": ["https://vl-prod-static.b-cdn.net/system/images/000/748/614/9b56160b1abe219a402c11001702ae24/original/IMG_3398.JPG?crop=5184,1094,0,1181&width=2560&height=540"],
    "itinerary": [
      { "day": 1, "title": "Train Journey to Firozpur/Kotkapura", "description": "Enjoy a comfortable journey through picturesque landscapes as you head towards Jalandhar." },
      { "day": 4, "title": "Start Bhrigu Lake trek (Summer)", "description": "Trek to Bhrigu Lake base camp at 10,000 ft. Experience the serene beauty of the high mountains." }
    ],
    "inclusions": ["1 Night Kasol stay", "1 Night Kullu campsite", "2 Night Manali stay", "Bhrigu Lake Trek"],
    "highlights": ["Bhrigu Lake Trek", "Manikaran Gurudwara", "09 KM River Rafting"],
    "category": "adventure"
  },
  {
    "title": "Winter Spiti Road Trip",
    "location": "Winter Spiti",
    "duration": "9 Nights 10 Days",
    "price": 19999,
    "description": "Spiti in winter is a world straight out of a postcard—blanketed in pristine white snow, frozen rivers, and towering Himalayan peaks. This road trip takes you through some of the highest motorable roads in the world.",
    "images": ["https://vl-prod-static.b-cdn.net/system/images/000/862/062/b7cb9dc7ccc9fe863f0f009c4fe1746f/original/Website_Itinerary_Ohotos__2_.png"],
    "itinerary": [
      { "day": 1, "title": "Train Journey to Chandigarh from your city", "description": "Overnight train journey passing through Gujarat, Rajasthan, and Haryana." },
      { "day": 5, "title": "Tabo to Kaza via Lingti Falls, Key & Chicham", "description": "Visit Tabo Monastery, Key Monastery, and Chicham Bridge (Asia’s highest)." }
    ],
    "highlights": ["Chicham Bridge", "World's Highest Post Office (Hikkim)", "Key & Dhankar Monasteries"],
    "category": "road-trip"
  },
  {
    "title": "Spiti Valley Road Trip",
    "location": "Spiti Valley",
    "duration": "10 Nights 11 Days",
    "price": 21499,
    "description": "Experience an amazing journey through Himachal Pradesh! Explore quaint villages like Sangla, Chitkul, and Tabo. Visit the world's highest post office and the mesmerizing Chandra Taal lake.",
    "images": ["https://vl-prod-static.b-cdn.net/system/images/000/751/384/13bebee8f5dfb67ee1756619de11e44a/original/Untitled_design__50_.png"],
    "itinerary": [
      { "day": 6, "title": "Explore Key, Komic, Langza, and Hikkim in a day", "description": "Visit the world's highest motorable village (Komic) and highest post office (Hikkim)." },
      { "day": 7, "title": "Visit Kibber and Chicham, then head towards Chandra Taal", "description": "Mesmerizing 'Moon Lake' visit at Chandra Taal. One of the highlights of the Spiti journey." }
    ],
    "highlights": ["Chandra Taal Lake", "Asia's Highest Bridge (Chicham)", "Ancient Monasteries"],
    "category": "road-trip"
  },
  {
    "title": "Shimla Manali Dalhousie Dharamshala",
    "location": "Shimla, Manali, Dalhousie, Dharamshala",
    "duration": "9 Nights 10 Days",
    "price": 16999,
    "description": "Hop on a stunning 10-day journey through the majestic hills of Himachal Pradesh — from the colonial charm of Shimla to the pine-clad serenity of Dalhousie and the spiritual vibe of Dharamshala.",
    "images": ["https://vl-prod-static.b-cdn.net/system/images/000/856/207/68ae0d6c7bcc0a7716d1c860e7f2c58d/original/42294194395"],
    "itinerary": [
      { "day": 2, "title": "Reach Chandigarh and Drive to McLeodganj", "description": "Visit HPCA stadium, McLeodganj local market, and cafes. Spiritual experience at the home of the Dalai Lama." },
      { "day": 4, "title": "Explore Khajjiar Drive to Manali", "description": "Visit 'Mini Switzerland of India' and drive to Manali. Lush green meadows surrounded by forest." }
    ],
    "highlights": ["Shimla Mall Road", "Mini Switzerland (Khajjiar)", "Jogini Waterfall Trek", "Dharamshala Stadium"],
    "category": "himalayan"
  }
];

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clean existing data if needed (optional)
    // await Trip.deleteMany();

    for (const trip of tripsData) {
      await Trip.create(trip);
      console.log(`Imported: ${trip.title}`);
    }

    console.log('Batch 1 Import successfully completed!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();
