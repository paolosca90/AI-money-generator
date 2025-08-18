import { api } from "encore.dev/api";
import { TradingSignal, generateSignalForSymbol } from "./signal-generator";

// A simplified signal for the dashboard
export interface AutoSignal {
  symbol: string;
  direction: "LONG" | "SHORT";
  confidence: number;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  riskRewardRatio: number;
  strategy: string;
  timeframe: string;
  analysis: {
    rsi: number;
    macd: number;
    trend: string;
    volatility: string;
  };
}

interface GetTopSignalsResponse {
  signals: AutoSignal[];
}

const SYMBOLS_TO_SCAN = [
  "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD", 
  "XAUUSD", 
  "US500", "US100"
];

// Retrieves the top 3 trading signals for the dashboard.
export const getTopSignals = api<void, GetTopSignalsResponse>({
  method: "GET",
  path: "/analysis/top-signals",
  expose: true,
}, async () => {
  console.log("🚀 Generating top signals for dashboard...");

  const allSignals: TradingSignal[] = [];
  for (const symbol of SYMBOLS_TO_SCAN) {
    try {
      // Sequentially generate signals to avoid overwhelming MT5 or external APIs
      const signal = await generateSignalForSymbol(symbol);
      allSignals.push(signal);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Error generating signal for ${symbol}:`, errorMessage);
    }
  }

  const sortedSignals = allSignals.sort((a, b) => b.confidence - a.confidence);

  const top3Signals = sortedSignals.slice(0, 3);

  const autoSignals: AutoSignal[] = top3Signals.map(s => ({
    symbol: s.symbol,
    direction: s.direction,
    confidence: s.confidence,
    entryPrice: s.entryPrice,
    takeProfit: s.takeProfit,
    stopLoss: s.stopLoss,
    riskRewardRatio: s.riskRewardRatio,
    strategy: s.strategy,
    timeframe: s.analysis.strategy.timeframes[0] || '15m',
    analysis: {
      rsi: s.analysis.technical.rsi,
      macd: s.analysis.technical.macd,
      trend: s.analysis.technical.trend,
      volatility: s.analysis.enhancedTechnical.volatilityState,
    }
  }));

  console.log(`✅ Top 3 signals generated: ${autoSignals.map(s => `${s.symbol} (${s.confidence}%)`).join(', ')}`);

  return { signals: autoSignals };
});
