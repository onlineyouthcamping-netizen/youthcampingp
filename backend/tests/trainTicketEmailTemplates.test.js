const {
  buildApprovedEmail,
  buildStatusUpdateEmail,
  buildPendingReminderEmail,
  buildUrgentAlertEmail,
  WAITLIST_DISCLAIMER
} = require('../src/utils/trainTicketEmailTemplates');

describe('Train Ticket Email Templates', () => {
  it('buildApprovedEmail formats confirmed/waitlisted email correctly', () => {
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
    expect(email.subject).toContain('Confirmed');
    expect(email.html).toContain('John Doe');
    expect(email.html).toContain('Manali Kasol Adventure');
    // Confirm customer-facing email does NOT contain PNR
    expect(email.html.includes('1234567890')).toBe(false);
    expect(email.text.includes('1234567890')).toBe(false);
  });

  it('buildApprovedEmail appends waitlist disclaimer for WAITLISTED/RAC status', () => {
    const booking = { fullName: 'Jane Doe' };
    const ticket = { ticketStatus: 'WAITLISTED', pnr: '9999999999' };
    
    const email = buildApprovedEmail({ booking, ticket });
    expect(email.html).toContain(WAITLIST_DISCLAIMER);
    expect(email.html.includes('9999999999')).toBe(false);
  });

  it('buildStatusUpdateEmail formats status change info correctly', () => {
    const booking = { bookingId: 'B-123', tripName: 'Spiti Valley' };
    const ticket = { travelerName: 'Alice' };
    
    const email = buildStatusUpdateEmail({ booking, ticket, oldStatus: 'PENDING', newStatus: 'BOOKED' });
    expect(email.subject).toContain('Updated');
    expect(email.html).toContain('Alice');
    expect(email.html).toContain('PENDING');
    expect(email.html).toContain('BOOKED');
  });

  it('buildPendingReminderEmail format matches requirements without PNR', () => {
    const booking = { bookingId: 'B-456' };
    const tickets = [{ travelerName: 'Bob', pnr: '1111111111' }];
    
    const email = buildPendingReminderEmail({ booking, tickets });
    expect(email.subject).toContain('Pending');
    expect(email.html).toContain('Bob');
    expect(email.html.includes('1111111111')).toBe(false);
  });

  it('buildUrgentAlertEmail formats urgent departure alert without PNR', () => {
    const booking = { bookingId: 'B-789' };
    const tickets = [{ travelerName: 'Charlie', ticketStatus: 'WAITLISTED', pnr: '2222222222' }];
    
    const email = buildUrgentAlertEmail({ booking, tickets, departure: '2026-07-05T00:00:00.000Z' });
    expect(email.subject).toContain('URGENT');
    expect(email.html).toContain('Charlie');
    expect(email.html.includes('2222222222')).toBe(false);
  });
});
