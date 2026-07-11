const { prisma } = require('../lib/prisma');

const defaultTemplates = [
  {
    name: "Booking Confirmation",
    subject: "Booking Confirmed – {{trip.name}} | {{booking.reference}}",
    category: "Booking",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>We are excited to confirm your booking for <strong>{{trip.name}}</strong>. Your Booking Reference is <strong>{{booking.reference}}</strong>.</p><p><strong>Booking Summary:</strong><br/>Trip: {{trip.name}}<br/>Start Date: {{trip.start_date}}<br/>Pickup City: {{trip.pickup_city}}<br/>Paid Amount: ₹{{booking.total_amount}}<br/>Remaining Balance: ₹{{booking.remaining_balance}}</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Booking Pending Confirmation",
    subject: "Your Booking is Under Review – {{trip.name}} | {{booking.reference}}",
    category: "Booking",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>Thank you for submitting your booking for <strong>{{trip.name}}</strong>. Your Booking Reference is <strong>{{booking.reference}}</strong>.</p><p>Your booking is currently under review and will be verified by our team shortly.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Booking Rejected / Cancelled",
    subject: "Booking Update – {{trip.name}} | {{booking.reference}}",
    category: "Refund & Cancellation",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>This is to inform you about a status update regarding your booking <strong>{{booking.reference}}</strong> for <strong>{{trip.name}}</strong>.</p><p>Your booking status has been updated to Cancelled/Rejected. Please contact our support team or your sales representative for detailed information regarding the refund process.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Payment Received",
    subject: "Payment Received – {{trip.name}} | {{booking.reference}}",
    category: "Payment",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>We have successfully received your payment for the trip <strong>{{trip.name}}</strong> (Booking ID: {{booking.reference}}).</p><p><strong>Payment Summary:</strong><br/>Total Amount: ₹{{booking.total_amount}}<br/>Remaining Balance: ₹{{booking.remaining_balance}}</p><p>Thank you for your prompt payment.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Remaining Balance Reminder",
    subject: "Payment Balance Reminder – {{trip.name}} | {{booking.reference}}",
    category: "Payment",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>This is a friendly reminder that you have a pending balance of <strong>₹{{booking.remaining_balance}}</strong> for your upcoming trip <strong>{{trip.name}}</strong> (Booking ID: {{booking.reference}}).</p><p>Kindly clear the balance amount before the payment deadline to ensure a smooth boarding process.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Full Payment Completed",
    subject: "Payment Completed Successfully – {{trip.name}} | {{booking.reference}}",
    category: "Payment",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>We are pleased to inform you that the complete payment of <strong>₹{{booking.total_amount}}</strong> has been received for your booking <strong>{{booking.reference}}</strong>.</p><p>Your booking is now fully paid and confirmed. No further balance is pending.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Train Ticket Details",
    subject: "Your Train Ticket Details – {{trip.name}} | {{booking.reference}}",
    category: "Train Ticket",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>Your train ticket is ready. Please find your reservation details below:</p><p><strong>Train Details:</strong><br/>Train: {{train.name}} ({{train.number}})<br/>PNR Number: {{train.pnr}}<br/>Coach / Seat: {{train.coach}} / {{train.seat}}</p><p>Please carry a printout or e-copy along with a valid ID proof during your travel.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Train Ticket Verification Pending",
    subject: "Train Ticket Verification in Progress – {{trip.name}}",
    category: "Train Ticket",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>Your train ticket assignment is currently in verification. Our ticketing team is reviewing the allocation, and final ticket details will be shared with you shortly.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Train Ticket Approved",
    subject: "Train Ticket Confirmed – {{trip.name}} | {{booking.reference}}",
    category: "Train Ticket",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>Your train ticket details have been verified and approved. Please check your dashboard or attached files for your final ticket.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Train Ticket Changed / Updated",
    subject: "Important Train Ticket Update – {{trip.name}} | {{booking.reference}}",
    category: "Train Ticket",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>There has been a change to your train ticket details for the trip <strong>{{trip.name}}</strong>. Please review your updated details below:</p><p><strong>Updated Train Details:</strong><br/>Train: {{train.name}} ({{train.number}})<br/>PNR Number: {{train.pnr}}<br/>Coach / Seat: {{train.coach}} / {{train.seat}}</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Trip Departure Reminder",
    subject: "Your Trip Starts Soon – {{trip.name}} | Departure: {{trip.start_date}}",
    category: "Departure",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>Your adventure is about to begin! Your trip to <strong>{{trip.name}}</strong> is scheduled to start on <strong>{{trip.start_date}}</strong>.</p><p>Please review our packing checklist and ensure you have all your travel documents ready.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Final Departure Instructions",
    subject: "Final Departure Details – {{trip.name}} | {{trip.start_date}}",
    category: "Departure",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>Here are the final departure details for your trip starting on <strong>{{trip.start_date}}</strong>:</p><p><strong>Reporting Instructions:</strong><br/>Reporting Time: {{trip.reporting_time}}<br/>Meeting Point: {{trip.pickup_city}}</p><p>Please arrive on time. Contact details of your tour coordinator will be sent soon.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "WhatsApp Group Invitation",
    subject: "Join Your Trip WhatsApp Group – {{trip.name}}",
    category: "Departure",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>Please join the official WhatsApp group for your upcoming <strong>{{trip.name}}</strong> trip to get real-time coordination updates and connect with other travelers.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Trip Itinerary / E-Brochure",
    subject: "Trip Itinerary – {{trip.name}}",
    category: "Inquiry",
    body: "<p>Hi <strong>{{recipient.full_name}}</strong>,</p><p>Here is the detailed trip itinerary and brochure for <strong>{{trip.name}}</strong>. It includes day-wise maps, inclusions, exclusions, and travel requirements.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Inquiry Acknowledgement",
    subject: "We Received Your Inquiry – {{trip.name}}",
    category: "Inquiry",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>Thank you for reaching out to us. We have received your inquiry for <strong>{{trip.name}}</strong>. A member of the YouthCamping team will connect with you shortly.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Inquiry Follow-up",
    subject: "Let’s Plan Your {{trip.name}} Adventure",
    category: "Inquiry",
    body: "<p>Hi <strong>{{recipient.full_name}}</strong>,</p><p>Thank you for expressing interest in <strong>{{trip.name}}</strong>. Our salesperson <strong>{{salesperson.name}}</strong> is here to help you configure departure dates, check current availability, and finalize your booking.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Quotation Sent",
    subject: "Your YouthCamping Trip Quotation – {{trip.name}}",
    category: "Quotation",
    body: "<p>Hi <strong>{{recipient.full_name}}</strong>,</p><p>Please find attached the official price quote for <strong>{{trip.name}}</strong> as requested. Let us know if you need any adjustments or package changes.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Quotation Expiry Reminder",
    subject: "Your Trip Quote Expires Soon – {{trip.name}}",
    category: "Quotation",
    body: "<p>Hi <strong>{{recipient.full_name}}</strong>,</p><p>This is a quick heads-up that your quotation for <strong>{{trip.name}}</strong> is expiring soon. To lock in the prices and confirm your booking slots, please complete the setup before the expiry date.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Document Request",
    subject: "Action Required: Documents Needed for {{trip.name}}",
    category: "Documents",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>To complete your travel verification, please upload your Government ID proofs, train booking screenshots, or document proofs as requested by your coordinator.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Room Allocation Confirmation",
    subject: "Your Room Allocation Details – {{trip.name}}",
    category: "Accommodation",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>Your room arrangements for <strong>{{trip.name}}</strong> have been mapped. Please check your dashboard to view your allocated room number, partner details, and guidelines.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Refund Initiated",
    subject: "Refund Initiated – {{trip.name}} | {{booking.reference}}",
    category: "Refund & Cancellation",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>We have initiated the refund process for your booking reference <strong>{{booking.reference}}</strong>. The transaction is being processed and should reflect in your account within 5-7 working days.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Refund Completed",
    subject: "Refund Completed – {{trip.name}} | {{booking.reference}}",
    category: "Refund & Cancellation",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>Your refund transaction has been completed successfully for booking reference <strong>{{booking.reference}}</strong>. Please check your bank account or payment method for confirmation.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Trip Rescheduled",
    subject: "Important: Your Trip Has Been Rescheduled – {{trip.name}}",
    category: "Departure",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>Please note that your upcoming trip <strong>{{trip.name}}</strong> (Booking ID: {{booking.reference}}) has been rescheduled to a new date. Please check your dashboard or call your support manager for details.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Trip Cancelled by Organizer",
    subject: "Important Update Regarding {{trip.name}}",
    category: "Refund & Cancellation",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>We regret to inform you that your upcoming departure for <strong>{{trip.name}}</strong> has been cancelled by the organization due to unforeseen events. Our support team is initiating full refunds immediately.</p><p>Best regards,<br/>YouthCamping Team</p>"
  },
  {
    name: "Post-Trip Thank You and Review Request",
    subject: "Thank You for Travelling With YouthCamping",
    category: "Post-Trip",
    body: "<p>Dear <strong>{{recipient.full_name}}</strong>,</p><p>Thank you for choosing YouthCamping for your adventure! We hope you made lifetime memories on your trip. Kindly take a moment to leave a review of your experience.</p><p>Best regards,<br/>YouthCamping Team</p>"
  }
];

exports.seedDefaultTemplates = async () => {
  try {
    const count = await prisma.emailTemplate.count();
    if (count === 0) {
      console.log("🌱 Seeding default email templates...");
      await prisma.emailTemplate.createMany({
        data: defaultTemplates.map(t => ({
          ...t,
          tenantId: "default"
        }))
      });
      console.log("✅ Seeded 25 default email templates.");
    }
  } catch (err) {
    console.error("❌ Failed to seed email templates:", err);
  }
};

exports.listTemplates = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || 'default';
    const templates = await prisma.emailTemplate.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
};

exports.getTemplate = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || 'default';
    const template = await prisma.emailTemplate.findFirst({
      where: { id: req.params.id, tenantId }
    });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
};

exports.createTemplate = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || 'default';
    const { name, subject, body, category, isActive, defaultAttachments } = req.body;
    
    if (!name || !subject || !body || !category) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        tenantId,
        name,
        subject,
        body,
        category,
        isActive: isActive !== undefined ? isActive : true,
        defaultAttachments: defaultAttachments || null
      }
    });

    res.status(201).json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
};

exports.updateTemplate = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || 'default';
    const { name, subject, body, category, isActive, defaultAttachments } = req.body;

    const template = await prisma.emailTemplate.findFirst({
      where: { id: req.params.id, tenantId }
    });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const updated = await prisma.emailTemplate.update({
      where: { id: req.params.id },
      data: {
        name: name !== undefined ? name : template.name,
        subject: subject !== undefined ? subject : template.subject,
        body: body !== undefined ? body : template.body,
        category: category !== undefined ? category : template.category,
        isActive: isActive !== undefined ? isActive : template.isActive,
        defaultAttachments: defaultAttachments !== undefined ? defaultAttachments : template.defaultAttachments
      }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

exports.deleteTemplate = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || 'default';
    const template = await prisma.emailTemplate.findFirst({
      where: { id: req.params.id, tenantId }
    });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    await prisma.emailTemplate.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.duplicateTemplate = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || 'default';
    const template = await prisma.emailTemplate.findFirst({
      where: { id: req.params.id, tenantId }
    });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const duplicated = await prisma.emailTemplate.create({
      data: {
        tenantId,
        name: `${template.name} (Copy)`,
        subject: template.subject,
        body: template.body,
        category: template.category,
        isActive: template.isActive,
        defaultAttachments: template.defaultAttachments
      }
    });

    res.status(201).json({ success: true, data: duplicated });
  } catch (err) {
    next(err);
  }
};
