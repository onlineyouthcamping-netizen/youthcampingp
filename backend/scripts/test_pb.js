const axios = require('axios');
const {
  assertReadOnlyTestSafety,
  requireEnvironmentValue,
} = require('./src/utils/testSafety');

const apiUrl = assertReadOnlyTestSafety({
  apiUrl: requireEnvironmentValue('TEST_API_URL')
});

async function test() {
  try {
    const res = await axios.get(`${apiUrl}/page-builder/home/draft`);
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Response:', err.response.data);
    }
  }
}

test();
