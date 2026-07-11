const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildApprovedEmail,
  buildStatusUpdateEmail,
  buildPendingReminderEmail,
  buildUrgentAlertEmail,
  WAITLIST_DISCLAIMER
} = require('../src/utils/trainTicketEmailTemplates');

test('buildApprovedEmail formats confirmed/waitlisted email correctly', () => {
  const booking = { fullName: 'John Doe', tripName: 'Manali Kasol Adventure' };
  const ticket = {
    journeyDate: '2026-07-10T00:00:00.000Z',
    trainName: 'Shatabdi Express',
    trainNumber: '12001',
    sourceStation: 'NDLS',
    destinationStation: 'KLK',
    ticketStatus: 'CONFIRMED',
    pnr: '1234567890'
  };

  const email = buildApprovedEmail({ booking, ticket });
  assert.ok(email.subject.includes('Confirmed'));
  assert.ok(email.html.includes('John Doe'));
  assert.ok(email.html.includes('Manali Kasol Adventure'));
  // Confirm customer-facing email does NOT contain PNR
  assert.equal(email.html.includes('1234567890'), false);
  assert.equal(email.text.includes('1234567890'), false);
});

test('buildApprovedEmail appends waitlist disclaimer for WAITLISTED/RAC status', () => {
  const booking = { fullName: 'Jane Doe' };
  const ticket = { ticketStatus: 'WAITLISTED', pnr: '9999999999' };
  
  const email = buildApprovedEmail({ booking, ticket });
  assert.ok(email.html.includes(WAITLIST_DISCLAIMER));
  assert.equal(email.html.includes('9999999999'), false);
});

test('buildStatusUpdateEmail formats status change info correctly', () => {
  const booking = { bookingId: 'B-123', tripName: 'Spiti Valley' };
  const ticket = { travelerName: 'Alice' };
  
  const email = buildStatusUpdateEmail({ booking, ticket, oldStatus: 'PENDING', newStatus: 'BOOKED' });
  assert.ok(email.subject.includes('Updated'));
  assert.ok(email.html.includes('Alice'));
  assert.ok(email.html.includes('PENDING'));
  assert.ok(email.html.includes('BOOKED'));
});

test('buildPendingReminderEmail format matches requirements without PNR', () => {
  const booking = { bookingId: 'B-456' };
  const tickets = [{ travelerName: 'Bob', pnr: '1111111111' }];
  
  const email = buildPendingReminderEmail({ booking, tickets });
  assert.ok(email.subject.includes('Pending'));
  assert.ok(email.html.includes('Bob'));
  assert.equal(email.html.includes('1111111111'), false);
});

test('buildUrgentAlertEmail formats urgent departure alert without PNR', () => {
  const booking = { bookingId: 'B-789' };
  const tickets = [{ travelerName: 'Charlie', ticketStatus: 'WAITLISTED', pnr: '2222222222' }];
  
  const email = buildUrgentAlertEmail({ booking, tickets, departure: '2026-07-05T00:00:00.000Z' });
  assert.ok(email.subject.includes('URGENT'));
  assert.ok(email.html.includes('Charlie'));
  assert.equal(email.html.includes('2222222222'), false);
});
