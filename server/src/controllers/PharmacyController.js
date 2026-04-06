const db = require('../db/pool');

class PharmacyController {
    // البحث عن الصيدليات القريبة
    async getNearbyPharmacies(req, res) {
        try {
            const { lat, lng, radius = 5000 } = req.query;
            
            if (!lat || !lng) {
                return res.status(400).json({
                    success: false,
                    error: 'Latitude and longitude are required'
                });
            }
            
            const query = `
                SELECT 
                    p.id, p.name, p.address, p.phone, p.email,
                    ST_Distance(
                        p.location::geography,
                        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                    ) as distance
                FROM pharmacies p
                WHERE ST_DWithin(
                    p.location::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                    $3
                )
                ORDER BY distance
                LIMIT 50
            `;
            
            const result = await db.query(query, [lng, lat, radius]);
            
            res.json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });
        } catch (error) {
            console.error('getNearbyPharmacies error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch nearby pharmacies'
            });
        }
    }
    
    // البحث عن دواء في الصيدليات القريبة
    async searchMedication(req, res) {
        try {
            const { lat, lng, name, radius = 5000 } = req.query;
            
            if (!lat || !lng || !name) {
                return res.status(400).json({
                    success: false,
                    error: 'Latitude, longitude, and medication name are required'
                });
            }
            
            const query = `
                SELECT 
                    p.id as pharmacy_id, p.name as pharmacy_name, p.address, p.phone,
                    m.id as medication_id, m.name as medication_name,
                    mb.price, mb.quantity, mb.expiry_date,
                    ST_Distance(
                        p.location::geography,
                        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                    ) as distance
                FROM pharmacies p
                JOIN medication_batches mb ON p.id = mb.pharmacy_id
                JOIN medications m ON mb.medication_id = m.id
                WHERE ST_DWithin(
                    p.location::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                    $3
                )
                AND (m.name ILIKE $4 OR m.generic_name ILIKE $4)
                AND mb.quantity > 0
                AND mb.expiry_date > CURRENT_DATE
                ORDER BY distance, mb.price
                LIMIT 100
            `;
            
            const searchPattern = `%${name}%`;
            const result = await db.query(query, [lng, lat, radius, searchPattern]);
            
            res.json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });
        } catch (error) {
            console.error('searchMedication error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to search for medication'
            });
        }
    }
    
    // الحصول على تفاصيل صيدلية
    async getPharmacyDetails(req, res) {
        try {
            const { id } = req.params;
            
            const query = `
                SELECT id, name, address, phone, email, license_number
                FROM pharmacies
                WHERE id = $1
            `;
            
            const result = await db.query(query, [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Pharmacy not found'
                });
            }
            
            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('getPharmacyDetails error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch pharmacy details'
            });
        }
    }
    
    // الحصول على مخزون الصيدلية الخاصة بي
    async getMyInventory(req, res) {
        try {
            const pharmacyId = req.user.pharmacyId;
            
            if (!pharmacyId) {
                return res.status(400).json({
                    success: false,
                    error: 'No pharmacy associated with this account'
                });
            }
            
            const query = `
                SELECT 
                    m.id, m.name, m.generic_name, m.category,
                    mb.batch_number, mb.expiry_date, mb.quantity, mb.price
                FROM medications m
                JOIN medication_batches mb ON m.id = mb.medication_id
                WHERE mb.pharmacy_id = $1
                AND mb.quantity > 0
                ORDER BY mb.expiry_date ASC
            `;
            
            const result = await db.query(query, [pharmacyId]);
            
            res.json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });
        } catch (error) {
            console.error('getMyInventory error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch inventory'
            });
        }
    }
    
    // تحديث المخزون
    async updateMyInventory(req, res) {
        try {
            const pharmacyId = req.user.pharmacyId;
            const { medicationId } = req.params;
            const { quantity, price } = req.body;
            
            if (!pharmacyId) {
                return res.status(400).json({
                    success: false,
                    error: 'No pharmacy associated with this account'
                });
            }
            
            // تحديث الكمية والسعر
            const query = `
                UPDATE medication_batches
                SET quantity = COALESCE($1, quantity),
                    price = COALESCE($2, price),
                    updated_at = CURRENT_TIMESTAMP
                WHERE pharmacy_id = $3 AND medication_id = $4
                RETURNING *
            `;
            
            const result = await db.query(query, [quantity, price, pharmacyId, medicationId]);
            
            res.json({
                success: true,
                message: 'Inventory updated successfully',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('updateMyInventory error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update inventory'
            });
        }
    }
    
    // إحصائيات الصيدلية
    async getMyStats(req, res) {
        try {
            const pharmacyId = req.user.pharmacyId;
            
            const query = `
                SELECT 
                    COUNT(DISTINCT m.id) as total_medications,
                    SUM(mb.quantity) as total_stock,
                    AVG(mb.price) as avg_price,
                    COUNT(CASE WHEN mb.expiry_date < NOW() + INTERVAL '30 days' THEN 1 END) as expiring_soon
                FROM medication_batches mb
                JOIN medications m ON mb.medication_id = m.id
                WHERE mb.pharmacy_id = $1
            `;
            
            const result = await db.query(query, [pharmacyId]);
            
            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('getMyStats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch statistics'
            });
        }
    }
    
    // مسارات المسؤول
    async getAllPharmacies(req, res) {
        try {
            const result = await db.query(`
                SELECT p.*, u.name as owner_name
                FROM pharmacies p
                LEFT JOIN users u ON p.owner_id = u.id
                ORDER BY p.created_at DESC
            `);
            
            res.json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });
        } catch (error) {
            console.error('getAllPharmacies error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch pharmacies'
            });
        }
    }
    
    async createPharmacy(req, res) {
        try {
            const { name, address, phone, email, owner_id } = req.body;
            
            const result = await db.query(
                `INSERT INTO pharmacies (name, address, phone, email, owner_id)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [name, address, phone, email, owner_id]
            );
            
            res.status(201).json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('createPharmacy error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create pharmacy'
            });
        }
    }
    
    async deletePharmacy(req, res) {
        try {
            const { id } = req.params;
            
            await db.query('DELETE FROM pharmacies WHERE id = $1', [id]);
            
            res.json({
                success: true,
                message: 'Pharmacy deleted successfully'
            });
        } catch (error) {
            console.error('deletePharmacy error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete pharmacy'
            });
        }
    }
}

module.exports = new PharmacyController();
