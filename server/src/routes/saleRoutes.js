const express = require('express');
const router = express.Router();
const SaleController = require('../controllers/SaleController');
const { authMiddleware, pharmacyOnly } = require('../middleware/authMiddleware');

router.use(authMiddleware, pharmacyOnly);
router.post('/', SaleController.createSale);
router.post('/batch', SaleController.completeBatchSale);
router.get('/', SaleController.getHistory);
router.get('/history', SaleController.getHistory);

module.exports = router;
