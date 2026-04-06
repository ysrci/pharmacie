const express = require('express');
const router = express.Router();
const MedicationController = require('../controllers/MedicationController');
const { authenticate, requirePharmacyOwner } = require('../middleware/authMiddleware');

// البحث عن الأدوية (عام)
router.get('/search', MedicationController.searchMedications);

// الحصول على تفاصيل دواء
router.get('/:id', MedicationController.getMedicationById);

// إضافة دواء جديد (لأصحاب الصيدليات)
router.post('/', authenticate, requirePharmacyOwner, MedicationController.createMedication);

// تحديث دواء
router.put('/:id', authenticate, requirePharmacyOwner, MedicationController.updateMedication);

// حذف دواء
router.delete('/:id', authenticate, requirePharmacyOwner, MedicationController.deleteMedication);

module.exports = router;
