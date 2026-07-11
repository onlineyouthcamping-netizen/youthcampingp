const axios = require('axios');

async function check() {
  try {
    const res = await axios.get('http://localhost:8888/api/pages/home');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error(e.message);
  }
}

check();
