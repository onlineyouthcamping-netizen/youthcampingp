const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Seeding Spiti Valley Stay & Food Data (6 Properties) into Database...');

  const spitiAccommodations = [
    {
      id: "hotel-ameera-shimla",
      name: "Hotel Ameera (Shimla)",
      nights: "02 Nights",
      starRating: "4 Star",
      type: "Hotel",
      roomType: "Deluxe Room",
      meals: "Breakfast, Dinner",
      location: "Shimla, Himachal Pradesh",
      amenities: ["Centrally Located", "4-Star Comfort", "Attached Washrooms", "24/7 Room Service", "Mountain View", "Buffet Dining"],
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200",
      mealsBreakdown: {
        breakfast: "Stuffed Paratha, Chutney, Pickle, Milk Tea, Coffee",
        lunch: "Not Included (Exploration Time)",
        dinner: "Rice, Roti, Dal, Mix Veg/Paneer, Green Salad, Chutney & Pickle"
      },
      disclaimer: "Please note that the above information is provided to give you a basic idea about the overall stay and food arrangements. Accommodations and the food menu may be subject to change based on availability and other factors.",
      gallery: [
        { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200", category: "Property & Views", title: "Shimla Mountain View Hotel Façade" },
        { url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200", category: "Exterior", title: "Valley View Garden & Entrance" },
        { url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200", category: "Swimming Pool", title: "Rooftop Heated Pool" },
        { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200", category: "Interior", title: "Deluxe Room Bedding & Interiors" },
        { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200", category: "Dining", title: "Buffet Dining Restaurant" },
        { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200", category: "Bathroom", title: "Modern Clean Bathroom" }
      ]
    },
    {
      id: "chitkul-stay",
      name: "Chitkul Stay",
      nights: "01 Night",
      starRating: "3 Star",
      type: "Guesthouse",
      roomType: "Wooden Room",
      meals: "Breakfast, Dinner",
      location: "Chitkul, Spiti Valley, Himachal Pradesh",
      amenities: ["River View", "Wooden Interiors", "Last Village Vibe", "Local Hospitality", "Cozy Bedding", "Scenic Surroundings"],
      image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200",
      mealsBreakdown: {
        breakfast: "Poha/Upma or Poori & Baji, Curd, Chutney, Pickle, Milk Tea",
        lunch: "Not Included (Exploration Time)",
        dinner: "Honey Chilly Potato, Manchurian with Gravy, Noodles"
      },
      disclaimer: "Please note that the above information is provided to give you a basic idea about the overall stay and food arrangements. Accommodations and the food menu may be subject to change based on availability and other factors.",
      gallery: [
        { url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200", category: "Property & Views", title: "Chitkul Last Village River View" },
        { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200", category: "Exterior", title: "Traditional Wooden Guesthouse Exterior" },
        { url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200", category: "Swimming Pool", title: "Natural Mountain Stream Pool" },
        { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200", category: "Interior", title: "Cozy Himalayan Wooden Bedroom" },
        { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200", category: "Dining", title: "Local Himachali Dining Space" },
        { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200", category: "Bathroom", title: "Clean Attached Washroom" }
      ]
    },
    {
      id: "tabo-stay",
      name: "Tabo Stay",
      nights: "01 Night",
      starRating: "3.5 Star",
      type: "Guesthouse",
      roomType: "Traditional Room",
      meals: "Breakfast, Dinner",
      location: "Tabo, Spiti Valley, Himachal Pradesh",
      amenities: ["Local Host", "Cultural Insight", "Traditional Meals", "Monastery Proximity", "Clean Washrooms", "Peaceful Location"],
      image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200",
      mealsBreakdown: {
        breakfast: "Stuffed Paratha, Bread Butter Toast, Tea, Coffee",
        lunch: "Not Included (Exploration Time)",
        dinner: "Soup, Dal Tadka/Amritsari/Nakhni, Sev Tamatar, 1 Sweet, Green Salad, Rice, Indian Bread"
      },
      disclaimer: "Please note that the above information is provided to give you a basic idea about the overall stay and food arrangements. Accommodations and the food menu may be subject to change based on availability and other factors.",
      gallery: [
        { url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200", category: "Property & Views", title: "Tabo Valley & Stargazing Night View" },
        { url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200", category: "Exterior", title: "Tabo Heritage Guesthouse" },
        { url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200", category: "Swimming Pool", title: "Surrounding Water View" },
        { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200", category: "Interior", title: "Clean Traditional Room Bedding" },
        { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200", category: "Dining", title: "Home Cooked Spiti Dining Area" },
        { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200", category: "Bathroom", title: "Clean Modern Western Washroom" }
      ]
    },
    {
      id: "kaza-stay",
      name: "Kaza Stay",
      nights: "02 Nights",
      starRating: "3.5 Star",
      type: "Guesthouse",
      roomType: "Premium Room",
      meals: "Breakfast, Dinner",
      location: "Kaza, Spiti Valley, Himachal Pradesh",
      amenities: ["Modern Amenities", "Cozy Bedding", "Near Main Market", "High Altitude Stay", "Wi-Fi Access", "Hot Water"],
      image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200",
      mealsBreakdown: {
        breakfast: "Stuffed Paratha, Bread Butter Toast, Tea, Coffee",
        lunch: "Not Included (Exploration Time)",
        dinner: "Soup, Dal Tadka/Amritsari/Nakhni, Seasonal Veg, Kadai/Palak Paneer, 1 Sweet, Green Salad, Rice, Indian Bread"
      },
      disclaimer: "Please note that the above information is provided to give you a basic idea about the overall stay and food arrangements. Accommodations and the food menu may be subject to change based on availability and other factors.",
      gallery: [
        { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200", category: "Interior", title: "Kaza Premium High Altitude Room" },
        { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200", category: "Property & Views", title: "Kaza Town & Mountain Peak View" },
        { url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200", category: "Exterior", title: "Kaza Guesthouse Front View" },
        { url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200", category: "Swimming Pool", title: "Alpine View Deck" },
        { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200", category: "Dining", title: "Spiti Dining Hall" },
        { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200", category: "Bathroom", title: "Hot Shower Attached Bathroom" }
      ]
    },
    {
      id: "chandratal-camps",
      name: "Chandratal Camps",
      nights: "01 Night",
      starRating: "3 Star",
      type: "Camping",
      roomType: "Tent",
      meals: "Breakfast, Dinner",
      location: "Chandratal, Spiti Valley, Himachal Pradesh",
      amenities: ["Luxury Tents", "Stargazing Experience", "Near Moon Lake", "Bonfire Nights", "High Altitude Adventure", "Nature Vibe"],
      image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1200",
      mealsBreakdown: {
        breakfast: "Stuffed Paratha, Bread Butter Toast, Tea, Coffee",
        lunch: "Not Included (Exploration Time)",
        dinner: "Soup, Dal Tadka/Amritsari/Nakhni, Seasonal Veg, Kadai/Palak Paneer, 1 Sweet, Green Salad, Rice, Indian Bread"
      },
      disclaimer: "Please note that the above information is provided to give you a basic idea about the overall stay and food arrangements. Accommodations and the food menu may be subject to change based on availability and other factors.",
      gallery: [
        { url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1200", category: "Exterior", title: "Chandratal Moon Lake Campsite" },
        { url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200", category: "Property & Views", title: "Stargazing Night Sky over Chandratal" },
        { url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200", category: "Swimming Pool", title: "Moon Lake Crystal Waters" },
        { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200", category: "Interior", title: "Insulated Dome Camping Tent" },
        { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200", category: "Dining", title: "Outdoor Camp Buffet Tent" },
        { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200", category: "Bathroom", title: "Eco-Friendly High Altitude Washrooms" }
      ]
    },
    {
      id: "manali-cottages-spiti",
      name: "Manali Cottages",
      nights: "01 Night",
      starRating: "4 Star",
      type: "Cottage",
      roomType: "Alpine Cottage",
      meals: "Breakfast, Dinner",
      location: "Manali, Himachal Pradesh",
      amenities: ["Balcony Rooms", "Hot Water", "Mountain View", "Heaters", "Traditional Meals", "Valley View"],
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200",
      mealsBreakdown: {
        breakfast: "Stuffed Paratha, Bread Butter Toast, Tea, Coffee",
        lunch: "Not Included (Exploration Time)",
        dinner: "Soup, Dal Tadka/Amritsari/Nakhni, Seasonal Veg, Kadai/Palak Paneer, 1 Sweet, Green Salad, Rice, Indian Bread"
      },
      disclaimer: "Please note that the above information is provided to give you a basic idea about the overall stay and food arrangements. Accommodations and the food menu may be subject to change based on availability and other factors.",
      gallery: [
        { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200", category: "Property & Views", title: "Manali Alpine Valley View" },
        { url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200", category: "Exterior", title: "Pinewood Cottage Exterior" },
        { url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200", category: "Swimming Pool", title: "Resort Pool Deck" },
        { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200", category: "Interior", title: "Alpine Wooden Cottage Room" },
        { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200", category: "Dining", title: "Cottage Restaurant Lounge" },
        { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200", category: "Bathroom", title: "Ensuite Modern Bathroom" }
      ]
    }
  ];

  // Update trips matching SPT-1, WSPT-1, or slug containing spiti
  const trips = await prisma.trip.findMany({
    where: {
      OR: [
        { id: 'SPT-1' },
        { id: 'WSPT-1' },
        { slug: { contains: 'spiti' } }
      ]
    }
  });

  console.log(`Found ${trips.length} matching Spiti trips in database:`);
  for (const t of trips) {
    console.log(`- Updating trip ID: ${t.id}, slug: ${t.slug}, title: ${t.title}`);
    await prisma.trip.update({
      where: { id: t.id },
      data: {
        accommodations: spitiAccommodations
      }
    });
  }

  console.log(`✅ Successfully saved ALL 6 Spiti Valley properties to Database!`);
}

main()
  .catch((e) => {
    console.error('❌ Error updating DB:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
