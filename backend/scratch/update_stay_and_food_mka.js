const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating Stay & Food data for MKA-1 / Manali Kasol trip in DB...');

  const accommodationsData = [
    {
      id: "kasol-riverside-cottages",
      name: "Kasol Riverside Cottages",
      nights: "08 Nights",
      starRating: "3.5 Star",
      type: "Cottage",
      roomType: "Cottage",
      meals: "Breakfast, Lunch, Dinner",
      location: "Kasol, Himachal Pradesh",
      amenities: ["Riverside Location", "Cozy Cottages", "Mountain View", "Wi-Fi", "Hot Water", "Traditional Hospitality"],
      image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200",
      mealsBreakdown: {
        breakfast: "Stuffed Paratha or Poori & Baji, Chutney, Pickle & Milk Tea, Coffee",
        lunch: "Rajma / Yellow / Mix Dal, Aloo Mattar, Rice, Roti, Salad, Chutney and Achar",
        dinner: "Rice, Roti, Dal, Mix Veg / Paneer Dish, Green Salad, Green Chutney & Pickle"
      },
      disclaimer: "Please note that the above information is provided to give you a basic idea about the overall stay and food arrangements. Accommodations and the food menu may be subject to change based on availability and other factors.",
      gallery: [
        { url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200", category: "Property & Views", title: "Resort Exterior & Mountain Surroundings" },
        { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200", category: "Exterior", title: "Valley View Garden & Cottages" },
        { url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200", category: "Swimming Pool", title: "Outdoor Heated Swimming Pool & Deck" },
        { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200", category: "Interior", title: "Cozy Wooden Interior Room" },
        { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200", category: "Dining", title: "Riverside Dining Lounge" },
        { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200", category: "Bathroom", title: "Modern Clean Attached Bathroom" }
      ]
    },
    {
      id: "kullu-riverside-camping",
      name: "Kullu Riverside Camping",
      nights: "09 Nights",
      starRating: "3 Star",
      type: "Camping",
      roomType: "Tent",
      meals: "Breakfast, Lunch, Dinner",
      location: "Kullu, Himachal Pradesh",
      amenities: ["Riverside Adventure", "Camping Experience", "Team Activities", "Bonfires", "Adventure Sports", "Nature Connect"],
      image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1200",
      mealsBreakdown: {
        breakfast: "Poha/Upma or Poori & Baji, Curd, Chutney, Pickle & Milk Tea",
        lunch: "Pack Lunch",
        dinner: "Honey Chilly Potato, Manchurian with Gravy, Noodles"
      },
      disclaimer: "Please note that the above information is provided to give you a basic idea about the overall stay and food arrangements. Accommodations and the food menu may be subject to change based on availability and other factors.",
      gallery: [
        { url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1200", category: "Exterior", title: "Riverside Tents & Bonfire Grounds" },
        { url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200", category: "Property & Views", title: "Stargazing Campsite Night View" },
        { url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200", category: "Swimming Pool", title: "Natural Stream & Plunge Pool" },
        { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200", category: "Interior", title: "High Altitude Waterproof Dome Tent" },
        { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200", category: "Dining", title: "Campfire Outdoor Buffet Area" },
        { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200", category: "Bathroom", title: "Clean Western Toilet Facilities" }
      ]
    },
    {
      id: "manali-cottages",
      name: "Manali Cottages",
      nights: "09 Nights",
      starRating: "4 Star",
      type: "Cottage",
      roomType: "Deluxe Room",
      meals: "Breakfast, Lunch, Dinner",
      location: "Manali, Himachal Pradesh",
      amenities: ["Mountain Views", "Cozy Cottages", "Scenic Location", "Wi-Fi", "Heaters", "Valley View", "Traditional Meals"],
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200",
      mealsBreakdown: {
        breakfast: "Stuffed Paratha, Bread Butter Toast, Tea, Coffee",
        lunch: "Pack Lunch or Buffet",
        dinner: "Soup, Dal Tadka / Dal Amritsari / Dal Nakhni, Sev Tamatar, 1 Sweet, Green Salad, Rice, Indian Bread"
      },
      disclaimer: "Please note that the above information is provided to give you a basic idea about the overall stay and food arrangements. Accommodations and the food menu may be subject to change based on availability and other factors.",
      gallery: [
        { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200", category: "Property & Views", title: "Manali Snow Peak Mountain View" },
        { url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200", category: "Exterior", title: "Wooden Alpine Cottage Façade" },
        { url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200", category: "Swimming Pool", title: "Resort Swimming Pool & Sunbeds" },
        { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200", category: "Interior", title: "Luxury Deluxe Bedroom with Balcony" },
        { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200", category: "Dining", title: "Grand Buffet Dining Restaurant" },
        { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200", category: "Bathroom", title: "Marble Fitted Modern Bathroom" }
      ]
    }
  ];

  // Update trips matching MKA-1 or slug starting with mka
  const trips = await prisma.trip.findMany({
    where: {
      OR: [
        { id: 'MKA-1' },
        { slug: { startsWith: 'mka' } }
      ]
    }
  });

  console.log(`Found ${trips.length} matching trips in database:`);
  for (const t of trips) {
    console.log(`- Updating trip ID: ${t.id}, slug: ${t.slug}, title: ${t.title}`);
    await prisma.trip.update({
      where: { id: t.id },
      data: {
        accommodations: accommodationsData
      }
    });
  }

  console.log('✅ Successfully updated Stay & Food data in Database for all Manali Kasol trips!');
}

main()
  .catch((e) => {
    console.error('❌ Error updating DB:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
