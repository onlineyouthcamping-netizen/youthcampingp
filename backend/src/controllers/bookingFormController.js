const { prisma } = require('../lib/prisma');
const { syncBookingToSheets } = require('../utils/googleSheetsSync');
const { generateBookingId } = require('../utils/bookingIdGenerator');

const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '..', '..', 'bookingForms.json');

// Helper to read/write forms
const getForms = () => {
  try {
    if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, '[]');
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch (e) { return []; }
};

const saveForms = (forms) => {
  fs.writeFileSync(dataFile, JSON.stringify(forms, null, 2));
};

exports.createBookingForm = async (req, res, next) => {
  try {
    const { tripName, date, tripId, paymentMode, bookingAmount } = req.body;
    if (!tripName || !date) return res.status(400).json({ success: false, message: 'Trip Name and Date are required' });

    let forms = getForms();
    let form = forms.find(f => f.tripName === tripName && f.date === date);
    
    if (!form) {
      form = {
        id: `form_${Date.now()}`,
        tripName,
        date,
        tripId,
        paymentMode: paymentMode || 'Full Payment',
        bookingAmount: parseFloat(bookingAmount) || 0,
        formUrl: `https://forms.gle/mock-url-${Date.now()}`,
        sheetUrl: `https://docs.google.com/spreadsheets/d/mock-id-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      forms.push(form);
      saveForms(forms);
    }
    
    res.json({ success: true, data: form });
  } catch (error) { next(error); }
};

exports.getBookingForms = async (req, res, next) => {
  try {
    const forms = getForms().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: forms });
  } catch (error) { next(error); }
};

exports.lookupBookingForm = async (req, res, next) => {
  try {
    const { tripName, date } = req.query;
    const form = getForms().find(f => f.tripName === tripName && f.date === date);
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
    res.json({ success: true, data: form });
  } catch (error) { next(error); }
};

exports.updateBookingForm = async (req, res, next) => {
  try {
    let forms = getForms();
    const index = forms.findIndex(f => f.id === req.params.id || f._id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: 'Form not found' });
    
    forms[index] = { ...forms[index], ...req.body };
    saveForms(forms);
    
    res.json({ success: true, data: forms[index] });
  } catch (error) { next(error); }
};

exports.deleteBookingForm = async (req, res, next) => {
  try {
    let forms = getForms();
    forms = forms.filter(f => f.id !== req.params.id && f._id !== req.params.id);
    saveForms(forms);
    
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) { next(error); }
};

exports.getShareMessage = async (req, res) => {
  const { tripName, date, formUrl } = req.body;
  res.json({ 
    success: true, 
    message: `Hello 😊\n\nPlease complete your booking here:\n${formUrl}\n\nTrip: ${tripName}\nDate: ${date}\n\nTeam YouthCamping 🏕️` 
  });
};

exports.createPublicBooking = async (req, res, next) => {
  try {
    const { 
      name, phone, email, tripName, date, 
      roomSharing, trainOption, participantsList, 
      specialRequests, pickupCity, tripId,
      numberOfTravelers, baseAmount, gstAmount, totalAmount
    } = req.body;

    if (!name || !phone || !tripName) {
      return res.status(400).json({ success: false, message: 'Name, phone and trip are required' });
    }

    // 1. Determine tripId
    let finalTripId = tripId;
    let trip = null;

    if (finalTripId && finalTripId !== 'manual') {
      trip = await prisma.trip.findUnique({ where: { id: finalTripId } });
    }
    
    if (!trip && tripName) {
      trip = await prisma.trip.findFirst({ where: { title: tripName } });
    }

    // Fallback trip ID to prevent Foreign Key constraint failure
    if (!trip) {
      const anyTrip = await prisma.trip.findFirst();
      if (anyTrip) {
        trip = anyTrip;
        finalTripId = anyTrip.id;
      } else {
        throw new Error('Database configuration error: No trips found in inventory.');
      }
    } else {
      finalTripId = trip.id;
    }

    let booking;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const currentBookingId = generateBookingId();
        // 3. Save to Prisma
        booking = await prisma.booking.create({
          data: {
            bookingId: currentBookingId,
            tenantId: 'default',
            tripId: finalTripId,
            tripName: tripName,
            name,
            fullName: name,
            phone,
            mobile: phone,
            email,
            numberOfTravelers: parseInt(numberOfTravelers) || participantsList?.length || 1,
            baseAmount: parseFloat(baseAmount) || 0,
            gstAmount: parseFloat(gstAmount) || 0,
            totalAmount: parseFloat(totalAmount) || 0,
            amount: parseFloat(totalAmount) || 0,
            advancePaid: req.body.advancePaid !== undefined ? parseFloat(req.body.advancePaid) : 0,
            remainingAmount: req.body.remainingAmount !== undefined ? parseFloat(req.body.remainingAmount) : ((parseFloat(totalAmount) || 0) - (req.body.advancePaid ? parseFloat(req.body.advancePaid) : 0)),
            departureDate: (() => {
              if (!date) return null;
              const d = new Date(date);
              return isNaN(d.getTime()) ? null : d;
            })(),
            pickupCity: pickupCity || null,
            skipDays: req.body.skipDays !== undefined ? parseInt(req.body.skipDays) : 0,
            adjustedPrice: req.body.adjustedPrice !== undefined ? parseFloat(req.body.adjustedPrice) : null,
            joiningDate: req.body.joiningDate ? new Date(req.body.joiningDate) : null,
            status: 'pending',
            paymentStatus: req.body.paymentStatus || 'Pending',
            notes: specialRequests || '',
            passengers: {
              details: {
                roomSharing,
                trainOption,
                travelDate: date
              },
              persons: participantsList || []
            }
          }
        });
        break;
      } catch (error) {
        attempts++;
        if (error.code === 'P2002' && error.meta?.target?.includes('bookingId') && attempts < maxAttempts) {
          console.warn(`[BOOKING_COLLISION] Retrying custom booking creation. Attempt: ${attempts}`);
          continue;
        }
        if (attempts >= maxAttempts) {
          throw new Error('Server failed to generate a unique booking ID after multiple attempts.');
        }
        throw error;
      }
    }

    // Sync to Google Sheets
    syncBookingToSheets(booking).catch(err => console.error('[SHEETS_SYNC_SILENT_ERR]', err.message));

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error('🔥 [PUBLIC BOOKING ERROR]:', error);
    // Return detailed error in dev to fix it faster
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal Server Error',
      details: error.code === 'P2003' ? 'Foreign Key Constraint failed - Trip ID might not exist' : error.message
    });
  }
};
