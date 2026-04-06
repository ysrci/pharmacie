const express = require('express');
const router = express.Router();
const { authenticate, requirePharmacyOwner } = require('../middleware/authMiddleware');

router.get('/test', authenticate, requirePharmacyOwner, (req, res) => {
    res.json({ success: true, message: 'Purchase order routes work!' });
});

module.exports = router;
