const express = require('express');
const router = express.Router();
const { getAllAlerts, getActiveAlerts, resolveAlert, getMonthlyReport, getStats } = require('../controllers/alertController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/active', protect, getActiveAlerts);
router.get('/reports/monthly', protect, authorize('manager', 'admin'), getMonthlyReport);
router.get('/reports/stats', protect, getStats);
router.get('/', protect, getAllAlerts);
router.put('/:id/resolve', protect, authorize('manager', 'admin'), resolveAlert);

module.exports = router;
