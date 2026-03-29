const express = require('express');
const router = express.Router();
const PharmacyController = require('../controllers/PharmacyController');
const AlertController = require('../controllers/AlertController');
const { authMiddleware, pharmacyOnly } = require('../middleware/authMiddleware');

// Public pharmacy routes
router.get('/', PharmacyController.getAll);
router.get('/:id', PharmacyController.getDetails);

// Pharmacy settings
router.get('/settings/profit', authMiddleware, pharmacyOnly, PharmacyController.getSettings);
router.put('/settings/profit', authMiddleware, pharmacyOnly, PharmacyController.updateSettings);

// User Alerts
router.get('/user/alerts', authMiddleware, AlertController.getAll);
router.post('/user/alerts', authMiddleware, AlertController.create);
router.delete('/user/alerts/:id', authMiddleware, AlertController.delete);
router.get('/user/alerts/check', authMiddleware, AlertController.getCheck);

module.exports = router;
