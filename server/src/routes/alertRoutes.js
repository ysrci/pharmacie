const express = require('express');
const router = express.Router();
const AlertController = require('../controllers/AlertController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, AlertController.getMyAlerts);
router.put('/:id/read', authMiddleware, AlertController.markAsRead);
router.post('/check', authMiddleware, AlertController.triggerCheck);

module.exports = router;
