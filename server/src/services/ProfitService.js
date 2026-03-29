/**
 * Profit Service: Centralized logic for profit and tax (TVA) calculations.
 */
class ProfitService {
    /**
     * Calculate gross and net profit.
     * @param {number} costPrice - Unit cost price.
     * @param {number} sellPrice - Unit selling price.
     * @param {number} quantity - Quantity sold.
     * @param {number} tvaRate - TVA percentage (e.g. 7 or 20).
     */
    static calculate(costPrice, sellPrice, quantity, tvaRate = 0) {
        const totalSell = sellPrice * quantity;
        const totalCost = costPrice * quantity;
        const grossProfit = totalSell - totalCost;

        // Net profit calculation (simplified: subtracting TVA from sell price)
        // In real world, TVA is usually added on top or included.
        // Formula: Net = (Sell / (1 + TVA)) - Cost
        const taxAmount = totalSell * (tvaRate / 100);
        const netProfit = grossProfit - taxAmount;

        return {
            totalSell,
            totalCost,
            grossProfit,
            netProfit,
            taxAmount
        };
    }
}

module.exports = ProfitService;
