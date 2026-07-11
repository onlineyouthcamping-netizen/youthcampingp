const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createQuotation() {
  const quotationData = {
    title: "Goa Vacation Getaway",
    clientName: "Guest",
    totalAmount: 153986,
    status: "published",
    slug: "goa-getaway-" + Math.random().toString(36).substring(7),
    data: {
      tripTitle: "Goa Vacation Getaway",
      customerName: "Guest",
      destination: "Goa",
      duration: "4 Days & 3 Nights",
      travelDates: { from: "2026-07-24", to: "2026-07-27" },
      paxCount: 14,
      roomsInfo: "5 Rooms (5 couples + 4 extra adults with mattress)",
      mealsInfo: "Breakfast & Dinner (MAP Plan)",
      inclusions: [
        "3 Nights in AC room",
        "3 Breakfast & 3 Dinner",
        "Pickup from Thivim Railway Station (13 - 17 seater)",
        "Drop to Thivim Railway Station (13 - 17 seater)",
        "South Goa tour PVT"
      ],
      exclusions: [
        "Parking charges applicable during Sightseeing (to be paid by Guest)",
        "Any other personal expenses",
        "Insurance"
      ],
      lowLevelPrice: 10999,
      highLevelPrice: 11999,
      lowLevelHotels: [
        { 
          name: "SoMy Plaza", 
          location: "Goa", 
          stars: 3, 
          image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800", 
          description: "Superior Room. Photos: https://shorturl.at/HRlyt" 
        }
      ],
      highLevelHotels: [
        { 
          name: "Ocean Palm", 
          location: "Goa", 
          stars: 4, 
          image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800", 
          description: "Superior Room. Photos: https://shorturl.at/ajta2" 
        }
      ],
      itinerary: [
        { day: 1, title: "Arrival in Goa & Thivim Pickup", description: "Upon arrival at Thivim Railway Station, our representative will pick you up in a private 13-17 seater vehicle and transfer you to your hotel. Check-in and relax. Enjoy a delicious dinner at the hotel." },
        { day: 2, title: "South Goa Private Tour", description: "After breakfast, proceed for a private South Goa tour. Visit beautiful beaches and historical sites. Return to the hotel for dinner and overnight stay." },
        { day: 3, title: "Leisure Day in Goa", description: "Enjoy a free day to explore the local markets or relax by the beach. Breakfast and dinner included at the hotel." },
        { day: 4, title: "Departure via Thivim", description: "After breakfast, check out from the hotel. Our vehicle will drop you back to Thivim Railway Station for your onward journey." }
      ],
      expert: {
        name: "Bhautik Bhut",
        designation: "Destination Expert",
        photo: "https://i.pravatar.cc/150?u=bhautik"
      },
      coverImage: "https://images.unsplash.com/photo-1512314889357-e157c22f938d?auto=format&fit=crop&q=80&w=1440"
    }
  };

  try {
    const created = await prisma.quotation.create({
      data: quotationData
    });
    console.log("Quotation Created Successfully!");
    console.log("ID:", created.id);
    console.log("URL:", `http://localhost:3000/q/${created.id}`);
  } catch (error) {
    console.error("Error creating quotation:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createQuotation();
