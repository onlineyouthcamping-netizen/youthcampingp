const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TRIPS_TO_SEED = [
  {
    title: "Kerala Getaway 2026 — 5D/4N",
    slug: "kerala-getaway-2026-5d-4n",
    shortName: "Kerala Getaway",
    location: "Kerala",
    price: 15999,
    duration: "5 Days / 4 Nights",
    description: "Backwaters • Waterfalls • Beaches • Hills. Experience the 'God's Own Country' with our curated 5-day journey from the colonial charm of Kochi to the misty hills of Munnar, the wildlife of Thekkady, and the serene backwaters of Alleppey.",
    category: "Backpacking",
    difficulty: "easy",
    status: "published",
    isActive: true,
    heroImage: "https://images.unsplash.com/photo-1602216056096-3c40cc0c9944?auto=format&fit=crop&q=80&w=2000",
    images: [
      "https://images.unsplash.com/photo-1590595906931-81f04f0ccebb?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1593118247619-e2d6f056869e?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=800"
    ],
    route: [
      { label: "Cochin", icon: "plane" },
      { label: "Munnar", icon: "car" },
      { label: "Thekkady", icon: "car" },
      { label: "Alleppey", icon: "car" },
      { label: "Cochin", icon: "car" }
    ],
    highlights: [
      "Valara & Cheeyappara Waterfalls",
      "Spice Plantation Visit in Munnar",
      "Echo Point & Kundala Dam in Munnar",
      "Periyar Lake Cruise & Elephant Ride (Optional) in Thekkady",
      "Traditional Kathakali & Kalaripayattu Show",
      "Houseboat Backwater Experience in Alleppey"
    ],
    inclusions: [
      "Comfortable travel in AC vehicle for all transfers from Cochin",
      "02 Nights stay in Munnar",
      "01 Night stay in Thekkady",
      "01 Night stay in Alleppey",
      "Complete transfers and sightseeing as per itinerary",
      "Daily Breakfast (Day 2 to Day 5)",
      "01 Lunch & 01 Dinner during houseboat stay in Alleppey",
      "All toll charges, parking fees & state taxes included",
      "Professional and experienced driver charges included",
      "Dedicated trip assistance by Team Youthcamping for smooth coordination"
    ],
    exclusions: [
      "05% GST on total billing",
      "Any personal expenses such as shopping, laundry, tips, etc.",
      "Entry tickets for monuments, parks, museums, cruises, jeep safaris, houseboats, or any activities not mentioned in inclusions",
      "Any additional cost due to natural events like landslides, roadblocks, weather conditions, or unforeseen circumstances (to be paid directly on the spot)",
      "Anything not mentioned in the 'Inclusions' section"
    ],
    availableDates: [
      { date: "2026-06-06", capacity: 20 },
      { date: "2026-06-13", capacity: 20 },
      { date: "2026-06-20", capacity: 20 },
      { date: "2026-06-27", capacity: 20 },
      { date: "2026-07-04", capacity: 20 },
      { date: "2026-07-11", capacity: 20 },
      { date: "2026-07-18", capacity: 20 },
      { date: "2026-07-25", capacity: 20 },
      { date: "2026-08-02", capacity: 20 }
    ],
    variants: [
      { location: "Triple Sharing basis", originalPrice: 20999, discountedPrice: 15999 },
      { location: "Double sharing basis", originalPrice: 22999, discountedPrice: 16999 }
    ],
    addons: [
      { name: "House Boat Basic (Shared)", rate: 999, description: "Shared Houseboat experience per person." },
      { name: "House Boat (Private)", rate: 2499, description: "Private boat per person if 3 or more rooms." },
      { name: "Extra Stay Cochin/Trivandram", rate: 999, description: "Additional stay per person." }
    ],
    accommodations: [
      { name: "Standard Munnar Resort", location: "Munnar", nights: "2 Nights" },
      { name: "Thekkady Nature Stay", location: "Thekkady", nights: "1 Night" },
      { name: "Alleppey Lakeview Stay", location: "Alleppey", nights: "1 Night" }
    ],
    popupDetails: {
      carry: [
        { label: "Clothing", val: "Light cottons, 1 Light jacket/hoodie for Munnar, Quick-dry clothes, Flip flops, Raincoat" },
        { label: "Personal Utilities", val: "Sunglasses, Sunscreen, Lip balm, Personal toiletries & medication, Mosquito repellent, Power bank, daypack" }
      ],
      gears: [
        {
          category: "Required Gears",
          items: [
            { item: "Light cotton clothes", price: "Free" },
            { item: "Jacket / Hoodie", price: "Free" },
            { item: "Comfortable walking shoes", price: "Free" },
            { item: "Sun cap & Sunglasses", price: "Free" },
            { item: "Power bank", price: "Free" }
          ]
        }
      ],
      cancellation: [
        { label: "Before 45 days", val: "80% refund" },
        { label: "Before 30 days", val: "50% refund" },
        { label: "Before 15 days", val: "25% refund" },
        { label: "Within 15 days", val: "No refund" },
        { label: "Advance booking", val: "Non-refundable" }
      ],
      terms: [
        "Only people of age 12 to 35 years are allowed",
        "5% GST applicable on all packages",
        "More than 4 persons required to join this trip on custom dates"
      ],
      etiquette: [
        { title: "Guideline", desc: "Respect local culture and customs" },
        { title: "Guideline", desc: "No littering in backwaters or parks" },
        { title: "Guideline", desc: "Follow driver and trip captain instructions" }
      ],
      showRentedGears: true
    },
    faqs: [
      { question: "What is the age limit for this Kerala Trip?", answer: "This trip is designed for young travelers aged between 12 to 35 years." },
      { question: "What type of vehicles are used for transfers?", answer: "We use private AC vehicles like Sedan, SUV or Tempo Traveller depending on the group size." },
      { question: "Is the Houseboat stay private?", answer: "Houseboat stays are on a shared basis by default. A private houseboat can be booked as an optional add-on if you are booking 3 or more rooms." },
      { question: "Are meals included in the package?", answer: "The package includes 4 Breakfasts and 4 Dinners at Munnar/Thekkady hotels, and 1 Lunch + 1 Dinner during the houseboat stay in Alleppey." }
    ],
    itinerary: [
      {
        day: 1,
        title: "Scenic Drive to Munnar",
        description: "• Warm pick-up from Ernakulam Railway Station (9:00 AM) or Cochin Airport (10:00 AM)\n• Scenic mountain drive to Munnar through lush green hills and misty valleys\n• Enroute sightseeing of the beautiful Valara & Cheeyappara Waterfalls\n• Explore aromatic spice plantations in Munnar\n• Check in to Munnar hotel, relax, and enjoy dinner",
        stay: "Hotel in Munnar",
        meals: "Dinner Included"
      },
      {
        day: 2,
        title: "Explore the Beauty of Munnar",
        description: "• Enjoy a healthy morning breakfast at the hotel\n• Sightseeing of Mattupetty Dam, Echo Point, and Kundala Dam\n• Visit Eravikulam National Park to witness rare wildlife (subject to guidelines)\n• Visit Munnar Rose Garden and enjoy local market shopping & café hopping\n• Return to the hotel for a cozy dinner and overnight stay",
        stay: "Hotel in Munnar",
        meals: "Breakfast & Dinner Included"
      },
      {
        day: 3,
        title: "Thekkady – Wildlife & Cultural Experience",
        description: "• Breakfast at hotel and check-out by 8:00 AM\n• Scenic drive from Munnar to Thekkady\n• Periyar Lake cruise to spot wild elephants, deer, and boar (optional/self-paid)\n• Elephant interaction experience in Periyar (optional/self-paid)\n• Experience traditional Kalaripayattu martial arts and Kathakali cultural show\n• Check in to hotel, enjoy dinner, and rest",
        stay: "Hotel stay in Thekkady",
        meals: "Breakfast & Dinner Included"
      },
      {
        day: 4,
        title: "Thekkady to Alleppey – Backwater Paradise",
        description: "• Breakfast at hotel, check out, and head to Alleppey\n• Journey to the backwater paradise, the 'Venice of the East'\n• Optional Shikara or Houseboat cruise through tranquil canals (direct payment)\n• Admire beautiful backwater villages, paddy fields, and coconut groves\n• Check in to hotel/houseboat, enjoy dinner, and relax",
        stay: "Hotel/Houseboat Alleppey",
        meals: "Breakfast & Dinner Included"
      },
      {
        day: 5,
        title: "Alleppey to Cochin",
        description: "• Enjoy breakfast by the backwaters and check out\n• Drive back to Cochin/Kochi\n• Drop off at Ernakulam Railway Station or Cochin Airport\n• Journey concludes with unforgettable memories",
        stay: "",
        meals: "Breakfast Included"
      }
    ],
    stickyCardPrice: 15999,
    stickyCardLabel: "per person"
  },
  {
    title: "Manali Kasol Amritsar Backpacking Trip — 9D/8N",
    slug: "manali-kasol-amritsar-backpacking-trip-9d-8n",
    shortName: "Manali Kasol Amritsar",
    location: "Himachal & Punjab",
    price: 11999,
    duration: "9 Days / 8 Nights",
    description: "Mountains • Camps • Culture • Adventure. The ultimate Himachal backpacking adventure. Camp along the Parvati River, trek to Bijli Mahadev and Jogini Waterfalls, cross the Atal Tunnel to explore Sissu, and visit the Golden Temple & Wagah Border in Amritsar.",
    category: "Backpacking",
    difficulty: "moderate",
    status: "published",
    isActive: true,
    heroImage: "https://images.unsplash.com/photo-1544735716-392fe2709496?auto=format&fit=crop&q=80&w=2000",
    images: [
      "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1597037750734-450f6f406560?auto=format&fit=crop&q=80&w=800"
    ],
    route: [
      { label: "Ahmedabad", icon: "train" },
      { label: "Amritsar", icon: "car" },
      { label: "Kasol", icon: "car" },
      { label: "Kullu", icon: "car" },
      { label: "Manali", icon: "car" },
      { label: "Ahmedabad", icon: "train" }
    ],
    highlights: [
      "Wagah Border Indo-Pak Ceremony",
      "Golden Temple Sightseeing",
      "Riverside Camping in Kasol",
      "Bijli Mahadev & Jogini Waterfall Trek",
      "White Water Rafting & Rope Adventures in Kullu",
      "Atal Tunnel, Solang Valley & Sissu Lake"
    ],
    inclusions: [
      "All transfers by Tempo Traveller",
      "Round trip sleeper class train tickets (subject to availability)",
      "2 Nights stay at Manali hotel/Cottage, 1 Night stay at Kullu Campsite, 1 Night stay at Kasol Campsite/Cottage in 4 Sharing",
      "Bonfire, Music Party",
      "Rope Adventure Activities & Trekking",
      "5 Breakfast, 5 Lunch & 4 Dinner",
      "Trip Captain",
      "Rafting & Activities Burma Bridge, Balanced Bridge, Rock Climbing",
      "Sightseeing & 'Dher Saari Masti'",
      "Toll, Parking and Transport Taxes"
    ],
    exclusions: [
      "Personal Expenses",
      "5% GST on billing",
      "Any cost arising due to natural calamities like landslides, road blocks etc. to be borne by the client directly on the spot",
      "Paragliding, Heater Charges, Tips, Pony Rides, Entry fee, snow suit rent, adventure activities at solang valley, 4*4 Vehicle",
      "Personal Expense of any kind, anything not specifically mentioned under the head 'Includes'",
      "Guide during train journey",
      "Any additional meals or stays other than mentioned in itinerary"
    ],
    availableDates: [
      { date: "2026-05-02", capacity: 20 }, { date: "2026-05-09", capacity: 20 }, { date: "2026-05-17", capacity: 20 }, { date: "2026-05-23", capacity: 20 }, { date: "2026-05-30", capacity: 20 },
      { date: "2026-06-06", capacity: 20 }, { date: "2026-06-13", capacity: 20 }, { date: "2026-06-20", capacity: 20 }, { date: "2026-06-27", capacity: 20 },
      { date: "2026-07-04", capacity: 20 }, { date: "2026-07-11", capacity: 20 }, { date: "2026-07-18", capacity: 20 }, { date: "2026-07-25", capacity: 20 },
      { date: "2026-08-02", capacity: 20 }, { date: "2026-08-09", capacity: 20 }, { date: "2026-08-17", capacity: 20 }, { date: "2026-08-23", capacity: 20 }, { date: "2026-08-30", capacity: 20 },
      { date: "2026-09-06", capacity: 20 }, { date: "2026-09-13", capacity: 20 }, { date: "2026-09-20", capacity: 20 }, { date: "2026-09-27", capacity: 20 },
      { date: "2026-10-04", capacity: 20 }, { date: "2026-10-11", capacity: 20 }, { date: "2026-10-18", capacity: 20 }, { date: "2026-10-25", capacity: 20 }
    ],
    variants: [
      { location: "From Jalandhar (4 Sharing)", originalPrice: 15999, discountedPrice: 11999 },
      { location: "From Ahmedabad Sleeper Train (4 Sharing)", originalPrice: 17999, discountedPrice: 12999 },
      { location: "From Vadodara/Surat Sleeper (4 Sharing)", originalPrice: 18499, discountedPrice: 13499 },
      { location: "From Mumbai Sleeper Train (4 Sharing)", originalPrice: 18999, discountedPrice: 13999 },
      { location: "From Ahmedabad 3Tier AC Train (4 Sharing)", originalPrice: 20999, discountedPrice: 14999 },
      { location: "Delhi to Delhi (Without Amritsar) (4 Sharing)", originalPrice: 19999, discountedPrice: 14999 }
    ],
    addons: [
      { name: "Double sharing upgrade", rate: 1999, description: "Per person additional for double room sharing." }
    ],
    accommodations: [
      { name: "Kasol Riverside Camps", location: "Kasol", nights: "1 Night" },
      { name: "Kullu Adventure Camps", location: "Kullu", nights: "1 Night" },
      { name: "Manali Cottage/Hotel", location: "Manali", nights: "2 Nights" }
    ],
    popupDetails: {
      carry: [
        { label: "Clothing", val: "Thermal inners, winter cap, woolen sweater, gloves, raincoat, hat/cap" },
        { label: "Toiletries", val: "Moisturizer, lip balm, sunscreen, government ID, power bank, sanitizer" }
      ],
      gears: [
        {
          category: "Required Gears",
          items: [
            { item: "Thermal Inner & Sweaters", price: "Free" },
            { item: "Winter gloves & cap", price: "Free" },
            { item: "Trekking shoes with socks", price: "Free" },
            { item: "Raincoat / Poncho", price: "Free" },
            { item: "Rucksack and power bank", price: "Free" }
          ]
        }
      ],
      cancellation: [
        { label: "Before 45 days", val: "80% refund" },
        { label: "Before 30 days", val: "50% refund" },
        { label: "Before 15 days", val: "25% refund" },
        { label: "Within 15 days", val: "No refund" },
        { label: "Advance booking amount", val: "Non-refundable" }
      ],
      terms: [
        "Only people of age 12 to 35 years are allowed",
        "5% GST applicable on all packages",
        "Train tickets are subject to availability. Book 40-50 days in advance."
      ],
      etiquette: [
        { title: "Cleanliness", desc: "Do not throw plastic or garbage on treks." },
        { title: "Coordination", desc: "Follow the guidelines and timings of the Trip Captain." }
      ],
      showRentedGears: true
    },
    faqs: [
      { question: "What is the group size for the Himachal Tour?", answer: "Usually, the group consists of 15 to 30 travelers to maintain community vibes and safety." },
      { question: "Is the Wagah Border parade ceremony guaranteed?", answer: "Wagah Border is included if traveling by Janmabhoomi Express. If traveling by Jammu Tawi, the ceremony might be missed due to timings." },
      { question: "Are adventure activities like Rafting safe?", answer: "Yes, river rafting is performed by certified local experts. We include a complimentary 8KM rafting session (subject to weather)." },
      { question: "Is this trip safe for solo female travelers?", answer: "Absolutely! We ensure safety first and separate rooms/tents are allocated for female travelers." }
    ],
    itinerary: [
      {
        day: 1,
        title: "Train Journey to Jalandhar",
        description: "• Meet the YouthCamping representative at the railway station in the morning\n• Receive trip captain contact details on WhatsApp before departure\n• Board the train to Jalandhar/Amritsar\n• Participate in group games, ice-breaking sessions, and travel activities",
        stay: "Overnight in Train",
        meals: ""
      },
      {
        day: 2,
        title: "Visit Wagha Border & Golden Temple",
        description: "• Arrive at Jalandhar/Amritsar\n• Drive to Wagah Border for the historic Indo-Pak Ceremonial Parade (if closed, visit Jallianwala Bagh)\n• Explore the spiritual Golden Temple and shop for souvenirs at Amritsar market\n• Board the vehicle for a night drive to Kasol",
        stay: "Overnight travel",
        meals: ""
      },
      {
        day: 3,
        title: "Kasol & Parvati valley Exploration",
        description: "• Reach the Kasol Campsite by 11:00 AM and check in\n• Relish a hot breakfast and enjoy free time to rest\n• Guided 2-hour hike to Chalal Village along the gushing Parvati River\n• Visit Manikaran Gurudwara and the local Kasol market in the evening\n• Return to camp for a cozy bonfire, music, and group games",
        stay: "Camping/cottage in Kasol",
        meals: "Breakfast, Lunch, Dinner Included"
      },
      {
        day: 4,
        title: "Bijli Mahadev Trek",
        description: "• Early morning breakfast and check-out\n• Drive to the starting point of the Bijli Mahadev Trek\n• Trek with a daypack to witness a 360° view of the snow-clad Himalayas\n• Complete the trek and drive to Kullu\n• Check in at Swiss camps, enjoy dinner, and relax",
        stay: "Swiss Camp in Kullu",
        meals: "Breakfast, Lunch, Dinner Included"
      },
      {
        day: 5,
        title: "Kullu Adventure Activities & Transfer to Manali",
        description: "• Breakfast at camps followed by outdoor adventure rope activities\n• Try camp activities: Burma Bridge, Balanced Bridge, Rock Climbing\n• Transfer to the highest paragliding spot in Manali (optional/self-paid)\n• Enjoy a complimentary 8KM white water river rafting session in Beas River\n• Visit the Kullu Shawl Factory, drive to Manali, and check in",
        stay: "Hotel or Cottages in Manali",
        meals: "Breakfast, Lunch, Dinner Included"
      },
      {
        day: 6,
        title: "Solang Valley - Atal Tunnel - Sissu",
        description: "• Depart early morning to the scenic Solang Valley for snow activities\n• Cross the Atal Tunnel, Asia's longest highway tunnel\n• Explore Sissu Village and the beautiful Sissu Lake in Lahaul Valley\n• Option to rent a bike for a ride through the tunnel & Sissu\n• Drive back to Manali for dinner and a cottage stay",
        stay: "Hotel or Cottages in Manali",
        meals: "Breakfast, Lunch, Dinner Included"
      },
      {
        day: 7,
        title: "Manali Sightseeing & Jogini Waterfall Trek",
        description: "• Have breakfast, check out, and head to Vashisht village\n• Trek to the stunning 160-foot Jogini Waterfall\n• Explore Hadimba Devi Temple, Old Manali cafés, and Mall Road shopping\n• Enjoy dinner, then board the vehicle for a night drive back to Jalandhar/Una",
        stay: "Overnight travel",
        meals: "Breakfast & Lunch Included"
      },
      {
        day: 8,
        title: "Return Train Journey to Your City",
        description: "• Reach Jalandhar/Una railway station\n• Board the return train back to Ahmedabad/your city\n• Enjoy the journey with group activities, cards, and sharing memories",
        stay: "Overnight in Train",
        meals: ""
      },
      {
        day: 9,
        title: "Arrive at Your City",
        description: "• Reach your home city safely in the morning\n• Trip concludes with new friends and a bag full of memories",
        stay: "",
        meals: ""
      }
    ],
    stickyCardPrice: 11999,
    stickyCardLabel: "per person"
  },
  {
    title: "Leh Ladakh Bike Trip with Turtuk — 7D/6N",
    slug: "leh-ladakh-bike-trip-with-turtuk-7d-6n",
    shortName: "Leh Ladakh Bike Expedition 2026",
    location: "Ladakh",
    price: 19999,
    duration: "7 Days / 6 Nights",
    description: "High Passes • Double-Humped Camels • Last Indian Village. A classic Ladakh bike journey. Ride through the highest motorable road at Khardung La (18,380 ft), visit the desert sand dunes of Hunder in Nubra, drive to Turtuk on the Baltistan border, and gaze at the blue waters of Pangong Lake.",
    category: "Bike Expedition",
    difficulty: "hard",
    status: "published",
    isActive: true,
    heroImage: "https://images.unsplash.com/photo-1597037750734-450f6f406560?auto=format&fit=crop&q=80&w=2000",
    images: [
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1544735716-392fe2709496?auto=format&fit=crop&q=80&w=800"
    ],
    route: [
      { label: "Leh", icon: "plane" },
      { label: "Nubra Valley", icon: "car" },
      { label: "Turtuk", icon: "car" },
      { label: "Pangong Lake", icon: "car" },
      { label: "Leh", icon: "car" }
    ],
    highlights: [
      "Confluence of Indus & Zanskar (Sangam)",
      "Magnetic Hill & Gurudwara Pathar Sahib",
      "Khardung La Pass (18,380 ft)",
      "Maitreya Buddha & Diskit Monastery",
      "Balti Village Exploration at Turtuk",
      "Sunset and stargazing at Pangong Lake",
      "Chang La Pass (17,800 ft)"
    ],
    inclusions: [
      "Accommodations for 06 Nights in Hotels along with Camps/Cottages and Homestays on Triple/Quad sharing Basis",
      "All meals mentioned in the itinerary (6 Breakfast & 6 Dinner)",
      "Bike Rent for 5 Days (Leh to Leh) (Himalayan 411 CC)",
      "Fuel for the bike as per itinerary",
      "Mechanical & Luggage Backup vehicle (MUV/Traveler/Bolero Camper)",
      "24X7 customer support by trip captain",
      "All inner line permits for the trip",
      "Riding Jacket, Helmet, Gloves, and Knee Pads",
      "First aid kit & Oxygen Cylinder in backup vehicle",
      "Complementary Bonfire Night",
      "Group Pickup and Drop Facilities from Leh Airport",
      "RE mechanic with spare parts enroute"
    ],
    exclusions: [
      "5% GST",
      "Early check-in at the hotel",
      "Any personal expenses or shopping",
      "Additional accommodation/food costs incurred due to travel delays",
      "Cost Of Any Spare Part used due to accidental damage when bike is with rider",
      "Cost to transfer or tow bike if dropped on the way",
      "Vehicle servicing or maintenance cost",
      "Any lunch and other meals not mentioned in inclusions",
      "Airfare / Rail fare to Leh",
      "Parking and monument entry fees during sightseeing",
      "Additional Costs due to Flight Cancellations, Landslides, Roadblocks, and natural calamities"
    ],
    availableDates: [
      { date: "2026-05-09", capacity: 15 }, { date: "2026-05-23", capacity: 15 },
      { date: "2026-06-06", capacity: 15 }, { date: "2026-06-20", capacity: 15 },
      { date: "2026-07-04", capacity: 15 }, { date: "2026-07-18", capacity: 15 },
      { date: "2026-08-04", capacity: 15 }, { date: "2026-08-18", capacity: 15 },
      { date: "2026-09-05", capacity: 15 }, { date: "2026-09-26", capacity: 15 }
    ],
    variants: [
      { location: "RE Himalayan (Solo Rider)", originalPrice: 29999, discountedPrice: 24999 },
      { location: "RE Himalayan (With Pillion)", originalPrice: 24999, discountedPrice: 19999 }
    ],
    addons: [
      { name: "Double Sharing Upgrade", rate: 2500, description: "Upgrade to double sharing room for the entire trip." }
    ],
    accommodations: [
      { name: "Standard Leh Hotel", location: "Leh", nights: "3 Nights" },
      { name: "Nubra Valley Camps", location: "Nubra Valley", nights: "2 Nights" },
      { name: "Pangong Lakeside Camps", location: "Pangong Lake", nights: "1 Night" }
    ],
    popupDetails: {
      carry: [
        { label: "Clothing", val: "Thermal inners, heavy winter jacket, woolen sweater, gloves, raincoat, woolen socks" },
        { label: "Essentials", val: "Sunglasses (UV protected), sunscreen SPF 50+, lip balm, personal medication, power bank" }
      ],
      gears: [
        {
          category: "Provided Riding Gears",
          items: [
            { item: "Riding Jacket", price: "Free" },
            { item: "Helmet", price: "Free" },
            { item: "Knee Pads & Gloves", price: "Free" },
            { item: "RE Himalayan Bike & Fuel", price: "Included" }
          ]
        }
      ],
      cancellation: [
        { label: "Before 45 days", val: "80% refund" },
        { label: "Before 30 days", val: "50% refund" },
        { label: "Before 15 days", val: "25% refund" },
        { label: "Within 15 days", val: "No refund" },
        { label: "Advance booking amount", val: "Non-refundable" }
      ],
      terms: [
        "Only people of age 12 to 35 years are allowed",
        "5% GST applicable on all packages",
        "Any accidental damage cost to the bike is to be borne by the rider directly."
      ],
      etiquette: [
        { title: "Acclimatization", desc: "Strictly rest on Day 1 to avoid AMS." },
        { title: "Eco-ride", desc: "Do not throw litter or plastic bottles near the lakes." }
      ],
      showRentedGears: true
    },
    faqs: [
      { question: "Why is the first day strictly for acclimatization?", answer: "Leh is located at 11,500 ft. Adapting to the high altitude is crucial to prevent Acute Mountain Sickness (AMS). Rest, hydration, and minimal activity on Day 1 are mandatory." },
      { question: "Is fuel included in the package?", answer: "Yes, fuel for the bike as per the standard itinerary is included in the package." },
      { question: "Do you provide medical support?", answer: "Yes, we carry a first aid kit and have an oxygen cylinder available in our backup vehicle 24/7." },
      { question: "Is there electricity at Nubra and Pangong Camps?", answer: "Due to the remote location and high altitude, electricity at Nubra and Pangong camps is only available for a few hours (usually 7 PM to 11 PM)." }
    ],
    itinerary: [
      {
        day: 1,
        title: "Leh Arrival - Acclimatization Day",
        description: "• Welcome to the land of high passes! Meet the group at Leh Airport\n• Transfer to hotel via private vehicle (pickup from 9 AM to 12 PM)\n• Complete rest and acclimatization to high altitude\n• Stay hydrated and avoid physical exertion\n• Evening briefing about biking rules by the trip captain",
        stay: "Hotel stay in Leh",
        meals: "Dinner Included"
      },
      {
        day: 2,
        title: "Leh Local Sightseeing (50-60 KMS)",
        description: "• Post breakfast, bike allocation and briefing session\n• Ride to Sangam, the confluence of Indus and Zanskar rivers\n• Visit the holy Gurudwara Pathar Sahib\n• Explore the gravity-defying Magnetic Hill\n• Visit the historic Hall of Fame and the peaceful Shanti Stupa\n• Spend the evening shopping or café hopping at Leh Market",
        stay: "Hotel stay in Leh",
        meals: "Breakfast & Dinner Included"
      },
      {
        day: 3,
        title: "Leh to Nubra Valley (130 KMS)",
        description: "• Ride via the world-famous Khardung La Pass (18,380 ft)\n• Visit Diskit Monastery and see the giant 106-foot Maitreya Buddha\n• Explore Hunder Sand Dunes and enjoy a double-humped camel ride (optional)\n• Check in to Nubra Valley camps\n• Hot bucket of water provided for freshening up in morning",
        stay: "Camp stay in Nubra valley",
        meals: "Breakfast & Dinner Included"
      },
      {
        day: 4,
        title: "Nubra to Turtuk (170 KMS)",
        description: "• Epic ride to Turtuk, the last village on the Indo-Pak border\n• Walk through the beautiful Balti village and apricot orchards\n• Visit the Shyok River and Balti Museum\n• Return to Nubra Valley camps by evening",
        stay: "Camp stay in Nubra valley",
        meals: "Breakfast & Dinner Included"
      },
      {
        day: 5,
        title: "Nubra Valley to Pangong (180 KMS)",
        description: "• Ride to Pangong Lake via the Shyok route, enjoying scenic river vistas\n• Arrive at Pangong Lake (14,270 ft) and explore the lakeside\n• Witness the beautiful sunset and changing colors of the lake\n• Cozy camping stay near Pangong Lake under a clear starry night",
        stay: "Camp stay near Pangong",
        meals: "Breakfast & Dinner Included"
      },
      {
        day: 6,
        title: "Pangong to Leh (150 KMS)",
        description: "• Capture the freezing early morning views of Pangong Lake\n• Ride back to Leh via the challenging Chang La Pass (17,800 ft)\n• Visit Shey Palace and the grand Thiksey Monastery enroute (subject to time)\n• Reach Leh, check in, and enjoy a farewell dinner",
        stay: "Hotel stay in Leh",
        meals: "Breakfast & Dinner Included"
      },
      {
        day: 7,
        title: "Departure to Leh Airport | Tour Ends",
        description: "• Final breakfast with the group and checkout\n• Drop off at Leh Airport (fixed drop at 9:00 AM)\n• Tour concludes with high-altitude memories and new friendships",
        stay: "",
        meals: "Breakfast Included"
      }
    ],
    stickyCardPrice: 19999,
    stickyCardLabel: "per person"
  },
  {
    title: "Spiti Valley Full Circuit from Ahmedabad — 11D/10N",
    slug: "spiti-valley-full-circuit-from-ahmedabad-11d-10n",
    shortName: "Spiti Valley Road Trip",
    location: "Spiti Valley",
    price: 19999,
    duration: "11 Days / 10 Nights",
    description: "Desert Mountains • High Altitude Pass • Moon Lake. The ultimate Spiti Valley road trip starting from Ahmedabad. Traverse through Kinnaur Valley, visit Chitkul (the last village of India), cross the Kunzum Pass, camp at Chandratal Moon Lake, and cross the Atal Tunnel to Manali.",
    category: "Road Trip",
    difficulty: "hard",
    status: "published",
    isActive: true,
    heroImage: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&q=80&w=2000",
    images: [
      "https://images.unsplash.com/photo-1544735716-392fe2709496?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1597037750734-450f6f406560?auto=format&fit=crop&q=80&w=800"
    ],
    route: [
      { label: "Ahmedabad", icon: "train" },
      { label: "Shimla", icon: "car" },
      { label: "Chitkul", icon: "car" },
      { label: "Tabo", icon: "car" },
      { label: "Kaza", icon: "car" },
      { label: "Chandratal", icon: "car" },
      { label: "Manali", icon: "car" },
      { label: "Ahmedabad", icon: "train" }
    ],
    highlights: [
      "Shimla Mall Road & Souvenir Shopping",
      "Chitkul - Last Indo-Tibetan Border Village",
      "Khab Confluence of Spiti & Sutlej Rivers",
      "Nako Lake & 1000-Year-Old Tabo Monastery",
      "Dhankar Cliffside Village & Gompa",
      "Key Monastery & Chicham Suspension Bridge",
      "Komic (15,050 ft) & Hikkim Post Office (14,400 ft)",
      "Chandra Taal Moon Lake Camping"
    ],
    inclusions: [
      "All transfers by Tempo Traveller/Taxi from Chandigarh",
      "Round trip train tickets from Ahmedabad",
      "Comfortable stays in hotel/tents/Homestays on 3 & 4 sharing basis",
      "Bonfire and Music Party at Manali",
      "Trekking in Himalayas",
      "7 Breakfast & 6 Dinner (Pure Veg) as per itinerary",
      "All sightseeing as mentioned in the itinerary",
      "Expert Trip Captain throughout the journey",
      "Toll, Parking, and Transport Taxes",
      "Oxygen cylinder support with pulse oximeter"
    ],
    exclusions: [
      "Personal Expenses",
      "5% GST",
      "Any additional costs due to natural events like landslides or roadblocks",
      "Paragliding, paragliding suit, heater charges, monument entry fees",
      "Adventure activities at Solang Valley, 4x4 vehicle charges",
      "Any additional meals or stays outside the package"
    ],
    availableDates: [
      { date: "2026-06-02", capacity: 20 }, { date: "2026-06-09", capacity: 20 }, { date: "2026-06-16", capacity: 20 }, { date: "2026-06-23", capacity: 20 }, { date: "2026-06-30", capacity: 20 },
      { date: "2026-07-07", capacity: 20 }, { date: "2026-07-14", capacity: 20 }, { date: "2026-07-21", capacity: 20 }, { date: "2026-07-28", capacity: 20 },
      { date: "2026-08-04", capacity: 20 }, { date: "2026-08-11", capacity: 20 }, { date: "2026-08-18", capacity: 20 }, { date: "2026-08-25", capacity: 20 },
      { date: "2026-09-01", capacity: 20 }, { date: "2026-09-08", capacity: 20 }, { date: "2026-09-15", capacity: 20 }, { date: "2026-09-22", capacity: 20 }, { date: "2026-09-29", capacity: 20 }
    ],
    variants: [
      { location: "From Jalandhar/Chandigarh (4 Sharing)", originalPrice: 23999, discountedPrice: 19999 },
      { location: "From Ahmedabad Sleeper Train (4 Sharing)", originalPrice: 26499, discountedPrice: 21499 },
      { location: "From Ahmedabad 3Tier AC Train (4 Sharing)", originalPrice: 28499, discountedPrice: 23499 }
    ],
    addons: [
      { name: "Double Sharing Upgrade", rate: 3000, description: "Upgrade to double sharing stay (excludes Chandratal stay)." }
    ],
    accommodations: [
      { name: "Shimla Standard Hotel", location: "Shimla", nights: "1 Night" },
      { name: "Chitkul Huts/Cottage", location: "Chitkul", nights: "1 Night" },
      { name: "Tabo Traditional Homestay", location: "Tabo", nights: "1 Night" },
      { name: "Kaza Local Homestay", location: "Kaza", nights: "2 Nights" },
      { name: "Chandratal Lakeside Camps", location: "Chandratal", nights: "1 Night" },
      { name: "Manali Cottage/Hotel", location: "Manali", nights: "1 Night" }
    ],
    popupDetails: {
      carry: [
        { label: "Clothing", val: "Heavy woollens, thermal innerwear, windbreaker jacket, gloves, warm socks" },
        { label: "Sanitary", val: "Cold cream, SPF 50+ sunscreen, lip balm, personal toiletries & medications" }
      ],
      gears: [
        {
          category: "Required Gears",
          items: [
            { item: "Rucksack / main travel bag", price: "Free" },
            { item: "Heavy winter jacket & thermals", price: "Free" },
            { item: "UV protected sunglasses", price: "Free" },
            { item: "Power bank", price: "Free" }
          ]
        }
      ],
      cancellation: [
        { label: "Before 45 days", val: "80% refund" },
        { label: "Before 30 days", val: "50% refund" },
        { label: "Before 15 days", val: "25% refund" },
        { label: "Within 15 days", val: "No refund" },
        { label: "Booking fee", val: "Non-refundable" }
      ],
      terms: [
        "Only people of age 12 to 35 years are allowed",
        "5% GST applicable on all packages",
        "Chandratal Lake visit in June is subject to weather and BRO road clearance."
      ],
      etiquette: [
        { title: "Conservation", desc: "Spiti is a cold desert. Conserve water and do not litter." },
        { title: "Culture", desc: "Respect monastery rules. Remove shoes and seek permission for photos." }
      ],
      showRentedGears: true
    },
    faqs: [
      { question: "What happens if Chandratal Lake is closed?", answer: "Chandra Taal usually opens by late Mid June. If inaccessible due to snow, we alter the route to stay in Kaza or explore Kalpa and the beautiful Kinnaur region instead." },
      { question: "Is the train ticket included in the price?", answer: "Yes, the AC and Sleeper train packages from Ahmedabad include round-trip train tickets." },
      { question: "Are medical facilities available in Spiti?", answer: "Spiti is very remote. Basic medical stores are in Kaza. We carry a first aid kit and an oxygen cylinder in the backup vehicle for emergencies." },
      { question: "Are electricity and network available in Spiti?", answer: "Electricity is intermittent. Only BSNL and Jio work in Kaza. Network is mostly absent in other parts like Chitkul, Tabo, and Chandratal." }
    ],
    itinerary: [
      {
        day: 1,
        title: "Train Journey Ahmedabad to Chandigarh/Jalandhar",
        description: "• Board the train from Ahmedabad/your city\n• Enjoy an overnight train ride passing through Gujarat, Rajasthan, and Haryana\n• Bond with fellow travelers over games and local train snacks\n• Contact details of the trip representative shared on WhatsApp beforehand",
        stay: "Overnight in Train",
        meals: ""
      },
      {
        day: 2,
        title: "Drive to Shimla/Narkanda",
        description: "• Arrive at Chandigarh (8:00 AM) or Jalandhar railway station\n• Depart for Shimla by Tempo Traveller or Taxi\n• Enjoy a scenic drive into the lower Himalayas\n• Stroll through Shimla Mall Road for shopping if time permits\n• Check in at the hotel for dinner and rest",
        stay: "Hotel in Shimla",
        meals: "Dinner Included"
      },
      {
        day: 3,
        title: "Shimla to Chitkul - The Ultimate Road Trip",
        description: "• Adventure begins with a mountain drive from Shimla\n• Travel through the breathtaking Kinnaur Valley along the Sutlej River\n• Reach Chitkul, the last inhabited village on the old Hindustan-Tibet trade route\n• Check in at wooden cottages/hotel and enjoy dinner",
        stay: "Cottage in Chitkul/Sangla",
        meals: "Breakfast, Dinner Included"
      },
      {
        day: 4,
        title: "Chitkul to Tabo via Nako Lake",
        description: "• Depart Chitkul and explore serene Indo-Tibetan border villages\n• Witness Khab, the confluence of Spiti and Sutlej rivers\n• Take a peaceful walk around the high-altitude Nako Lake\n• Drive to Tabo, check in at a traditional homestay, and enjoy dinner",
        stay: "Homestay in Tabo",
        meals: "Breakfast, Dinner Included"
      },
      {
        day: 5,
        title: "Explore Tabo and Dhankar Village",
        description: "• Visit the 1000-year-old Tabo Monastery, famous for ancient mud statues & paintings\n• Enjoy a panoramic 360-degree sky view of the rugged Spiti Valley\n• Explore Dhankar cliffside village and the ancient Dhankar Gompa\n• Drive to Kaza, check in to your homestay, and explore Kaza Market",
        stay: "Homestay in Kaza",
        meals: "Breakfast, Dinner Included"
      },
      {
        day: 6,
        title: "Key, Komic, Langza, and Hikkim in a day",
        description: "• Visit Key Monastery, the largest spiritual center in Spiti Valley\n• Drive to Komic (15,050 ft), the highest motorable village in the world\n• See the majestic Buddha Statue overlooking snow peaks at Langza (14,300 ft)\n• Search for ancient marine fossils in Langza village\n• Post a card to your family from the world's highest post office at Hikkim (14,400 ft)",
        stay: "Homestay in Kaza",
        meals: "Breakfast, Dinner Included"
      },
      {
        day: 7,
        title: "Visit Kibber, Chicham Bridge & drive to Chandra Taal",
        description: "• Visit Kibber village, a high-altitude home of the snow leopard\n• Cross the spectacular Chicham Bridge, the highest bridge in Asia\n• Drive to Chandra Taal, the crescent-shaped Moon Lake (14,100 ft)\n• Enjoy dinner and overnight camping under a starry Spiti night\n• Note: If Chandratal is closed, stay in Kaza and explore Kalpa",
        stay: "Chandrataal Camps",
        meals: "Breakfast, Dinner Included"
      },
      {
        day: 8,
        title: "Chandra Taal to Manali via Atal Tunnel",
        description: "• Wake up to a cold morning and visit the beautiful Chandra Taal Lake\n• Embark on a thrilling off-road drive to Manali via Chhatru\n• Cross the legendary Atal Tunnel, the world's longest highway tunnel above 10,000 ft\n• Arrive in Manali, check in to cottages, and relax",
        stay: "Cottages in Manali",
        meals: "Breakfast, Dinner Included"
      },
      {
        day: 9,
        title: "Explore Manali & Adventure Activities",
        description: "• Kickstart the day with paragliding or river rafting (optional/self-paid)\n• Visit Hadimba Devi Temple, Old Manali, and Mall Road\n• Enjoy dinner, then board the vehicle for an overnight drive to Jalandhar/Chandigarh",
        stay: "Overnight travel",
        meals: "Breakfast Included"
      },
      {
        day: 10,
        title: "Board the Return Train",
        description: "• Arrive at Jalandhar/Chandigarh railway station\n• Board the return train back to Ahmedabad\n• Relax, play games, and share photos with new friends during the journey",
        stay: "Overnight in Train",
        meals: ""
      },
      {
        day: 11,
        title: "Arrival in Ahmedabad",
        description: "• Train passes through Rajasthan in the morning; relish local Rabdi & Chaat\n• Arrive in Ahmedabad safely; the epic circuit concludes with lifelong bonds",
        stay: "",
        meals: ""
      }
    ],
    stickyCardPrice: 19999,
    stickyCardLabel: "per person"
  },
  {
    title: "Manali Kasol Amritsar with Bhrigu Lake Trek — 9D/8N",
    slug: "manali-kasol-amritsar-with-bhrigu-lake-trek-9d-8n",
    shortName: "Experience Bhrigu Lake Trek with Manali, Kasol & Amritsar",
    location: "Himachal & Punjab",
    price: 11999,
    duration: "9 Days / 8 Nights",
    description: "Trekking • Alpine Lakes • Parvati Valley • Heritage. Combine a thrilling high-altitude alpine lake trek to Bhrigu Lake (14,300 ft) with riverside camping in Kasol and sightseeing in Amritsar. Visit the Wagah Border and Golden Temple.",
    category: "Trekking",
    difficulty: "moderate",
    status: "published",
    isActive: true,
    heroImage: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=2000",
    images: [
      "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1544735716-392fe2709496?auto=format&fit=crop&q=80&w=800"
    ],
    route: [
      { label: "Ahmedabad", icon: "train" },
      { label: "Amritsar", icon: "car" },
      { label: "Kasol", icon: "car" },
      { label: "Bhrigu Lake", icon: "hiking" },
      { label: "Manali", icon: "car" },
      { label: "Ahmedabad", icon: "train" }
    ],
    highlights: [
      "Golden Temple & Wagah Border Ceremony",
      "Riverside Camp Stay at Kasol",
      "Chalal Village Scenic Hike",
      "Bhrigu Lake Alpine Trek (14,300 ft)",
      "High Altitude Base Camp Stay (10,000 ft)",
      "White Water Rafting & Paragliding in Kullu"
    ],
    inclusions: [
      "All transfers by Tempo Traveller from Jalandhar",
      "Round trip train tickets (subject to availability) from Ahmedabad",
      "1 Night stay at Kasol, 1 Night stay at Manali Hotel, 2 Nights stay at Bhrigu Lake base Camp",
      "Bonfire and Music Party at Kasol & Kullu",
      "Trekking in Himalayas with certified guides",
      "5 Breakfast, 5 Lunch & 5 Dinner (1 Dinner at Golden Temple langar which is free)",
      "Trip Captain and Trek Guides",
      "Rafting and group games",
      "Toll, Parking, and Transport Taxes"
    ],
    exclusions: [
      "Personal Expenses & trekking gear",
      "5% GST on billing",
      "Any additional costs due to natural calamities like landslides",
      "Paragliding, paragliding suit, heater charges, tips, entry fees",
      "Personal porter for luggage during trek",
      "Any additional meals or stays outside inclusions"
    ],
    availableDates: [
      { date: "2026-04-25", capacity: 25 },
      { date: "2026-05-02", capacity: 25 }, { date: "2026-05-09", capacity: 25 }, { date: "2026-05-17", capacity: 25 }, { date: "2026-05-23", capacity: 25 }, { date: "2026-05-30", capacity: 25 },
      { date: "2026-06-06", capacity: 25 }, { date: "2026-06-13", capacity: 25 }, { date: "2026-06-20", capacity: 25 }, { date: "2026-06-27", capacity: 25 },
      { date: "2026-07-04", capacity: 25 }, { date: "2026-07-11", capacity: 25 }
    ],
    variants: [
      { location: "From Jalandhar (Triple/Quad Sharing)", originalPrice: 15999, discountedPrice: 11999 },
      { location: "From Ahmedabad Sleeper Train (Triple/Quad)", originalPrice: 17999, discountedPrice: 12999 },
      { location: "From Vadodara/Surat Sleeper (Triple/Quad)", originalPrice: 18499, discountedPrice: 13499 },
      { location: "From Mumbai/Pune Sleeper (Triple/Quad)", originalPrice: 18999, discountedPrice: 13999 },
      { location: "From Ahmedabad 3AC Train (Triple/Quad)", originalPrice: 20999, discountedPrice: 14999 }
    ],
    addons: [
      { name: "Double sharing upgrade", rate: 2000, description: "Upgrade to double sharing stay (excludes Bhrigu camp stay)." }
    ],
    accommodations: [
      { name: "Riverside Camps/Hotel", location: "Kasol", nights: "1 Night" },
      { name: "Bhrigu Alpine Camps", location: "Bhrigu Camp", nights: "2 Nights" },
      { name: "Standard Manali Hotel", location: "Manali", nights: "1 Night" }
    ],
    popupDetails: {
      carry: [
        { label: "Clothing", val: "Thermal inners, winter cap, woolen sweater, gloves, raincoat, hat/cap" },
        { label: "Trek Essentials", val: "Rucksack (50-60L), trekking shoes with rubber grip, socks, original government ID, power bank" }
      ],
      gears: [
        {
          category: "Required Gears",
          items: [
            { item: "Trekking shoes with grip", price: "Free" },
            { item: "Thermals & Heavy jackets", price: "Free" },
            { item: "Power bank", price: "Free" },
            { item: "Trekking backpack (30-40L)", price: "Free" }
          ]
        }
      ],
      cancellation: [
        { label: "Before 45 days", val: "80% refund" },
        { label: "Before 30 days", val: "50% refund" },
        { label: "Before 15 days", val: "25% refund" },
        { label: "Within 15 days", val: "No refund" },
        { label: "Booking fee", val: "Non-refundable" }
      ],
      terms: [
        "Only people of age 12 to 35 years are allowed",
        "5% GST applicable on all packages",
        "Trek guide is provided only if the group has a minimum of 12 participants."
      ],
      etiquette: [
        { title: "Clean Trails", desc: "Keep mountain trails clean. Carry your own plastic trash back." },
        { title: "Safety", desc: "Do not wander off alone in the snow during trek summit day." }
      ],
      showRentedGears: true
    },
    faqs: [
      { question: "What is the difficulty level of the Bhrigu Lake Trek?", answer: "It is rated as moderate. The trek takes you up to 14,300 ft, so good physical fitness and high altitude mental preparedness are recommended." },
      { question: "Will we find snow on the trail?", answer: "Yes, in April, May, and June, the trail is usually covered in snow. By July, the snow starts melting and turns into beautiful green meadows." },
      { question: "Where do we store our main luggage during the trek?", answer: "You can leave your main heavy bags at the hotel in Manali and trek to the Bhrigu Base Camp carrying only a light daypack." },
      { question: "How many nights do we spend in tents?", answer: "We spend 2 nights in alpine tents at the Bhrigu Lake advance base camp (10,000 ft)." }
    ],
    itinerary: [
      {
        day: 1,
        title: "Train Journey to Jalandhar",
        description: "• Meet the YC representative at the railway station in the morning\n• Board the train to Jalandhar/Amritsar\n• Participate in group games and ice-breaking activities\n• Inter-station transfers in cities like Vadodara/Mumbai are not included",
        stay: "Overnight in Train",
        meals: ""
      },
      {
        day: 2,
        title: "Visit Wagha Border & Golden Temple",
        description: "• Arrive at Jalandhar/Amritsar\n• Drive to Wagah Border for the historic Indo-Pak Ceremonial Parade\n• Visit the Golden Temple and explore the local Amritsar markets\n• Enjoy dinner and start the overnight drive to Kasol",
        stay: "Overnight travel",
        meals: ""
      },
      {
        day: 3,
        title: "Kasol & Parvati Valley Exploration",
        description: "• Reach the Kasol Campsite by 11:00 AM, check in, and have breakfast\n• Relish a scenic 2-hour hike to Chalal Village along the Parvati River\n• Visit Manikaran Gurudwara and the local Kasol market in the evening\n• Unwind with a bonfire, music party, and group games",
        stay: "Cottage/Tent in Kasol",
        meals: "Breakfast, Lunch, Dinner Included"
      },
      {
        day: 4,
        title: "Start Bhrigu Lake Trek from Base Camp",
        description: "• Have breakfast and check out from Kasol\n• Leave main luggage in Manali; carry a light daypack for the trek\n• Drive to the trek start point and begin trekking to Bhrigu Base Camp (10,000 ft)\n• Hike through endless green alpine meadows\n• Check in to tents and enjoy dinner",
        stay: "Tent stay in Bhrigu Campsite",
        meals: "Breakfast, Lunch, Dinner Included"
      },
      {
        day: 5,
        title: "Bhrigu Lake Trek Summit Day",
        description: "• Begin the early morning summit push to the first ridge\n• Trek through snow trails (in April, May, and June)\n• Reach the mystical Bhrigu Lake at 14,300 ft for splendid Himalayan views\n• Descent to base camp and celebrate with a summit party",
        stay: "Tent stay in Bhrigu Campsite",
        meals: "Breakfast, Lunch, Dinner Included"
      },
      {
        day: 6,
        title: "Trek Down & Manali Local Sightseeing",
        description: "• Trek down from the base camp to the village\n• Witness Solang Valley views and cross the Atal Tunnel\n• Visit Hadimba Devi Temple and walk along Mall Road in Manali\n• Check in to the hotel/cottage for dinner and rest",
        stay: "Manali (Hotel/cottage)",
        meals: "Breakfast, Lunch, Dinner Included"
      },
      {
        day: 7,
        title: "Adventure Activities & Drive to Jalandhar",
        description: "• Enjoy breakfast and participate in outdoor rope camp activities\n• Experience white water river rafting (included) & paragliding (optional/self-paid)\n• Drive back to Jalandhar in the evening",
        stay: "Overnight travel",
        meals: "Breakfast & Lunch Included"
      },
      {
        day: 8,
        title: "Return Train Journey to Your City",
        description: "• Board the return train back to Ahmedabad/your city\n• Enjoy the journey with group activities, sharing stories and pictures",
        stay: "Overnight in Train",
        meals: ""
      },
      {
        day: 9,
        title: "Arrive in Your City",
        description: "• Arrive in your home city safely\n• Trip concludes with new friends and beautiful memories",
        stay: "",
        meals: ""
      }
    ],
    stickyCardPrice: 11999,
    stickyCardLabel: "per person"
  }
];

async function seed() {
  try {
    console.log("🌱 Deleting all existing trips to clear database...");
    await prisma.trip.deleteMany({});
    console.log("🧹 Previous trips deleted.");

    console.log("🌱 Seeding bulleted itinerary trips into database...");
    for (const trip of TRIPS_TO_SEED) {
      console.log(`Creating: ${trip.title} (slug: ${trip.slug})`);
      await prisma.trip.create({
        data: {
          ...trip,
          tenantId: "default"
        }
      });
    }
    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("🔥 Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
