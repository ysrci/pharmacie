const pool = require('../db/pool');

class CustomerService {
    static async getAll(pharmacyId) {
        const res = await pool.query(
            'SELECT * FROM customers WHERE pharmacy_id = $1 ORDER BY name',
            [pharmacyId]
        );
        return res.rows;
    }

    static async getById(pharmacyId, id) {
        const [customerRes, salesRes, prescriptionsRes] = await Promise.all([
            pool.query(
                'SELECT * FROM customers WHERE id = $1 AND pharmacy_id = $2',
                [id, pharmacyId]
            ),
            pool.query(
                `SELECT s.*, m.name AS medication_name
                 FROM sales s
                 JOIN medications m ON m.id = s.medication_id
                 WHERE s.customer_id = $1
                 ORDER BY s.created_at DESC`,
                [id]
            ),
            pool.query(
                'SELECT * FROM prescriptions WHERE customer_id = $1',
                [id]
            )
        ]);

        const customer = customerRes.rows[0];
        if (!customer) return null;

        return {
            ...customer,
            sales: salesRes.rows,
            prescriptions: prescriptionsRes.rows
        };
    }

    static async create(pharmacyId, data) {
        const { name, phone, email } = data;
        const result = await pool.query(
            `INSERT INTO customers (pharmacy_id, name, phone, email)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [pharmacyId, name, phone || '', email || '']
        );
        return result.rows[0];
    }

    static async update(pharmacyId, id, data) {
        const { name, phone, email } = data;
        const result = await pool.query(
            `UPDATE customers SET name = $1, phone = $2, email = $3
             WHERE id = $4 AND pharmacy_id = $5
             RETURNING *`,
            [name, phone, email, id, pharmacyId]
        );
        if (result.rowCount === 0) throw new Error('Customer not found');
        return result.rows[0];
    }

    static async delete(pharmacyId, id) {
        const result = await pool.query(
            'DELETE FROM customers WHERE id = $1 AND pharmacy_id = $2 RETURNING id',
            [id, pharmacyId]
        );
        if (result.rowCount === 0) throw new Error('Customer not found');
        return { success: true };
    }
}

module.exports = CustomerService;
