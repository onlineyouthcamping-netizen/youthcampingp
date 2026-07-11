require('dotenv').config();
const axios = require('axios');

async function testSync() {
  console.log('--- GOOGLE SHEETS SYNC TEST ---');
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  
  if (!url) {
    console.error('❌ ERROR: GOOGLE_APPS_SCRIPT_URL not found in .env');
    process.exit(1);
  }

  console.log(`📡 Target URL: ${url.substring(0, 50)}...`);
  
  const testData = {
    bookingId: "TEST-" + Math.random().toString(36).substr(2, 4).toUpperCase(),
    timestamp: new Date().toISOString(),
    name: "CONNECTION TESTER",
    phone: "0000000000",
    tripName: "Sync Test",
    date: "2026-01-01",
    status: "Accepted",
    notes: "Running connectivity test from server deployment environment."
  };

  try {
    console.log('🚀 Sending request...');
    const response = await axios.post(url, testData, {
      timeout: 20000,
      maxRedirects: 5
    });

    console.log('\n✅ RESPONSE RECEIVED:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data && response.data.success) {
      console.log('\n✨ SUCCESS! The server can communicate with Google Sheets.');
    } else {
      console.log('\n⚠️ PARTIAL SUCCESS: Connected, but Google Apps Script returned an error.');
    }
  } catch (err) {
    console.error('\n❌ SYNC FAILED:');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error('Data:', err.response.data);
    } else if (err.request) {
      console.error('No response received from Google. This usually means a firewall or network issue on the server.');
    } else {
      console.error('Error:', err.message);
    }
  }
}

testSync();
