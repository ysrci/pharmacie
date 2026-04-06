// server/src/services/PharmacyService.js
const db = require('../db/pool');

class PharmacyService {
    /**
     * البحث عن الصيدليات القريبة بناءً على الإحداثيات
     * @param {number} lat - خط العرض
     * @param {number} lng - خط الطول
     * @param {number} radius - نصف القطر بالمتر (افتراضي 5000)
     */
    async findNearbyPharmacies(lat, lng, radius = 5000) {
        // ✅ استعلام آمن مع Parameterized Query
        const query = `
            SELECT 
                p.id,
                p.name,
                p.address,
                p.phone,
                p.email,
                p.license_number,
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
        return result.rows;
    }

    /**
     * البحث عن أدوية في صيدلية محددة
     * @param {number} pharmacyId - معرف الصيدلية
     * @param {string} searchTerm - مصطلح البحث
     */
    async searchMedicationsInPharmacy(pharmacyId, searchTerm) {
        // ✅ إزالة أي أحرف خطيرة من مصطلح البحث
        const safeSearchTerm = this.sanitizeSearchTerm(searchTerm);
        
        const query = `
            SELECT 
                m.id,
                m.name,
                m.generic_name,
                m.category,
                m.description,
                mb.batch_number,
                mb.expiry_date,
                mb.quantity,
                mb.price
            FROM medications m
            JOIN medication_batches mb ON m.id = mb.medication_id
            WHERE mb.pharmacy_id = $1
            AND (m.name ILIKE $2 OR m.generic_name ILIKE $2)
            AND mb.quantity > 0
            AND mb.expiry_date > CURRENT_DATE
            ORDER BY m.name
        `;
        
        const searchPattern = `%${safeSearchTerm}%`;
        const result = await db.query(query, [pharmacyId, searchPattern]);
        return result.rows;
    }

    /**
     * البحث عن دواء في كل الصيدليات القريبة
     * @param {number} lat - خط العرض
     * @param {number} lng - خط الطول
     * @param {string} medicationName - اسم الدواء
     * @param {number} radius - نصف القطر
     */
    async searchMedicationAcrossPharmacies(lat, lng, medicationName, radius = 5000) {
        const safeMedicationName = this.sanitizeSearchTerm(medicationName);
        
        const query = `
            SELECT 
                p.id as pharmacy_id,
                p.name as pharmacy_name,
                p.address,
                p.phone,
                m.id as medication_id,
                m.name as medication_name,
                m.generic_name,
                mb.price,
                mb.quantity,
                mb.expiry_date,
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
        
        const searchPattern = `%${safeMedicationName}%`;
        const result = await db.query(query, [lng, lat, radius, searchPattern]);
        return result.rows;
    }

    /**
     * الحصول على تفاصيل صيدلية معينة
     * @param {number} pharmacyId - معرف الصيدلية
     */
    async getPharmacyById(pharmacyId) {
        const query = `
            SELECT 
                p.id,
                p.name,
                p.address,
                p.phone,
                p.email,
                p.license_number,
                p.opening_hours,
                ST_X(p.location::geometry) as longitude,
                ST_Y(p.location::geometry) as latitude
            FROM pharmacies p
            WHERE p.id = $1
        `;
        
        const result = await db.query(query, [pharmacyId]);
        return result.rows[0] || null;
    }

    /**
     * البحث عن الصيدليات حسب الاسم أو العنوان
     * @param {string} searchTerm - مصطلح البحث
     */
    async searchPharmaciesByName(searchTerm) {
        const safeSearchTerm = this.sanitizeSearchTerm(searchTerm);
        
        const query = `
            SELECT 
                id,
                name,
                address,
                phone,
                email
            FROM pharmacies
            WHERE name ILIKE $1 OR address ILIKE $1
            ORDER BY name
            LIMIT 20
        `;
        
        const searchPattern = `%${safeSearchTerm}%`;
        const result = await db.query(query, [searchPattern]);
        return result.rows;
    }

    /**
     * الحصول على جميع الأدوية المتوفرة في صيدلية معينة (مع فلاتر)
     * @param {number} pharmacyId - معرف الصيدلية
     * @param {Object} filters - الفلاتر (category, minPrice, maxPrice)
     */
    async getInventoryWithFilters(pharmacyId, filters = {}) {
        let query = `
            SELECT 
                m.id,
                m.name,
                m.generic_name,
                m.category,
                mb.batch_number,
                mb.expiry_date,
                mb.quantity,
                mb.price
            FROM medications m
            JOIN medication_batches mb ON m.id = mb.medication_id
            WHERE mb.pharmacy_id = $1
            AND mb.quantity > 0
        `;
        
        const queryParams = [pharmacyId];
        let paramIndex = 2;
        
        // إضافة الفلاتر بشكل آمن
        if (filters.category) {
            const safeCategory = this.sanitizeSearchTerm(filters.category);
            query += ` AND m.category = $${paramIndex}`;
            queryParams.push(safeCategory);
            paramIndex++;
        }
        
        if (filters.minPrice) {
            const minPrice = parseFloat(filters.minPrice);
            if (!isNaN(minPrice)) {
                query += ` AND mb.price >= $${paramIndex}`;
                queryParams.push(minPrice);
                paramIndex++;
            }
        }
        
        if (filters.maxPrice) {
            const maxPrice = parseFloat(filters.maxPrice);
            if (!isNaN(maxPrice)) {
                query += ` AND mb.price <= $${paramIndex}`;
                queryParams.push(maxPrice);
                paramIndex++;
            }
        }
        
        query += ` ORDER BY mb.expiry_date ASC`; // FEFO: الأقرب للانتهاء أولاً
        
        const result = await db.query(query, queryParams);
        return result.rows;
    }

    /**
     * تعقيم مصطلح البحث (إزالة الأحرف الخطيرة)
     * @param {string} term - مصطلح البحث الأصلي
     * @returns {string} - مصطلح البحث المعقم
     */
    sanitizeSearchTerm(term) {
        if (!term) return '';
        
        // تحويل إلى string
        let safe = String(term);
        
        // إزالة الأحرف الخطيرة
        safe = safe.replace(/['";\\%_]/g, '');
        
        // الحد من الطول (منع هجمات DoS)
        if (safe.length > 100) {
            safe = safe.substring(0, 100);
        }
        
        return safe;
    }

    /**
     * التحقق من صحة الإحداثيات
     * @param {number} lat - خط العرض
     * @param {number} lng - خط الطول
     * @returns {boolean} - صحة الإحداثيات
     */
    validateCoordinates(lat, lng) {
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        
        if (isNaN(latNum) || isNaN(lngNum)) {
            return false;
        }
        
        if (latNum < -90 || latNum > 90) {
            return false;
        }
        
        if (lngNum < -180 || lngNum > 180) {
            return false;
        }
        
        return true;
    }
}

module.exports = new PharmacyService();
