const axios = require('axios');

const jwt = require('jsonwebtoken');

async function main() {
  try {
    const secret = "4f9e8d7c6b5a4132211009988776655443322110";
    const token = jwt.sign(
      { id: 'cmrda7nh10000gs2qzft4u5ki', role: 'admin', tenantId: 'default', tokenVersion: 0 },
      secret,
      { expiresIn: '7d' }
    );
    console.log('Token signed successfully.');

    // 2. Fetch itinerary
    const itineraryRes = await axios.get('http://localhost:3001/api/travel-desk/MKA-1/itinerary', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('API response data:', JSON.stringify(itineraryRes.data, null, 2));
  } catch (err) {
    console.error('Error fetching itinerary:', err.response ? err.response.data : err.message);
  }
}

main();
