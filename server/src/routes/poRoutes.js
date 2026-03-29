const express = require('express');
const router = express.Router();
const PurchaseOrderController = require('../controllers/PurchaseOrderController');
const { authMiddleware, pharmacyOnly } = require('../middleware/authMiddleware');

router.use(authMiddleware, pharmacyOnly);

router.get('/', PurchaseOrderController.getAll);
router.get('/:id', PurchaseOrderController.getDetail);
router.post('/', PurchaseOrderController.create);
router.post('/:id/receive', PurchaseOrderController.receive);

module.exports = router;
