const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/CustomerController');
const PrescriptionController = require('../controllers/PrescriptionController');
const { authMiddleware, pharmacyOnly } = require('../middleware/authMiddleware');

router.use(authMiddleware, pharmacyOnly);

// Customer routes
router.get('/', CustomerController.getAll);
router.post('/', CustomerController.create);
router.get('/:id', CustomerController.getDetail);
router.put('/:id', CustomerController.update);

// Prescription routes (nested under customers)
router.get('/:customerId/prescriptions', PrescriptionController.getByCustomer);
router.post('/:customerId/prescriptions', PrescriptionController.create);
router.delete('/:customerId/prescriptions/:id', PrescriptionController.delete);

module.exports = router;
