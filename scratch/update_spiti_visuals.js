const TRIP_ID = "69eca747c3c998971c04fa4f";
const API_URL = "http://localhost:8888/api/trips";

async function run() {
  try {
    const getRes = await fetch(`${API_URL}/${TRIP_ID}`);
    const { data: trip } = await getRes.json();
    
    // Define our new visuals
    trip.heroImage = "/uploads/trips/spiti_hero.png";
    trip.images = [
      "/uploads/trips/spiti_langza.png",
      "/uploads/trips/spiti_pin_valley.png",
      "/uploads/trips/spiti_dhankar.png"
    ];
    
    trip.gallery = [
      { url: "/uploads/trips/spiti_hero.png", alt: "Key Monastery", order: 0 },
      { url: "/uploads/trips/spiti_langza.png", alt: "Langza Buddha", order: 1 },
      { url: "/uploads/trips/spiti_pin_valley.png", alt: "Pin Valley", order: 2 },
      { url: "/uploads/trips/spiti_dhankar.png", alt: "Dhankar Fort", order: 3 },
      { url: "/uploads/trips/spiti_hikkim.png", alt: "World's Highest Post Office", order: 4 }
    ];

    // Update Itinerary
    if (trip.itinerary && trip.itinerary.length > 0) {
       trip.itinerary[0].photos = ["/uploads/trips/spiti_atal_tunnel.png"];
       if (trip.itinerary.length >= 5) {
          trip.itinerary[4].photos = ["/uploads/trips/spiti_hikkim.png"];
       }
    }

    // Clean up
    delete trip.reviews;
    delete trip.__v;
    delete trip.createdAt;
    delete trip.updatedAt;

    const putRes = await fetch(`${API_URL}/${TRIP_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trip)
    });
    const result = await putRes.json();
    console.log("SUCCESS:", result.success);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

run();
