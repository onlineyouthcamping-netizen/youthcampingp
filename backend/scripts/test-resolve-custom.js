const axios = require('axios');
const {
  assertReadOnlyTestSafety,
  requireEnvironmentValue,
} = require('./src/utils/testSafety');

const apiUrl = assertReadOnlyTestSafety({
  apiUrl: requireEnvironmentValue('TEST_API_URL')
});
const token = requireEnvironmentValue('TEST_BOOKING_LINK_TOKEN');

async function test() {
  try {
    const res = await axios.get(`${apiUrl}/booking-links/resolve?token=${encodeURIComponent(token)}`);
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error Status:', err.response?.status);
    console.error('Error Data:', err.response?.data);
  }
}
test();
