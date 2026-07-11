const TICKET_ACTIONS = {
  APPROVE: { action: 'APPROVE', status: 'APPROVED', logAction: 'APPROVE', label: 'Approved' },
  REJECT: { action: 'REJECT', status: 'REJECTED', logAction: 'REJECT', label: 'Rejected' },
  REQUEST_CHANGES: { action: 'REQUEST_CHANGES', status: 'CHANGES_REQUESTED', logAction: 'REQUEST_CHANGES', label: 'Changes Requested' },
  MARK_ISSUED: { action: 'MARK_ISSUED', status: 'ISSUED', logAction: 'MARK_ISSUED', label: 'Issued' },
  CANCEL_TICKET: { action: 'CANCEL_TICKET', status: 'CANCELLED', logAction: 'CANCEL_TICKET', label: 'Cancelled' },
  REBOOK: { action: 'REBOOK', status: 'REBOOKED', logAction: 'REBOOK', label: 'Rebooked' },
};

const DEFAULT_TRAIN_TICKET_TEMPLATES = [
  {
    id: 'standard',
    name: 'Standard Train Ticket Update',
    subject: 'Train Ticket Update',
    body: 'Your train ticket request has been updated. Please review the latest status in the portal.',
    type: 'ticket_update',
  },
  {
    id: 'issue',
    name: 'Ticket Issued',
    subject: 'Train Ticket Issued',
    body: 'Your train ticket has been issued successfully. Please keep your PNR handy for travel.',
    type: 'issued',
  },
];

const DEFAULT_EMAIL_TEMPLATES = [
  {
    id: 'approval',
    name: 'Approval Notice',
    subject: 'Your train ticket request has been approved',
    body: 'The train ticket request for your booking has been approved. We will share the latest updates shortly.',
    type: 'approval',
  },
  {
    id: 'cancellation',
    name: 'Cancellation Notice',
    subject: 'Your train ticket request has been cancelled',
    body: 'The requested train ticket has been cancelled. Please contact support if you need help with rebooking.',
    type: 'cancellation',
  },
];

const normalizeTicketHistory = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }
  return [];
};

const appendTicketHistory = (existingValue, entry) => {
  const history = normalizeTicketHistory(existingValue);
  history.push({
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
  });
  return history;
};

const buildTicketAlertSummary = (tickets, context = {}) => ({
  ticketCount: tickets.length,
  triggeredAt: new Date().toISOString(),
  context,
  statuses: tickets.map((ticket) => ticket.status),
});

module.exports = {
  TICKET_ACTIONS,
  DEFAULT_TRAIN_TICKET_TEMPLATES,
  DEFAULT_EMAIL_TEMPLATES,
  getTicketActionConfig: (action) => TICKET_ACTIONS[action] || null,
  getDefaultTrainTicketTemplates: () => DEFAULT_TRAIN_TICKET_TEMPLATES,
  getDefaultEmailTemplates: () => DEFAULT_EMAIL_TEMPLATES,
  normalizeTicketHistory,
  appendTicketHistory,
  buildTicketAlertSummary,
};
