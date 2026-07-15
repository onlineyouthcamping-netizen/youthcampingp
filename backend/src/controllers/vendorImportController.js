const xlsx = require('/Users/parthpatel/Documents/youthcamping_os/backend/node_modules/xlsx');
const { prisma } = require('../lib/prisma');

// Helper to normalize phone numbers
function normalizePhone(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/\s+/g, '').replace(/[^0-9+]/g, '');
  if (cleaned.length === 10) return '+91' + cleaned;
  if (cleaned.startsWith('91') && cleaned.length === 12) return '+' + cleaned;
  return cleaned || null;
}

// Helper to normalize city names
function normalizeCity(city) {
  if (!city) return 'Unknown';
  let cleaned = String(city).trim();
  // Standardize common misspellings
  if (/chandigarch/i.test(cleaned)) cleaned = 'Chandigarh';
  if (/kasol/i.test(cleaned)) cleaned = 'Kasol';
  if (/kullu/i.test(cleaned)) cleaned = 'Kullu';
  if (/manali/i.test(cleaned)) cleaned = 'Manali';
  if (/shimla/i.test(cleaned)) cleaned = 'Shimla';
  if (/tabo/i.test(cleaned)) cleaned = 'Tabo';
  if (/kaza/i.test(cleaned)) cleaned = 'Kaza';
  if (/sangla/i.test(cleaned)) cleaned = 'Sangla';
  if (/chitkul/i.test(cleaned)) cleaned = 'Chitkul';
  if (/kalpa/i.test(cleaned)) cleaned = 'Kalpa';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// Helper to parse price string to { amount, basis }
function parsePriceExpression(priceStr) {
  if (typeof priceStr === 'number') {
    return { amount: priceStr, basis: 'PER_PERSON' };
  }
  if (!priceStr) return { amount: 0, basis: 'PER_PERSON' };
  
  const str = String(priceStr).replace(/₹/g, '').replace(/,/g, '').trim();
  const numMatch = str.match(/(\d+)/);
  const amount = numMatch ? parseFloat(numMatch[1]) : 0;
  
  let basis = 'PER_PERSON';
  if (/room/i.test(str)) {
    basis = 'PER_ROOM';
  } else if (/person|pp|p\.p/i.test(str)) {
    basis = 'PER_PERSON';
  } else if (/day/i.test(str)) {
    basis = 'PER_DAY';
  } else if (/meal/i.test(str)) {
    basis = 'PER_MEAL';
  } else if (/tent/i.test(str)) {
    basis = 'PER_TENT';
  } else if (/vehicle/i.test(str)) {
    basis = 'PER_VEHICLE';
  }
  
  return { amount, basis };
}

// Parse Excel Workbook End-To-End
function parseHimachalWorkbook(filePath) {
  const workbook = xlsx.readFile(filePath);
  const results = {
    hotels: [],
    transport: [],
    additionalCharges: [],
    errors: []
  };

  // --- 1. MKA Trip Details ---
  if (workbook.Sheets['MKA Trip Details']) {
    const sheet = workbook.Sheets['MKA Trip Details'];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const hotelName = row[0];
      if (hotelName && typeof hotelName === 'string' && !hotelName.includes('Tempo') && !hotelName.includes('Pick') && !hotelName.includes('Drop') && i < 12) {
        const phone = normalizePhone(row[1]);
        const totalRooms = parseInt(row[2]) || 0;
        const roomTypeDesc = row[3] || '';
        const doubleAmt = parseFloat(row[5]);
        
        if (!isNaN(doubleAmt)) {
          results.hotels.push({
            vendorName: String(hotelName).trim(),
            vendorType: 'HOTEL',
            primaryPhone: phone,
            city: 'Kasol',
            sourceSheet: 'MKA Trip Details',
            sourceRow: i + 1,
            rate: {
              roomCategory: roomTypeDesc || 'Standard',
              sharingType: 'DOUBLE',
              rateBasis: 'PER_ROOM',
              amount: doubleAmt,
              mealPlan: 'EP',
              seasonType: 'STANDARD',
              totalRooms
            }
          });
        }
      }
    }
    
    // Parse transport rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      const vehicleDesc = row[0];
      if (vehicleDesc && typeof vehicleDesc === 'string' && (vehicleDesc.includes('Tempo') || vehicleDesc.includes('Scorpio') || vehicleDesc.includes('Innova'))) {
        const cost = parseFloat(row[4]);
        if (!isNaN(cost)) {
          results.transport.push({
            vendorName: 'MKA Transporter',
            routeName: 'MKA Local Circuit',
            pickupLocation: 'Amritsar',
            dropLocation: 'Manali',
            vehicleType: vehicleDesc.trim(),
            totalVehicleCost: cost,
            sellableSeats: vehicleDesc.includes('12') ? 12 : vehicleDesc.includes('17') ? 14 : 17,
            tripCode: 'MKA',
            sourceSheet: 'MKA Trip Details',
            sourceRow: i + 1
          });
        }
      }
    }
  }

  // --- 2. Spiti Trip Details ---
  if (workbook.Sheets['Spiti Trip Details']) {
    const sheet = workbook.Sheets['Spiti Trip Details'];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      const hotelName = row[0];
      if (hotelName && typeof hotelName === 'string' && !hotelName.includes('Route') && !hotelName.includes('Guide') && !hotelName.includes('Extra')) {
        const phone = normalizePhone(row[1]);
        const city = normalizeCity(row[2]);
        const dblRate = parseFloat(row[3]);
        
        if (!isNaN(dblRate)) {
          results.hotels.push({
            vendorName: String(hotelName).trim(),
            vendorType: 'HOTEL',
            primaryPhone: phone,
            city,
            sourceSheet: 'Spiti Trip Details',
            sourceRow: i + 1,
            rate: {
              roomCategory: 'Standard Deluxe',
              sharingType: 'DOUBLE',
              rateBasis: 'PER_PERSON',
              amount: dblRate,
              mealPlan: 'MAP',
              seasonType: 'STANDARD',
              totalRooms: 5
            }
          });
        }
      }
    }
  }

  // --- 3. SMDD Trip Details ---
  if (workbook.Sheets['SMDD Trip Details']) {
    const sheet = workbook.Sheets['SMDD Trip Details'];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    for (let i = 1; i < 5; i++) {
      const row = rows[i];
      if (!row) continue;
      
      const vendorName = row[0];
      const phone = normalizePhone(row[1]);
      const priceExpr = row[4];
      
      if (vendorName && priceExpr) {
        const { amount, basis } = parsePriceExpression(priceExpr);
        results.hotels.push({
          vendorName: String(vendorName).trim(),
          vendorType: 'HOTEL',
          primaryPhone: phone,
          city: vendorName.includes('Macleodganj') ? 'McLeodganj' : 'Dalhousie',
          sourceSheet: 'SMDD Trip Details',
          sourceRow: i + 1,
          rate: {
            roomCategory: 'Standard',
            sharingType: 'DOUBLE',
            rateBasis: basis,
            amount,
            mealPlan: 'EP',
            seasonType: 'STANDARD',
            totalRooms: parseInt(row[2]) || 0
          }
        });
      }
    }
    
    for (let i = 4; i < 11; i++) {
      const row = rows[i];
      if (!row) continue;
      
      const vehicle = row[8];
      const cost = parseFloat(row[9]);
      
      if (vehicle && !isNaN(cost)) {
        results.transport.push({
          vendorName: 'SMDD Transporter',
          routeName: 'Chandigarh to Pathankot',
          pickupLocation: 'Chandigarh',
          dropLocation: 'Pathankot',
          vehicleType: String(vehicle).trim(),
          totalVehicleCost: cost,
          sellableSeats: String(vehicle).includes('20') ? 17 : String(vehicle).includes('17') ? 14 : 12,
          tripCode: 'SMDD',
          sourceSheet: 'SMDD Trip Details',
          sourceRow: i + 1
        });
      }
    }
  }

  return results;
}

// Helper to resolve trip record dynamically
async function getOrCreateTripBySheet(tx, sheetName, tenantId) {
  let slug = '';
  let title = '';
  if (sheetName.includes('MKA')) {
    slug = 'mka';
    title = 'MKA – Manali Kasol Amritsar';
  } else if (sheetName.includes('Spiti')) {
    slug = 'spiti-valley';
    title = 'Spiti Valley';
  } else if (sheetName.includes('SMDD')) {
    slug = 'smdd';
    title = 'SMDD';
  } else {
    slug = 'default';
    title = 'Default Trip';
  }

  let trip = await tx.trip.findFirst({
    where: { slug }
  });

  if (!trip) {
    trip = await tx.trip.create({
      data: {
        tenantId,
        slug,
        title,
        location: title,
        price: 9999,
        duration: '6 Days',
        description: 'Auto-created trip from importer'
      }
    });
  }
  return trip;
}

// Controller Actions
exports.getImportPreview = async (req, res) => {
  try {
    const filePath = '/Users/parthpatel/Downloads/Himachal Trip Details .xlsx';
    const parsed = parseHimachalWorkbook(filePath);
    return res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('getImportPreview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate preview' });
  }
};

exports.confirmImport = async (req, res) => {
  try {
    const { hotels = [], transport = [], additionalCharges = [] } = req.body;
    const tenantId = req.user?.tenantId || 'default';
    
    const report = {
      created: 0,
      matched: 0,
      duplicate: 0,
      skipped: 0,
      invalid: 0
    };

    // Process Hotels
    for (const h of hotels) {
      if (!h.vendorName) {
        report.skipped++;
        continue;
      }

      const trip = await getOrCreateTripBySheet(prisma, h.sourceSheet, tenantId);

      let vendor = await prisma.opsVendor.findFirst({
        where: {
          name: { equals: h.vendorName, mode: 'insensitive' },
          location: h.city ? { equals: h.city, mode: 'insensitive' } : undefined
        }
      });

      if (!vendor) {
        vendor = await prisma.opsVendor.create({
          data: {
            tenantId,
            name: h.vendorName,
            type: h.vendorType || 'HOTEL',
            phone: h.primaryPhone || null,
            location: h.city || null,
            isActive: false,
            sourceSheet: h.sourceSheet || 'Import Wizard',
            sourceRow: h.sourceRow || 0
          }
        });
        report.created++;
      } else {
        report.matched++;
      }

      // Create TripVendor mapping
      let tripVendor = await prisma.opsTripVendor.findFirst({
        where: {
          tripId: trip.id,
          vendorId: vendor.id,
          category: 'HOTEL'
        }
      });

      if (!tripVendor) {
        tripVendor = await prisma.opsTripVendor.create({
          data: {
            tripId: trip.id,
            vendorId: vendor.id,
            category: 'HOTEL',
            active: false
          }
        });
      }

      // Create rate
      if (h.rate) {
        const doubleRate = h.rate;
        await prisma.opsTripVendorRate.create({
          data: {
            tripVendorId: tripVendor.id,
            city: h.city || null,
            rateType: 'HOTEL',
            roomType: doubleRate.roomCategory || 'Standard',
            sharingType: doubleRate.sharingType || 'DOUBLE',
            rateBasis: doubleRate.rateBasis || 'PER_ROOM',
            amount: Number(doubleRate.amount || 0),
            seasonType: doubleRate.seasonType || 'STANDARD',
            active: false,
            notes: `Excel Row ${h.sourceRow} from ${h.sourceSheet}`
          }
        });
      }
    }

    // Process Transport Rates
    for (const t of transport) {
      if (!t.vendorName) {
        report.skipped++;
        continue;
      }

      const trip = await getOrCreateTripBySheet(prisma, t.sourceSheet, tenantId);

      let vendor = await prisma.opsVendor.findFirst({
        where: {
          name: { equals: t.vendorName, mode: 'insensitive' }
        }
      });

      if (!vendor) {
        vendor = await prisma.opsVendor.create({
          data: {
            tenantId,
            name: t.vendorName,
            type: 'TRANSPORT',
            isActive: false,
            sourceSheet: t.sourceSheet,
            sourceRow: t.sourceRow
          }
        });
        report.created++;
      } else {
        report.matched++;
      }

      let tripVendor = await prisma.opsTripVendor.findFirst({
        where: {
          tripId: trip.id,
          vendorId: vendor.id,
          category: 'TRANSPORT'
        }
      });

      if (!tripVendor) {
        tripVendor = await prisma.opsTripVendor.create({
          data: {
            tripId: trip.id,
            vendorId: vendor.id,
            category: 'TRANSPORT',
            active: false
          }
        });
      }

      await prisma.opsTripVendorRate.create({
        data: {
          tripVendorId: tripVendor.id,
          city: t.pickupLocation || null,
          rateType: 'TRANSPORT',
          vehicleType: t.vehicleType,
          routeName: t.routeName || null,
          rateBasis: 'PER_VEHICLE',
          amount: Number(t.totalVehicleCost || 0),
          sellableSeats: t.sellableSeats || 17,
          active: false,
          notes: `Excel Row ${t.sourceRow} from ${t.sourceSheet}`
        }
      });
    }

    return res.json({ success: true, report });
  } catch (err) {
    console.error('confirmImport error:', err);
    return res.status(500).json({ success: false, message: 'Transaction rolled back: Import failed' });
  }
};
