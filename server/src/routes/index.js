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

router.use('/auth', authRoutes);
router.use('/pharmacy/medications', medicationRoutes);
router.use('/pharmacy/sales', saleRoutes);
router.use('/pharmacy/suppliers', supplierRoutes);
router.use('/pharmacy/orders', poRoutes);
router.use('/pharmacy/customers', customerRoutes);
router.use('/alerts', alertRoutes);
router.use('/pharmacy', dashboardRoutes);

module.exports = router;
