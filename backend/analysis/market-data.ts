import { secret } from "encore.dev/config";

const tradingViewApiKey = secret("TradingViewApiKey");

export interface MarketDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  indicators: {
    rsi: number;
    macd: number;
    atr: number;
  };
}

export interface TimeframeData {
  [timeframe: string]: MarketDataPoint;
}

export async function fetchMarketData(symbol: string, timeframes: string[]): Promise<TimeframeData> {
  const data: TimeframeData = {};

  for (const timeframe of timeframes) {
    // In a real implementation, this would fetch from TradingView API
    // For now, we'll simulate market data
    data[timeframe] = await simulateMarketData(symbol, timeframe);
  }

  return data;
}

async function simulateMarketData(symbol: string, timeframe: string): Promise<MarketDataPoint> {
  // Simulate realistic market data based on symbol
  const basePrice = getBasePrice(symbol);
  const volatility = Math.random() * 0.02; // 2% volatility
  
  const open = basePrice * (1 + (Math.random() - 0.5) * volatility);
  const close = open * (1 + (Math.random() - 0.5) * volatility);
  const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
  const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
  
  return {
    timestamp: Date.now(),
    open: Math.round(open * 100000) / 100000,
    high: Math.round(high * 100000) / 100000,
    low: Math.round(low * 100000) / 100000,
    close: Math.round(close * 100000) / 100000,
    volume: Math.floor(Math.random() * 1000000),
    indicators: {
      rsi: 30 + Math.random() * 40, // RSI between 30-70
      macd: (Math.random() - 0.5) * 0.001,
      atr: basePrice * 0.001 * (0.5 + Math.random() * 0.5), // ATR as percentage of price
    },
  };
}

function getBasePrice(symbol: string): number {
  const prices: { [key: string]: number } = {
    "BTCUSD": 45000,
    "EURUSD": 1.0850,
    "GBPUSD": 1.2650,
    "USDJPY": 150.25,
    "XAUUSD": 2050.00,
    "CRUDE": 75.50,
  };
  
  return prices[symbol] || 1.0000;
}
