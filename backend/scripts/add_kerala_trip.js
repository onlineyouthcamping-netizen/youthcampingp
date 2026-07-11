const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Trip = require('../src/models/Trip');

async function addKeralaTrip() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const keralaTrip = {
      title: "Kerala Getaway 2026",
      slug: "kerala-getaway-2026",
      shortName: "Kerala Getaway",
      location: "Kerala",
      price: 15999,
      duration: "5 Days / 4 Nights",
      maxGroupSize: 20,
      difficulty: "easy",
      category: "Road Trip",
      description: "Experience the magic of Kerala's backwaters, waterfalls, beaches, and hills. A perfect 5-day getaway covering Cochin, Munnar, Thekkady, and Alleppey. From the mist-covered hills of Munnar to the tranquil backwaters of Alleppey, this trip offers a complete taste of God's Own Country.",
      status: "published",
      
      highlights: [
        "Munnar hill station views",
        "Tea plantations & waterfalls",
        "Wildlife at Thekkady",
        "Cultural shows (Kathakali + Kalaripayattu)",
        "Backwaters of Alleppey",
        "Houseboat experience"
      ],

      inclusions: [
        "AC transport (full trip)",
        "Hotel stays",
        "Sightseeing as per itinerary",
        "Breakfast & Dinner",
        "1 Lunch (Houseboat)",
        "Toll, parking, taxes",
        "Driver charges",
        "Trip coordination support"
      ],

      exclusions: [
        "Flights / Train tickets",
        "Entry tickets (parks, monuments, cruises)",
        "Optional activities (boat ride, safari, shows)",
        "Personal expenses (shopping, tips, laundry)",
        "Extra costs due to weather/road issues"
      ],

      itinerary: [
        {
          day: 1,
          title: "Cochin to Munnar",
          location: "Munnar",
          description: "Pickup from Cochin (Railway Station at 9:00 AM or Airport at 10:00 AM). Scenic drive to Munnar. On the way, visit the breathtaking Valara and Cheeyappara Waterfalls. Explore lush spice plantations before checking into your hotel.",
          stay: "Munnar Hotel",
          meals: "Dinner",
          activities: ["Valara Waterfalls", "Cheeyappara Waterfalls", "Spice Plantations"]
        },
        {
          day: 2,
          title: "Munnar Exploration",
          location: "Munnar",
          description: "After breakfast, head out for a full day of sightseeing in Munnar. Visit Mattupetty Dam, Echo Point, Kundala Dam, and Eravikulam National Park. Stroll through the beautiful Rose Garden and enjoy free time for shopping at local markets.",
          stay: "Munnar Hotel",
          meals: "Breakfast, Dinner",
          activities: ["Mattupetty Dam", "Echo Point", "Kundala Dam", "Eravikulam National Park", "Rose Garden"]
        },
        {
          day: 3,
          title: "Munnar to Thekkady",
          location: "Thekkady",
          description: "Breakfast and drive to Thekkady. You can opt for a Periyar Lake boat ride or elephant interaction. In the evening, witness the traditional Kalaripayattu (martial arts) and Kathakali (dance) shows.",
          stay: "Thekkady Hotel",
          meals: "Breakfast, Dinner",
          activities: ["Periyar Lake (Optional)", "Elephant Interaction (Optional)", "Kalaripayattu Show", "Kathakali Show"]
        },
        {
          day: 4,
          title: "Thekkady to Alleppey",
          location: "Alleppey",
          description: "Drive to Alleppey after breakfast. Experience the world-famous backwaters of Kerala. Opt for a serene Shikara ride or stay overnight in a traditional Houseboat for an authentic backwater cruise.",
          stay: "Hotel / Houseboat",
          meals: "Breakfast, Lunch (Houseboat), Dinner",
          activities: ["Shikara Ride (Optional)", "Houseboat Experience", "Backwaters Cruise"]
        },
        {
          day: 5,
          title: "Alleppey to Cochin",
          location: "Cochin",
          description: "Breakfast and checkout. Drive back to Cochin. We will drop you at the airport or railway station as per your departure timing. Your memorable Kerala Getaway ends here.",
          stay: "N/A",
          meals: "Breakfast",
          activities: ["Drop to Airport/Station"]
        }
      ],

      availableDates: [
        { date: "2026-06-15T00:00:00.000Z", status: "available" },
        { date: "2026-06-22T00:00:00.000Z", status: "available" },
        { date: "2026-07-06T00:00:00.000Z", status: "available" },
        { date: "2026-07-13T00:00:00.000Z", status: "available" },
        { date: "2026-08-03T00:00:00.000Z", status: "available" },
        { date: "2026-08-10T00:00:00.000Z", status: "available" }
      ],

      variants: [
        { 
          location: "Join from Cochin", 
          discountedPrice: 15999, 
          originalPrice: 18999, 
          duration: "5 Days",
          image: "https://images.unsplash.com/photo-1602216056096-3c40cc0c9944?q=80&w=2070"
        }
      ],

      roomOptions: [
        { label: "Triple Sharing", priceDelta: 0 },
        { label: "Double Sharing", priceDelta: 1000 }
      ],

      travelOptions: [
        { label: "AC Car / Tempo Traveller", priceDelta: 0 }
      ],

      addons: [
        { name: "Shared Houseboat", rate: 999, description: "Per person" },
        { name: "Private Houseboat", rate: 2499, description: "Per person (if 3+ rooms)" },
        { name: "Extra Stay (Cochin/Trivandrum)", rate: 999, description: "Per person" }
      ],

      route: [
        { label: "Cochin", icon: "plane" },
        { label: "Munnar", icon: "car" },
        { label: "Thekkady", icon: "car" },
        { label: "Alleppey", icon: "car" },
        { label: "Cochin", icon: "car" }
      ],

      popupDetails: {
        carry: [
          {
            category: "Clothing",
            items: [
              { text: "Light cotton clothes" },
              { text: "Jacket (for Munnar)" },
              { text: "Swimwear" },
              { text: "Flip flops & shoes" },
              { text: "Raincoat / umbrella" }
            ]
          },
          {
            category: "Essentials",
            items: [
              { text: "Sunscreen" },
              { text: "Sunglasses" },
              { text: "Medicines" },
              { text: "Mosquito repellent" },
              { text: "Power bank" }
            ]
          },
          {
            category: "Travel Essentials",
            items: [
              { text: "Original ID Proof" },
              { text: "Backpack (20–30L)" },
              { text: "Water bottle" },
              { text: "Cash" }
            ]
          }
        ],
        terms: [
          "Minimum 4 persons required",
          "Driver service limited to 8 AM – 8 PM",
          "Extra charges apply beyond timing",
          "Activities subject to availability",
          "GST 5% extra on total package"
        ],
        cancellation: [
          { label: "Before more than 40 days of Departure", val: "10% deduction" },
          { label: "Before 21 to 40 days of Departure", val: "25% deduction" },
          { label: "Before 11 to 20 days of Departure", val: "40% deduction" },
          { label: "In the last 48 hours of Departure", val: "90% deduction" }
        ],
        etiquette: [
          { title: "Driver Service", desc: "Driver timing is from 8:00 AM to 8:00 PM. Please respect these timings for safety." },
          { title: "Minimum Requirement", desc: "This trip requires a minimum of 4 persons to operate at the listed price." }
        ]
      },

      heroImage: "https://images.unsplash.com/photo-1602216056096-3c40cc0c9944?q=80&w=2070", // High quality Kerala Houseboat
      images: [
        "https://images.unsplash.com/photo-1593693397690-362ae966b750?q=80&w=2070", // Tea Garden
        "https://images.unsplash.com/photo-1581793745862-99f579601e1b?q=80&w=2070", // Waterfall
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2070"  // Beach/Water
      ]
    };

    await Trip.findOneAndUpdate({ slug: keralaTrip.slug }, keralaTrip, { upsert: true, new: true });
    console.log('✅ Kerala Getaway 2026 trip added successfully!');
    
    mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error adding trip:', err);
    process.exit(1);
  }
}

addKeralaTrip();
