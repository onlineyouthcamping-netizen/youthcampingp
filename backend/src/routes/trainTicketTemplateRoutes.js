const express = require('express');
const router = express.Router();
const {
  getTemplates,
  getEffectiveTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  archiveTemplate,
  restoreTemplate
} = require('../controllers/trainTicketController');
const { authenticate, requirePermission } = require('../middleware/auth');

router.use(authenticate);

router.get('/effective', requirePermission('tickets.view'), getEffectiveTemplates);
router.get('/', requirePermission('tickets.view'), getTemplates);
router.post('/', requirePermission('tickets.templates.manage'), createTemplate);
router.put('/:id', requirePermission('tickets.templates.manage'), updateTemplate);
router.delete('/:id', requirePermission('tickets.templates.manage'), deleteTemplate);
router.post('/:id/archive', requirePermission('tickets.templates.manage'), archiveTemplate);
router.post('/:id/restore', requirePermission('tickets.templates.manage'), restoreTemplate);

module.exports = router;
