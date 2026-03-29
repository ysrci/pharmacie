const PrescriptionService = require('../services/PrescriptionService');

class PrescriptionController {
    static async getByCustomer(req, res) {
        try {
            const prescriptions = await PrescriptionService.getByCustomer(req.params.customerId);
            res.json(prescriptions);
        } catch (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async create(req, res) {
        try {
            const prescription = await PrescriptionService.create(req.params.customerId, req.body);
            res.json(prescription);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    static async delete(req, res) {
        try {
            const result = await PrescriptionService.delete(req.params.customerId, req.params.id);
            res.json(result);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
}

module.exports = PrescriptionController;
