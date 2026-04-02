const pool = require('../db/pool');

class SupplierService {
    static async getAll(pharmacyId) {
        const res = await pool.query(
            'SELECT * FROM suppliers WHERE pharmacy_id = $1 ORDER BY name',
            [pharmacyId]
        );
        return res.rows;
    }

    static async create(pharmacyId, data) {
        const { name, contact_name, email, phone, address } = data;
        const result = await pool.query(
            `INSERT INTO suppliers (pharmacy_id, name, contact_name, email, phone, address)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [pharmacyId, name, contact_name || '', email || '', phone || '', address || '']
        );
        return result.rows[0];
    }

    static async update(pharmacyId, id, data) {
        const { name, contact_name, email, phone, address } = data;
        const result = await pool.query(
            `UPDATE suppliers
             SET name = $1, contact_name = $2, email = $3, phone = $4, address = $5
             WHERE id = $6 AND pharmacy_id = $7
             RETURNING *`,
            [name, contact_name, email, phone, address, id, pharmacyId]
        );
        if (result.rowCount === 0) throw new Error('Supplier not found');
        return result.rows[0];
    }

    static async delete(pharmacyId, id) {
        const result = await pool.query(
            'DELETE FROM suppliers WHERE id = $1 AND pharmacy_id = $2 RETURNING id',
            [id, pharmacyId]
        );
        if (result.rowCount === 0) throw new Error('Supplier not found');
        return { success: true };
    }
}

module.exports = SupplierService;
