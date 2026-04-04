const DashboardService = require('../services/DashboardService');

class DashboardController {
    static async getStats(req, res, next) {
        try {
            const stats = await DashboardService.getStats(req.user.pharmacyId);
            res.json(stats);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = DashboardController;
