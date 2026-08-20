const {
  getTicketActionConfig,
  getDefaultTrainTicketTemplates,
} = require('../src/utils/trainTicketWorkflow');

describe('Train Ticket Workflow', () => {
  it('maps ticket actions to statuses and history labels', () => {
    expect(getTicketActionConfig('APPROVE')).toEqual({
      action: 'APPROVE',
      status: 'APPROVED',
      logAction: 'APPROVE',
      label: 'Approved',
    });

    expect(getTicketActionConfig('CANCEL_TICKET')).toEqual({
      action: 'CANCEL_TICKET',
      status: 'CANCELLED',
      logAction: 'CANCEL_TICKET',
      label: 'Cancelled',
    });
  });

  it('returns reusable default train ticket templates', () => {
    const templates = getDefaultTrainTicketTemplates();

    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThanOrEqual(2);
    expect(templates[0].id).toBe('standard');
    expect(templates[0].subject).toMatch(/Train Ticket/i);
  });
});
