const MedicationService = require('../services/MedicationService');
const { medicationSchema, batchSchema } = require('../utils/validation');

class MedicationController {
    static async getMyMedications(req, res) {
        try {
            const { limit = 20, offset = 0, search = '' } = req.query;
            const result = await MedicationService.getAllByPharmacy(req.user.pharmacyId, parseInt(limit), parseInt(offset), search);
            res.json(result);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async addMedication(req, res) {
        try {
            const validatedData = medicationSchema.parse(req.body);
            const med = await MedicationService.addMedication(req.user.id, req.user.pharmacyId, validatedData);
            res.json(med);
        } catch (err) {
            res.status(400).json({ error: err.errors ? err.errors : err.message });
        }
    }

    static async updateMedication(req, res) {
        try {
            const validatedData = medicationSchema.partial().parse(req.body);
            const med = await MedicationService.updateMedication(req.user.id, req.user.pharmacyId, req.params.id, validatedData);
            res.json(med);
        } catch (err) {
            res.status(400).json({ error: err.errors ? err.errors : err.message });
        }
    }

    static async deleteMedication(req, res) {
        try {
            const result = await MedicationService.deleteMedication(req.user.pharmacyId, req.params.id);
            res.json(result);
        } catch (err) {
            console.error(err);
            res.status(400).json({ error: err.message });
        }
    }

    static async addBatch(req, res) {
        try {
            const validatedData = batchSchema.parse(req.body);
            const result = await MedicationService.addBatch(req.user.id, req.user.pharmacyId, req.params.id, validatedData);
            res.json(result);
        } catch (err) {
            res.status(400).json({ error: err.errors ? err.errors : err.message });
        }
    }

    static async search(req, res) {
        try {
            const results = await MedicationService.searchMedications(req.query);
            res.json(results);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = MedicationController;
