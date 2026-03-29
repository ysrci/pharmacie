const AlertService = require('../services/AlertService');

class AlertController {
    static async getMyAlerts(req, res) {
        try {
            const userId = req.user.id;
            const alerts = await AlertService.getMyAlerts(userId);
            res.json(alerts);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async markAsRead(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await AlertService.markAsRead(userId, id);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async triggerCheck(req, res) {
        try {
            const count = await AlertService.checkExpiringMedications();
            res.json({ checked: true, found: count });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = AlertController;
