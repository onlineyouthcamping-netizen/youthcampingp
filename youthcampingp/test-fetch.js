const {
  assertReadOnlyTestSafety,
  requireEnvironmentValue,
} = require('../backend/src/utils/testSafety');

const API_BASE_URL = assertReadOnlyTestSafety({
  apiUrl: requireEnvironmentValue('TEST_API_URL')
});
console.log('API Base URL:', API_BASE_URL);

async function testFetch() {
  try {
    const res = await fetch(`${API_BASE_URL}/page-builder/home`);
    console.log('Response OK:', res.ok, 'Status:', res.status);
    const json = await res.json();
    console.log('Success:', json.success);
    if (json.success && json.data) {
      console.log('Sections Count:', json.data.sections ? json.data.sections.length : 0);
      const upcoming = (json.data.sections || []).find(s => s.type === 'upcoming_trips');
      if (upcoming) {
        console.log('Upcoming section data:', JSON.stringify(upcoming.draft || upcoming.content || upcoming, null, 2));
      } else {
        console.log('Upcoming trips section not found in sections!');
      }
    }
  } catch (err) {
    console.error('Error fetching:', err);
  }
}

testFetch();
