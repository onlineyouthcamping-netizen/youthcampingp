const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../middleware/auth');
const {
  getChecklistTasks,
  createChecklistTask,
  updateChecklistTask,
  deleteChecklistTask,
  getOpsDocuments,
  createOpsDocument,
  verifyOpsDocument,
  deleteOpsDocument,
  getOpsMessages,
  createOpsMessage,
  getOpsReportData
} = require('../controllers/opsTasksDocsCommController');

router.use(authenticate);

// Tasks/Checklists Routes
router.get('/tasks/:tripId', requirePermission('ops.view'), getChecklistTasks);
router.post('/tasks/:tripId', requirePermission('ops.manage'), createChecklistTask);
router.put('/tasks/:tripId/:id', requirePermission('ops.manage'), updateChecklistTask);
router.delete('/tasks/:id', requirePermission('ops.manage'), deleteChecklistTask);

// Documents Routes
router.get('/documents/:tripId', requirePermission('ops.view'), getOpsDocuments);
router.post('/documents/:tripId', requirePermission('ops.manage'), createOpsDocument);
router.patch('/documents/verify/:id', requirePermission('ops.manage'), verifyOpsDocument);
router.delete('/documents/:id', requirePermission('ops.manage'), deleteOpsDocument);

// Communication Routes
router.get('/messages/:tripId', requirePermission('ops.view'), getOpsMessages);
router.post('/messages/:tripId', requirePermission('ops.manage'), createOpsMessage);

// Reports Routes
router.get('/reports/:tripId', requirePermission('ops.view'), getOpsReportData);

module.exports = router;
