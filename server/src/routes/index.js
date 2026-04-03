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
router.use('/pharmacy/alerts', alertRoutes);

// Pharmacy base routes (Dashboard, Stats, Profile)
// Combine dashboard and generic pharmacy routes
router.use('/pharmacy', dashboardRoutes);
router.use('/pharmacies', pharmacyRoutes); // Public list of pharmacies


module.exports = router;
