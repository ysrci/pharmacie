const pool = require('../db/pool');

class PharmacyService {
    static async getAllActive() {
        const res = await pool.query(
            `SELECT p.*, u.email,
                    (SELECT COUNT(*) FROM medications m WHERE m.pharmacy_id = p.id AND m.quantity > 0) AS med_count
             FROM pharmacies p
             JOIN users u ON u.id = p.user_id
             WHERE p.is_active = true
             ORDER BY p.name`
        );
        return res.rows;
    }

    static async getById(id) {
        const [pharmacyRes, medsRes] = await Promise.all([
            pool.query(
                `SELECT p.*, u.email
                 FROM pharmacies p
                 JOIN users u ON u.id = p.user_id
                 WHERE p.id = $1`,
                [id]
            ),
            pool.query(
                'SELECT * FROM medications WHERE pharmacy_id = $1 AND quantity > 0 ORDER BY name',
                [id]
            )
        ]);

        const pharmacy = pharmacyRes.rows[0];
        if (!pharmacy) return null;
        return { ...pharmacy, medications: medsRes.rows };
    }

    static async getProfitSettings(pharmacyId) {
        const res = await pool.query(
            'SELECT * FROM profit_settings WHERE pharmacy_id = $1',
            [pharmacyId]
        );
        if (res.rows[0]) return res.rows[0];

        // Auto-create defaults if missing
        const created = await pool.query(
            `INSERT INTO profit_settings (pharmacy_id, default_margin_percentage, default_tva_rate)
             VALUES ($1, 25, 7)
             ON CONFLICT (pharmacy_id) DO NOTHING
             RETURNING *`,
            [pharmacyId]
        );
        return created.rows[0] || { pharmacy_id: pharmacyId, default_margin_percentage: 25, default_tva_rate: 7 };
    }

    static async updateProfitSettings(pharmacyId, margin, tvaRate) {
        const result = await pool.query(
            `UPDATE profit_settings
             SET default_margin_percentage = $1,
                 default_tva_rate = COALESCE($2, default_tva_rate),
                 updated_at = NOW()
             WHERE pharmacy_id = $3
             RETURNING *`,
            [margin, tvaRate || null, pharmacyId]
        );
        if (result.rowCount === 0) throw new Error('Profit settings not found');
        return result.rows[0];
    }

    static async updateProfile(pharmacyId, data) {
        const { name, address, lat, lng, phone, open_hours } = data;
        const result = await pool.query(
            `UPDATE pharmacies
             SET name = COALESCE($1, name),
                 address = COALESCE($2, address),
                 lat = COALESCE($3, lat),
                 lng = COALESCE($4, lng),
                 phone = COALESCE($5, phone),
                 open_hours = COALESCE($6, open_hours),
                 location = CASE WHEN $3 IS NOT NULL AND $4 IS NOT NULL
                                 THEN ST_SetSRID(ST_MakePoint($4, $3), 4326)
                                 ELSE location END
             WHERE id = $7
             RETURNING *`,
            [name, address, lat, lng, phone, open_hours, pharmacyId]
        );
        return result.rows[0];
    }
}

module.exports = PharmacyService;
