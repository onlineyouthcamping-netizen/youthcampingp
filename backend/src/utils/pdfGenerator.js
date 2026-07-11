const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Generates a professional PDF invoice using PDFKit.
 * Returns a Buffer containing the PDF data.
 */
async function generateInvoicePDF(booking) {
  return new Promise((resolve, reject) => {
    try {
      // Extract transport/room details from passengers JSON if not flat on booking
      const passengersObj = (booking.passengers && typeof booking.passengers === 'string')
        ? JSON.parse(booking.passengers)
        : (booking.passengers || {});
      const details = passengersObj.details || {};
      const trainClass = booking.trainClass || details.trainClass || 'N/A';
      const ticketStatus = booking.ticketStatus || details.ticketStatus || 'N/A';
      const roomType = booking.roomType || details.roomType || 'N/A';

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- Colors & Styling ---
      const brandColor = '#1e293b';
      const secondaryColor = '#64748b';
      const accentColor = '#059669';

      // --- Header: Logo & Invoice Info ---
      // Try to load logo if exists
      const logoPath = path.join(__dirname, '../../../frontend/public/logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 120 });
      } else {
        doc.fillColor(brandColor)
           .fontSize(20)
           .font('Helvetica-Bold')
           .text('YOUTHCAMPING.', 50, 50);
      }

      doc.fillColor(brandColor)
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('INVOICE', 400, 50, { align: 'right' });

      doc.fillColor(secondaryColor)
         .fontSize(10)
         .font('Helvetica')
         .text(`Invoice No: ${booking.bookingId}`, 400, 75, { align: 'right' })
         .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 400, 90, { align: 'right' })
         .text(`Status: ${booking.paymentStatus.toUpperCase()}`, 400, 105, { align: 'right' });

      // Horizontal line
      doc.moveTo(50, 130)
         .lineTo(550, 130)
         .strokeColor('#e2e8f0')
         .lineWidth(1)
         .stroke();

      // --- Info Section: Guest & Travel ---
      doc.fillColor(brandColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('Guest Details', 50, 150)
         .text('Travel Details', 300, 150);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(secondaryColor)
         .text('Full Name:', 50, 170)
         .fillColor(brandColor)
         .font('Helvetica-Bold')
         .text(booking.fullName || booking.name || 'N/A', 120, 170)
         
         .font('Helvetica')
         .fillColor(secondaryColor)
         .text('Mobile:', 50, 185)
         .fillColor(brandColor)
         .text(`+91 ${booking.mobile || booking.phone || 'N/A'}`, 120, 185);

      if (booking.email) {
        doc.font('Helvetica')
           .fillColor(secondaryColor)
           .text('Email:', 50, 200)
           .fillColor(brandColor)
           .text(booking.email, 120, 200);
      }

      // Travel Details Y positions (computed dynamically to allow wrapping)
      let travelY = 170;
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(secondaryColor)
         .text('Trip:', 300, travelY);
      doc.fillColor(brandColor)
         .font('Helvetica-Bold')
         .text(booking.tripName || booking.tripId || 'N/A', 380, travelY, { width: 170 });
         
      // Get position after printing trip name
      travelY = doc.y + 5;

      doc.font('Helvetica')
         .fillColor(secondaryColor)
         .text('Transport:', 300, travelY);
      doc.fillColor(brandColor)
         .text(`${trainClass} (${ticketStatus})`, 380, travelY, { width: 170 });
      
      travelY = doc.y + 5;
         
      doc.font('Helvetica')
         .fillColor(secondaryColor)
         .text('Room:', 300, travelY);
      doc.fillColor(brandColor)
         .text(roomType, 380, travelY, { width: 170 });
      
      travelY = doc.y + 15;

      // Calculate table top dynamically to prevent overlap
      const tableTop = Math.max(220, travelY);

      // --- Table Headers ---
      doc.rect(50, tableTop, 500, 25).fill('#f8fafc');
      doc.fillColor(secondaryColor)
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('DESCRIPTION', 60, tableTop + 8)
         .text('QUANTITY', 350, tableTop + 8)
         .text('AMOUNT', 480, tableTop + 8, { align: 'right' });

      const meta = booking.sourceMeta || {};
      const storedItems = meta.bookingItems || [];

      // Extract active items
      const activeItems = storedItems.filter((item) => item.qty > 0 || item.rate < 0);
      const baseItems = activeItems.filter((item) => !(item.name.toLowerCase().includes("discount") || item.rate < 0));
      const discountItems = activeItems.filter((item) => item.name.toLowerCase().includes("discount") || item.rate < 0);

      let basePrice = 0;
      let gstDiscount = 0;

      basePrice = baseItems.reduce((acc, item) => acc + (item.rate * item.qty), 0);
      gstDiscount = discountItems.reduce((acc, item) => acc + Math.abs(item.rate * item.qty), 0);

      const gstRate = (booking.baseAmount && booking.gstAmount) ? (booking.gstAmount / booking.baseAmount) : 0.05;
      const computedBase = baseItems.length > 0 ? basePrice : (booking.baseAmount || Math.round((booking.totalAmount || 0) / (1 + gstRate)));
      const computedGst = booking.gstAmount !== null && booking.gstAmount !== undefined ? booking.gstAmount : Math.round(computedBase * gstRate);
      const computedTotal = booking.totalAmount || (computedBase + computedGst);

      let currentY = tableTop + 35;

      if (baseItems.length > 0) {
        baseItems.forEach((item, idx) => {
          let desc = item.name;
          if (idx === 0) {
            if (trainClass && trainClass !== 'N/A') {
              desc = trainClass;
            }
            const detailParts = [];
            if (roomType && roomType !== 'N/A') {
              detailParts.push(roomType);
            }
            if (detailParts.length > 0) {
              desc += ` (${detailParts.join(', ')})`;
            }
          }

          doc.fillColor(brandColor)
             .font('Helvetica')
             .fontSize(10)
             .text(desc, 60, currentY, { width: 280 });
          
          const rowBottom = doc.y;

          doc.font('Helvetica')
             .text(`${item.qty} ${idx === 0 ? 'Traveller(s)' : 'Unit(s)'}`, 350, currentY);
          doc.font('Helvetica-Bold')
             .text(`INR ${(item.rate * item.qty).toLocaleString('en-IN')}`, 480, currentY, { align: 'right' });

          currentY = Math.max(rowBottom, currentY + 15) + 15;
        });
      } else {
        // Fallback
        const detailParts = [];
        if (trainClass && trainClass !== 'N/A') detailParts.push(trainClass);
        if (roomType && roomType !== 'N/A') detailParts.push(roomType);
        let desc = `Trip Package - ${booking.tripName || booking.tripId || 'TBD'}`;
        if (detailParts.length > 0) {
          desc += ` (${detailParts.join(', ')})`;
        }

        doc.fillColor(brandColor)
           .font('Helvetica')
           .fontSize(10)
           .text(desc, 60, currentY, { width: 280 });
        
        const rowBottom = doc.y;

        doc.font('Helvetica')
           .text(`${booking.numberOfTravelers || 1} Traveller(s)`, 350, currentY);
        doc.font('Helvetica-Bold')
           .text(`INR ${computedBase.toLocaleString('en-IN')}`, 480, currentY, { align: 'right' });

        currentY = Math.max(rowBottom, currentY + 15) + 15;
      }

      if (discountItems.length > 0) {
        discountItems.forEach((item) => {
          doc.fillColor('#dc2626')
             .font('Helvetica')
             .fontSize(10)
             .text(item.name, 60, currentY, { width: 280 });
          
          const rowBottom = doc.y;

          doc.font('Helvetica')
             .text(`${item.qty}`, 350, currentY);
          doc.font('Helvetica-Bold')
             .text(`- INR ${Math.abs(item.rate * item.qty).toLocaleString('en-IN')}`, 480, currentY, { align: 'right' });

          currentY = Math.max(rowBottom, currentY + 15) + 15;
        });
      }

      const lineY = currentY + 5;
      doc.moveTo(50, lineY)
         .lineTo(550, lineY)
         .strokeColor('#f1f5f9')
         .stroke();

      // --- Totals Section ---
      let totalsY = lineY + 15;

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(secondaryColor)
         .text('Subtotal (excl. GST):', 340, totalsY, { width: 110 })
         .fillColor(brandColor)
         .text(`INR ${computedBase.toLocaleString('en-IN')}`, 450, totalsY, { width: 90, align: 'right' });

      totalsY += 20;

      doc.fillColor(secondaryColor)
         .text('GST @ 5%:', 340, totalsY, { width: 110 })
         .fillColor(brandColor)
         .text(`INR ${computedGst.toLocaleString('en-IN')}`, 450, totalsY, { width: 90, align: 'right' });

      totalsY += 20;

      doc.fillColor(secondaryColor)
         .text('Total (incl. GST):', 340, totalsY, { width: 110 })
         .fillColor(brandColor)
         .font('Helvetica-Bold')
         .text(`INR ${computedTotal.toLocaleString('en-IN')}`, 450, totalsY, { width: 90, align: 'right' });

      totalsY += 20;

      doc.fillColor(secondaryColor)
         .font('Helvetica')
         .text('Advance Paid:', 340, totalsY, { width: 110 })
         .fillColor(accentColor)
         .text(`- INR ${(booking.advancePaid || 0).toLocaleString('en-IN')}`, 450, totalsY, { width: 90, align: 'right' });

      totalsY += 25;

      // Grand Total Box
      doc.rect(340, totalsY, 210, 35).fill(brandColor);
      doc.fillColor('#fff')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('BALANCE DUE', 350, totalsY + 13, { width: 100 })
         .fontSize(12)
         .text(`INR ${(booking.remainingAmount || 0).toLocaleString('en-IN')}`, 450, totalsY + 12, { width: 90, align: 'right' });

      // --- Footer ---
      const pageHeight = doc.page.height;
      doc.fillColor(secondaryColor)
         .fontSize(8)
         .font('Helvetica')
         .text('Thank you for choosing YouthCamping!', 50, pageHeight - 100, { align: 'center', width: 500 })
         .text('This is a computer-generated document and does not require a signature.', 50, pageHeight - 85, { align: 'center', width: 500 })
         .text('Support: support@youthcamping.com | Website: youthcamping.com', 50, pageHeight - 70, { align: 'center', width: 500 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateInvoicePDF
};
