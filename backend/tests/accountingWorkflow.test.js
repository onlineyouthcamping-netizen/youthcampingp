const test = require('node:test');
const assert = require('node:assert/strict');

// Basic mock data and calculations verification
test('calculates collections and monthly grouping correctly', () => {
  const mockEntries = [
    { amount: 1000, status: 'APPROVED', createdAt: '2026-06-15T08:00:00Z', salespersonName: 'John', tripName: 'Kedarnath' },
    { amount: 2000, status: 'APPROVED', createdAt: '2026-06-20T08:00:00Z', salespersonName: 'John', tripName: 'Kedarnath' },
    { amount: 1500, status: 'APPROVED', createdAt: '2026-05-10T08:00:00Z', salespersonName: 'Mary', tripName: 'Manali' },
    { amount: 500, status: 'PENDING', createdAt: '2026-06-25T08:00:00Z', salespersonName: 'John', tripName: 'Kedarnath' }
  ];

  // Calculate pending total
  const pendingTotal = mockEntries
    .filter(e => e.status === 'PENDING')
    .reduce((sum, e) => sum + e.amount, 0);

  assert.equal(pendingTotal, 500);

  // Group by trip
  const tripRevenue = {};
  mockEntries.forEach(e => {
    if (e.status === 'APPROVED') {
      tripRevenue[e.tripName] = (tripRevenue[e.tripName] || 0) + e.amount;
    }
  });

  assert.equal(tripRevenue['Kedarnath'], 3000);
  assert.equal(tripRevenue['Manali'], 1500);

  // Group by salesperson
  const salesPerformance = {};
  mockEntries.forEach(e => {
    if (e.status === 'APPROVED') {
      salesPerformance[e.salespersonName] = (salesPerformance[e.salespersonName] || 0) + e.amount;
    }
  });

  assert.equal(salesPerformance['John'], 3000);
  assert.equal(salesPerformance['Mary'], 1500);

  // Group by month
  const monthlyTrend = {};
  mockEntries.forEach(e => {
    if (e.status === 'APPROVED') {
      const date = new Date(e.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + e.amount;
    }
  });

  assert.equal(monthlyTrend['2026-06'], 3000);
  assert.equal(monthlyTrend['2026-05'], 1500);
});
