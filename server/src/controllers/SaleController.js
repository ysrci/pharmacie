const SaleService = require('../services/SaleService');
const { saleSchema, batchSaleSchema } = require('../utils/validation');

class SaleController {
    static async createSale(req, res, next) {
        try {
            const validatedData = saleSchema.parse(req.body);
            const pharmacyId = req.user.pharmacyId;
            const userId = req.user.id;

            const result = await SaleService.completeSale(
                userId,
                pharmacyId,
                validatedData.medication_id,
                validatedData.quantity,
                validatedData.customer_id
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    static async completeBatchSale(req, res, next) {
        try {
            const { items } = batchSaleSchema.parse(req.body);
            const pharmacyId = req.user.pharmacyId;
            const userId = req.user.id;

            const result = await SaleService.completeBatchSale(userId, pharmacyId, items);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    static async getHistory(req, res, next) {
        try {
            const { limit = 50, offset = 0 } = req.query;
            const pharmacyId = req.user.pharmacyId;
            const result = await SaleService.getSalesHistory(pharmacyId, parseInt(limit), parseInt(offset));
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = SaleController;
