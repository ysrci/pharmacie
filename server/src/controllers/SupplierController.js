const SupplierService = require('../services/SupplierService');
const { supplierSchema } = require('../utils/validation');

class SupplierController {
    static async getAll(req, res, next) {
        try {
            const suppliers = await SupplierService.getAll(req.user.pharmacyId);
            res.json(suppliers);
        } catch (err) {
            next(err);
        }
    }

    static async create(req, res, next) {
        try {
            const validatedData = supplierSchema.parse(req.body);
            const supplier = await SupplierService.create(req.user.pharmacyId, validatedData);
            res.json(supplier);
        } catch (err) {
            next(err);
        }
    }

    static async update(req, res, next) {
        try {
            const validatedData = supplierSchema.partial().parse(req.body);
            const supplier = await SupplierService.update(req.user.pharmacyId, req.params.id, validatedData);
            res.json(supplier);
        } catch (err) {
            next(err);
        }
    }

    static async delete(req, res, next) {
        try {
            const result = await SupplierService.delete(req.user.pharmacyId, req.params.id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = SupplierController;
