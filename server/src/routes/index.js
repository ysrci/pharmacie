const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const medicationRoutes = require('./medicationRoutes');
const saleRoutes = require('./saleRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const supplierRoutes = require('./supplierRoutes');
const poRoutes = require('./poRoutes');
const customerRoutes = require('./customerRoutes');
const alertRoutes = require('./alertRoutes');
const pharmacyRoutes = require('./pharmacyRoutes');

router.use('/auth', authRoutes);

// Specific pharmacy sub-resources FIRST
router.use('/pharmacy/medications', medicationRoutes);
router.use('/pharmacy/sales', saleRoutes);
router.use('/pharmacy/suppliers', supplierRoutes);
router.use('/pharmacy/orders', poRoutes);
router.use('/pharmacy/customers', customerRoutes);
router.use('/pharmacy', dashboardRoutes); // stats and audit-logs

// Generic pharmacy routes LAST
router.use('/pharmacies', pharmacyRoutes);
router.use('/pharmacy', pharmacyRoutes);
router.use('/alerts', alertRoutes);

module.exports = router;
