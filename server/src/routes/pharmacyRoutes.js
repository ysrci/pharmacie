// server/src/routes/pharmacyRoutes.js
const express = require('express');
const router = express.Router();
const PharmacyController = require('../controllers/PharmacyController');
const { authenticate, requirePharmacyOwner, requireSpecificPharmacy } = require('../middleware/authMiddleware');

// ========== المسارات العامة (لا تحتاج مصادقة) ==========

// ✅ البحث عن الصيدليات القريبة
// GET /api/pharmacies/nearby?lat=...&lng=...&radius=...
router.get('/nearby', PharmacyController.getNearbyPharmacies);

// ✅ البحث عن دواء في الصيدليات القريبة
// GET /api/pharmacies/search-medication?lat=...&lng=...&name=...&radius=...
router.get('/search-medication', PharmacyController.searchMedication);

// ✅ الحصول على تفاصيل صيدلية معينة
// GET /api/pharmacies/:id
router.get('/:id', PharmacyController.getPharmacyDetails);

// ========== المسارات المحمية (تتطلب مصادقة) ==========

// ✅ الحصول على مخزون الصيدلية الخاصة بي (لصاحب الصيدلية)
// GET /api/pharmacies/my/inventory
router.get(
    '/my/inventory',
    authenticate,
    requirePharmacyOwner,
    PharmacyController.getMyInventory
);

// ✅ تحديث مخزون الصيدلية الخاصة بي
// PUT /api/pharmacies/my/inventory/:medicationId
router.put(
    '/my/inventory/:medicationId',
    authenticate,
    requirePharmacyOwner,
    requireSpecificPharmacy('pharmacyId'),
    PharmacyController.updateMyInventory
);

// ✅ الحصول على إحصائيات الصيدلية الخاصة بي
// GET /api/pharmacies/my/stats
router.get(
    '/my/stats',
    authenticate,
    requirePharmacyOwner,
    PharmacyController.getMyStats
);

// ========== مسارات المسؤول (Admin only) ==========

// ✅ الحصول على جميع الصيدليات (للمسؤول فقط)
// GET /api/pharmacies/admin/all
router.get(
    '/admin/all',
    authenticate,
    requireAdmin,
    PharmacyController.getAllPharmacies
);

// ✅ إنشاء صيدلية جديدة (للمسؤول فقط)
// POST /api/pharmacies/admin
router.post(
    '/admin',
    authenticate,
    requireAdmin,
    PharmacyController.createPharmacy
);

// ✅ حذف صيدلية (للمسؤول فقط)
// DELETE /api/pharmacies/admin/:id
router.delete(
    '/admin/:id',
    authenticate,
    requireAdmin,
    PharmacyController.deletePharmacy
);

module.exports = router;
