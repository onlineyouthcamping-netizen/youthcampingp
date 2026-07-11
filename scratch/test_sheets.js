const axios = require('axios');
require('dotenv').config({ path: '../backend/.env' });

async function test() {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) {
    console.error('No GOOGLE_APPS_SCRIPT_URL found in env!');
    return;
  }
  
  console.log('Testing Google Sheets Sync connection...');
  console.log('URL:', scriptUrl);
  
  const payload = {
    tripName: 'TEST TRIP',
    fullName: 'Test Auditor User',
    age: '25',
    gender: 'Male',
    mobile: '9999999999',
    trainClass: '3AC',
    ticketStatus: 'Done',
    roomType: '2 Room',
    advancePaid: 1000,
    paymentDate: new Date(),
    notes: 'Test note from production audit',
    verifiedBy: 'System Audit'
  };
  
  try {
    const res = await axios.post(scriptUrl, payload);
    console.log('Google Sheets Sync Status: SUCCESS!');
    console.log('Response:', JSON.stringify(res.data));
  } catch (err) {
    console.error('Google Sheets Sync Status: FAILED!');
    console.error(err.message);
  }
}

test();
