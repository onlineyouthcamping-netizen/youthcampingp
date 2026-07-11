const axios = require('axios');

/**
 * Pushes booking data to Google Sheets via Apps Script Web App
 * Maps new SaaS Booking Model fields to Sheet columns
 */
exports.syncBookingToSheets = async (booking) => {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  
  console.log(`[SHEETS] Attempting sync for booking: ${booking.bookingId}`);
  
  if (!scriptUrl) {
    console.warn('[SHEETS] No GOOGLE_APPS_SCRIPT_URL found in .env, skipping sync');
    return;
  }

  // Determine if there are multiple passengers
  const passengers = booking.passengers?.persons || [];
  const syncItems = [];

  if (passengers.length > 0) {
    // Create a sync item for each passenger
    passengers.forEach((p, idx) => {
      syncItems.push({
        tripName: booking.tripName || 'GENERAL BOOKINGS',
        fullName: p.name || p.fullName || booking.fullName || booking.name,
        age: p.age || (idx === 0 ? booking.age : ''),
        gender: p.gender || (idx === 0 ? booking.gender : ''),
        mobile: p.phone || p.mobile || booking.mobile || booking.phone,
        trainClass: booking.passengers?.details?.trainOption || booking.passengers?.details?.trainClass || booking.trainClass,
        ticketStatus: booking.passengers?.details?.ticketStatus || booking.ticketStatus,
        roomType: booking.passengers?.details?.roomSharing || booking.passengers?.details?.roomType || booking.roomType,
        advancePaid: idx === 0 ? booking.advancePaid : 0, // Only show advance on first row to avoid double counting
        paymentDate: booking.departureDate,
        notes: (booking.notes || booking.adminNotes || booking.passengers?.details?.specialRequests || '') + (idx > 0 ? ` (Part of ${booking.name}'s group)` : ''),
        verifiedBy: booking.adminNotes ? 'Admin' : 'System'
      });
    });
  } else {
    // Single passenger fallback
    syncItems.push({
      tripName: booking.tripName || 'GENERAL BOOKINGS',
      fullName: booking.fullName || booking.name,
      age: booking.age || booking.passengers?.details?.age,
      gender: booking.gender || booking.passengers?.details?.gender,
      mobile: booking.mobile || booking.phone,
      trainClass: booking.passengers?.details?.trainOption || booking.passengers?.details?.trainClass || booking.trainClass,
      ticketStatus: booking.passengers?.details?.ticketStatus || booking.ticketStatus,
      roomType: booking.passengers?.details?.roomSharing || booking.passengers?.details?.roomType || booking.roomType,
      advancePaid: booking.advancePaid,
      paymentDate: booking.departureDate,
      notes: booking.notes || booking.adminNotes || booking.passengers?.details?.specialRequests || '',
      verifiedBy: booking.adminNotes ? 'Admin' : 'System'
    });
  }

  try {
    const results = [];
    for (const payload of syncItems) {
      const response = await axios.post(scriptUrl, payload);
      console.log(`[SHEETS] Sync successful for ${payload.fullName}: ${JSON.stringify(response.data)}`);
      results.push(response.data);
    }
    return results;
  } catch (error) {
    console.error('[SHEETS_SYNC_ERR]', error.message);
    if (error.response) {
      console.error('[SHEETS_RESPONSE_DATA]', JSON.stringify(error.response.data));
    }
    throw error;
  }
};
