const express = require('express');
const router = express.Router();
const PharmacyController = require('../controllers/PharmacyController');
const { authenticate, requirePharmacyOwner, requireAdmin } = require('../middleware/authMiddleware');

// مسارات عامة (بدون مصادقة)
router.get('/nearby', PharmacyController.getNearbyPharmacies);
router.get('/search-medication', PharmacyController.searchMedication);
router.get('/:id', PharmacyController.getPharmacyDetails);

// مسارات خاصة بصاحب الصيدلية
router.get('/my/inventory', authenticate, requirePharmacyOwner, PharmacyController.getMyInventory);
router.put('/my/inventory/:medicationId', authenticate, requirePharmacyOwner, PharmacyController.updateMyInventory);
router.get('/my/stats', authenticate, requirePharmacyOwner, PharmacyController.getMyStats);

// مسارات المسؤول (Admin)
router.get('/admin/all', authenticate, requireAdmin, PharmacyController.getAllPharmacies);
router.post('/admin', authenticate, requireAdmin, PharmacyController.createPharmacy);
router.delete('/admin/:id', authenticate, requireAdmin, PharmacyController.deletePharmacy);

module.exports = router;
