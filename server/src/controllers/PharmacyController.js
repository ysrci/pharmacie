const PharmacyService = require('../services/PharmacyService');

class PharmacyController {
    static async getAll(req, res, next) {
        try {
            const { lat, lng, radius, limit, offset, search } = req.query;
            const pharmacies = await PharmacyService.getAllActive({
                lat: lat ? parseFloat(lat) : null,
                lng: lng ? parseFloat(lng) : null,
                radius: radius ? parseFloat(radius) : 10,
                limit: limit ? parseInt(limit) : 20,
                offset: offset ? parseInt(offset) : 0,
                search
            });
            res.json(pharmacies);
        } catch (err) {
            next(err);
        }
    }

    static async getDetails(req, res, next) {
        try {
            const pharmacy = await PharmacyService.getById(req.params.id);
            if (!pharmacy) {
                const error = new Error('Pharmacy not found');
                error.status = 404;
                throw error;
            }
            res.json(pharmacy);
        } catch (err) {
            next(err);
        }
    }

    static async getSettings(req, res, next) {
        try {
            const settings = await PharmacyService.getProfitSettings(req.user.pharmacyId);
            res.json(settings);
        } catch (err) {
            next(err);
        }
    }

    static async updateSettings(req, res, next) {
        try {
            const { default_margin_percentage } = req.body;
            const result = await PharmacyService.updateProfitSettings(req.user.pharmacyId, default_margin_percentage);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = PharmacyController;
