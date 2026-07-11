const axios = require('axios');
const {
  assertMutatingTestSafety,
  requireEnvironmentValue,
} = require('./src/utils/testSafety');

const API_URL = assertMutatingTestSafety({
  apiUrl: requireEnvironmentValue('TEST_API_URL')
});
const ADMIN_EMAIL = requireEnvironmentValue('TEST_ADMIN_EMAIL');
const ADMIN_PASSWORD = requireEnvironmentValue('TEST_ADMIN_PASSWORD');

async function verify() {
  console.log('=== STARTING BACKEND/API TRUTH MODE AUDIT ===\n');

  // 1. Health Check
  try {
    const res = await axios.get(`${API_URL}/health`);
    console.log('✅ API Health: Working', res.data);
  } catch (err) {
    console.error('❌ API Health: Broken', err.message);
  }

  // 2. Fetch Trips
  let testTrip = null;
  try {
    const res = await axios.get(`${API_URL}/trips`);
    const count = res.data.data ? res.data.data.length : 0;
    console.log(`✅ Trip APIs (List): Working (Found ${count} trips)`);
    if (count > 0) {
      testTrip = res.data.data[0];
      console.log(`   Sample Trip: "${testTrip.title}" [ID: ${testTrip.id}, Slug: ${testTrip.slug}]`);
    }
  } catch (err) {
    console.error('❌ Trip APIs (List): Broken', err.message);
  }

  // 3. Admin Login
  let token = null;
  try {
    const res = await axios.post(`${API_URL}/admin/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    token = res.data.data?.token || res.data.token;
    console.log('✅ Admin Login: Working (Token acquired successfully)');
  } catch (err) {
    console.error('❌ Admin Login: Broken (Could not authenticate admin)', err.response?.data || err.message);
  }

  if (!token) {
    console.log('\n⚠️ Aborting subsequent authenticated tests due to missing Admin Token.');
    return;
  }

  // 4. Inquiry Flow (Submit inquiry -> Verify listing)
  const testEmail = `test-${Date.now()}@example.com`;
  const testName = 'Truth Mode Auditor';
  try {
    if (!testTrip) throw new Error('No trips available to submit inquiry against');
    
    // Submit
    const submitRes = await axios.post(`${API_URL}/inquiries`, {
      name: testName,
      phone: '9876543210',
      email: testEmail,
      message: 'Truth Mode Audit inquiry submission',
      tripId: testTrip.id,
      tripTitle: testTrip.title,
      date: '2026-08-15',
      count: 2,
      source: 'api_audit'
    });
    console.log(`✅ Submit Inquiry: Working (Submitted for ${testEmail})`);

    // Verify
    const listRes = await axios.get(`${API_URL}/inquiries`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const found = (listRes.data.data || []).find(inq => inq.email === testEmail);
    if (found) {
      console.log(`✅ Inquiry Management: Working (Verified inquiry ID: ${found.id} exists in admin list)`);
    } else {
      console.log('❌ Inquiry Management: Broken (Submitted inquiry not found in admin list)');
    }
  } catch (err) {
    console.error('❌ Inquiry Flow: Broken', err.response?.data || err.message);
  }

  // 5. Booking Flow (Submit booking -> Verify listing)
  const bookingEmail = `book-${Date.now()}@example.com`;
  try {
    if (!testTrip) throw new Error('No trips available to submit booking against');

    const bookingPayload = {
      fullName: 'Lead Auditor',
      name: 'Lead Auditor',
      mobile: '9876543210',
      phone: '9876543210',
      email: bookingEmail,
      tripId: testTrip.id,
      tripName: testTrip.title,
      departureDate: new Date('2026-08-15'),
      pickupCity: 'Delhi',
      skipDays: 0,
      adjustedPrice: testTrip.price,
      baseAmount: testTrip.price,
      amount: testTrip.price * 1.05, // base + 5% GST
      totalAmount: testTrip.price * 1.05,
      advancePaid: testTrip.price * 1.05,
      remainingAmount: 0,
      status: 'pending',
      paymentStatus: 'Paid',
      paymentMode: 'UPI',
      notes: 'Truth Mode Audit booking submission',
      passengers: [
        {
          name: 'Lead Auditor',
          phone: '9876543210',
          email: bookingEmail,
          age: 30,
          gender: 'Male',
          roomSharing: 'Triple Sharing',
          trainOption: 'Sleeper'
        }
      ],
      trainClass: 'Sleeper',
      roomType: 'Triple Sharing',
      ticketStatus: 'Not Booked',
      basePrice: testTrip.price,
      gstAmount: testTrip.price * 0.05
    };

    // Submit
    const submitRes = await axios.post(`${API_URL}/bookings/create`, bookingPayload);
    const bookingId = submitRes.data.data?.bookingId;
    console.log(`✅ Submit Booking: Working (Created bookingId: ${bookingId})`);

    // Verify in Admin list
    const listRes = await axios.get(`${API_URL}/bookings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // In our routes, we mount routes/bookingRoutes on /api/bookings. Let's see if the list lists it.
    const found = (listRes.data.data || []).find(b => b.bookingId === bookingId || b.email === bookingEmail);
    if (found) {
      console.log(`✅ Booking Management: Working (Verified booking ${found.bookingId} exists in admin list)`);
    } else {
      console.log(`❌ Booking Management: Broken (Created booking not found in admin list)`);
    }
  } catch (err) {
    console.error('❌ Booking Flow: Broken', err.response?.data || err.message);
  }

  console.log('\n=== BACKEND/API TRUTH MODE AUDIT COMPLETE ===');
}

verify();
