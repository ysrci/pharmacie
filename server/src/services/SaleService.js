const { query } = require('../config/db');
const ProfitService = require('./ProfitService');
const AuditService = require('./AuditService');

class SaleService {
    /**
     * Complete a sale transaction.
     */
    static async completeSale(userId, pharmacyId, medicationId, quantity, customerId = null) {
        // 1. Fetch medication and pharmacy settings
        const medRes = await query('SELECT * FROM medications WHERE id = ? AND pharmacy_id = ?', [medicationId, pharmacyId]);
        const med = medRes.rows[0];
        if (!med) throw new Error('Medication not found');
        if (med.quantity < quantity) throw new Error('Insufficient stock');

        // 2. Fetch available batches ordered by expiry date (FEFO)
        const batchesRes = await query('SELECT * FROM medication_batches WHERE medication_id = ? AND quantity > 0 ORDER BY expiry_date ASC', [medicationId]);
        const batches = batchesRes.rows;

        const settingsRes = await query('SELECT * FROM profit_settings WHERE pharmacy_id = ?', [pharmacyId]);
        const settings = settingsRes.rows[0];
        const tvaRate = settings ? settings.default_tva_rate : 7;

        // 3. Calculate profit
        const calculations = ProfitService.calculate(med.cost_price, med.price, quantity, tvaRate);

        // 4. Execute transaction
        await query('BEGIN');
        try {
            let remainingToDeduct = quantity;
            const saleIds = [];

            for (let batch of batches) {
                if (remainingToDeduct <= 0) break;

                const deductAmount = Math.min(batch.quantity, remainingToDeduct);

                const sResult = await query(`
                    INSERT INTO sales (
                        pharmacy_id, medication_id, batch_id, customer_id, quantity, unit_price, 
                        total_price, profit, tax_amount, net_profit
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
                `, [
                    pharmacyId, medicationId, batch.id, customerId, deductAmount, med.price,
                    (calculations.totalSell / quantity) * deductAmount,
                    (calculations.grossProfit / quantity) * deductAmount,
                    (calculations.taxAmount / quantity) * deductAmount,
                    (calculations.netProfit / quantity) * deductAmount
                ]);
                saleIds.push(sResult.lastInsertId);

                await query('UPDATE medication_batches SET quantity = quantity - ? WHERE id = ?', [deductAmount, batch.id]);
                remainingToDeduct -= deductAmount;
            }

            await query('UPDATE medications SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [quantity, medicationId]);

            if (remainingToDeduct > 0) throw new Error('Critical: Batch quantity mismatch');

            await query('COMMIT');

            // Audit Log (Passively)
            AuditService.log(userId, pharmacyId, 'SALE_COMPLETED', 'medication', medicationId, {
                quantity,
                total: calculations.totalSell,
                saleIds
            });
        } catch (e) {
            await query('ROLLBACK');
            throw e;
        }

        return { success: true, calculations };
    }

    static async getSalesHistory(pharmacyId, limit = 50, offset = 0) {
        const queryStr = `
            SELECT s.*, m.name as medication_name, c.name as customer_name
            FROM sales s
            JOIN medications m ON m.id = s.medication_id
            LEFT JOIN customers c ON c.id = s.customer_id
            WHERE s.pharmacy_id = ?
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const res = await query(queryStr, [pharmacyId, limit, offset]);

        const countRes = await query('SELECT COUNT(*) FROM sales WHERE pharmacy_id = ?', [pharmacyId]);
        const total = parseInt(countRes.rows[0].count);

        return { rows: res.rows, total };
    }
}

module.exports = SaleService;
