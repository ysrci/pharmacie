const PurchaseOrderService = require('../services/PurchaseOrderService');

class PurchaseOrderController {
    static async getAll(req, res, next) {
        try {
            const orders = await PurchaseOrderService.getAll(req.user.pharmacyId);
            res.json(orders);
        } catch (err) {
            next(err);
        }
    }

    static async getDetail(req, res, next) {
        try {
            const order = await PurchaseOrderService.getById(req.user.pharmacyId, req.params.id);
            if (!order) {
                const error = new Error('Order not found');
                error.status = 404;
                throw error;
            }
            res.json(order);
        } catch (err) {
            next(err);
        }
    }

    static async create(req, res, next) {
        try {
            const order = await PurchaseOrderService.create(req.user.pharmacyId, req.body);
            res.json(order);
        } catch (err) {
            next(err);
        }
    }

    static async receive(req, res, next) {
        try {
            const result = await PurchaseOrderService.receiveOrder(req.user.pharmacyId, req.params.id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = PurchaseOrderController;
