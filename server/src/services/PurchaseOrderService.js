const pool = require('../db/pool');
const { withTransaction } = require('../db/transaction');

class PurchaseOrderService {
    static async getAll(pharmacyId) {
        const res = await pool.query(
            `SELECT po.*, s.name AS supplier_name
             FROM purchase_orders po
             JOIN suppliers s ON s.id = po.supplier_id
             WHERE po.pharmacy_id = $1
             ORDER BY po.created_at DESC`,
            [pharmacyId]
        );
        return res.rows;
    }

    static async create(pharmacyId, data) {
        const { supplier_id, items, notes } = data;
        const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);

        return withTransaction(async (client) => {
            const poResult = await client.query(
                `INSERT INTO purchase_orders (pharmacy_id, supplier_id, total_amount, notes)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id`,
                [pharmacyId, supplier_id, totalAmount, notes || '']
            );
            const poId = poResult.rows[0].id;

            for (const item of items) {
                await client.query(
                    `INSERT INTO po_items (po_id, medication_id, quantity, unit_cost, batch_number, expiry_date)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        poId, item.medication_id, item.quantity, item.unit_cost,
                        item.batch_number || null, item.expiry_date || null
                    ]
                );
            }

            return poId;
        }).then((poId) => this.getById(pharmacyId, poId));
    }

    static async getById(pharmacyId, id) {
        const [poRes, itemsRes] = await Promise.all([
            pool.query(
                `SELECT po.*, s.name AS supplier_name
                 FROM purchase_orders po
                 JOIN suppliers s ON s.id = po.supplier_id
                 WHERE po.id = $1 AND po.pharmacy_id = $2`,
                [id, pharmacyId]
            ),
            pool.query(
                `SELECT pi.*, m.name AS medication_name
                 FROM po_items pi
                 JOIN medications m ON m.id = pi.medication_id
                 WHERE pi.po_id = $1`,
                [id]
            )
        ]);

        const po = poRes.rows[0];
        if (!po) return null;
        return { ...po, items: itemsRes.rows };
    }

    static async receiveOrder(pharmacyId, id) {
        const poRes = await pool.query(
            'SELECT * FROM purchase_orders WHERE id = $1 AND pharmacy_id = $2',
            [id, pharmacyId]
        );
        const po = poRes.rows[0];
        if (!po) throw new Error('Order not found');
        if (po.status !== 'pending') throw new Error('Order is already ' + po.status);

        const itemsRes = await pool.query('SELECT * FROM po_items WHERE po_id = $1', [id]);
        const items = itemsRes.rows;

        await withTransaction(async (client) => {
            await client.query(
                `UPDATE purchase_orders
                 SET status = 'received', received_at = NOW()
                 WHERE id = $1`,
                [id]
            );

            for (const item of items) {
                await client.query(
                    `INSERT INTO medication_batches (medication_id, batch_number, expiry_date, quantity)
                     VALUES ($1, $2, $3, $4)`,
                    [
                        item.medication_id,
                        item.batch_number || `AUTO-${Date.now()}`,
                        item.expiry_date || null,
                        item.quantity
                    ]
                );

                await client.query(
                    `UPDATE medications
                     SET quantity = quantity + $1, cost_price = $2, updated_at = NOW()
                     WHERE id = $3`,
                    [item.quantity, item.unit_cost, item.medication_id]
                );
            }
        });

        return { success: true };
    }

    static async cancelOrder(pharmacyId, id) {
        const result = await pool.query(
            `UPDATE purchase_orders SET status = 'cancelled'
             WHERE id = $1 AND pharmacy_id = $2 AND status = 'pending'
             RETURNING id`,
            [id, pharmacyId]
        );
        if (result.rowCount === 0) throw new Error('Order not found or cannot be cancelled');
        return { success: true };
    }
}

module.exports = PurchaseOrderService;
