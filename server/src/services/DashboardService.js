const pool = require('../db/pool');

class DashboardService {
    static async getStats(pharmacyId) {
        // Run all 4 queries in parallel — no N+1, no SQLite db.prepare()
        const [overallRes, dailyRes, topProductsRes, lowStockRes] = await Promise.all([
            pool.query(
                `SELECT
                    COALESCE(SUM(total_price), 0)  AS total_sales,
                    COALESCE(SUM(profit), 0)        AS total_profit,
                    COALESCE(SUM(net_profit), 0)    AS total_net_profit,
                    COUNT(*)                         AS transactions_count
                 FROM sales
                 WHERE pharmacy_id = $1`,
                [pharmacyId]
            ),
            pool.query(
                `SELECT
                    created_at::date                 AS date,
                    COALESCE(SUM(total_price), 0)   AS sales,
                    COALESCE(SUM(profit), 0)         AS profit
                 FROM sales
                 WHERE pharmacy_id = $1
                   AND created_at >= NOW() - INTERVAL '30 days'
                 GROUP BY created_at::date
                 ORDER BY date ASC`,
                [pharmacyId]
            ),
            pool.query(
                `SELECT m.name, SUM(s.quantity) AS sold
                 FROM sales s
                 JOIN medications m ON m.id = s.medication_id
                 WHERE s.pharmacy_id = $1
                 GROUP BY s.medication_id, m.name
                 ORDER BY sold DESC
                 LIMIT 5`,
                [pharmacyId]
            ),
            pool.query(
                `SELECT name, quantity, min_stock_level
                 FROM medications
                 WHERE pharmacy_id = $1 AND quantity <= min_stock_level
                 ORDER BY quantity ASC`,
                [pharmacyId]
            )
        ]);

        return {
            overall: overallRes.rows[0],
            daily: dailyRes.rows,
            topProducts: topProductsRes.rows,
            lowStock: lowStockRes.rows
        };
    }
}

module.exports = DashboardService;
