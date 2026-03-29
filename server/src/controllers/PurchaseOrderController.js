const PurchaseOrderService = require('../services/PurchaseOrderService');

class PurchaseOrderController {
    static async getAll(req, res) {
        try {
            const orders = await PurchaseOrderService.getAll(req.user.pharmacyId);
            res.json(orders);
        } catch (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getDetail(req, res) {
        try {
            const order = await PurchaseOrderService.getById(req.user.pharmacyId, req.params.id);
            if (!order) return res.status(404).json({ error: 'Order not found' });
            res.json(order);
        } catch (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async create(req, res) {
        try {
            const order = await PurchaseOrderService.create(req.user.pharmacyId, req.body);
            res.json(order);
        } catch (err) {
            console.error(err);
            res.status(400).json({ error: err.message });
        }
    }

    static async receive(req, res) {
        try {
            const result = await PurchaseOrderService.receiveOrder(req.user.pharmacyId, req.params.id);
            res.json(result);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
}

module.exports = PurchaseOrderController;
