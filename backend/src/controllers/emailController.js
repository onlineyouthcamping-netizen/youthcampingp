const { prisma } = require('../lib/prisma');
const { sendEmail, templates } = require('../lib/email');

// DEBUG: Confirm SDK API Key is loaded
console.log("⚙️  BREVO API CONFIG LOADED:", {
  apiKeyLoaded: !!process.env.BREVO_API_KEY
});

const sendBookingEmail = async (req, res) => {
  const { bookingId, type, amount } = req.body;
  console.log('📡 [Backend] Incoming email request:', { bookingId, type, amount });

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

    if (!booking.email) {
      console.warn('⚠️ [Backend] Booking has no email address:', bookingId);
      return res.status(400).json({ message: 'Booking has no email address' });
    }

    let templateData;
    let attachments = [];

    // Generate PDF for confirmation and invoice types
    if (type === 'confirmation' || type === 'invoice') {
      try {
        const { generateInvoicePDF } = require('../utils/pdfGenerator');
        const pdfBuffer = await generateInvoicePDF(booking);
        attachments = [{
          content: pdfBuffer.toString('base64'),
          name: `Invoice_${booking.bookingId}.pdf`
        }];
        console.log('📄 [Backend] PDF Invoice generated and attached');
      } catch (pdfErr) {
        console.error('❌ [Backend] PDF Generation failed:', pdfErr);
      }
    }

    switch (type) {
      case 'confirmation':
        templateData = templates.confirmation(booking);
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

    console.log("Sending email to:", booking.email);

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
    console.error('Error in sendBookingEmail:', error);
    res.status(500).json({ 
      message: 'Failed to send email'
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
