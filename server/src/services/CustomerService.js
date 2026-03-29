const { query } = require('../config/db');

class CustomerService {
    static async getAll(pharmacyId) {
        const res = await query('SELECT * FROM customers WHERE pharmacy_id = ? ORDER BY name', [pharmacyId]);
        return res.rows;
    }

    static async getById(pharmacyId, id) {
        const customerRes = await query('SELECT * FROM customers WHERE id = ? AND pharmacy_id = ?', [id, pharmacyId]);
        const customer = customerRes.rows[0];
        if (!customer) return null;

        const salesRes = await query(`
            SELECT s.*, m.name as medication_name 
            FROM sales s
            JOIN medications m ON m.id = s.medication_id
            WHERE s.customer_id = ?
            ORDER BY s.created_at DESC
        `, [id]);

        const prescriptionsRes = await query('SELECT * FROM prescriptions WHERE customer_id = ?', [id]);

        return { ...customer, sales: salesRes.rows, prescriptions: prescriptionsRes.rows };
    }

    static async create(pharmacyId, data) {
        const { name, phone, email } = data;
        const result = await query(`
            INSERT INTO customers (pharmacy_id, name, phone, email)
            VALUES (?, ?, ?, ?) RETURNING id
        `, [pharmacyId, name, phone || '', email || '']);

        const id = result.lastInsertId;
        const res = await query('SELECT * FROM customers WHERE id = ?', [id]);
        return res.rows[0];
    }

    static async update(pharmacyId, id, data) {
        const { name, phone, email } = data;
        await query(`
            UPDATE customers SET name=?, phone=?, email=?
            WHERE id = ? AND pharmacy_id = ?
        `, [name, phone, email, id, pharmacyId]);
        return this.getById(pharmacyId, id);
    }
}

module.exports = CustomerService;
