const express = require('express');
const router = express.Router();
const { authenticate, requirePharmacyOwner } = require('../middleware/authMiddleware');

// مؤقتاً: مسار بسيط للاختبار
router.get('/test', authenticate, requirePharmacyOwner, (req, res) => {
    res.json({ success: true, message: 'Sales routes work!' });
});

module.exports = router;
