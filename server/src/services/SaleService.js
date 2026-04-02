const pool = require('../db/pool');
const { withTransaction } = require('../db/transaction');
const AuditService = require('./AuditService');
const ProfitService = require('./ProfitService');

class SaleService {
    /**
     * Complete a sale transaction using FEFO (First Expired First Out).
     * Uses a real PostgreSQL transaction via withTransaction.
     */
    static async completeSale(userId, pharmacyId, medicationId, quantity, customerId = null) {
        // 1. Fetch medication (outside transaction — read-only check)
        const medRes = await pool.query(
            'SELECT * FROM medications WHERE id = $1 AND pharmacy_id = $2',
            [medicationId, pharmacyId]
        );
        const med = medRes.rows[0];
        if (!med) throw new Error('Medication not found');
        if (med.quantity < quantity) throw new Error('Insufficient stock');

        // 2. Fetch settings (outside transaction — read-only)
        const settingsRes = await pool.query(
            'SELECT * FROM profit_settings WHERE pharmacy_id = $1',
            [pharmacyId]
        );
        const settings = settingsRes.rows[0];
        const tvaRate = settings ? parseFloat(settings.default_tva_rate) : 7;

        // 3. Calculate profit figures
        const calculations = ProfitService.calculate(med.cost_price, med.price, quantity, tvaRate);

        // 4. Execute inside a real pg transaction
        const saleIds = await withTransaction(async (client) => {
            // Lock the medication row to prevent race conditions
            await client.query(
                'SELECT quantity FROM medications WHERE id = $1 AND pharmacy_id = $2 FOR UPDATE',
                [medicationId, pharmacyId]
            );

            // Fetch available batches (FEFO — earliest expiry first)
            const batchesRes = await client.query(
                `SELECT * FROM medication_batches
                 WHERE medication_id = $1 AND quantity > 0
                 ORDER BY expiry_date ASC NULLS LAST`,
                [medicationId]
            );
            const batches = batchesRes.rows;

            let remaining = quantity;
            const ids = [];

            for (const batch of batches) {
                if (remaining <= 0) break;
                const deduct = Math.min(batch.quantity, remaining);

                const ratio = deduct / quantity;
                const saleResult = await client.query(
                    `INSERT INTO sales (
                        pharmacy_id, medication_id, batch_id, customer_id,
                        quantity, unit_price, total_price, profit, tax_amount, net_profit
                     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                     RETURNING id`,
                    [
                        pharmacyId, medicationId, batch.id, customerId,
                        deduct, med.price,
                        calculations.totalSell * ratio,
                        calculations.grossProfit * ratio,
                        calculations.taxAmount * ratio,
                        calculations.netProfit * ratio
                    ]
                );
                ids.push(saleResult.rows[0].id);

                await client.query(
                    'UPDATE medication_batches SET quantity = quantity - $1 WHERE id = $2',
                    [deduct, batch.id]
                );
                remaining -= deduct;
            }

            if (remaining > 0) throw new Error('Critical: insufficient batch quantity to fulfill sale');

            await client.query(
                `UPDATE medications
                 SET quantity = quantity - $1, updated_at = NOW()
                 WHERE id = $2`,
                [quantity, medicationId]
            );

            return ids;
        });

        // 5. Async audit log (non-blocking)
        AuditService.log(userId, pharmacyId, 'SALE_COMPLETED', 'medication', medicationId, {
            quantity, total: calculations.totalSell, saleIds
        });

        return { success: true, calculations, saleIds };
    }

    static async getSalesHistory(pharmacyId, limit = 50, offset = 0) {
        const [dataRes, countRes] = await Promise.all([
            pool.query(
                `SELECT s.*, m.name AS medication_name, c.name AS customer_name
                 FROM sales s
                 JOIN medications m ON m.id = s.medication_id
                 LEFT JOIN customers c ON c.id = s.customer_id
                 WHERE s.pharmacy_id = $1
                 ORDER BY s.created_at DESC
                 LIMIT $2 OFFSET $3`,
                [pharmacyId, limit, offset]
            ),
            pool.query(
                'SELECT COUNT(*) AS total FROM sales WHERE pharmacy_id = $1',
                [pharmacyId]
            )
        ]);

        return {
            rows: dataRes.rows,
            total: parseInt(countRes.rows[0].total, 10)
        };
    }
}

module.exports = SaleService;
