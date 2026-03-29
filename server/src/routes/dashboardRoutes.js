const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');
const AuditController = require('../controllers/AuditController');
const { authMiddleware, pharmacyOnly } = require('../middleware/authMiddleware');

router.get('/stats', authMiddleware, pharmacyOnly, DashboardController.getStats);
router.get('/audit-logs', authMiddleware, pharmacyOnly, AuditController.getLogs);

module.exports = router;
