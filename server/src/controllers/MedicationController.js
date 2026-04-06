const db = require('../db/pool');

class MedicationController {
    // البحث عن الأدوية
    async searchMedications(req, res) {
        try {
            const { search, category, minPrice, maxPrice } = req.query;
            
            let query = `
                SELECT DISTINCT 
                    m.id, m.name, m.generic_name, m.category, 
                    MIN(mb.price) as min_price,
                    COUNT(mb.id) as pharmacies_count
                FROM medications m
                JOIN medication_batches mb ON m.id = mb.medication_id
                WHERE mb.quantity > 0 AND mb.expiry_date > CURRENT_DATE
            `;
            
            const params = [];
            let paramIndex = 1;
            
            if (search) {
                query += ` AND (m.name ILIKE $${paramIndex} OR m.generic_name ILIKE $${paramIndex})`;
                params.push(`%${search}%`);
                paramIndex++;
            }
            
            if (category && category !== 'all') {
                query += ` AND m.category = $${paramIndex}`;
                params.push(category);
                paramIndex++;
            }
            
            if (minPrice) {
                query += ` AND mb.price >= $${paramIndex}`;
                params.push(parseFloat(minPrice));
                paramIndex++;
            }
            
            if (maxPrice) {
                query += ` AND mb.price <= $${paramIndex}`;
                params.push(parseFloat(maxPrice));
                paramIndex++;
            }
            
            query += ` GROUP BY m.id ORDER BY m.name LIMIT 50`;
            
            const result = await db.query(query, params);
            
            res.json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });
        } catch (error) {
            console.error('Search medications error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to search medications'
            });
        }
    }
    
    // الحصول على دواء بواسطة ID
    async getMedicationById(req, res) {
        try {
            const { id } = req.params;
            
            const query = `
                SELECT m.*, 
                    json_agg(DISTINCT jsonb_build_object(
                        'pharmacy_id', p.id,
                        'pharmacy_name', p.name,
                        'price', mb.price,
                        'quantity', mb.quantity,
                        'expiry_date', mb.expiry_date
                    )) as pharmacies
                FROM medications m
                JOIN medication_batches mb ON m.id = mb.medication_id
                JOIN pharmacies p ON mb.pharmacy_id = p.id
                WHERE m.id = $1 AND mb.quantity > 0
                GROUP BY m.id
            `;
            
            const result = await db.query(query, [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Medication not found'
                });
            }
            
            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Get medication error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch medication'
            });
        }
    }
    
    // إنشاء دواء جديد
    async createMedication(req, res) {
        try {
            const { name, generic_name, category, description } = req.body;
            
            if (!name || !category) {
                return res.status(400).json({
                    success: false,
                    error: 'Name and category are required'
                });
            }
            
            const query = `
                INSERT INTO medications (name, generic_name, category, description)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            
            const result = await db.query(query, [name, generic_name, category, description]);
            
            res.status(201).json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Create medication error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create medication'
            });
        }
    }
    
    // تحديث دواء
    async updateMedication(req, res) {
        try {
            const { id } = req.params;
            const { name, generic_name, category, description } = req.body;
            
            const query = `
                UPDATE medications 
                SET name = COALESCE($1, name),
                    generic_name = COALESCE($2, generic_name),
                    category = COALESCE($3, category),
                    description = COALESCE($4, description),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $5
                RETURNING *
            `;
            
            const result = await db.query(query, [name, generic_name, category, description, id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Medication not found'
                });
            }
            
            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Update medication error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update medication'
            });
        }
    }
    
    // حذف دواء
    async deleteMedication(req, res) {
        try {
            const { id } = req.params;
            
            const result = await db.query('DELETE FROM medications WHERE id = $1 RETURNING id', [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Medication not found'
                });
            }
            
            res.json({
                success: true,
                message: 'Medication deleted successfully'
            });
        } catch (error) {
            console.error('Delete medication error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete medication'
            });
        }
    }
}

module.exports = new MedicationController();
