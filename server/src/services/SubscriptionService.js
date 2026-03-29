const { query } = require('../config/db');

/**
 * Subscription Service: Manages SaaS tiers and billing status.
 */
class SubscriptionService {
    static async getSubscription(pharmacyId) {
        const res = await query('SELECT * FROM subscriptions WHERE pharmacy_id = ?', [pharmacyId]);
        return res.rows[0];
    }

    static async checkAccess(pharmacyId, feature) {
        const sub = await this.getSubscription(pharmacyId);
        if (!sub || sub.status !== 'active') return false;

        // Tier-based logic
        const tiers = {
            'basic': ['inventory', 'sales'],
            'pro': ['inventory', 'sales', 'customers', 'alerts', 'reports'],
            'enterprise': ['inventory', 'sales', 'customers', 'alerts', 'reports', 'multi_branch', 'api_access']
        };

        const allowedFeatures = tiers[sub.tier] || [];
        return allowedFeatures.includes(feature) || sub.tier === 'enterprise';
    }

    static async updateTier(pharmacyId, tier) {
        await query(`
            UPDATE subscriptions 
            SET tier = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE pharmacy_id = ?
        `, [tier, pharmacyId]);
        return { success: true };
    }
}

module.exports = SubscriptionService;
