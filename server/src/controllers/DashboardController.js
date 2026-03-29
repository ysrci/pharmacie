const DashboardService = require('../services/DashboardService');

class DashboardController {
    static async getStats(req, res) {
        try {
            const stats = await DashboardService.getStats(req.user.pharmacyId);
            res.json(stats);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = DashboardController;
