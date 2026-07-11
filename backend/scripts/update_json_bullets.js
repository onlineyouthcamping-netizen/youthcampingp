const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'trips-data.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const trips = JSON.parse(rawData);

const updatedDescriptions = {
  1: `• Meet the trip representative at the Sabarmati Railway Station.
• Gather at the boarding station one hour prior to departure.
• Attend a short briefing session by the trip leader.
• Participate in an interactive ice-breaking session with fellow travelers.
• Board the train for the journey to Firozpur.`,
  
  2: `• Arrive at the Amritsar Railway Station in the morning.
• Transfer your main luggage to the tempo traveller.
• Visit the patriotic Wagah Border beating retreat ceremony.
• Explore the serene premises of the Golden Temple.
• Visit the historical Jallianwala Bagh memorial site.
• Walk through the vibrant local markets of Amritsar.
• Enjoy authentic Punjabi cuisine and local Amritsari kulcha.
• Depart for an overnight journey to Kasol.`,

  3: `• Arrive in Kasol and check into the riverside campsite.
• Visit the holy Manikaran Gurudwara and its natural hot springs.
• Take a sacred bath in the hot springs of Gurudwara.
• Hike to Chalal village along the scenic Parvati River.
• Explore the local markets and vibrant cafes of Kasol.
• Enjoy a premium dinner at the riverside campsite.
• Camp overnight under the stars in the Parvati Valley.`,

  4: `• Depart for the Bijli Mahadev base village after breakfast.
• Trek through lush pine forests to the Bijli Mahadev Temple.
• Enjoy a panoramic 360 degree view of the Himalayas.
• Transfer to the hotel or cottage in Manali.
• Enjoy a hot buffet dinner served at the hotel.
• Stay overnight at the premium accommodation in Manali.`,

  5: `• Participate in adventure activities at the campsite after breakfast.
• Experience thrilling paragliding at the highest spot in Manali.
• Enjoy a scenic bird-eye view of the Kullu Valley.
• Experience an eight-kilometer white water rafting adventure.
• Visit the famous local Kullu shawl factory for shopping.
• Board the tempo traveller for an overnight return journey.`,

  6: `• Trek down to Manali after breakfast in the morning.
• Begin a thrilling bike ride to Solang Valley after lunch.
• Drive through the historic and scenic Atal Tunnel.
• Explore the beautiful snow-capped valley of Sissu in Lahaul.
• Travel to the Kullu campsite for an overnight stay.`,

  7: `• Drive to Vashisht Village to visit the ancient temple.
• Trek to the beautiful three-kilometer Jogini Waterfall cascade.
• Visit the historic Hadimba Devi Temple in Old Manali.
• Walk through the bustling shops on Manali Mall Road.
• Return to the hotel for a hot buffet dinner.`,

  8: `• Board the return train from Firozpur Railway Station.
• Relive the beautiful memories of your Himalayan adventure.`,

  9: `• Arrive at the Gandhinagar Railway Junction in the morning.
• Conclude the memorable backpacking journey with new friends.`
};

let found = false;
for (const trip of trips) {
  if (trip.title === "Manali Kasol Amritsar Backpacking Trip") {
    found = true;
    trip.itinerary = trip.itinerary.map(day => {
      const desc = updatedDescriptions[day.day];
      if (desc) {
        return {
          ...day,
          description: desc
        };
      }
      return day;
    });
    break;
  }
}

if (found) {
  fs.writeFileSync(dataPath, JSON.stringify(trips, null, 2), 'utf8');
  console.log("Successfully updated trips-data.json seed file with bullet points!");
} else {
  console.error("Trip 'Manali Kasol Amritsar Backpacking Trip' not found in JSON!");
}
