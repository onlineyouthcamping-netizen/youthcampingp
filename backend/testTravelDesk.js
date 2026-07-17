const axios = require('axios');

async function runTests() {
  const baseURL = 'http://localhost:3001/api';
  
  try {
    // 1. Login
    const loginRes = await axios.post(`${baseURL}/admin/login`, {
      email: 'nikkiyouthcamping@gmail.com',
      password: 'password123'
    });
    const token = loginRes.data.data.token;
    console.log('✅ Login successful. Token starts with:', token ? token.substring(0, 15) : 'undefined');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Create Ticketing Link (Testing validation and audit log)
    const linkRes = await axios.post(`${baseURL}/travel-desk/ticketing/links`, {
      tripId: 'MKA-1',
      label: 'IRCTC Agent Portal',
      val: 'irctc',
      icon: 'Ticket',
      linkUrl: 'https://irctc.co.in'
    }, { headers });
    console.log('✅ Ticketing Link created:', linkRes.data.data.id);

    // 3. Create SOP (Testing validation and audit log)
    const sopRes = await axios.post(`${baseURL}/travel-desk/sops`, {
      tripId: 'MKA-1',
      title: 'Check-in Procedure',
      category: 'Operations',
      description: 'A test procedure',
      icon: 'Clipboard',
      items: [{ title: 'Step 1', content: 'Do this' }]
    }, { headers });
    console.log('✅ SOP created:', sopRes.data.data.id);

    // 4. Fetch Activity Logs
    const logRes = await axios.get(`${baseURL}/travel-desk/MKA-1/activity-log`, { headers });
    console.log('✅ Activity Logs fetched:', logRes.data.data.length);
    if (logRes.data.data.length === 0) {
      throw new Error('Audit logs not created!');
    }

    console.log('🎉 All backend tests passed!');
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
  }
}

runTests();
