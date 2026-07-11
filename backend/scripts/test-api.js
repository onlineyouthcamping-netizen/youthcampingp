const axios = require('axios');
const {
  assertMutatingTestSafety,
  requireEnvironmentValue,
} = require('./src/utils/testSafety');

const apiUrl = assertMutatingTestSafety({
  apiUrl: requireEnvironmentValue('TEST_API_URL')
});
const email = requireEnvironmentValue('TEST_ADMIN_EMAIL');
const password = requireEnvironmentValue('TEST_ADMIN_PASSWORD');

async function test() {
  const res = await axios.post(`${apiUrl}/admin/login`, { email, password });
  console.log('Login:', res.data.data.admin);
  const token = res.data.data.token;
  const me = await axios.get(`${apiUrl}/admin/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Me:', me.data.data);
}

test();
