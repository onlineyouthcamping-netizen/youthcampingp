const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('crypto'); // not needed, we'll parse manually or simple split

const prisma = new PrismaClient();

// Helper to parse CSV row safely considering quotes
function parseCSVRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  const filePath1 = path.join('C:\\Users\\Dell\\Downloads\\passenger_report_2026-07-06T13_53_41.csv');
  const filePath2 = path.join('C:\\Users\\Dell\\Downloads\\passenger_report_2026-07-06T13_55_42.csv');
  const filePath3 = path.join('C:\\Users\\Dell\\Downloads\\passenger_report_2026-07-06T13_55_42 (1).csv');

  const files = [filePath1, filePath2, filePath3].filter(f => fs.existsSync(f));
  
  if (files.length === 0) {
    console.error("❌ No passenger report files found in Downloads!");
    return;
  }

  console.log(`Found ${files.length} report files to import.`);

  const bookingsMap = new Map(); // booking_id -> Booking details
  const passengersMap = new Map(); // booking_id -> Passenger array

  for (const file of files) {
    console.log(`Processing file: ${file}`);
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const headers = parseCSVRow(lines[0]);

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const values = parseCSVRow(line);
      
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });

      const bookingId = row.booking_id;
      if (!bookingId) continue;

      // Extract details
      const tripId = row.trip_code || 'SPT';
      const tripName = row.trip_name || 'Spiti Valley Road Trip';
      const status = row.booking_status === 'cart_abandoned' ? 'abandoned' : 'pending';
      const name = row['Title first name and last name'] || 'Unknown Traveler';
      const phone = row['Country code and phone number'] || '';
      const email = row['E-mail'] || '';
      const totalAmount = parseFloat(row.total_booking_amount) || 0.0;
      const totalPaid = parseFloat(row.total_payment_amount_minus_refunds) || 0.0;
      const travelers = parseInt(row.total_passengers) || 1;
      const departureDate = row.departure_start_date ? new Date(row.departure_start_date) : new Date("2026-07-11T00:00:00.000Z");

      // Set booking info
      if (!bookingsMap.has(bookingId)) {
        bookingsMap.set(bookingId, {
          bookingId,
          tripId,
          tripName,
          status,
          name,
          fullName: name,
          phone: phone,
          mobile: phone,
          email,
          age: parseInt(row.Age) || 25,
          gender: row.Gender || 'UNKNOWN',
          numberOfTravelers: travelers,
          baseAmount: totalAmount,
          totalAmount,
          amount: totalAmount,
          advancePaid: totalPaid,
          remainingAmount: totalAmount - totalPaid,
          paymentStatus: totalPaid >= totalAmount ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Pending',
          departureDate,
          pickupCity: row.City || 'Delhi',
          tenantId: 'default'
        });
      }

      // Add passenger
      if (!passengersMap.has(bookingId)) {
        passengersMap.set(bookingId, []);
      }
      passengersMap.get(bookingId).push({
        name,
        gender: row.Gender || 'UNKNOWN',
        age: parseInt(row.Age) || 25,
        phone,
        email
      });
    }
  }

  console.log(`Parsed ${bookingsMap.size} unique bookings. Seeding to Database...`);

  console.log(`Parsed ${bookingsMap.size} unique bookings. Seeding in batches to Database...`);

  const bookingsList = Array.from(bookingsMap.values());
  const passengersData = Array.from(passengersMap.entries());

  // 1. Ensure trips exist
  const uniqueTrips = [...new Set(bookingsList.map(b => b.tripId))];
  for (const tId of uniqueTrips) {
    const tripName = bookingsList.find(b => b.tripId === tId)?.tripName || 'Custom Trip';
    const tripExists = await prisma.trip.findFirst({ where: { id: tId } });
    if (!tripExists) {
      await prisma.trip.create({
        data: {
          id: tId,
          title: tripName,
          slug: tId.toLowerCase() + '-' + Date.now(),
          location: 'Destination',
          price: 9999,
          duration: '8 Days',
          description: 'Spiti road trip',
          tenantId: 'default'
        }
      });
    }
  }

  // 2. Clean up existing matching bookings
  const bIds = bookingsList.map(b => b.bookingId);
  await prisma.accountingEntry.deleteMany({ where: { bookingId: { in: bIds } } });
  await prisma.booking.deleteMany({ where: { bookingId: { in: bIds } } });

  // 3. Chunk insert bookings
  const chunkSize = 200;
  for (let i = 0; i < bookingsList.length; i += chunkSize) {
    const chunk = bookingsList.slice(i, i + chunkSize);
    
    // Map with passengers JSON
    const dataToInsert = chunk.map(b => {
      const pList = passengersMap.get(b.bookingId) || [];
      return {
        ...b,
        passengers: {
          persons: pList,
          details: { accommodationType: "Quad Sharing" }
        }
      };
    });

    await prisma.booking.createMany({
      data: dataToInsert,
      skipDuplicates: true
    });
    
    // Create accounting entry
    const entries = chunk.filter(b => b.advancePaid > 0).map(b => ({
      tenantId: 'default',
      bookingId: b.bookingId,
      amount: b.advancePaid,
      paymentMode: "UPI",
      status: "APPROVED",
      salespersonId: "admin_master_prod",
      notes: `Imported payment from CSV`
    }));

    if (entries.length > 0) {
      await prisma.accountingEntry.createMany({
        data: entries,
        skipDuplicates: true
      });
    }

    console.log(`Seeded ${Math.min(i + chunkSize, bookingsList.length)} / ${bookingsList.length} bookings...`);
  }

  console.log(`🎉 Successfully imported and seeded ${bookingsMap.size} passenger bookings in batches!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
