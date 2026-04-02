const express = require('express');
const router = express.Router();
const PharmacyController = require('../controllers/PharmacyController');
const { authMiddleware, pharmacyOnly } = require('../middleware/authMiddleware');

// Public pharmacy routes
router.get('/', PharmacyController.getAll);
router.get('/:id', PharmacyController.getDetails);

// Pharmacy settings
router.get('/settings/profit', authMiddleware, pharmacyOnly, PharmacyController.getSettings);
router.put('/settings/profit', authMiddleware, pharmacyOnly, PharmacyController.updateSettings);

module.exports = router;
