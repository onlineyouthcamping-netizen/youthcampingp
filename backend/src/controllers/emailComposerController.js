const { prisma } = require('../lib/prisma');
const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// Helper to resolve merge tags
function resolveMergeTags(text, data) {
  if (!text) return "";
  return text.replace(/\{\{([a-zA-Z0-9._]+)\}\}/g, (match, tag) => {
    const parts = tag.split('.');
    let current = data;
    for (const part of parts) {
      if (current === null || current === undefined) return "";
      current = current[part];
    }
    return current !== undefined && current !== null ? String(current) : "";
  });
}

// Helper to get calendar parts
function getCalendarDateParts(dateStr) {
  if (!dateStr) return { dayName: "TBD", dateNum: "--", monthName: "TBD" };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { dayName: "TBD", dateNum: "--", monthName: "TBD" };
  
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  
  return {
    dayName: days[d.getDay()],
    dateNum: String(d.getDate()).padStart(2, '0'),
    monthName: months[d.getMonth()]
  };
}

// Branded email wrapper
function wrapInBrandedLayout(htmlContent, subject, contextType = '', contextData = {}) {
  // If it's not a booking, return a clean generic branded wrapper
  if (contextType !== 'booking' || !contextData.booking) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f7f8fa;
      font-family: 'Montserrat', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #172033;
    }
    .wrapper {
      width: 100%;
      background-color: #f7f8fa;
      padding: 24px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      border: 1px solid #eceef1;
      overflow: hidden;
      box-shadow: 0 1px 2px rgba(16,24,40,0.04);
    }
    .header {
      background-color: #0b1220;
      padding: 24px;
      text-align: center;
      border-bottom: 3px solid #ff6b00;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 20px;
      font-weight: 800;
    }
    .content {
      padding: 32px 24px;
      line-height: 1.6;
      font-size: 14px;
    }
    .footer {
      background-color: #fcfcfd;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #eceef1;
      font-size: 11px;
      color: #667085;
    }
    .footer a {
      color: #ff6b00;
      text-decoration: none;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>YouthCamping</h1>
      </div>
      <div class="content">
        ${htmlContent}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} YouthCamping. All rights reserved.</p>
        <p><a href="https://youthcamping.online">Visit Website</a> &bull; <a href="https://admin.youthcamping.online">Admin Portal</a></p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  // Booking details layout
  const booking = contextData.booking || {};
  const trip = contextData.trip || {};
  const recipient = contextData.recipient || {};
  const salesperson = contextData.salesperson || {};
  const train = contextData.train || {};

  const cal = getCalendarDateParts(trip.start_date);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #dbdbdb;
      font-family: 'Montserrat', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #333333;
    }
    .wrapper {
      width: 100%;
      background-color: #dbdbdb;
      padding: 32px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      border: 1px solid #c8c8c8;
    }
    .header-logo {
      background-color: #0b1220;
      padding: 16px;
      text-align: center;
      border-bottom: 3px solid #ff6b00;
    }
    .header-logo span {
      color: #ffffff;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 1px;
    }
    .banner {
      width: 100%;
      height: 200px;
      background-image: url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=650&q=80');
      background-size: cover;
      background-position: center;
    }
    .main-grid {
      padding: 24px;
    }
    .title-row {
      margin-bottom: 24px;
    }
    .title-left {
      float: left;
      width: 75%;
    }
    .title-left h2 {
      margin: 0 0 4px 0;
      color: #0b1220;
      font-size: 22px;
      font-weight: 800;
    }
    .title-left .trip-name {
      color: #ff6b00;
      font-size: 14px;
      font-weight: bold;
      text-decoration: none;
      display: inline-block;
      margin-bottom: 4px;
    }
    .title-left .pickup-city {
      color: #667085;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .title-right {
      float: right;
      width: 60px;
      text-align: center;
      border: 1px solid #eceef1;
      border-radius: 6px;
      overflow: hidden;
      background-color: #ffffff;
    }
    .cal-header {
      background-color: #ff6b00;
      color: #ffffff;
      font-size: 10px;
      font-weight: bold;
      padding: 4px 0;
    }
    .cal-date {
      font-size: 20px;
      font-weight: 800;
      color: #0b1220;
      padding: 4px 0 2px 0;
    }
    .cal-month {
      font-size: 10px;
      font-weight: bold;
      color: #667085;
      padding-bottom: 4px;
    }
    .clear {
      clear: both;
    }
    .greeting-text {
      font-size: 12px;
      line-height: 1.6;
      color: #4a4a4a;
      margin-bottom: 24px;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .details-table th, .details-table td {
      border: 1px solid #eceef1;
      padding: 10px;
      font-size: 11px;
      text-align: left;
    }
    .details-table th {
      background-color: #f7f8fa;
      color: #0b1220;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section-title {
      font-size: 12px;
      font-weight: bold;
      color: #0b1220;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #0b1220;
      padding-bottom: 4px;
    }
    .pricing-table, .payment-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .pricing-table th, .payment-table th {
      background-color: #107c7c;
      color: #ffffff;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      padding: 8px 10px;
      text-align: left;
      border: 1px solid #107c7c;
    }
    .pricing-table td, .payment-table td {
      padding: 8px 10px;
      font-size: 11px;
      border: 1px solid #eceef1;
      color: #333333;
    }
    .text-right {
      text-align: right !important;
    }
    .text-center {
      text-align: center !important;
    }
    .font-bold {
      font-weight: bold;
    }
    .balance-box {
      background-color: #fff5eb;
      border: 1px solid #ffe3cb;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 24px;
      font-size: 12px;
    }
    .balance-box table {
      width: 100%;
    }
    .balance-box td {
      padding: 2px 0;
    }
    .balance-title {
      color: #ff6b00;
      font-weight: bold;
    }
    .balance-amount {
      color: #ff6b00;
      font-size: 14px;
      font-weight: 800;
      text-align: right;
    }
    .footer {
      background-color: #f7f8fa;
      border-top: 1px solid #eceef1;
      padding: 24px;
      text-align: center;
      font-size: 11px;
      color: #667085;
    }
    .footer p {
      margin: 0 0 6px 0;
    }
    .footer a {
      color: #ff6b00;
      text-decoration: none;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header-logo">
        <span>YouthCamping</span>
      </div>
      <div class="banner"></div>
      <div class="main-grid">
        
        <div class="title-row">
          <div class="title-left">
            <h2>Booking Confirmation</h2>
            <div class="trip-name">${trip.name || "Trip Adventure"}</div>
            <div class="pickup-city">${trip.pickup_city ? `${trip.pickup_city} to ${trip.pickup_city}` : "Operation Routes"}</div>
          </div>
          <div class="title-right">
            <div class="cal-header">${cal.dayName}</div>
            <div class="cal-date">${cal.dateNum}</div>
            <div class="cal-month">${cal.monthName}</div>
          </div>
          <div class="clear"></div>
        </div>

        <div class="greeting-text">
          ${htmlContent}
        </div>

        <div class="section-title">Trip Information</div>
        <table class="details-table">
          <tr>
            <th>Trip</th>
            <td>${trip.name || "Adventure Group"}</td>
          </tr>
          <tr>
            <th>Contact Information</th>
            <td>
              Name: ${recipient.full_name || "Traveler"}<br/>
              Email: ${recipient.email || "—"}<br/>
              Phone: ${contextData.booking?.phone || "—"}
            </td>
          </tr>
          <tr>
            <th>Ticket Status</th>
            <td><span style="color: #ff6b00; font-weight: bold; text-transform: uppercase;">${booking.status || "Pending"}</span></td>
          </tr>
        </table>

        <div class="section-title">Pricing Details</div>
        <table class="pricing-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-center" style="width: 100px;">Qty / Rate</th>
              <th class="text-right" style="width: 100px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Trip Registration Package</td>
              <td class="text-center">1 x ₹${(booking.total_amount || 0).toLocaleString()}</td>
              <td class="text-right">₹${(booking.total_amount || 0).toLocaleString()}</td>
            </tr>
            <tr class="font-bold">
              <td colspan="2" style="background-color: #f7f8fa;">Total</td>
              <td class="text-right" style="background-color: #f7f8fa;">₹${(booking.total_amount || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div class="section-title">Payment Details</div>
        <table class="payment-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right" style="width: 120px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Advance / Confirmation Payment (UPI/NetBanking)</td>
              <td class="text-right">₹${(booking.paid_amount || 0).toLocaleString()}</td>
            </tr>
            <tr class="font-bold">
              <td style="background-color: #f7f8fa;">Total Paid</td>
              <td class="text-right" style="background-color: #f7f8fa;">₹${(booking.paid_amount || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div class="balance-box">
          <table>
            <tr>
              <td class="balance-title">Remaining Balance</td>
              <td class="balance-amount">₹${(booking.remaining_balance || 0).toLocaleString()}</td>
            </tr>
          </table>
        </div>

      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} YouthCamping. All rights reserved.</p>
        <p>This is an automated operational notification regarding your travel reservation.</p>
        <p><a href="mailto:onlineyouthcamping@gmail.com">onlineyouthcamping@gmail.com</a> &bull; <a href="https://youthcamping.online">Visit Website</a> &bull; <a href="https://admin.youthcamping.online">Admin Portal</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Fetch context data for merge tags
async function getContextData(contextType, contextId, tenantId) {
  let data = {};
  if (contextType === 'booking') {
    const booking = await prisma.booking.findFirst({
      where: { id: contextId, tenantId },
      include: { tripRef: true, salesAdmin: true }
    });
    if (booking) {
      data = {
        recipient: {
          full_name: booking.fullName,
          first_name: booking.fullName ? booking.fullName.split(' ')[0] : "",
          email: booking.email || ""
        },
        booking: {
          reference: booking.bookingId || booking.id,
          created_at: booking.createdAt ? booking.createdAt.toLocaleDateString() : "",
          status: booking.status,
          total_amount: booking.totalAmount,
          paid_amount: booking.advancePaid,
          remaining_balance: booking.remainingAmount
        },
        trip: {
          name: booking.tripName || booking.tripRef?.tripName || "",
          start_date: booking.departureDate ? booking.departureDate.toLocaleDateString() : "",
          end_date: "",
          duration: booking.tripRef?.duration || "",
          pickup_city: booking.pickupCity || ""
        },
        salesperson: {
          name: booking.salesAdmin?.name || "Support Team",
          phone: ""
        }
      };

      const ticket = await prisma.trainTicket.findFirst({
        where: { bookingId: booking.bookingId }
      });
      if (ticket) {
        data.train = {
          name: ticket.trainName || "",
          number: ticket.trainNumber || "",
          pnr: ticket.pnr || "",
          coach: ticket.coach || "",
          seat: ticket.seatNumber || "",
          boarding_station: ticket.sourceStation || "",
          departure_time: ticket.journeyDate ? ticket.journeyDate.toLocaleDateString() + ' ' + ticket.journeyDate.toLocaleTimeString() : "",
          arrival_station: ticket.destinationStation || "",
          ticket_status: ticket.ticketStatus
        };
      }
    }
  } else if (contextType === 'inquiry') {
    const inquiry = await prisma.inquiry.findFirst({
      where: { id: contextId, tenantId },
      include: { salesAdmin: true }
    });
    if (inquiry) {
      data = {
        recipient: {
          full_name: inquiry.name || "",
          first_name: inquiry.name ? inquiry.name.split(' ')[0] : "",
          email: inquiry.email || ""
        },
        booking: {
          reference: inquiry.id,
          status: inquiry.status
        },
        trip: {
          name: inquiry.tripTitle || "",
          pickup_city: ""
        },
        salesperson: {
          name: inquiry.salesAdmin?.name || "Support Team"
        }
      };
    }
  } else if (contextType === 'ticket') {
    const ticket = await prisma.trainTicket.findFirst({
      where: { id: contextId, tenantId },
      include: {
        booking: {
          include: { tripRef: true, salesAdmin: true }
        }
      }
    });
    if (ticket) {
      data = {
        recipient: {
          full_name: ticket.travelerName || ticket.booking?.fullName || "",
          first_name: ticket.travelerName ? ticket.travelerName.split(' ')[0] : "",
          email: ticket.booking?.email || ""
        },
        booking: {
          reference: ticket.booking?.bookingId || ticket.bookingId,
          created_at: ticket.booking?.createdAt ? ticket.booking.createdAt.toLocaleDateString() : "",
          status: ticket.booking?.status || "",
          total_amount: ticket.booking?.totalAmount || 0,
          paid_amount: ticket.booking?.advancePaid || 0,
          remaining_balance: ticket.booking?.remainingAmount || 0
        },
        trip: {
          name: ticket.booking?.tripName || ticket.booking?.tripRef?.tripName || "",
          start_date: ticket.booking?.departureDate ? ticket.booking.departureDate.toLocaleDateString() : "",
          duration: ticket.booking?.tripRef?.duration || "",
          pickup_city: ticket.booking?.pickupCity || ""
        },
        salesperson: {
          name: ticket.booking?.salesAdmin?.name || "Support Team"
        },
        train: {
          name: ticket.trainName || "",
          number: ticket.trainNumber || "",
          pnr: ticket.pnr || "",
          coach: ticket.coach || "",
          seat: ticket.seatNumber || "",
          boarding_station: ticket.sourceStation || "",
          departure_time: ticket.journeyDate ? ticket.journeyDate.toLocaleDateString() + ' ' + ticket.journeyDate.toLocaleTimeString() : "",
          arrival_station: ticket.destinationStation || "",
          ticket_status: ticket.ticketStatus
        }
      };
    }
  }
  return data;
}

exports.sendCustomEmail = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || 'default';
    const {
      contextType,
      contextId,
      to,
      cc,
      bcc,
      replyTo,
      subject: reqSubject,
      body: reqBody,
      templateId,
      isTest
    } = req.body;

    const testMode = isTest === 'true' || isTest === true;

    if (!contextType || !contextId || !to || !reqSubject || !reqBody) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    // Role-scoping validation
    if (req.user.role === 'sales') {
      if (contextType === 'booking') {
        const check = await prisma.booking.findFirst({ where: { id: contextId, tenantId } });
        if (check && check.salesAdminId !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Forbidden: Scoped ownership violation' });
        }
      } else if (contextType === 'inquiry') {
        const check = await prisma.inquiry.findFirst({ where: { id: contextId, tenantId } });
        if (check && check.salesAdminId !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Forbidden: Scoped ownership violation' });
        }
      }
    }

    // Get context data for tag resolution
    const contextData = await getContextData(contextType, contextId, tenantId);

    // Resolve tags in subject and body
    const finalSubject = resolveMergeTags(reqSubject, contextData);
    const finalBody = resolveMergeTags(reqBody, contextData);

    // Validate size limit (25MB combined)
    let totalSize = 0;
    const files = req.files || [];
    for (const file of files) {
      totalSize += file.size;
    }
    if (totalSize > 25 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'Combined attachments size exceeds 25MB' });
    }

    // Prepare SMTP details
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = finalSubject;
    sendSmtpEmail.htmlContent = wrapInBrandedLayout(finalBody, finalSubject, contextType, contextData);
    sendSmtpEmail.sender = {
      name: "Youth Camping",
      email: process.env.EMAIL_FROM || "parthyouthcamping@gmail.com"
    };

    // To recipient
    sendSmtpEmail.to = [{ email: testMode ? to : to.trim() }];

    // Cc list
    if (cc && !testMode) {
      sendSmtpEmail.cc = cc.split(',').map(e => ({ email: e.trim() })).filter(e => e.email);
    }

    // Bcc list (incorporate company internal BCC env)
    const bccList = [];
    if (bcc && !testMode) {
      bccList.push(...bcc.split(',').map(e => ({ email: e.trim() })).filter(e => e.email));
    }
    const bccEnv = (process.env.INTERNAL_EMAIL_BCC || '').trim();
    if (bccEnv) {
      bccList.push(...bccEnv.split(',').map(e => ({ email: e.trim() })).filter(e => e.email));
    }
    if (bccList.length > 0) {
      sendSmtpEmail.bcc = bccList;
    }

    if (replyTo) {
      sendSmtpEmail.replyTo = { email: replyTo.trim() };
    }

    // Map attachments
    if (files.length > 0) {
      sendSmtpEmail.attachment = files.map(file => ({
        content: file.buffer.toString('base64'),
        name: file.originalname
      }));
    }

    let status = 'SENT';
    let errorMsg = null;

    try {
      await emailApi.sendTransacEmail(sendSmtpEmail);
    } catch (sendErr) {
      console.error("🔥 Brevo SMTP failure:", sendErr);
      status = 'FAILED';
      errorMsg = sendErr.message || String(sendErr);
    }

    // Create EmailLog record
    const logData = {
      tenantId,
      recipient: to,
      ccCount: sendSmtpEmail.cc ? sendSmtpEmail.cc.length : 0,
      bccCount: sendSmtpEmail.bcc ? sendSmtpEmail.bcc.length : 0,
      subject: finalSubject,
      body: finalBody,
      templateId: templateId || null,
      attachments: files.map(f => ({ name: f.originalname, size: f.size })),
      status,
      error: errorMsg,
      isTest: testMode,
      senderId: req.user.id
    };

    if (contextType === 'booking') {
      logData.bookingId = contextId;
    } else if (contextType === 'inquiry') {
      logData.inquiryId = contextId;
    } else if (contextType === 'ticket') {
      logData.trainTicketId = contextId;
    }

    await prisma.emailLog.create({ data: logData });

    if (status === 'FAILED') {
      return res.status(500).json({ success: false, message: `Failed to send email: ${errorMsg}` });
    }

    res.json({ success: true, message: 'Email sent successfully!' });
  } catch (err) {
    next(err);
  }
};

exports.sendBulkEmails = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || 'default';
    const {
      contextType,
      selectedIds,
      subject: reqSubject,
      body: reqBody,
      templateId
    } = req.body;

    if (!contextType || !selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0 || !reqSubject || !reqBody) {
      return res.status(400).json({ success: false, message: 'Missing required parameters for bulk send' });
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    // We process each selected contextId in a loop to ensure personalization and proper tag rendering
    for (const contextId of selectedIds) {
      try {
        let recipientEmail = "";
        
        // Scope & target email resolution
        if (contextType === 'booking') {
          const booking = await prisma.booking.findFirst({
            where: { id: contextId, tenantId }
          });
          if (!booking || (req.user.role === 'sales' && booking.salesAdminId !== req.user.id)) {
            skipped++;
            continue;
          }
          recipientEmail = booking.email;
        } else if (contextType === 'inquiry') {
          const inquiry = await prisma.inquiry.findFirst({
            where: { id: contextId, tenantId }
          });
          if (!inquiry || (req.user.role === 'sales' && inquiry.salesAdminId !== req.user.id)) {
            skipped++;
            continue;
          }
          recipientEmail = inquiry.email;
        }

        if (!recipientEmail || !recipientEmail.includes('@')) {
          skipped++;
          continue;
        }

        const contextData = await getContextData(contextType, contextId, tenantId);
        const finalSubject = resolveMergeTags(reqSubject, contextData);
        const finalBody = resolveMergeTags(reqBody, contextData);

        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = finalSubject;
        sendSmtpEmail.htmlContent = wrapInBrandedLayout(finalBody, finalSubject, contextType, contextData);
        sendSmtpEmail.sender = {
          name: "Youth Camping",
          email: process.env.EMAIL_FROM || "parthyouthcamping@gmail.com"
        };
        sendSmtpEmail.to = [{ email: recipientEmail.trim() }];

        const bccList = [];
        const bccEnv = (process.env.INTERNAL_EMAIL_BCC || '').trim();
        if (bccEnv) {
          bccList.push(...bccEnv.split(',').map(e => ({ email: e.trim() })).filter(e => e.email));
        }
        if (bccList.length > 0) {
          sendSmtpEmail.bcc = bccList;
        }

        let status = 'SENT';
        let errorMsg = null;

        try {
          await emailApi.sendTransacEmail(sendSmtpEmail);
          sent++;
        } catch (sendErr) {
          failed++;
          status = 'FAILED';
          errorMsg = sendErr.message || String(sendErr);
        }

        const logData = {
          tenantId,
          recipient: recipientEmail,
          ccCount: 0,
          bccCount: bccList.length,
          subject: finalSubject,
          body: finalBody,
          templateId: templateId || null,
          attachments: null,
          status,
          error: errorMsg,
          isTest: false,
          senderId: req.user.id
        };

        if (contextType === 'booking') {
          logData.bookingId = contextId;
        } else if (contextType === 'inquiry') {
          logData.inquiryId = contextId;
        }

        await prisma.emailLog.create({ data: logData });

      } catch (loopErr) {
        console.error("🔥 Bulk loop failure for contextId:", contextId, loopErr);
        failed++;
      }
    }

    res.json({
      success: true,
      data: {
        total: selectedIds.length,
        sent,
        failed,
        skipped
      }
    });

  } catch (err) {
    next(err);
  }
};
