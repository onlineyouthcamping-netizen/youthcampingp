const axios = require('axios');

async function check() {
  try {
    const res = await axios.get('https://bktp1.onrender.com/api/health');
    console.log('Health Check Response:', res.data);
  } catch (err) {
    console.error('Health Check failed:', err.message);
  }
}

check();
