const MedicationService = require('../services/MedicationService');
const { medicationSchema, batchSchema } = require('../utils/validation');

class MedicationController {
    static async getMyMedications(req, res, next) {
        try {
            const { limit = 20, offset = 0, search = '' } = req.query;
            const result = await MedicationService.getAllByPharmacy(req.user.pharmacyId, parseInt(limit), parseInt(offset), search);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    static async addMedication(req, res, next) {
        try {
            const validatedData = medicationSchema.parse(req.body);
            const med = await MedicationService.addMedication(req.user.id, req.user.pharmacyId, validatedData);
            res.json(med);
        } catch (err) {
            next(err);
        }
    }

    static async updateMedication(req, res, next) {
        try {
            const validatedData = medicationSchema.partial().parse(req.body);
            const med = await MedicationService.updateMedication(req.user.id, req.user.pharmacyId, req.params.id, validatedData);
            res.json(med);
        } catch (err) {
            next(err);
        }
    }

    static async deleteMedication(req, res, next) {
        try {
            const result = await MedicationService.deleteMedication(req.user.pharmacyId, req.params.id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    static async addBatch(req, res, next) {
        try {
            const validatedData = batchSchema.parse(req.body);
            const result = await MedicationService.addBatch(req.user.id, req.user.pharmacyId, req.params.id, validatedData);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    static async search(req, res, next) {
        try {
            const results = await MedicationService.searchMedications(req.query);
            res.json(results);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = MedicationController;
