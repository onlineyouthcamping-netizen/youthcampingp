const express = require('express');
const router = express.Router();
const {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
} = require('../controllers/trainTicketController');
const { authenticate, requirePermission } = require('../middleware/auth');

router.use(authenticate);

router.get('/', requirePermission('tickets.view'), getTemplates);
router.post('/', requirePermission('tickets.templates.manage'), createTemplate);
router.put('/:id', requirePermission('tickets.templates.manage'), updateTemplate);
router.delete('/:id', requirePermission('tickets.templates.manage'), deleteTemplate);

module.exports = router;
