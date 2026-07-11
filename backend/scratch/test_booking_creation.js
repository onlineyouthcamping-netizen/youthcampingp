const axios = require('axios');

async function test() {
  try {
    const payload = {
      fullName: 'zeel',
      mobile: '74374374783',
      tripId: 'JK1',
      age: 0,
      gender: 'Male',
      email: 'parthpatel07902@gmail.com',
      departureDate: '2026-05-14'
    };

    console.log('Sending request to local server on port 3001...');
    const res = await axios.post('http://localhost:3001/api/bookings', payload);
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error response status:', err.response?.status);
    console.error('Error response data:', JSON.stringify(err.response?.data, null, 2));
  }
}

test();
