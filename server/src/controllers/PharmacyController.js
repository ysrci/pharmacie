const PharmacyService = require('../services/PharmacyService');

class PharmacyController {
    static async getAll(req, res) {
        try {
            const pharmacies = await PharmacyService.getAllActive();
            res.json(pharmacies);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getDetails(req, res) {
        try {
            const pharmacy = await PharmacyService.getById(req.params.id);
            if (!pharmacy) return res.status(404).json({ error: 'Pharmacy not found' });
            res.json(pharmacy);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getSettings(req, res) {
        try {
            const settings = await PharmacyService.getProfitSettings(req.user.pharmacyId);
            res.json(settings);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async updateSettings(req, res) {
        try {
            const { default_margin_percentage } = req.body;
            const result = await PharmacyService.updateProfitSettings(req.user.pharmacyId, default_margin_percentage);
            res.json(result);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = PharmacyController;
