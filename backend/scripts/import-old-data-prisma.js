const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();

// ============================================================
// UTILITY: Strip HTML tags and clean text from old website
// ============================================================
function stripHtml(str) {
  if (!str) return '';
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// UTILITY: Rigorous image filter — remove ALL placeholder/logo images
// ============================================================
const IMAGE_BLACKLIST = [
  'img_6911', 'pngwing', 'logo', 'seeklogo', 'whatsapp',
  'gujarat-tourism', 'youth_camp', 'fb-dummy',
  '16x16', '32x32', '48x48', '180x180', '192x192',
  'partner', 'accreditation', 'icon',
  'images.png', 'data:image'
];

function filterImages(images) {
  if (!images || !Array.isArray(images)) return [];
  return images.filter(img => {
    if (!img || typeof img !== 'string') return false;
    const lower = img.toLowerCase();
    // Reject blacklisted patterns
    for (const pattern of IMAGE_BLACKLIST) {
      if (lower.includes(pattern)) return false;
    }
    // Reject thumbnails and low-res variants
    if (lower.includes('/thumbnail/')) return false;
    if (lower.includes('/x110gt/')) return false;
    if (lower.includes('/x210gt/')) return false;
    return true;
  });
}

// ============================================================
// TRIP CORRECTIONS MAP — exact data from old website
// ============================================================
const TRIP_CORRECTIONS = [
  // ── Trip 1: Manali Kasol Amritsar Backpacking Trip (index 0) ──
  {
    index: 0,
    slug: "manali-kasol-amritsar-backpacking-trip",
    price: 11999,
    duration: "9 Days / 8 Nights",
    location: "Himachal Pradesh & Punjab",
    category: "backpacking",
    difficulty: "Easy to Moderate",
    ageLimit: "12-35 years",
    maxAltitude: "10,000 ft",
    tripType: "Backpacking + Community Trip",
    startEnd: "Ahmedabad to Gandhinagar",
    pickupMode: "Train + Tempo Traveller",
    stickyCardPrice: 11999,
    stickyCardLabel: "Bestseller",
    order: 1,
    heroImage: "https://vl-prod-static.b-cdn.net/system/images/000/888/076/6f012c2f939c45fd491d86b3d33b0cbb/x540gt/IMG_3309.jpg",
    galleryImages: [
      "https://vl-prod-static.b-cdn.net/system/images/000/888/076/6f012c2f939c45fd491d86b3d33b0cbb/original/IMG_3309.jpg",
      "https://vl-prod-static.b-cdn.net/system/images/000/748/614/9b56160b1abe219a402c11001702ae24/original/IMG_3398.JPG"
    ],
    variants: [
      { location: "Firozpur/Kotkapura (Direct Join)", duration: "8D/7N", originalPrice: 13999, discountedPrice: 11999 },
      { location: "Ahmedabad/Gandhinagar (Sleeper)", duration: "9D/8N", originalPrice: 14999, discountedPrice: 12999 },
      { location: "Ahmedabad/Gandhinagar (3-Tier AC)", duration: "9D/8N", originalPrice: 17999, discountedPrice: 15999 },
      { location: "Vadodara/Surat (Sleeper)", duration: "9D/8N", originalPrice: 15499, discountedPrice: 13499 },
      { location: "Mumbai (Sleeper)", duration: "9D/8N", originalPrice: 15999, discountedPrice: 13999 }
    ],
    travelOptions: [
      { label: "Sleeper Train", priceDelta: 0 },
      { label: "AC 3-Tier Train", priceDelta: 3000 }
    ],
    roomOptions: [
      { label: "Quad Sharing", priceDelta: 0 },
      { label: "Double Sharing", priceDelta: 1999 }
    ],
    availableDates: [
      { date: "2026-06-06", capacity: 30, bookedCount: 0 },
      { date: "2026-06-13", capacity: 30, bookedCount: 0 },
      { date: "2026-06-20", capacity: 30, bookedCount: 0 },
      { date: "2026-06-27", capacity: 30, bookedCount: 0 },
      { date: "2026-07-04", capacity: 30, bookedCount: 0 },
      { date: "2026-07-11", capacity: 30, bookedCount: 0 }
    ],
    highlights: [
      "Bijli Mahadev Trek", "Jogini Waterfall Trek", "Mall Road & Hidimba Temple",
      "Golden Temple & Wagah Border", "Rope Adventure Activities & Campfire",
      "Solang Valley & Sissu Lake", "Parvati Valley & Chalal Village Trek",
      "Manikaran Gurudwara", "Atal Tunnel", "8 KM River Rafting Included"
    ],
    faqs: [
      { question: "What Will Be the Group Size for This Himachal Tour?", answer: "Group size typically ranges from 15-30 travelers to ensure a fun community experience while maintaining quality." },
      { question: "Who All Will Be Accompanying The Group During The Himachal Tour?", answer: "An experienced trip leader, certified local guides, and professional drivers accompany the group throughout." },
      { question: "Being The Only Girl In The Group, Will The Journey Be Safe For Me As Well?", answer: "Absolutely! Safety is our top priority. We have separate accommodations for girls and our trip leaders ensure everyone feels comfortable." },
      { question: "What Type of Ground Transportation Will Be Used on the Trip?", answer: "We use Tempo Travellers or mini-buses depending on group size. All vehicles are well-maintained with experienced drivers." },
      { question: "Do I Need to Buy Trekking Shoes for the Himachal Tour?", answer: "Yes, good trekking shoes with rubber soles are essential. Sports shoes work for most activities but trekking shoes are recommended." },
      { question: "What Type of Food Is Served During the Trip?", answer: "We serve a mix of North Indian, Himachali, and Punjabi cuisine. Vegetarian and non-vegetarian options are available." }
    ],
    popupDetails: {
      cancellation: "Before 45 days: 80% refund. Before 30 days: 50% refund. Before 15 days: 25% refund. Within 15 days: No refund. Advance booking amount is non-refundable.",
      gears: "5 pairs full sleeve clothes, Gloves, Woolen cap, Jacket, Full Socks, Thermal inner, Raincoat, Rucksack & Small BackPack, Trekking shoes, Sun cap, Goggles, Torch, Powerbank, Cold cream, Anti-sunburn cream, 2 water bottles",
      terms: "Only people of age 12 to 35 years are allowed. 5% GST applicable on all packages.",
      etiquette: "Respect local culture and customs. No littering on treks. Follow trip leader instructions."
    },
    route: [
      { label: "Ahmedabad", icon: "train" },
      { label: "Jalandhar", icon: "car" },
      { label: "Amritsar", icon: "car" },
      { label: "Kasol", icon: "car" },
      { label: "Manali", icon: "car" },
      { label: "Jalandhar", icon: "train" },
      { label: "Ahmedabad", icon: "train" }
    ],
    seo: {
      metaTitle: "Manali Kasol Amritsar Backpacking Trip | YouthCamping",
      metaDescription: "9-day backpacking trip through Northern India with Wagah Border, Golden Temple, Kasol camping, Bijli Mahadev Trek, Solang Valley & river rafting. Starting ₹11,999.",
      keywords: ["manali trip", "kasol backpacking", "amritsar tour", "group trip", "youth camping"]
    }
  },

  // ── Trip 2: Kedarnath Badrinath - Tungnath & Rishikesh (index 1) ──
  {
    index: 1,
    slug: "kedarnath-badrinath-tungnath-rishikesh",
    price: 19499,
    duration: "9 Days / 8 Nights",
    location: "Uttarakhand",
    category: "himalayan",
    difficulty: "Moderate to Challenging",
    ageLimit: "12-45 years",
    maxAltitude: "12,200 ft",
    tripType: "Pilgrimage + Trekking",
    startEnd: "Delhi to Delhi",
    pickupMode: "Tempo Traveller",
    stickyCardPrice: 19499,
    stickyCardLabel: "Spiritual",
    order: 2,
    heroImage: "https://vl-prod-static.b-cdn.net/system/images/000/748/950/95ce9359f68bd2d93dee6aa2e3a18d17/original/Untitled_design__11_.png",
    galleryImages: [
      "https://vl-prod-static.b-cdn.net/system/images/000/748/945/5abeca5343adce67a22013a929647f71/original/Untitled_design__12_.png",
      "https://vl-prod-static.b-cdn.net/system/images/000/748/946/30e9ea2cafbd0b433acdf1c21b6d3e0c/original/Untitled_design__13_.png",
      "https://vl-prod-static.b-cdn.net/system/images/000/748/947/075d7fdc9ae72490c7c886bf84576cf6/original/Untitled_design__17_.png",
      "https://vl-prod-static.b-cdn.net/system/images/000/748/948/2d48a287c9e3c80b0aa8d17803e263dd/original/Untitled_design__14_.png",
      "https://vl-prod-static.b-cdn.net/system/images/000/748/949/f5aca70beb2a2be385d0ccb165f06ba1/original/Untitled_design__16_.png"
    ],
    description: "Kedarnath Temple stands at 3,580 meters in the Garhwal Himalayas and is one of the twelve Jyotirlingas of Lord Shiva. It is part of the sacred Chota Char Dham and Panch Kedar, and was revived in the 8th century by Adi Shankaracharya. Badrinath Temple, located at 3,300 meters in Chamoli, is dedicated to Lord Vishnu and forms one of India's main Char Dham pilgrimage sites. Re-established by Adi Shankaracharya, it remains one of the most revered spiritual destinations in the Himalayas.",
    variants: [
      { location: "New Delhi", duration: "9D/8N", originalPrice: 21499, discountedPrice: 19499 },
      { location: "Ahmedabad (with Train)", duration: "11D/10N", originalPrice: 22790, discountedPrice: 20790 },
      { location: "Mumbai (with Train)", duration: "11D/10N", originalPrice: 22790, discountedPrice: 20790 }
    ],
    availableDates: [
      { date: "2026-05-30", capacity: 25, bookedCount: 0 },
      { date: "2026-06-06", capacity: 25, bookedCount: 0 },
      { date: "2026-06-13", capacity: 25, bookedCount: 0 },
      { date: "2026-06-20", capacity: 25, bookedCount: 0 },
      { date: "2026-06-27", capacity: 25, bookedCount: 0 },
      { date: "2026-07-04", capacity: 25, bookedCount: 0 },
      { date: "2026-07-11", capacity: 25, bookedCount: 0 },
      { date: "2026-07-18", capacity: 25, bookedCount: 0 },
      { date: "2026-07-25", capacity: 25, bookedCount: 0 },
      { date: "2026-08-01", capacity: 25, bookedCount: 0 }
    ],
    highlights: [
      "Kedarnath Dham - 21 km Trek", "Badrinath Temple", "Tungnath - World's Highest Shiva Temple at 12,200 ft",
      "Mana Village - Last Indian Village", "Rishikesh Ganga Aarti", "River Rafting in Rishikesh",
      "Devprayag & Rudraprayag Confluences", "Chopta Meadows", "Bhim Pul & Vyas Gufa"
    ],
    faqs: [
      { question: "What Will Be the Group Size for This Kedarnath Tour?", answer: "Group size is typically 15-25 travelers for optimal experience and safety during treks." },
      { question: "Being The Only Girl In The Group, Will The Journey Be Safe For Me As Well?", answer: "Absolutely! We ensure separate accommodations and our trip leaders maintain a safe environment for everyone." },
      { question: "Do I Need to Buy Trekking Shoes for the Kedarnath Tour?", answer: "Yes, proper trekking shoes are essential for the 21km Kedarnath trek. Sports shoes are not recommended." },
      { question: "What Type of Food Is Served During the Trip?", answer: "North Indian vegetarian meals (breakfast & dinner) are provided as per itinerary. Lunch is on your own." }
    ],
    popupDetails: {
      cancellation: "Before 45 days: 80% refund. Before 30 days: 50% refund. Before 15 days: 25% refund. Within 15 days: No refund.",
      gears: "Backpack (rucksack), Small backpack (20-30 ltr), Water bottle, Trekking shoes, Extra woollen socks, Slippers, Thermal Inners, Winter jacket, Raincoat, Winter cap, Hat, Gloves, Sunglasses, Sunscreen, Personal medication",
      terms: "Yatra registration required at registrationandtouristcare.uk.gov.in. 5% GST applicable."
    },
    route: [
      { label: "Delhi", icon: "car" },
      { label: "Haridwar", icon: "car" },
      { label: "Rishikesh", icon: "car" },
      { label: "Kedarnath", icon: "car" },
      { label: "Chopta", icon: "car" },
      { label: "Badrinath", icon: "car" },
      { label: "Delhi", icon: "car" }
    ],
    seo: {
      metaTitle: "Kedarnath Badrinath - Tungnath & Rishikesh Trip | YouthCamping",
      metaDescription: "9-day spiritual journey covering Kedarnath, Badrinath, Tungnath & Rishikesh. 21km trek, Ganga Aarti, river rafting. Starting ₹19,499.",
      keywords: ["kedarnath trip", "badrinath yatra", "tungnath trek", "chota char dham"]
    }
  },

  // ── Trip 3: Bhrigu Lake Trek (index 2) — data from seed-bhrigu.js ──
  {
    index: 2,
    slug: "bhrigu-lake-trek-manali-kasol-amritsar",
    title: "Experience Bhrigu Lake Trek with Manali, Kasol & Amritsar",
    price: 12999,
    duration: "9 Days / 8 Nights",
    location: "Himachal Pradesh",
    category: "backpacking",
    difficulty: "Moderate",
    ageLimit: "15–35 years",
    maxAltitude: "14,300 ft",
    tripType: "Backpacking + Trekking + Community Trip",
    startEnd: "Ahmedabad to Ahmedabad",
    pickupMode: "Train + Tempo Traveller",
    stickyCardPrice: 12999,
    stickyCardLabel: "Bestseller",
    order: 3,
    heroImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2070",
    description: "Bhrigu Lake Trek with Manali, Kasol & Amritsar is a 9D/8N Himalayan backpacking adventure combining spiritual vibes, scenic valleys & high-altitude trekking.",
    // Override everything from seed-bhrigu.js — itinerary, inclusions, exclusions, etc.
    useCustomItinerary: true,
    customItinerary: [
      { day: 1, title: "Train Journey to Jalandhar", description: "Departure from Ahmedabad. Group introduction. Overnight train journey." },
      { day: 2, title: "Amritsar Exploration & Drive to Kasol", description: "Visit Wagah Border Ceremony, Golden Temple, and Amritsar Market. Overnight drive to Kasol." },
      { day: 3, title: "Kasol & Parvati Valley", description: "Reach Kasol campsite. Chalal Village trek. Visit Manikaran Sahib. Bonfire & music night." },
      { day: 4, title: "Start Bhrigu Lake Trek", description: "Drive to base village. Begin trek to base camp (~10,000 ft). Scenic meadow views." },
      { day: 5, title: "Bhrigu Lake Summit Day", description: "Trek to 14,300 ft. Snow trails (seasonal). Explore Bhrigu Lake. Summit celebration." },
      { day: 6, title: "Trek Down & Manali Sightseeing", description: "Descend trek. Visit Solang Valley, Atal Tunnel, Hadimba Temple & Mall Road." },
      { day: 7, title: "Adventure Activities", description: "River Rafting (Included). Paragliding (Optional). Evening drive to Jalandhar." },
      { day: 8, title: "Return Train Journey", description: "Board train. Group games & memories." },
      { day: 9, title: "Arrival", description: "Reach your city. Trip ends with memories ❤️" }
    ],
    customInclusions: [
      "Tempo Traveller / Cab for all transfers",
      "Round-trip train tickets",
      "Stay: Kasol, Manali, Bhrigu Camps",
      "Meals: 5 Breakfast, 5 Lunch, 5 Dinner",
      "Bhrigu Lake Trek (Certified guides)",
      "Bonfire & music night",
      "River rafting",
      "Trip Captain",
      "Sightseeing as per itinerary",
      "Toll, parking & driver charges"
    ],
    customExclusions: [
      "Personal expenses",
      "Paragliding & paid adventure activities",
      "Entry tickets & permits",
      "Snow gear / pony rides",
      "Heater charges",
      "Meals not mentioned",
      "Intercity transfers (if joining from other cities)",
      "5% GST"
    ],
    variants: [
      { location: "Ahmedabad", duration: "9D/8N", originalPrice: 14999, discountedPrice: 12999, image: "" },
      { location: "Vadodara / Surat", duration: "9D/8N", originalPrice: 15499, discountedPrice: 13499, image: "" },
      { location: "Mumbai / Pune", duration: "9D/8N", originalPrice: 15999, discountedPrice: 13999, image: "" }
    ],
    roomOptions: [
      { label: "Quad Sharing", priceDelta: 0 },
      { label: "Triple Sharing", priceDelta: 1000 },
      { label: "Double Sharing", priceDelta: 2000 }
    ],
    travelOptions: [
      { label: "Non-AC Sleeper Train", priceDelta: 0 },
      { label: "AC 3 Tier Train", priceDelta: 2000 }
    ],
    availableDates: [
      { date: "2026-04-25", capacity: 30, bookedCount: 0 },
      { date: "2026-05-02", capacity: 30, bookedCount: 0 },
      { date: "2026-05-09", capacity: 30, bookedCount: 0 },
      { date: "2026-05-17", capacity: 30, bookedCount: 0 },
      { date: "2026-05-23", capacity: 30, bookedCount: 0 },
      { date: "2026-05-30", capacity: 30, bookedCount: 0 },
      { date: "2026-06-06", capacity: 30, bookedCount: 0 },
      { date: "2026-06-13", capacity: 30, bookedCount: 0 },
      { date: "2026-06-20", capacity: 30, bookedCount: 0 },
      { date: "2026-06-27", capacity: 30, bookedCount: 0 },
      { date: "2026-07-04", capacity: 30, bookedCount: 0 },
      { date: "2026-07-11", capacity: 30, bookedCount: 0 }
    ],
    highlights: [
      "Bhrigu Lake Trek (14,300 ft)",
      "Kasol & Parvati Valley",
      "Manali & Solang Valley",
      "Atal Tunnel",
      "Golden Temple",
      "Wagah Border Ceremony",
      "Chalal Village Trek"
    ],
    faqs: [
      { question: "Is this trip beginner-friendly?", answer: "Yes, but basic fitness is required for trekking." },
      { question: "Is trekking compulsory?", answer: "Yes, Bhrigu Lake trek is the main highlight." },
      { question: "What about safety?", answer: "Certified guides + trained drivers + group support." },
      { question: "What kind of stays?", answer: "Hotels + cottages + high-altitude camps." }
    ],
    seo: {
      metaTitle: "Bhrigu Lake Trek with Manali, Kasol & Amritsar | YouthCamping",
      metaDescription: "9-day Bhrigu Lake trek with Manali, Kasol & Amritsar. 14,300 ft summit, river rafting, Golden Temple. Starting ₹12,999.",
      keywords: ["bhrigu lake trek", "manali kasol trip", "amritsar backpacking"]
    }
  },

  // ── Trip 4: Kedarnath Tungnath & Rishikesh Trip (index 3) ──
  {
    index: 3,
    slug: "kedarnath-tungnath-rishikesh-trip",
    price: 16500,
    duration: "6 Days / 5 Nights",
    location: "Uttarakhand",
    category: "himalayan",
    difficulty: "Moderate to Challenging",
    ageLimit: "18-35 years",
    maxAltitude: "12,200 ft",
    tripType: "Backpacking + Trekking",
    startEnd: "Delhi to Delhi",
    pickupMode: "Tempo Traveller",
    stickyCardPrice: 16500,
    stickyCardLabel: "Popular",
    order: 4,
    heroImage: "https://vl-prod-static.b-cdn.net/system/images/000/748/950/95ce9359f68bd2d93dee6aa2e3a18d17/original/Untitled_design__11_.png",
    galleryImages: [
      "https://vl-prod-static.b-cdn.net/system/images/000/748/945/5abeca5343adce67a22013a929647f71/original/Untitled_design__12_.png",
      "https://vl-prod-static.b-cdn.net/system/images/000/748/946/30e9ea2cafbd0b433acdf1c21b6d3e0c/original/Untitled_design__13_.png",
      "https://vl-prod-static.b-cdn.net/system/images/000/748/947/075d7fdc9ae72490c7c886bf84576cf6/original/Untitled_design__17_.png",
      "https://vl-prod-static.b-cdn.net/system/images/000/748/948/2d48a287c9e3c80b0aa8d17803e263dd/original/Untitled_design__14_.png",
      "https://vl-prod-static.b-cdn.net/system/images/000/748/949/f5aca70beb2a2be385d0ccb165f06ba1/original/Untitled_design__16_.png"
    ],
    description: "Get ready for an amazing journey through northern India! We'll start in Delhi and then head to Haridwar, where you'll see the famous Har ki Pauri Ghat and experience the magical Ganga Aarti ceremony. Next, we'll explore Rishikesh, walking across the cool bridges and visiting ashrams like The Beatles Ashram and Parmarth Niketan Ashram. If you're up for it, we can also try some thrilling activities like river rafting or bungee jumping! Then, we'll visit Devprayag and Rudraprayag to see where two rivers meet, and the stunning Dharidevi temple in the middle of one river. After that, we'll head to Gaurikund for a dip in the hot springs, and then trek 21 kilometers to reach the ancient Kedarnath temple, where you'll also see the Bhairav temple. Don't worry, both filled with history and spirituality. Finally, we'll explore the beautiful meadows of Chopta and reach the Tungnath temple, which sits at a breathtaking height of 12,200 feet. Get ready for a journey full of adventure, spirituality, and stunning sights! Note: Only People of age 18 to 35 years of age are allowed to join this trip as it is a complete backpacking itinerary and runs on a tight scheduled which is powerpacked.",
    availableDates: [
      { date: "2026-06-06", capacity: 25, bookedCount: 0 },
      { date: "2026-06-13", capacity: 25, bookedCount: 0 },
      { date: "2026-06-20", capacity: 25, bookedCount: 0 },
      { date: "2026-06-27", capacity: 25, bookedCount: 0 },
      { date: "2026-07-04", capacity: 25, bookedCount: 0 }
    ],
    variants: [
      { location: "New Delhi", duration: "6D/5N", originalPrice: 18500, discountedPrice: 16500 }
    ],
    highlights: [
      "Kedarnath Dham - 21 km Trek", "Tungnath - World's Highest Shiva Temple at 12,200 ft",
      "Rishikesh Ganga Aarti", "River Rafting in Rishikesh",
      "Devprayag & Rudraprayag Confluences", "Chopta Meadows"
    ],
    faqs: [
      { question: "What Will Be the Group Size for This Kedarnath Tour?", answer: "Group size is typically 15-25 travelers for optimal experience and safety during treks." },
      { question: "Being The Only Girl In The Group, Will The Journey Be Safe For Me As Well?", answer: "Absolutely! We ensure separate accommodations and our trip leaders maintain a safe environment for everyone." },
      { question: "Do I Need to Buy Trekking Shoes for the Kedarnath Tour?", answer: "Yes, proper trekking shoes are essential for the 21km Kedarnath trek. Sports shoes are not recommended." },
      { question: "What Type of Food Is Served During the Trip?", answer: "North Indian vegetarian meals (breakfast & dinner) are provided as per itinerary. Lunch is on your own." }
    ],
    popupDetails: {
      cancellation: "Before 45 days: 80% refund. Before 30 days: 50% refund. Before 15 days: 25% refund. Within 15 days: No refund.",
      gears: "Backpack (rucksack), Small backpack (20-30 ltr), Water bottle, Trekking shoes, Extra woollen socks, Slippers, Thermal Inners, Winter jacket, Raincoat, Winter cap, Hat, Gloves, Sunglasses, Sunscreen, Personal medication",
      terms: "Only people of age 18 to 35 years are allowed. 5% GST applicable."
    },
    route: [
      { label: "Delhi", icon: "car" },
      { label: "Haridwar", icon: "car" },
      { label: "Rishikesh", icon: "car" },
      { label: "Kedarnath", icon: "car" },
      { label: "Chopta", icon: "car" },
      { label: "Delhi", icon: "car" }
    ],
    seo: {
      metaTitle: "Kedarnath Tungnath & Rishikesh Trip | YouthCamping",
      metaDescription: "6-day backpacking trip to Kedarnath, Tungnath & Rishikesh. 21km trek, Ganga Aarti. Starting ₹16,500.",
      keywords: ["kedarnath trip", "tungnath trek", "rishikesh backpacking"]
    }
  },

  // ── Trip 5: Winter Spiti Road Trip (index 4) ──
  {
    index: 4,
    slug: "winter-spiti-road-trip",
    price: 19999,
    duration: "10 Days / 9 Nights",
    location: "Spiti Valley, Himachal Pradesh",
    category: "road trip",
    difficulty: "Moderate",
    ageLimit: "15-40 years",
    maxAltitude: "14,500 ft",
    tripType: "Road Trip + Community Trip",
    startEnd: "Ahmedabad to Ahmedabad",
    pickupMode: "Train + Tempo Traveller",
    stickyCardPrice: 19999,
    stickyCardLabel: "Adventure",
    order: 5,
    heroImage: "https://vl-prod-static.b-cdn.net/system/images/000/862/062/b7cb9dc7ccc9fe863f0f009c4fe1746f/original/Website_Itinerary_Ohotos__2_.png",
    galleryImages: [
      "https://vl-prod-static.b-cdn.net/system/images/000/862/060/5d50edec4e8decdefec9e352873b99e8/original/Website_Itinerary_Ohotos__4_.png",
      "https://vl-prod-static.b-cdn.net/system/images/000/862/061/9b72e8a2d0b5f7708ed73d1c712eed1a/original/Website_Itinerary_Ohotos__3_.png",
      "https://vl-prod-static.b-cdn.net/system/images/000/862/064/e80df5925dd74919f520937e2a6bda8f/original/Website_Itinerary_Ohotos.png",
      "https://vl-prod-static.b-cdn.net/system/images/000/862/067/098b53266d5d6f407b3eb0f6b798f8dc/original/Website_Itinerary_Ohotos__5_.png",
      "https://vl-prod-static.b-cdn.net/system/images/000/862/068/436b3f6603a0f4324883df73c9b454d9/original/Website_Itinerary_Ohotos__6_.png",
      "https://vl-prod-static.b-cdn.net/system/images/000/862/069/8a427ed92c2e6864aab43d56940d9004/original/Website_Itinerary_Ohotos__7_.png"
    ],
    description: "Spiti in winter is a world straight out of a postcard—blanketed in pristine white snow, frozen rivers, and towering Himalayan peaks. The valley transforms into a serene, untouched paradise where ancient monasteries stand tall amidst snow-capped mountains, and quaint villages like Kaza, Langza, and Hikkim feel like time has slowed down. With crisp mountain air, star-studded nights, and the thrill of winter roads, Spiti offers a rare adventure for those who crave raw beauty and tranquility.",
    highlights: ["Key Monastery", "Hikkim - World's Highest Post Office", "Komic - World's Highest Village", "Langza Village", "Chitkul - India's Last Village", "Nako Lake", "Dhankar Monastery", "Chicham Bridge - Asia's Highest", "Frozen Waterfalls", "Shimla Mall Road"],
    seo: {
      metaTitle: "Winter Spiti Road Trip | YouthCamping",
      metaDescription: "10-day winter road trip through Spiti Valley. Key Monastery, Hikkim, frozen lakes & Himalayan peaks. Starting ₹19,999.",
      keywords: ["winter spiti", "spiti road trip", "himachal adventure"]
    }
  },

  // ── Trip 6: Leh Ladakh Bike Expedition 2026 (index 5) ──
  {
    index: 5,
    slug: "leh-ladakh-bike-expedition-2026",
    price: 18999,
    duration: "7 Days / 6 Nights",
    location: "Ladakh",
    category: "road trip",
    difficulty: "Moderate to Challenging",
    ageLimit: "18-45 years",
    maxAltitude: "18,380 ft",
    tripType: "Bike Expedition",
    startEnd: "Leh to Leh",
    pickupMode: "Flight + Royal Enfield",
    stickyCardPrice: 18999,
    stickyCardLabel: "Expedition",
    order: 6,
    heroImage: "https://vl-prod-static.b-cdn.net/system/images/000/888/077/e84148f8d1adacaa5dc96e8f834b8cdd/original/t2-graphy-IJfpVYlRv5I-unsplash.jpg",
    variants: [
      { location: "SIC (Seat in Coach)", duration: "7D/6N", originalPrice: 22999, discountedPrice: 18999 },
      { location: "Solo Rider", duration: "7D/6N", originalPrice: 28999, discountedPrice: 24999 },
      { location: "Pillion Rider", duration: "7D/6N", originalPrice: 23999, discountedPrice: 19999 }
    ],
    roomOptions: [
      { label: "Triple Sharing", priceDelta: 0 },
      { label: "Double Sharing", priceDelta: 2500 }
    ],
    highlights: ["Khardung La - World's Highest Motorable Pass", "Pangong Lake", "Nubra Valley", "Magnetic Hill", "Leh Palace", "Shanti Stupa", "Royal Enfield Himalayan 411cc", "Hunder Sand Dunes"],
    seo: {
      metaTitle: "Leh Ladakh Bike Expedition 2026 | YouthCamping",
      metaDescription: "7-day bike expedition across Ladakh on Royal Enfield. Khardung La, Pangong Lake, Nubra Valley. Starting ₹18,999.",
      keywords: ["leh ladakh bike trip", "ladakh expedition", "royal enfield ladakh"]
    }
  },

  // ── Trip 7: Spiti Valley Road Trip (index 6) ──
  {
    index: 6,
    slug: "spiti-valley-road-trip",
    price: 21499,
    duration: "11 Days / 10 Nights",
    location: "Himachal Pradesh",
    category: "road trip",
    difficulty: "Moderate",
    ageLimit: "15-40 years",
    maxAltitude: "15,000 ft",
    tripType: "Road Trip + Community Trip",
    startEnd: "Ahmedabad to Ahmedabad",
    pickupMode: "Train + Tempo Traveller",
    stickyCardPrice: 21499,
    stickyCardLabel: "Epic",
    order: 7,
    heroImage: "https://vl-prod-static.b-cdn.net/system/images/000/751/384/13bebee8f5dfb67ee1756619de11e44a/original/Untitled_design__50_.png",
    availableDates: [
      { date: "2026-06-06", capacity: 25, bookedCount: 0 },
      { date: "2026-06-13", capacity: 25, bookedCount: 0 },
      { date: "2026-06-20", capacity: 25, bookedCount: 0 },
      { date: "2026-06-27", capacity: 25, bookedCount: 0 },
      { date: "2026-07-04", capacity: 25, bookedCount: 0 },
      { date: "2026-07-11", capacity: 25, bookedCount: 0 },
      { date: "2026-07-18", capacity: 25, bookedCount: 0 },
      { date: "2026-07-25", capacity: 25, bookedCount: 0 },
      { date: "2026-08-01", capacity: 25, bookedCount: 0 },
      { date: "2026-08-08", capacity: 25, bookedCount: 0 }
    ],
    highlights: ["Chandrataal Lake", "Key Monastery", "Kunzum Pass", "Atal Tunnel", "Rohtang Pass", "Manali", "Kibber Village", "Dhankar Monastery"],
    seo: {
      metaTitle: "Spiti Valley Road Trip with Chandrataal | YouthCamping",
      metaDescription: "11-day road trip through Spiti Valley with Chandrataal Lake, Key Monastery & Kunzum Pass. Starting ₹21,499.",
      keywords: ["spiti valley trip", "chandrataal lake", "spiti road trip"]
    }
  },

  // ── Trip 8: Kerala Getaway (index 7) ──
  {
    index: 7,
    slug: "kerala-getaway",
    price: 15999,
    duration: "5 Days / 4 Nights",
    location: "Kerala",
    category: "backpacking",
    difficulty: "Easy",
    ageLimit: "15-45 years",
    maxAltitude: "6,000 ft",
    tripType: "Leisure + Community Trip",
    startEnd: "Kochi to Kochi",
    pickupMode: "Flight + Tempo Traveller",
    stickyCardPrice: 15999,
    stickyCardLabel: "New",
    order: 8,
    heroImage: "https://vl-prod-static.b-cdn.net/system/images/000/899/117/e79b48de54e83646c865c90dee281eb2/original/ravi-sangar-dfB4L6PfS4w-unsplash__1_.jpg",
    variants: [
      { location: "Double Sharing", duration: "5D/4N", originalPrice: 18999, discountedPrice: 16999 },
      { location: "Triple Sharing", duration: "5D/4N", originalPrice: 17999, discountedPrice: 15999 }
    ],
    highlights: ["Munnar Tea Plantations", "Thekkady Periyar Wildlife", "Alleppey Houseboat", "Kochi Fort", "Chinese Fishing Nets", "Spice Gardens"],
    seo: {
      metaTitle: "Kerala Getaway | YouthCamping",
      metaDescription: "5-day Kerala trip covering Munnar, Thekkady & Alleppey. Tea plantations, wildlife & houseboats. Starting ₹15,999.",
      keywords: ["kerala trip", "munnar thekkady", "alleppey houseboat"]
    }
  }
];

// ============================================================
// REVIEWS DATA — with city and isFeatured
// ============================================================
const REVIEWS_DATA = [
  { userName: "Zeel", instagram: "@_zeel_1608", city: "Ahmedabad", tripSearch: "Manali", rating: 5, isFeatured: true, comment: "Had an amazing time on the Manali-Kasol trip. The vibes, people & memories were truly unforgettable. Everything was fun, smooth and full of adventure. Can't wait for the next trip already!" },
  { userName: "Neeki", instagram: "@neeki_0606", city: "Ahmedabad", tripSearch: "Spiti", rating: 5, isFeatured: true, comment: "Spiti was pure magic. Crazy roads, breathtaking views & unforgettable moments throughout the journey. Every day felt like a new adventure. Definitely a once in a lifetime experience." },
  { userName: "Suru Chaudhary", instagram: "@suru_chaudhary2927", city: "Surat", tripSearch: "Kerala", rating: 5, isFeatured: true, comment: "Kerala was full of peace, fun & beautiful vibes. From beaches to backwaters, every moment felt refreshing. The whole trip was relaxing and memorable. So many beautiful memories made together." },
  { userName: "Vidhi", instagram: "@vidhiithummar", city: "Vadodara", tripSearch: "Manali", rating: 5, isFeatured: true, comment: "Had an amazing time on the Manali-Kasol trip. The vibes, people & memories were truly unforgettable. Everything was fun, smooth and full of adventure. Can't wait for the next trip already!" },
  { userName: "Ankit Shah", instagram: "@ankit_shah_22", city: "Ahmedabad", tripSearch: "Kedarnath", rating: 5, isFeatured: true, comment: "A truly spiritual and breathtaking journey. Walking to Kedarnath Dham with the mountains in the background was a dream. The guides were extremely supportive!" },
  { userName: "Megha Patel", instagram: "@megha_patel", city: "Rajkot", tripSearch: "Ladakh", rating: 5, isFeatured: true, comment: "Nubra Valley and Pangong Lake are out of this world. Riding bikes across Leh Ladakh was an incredible experience. Safe, structured, and extremely professional." }
];

// ============================================================
// BLOG ARTICLES DATA
// ============================================================
const BLOGS_DATA = [
  {
    title: "Walking the Frozen Zanskar River: The Ultimate Chadar Trek Guide",
    author: "Aman Sharma",
    readTime: "8 MIN READ",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1200",
    hasVideo: false,
    content: "The Chadar Trek is not just a journey; it is a pilgrimage through ice. Located in the Ladakh region, walking on the frozen Zanskar river is a magical, once-in-a-lifetime adventure. Temperatures drop down below -20°C, and every step requires patience and balanced breathing. Make sure to choose warm layerings and high-quality boots before starting."
  },
  {
    title: "Spiti Valley in Winter: Surviving -20°C in the Middle Land",
    author: "Karan Johar",
    readTime: "12 MIN READ",
    image: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&q=80&w=1200",
    hasVideo: false,
    content: "The quietude of Spiti in winter is deafening. With frozen waterfalls, ancient monasteries blanketed in white snow, and traditional local home stays, Spiti Valley transforms into a serene, untouched cold paradise. Here is how we lived with local families, drank hot butter tea, and captured visual masterworks on our expedition."
  },
  {
    title: "The Pristine Colors of Kasol: Riverside Cafes & Parvati Valley Trails",
    author: "Siddharth",
    readTime: "5 MIN READ",
    image: "https://images.unsplash.com/photo-1598214817158-99ed26703f83?auto=format&fit=crop&q=80&w=1200",
    hasVideo: false,
    content: "From the serene banks of the Parvati River to the hidden high-altitude trails of Chalal and Tosh, the natural vibe of Kasol is unmatched. It is the perfect place to unwind, meet fellow globetrotters, try authentic Israeli food in cozy wood cafes, and breathe the fresh mountain air of Himachal Pradesh."
  }
];

// ============================================================
// MAIN SEED FUNCTION
// ============================================================
async function seed() {
  console.log("🚀 Starting Enhanced Data Import from trips-data.json...\n");

  try {
    // ── 1. Load raw trips data ──
    const dataPath = path.join(__dirname, 'trips-data.json');
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Scraped file not found at: ${dataPath}`);
    }
    const rawTrips = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`📦 Loaded ${rawTrips.length} raw trips from trips-data.json`);

    // ── 2. Process and upsert each trip ──
    for (const correction of TRIP_CORRECTIONS) {
      const rawTrip = rawTrips[correction.index] || {};
      const tripSlug = correction.slug;
      const tripTitle = correction.title || rawTrip.title || 'Untitled Trip';

      console.log(`\n📍 Processing: ${tripTitle}`);

      // Build images: start with gallery from corrections, then add filtered images from raw data
      let images = [];
      if (correction.galleryImages) {
        images = [...correction.galleryImages];
      }
      // Add filtered clean images from trips-data.json
      const rawFiltered = filterImages(rawTrip.images || []);
      for (const img of rawFiltered) {
        if (!images.includes(img)) {
          images.push(img);
        }
      }
      // Deduplicate
      images = [...new Set(images)];

      // Determine hero image
      const heroImage = correction.heroImage || images[0] || null;

      // Build itinerary — word for word from source
      let itinerary;
      if (correction.useCustomItinerary && correction.customItinerary) {
        itinerary = correction.customItinerary;
      } else {
        itinerary = (rawTrip.itinerary || []).map((dayItem, idx) => ({
          day: Number(dayItem.day || idx + 1),
          title: stripHtml(dayItem.title || `Day ${idx + 1}`),
          description: stripHtml(dayItem.description || "")
        }));
      }

      // Build inclusions — word for word from source
      let inclusions;
      if (correction.customInclusions) {
        inclusions = correction.customInclusions;
      } else if (rawTrip.inclusions && rawTrip.inclusions.length > 0) {
        inclusions = rawTrip.inclusions.map(item => stripHtml(item));
      } else {
        inclusions = [
          "Accommodation as per itinerary",
          "Meals as mentioned in itinerary",
          "All transfers by private vehicle",
          "Trip Captain / Coordinator",
          "Toll, parking & driver charges"
        ];
      }

      // Build exclusions — word for word from source
      let exclusions;
      if (correction.customExclusions) {
        exclusions = correction.customExclusions;
      } else if (rawTrip.exclusions && rawTrip.exclusions.length > 0) {
        exclusions = rawTrip.exclusions.map(item => stripHtml(item));
      } else {
        exclusions = [
          "Personal expenses",
          "Meals not mentioned in itinerary",
          "Entry tickets & adventure activities",
          "Travel insurance",
          "5% GST"
        ];
      }

      // Build description
      const description = correction.description || stripHtml(rawTrip.description) || tripTitle;

      // Normalize popupDetails to prevent map crashes on string properties
      let popupDetails = null;
      if (correction.popupDetails) {
        popupDetails = {
          cancellation: [],
          gears: [],
          terms: [],
          etiquette: [],
          carry: []
        };
        
        if (typeof correction.popupDetails.cancellation === 'string') {
          popupDetails.cancellation = correction.popupDetails.cancellation
            .split('.')
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => {
              const parts = s.split(':');
              return {
                label: parts[0]?.trim() || "",
                val: parts[1]?.trim() || ""
              };
            });
        } else if (Array.isArray(correction.popupDetails.cancellation)) {
          popupDetails.cancellation = correction.popupDetails.cancellation;
        }

        if (typeof correction.popupDetails.gears === 'string') {
          const items = correction.popupDetails.gears
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => ({ item: s, price: "Free" }));
          popupDetails.gears = [{ category: "Required Gears", items }];
        } else if (Array.isArray(correction.popupDetails.gears)) {
          popupDetails.gears = correction.popupDetails.gears;
        }

        if (typeof correction.popupDetails.terms === 'string') {
          popupDetails.terms = correction.popupDetails.terms
            .split('.')
            .map(s => s.trim())
            .filter(Boolean);
        } else if (Array.isArray(correction.popupDetails.terms)) {
          popupDetails.terms = correction.popupDetails.terms;
        }

        if (typeof correction.popupDetails.etiquette === 'string') {
          popupDetails.etiquette = correction.popupDetails.etiquette
            .split('.')
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => ({ title: "Guideline", desc: s }));
        } else if (Array.isArray(correction.popupDetails.etiquette)) {
          popupDetails.etiquette = correction.popupDetails.etiquette;
        }
      }

      // Assemble full trip data
      const tripData = {
        title: tripTitle,
        price: correction.price,
        location: correction.location,
        duration: correction.duration,
        description: description,
        category: correction.category,
        heroImage: heroImage,
        images: images,
        itinerary: itinerary,
        status: "published",
        isActive: true,
        tenantId: "default",
        order: correction.order,

        // Structured JSON fields
        inclusions: inclusions,
        exclusions: exclusions,
        availableDates: correction.availableDates || [],
        variants: correction.variants || [],
        travelOptions: correction.travelOptions || null,
        roomOptions: correction.roomOptions || null,
        seo: correction.seo || null,
        highlights: correction.highlights || null,
        faqs: correction.faqs || null,
        popupDetails: popupDetails,
        route: correction.route || null,

        // Trip metadata fields
        difficulty: correction.difficulty || null,
        ageLimit: correction.ageLimit || null,
        maxAltitude: correction.maxAltitude || null,
        tripType: correction.tripType || null,
        startEnd: correction.startEnd || null,
        pickupMode: correction.pickupMode || null,
        stickyCardPrice: correction.stickyCardPrice || null,
        stickyCardLabel: correction.stickyCardLabel || null,
        departureCity: correction.startEnd ? correction.startEnd.split(' to ')[0] : null,
      };

      await prisma.trip.upsert({
        where: { slug: tripSlug },
        update: tripData,
        create: {
          ...tripData,
          slug: tripSlug
        }
      });

      console.log(`   ✅ Upserted: ${tripTitle}`);
      console.log(`      slug: ${tripSlug}`);
      console.log(`      price: ₹${correction.price}`);
      console.log(`      images: ${images.length}`);
      console.log(`      itinerary: ${itinerary.length} days`);
      console.log(`      inclusions: ${inclusions.length}`);
      console.log(`      exclusions: ${exclusions.length}`);
    }

    // ── 3. Seed Reviews ──
    console.log("\n📝 Seeding Reviews...");
    await prisma.review.deleteMany({});

    for (const r of REVIEWS_DATA) {
      // Find matching trip by search term
      const trip = await prisma.trip.findFirst({
        where: { title: { contains: r.tripSearch, mode: 'insensitive' } }
      });

      await prisma.review.create({
        data: {
          userName: r.userName,
          instagram: r.instagram,
          city: r.city,
          comment: r.comment,
          rating: r.rating,
          isFeatured: r.isFeatured,
          tripId: trip ? trip.id : null,
          tripName: trip ? trip.title : "General Testimonial",
          isActive: true,
          tenantId: 'default'
        }
      });
      console.log(`   ✅ Review: ${r.userName} (${r.city}) → ${trip ? trip.title : 'General'}`);
    }

    // ── 4. Seed Blogs ──
    console.log("\n📰 Seeding Blog Articles...");
    await prisma.blog.deleteMany({});

    for (const b of BLOGS_DATA) {
      const blogSlug = slugify(b.title, { lower: true, strict: true });
      await prisma.blog.create({
        data: {
          title: b.title,
          slug: blogSlug,
          content: b.content,
          image: b.image,
          author: b.author,
          readTime: b.readTime,
          hasVideo: b.hasVideo,
          status: "published",
          isActive: true,
          tenantId: 'default'
        }
      });
      console.log(`   ✅ Blog: ${b.title}`);
    }

    // ── 5. Verification ──
    console.log("\n🔍 Running Verification...");
    const tripCount = await prisma.trip.count();
    const reviewCount = await prisma.review.count();
    const blogCount = await prisma.blog.count();

    const allTrips = await prisma.trip.findMany({
      select: { slug: true, title: true, price: true, order: true, images: true },
      orderBy: { order: 'asc' }
    });

    console.log("\n╔══════════════════════════════════════════════════════════════╗");
    console.log("║              IMPORT VERIFICATION REPORT                     ║");
    console.log("╠══════════════════════════════════════════════════════════════╣");
    console.log(`║  Trips:    ${tripCount} / 8 expected                                 ║`);
    console.log(`║  Reviews:  ${reviewCount} / 6 expected                                 ║`);
    console.log(`║  Blogs:    ${blogCount} / 3 expected                                 ║`);
    console.log("╠══════════════════════════════════════════════════════════════╣");

    for (const t of allTrips) {
      const imgStr = `${t.images.length} imgs`.padEnd(8);
      const priceStr = `₹${t.price}`.padEnd(8);
      console.log(`║  #${t.order} ${t.title.substring(0, 38).padEnd(38)} ${priceStr} ${imgStr} ║`);
    }

    console.log("╚══════════════════════════════════════════════════════════════╝");

    // Validate all critical fields
    const tripsWithIssues = await prisma.trip.findMany({
      where: {
        OR: [
          { heroImage: null },
          { images: { isEmpty: true } },
          { itinerary: { equals: null } },
          { description: '' }
        ]
      },
      select: { slug: true, title: true }
    });

    if (tripsWithIssues.length > 0) {
      console.log("\n⚠️  Trips with potential issues:");
      tripsWithIssues.forEach(t => console.log(`   - ${t.slug}: ${t.title}`));
    } else {
      console.log("\n✅ All trips have complete data: heroImage, images, itinerary, description");
    }

    console.log("\n🌟 ALL-IN-ONE IMPORT COMPLETE!");

  } catch (error) {
    console.error("\n❌ Import Failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
