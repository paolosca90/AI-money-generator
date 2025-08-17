export function generateTradeId(symbol) {
    const prefix = symbol.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, "0");
    return `${prefix}-${timestamp}${random}`;
}
export function formatPrice(price, decimals = 5) {
    return price.toFixed(decimals);
}
export function calculateRiskReward(entryPrice, takeProfit, stopLoss) {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    return reward / risk;
}
export function validateSymbol(symbol) {
    const validSymbols = [
        "BTCUSD", "ETHUSD", "EURUSD", "GBPUSD", "USDJPY",
        "AUDUSD", "USDCAD", "USDCHF", "NZDUSD", "XAUUSD",
        "CRUDE", "BRENT", "NATGAS"
    ];
    return validSymbols.includes(symbol.toUpperCase());
}
//# sourceMappingURL=utils.js.map