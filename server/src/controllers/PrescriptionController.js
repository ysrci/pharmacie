const PrescriptionService = require('../services/PrescriptionService');

class PrescriptionController {
    static async getByCustomer(req, res, next) {
        try {
            const prescriptions = await PrescriptionService.getByCustomer(req.params.customerId);
            res.json(prescriptions);
        } catch (err) {
            next(err);
        }
    }

    static async create(req, res, next) {
        try {
            const prescription = await PrescriptionService.create(req.params.customerId, req.body);
            res.json(prescription);
        } catch (err) {
            next(err);
        }
    }

    static async delete(req, res, next) {
        try {
            const result = await PrescriptionService.delete(req.params.customerId, req.params.id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = PrescriptionController;
