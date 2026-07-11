const axios = require('axios');

async function main() {
  const API_URL = 'http://localhost:3001/api';
  
  // 1. Login as admin to get token
  const loginRes = await axios.post(`${API_URL}/admin/login`, {
    email: 'admin@test.com',
    password: 'testpass123'
  });
  const token = loginRes.data.data.token;
  console.log("Token obtained:", token);
  
  const headers = { 'Authorization': `Bearer ${token}` };
  
  // 2. Get all bookings to find a valid ID
  const bookingsRes = await axios.get(`${API_URL}/bookings`, { headers });
  const bookings = bookingsRes.data.data || [];
  if (bookings.length === 0) {
    console.log("No bookings found!");
    return;
  }
  const targetBooking = bookings[0];
  console.log(`Targeting Booking: ID=${targetBooking.id}, bookingId=${targetBooking.bookingId}`);
  
  // 3. Put update with test sourceMeta
  const testMeta = {
    testField: 'hello_world',
    bookingItems: [
      { name: 'Manual GST Discount', rate: -500, qty: 1 },
      { name: 'Sleeper Class Train', rate: 12000, qty: 1 }
    ]
  };
  
  console.log("Updating booking with sourceMeta...");
  const updateRes = await axios.put(`${API_URL}/bookings/${targetBooking.id}`, {
    sourceMeta: testMeta
  }, { headers });
  console.log("Update response:", updateRes.data);
  
  // 4. Retrieve booking details to check persisted fields
  const getRes = await axios.get(`${API_URL}/bookings/${targetBooking.id}`, { headers });
  console.log("Full Retrieved Booking Data:", JSON.stringify(getRes.data.data, null, 2));
}

main().catch(console.error);
