const { query } = require('../config/db');

class SupplierService {
    static async getAll(pharmacyId) {
        const res = await query('SELECT * FROM suppliers WHERE pharmacy_id = ? ORDER BY name', [pharmacyId]);
        return res.rows;
    }

    static async create(pharmacyId, data) {
        const { name, contact_name, email, phone, address } = data;
        const result = await query(`
            INSERT INTO suppliers (pharmacy_id, name, contact_name, email, phone, address)
            VALUES (?, ?, ?, ?, ?, ?) RETURNING id
        `, [pharmacyId, name, contact_name || '', email || '', phone || '', address || '']);

        const id = result.lastInsertId;
        const res = await query('SELECT * FROM suppliers WHERE id = ?', [id]);
        return res.rows[0];
    }

    static async update(pharmacyId, id, data) {
        const { name, contact_name, email, phone, address } = data;
        await query(`
            UPDATE suppliers SET name=?, contact_name=?, email=?, phone=?, address=?
            WHERE id = ? AND pharmacy_id = ?
        `, [name, contact_name, email, phone, address, id, pharmacyId]);

        const res = await query('SELECT * FROM suppliers WHERE id = ?', [id]);
        return res.rows[0];
    }

    static async delete(pharmacyId, id) {
        const result = await query('DELETE FROM suppliers WHERE id = ? AND pharmacy_id = ?', [id, pharmacyId]);
        if (result.changes === 0) throw new Error('Supplier not found');
        return { success: true };
    }
}

module.exports = SupplierService;
