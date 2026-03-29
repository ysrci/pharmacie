const SupplierService = require('../services/SupplierService');
const { supplierSchema } = require('../utils/validation');

class SupplierController {
    static async getAll(req, res) {
        try {
            const suppliers = await SupplierService.getAll(req.user.pharmacyId);
            res.json(suppliers);
        } catch (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async create(req, res) {
        try {
            const validatedData = supplierSchema.parse(req.body);
            const supplier = await SupplierService.create(req.user.pharmacyId, validatedData);
            res.json(supplier);
        } catch (err) {
            res.status(400).json({ error: err.errors ? err.errors : err.message });
        }
    }

    static async update(req, res) {
        try {
            const validatedData = supplierSchema.partial().parse(req.body);
            const supplier = await SupplierService.update(req.user.pharmacyId, req.params.id, validatedData);
            res.json(supplier);
        } catch (err) {
            res.status(400).json({ error: err.errors ? err.errors : err.message });
        }
    }

    static async delete(req, res) {
        try {
            const result = await SupplierService.delete(req.user.pharmacyId, req.params.id);
            res.json(result);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
}

module.exports = SupplierController;
