// أضف هاد الوظائف إلى PharmacyController.js

/**
 * الحصول على مخزون الصيدلية الخاصة بي
 * GET /api/pharmacies/my/inventory
 */
async getMyInventory(req, res) {
    try {
        const pharmacyId = req.user.pharmacyId;
        
        if (!pharmacyId) {
            return res.status(400).json({
                success: false,
                error: 'No pharmacy associated with this account'
            });
        }
        
        const inventory = await PharmacyService.getInventoryWithFilters(pharmacyId, req.query);
        
        res.json({
            success: true,
            count: inventory.length,
            data: inventory
        });
    } catch (error) {
        console.error('Error in getMyInventory:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch inventory'
        });
    }
}

/**
 * تحديث مخزون الصيدلية
 * PUT /api/pharmacies/my/inventory/:medicationId
 */
async updateMyInventory(req, res) {
    try {
        const pharmacyId = req.user.pharmacyId;
        const medicationId = parseInt(req.params.medicationId);
        const { quantity, price } = req.body;
        
        if (!pharmacyId) {
            return res.status(400).json({
                success: false,
                error: 'No pharmacy associated with this account'
            });
        }
        
        if (isNaN(medicationId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid medication ID'
            });
        }
        
        // تحديث الكمية أو السعر
        const result = await PharmacyService.updateInventory(pharmacyId, medicationId, { quantity, price });
        
        res.json({
            success: true,
            message: 'Inventory updated successfully',
            data: result
        });
    } catch (error) {
        console.error('Error in updateMyInventory:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update inventory'
        });
    }
}

/**
 * الحصول على إحصائيات الصيدلية
 * GET /api/pharmacies/my/stats
 */
async getMyStats(req, res) {
    try {
        const pharmacyId = req.user.pharmacyId;
        
        if (!pharmacyId) {
            return res.status(400).json({
                success: false,
                error: 'No pharmacy associated with this account'
            });
        }
        
        const stats = await PharmacyService.getPharmacyStats(pharmacyId);
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error in getMyStats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
}

/**
 * الحصول على جميع الصيدليات (للمسؤول)
 * GET /api/pharmacies/admin/all
 */
async getAllPharmacies(req, res) {
    try {
        const result = await db.query(`
            SELECT 
                p.id,
                p.name,
                p.address,
                p.phone,
                p.email,
                p.license_number,
                u.name as owner_name,
                u.email as owner_email,
                p.created_at
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
        console.error('Error in getAllPharmacies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pharmacies'
        });
    }
}

/**
 * إنشاء صيدلية جديدة (للمسؤول)
 * POST /api/pharmacies/admin
 */
async createPharmacy(req, res) {
    try {
        const { name, address, phone, email, ownerId, licenseNumber } = req.body;
        
        const result = await db.query(
            `INSERT INTO pharmacies (name, address, phone, email, owner_id, license_number)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [name, address, phone, email, ownerId, licenseNumber]
        );
        
        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error in createPharmacy:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create pharmacy'
        });
    }
}

/**
 * حذف صيدلية (للمسؤول)
 * DELETE /api/pharmacies/admin/:id
 */
async deletePharmacy(req, res) {
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        const pharmacyId = parseInt(req.params.id);
        
        if (isNaN(pharmacyId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid pharmacy ID'
            });
        }
        
        // حذف الصيدلية (المستخدم المرتبط سيتم حذفه تلقائياً إذا كان ON DELETE CASCADE)
        await client.query('DELETE FROM pharmacies WHERE id = $1', [pharmacyId]);
        
        await client.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Pharmacy deleted successfully'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in deletePharmacy:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete pharmacy'
        });
    } finally {
        client.release();
    }
}
