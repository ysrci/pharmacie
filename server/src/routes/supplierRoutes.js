const express = require('express');
const router = express.Router();
const SupplierController = require('../controllers/SupplierController');
const { authMiddleware, pharmacyOnly } = require('../middleware/authMiddleware');

router.use(authMiddleware, pharmacyOnly);

router.get('/', SupplierController.getAll);
router.post('/', SupplierController.create);
router.put('/:id', SupplierController.update);
router.delete('/:id', SupplierController.delete);

module.exports = router;
