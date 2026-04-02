const pool = require('../db/pool');

const TIER_FEATURES = {
    basic: ['inventory', 'sales'],
    pro: ['inventory', 'sales', 'customers', 'alerts', 'reports'],
    enterprise: ['inventory', 'sales', 'customers', 'alerts', 'reports', 'multi_branch', 'api_access']
};

class SubscriptionService {
    static async getSubscription(pharmacyId) {
        const res = await pool.query(
            'SELECT * FROM subscriptions WHERE pharmacy_id = $1',
            [pharmacyId]
        );
        return res.rows[0] || null;
    }

    static async checkAccess(pharmacyId, feature) {
        const sub = await this.getSubscription(pharmacyId);
        if (!sub || sub.status !== 'active') return false;
        if (sub.tier === 'enterprise') return true;
        return (TIER_FEATURES[sub.tier] || []).includes(feature);
    }

    static async updateTier(pharmacyId, tier) {
        if (!TIER_FEATURES[tier]) throw new Error(`Invalid tier: ${tier}`);
        const result = await pool.query(
            `UPDATE subscriptions SET tier = $1, updated_at = NOW() WHERE pharmacy_id = $2 RETURNING *`,
            [tier, pharmacyId]
        );
        if (result.rowCount === 0) throw new Error('Subscription not found');
        return result.rows[0];
    }

    static async updateStatus(pharmacyId, status) {
        const result = await pool.query(
            `UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE pharmacy_id = $2 RETURNING *`,
            [status, pharmacyId]
        );
        if (result.rowCount === 0) throw new Error('Subscription not found');
        return result.rows[0];
    }
}

module.exports = SubscriptionService;
