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
  getEmployeeMistakes, 
  logEmployeeMistake,
  getActivityTimeline, 
  getCustomerTimeline
} = require('../controllers/erpController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markRead);
router.put('/notifications/read-all', markAllRead);
router.get('/search', searchAll);
router.get('/company-documents', getCompanyDocuments);
router.post('/company-documents', createCompanyDocument);
router.delete('/company-documents/:id', deleteCompanyDocument);
router.get('/recurring-tasks', getRecurringTasks);
router.post('/recurring-tasks', createRecurringTask);
router.put('/recurring-tasks/:id/complete', completeRecurringTask);
router.get('/employee-mistakes', getEmployeeMistakes);
router.post('/employee-mistakes', logEmployeeMistake);
router.get('/timeline/:id', getActivityTimeline);
router.get('/customer-timeline/:id', getCustomerTimeline);

module.exports = router;
