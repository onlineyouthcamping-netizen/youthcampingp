const express = require('express');
const { 
  getNotifications, 
  markRead, 
  markAllRead, 
  searchAll,
  getCompanyDocuments, 
  createCompanyDocument, 
  deleteCompanyDocument,
  getRecurringTasks, 
  createRecurringTask, 
  completeRecurringTask,
  getDocumentAccessUrl,
  getEmployeeMistakes, 
  logEmployeeMistake,
  getActivityTimeline, 
  getCustomerTimeline
} = require('../controllers/erpController');
const { protect, requirePermission } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/notifications', requirePermission('notifications.view_own'), getNotifications);
router.put('/notifications/:id/read', requirePermission('notifications.mark_read'), markRead);
router.put('/notifications/read-all', requirePermission('notifications.mark_read'), markAllRead);
router.get('/search', searchAll); // permissions are checked inside the controller for individual modules
const documentUpload = require('../middleware/documentUpload');

router.get('/company-documents', requirePermission(['company_documents.view']), getCompanyDocuments);
router.post('/company-documents', requirePermission(['company_documents.upload']), documentUpload.single('file'), createCompanyDocument);
router.get('/company-documents/:id/access-url', getDocumentAccessUrl);
router.delete('/company-documents/:id', requirePermission(['company_documents.archive']), deleteCompanyDocument);
router.get('/recurring-tasks', requirePermission(['recurring_tasks.view']), getRecurringTasks);
router.post('/recurring-tasks', requirePermission(['recurring_tasks.create']), createRecurringTask);
router.put('/recurring-tasks/:id/complete', requirePermission(['recurring_tasks.edit']), completeRecurringTask);
router.get('/employee-mistakes', getEmployeeMistakes);
router.post('/employee-mistakes', logEmployeeMistake);
router.get('/timeline/:id', requirePermission(['activity.view']), getActivityTimeline);
router.get('/customer-timeline/:id', requirePermission(['customers.timeline.view']), getCustomerTimeline);

module.exports = router;
