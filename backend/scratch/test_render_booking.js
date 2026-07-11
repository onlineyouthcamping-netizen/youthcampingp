const axios = require('axios');

async function test() {
  try {
    const payload = {
      fullName: 'zeel-test',
      mobile: '74374374783',
      tripId: 'JK1',
      age: 20,
      gender: 'Male',
      email: 'parthpatel07902@gmail.com',
      departureDate: '2026-05-14'
    };

    console.log('Sending request to Render server...');
    const res = await axios.post('https://bktp1.onrender.com/api/bookings', payload);
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error response status:', err.response?.status);
    console.error('Error response data:', JSON.stringify(err.response?.data, null, 2));
  }
}

test();
