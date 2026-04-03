/**
 * Profit Service: Centralized logic for profit and tax (TVA) calculations.
 *
 * TVA model: sell prices are TVA-INCLUSIVE (common in DZ pharmacies).
 * Tax is therefore EXTRACTED from the sell price, not added on top.
 *
 * Formula:  taxAmount = totalSell - totalSell / (1 + tvaRate / 100)
 * Example:  price=100, tva=7% → tax = 100 - 93.46 = 6.54 DZD
 */
class ProfitService {
    /**
     * Calculate gross and net profit with correct TVA extraction.
     * @param {number} costPrice  - Unit cost price (excl. TVA).
     * @param {number} sellPrice  - Unit selling price (TVA-inclusive).
     * @param {number} quantity   - Quantity sold.
     * @param {number} tvaRate    - TVA percentage (e.g. 7 or 19).
     * @returns {{ totalSell, totalCost, grossProfit, taxAmount, netProfit }}
     */
    static calculate(costPrice, sellPrice, quantity, tvaRate = 0) {
        const totalSell = parseFloat(sellPrice) * quantity;
        const totalCost = parseFloat(costPrice) * quantity;
        const grossProfit = totalSell - totalCost;

        // Extract TVA from the inclusive sell price
        // taxAmount = S - S / (1 + r)  where r = tvaRate / 100
        const taxAmount = tvaRate > 0
            ? totalSell - totalSell / (1 + tvaRate / 100)
            : 0;

        const netProfit = grossProfit - taxAmount;

        return {
            totalSell: +totalSell.toFixed(4),
            totalCost: +totalCost.toFixed(4),
            grossProfit: +grossProfit.toFixed(4),
            taxAmount: +taxAmount.toFixed(4),
            netProfit: +netProfit.toFixed(4)
        };
    }

    /** Round a value to 2 decimal places (for display). */
    static round2(n) { return Math.round(n * 100) / 100; }
}

module.exports = ProfitService;
