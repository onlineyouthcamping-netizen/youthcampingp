const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getTicketActionConfig,
  getDefaultTrainTicketTemplates,
} = require('../src/utils/trainTicketWorkflow');

test('maps ticket actions to statuses and history labels', () => {
  assert.deepEqual(getTicketActionConfig('APPROVE'), {
    action: 'APPROVE',
    status: 'APPROVED',
    logAction: 'APPROVE',
    label: 'Approved',
  });

  assert.deepEqual(getTicketActionConfig('CANCEL_TICKET'), {
    action: 'CANCEL_TICKET',
    status: 'CANCELLED',
    logAction: 'CANCEL_TICKET',
    label: 'Cancelled',
  });
});

test('returns reusable default train ticket templates', () => {
  const templates = getDefaultTrainTicketTemplates();

  assert.ok(Array.isArray(templates));
  assert.ok(templates.length >= 2);
  assert.equal(templates[0].id, 'standard');
  assert.match(templates[0].subject, /Train Ticket/i);
});
