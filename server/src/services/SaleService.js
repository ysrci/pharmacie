const pool = require('../db/pool');
const { withTransaction } = require('../db/transaction');
const AuditService = require('./AuditService');
const ProfitService = require('./ProfitService');

class SaleService {
    /**
     * Complete a sale transaction using FEFO (First Expired First Out).
     *
     * FIX: Stock check now happens INSIDE the transaction AFTER `FOR UPDATE` lock.
     * This eliminates the previous TOCTOU race condition where concurrent requests
     * could both pass the pre-check and oversell stock.
     */
    static async completeSale(userId, pharmacyId, medicationId, quantity, customerId = null) {
        // Fetch profit settings (read-only, safe outside tx)
        const settingsRes = await pool.query(
            'SELECT default_tva_rate FROM profit_settings WHERE pharmacy_id = $1',
            [pharmacyId]
        );
        const tvaRate = settingsRes.rows[0]
            ? parseFloat(settingsRes.rows[0].default_tva_rate)
            : 7;

        const saleIds = await withTransaction(async (client) => {
            // Lock the medication row FIRST — prevents any concurrent modification
            const medRes = await client.query(
                'SELECT * FROM medications WHERE id = $1 AND pharmacy_id = $2 FOR UPDATE',
                [medicationId, pharmacyId]
            );
            const med = medRes.rows[0];
            if (!med) throw new Error('Medication not found');

            // Stock check is now safe — we hold an exclusive lock
            if (med.quantity < quantity) throw new Error('Insufficient stock');

            const calculations = ProfitService.calculate(
                med.cost_price, med.price, quantity, tvaRate
            );

            // FEFO: earliest-expiry batches first, nulls last
            const batchesRes = await client.query(
                `SELECT * FROM medication_batches
                 WHERE medication_id = $1 AND quantity > 0
                 ORDER BY expiry_date ASC NULLS LAST`,
                [medicationId]
            );

            let remaining = quantity;
            const ids = [];

            for (const batch of batchesRes.rows) {
                if (remaining <= 0) break;
                const deduct = Math.min(batch.quantity, remaining);
                const ratio = deduct / quantity;

                const saleResult = await client.query(
                    `INSERT INTO sales (
                        pharmacy_id, medication_id, batch_id, customer_id,
                        quantity, unit_price, total_price, profit, tax_amount, net_profit
                     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                     RETURNING id`,
                    [
                        pharmacyId, medicationId, batch.id, customerId,
                        deduct, med.price,
                        +(calculations.totalSell * ratio).toFixed(4),
                        +(calculations.grossProfit * ratio).toFixed(4),
                        +(calculations.taxAmount * ratio).toFixed(4),
                        +(calculations.netProfit * ratio).toFixed(4)
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
                'UPDATE medications SET quantity = quantity - $1, updated_at = NOW() WHERE id = $2',
                [quantity, medicationId]
            );

            return ids;
        });

        // Async audit log — intentionally fire-and-forget
        AuditService.log(userId, pharmacyId, 'SALE_COMPLETED', 'medication', medicationId, {
            quantity, saleIds
        });

        return { success: true, saleIds };
    }

    /**
     * Complete an entire cart in a SINGLE PostgreSQL transaction.
     *
     * This replaces the N-sequential-calls pattern from the frontend.
     * If any item fails (insufficient stock, bad ID), the whole cart rolls back.
     *
     * @param {number} userId
     * @param {number} pharmacyId
     * @param {Array<{medication_id, quantity, customer_id?}>} items
     */
    static async completeBatchSale(userId, pharmacyId, items) {
        if (!items || items.length === 0) throw new Error('Cart is empty');

        const settingsRes = await pool.query(
            'SELECT default_tva_rate FROM profit_settings WHERE pharmacy_id = $1',
            [pharmacyId]
        );
        const tvaRate = settingsRes.rows[0]
            ? parseFloat(settingsRes.rows[0].default_tva_rate)
            : 7;

        const results = await withTransaction(async (client) => {
            const saleResults = [];

            for (const item of items) {
                const { medication_id, quantity, customer_id = null } = item;

                // Lock each medication row in order (prevents deadlocks via consistent ordering)
                const medRes = await client.query(
                    'SELECT * FROM medications WHERE id = $1 AND pharmacy_id = $2 FOR UPDATE',
                    [medication_id, pharmacyId]
                );
                const med = medRes.rows[0];
                if (!med) throw new Error(`Medication ID ${medication_id} not found`);
                if (med.quantity < quantity) {
                    throw new Error(`Insufficient stock for "${med.name}" (available: ${med.quantity})`);
                }

                const calculations = ProfitService.calculate(
                    med.cost_price, med.price, quantity, tvaRate
                );

                const batchesRes = await client.query(
                    `SELECT * FROM medication_batches
                     WHERE medication_id = $1 AND quantity > 0
                     ORDER BY expiry_date ASC NULLS LAST`,
                    [medication_id]
                );

                let remaining = quantity;
                const ids = [];

                for (const batch of batchesRes.rows) {
                    if (remaining <= 0) break;
                    const deduct = Math.min(batch.quantity, remaining);
                    const ratio = deduct / quantity;

                    const saleResult = await client.query(
                        `INSERT INTO sales (
                            pharmacy_id, medication_id, batch_id, customer_id,
                            quantity, unit_price, total_price, profit, tax_amount, net_profit
                         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                         RETURNING id`,
                        [
                            pharmacyId, medication_id, batch.id, customer_id,
                            deduct, med.price,
                            +(calculations.totalSell * ratio).toFixed(4),
                            +(calculations.grossProfit * ratio).toFixed(4),
                            +(calculations.taxAmount * ratio).toFixed(4),
                            +(calculations.netProfit * ratio).toFixed(4)
                        ]
                    );
                    ids.push(saleResult.rows[0].id);

                    await client.query(
                        'UPDATE medication_batches SET quantity = quantity - $1 WHERE id = $2',
                        [deduct, batch.id]
                    );
                    remaining -= deduct;
                }

                if (remaining > 0) throw new Error(`Critical: batch quantity insufficient for "${med.name}"`);

                await client.query(
                    'UPDATE medications SET quantity = quantity - $1, updated_at = NOW() WHERE id = $2',
                    [quantity, medication_id]
                );

                saleResults.push({ medication_id, medication_name: med.name, quantity, saleIds: ids, calculations });
            }

            return saleResults;
        });

        AuditService.log(userId, pharmacyId, 'BATCH_SALE_COMPLETED', 'medication', null, {
            items: results.map(r => ({ medication_id: r.medication_id, quantity: r.quantity }))
        });

        return { success: true, results };
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
