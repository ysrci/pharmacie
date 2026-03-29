const { getDB } = require('../config/db');

class DashboardService {
    static async getStats(pharmacyId) {
        const db = getDB();

        const overall = db.prepare(`
            SELECT 
                SUM(total_price) as total_sales,
                SUM(profit) as total_profit,
                COUNT(*) as transactions_count
            FROM sales WHERE pharmacy_id = ?
        `).get(pharmacyId);

        const daily = db.prepare(`
            SELECT date(created_at) as date, SUM(total_price) as sales, SUM(profit) as profit
            FROM sales 
            WHERE pharmacy_id = ? AND created_at >= date('now', '-30 days')
            GROUP BY date(created_at)
            ORDER BY date
        `).all(pharmacyId);

        const topProducts = db.prepare(`
            SELECT m.name, SUM(s.quantity) as sold
            FROM sales s
            JOIN medications m ON m.id = s.medication_id
            WHERE s.pharmacy_id = ?
            GROUP BY s.medication_id
            ORDER BY sold DESC LIMIT 5
        `).all(pharmacyId);

        const lowStock = db.prepare(`
            SELECT name, quantity, min_stock_level 
            FROM medications 
            WHERE pharmacy_id = ? AND quantity <= min_stock_level
        `).all(pharmacyId);

        return { overall, daily, topProducts, lowStock };
    }
}

module.exports = DashboardService;
