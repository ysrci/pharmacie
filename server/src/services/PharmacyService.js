const { query } = require('../config/db');

class PharmacyService {
    static async getAllActive() {
        const res = await query(`
            SELECT p.*, u.email,
            (SELECT COUNT(*) FROM medications m WHERE m.pharmacy_id = p.id AND m.quantity > 0) as med_count
            FROM pharmacies p
            JOIN users u ON u.id = p.user_id
            WHERE p.is_active = 1
        `);
        return res.rows;
    }

    static async getById(id) {
        const res = await query(`
            SELECT p.*, u.email
            FROM pharmacies p
            JOIN users u ON u.id = p.user_id
            WHERE p.id = ?
        `, [id]);
        const pharmacy = res.rows[0];

        if (!pharmacy) return null;

        const medsRes = await query('SELECT * FROM medications WHERE pharmacy_id = ? ORDER BY name', [id]);
        return { ...pharmacy, medications: medsRes.rows };
    }

    static async getProfitSettings(pharmacyId) {
        let res = await query('SELECT * FROM profit_settings WHERE pharmacy_id = ?', [pharmacyId]);
        let settings = res.rows[0];
        if (!settings) {
            await query('INSERT INTO profit_settings (pharmacy_id, default_margin_percentage) VALUES (?, ?)', [pharmacyId, 25]);
            settings = { pharmacy_id: pharmacyId, default_margin_percentage: 25, default_tva_rate: 7 };
        }
        return settings;
    }

    static async updateProfitSettings(pharmacyId, margin) {
        await query('UPDATE profit_settings SET default_margin_percentage = ? WHERE pharmacy_id = ?', [margin, pharmacyId]);
        return { success: true };
    }
}

module.exports = PharmacyService;
