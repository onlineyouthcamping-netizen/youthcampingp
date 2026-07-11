const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const itinerary = [
  {
    day: 1,
    title: "Train Journey Ahmedabad to Chandigarh",
    description: "• Boarding: Sabarmati BG Railway Station / Gandhinagar Capital Railway Station\n• Reporting Time: 09:00 AM\n• Kickstart your adventure with an overnight train journey from Ahmedabad to Chandigarh, passing through Gujarat, Rajasthan, and Haryana. Enjoy scenic views, bond with fellow travelers through fun activities, and soak in the local flavors at stops like Abu Road and Jaipur.\n• Please note that if you have a connecting train from any station in Ahmedabad or Gandhinagar to Surat, Baroda, Mumbai, or Pune, inter-station transfers are not included in our package."
  },
  {
    day: 2,
    title: "Drive to Shimla & day tour of Shimla",
    description: "• Arrival in Chandigarh – 8:00 AM\n• Reach Chandigarh Railway Station in the early morning.\n• Depart for Shimla by Traveler/Taxi, enjoying the scenic drive.\n• Explore Shimla’s famous Mall Road and shop for souvenirs.\n• Experience the lively nightlife at Shimla’s cafés and markets.\n• Stay: Hotel in Shimla"
  },
  {
    day: 3,
    title: "Shimla to Chitkul, last village on Indo-Tibetan border",
    description: "• Shimla to Chitkul – The Ultimate Road Trip\n• Kickstart an adventurous morning road trip from Shimla.\n• Drive through the stunning landscapes of Kinnaur Valley.\n• Visit Chitkul, the last village on the old Hindustan-Tibet trade route.\n• Stay: Cottage in Chitkul/Kalpa\n• Food: Breakfast, Dinner Included"
  },
  {
    day: 4,
    title: "Travel from Chitkul to Tabo, via Nako Lake",
    description: "• Chitkul to Tabo – A Scenic Himalayan Drive\n• Begin the journey from Chitkul, experiencing the serene village life.\n• Drive along the India-Tibet border, passing through Khab, the confluence of the Spiti & Sutlej Rivers.\n• Stop by the beautiful Nako Lake for a peaceful retreat.\n• Stay: Homestay in Tabo\n• Food: Breakfast, Dinner Included"
  },
  {
    day: 5,
    title: "Explore Tabo and Dhankar Village",
    description: "• Tabo to Kaza – Exploring Ancient Monasteries & Scenic Villages\n• Visit the 1000-year-old Tabo Monastery, known for its ancient wall paintings and mud statues.\n• Witness a breathtaking 360° sky view from Tabo.\n• Explore Dhankar Village & Gompa, perched on a cliff with stunning valley views.\n• Travel to Kaza, the headquarters of Spiti Valley.\n• Stroll through Kaza Market, soaking in the local vibes.\n• Stay: Homestay in Kaza\n• Food: Breakfast, Dinner Included"
  },
  {
    day: 6,
    title: "Explore Key, Komic, Langza, and Hikkim in a day",
    description: "• Exploring the Wonders of Spiti Valley\n• Visit Key Monastery, the largest Tibetan Buddhist monastery in Spiti, known for its murals, manuscripts, and spiritual aura.\n• Explore Komic, the world’s highest motorable village (15,050 ft), and its ancient Komic Gompa.\n• Witness the majestic Buddha Statue at Langza (14,300 ft) and discover fossils from an ancient seabed.\n• Send a postcard from Hikkim, home to the world’s highest post office (14,400 ft).\n• Stay: Homestay in Kaza\n• Food: Breakfast, Dinner Included"
  },
  {
    day: 7,
    title: "Visit Kibber and Chicham, then head towards Chandra Taal",
    description: "• Spiti Valley to Chandra Taal – A Journey to the Moon Lake\n• Visit Kibber, a stunning high-altitude village known for its barren beauty and monasteries.\n• Cross the Chicham Bridge, the highest bridge in Asia, offering breathtaking views.\n• Travel to Chandra Taal, the mesmerizing \"Moon Lake\" on the Samudra Tapu plateau.\n• Overnight stay at Chandra Taal Camp.\n• Note: Chandra Taal Lake usually opens by late May or June. If inaccessible, we stay in Kaza and reroute via Kalpa and Shimla.\n• Stay: Chandratal/Losar stay in tent or Homestay\n• Food: Breakfast, Dinner Included"
  },
  {
    day: 8,
    title: "Journey to Manali through the Atal Tunnel",
    description: "• Chandra Taal to Manali – A Thrilling Journey\n• Start the morning with a visit to the stunning Chandra Taal Lake.\n• Travel to Manali via Chhatru, experiencing one of the world’s most thrilling and scenic routes.\n• Pass through the famous Atal Tunnel and explore the breathtaking Solang Valley.\n• Stay: Homestay/Tent in Manali\n• Food: Breakfast, Dinner Included"
  },
  {
    day: 9,
    title: "Explore Manali & adventure activities",
    description: "• Manali Adventure & Sightseeing\n• Kickstart the day with thrilling adventure activities like paragliding and river rafting.\n• Explore Manali’s iconic spots, including Hadimba Devi Temple, Mall Road Market, and the charming Old Manali area.\n• Night drive to Jalandhar\n• Food: Breakfast Included"
  },
  {
    day: 10,
    title: "Reach Jalandhar & then board the return train",
    description: "• Enjoy the overnight journey back to Ahmedabad with new friends, memories, and thrilling experiences.\n• Share your photos, videos, and stories, and engage in fun activities on the way home."
  },
  {
    day: 11,
    title: "Arrival in Ahmedabad",
    description: "• Arrival in Ahmedabad – Journey Concludes\n• Enjoy the famous Rabdi & Chaat as the train passes through Rajasthan in the morning.\n• Time to bid farewell, cherish the memories, and conclude this incredible journey!"
  }
];

async function main() {
  try {
    const updatedTrip = await prisma.trip.update({
      where: { id: 'SPT-1' },
      data: {
        itinerary: itinerary
      }
    });
    console.log("Successfully updated SPT-1 itinerary! New itinerary count:", updatedTrip.itinerary.length);
  } catch (err) {
    console.error("Error updating trip itinerary:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
