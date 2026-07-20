const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:3001/api/admin/login', {
      email: 'admin@youthcamping.online',
      password: 'password123'
    });
    console.log("Response:", res.data);
  } catch (err) {
    console.error("Login Failed:", err.response ? err.response.data : err.message);
  }
}
test();
