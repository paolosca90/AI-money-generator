export function generateTradeId(symbol: string): string {
  const prefix = symbol.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, "0");
  
  return `${prefix}-${timestamp}${random}`;
}

export function formatPrice(price: number, decimals: number = 5): string {
  return price.toFixed(decimals);
}

export function calculateRiskReward(entryPrice: number, takeProfit: number, stopLoss: number): number {
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  
  return reward / risk;
}

export function validateSymbol(symbol: string): boolean {
  const validSymbols = [
    "BTCUSD", "ETHUSD", "EURUSD", "GBPUSD", "USDJPY", 
    "AUDUSD", "USDCAD", "USDCHF", "NZDUSD", "XAUUSD",
    "CRUDE", "BRENT", "NATGAS"
  ];
  
  return validSymbols.includes(symbol.toUpperCase());
}
