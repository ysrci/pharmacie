const express = require('express');
const router = express.Router();
const MedicationController = require('../controllers/MedicationController');
const { authMiddleware, pharmacyOnly } = require('../middleware/authMiddleware');

// Public search
router.get('/search', MedicationController.search);

// Pharmacy restricted routes
router.use(authMiddleware, pharmacyOnly);
router.get('/', MedicationController.getMyMedications);
router.post('/', MedicationController.addMedication);
router.put('/:id', MedicationController.updateMedication);
router.delete('/:id', MedicationController.deleteMedication);
router.post('/:id/batches', MedicationController.addBatch);

module.exports = router;
