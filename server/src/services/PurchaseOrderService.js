const { query } = require('../config/db');

class PurchaseOrderService {
    static async getAll(pharmacyId) {
        const res = await query(`
            SELECT po.*, s.name as supplier_name 
            FROM purchase_orders po
            JOIN suppliers s ON s.id = po.supplier_id
            WHERE po.pharmacy_id = ?
            ORDER BY po.created_at DESC
        `, [pharmacyId]);
        return res.rows;
    }

    static async create(pharmacyId, data) {
        const { supplier_id, items, notes } = data;
        const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);

        await query('BEGIN');
        try {
            const result = await query(`
                INSERT INTO purchase_orders (pharmacy_id, supplier_id, total_amount, notes)
                VALUES (?, ?, ?, ?) RETURNING id
            `, [pharmacyId, supplier_id, totalAmount, notes || '']);

            const poId = result.lastInsertId;

            for (let item of items) {
                await query(`
                    INSERT INTO po_items (po_id, medication_id, quantity, unit_cost, batch_number, expiry_date)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [poId, item.medication_id, item.quantity, item.unit_cost, item.batch_number || null, item.expiry_date || null]);
            }

            await query('COMMIT');
            return this.getById(pharmacyId, poId);
        } catch (e) {
            await query('ROLLBACK');
            throw e;
        }
    }

    static async getById(pharmacyId, id) {
        const res = await query('SELECT * FROM purchase_orders WHERE id = ? AND pharmacy_id = ?', [id, pharmacyId]);
        const po = res.rows[0];
        if (!po) return null;

        const itemsRes = await query(`
            SELECT pi.*, m.name as medication_name 
            FROM po_items pi
            JOIN medications m ON m.id = pi.medication_id
            WHERE pi.po_id = ?
        `, [id]);

        return { ...po, items: itemsRes.rows };
    }

    static async receiveOrder(pharmacyId, id) {
        const res = await query('SELECT * FROM purchase_orders WHERE id = ? AND pharmacy_id = ?', [id, pharmacyId]);
        const po = res.rows[0];

        if (!po) throw new Error('Order not found');
        if (po.status !== 'pending') throw new Error('Order is already ' + po.status);

        const itemsRes = await query('SELECT * FROM po_items WHERE po_id = ?', [id]);
        const items = itemsRes.rows;

        await query('BEGIN');
        try {
            await query('UPDATE purchase_orders SET status = \'received\', received_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

            for (let item of items) {
                await query(`
                    INSERT INTO medication_batches (medication_id, batch_number, expiry_date, quantity)
                    VALUES (?, ?, ?, ?)
                `, [item.medication_id, item.batch_number || 'AUTO-' + Date.now(), item.expiry_date || null, item.quantity]);

                await query('UPDATE medications SET quantity = quantity + ?, cost_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [item.quantity, item.unit_cost, item.medication_id]);
            }
            await query('COMMIT');
        } catch (e) {
            await query('ROLLBACK');
            throw e;
        }
        return { success: true };
    }
}

module.exports = PurchaseOrderService;
