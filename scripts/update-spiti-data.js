
const updateSpiti = async () => {
  const dates = [
    // June
    '2026-06-02', '2026-06-09', '2026-06-16', '2026-06-23', '2026-06-30',
    // July
    '2026-07-07', '2026-07-14', '2026-07-21', '2026-07-28',
    // August
    '2026-08-04', '2026-08-11', '2026-08-18', '2026-08-25',
    // September
    '2026-09-01', '2026-09-08', '2026-09-15', '2026-09-22', '2026-09-29'
  ].map(d => ({ date: d, capacity: 20, bookedCount: 0 }));

  const variants = [
    {
      location: "Ahmedabad",
      duration: "11 Days",
      originalPrice: 24800,
      discountedPrice: 20800,
      image: "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6"
    },
    {
      location: "Delhi",
      duration: "7 Days",
      originalPrice: 22800,
      discountedPrice: 17800,
      image: "https://images.unsplash.com/photo-1587474260584-136574528ed5"
    }
  ];

  const travelOptions = [
    {
      label: "Non AC Sleeper Train",
      priceDelta: 0,
      description: "Standard sleeper class train journey."
    },
    {
      label: "AC Sleeper Train",
      priceDelta: 2500,
      description: "3AC upgrade for a comfortable journey."
    }
  ];

  const roomOptions = [
    {
      label: "Triple",
      priceDelta: 0
    },
    {
      label: "Double",
      priceDelta: 2000
    },
    {
      label: "Single",
      priceDelta: 5000
    }
  ];

  const itinerary = [
    { 
      day: 1, 
      title: "Train Journey to Chandigrah", 
      description: "Board your train for a scenic journey towards the mountains.", 
      location: "Chandigarh", 
      stay: "", 
      meals: "", 
      activities: ["Train Journey", "Group Introduction", "Overnight Travel"],
      photos: ["https://images.unsplash.com/photo-1532375811400-d754f343d6c4", "https://images.unsplash.com/photo-1474487056289-62295099333b"]
    },
    { 
      day: 2, 
      title: "Drive to Shimla & day tour of Shimla", 
      description: "Reach Chandigarh and drive to Shimla. Explore Mall Road and local attractions.", 
      location: "Shimla", 
      stay: "Shimla (Hotel)", 
      meals: "", 
      activities: ["Mall Road", "Ridge", "Shimla Christ Church"],
      photos: ["https://images.unsplash.com/photo-1626621341517-bbf3d9990a23", "https://images.unsplash.com/photo-1610471237351-f76a5e1f7f6a"]
    },
    { 
      day: 3, 
      title: "Shimla to Chitkul, last village on border", 
      description: "A beautiful drive to the last inhabited village near the Indo-Tibetan border.", 
      location: "Chitkul", 
      stay: "Chitkul (Huts/Hotel)", 
      meals: "Breakfast & Dinner", 
      activities: ["Baspa River", "Sangla Valley", "Last Village Visit"],
      photos: ["https://images.unsplash.com/photo-1582239014603-7b3b7548d80c", "https://images.unsplash.com/photo-1533130061792-64b345e4a833"]
    },
    { 
      day: 4, 
      title: "Travel from Chitkul to Tabo, via Nako Lake", 
      description: "Witness the transition to high altitude desert landscapes.", 
      location: "Tabo", 
      stay: "Tabo (Homestay)", 
      meals: "Breakfast & Dinner", 
      activities: ["Nako Lake", "Tabo Monastery", "Helipad Walk"],
      photos: ["https://images.unsplash.com/photo-1589308078059-be1415eab4c3", "https://images.unsplash.com/photo-1501785888041-af3ef285b470"]
    },
    { 
      day: 5, 
      title: "Explore Tabo and Dhankar Village", 
      description: "Visit the thousand-year-old Tabo monastery and the dramatic Dhankar fort.", 
      location: "Kaza", 
      stay: "Kaza (Homestay)", 
      meals: "Breakfast & Dinner", 
      activities: ["Dhankar Fort", "Tabo Caves", "Spiti River View"],
      photos: ["https://images.unsplash.com/photo-1605649440417-cf9916694666", "https://images.unsplash.com/photo-1544735716-392fe2709496"]
    },
    { 
      day: 6, 
      title: "Explore Key, Komic, Langza, and Hikkim", 
      description: "Visit the highest post office and some of the world's highest villages.", 
      location: "Kaza", 
      stay: "Kaza (Homestay)", 
      meals: "Breakfast & Dinner", 
      activities: ["Key Monastery", "Komic Village", "Langza Buddha Statue"],
      photos: ["https://images.unsplash.com/photo-1520209759395-820217e92824", "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b"]
    },
    { 
      day: 7, 
      title: "Visit Kibber and Chicham to Chandra Taal", 
      description: "Cross the Chicham bridge and drive to the moon-shaped lake.", 
      location: "Chandrataal", 
      stay: "Chandrataal/Losar", 
      meals: "Breakfast & Dinner", 
      activities: ["Chicham Bridge", "Chandra Taal Lake", "Camping Experience"],
      photos: ["https://images.unsplash.com/photo-1433838552652-f9a46b332c40", "https://images.unsplash.com/photo-1470770841072-23978616d972"]
    },
    { 
      day: 8, 
      title: "Journey to Manali through the Atal Tunnel", 
      description: "Drive through the engineering marvel towards the lush Manali valley.", 
      location: "Manali", 
      stay: "Manali (Hotel)", 
      meals: "Breakfast & Dinner", 
      activities: ["Kunzum Pass", "Rohtang Pass", "Atal Tunnel Drive"],
      photos: ["https://images.unsplash.com/photo-1506461883276-594a12b11cf3", "https://images.unsplash.com/photo-1541943181603-d8fe267a5dcf"]
    },
    { 
      day: 9, 
      title: "Explore Manali & adventure activities", 
      description: "Relax or indulge in some adventure sports in Manali.", 
      location: "Manali", 
      stay: "", 
      meals: "Breakfast", 
      activities: ["Solang Valley", "Hadimba Temple", "Old Manali Cafes"],
      photos: ["https://images.unsplash.com/photo-1548235718-da98950d2703", "https://images.unsplash.com/photo-1621535497227-04664a77e1be"]
    },
    { 
      day: 10, 
      title: "Manali to Chandigarh, Return Train", 
      description: "Drive back to the plains to catch your return journey.", 
      location: "Chandigarh", 
      stay: "", 
      meals: "", 
      activities: ["Drive to Plains", "Market Visit", "Train Boarding"],
      photos: ["https://images.unsplash.com/photo-1532375811400-d754f343d6c4", "https://images.unsplash.com/photo-1474487056289-62295099333b"]
    },
    { 
      day: 11, 
      title: "Arrival in your city", 
      description: "Reach home with beautiful memories of the Spiti Valley.", 
      location: "Home", 
      stay: "", 
      meals: "", 
      activities: ["Home Arrival", "Sharing Memories", "Trip Feedback"],
      photos: ["https://images.unsplash.com/photo-1512413316925-fd47914c9c11", "https://images.unsplash.com/photo-1526772662000-3f88f10405ff"]
    }
  ];

  const inclusions = [
    "🚐 All transfers by Tempo Traveller / Taxi (complete road journey)",
    "🚆 Round-trip train tickets (from Ahmedabad package)",
    "🏨 Comfortable stays in Hotels / Homestays / Camps (3–4 sharing)",
    "🍽️ Meals: 7 Breakfasts & 6 Dinners (Pure Veg)",
    "🔥 Bonfire & Music Night in Manali",
    "🥾 Basic trekking & exploration activities",
    "🧭 Experienced Trip Captain",
    "📞 24×7 on-trip support",
    "🗺️ All sightseeing as per itinerary",
    "🚧 Toll taxes, parking & driver allowances",
    "🩺 Basic oxygen support with oximeter (high-altitude safety)",
    "🎉 Group activities & “Dher Saari Masti”"
  ];

  const exclusions = [
    "💸 Personal expenses (shopping, snacks, etc.)",
    "🌧️ Costs due to natural issues (landslides, roadblocks, weather delays)",
    "🎢 Adventure activities (Paragliding, Rafting, ATV / 4×4)",
    "🔥 Heater charges, tips, pony rides",
    "🎟️ Entry fees, permits, snow suits (if applicable)",
    "🍴 Meals not mentioned in inclusions",
    "🚖 Inter-station transfers (if joining from other cities like Surat / Mumbai etc.)",
    "🧾 5% GST (additional)"
  ];

  const updateData = {
    availableDates: dates,
    variants: variants,
    travelOptions: travelOptions,
    roomOptions: roomOptions,
    itinerary: itinerary,
    inclusions: inclusions,
    exclusions: exclusions,
    route: [
      { label: "Ahmedabad to Jalandhar", icon: "train" },
      { label: "Shimla Exploration", icon: "car" },
      { label: "Sangla & Chitkul", icon: "car" },
      { label: "Kalpa Viewpoint", icon: "car" },
      { label: "Tabo & Kaza", icon: "car" },
      { label: "Key & Kibber", icon: "car" },
      { label: "Chandra Taal", icon: "car" },
      { label: "Atal Tunnel to Manali", icon: "car" },
      { label: "Return to Jalandhar", icon: "car" },
      { label: "Jalandhar to Ahmedabad", icon: "train" }
    ],
    description: "Spiti Valley Full Circuit – 11D/10N. Next Departure: 02 June 2026"
  };

  try {
    const response = await fetch('http://localhost:8888/api/trips/69ea0a63efc823430557b534', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    const result = await response.json();
    console.log('Update Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Update Failed:', error);
  }
};

updateSpiti();
