const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
// Use the API key added to .env
apiKey.apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();


const BRAND_COLOR = '#1e293b';
const ACCENT_COLOR = '#3b82f6';
const LOGO_URL = 'https://youthcamping.com/logo.png'; // Update with real logo URL

const getPublicSiteBaseUrl = () => {
  const envUrl = process.env.PUBLIC_SITE_URL || process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    let url = envUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url.replace(/\/+$/, '');
  }
  return 'https://youthcamping.in';
};

const getBaseTemplate = (content, previewText) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YouthCamping</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
    .header { background-color: ${BRAND_COLOR}; padding: 40px 30px; text-align: center; color: #ffffff; }
    .logo { font-size: 26px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; }
    .content { padding: 40px; line-height: 1.6; color: #334155; }
    .footer { background-color: #f8fafc; padding: 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
    .button { display: inline-block; padding: 14px 30px; background-color: ${ACCENT_COLOR}; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 25px; }
    .highlight-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; margin: 25px 0; }
    .label { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; letter-spacing: 1px; }
    .value { font-size: 14px; font-weight: 700; color: #1e293b; }
    h1 { font-size: 24px; font-weight: 900; color: #0f172a; margin-top: 0; letter-spacing: -0.5px; }
    .preview-text { display: none; font-size: 0; color: transparent; height: 0; width: 0; }
    .tag { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 900; text-transform: uppercase; background: #f1f5f9; color: #64748b; margin-bottom: 15px; }
    .divider { height: 1px; background: #e2e8f0; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="preview-text">${previewText}</div>
  <div class="container">
    <div class="header">
      <img src="${LOGO_URL}" alt="YouthCamping" style="height: 50px; width: auto; display: block; margin: 0 auto;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
      <div class="logo" style="display: none;">YOUTHCAMPING.</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p style="font-weight: 900; color: #64748b; margin-bottom: 10px;">YOUTHCAMPING EXPERIENCES</p>
      <p>&copy; ${new Date().getFullYear()} YouthCamping. All rights reserved.</p>
      <p style="margin-top: 10px; margin-bottom: 10px; font-size: 12px;">
        <a href="${getPublicSiteBaseUrl()}/terms-and-conditions" style="color: #475569; text-decoration: underline; font-weight: 600;" target="_blank">Terms &amp; Conditions</a>
        <span style="margin: 0 6px; color: #cbd5e1;">|</span>
        <a href="${getPublicSiteBaseUrl()}/cancellation-policy" style="color: #475569; text-decoration: underline; font-weight: 600;" target="_blank">Cancellation Policy</a>
      </p>
      <p>Address: Delhi, India | Support: info@youthcamping.com</p>
    </div>
  </div>
</body>
</html>
`;

const sendEmail = async ({ to, subject, html, type, bookingId, prisma, attachments }) => {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.sender = { "name": "Youth Camping", "email": process.env.EMAIL_FROM || "parthyouthcamping@gmail.com" };
    sendSmtpEmail.to = [{ "email": to }];
    
    if (attachments && attachments.length > 0) {
      sendSmtpEmail.attachment = attachments; // Array of { content: 'base64', name: 'file.pdf' }
    }

    // Internal BCC: send a hidden copy to company email(s) if configured
    const bccEnv = (process.env.INTERNAL_EMAIL_BCC || '').trim();
    if (bccEnv) {
      const bccAddresses = bccEnv
        .split(',')
        .map(e => e.trim())
        .filter(e => e && e.includes('@'));
      if (bccAddresses.length > 0) {
        sendSmtpEmail.bcc = bccAddresses.map(email => ({ email }));
      }
    }

    const info = await emailApi.sendTransacEmail(sendSmtpEmail);


    if (prisma && bookingId) {
      await prisma.bookingEmailLog.create({
        data: {
          bookingId,
          type,
          recipient: to,
          subject,
          status: 'success',
          metadata: { messageId: info.messageId, hasAttachment: !!attachments },
        },
      });
    }

    return info;
  } catch (error) {
    console.error('❌ SMTP ERROR:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    if (prisma && bookingId) {
      await prisma.bookingEmailLog.create({
        data: {
          bookingId,
          type,
          recipient: to,
          subject,
          status: 'failed',
          error: error.message,
        },
      });
    }
    throw error;
  }
};

const templates = {
  confirmation: (booking, includeTicket = false) => {
    const trip = booking.tripRef || {};
    const departureDate = booking.departureDate 
      ? new Date(booking.departureDate)
      : null;
      
    // Format calendar dates
    let dayOfWeek = 'TBD';
    let dayOfMonth = '--';
    let monthName = 'TBD';
    let year = '----';

    if (departureDate) {
      dayOfWeek = departureDate.toLocaleDateString('en-US', { weekday: 'short' });
      dayOfMonth = departureDate.toLocaleDateString('en-US', { day: '2-digit' });
      monthName = departureDate.toLocaleDateString('en-US', { month: 'short' });
      year = departureDate.getFullYear().toString();
    }

    // Pricing Calculations
    const meta = booking.sourceMeta || {};
    const storedItems = meta.bookingItems || [];

    const passengersObj = (booking.passengers && typeof booking.passengers === 'object')
      ? booking.passengers
      : (booking.passengers && typeof booking.passengers === 'string' ? JSON.parse(booking.passengers) : {});
    const details = passengersObj.details || {};
    const trainClass = booking.trainClass || details.trainClass || '';
    const roomType = booking.roomType || details.roomType || '';

    let basePrice = 0;
    let gstDiscount = 0;
    let priceRowsHtml = '';

    const activeItems = storedItems.filter((item) => item.qty > 0 || item.rate < 0);
    const baseItems = activeItems.filter((item) => !(item.name.toLowerCase().includes("discount") || item.rate < 0));
    const discountItems = activeItems.filter((item) => item.name.toLowerCase().includes("discount") || item.rate < 0);

    basePrice = baseItems.reduce((acc, item) => acc + (item.rate * item.qty), 0);
    gstDiscount = discountItems.reduce((acc, item) => acc + Math.abs(item.rate * item.qty), 0);

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
        priceRowsHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
            <td style="padding: 12px 10px; color: #334155; text-align: left; vertical-align: top;">
              <div style="font-weight: 700;">${desc}</div>
            </td>
            <td style="padding: 12px 10px; color: #64748b; text-align: center; vertical-align: top;">
              ${item.qty} &times; ${Number(item.rate).toLocaleString('en-IN')}
            </td>
            <td style="padding: 12px 10px; color: #334155; font-weight: 700; text-align: right; vertical-align: top; white-space: nowrap;">
              ₹ ${Number(item.rate * item.qty).toLocaleString('en-IN')}
            </td>
          </tr>
        `;
      });
    } else {
      // Fallback
      priceRowsHtml += `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
          <td style="padding: 12px 10px; color: #334155; text-align: left; vertical-align: top; font-weight: 700;">
            Package Cost
          </td>
          <td style="padding: 12px 10px; color: #64748b; text-align: center; vertical-align: top;">
            1
          </td>
          <td style="padding: 12px 10px; color: #334155; font-weight: 700; text-align: right; vertical-align: top; white-space: nowrap;">
            ₹ ${Number(booking.baseAmount || booking.totalAmount).toLocaleString('en-IN')}
          </td>
        </tr>
      `;
      basePrice = booking.baseAmount || booking.totalAmount;
    }

    if (gstDiscount > 0) {
      priceRowsHtml += `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
          <td style="padding: 12px 10px; color: #dc2626; text-align: left; font-weight: 700;" colspan="2">
            GST DISCOUNT
          </td>
          <td style="padding: 12px 10px; color: #dc2626; font-weight: 700; text-align: right; white-space: nowrap;">
            - ₹ ${Number(gstDiscount).toLocaleString('en-IN')}
          </td>
        </tr>
      `;
    }

    // Use the full-package GST from the DB (now correctly stored as 5% of full package base).
    // Fallback: compute GST on the full base price if gstAmount is not stored.
    const gstRate = (booking.baseAmount && booking.gstAmount) ? Math.round((booking.gstAmount / booking.baseAmount) * 100) / 100 : 0.05;
    const calculatedGst = (booking.gstAmount !== null && booking.gstAmount !== undefined && booking.gstAmount > 0)
      ? booking.gstAmount
      : Math.round((basePrice - gstDiscount) * gstRate);

    const totalWithGst = (booking.totalAmount !== null && booking.totalAmount !== undefined && booking.totalAmount > 0)
      ? booking.totalAmount
      : (basePrice - gstDiscount + calculatedGst);

    const remainingBalance = (booking.remainingAmount !== null && booking.remainingAmount !== undefined)
      ? booking.remainingAmount
      : Math.max(0, totalWithGst - Number(booking.advancePaid));

    const calculatedGstFormatted = Number(calculatedGst).toLocaleString('en-IN', {
      minimumFractionDigits: calculatedGst % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    });
    const totalWithGstFormatted = Number(totalWithGst).toLocaleString('en-IN', {
      minimumFractionDigits: totalWithGst % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    });
    const remainingBalanceFormatted = Number(remainingBalance).toLocaleString('en-IN', {
      minimumFractionDigits: remainingBalance % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    });

    const gstPct = Math.round(gstRate * 100);
    priceRowsHtml += `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
        <td style="padding: 12px 10px; color: #334155; text-align: left; font-weight: 700;" colspan="2">
          GST (Reg no. 24CRFPP3172G1ZT) @ ${gstPct}%
        </td>
        <td style="padding: 12px 10px; color: #334155; font-weight: 700; text-align: right; white-space: nowrap;">
          ₹ ${calculatedGstFormatted}
        </td>
      </tr>
      <tr style="background-color: #f1f5f9; font-size: 14px;">
        <td style="padding: 12px 10px; color: #0f172a; text-align: left; font-weight: 900;" colspan="2">
          Total
        </td>
        <td style="padding: 12px 10px; color: #0f172a; font-weight: 900; text-align: right; white-space: nowrap;">
          ₹ ${totalWithGstFormatted}
        </td>
      </tr>
    `;
    // Passengers list HTML
    let passengerRowsHtml = '';
    let passengersList = [];
    try {
      if (booking.passengers) {
        const parsed = typeof booking.passengers === 'string' ? JSON.parse(booking.passengers) : booking.passengers;
        if (Array.isArray(parsed)) {
          passengersList = parsed;
        } else if (parsed && typeof parsed === 'object') {
          passengersList = parsed.persons || parsed.passengers || [];
        }
      }
    } catch (e) {
      passengersList = [];
    }
    if (!Array.isArray(passengersList)) {
      passengersList = [];
    }

    if (passengersList.length > 0) {
      passengersList.forEach(p => {
        passengerRowsHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
            <td style="padding: 12px 10px; color: #334155; text-align: left; font-weight: 700;">
              ${p.name || '—'}
            </td>
            <td style="padding: 12px 10px; color: #64748b; text-align: center;">
              ${p.age || '—'}
            </td>
            <td style="padding: 12px 10px; color: #334155; font-weight: 700; text-align: right;">
              ${p.gender || '—'}
            </td>
          </tr>
        `;
      });
    } else {
      passengerRowsHtml += `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
          <td style="padding: 12px 10px; color: #334155; text-align: left; font-weight: 700;">
            ${booking.fullName || booking.name || '—'}
          </td>
          <td style="padding: 12px 10px; color: #64748b; text-align: center;">
            ${booking.age || '—'}
          </td>
          <td style="padding: 12px 10px; color: #334155; font-weight: 700; text-align: right;">
            ${booking.gender || '—'}
          </td>
        </tr>
      `;
    }

    const logoUrl = 'https://youthcamping.online/logo.png';
    const heroImage = trip.heroImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb';

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #cccccc; margin: 0; padding: 20px 0;">
  <div style="max-width: 650px; margin: 0 auto; background-color: #f5f5f5; border: 1px solid #d1d5db; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
    
    <!-- Top Header -->
    <table style="width: 100%; background-color: #cccccc; padding: 15px 20px; border-bottom: 1px solid #b8b8b8; border-collapse: collapse;">
      <tr>
        <td style="vertical-align: middle;">
          <img src="${logoUrl}" alt="YouthCamping" style="height: 35px; width: auto; display: block;" />
        </td>
        <td style="text-align: right; vertical-align: middle; font-size: 11px; color: #ffffff; font-weight: 700; width: 60%; line-height: 1.4;">
          Your booking for ${trip.title || booking.tripName} | Booking Id: ${booking.bookingId} has been confirmed.
        </td>
      </tr>
    </table>

    <!-- Hero Image -->
    <div style="width: 100%; height: auto; overflow: hidden;">
      <img src="${heroImage}" alt="Trip Cover" style="width: 100%; height: auto; display: block;" />
    </div>

    <!-- Main Body Area -->
    <div style="padding: 25px;">
      
      <!-- Two Column Section -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <tr>
          <!-- Left Column -->
          <td style="width: 65%; vertical-align: top; padding-right: 20px;">
            <h1 style="font-size: 26px; font-weight: 900; color: #475569; margin: 0 0 10px 0;">Booking Confirmation</h1>
            <div style="font-size: 16px; margin-bottom: 8px;">
              <a href="https://youthcamping.online/trips/${trip.slug || ''}" style="color: #3b82f6; text-decoration: underline; font-weight: 700;">${trip.title || booking.tripName}</a>
            </div>
            <div style="font-size: 13px; color: #64748b; margin-bottom: 25px;">
              <img src="https://cdn-icons-png.flaticon.com/16/684/684908.png" style="width: 12px; height: 12px; vertical-align: middle; margin-right: 4px;" />
              ${booking.pickupCity || trip.location || 'Gujarat, India'}
            </div>

            <p style="font-size: 13px; margin: 0 0 15px 0; color: #1e293b;">Dear <strong>${booking.fullName || booking.name}</strong>,</p>
            <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0;">
              Thank you for booking with <strong>YouthCamping</strong>. It is our pleasure to confirm your booking. Your Booking Id is <strong>${booking.bookingId}</strong>, please use this ID for further references or communication. The booking details are given below:
            </p>
          </td>

          <!-- Right Column (Sidebar Calendar & Info) -->
          <td style="width: 35%; vertical-align: top; min-width: 130px;">
            <!-- Calendar Block -->
            <div style="width: 110px; margin: 0 0 20px auto; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); background-color: #ffffff;">
              <div style="background-color: #dc2626; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                ${dayOfWeek}
              </div>
              <div style="padding: 12px 0;">
                <div style="font-size: 26px; font-weight: 800; color: #1e293b; line-height: 1;">
                  ${dayOfMonth}
                </div>
                <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-top: 2px; text-transform: uppercase;">
                  ${monthName}
                </div>
              </div>
              <div style="background-color: #dc2626; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 0;">
                ${year}
              </div>
            </div>

            <!-- Sidebar Text Info -->
            <div style="text-align: left; font-size: 11px; padding-left: 10px; line-height: 1.5;">
              <div style="font-weight: 800; color: #64748b; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px;">Trip</div>
              <div style="font-weight: 700; color: #1e293b; margin-bottom: 12px;">${trip.title || booking.tripName}</div>
              
              <div style="font-weight: 800; color: #64748b; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px;">Contact Information</div>
              <div style="font-weight: 700; color: #1e293b;">${booking.fullName || booking.name}</div>
              <div style="margin-top: 1px;"><a href="mailto:${booking.email}" style="color: #3b82f6; text-decoration: underline;">${booking.email}</a></div>
              <div style="margin-top: 1px; color: #1e293b;">+91${booking.mobile || booking.phone}</div>

              <div style="font-weight: 800; color: #64748b; margin-top: 12px; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px;">Ticket Status</div>
              <div style="font-weight: 700; color: #2b9b91; text-transform: uppercase;">
                ${includeTicket ? (booking.trainTicketStatus || (booking.passengers?.details?.ticketStatus) || 'CONFIRMED') : 'SELF BOOKED'}
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Passenger Details Table -->
      <div style="margin-bottom: 35px;">
        <div style="font-size: 15px; font-weight: 800; color: #1e293b; margin-bottom: 10px;">
          <img src="https://cdn-icons-png.flaticon.com/24/1077/1077114.png" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 6px;" />
          <span style="vertical-align: middle; text-transform: uppercase;">Passenger Details :</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; background-color: #ffffff;">
          <thead>
            <tr style="background-color: #2b9b91; color: #ffffff; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
              <th style="padding: 10px; text-align: left; font-weight: 800; width: 50%;">Name</th>
              <th style="padding: 10px; text-align: center; font-weight: 800; width: 25%;">Age</th>
              <th style="padding: 10px; text-align: right; font-weight: 800; width: 25%;">Gender</th>
            </tr>
          </thead>
          <tbody>
            ${passengerRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Pricing Details Table -->
      <div style="margin-bottom: 35px;">
        <div style="font-size: 15px; font-weight: 800; color: #1e293b; margin-bottom: 10px;">
          <img src="https://cdn-icons-png.flaticon.com/24/495/495591.png" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 6px;" />
          <span style="vertical-align: middle; text-transform: uppercase;">Pricing Details :</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; background-color: #ffffff;">
          <thead>
            <tr style="background-color: #2b9b91; color: #ffffff; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
              <th style="padding: 10px; text-align: left; font-weight: 800; width: 50%;">Description</th>
              <th style="padding: 10px; text-align: center; font-weight: 800; width: 25%;">Qty / Rate</th>
              <th style="padding: 10px; text-align: right; font-weight: 800; width: 25%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${priceRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Payment Details Table -->
      <div style="margin-bottom: 25px;">
        <div style="font-size: 15px; font-weight: 800; color: #1e293b; margin-bottom: 10px;">
          <img src="https://cdn-icons-png.flaticon.com/24/2984/2984920.png" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 6px;" />
          <span style="vertical-align: middle; text-transform: uppercase;">Payment Details :</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; background-color: #ffffff; margin-bottom: 15px;">
          <thead>
            <tr style="background-color: #2b9b91; color: #ffffff; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
              <th style="padding: 10px; text-align: left; font-weight: 800; width: 75%;">Description</th>
              <th style="padding: 10px; text-align: right; font-weight: 800; width: 25%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
              <td style="padding: 12px 10px; color: #334155; text-align: left; font-weight: 700;">
                ${(booking.paymentMode || '').toLowerCase().trim() === 'cash' || (booking.paymentMode || '').toLowerCase().trim() === 'chash'
                  ? 'CASH PAYMENT MADE BY CASH'
                  : `Payment made by ${booking.paymentMode || 'Unknown'}`}
              </td>
              <td style="padding: 12px 10px; color: #334155; font-weight: 700; text-align: right; white-space: nowrap;">
                ₹ ${Number(booking.advancePaid).toLocaleString('en-IN')}
              </td>
            </tr>
            <tr style="background-color: #f1f5f9; font-size: 14px;">
              <td style="padding: 12px 10px; color: #0f172a; text-align: left; font-weight: 900;">
                Total
              </td>
              <td style="padding: 12px 10px; color: #0f172a; font-weight: 900; text-align: right; white-space: nowrap;">
                ₹ ${Number(booking.advancePaid).toLocaleString('en-IN')}
              </td>
            </tr>
            <tr style="background-color: #fffbeb; font-size: 14px; border-top: 1px solid #fcd34d;">
              <td style="padding: 12px 10px; color: #b45309; text-align: left; font-weight: 700;">
                Remaining Balance
              </td>
              <td style="padding: 12px 10px; color: #b45309; font-weight: 700; text-align: right; white-space: nowrap;">
                ₹ ${remainingBalanceFormatted}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Divider -->
      <div style="height: 1px; background-color: #d1d5db; margin: 25px 0;"></div>

      <!-- Footer contact info -->
      <div style="text-align: center; font-size: 11px; color: #3b82f6; font-weight: bold;">
        <a href="mailto:youthcampingmedia@gmail.com" style="color: #3b82f6; text-decoration: none;">youthcampingmedia@gmail.com</a>
        <span style="color: #64748b; margin: 0 10px; font-weight: normal;">|</span>
        Phone: +919924246267
      </div>

    </div>
  </div>
</body>
</html>
    `;

    return {
      subject: `Booking Confirmation – ${trip.title || booking.tripName} | Booking ID: ${booking.bookingId}`,
      html: emailContent
    };
  },

  payment: (booking, amount) => {
    const content = `
      <h1>Payment Received 💳</h1>
      <p>Hi ${booking.fullName},</p>
      <p>We've successfully received your payment of <strong>₹${amount.toLocaleString()}</strong> for your upcoming trip.</p>
      
      <div class="highlight-box">
        <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 20px;">
          <div>
            <div class="label">Transaction Amount</div>
            <div class="value">₹${amount.toLocaleString()}</div>
          </div>
          <div>
            <div class="label">Total Paid</div>
            <div class="value">₹${booking.advancePaid.toLocaleString()}</div>
          </div>
          <div>
            <div class="label">Remaining Balance</div>
            <div class="value" style="color: #dc2626">₹${booking.remainingAmount.toLocaleString()}</div>
          </div>
          <div>
            <div class="label">Payment Status</div>
            <div class="value">${booking.paymentStatus}</div>
          </div>
        </div>
      </div>

      <p>Thank you for keeping your payments on track. It helps us secure the best experiences for you.</p>
    `;
    return {
      subject: `Payment Receipt: ${booking.bookingId} - YouthCamping`,
      html: getBaseTemplate(content, `Payment of ₹${amount} received for booking ${booking.bookingId}`),
    };
  },

  reminder: (booking) => {
    const trip = booking.tripRef || {};
    const content = `
      <h1>Get Ready for Adventure! 🏔️</h1>
      <p>Hi ${booking.fullName},</p>
      <p>Your adventure to <strong>${trip.title || booking.tripName || booking.tripId}</strong> is just around the corner! We wanted to send a quick reminder about your upcoming trip.</p>
      
      <div class="highlight-box">
        <div class="label">Trip Detail</div>
        <div class="value">${trip.title || booking.tripName || booking.tripId}</div>
        <div class="label" style="margin-top: 10px;">Boarding City</div>
        <div class="value">${trip.departureCity || booking.boardingCity || 'To be updated'}</div>
      </div>

      <p>Make sure you have all your essentials ready. Don't forget to check the weather forecast for your destination!</p>
      
      <a href="${process.env.FRONTEND_URL}/packing-list" class="button">View Packing List</a>
    `;
    return {
      subject: `Trip Reminder: Your journey to ${trip.title || booking.tripName || booking.tripId} is coming soon!`,
      html: getBaseTemplate(content, `Are you ready for your trip to ${trip.title || booking.tripName}?`),
    };
  },

  cancellation: (booking) => {
    const trip = booking.tripRef || {};
    const content = `
      <h1>Booking Cancelled</h1>
      <p>Hi ${booking.fullName},</p>
      <p>Your booking for <strong>${trip.title || booking.tripName || booking.tripId}</strong> (ID: ${booking.bookingId}) has been cancelled as requested or due to pending requirements.</p>
      
      <div class="highlight-box">
        <p style="margin: 0; color: #64748b; font-size: 14px;">If this was a mistake, please contact our support team immediately to restore your booking.</p>
      </div>

      <p>We hope to see you on another adventure soon!</p>
    `;
    return {
      subject: `Booking Cancelled: ${booking.bookingId}`,
      html: getBaseTemplate(content, `Your booking ${booking.bookingId} has been cancelled.`),
    };
  },

  invoice: (booking) => {
    const trip = booking.tripRef || {};
    const content = `
      <h1>Your Trip Invoice 📄</h1>
      <p>Hi ${booking.fullName},</p>
      <p>Please find the invoice details for your booking <strong>${booking.bookingId}</strong> below.</p>
      
      <div class="highlight-box">
        <div style="margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
          <div class="label">Trip Name</div>
          <div class="value">${trip.title || booking.tripName || booking.tripId}</div>
        </div>
        <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 20px;">
          <div>
            <div class="label">Total Amount</div>
            <div class="value">₹${booking.totalAmount.toLocaleString()}</div>
          </div>
          <div>
            <div class="label">Advance Paid</div>
            <div class="value">₹${booking.advancePaid.toLocaleString()}</div>
          </div>
          <div>
            <div class="label">Balance Due</div>
            <div class="value" style="color: #dc2626">₹${booking.remainingAmount.toLocaleString()}</div>
          </div>
          <div>
            <div class="label">Payment Status</div>
            <div class="value">${booking.paymentStatus}</div>
          </div>
        </div>
      </div>

      <p>We have attached the official PDF invoice to this email for your records.</p>
      
      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL}/my-bookings" class="button">View My Booking</a>
      </div>
    `;
    return {
      subject: `Invoice for Booking ${booking.bookingId} - YouthCamping`,
      html: getBaseTemplate(content, `Invoice for your trip ${trip.title || booking.tripName}`),
    };
  }
};

module.exports = {
  sendEmail,
  templates
};
