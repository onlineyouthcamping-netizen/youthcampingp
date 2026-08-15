const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function safeParseDate(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d;
  
  // Try dd-mm-yyyy or dd/mm/yyyy
  if (typeof val === 'string') {
    const parts = val.split(/[-/]/);
    if (parts.length === 3) {
      // If year is 4 digits at end
      if (parts[2].length === 4) {
        const parsed = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00Z`);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }
  }
  return null;
}

async function restorePrinceBooking() {
  console.log('🔍 Searching auditLog for deleted Prince booking...');

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      entityType: 'booking'
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  const princeLogs = auditLogs.filter(a => JSON.stringify(a.beforeData || {}).toLowerCase().includes('prince'));

  if (princeLogs.length === 0) {
    console.log('⚠️ No audit log found for Prince booking.');
    return;
  }

  const deleteLog = princeLogs[0];
  console.log(`Found Audit Log: ${deleteLog.id}, Action: ${deleteLog.action}, Date: ${deleteLog.createdAt}`);
  
  const rawData = deleteLog.beforeData;
  if (!rawData) {
    console.log('⚠️ No beforeData found in audit log.');
    return;
  }

  console.log('Booking raw data found in audit log:');
  console.log({
    id: rawData.id,
    bookingId: rawData.bookingId,
    name: rawData.name || rawData.fullName,
    tripId: rawData.tripId,
    phone: rawData.phone || rawData.mobile,
    totalAmount: rawData.totalAmount || rawData.amount,
    numberOfTravelers: rawData.numberOfTravelers,
    departureDateRaw: rawData.departureDate
  });

  // Check if booking already exists with this ID or bookingId
  const existing = await prisma.booking.findFirst({
    where: {
      OR: [
        { id: rawData.id },
        { bookingId: rawData.bookingId }
      ]
    }
  });

  if (existing) {
    console.log(`Booking ${existing.bookingId} already exists with status '${existing.status}'. Updating status to 'confirmed'...`);
    const updated = await prisma.booking.update({
      where: { id: existing.id },
      data: {
        status: 'confirmed',
        updatedAt: new Date()
      }
    });
    console.log('✅ Booking updated to confirmed:', updated.bookingId);
    return;
  }

  // Ensure trip exists or find matching trip
  let tripId = rawData.tripId;
  const tripExists = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!tripExists) {
    console.log(`Trip ID ${tripId} not found, searching for trip by name/title...`);
    const fallbackTrip = await prisma.trip.findFirst({
      where: { title: { contains: 'spiti', mode: 'insensitive' } }
    }) || await prisma.trip.findFirst();
    if (fallbackTrip) {
      tripId = fallbackTrip.id;
      console.log(`Using fallback trip: ${fallbackTrip.title} (${fallbackTrip.id})`);
    }
  }

  const departureDate = safeParseDate(rawData.departureDate) || new Date('2026-09-08T00:00:00Z');
  const createdAt = safeParseDate(rawData.createdAt) || new Date();

  // Clean data fields for Prisma Booking create
  const createPayload = {
    id: rawData.id,
    tenantId: rawData.tenantId || 'default',
    bookingId: rawData.bookingId || `BK-SPITI-08SEP-PRINCE`,
    tripId: tripId,
    tripName: rawData.tripName || 'Spiti Valley Road Trip',
    status: 'confirmed',
    name: rawData.name || rawData.fullName || 'Prince',
    fullName: rawData.fullName || rawData.name || 'Prince',
    phone: rawData.phone || rawData.mobile || '8128492232',
    mobile: rawData.mobile || rawData.phone || '8128492232',
    email: rawData.email || 'prince8128@gmail.com',
    age: rawData.age ? Number(rawData.age) : 23,
    gender: rawData.gender || 'Male',
    numberOfTravelers: rawData.numberOfTravelers ? Number(rawData.numberOfTravelers) : 8,
    baseAmount: rawData.baseAmount ? Number(rawData.baseAmount) : null,
    gstAmount: rawData.gstAmount ? Number(rawData.gstAmount) : null,
    depositGst: rawData.depositGst ? Number(rawData.depositGst) : null,
    totalAmount: Number(rawData.totalAmount || rawData.amount || 184000),
    amount: Number(rawData.amount || rawData.totalAmount || 40000),
    advancePaid: Number(rawData.advancePaid || 40000),
    remainingAmount: Number(rawData.remainingAmount || 144000),
    paymentMode: rawData.paymentMode || 'OFFICE CASH / CHAKABHAI',
    paymentStatus: rawData.paymentStatus || 'Partial',
    payment_status: rawData.payment_status || 'partial',
    payment_method: rawData.payment_method || 'cash',
    upi_reference: rawData.upi_reference || null,
    notes: rawData.notes || 'Payment Date: 15/07/2026 (Prince: ₹35,000 OFFICE CASH) + 03/08/2026 (Riddhi: ₹5,000 CHAKABHAI)',
    adminNotes: rawData.adminNotes || '08 SEP SPITI - Prince Group (8 Pax, including Riddhi)',
    sourceBookingLinkId: rawData.sourceBookingLinkId || null,
    salesAdminId: rawData.salesAdminId || null,
    sourceMeta: rawData.sourceMeta || undefined,
    departureDate: departureDate,
    pickupCity: rawData.pickupCity || 'Ahmedabad',
    skipDays: rawData.skipDays || 0,
    adjustedPrice: rawData.adjustedPrice ? Number(rawData.adjustedPrice) : null,
    joiningDate: safeParseDate(rawData.joiningDate),
    passengers: rawData.passengers || undefined,
    trainTicketRequired: Boolean(rawData.trainTicketRequired),
    trainTicketStatus: rawData.trainTicketStatus || 'CONFIRMED',
    createdAt: createdAt,
    updatedAt: new Date()
  };

  const restoredBooking = await prisma.booking.create({
    data: createPayload
  });

  // Re-log restoration activity
  try {
    await prisma.bookingActivityLog.create({
      data: {
        bookingId: restoredBooking.id,
        action: 'STATUS_CHANGE',
        details: 'Booking fully restored from audit log',
        performedByAdminId: 'system'
      }
    });
  } catch (err) {
    // ignore
  }

  console.log('\n======================================================');
  console.log('🎉 PRINCE BOOKING RESTORED SUCCESSFULLY!');
  console.log(`Booking ID : ${restoredBooking.bookingId} (${restoredBooking.id})`);
  console.log(`Customer   : ${restoredBooking.name} (${restoredBooking.phone})`);
  console.log(`Trip       : ${restoredBooking.tripName}`);
  console.log(`Travelers  : ${restoredBooking.numberOfTravelers} Pax (Prince, Sneha, Saumya, Vanshika, Manav, Hemal, Lakhan, Riddhi)`);
  console.log(`Total Amt  : ₹${restoredBooking.totalAmount}`);
  console.log(`Advance    : ₹${restoredBooking.advancePaid}`);
  console.log(`Remaining  : ₹${restoredBooking.remainingAmount}`);
  console.log(`Status     : ${restoredBooking.status}`);
  console.log('======================================================\n');
}

restorePrinceBooking()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error restoring Prince booking:', e);
    prisma.$disconnect();
    process.exit(1);
  });
