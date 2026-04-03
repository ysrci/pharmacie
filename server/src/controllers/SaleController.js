const SaleService = require('../services/SaleService');
const { saleSchema } = require('../utils/validation');

class SaleController {
    static async createSale(req, res) {
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
            res.status(400).json({ error: err.errors ? err.errors : err.message });
        }
    }

    static async completeBatchSale(req, res) {
        try {
            const { batchSaleSchema } = require('../utils/validation');
            const { items } = batchSaleSchema.parse(req.body);
            const pharmacyId = req.user.pharmacyId;
            const userId = req.user.id;

            const result = await SaleService.completeBatchSale(userId, pharmacyId, items);
            res.json(result);
        } catch (err) {
            res.status(400).json({ error: err.errors ? err.errors : err.message });
        }
    }

    static async getHistory(req, res) {
        try {
            const { limit = 50, offset = 0 } = req.query;
            const pharmacyId = req.user.pharmacyId;
            const result = await SaleService.getSalesHistory(pharmacyId, parseInt(limit), parseInt(offset));
            res.json(result);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = SaleController;
