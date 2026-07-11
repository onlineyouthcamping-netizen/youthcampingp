const axios = require('axios');
const {
  assertReadOnlyTestSafety,
  requireEnvironmentValue,
} = require('./src/utils/testSafety');

const apiUrl = assertReadOnlyTestSafety({
  apiUrl: requireEnvironmentValue('TEST_API_URL')
});

async function check() {
  try {
    const res = await axios.get(`${apiUrl}/trips?status=all`);
    console.log('Status:', res.status);
    console.log('Count:', res.data.count);
    console.log('Data Length:', res.data.data.length);
    console.log('First Trip:', res.data.data[0]?.title);
  } catch (err) {
    console.error('Error calling API:', err.message);
    if (err.response) console.log('Response:', err.response.data);
  }
}

check();
