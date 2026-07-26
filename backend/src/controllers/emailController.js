const { prisma } = require('../lib/prisma');
const { sendEmail, templates } = require('../lib/email');

// DEBUG: Confirm SDK API Key is loaded
console.log("⚙️  BREVO API CONFIG LOADED:", {
  apiKeyLoaded: !!process.env.BREVO_API_KEY
});

const sendBookingEmail = async (req, res) => {
  const { bookingId, type, amount, includeTicket, ticketFile, ticketFileName, ticketFiles, trainTicketStatus } = req.body;
  console.log('📡 [Backend] Incoming email request:', { bookingId, type, amount, includeTicket, ticketFileName, fileCount: ticketFiles?.length });

  try {
    if (!bookingId) {
      console.warn('⚠️ [Backend] Missing bookingId in request body');
      return res.status(400).json({ message: 'Missing bookingId in request body' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tripRef: true }
    });

    console.log('🔍 [Backend] Found booking:', booking ? 'Yes' : 'No');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found in database' });
    }

    if (trainTicketStatus) {
      booking.trainTicketStatus = trainTicketStatus;
      await prisma.booking.update({
        where: { id: bookingId },
        data: { trainTicketStatus }
      }).catch(err => console.warn('⚠️ Could not update trainTicketStatus in DB:', err));
    }

    if (!booking.email) {
      console.warn('⚠️ [Backend] Booking has no email address:', bookingId);
      return res.status(400).json({ message: 'Booking has no email address' });
    }

    let templateData;
    let attachments = [];

    const cleanBase64 = (str) => {
      if (!str) return '';
      const raw = str.includes(',') ? str.split(',')[1] : str;
      return raw.replace(/[\r\n\s]/g, '');
    };

    // Generate PDF for confirmation and invoice types
    if (type === 'confirmation' || type === 'invoice') {
      try {
        const { generateInvoicePDF } = require('../utils/pdfGenerator');
        const pdfBuffer = await generateInvoicePDF(booking);
        attachments = [{
          content: pdfBuffer.toString('base64').replace(/[\r\n\s]/g, ''),
          name: `Invoice_${booking.bookingId || 'booking'}.pdf`
        }];
        console.log('📄 [Backend] PDF Invoice generated and attached');
      } catch (pdfErr) {
        console.error('❌ [Backend] PDF Generation failed:', pdfErr);
      }
    }

    // Attach multiple ticket files if provided, otherwise fallback to single ticket file
    if (Array.isArray(ticketFiles) && ticketFiles.length > 0) {
      ticketFiles.forEach(file => {
        if (file && file.content && file.name) {
          attachments.push({
            content: cleanBase64(file.content),
            name: file.name
          });
          console.log(`📄 [Backend] Cleaned attachment added: ${file.name}`);
        }
      });
    } else if (ticketFile && ticketFileName) {
      attachments.push({
        content: cleanBase64(ticketFile),
        name: ticketFileName
      });
      console.log(`📄 [Backend] Cleaned manual ticket file attached: ${ticketFileName}`);
    }

    switch (type) {
      case 'confirmation':
        templateData = templates.confirmation(booking, includeTicket);
        break;
      case 'payment':
        templateData = templates.payment(booking, amount || 0);
        break;
      case 'reminder':
        templateData = templates.reminder(booking);
        break;
      case 'cancellation':
        templateData = templates.cancellation(booking);
        break;
      case 'invoice':
        templateData = templates.invoice(booking);
        break;
      default:
        return res.status(400).json({ message: 'Invalid email type' });
    }

    console.log(`Sending email to: ${booking.email} with ${attachments.length} attachments:`);
    attachments.forEach((att, idx) => {
      const approxKB = Math.round((att.content?.length || 0) * 0.75 / 1024);
      console.log(`   [Attachment ${idx + 1}] Name: "${att.name}", Approx Size: ${approxKB} KB`);
    });

    await sendEmail({
      to: booking.email,
      subject: templateData.subject,
      html: templateData.html,
      type,
      bookingId,
      prisma,
      attachments
    });

    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error in sendBookingEmail:', error.response?.body || error.message || error);
    if (req.headers.origin) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    }
    res.status(500).json({
      message: 'Failed to send email: ' + (error.response?.body?.message || error.message || 'Server error')
    });
  }
};

const getEmailLogs = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const logs = await prisma.bookingEmailLog.findMany({
      where: { bookingId },
      orderBy: { sentAt: 'desc' }
    });

    res.json(logs);
  } catch (error) {
    console.error('Error in getEmailLogs:', error);
    res.status(500).json({ message: 'Failed to fetch email logs' });
  }
};

module.exports = {
  sendBookingEmail,
  getEmailLogs
};
