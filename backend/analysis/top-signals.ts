import { api } from "encore.dev/api";
import { TradingSignal, generateSignalForSymbol } from "./signal-generator";
import { analysisDB } from "./db";
import { recordSignalAnalytics } from "./analytics-tracker";

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
  const analyticsData: Array<{
    symbol: string;
    signal: TradingSignal;
    generationTime: number;
    marketConditions: any;
  }> = [];

  for (const symbol of SYMBOLS_TO_SCAN) {
    try {
      const startTime = Date.now();
      
      // Sequentially generate signals to avoid overwhelming MT5 or external APIs
      const signal = await generateSignalForSymbol(symbol);
      
      const generationTime = Date.now() - startTime;
      
      allSignals.push(signal);
      
      // Collect analytics data for each signal
      analyticsData.push({
        symbol,
        signal,
        generationTime,
        marketConditions: {
          sessionType: signal.analysis?.enhancedTechnical?.marketContext?.sessionType || 'UNKNOWN',
          volatilityState: signal.analysis?.enhancedTechnical?.multiTimeframeAnalysis?.volatilityState || 'UNKNOWN',
          trendAlignment: signal.analysis?.enhancedTechnical?.multiTimeframeAnalysis?.trendAlignment || 'UNKNOWN',
          confluence: signal.analysis?.enhancedTechnical?.multiTimeframeAnalysis?.confluence || 0
        }
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Error generating signal for ${symbol}:`, errorMessage);
      
      // Record failed signal generation for analytics
      await recordSignalAnalytics({
        symbol,
        success: false,
        error: errorMessage,
        generationTime: 0,
        timestamp: new Date()
      });
    }
  }

  // Record successful signal analytics in batch
  for (const data of analyticsData) {
    await recordSignalAnalytics({
      symbol: data.symbol,
      success: true,
      signal: data.signal,
      generationTime: data.generationTime,
      marketConditions: data.marketConditions,
      timestamp: new Date()
    });
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

  // Store aggregated analytics for ML improvement
  await storeAggregatedAnalytics(allSignals, analyticsData);

  return { signals: autoSignals };
});

async function storeAggregatedAnalytics(signals: TradingSignal[], analyticsData: any[]) {
  try {
    // Calculate aggregated metrics
    const totalSignals = signals.length;
    const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / totalSignals;
    const avgGenerationTime = analyticsData.reduce((sum, d) => sum + d.generationTime, 0) / totalSignals;
    
    // Count by direction
    const longSignals = signals.filter(s => s.direction === 'LONG').length;
    const shortSignals = signals.filter(s => s.direction === 'SHORT').length;
    
    // Count by strategy
    const strategyCounts = signals.reduce((acc, s) => {
      acc[s.strategy] = (acc[s.strategy] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Count by market conditions
    const sessionCounts = analyticsData.reduce((acc, d) => {
      const session = d.marketConditions.sessionType;
      acc[session] = (acc[session] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Store in analytics table
    await analysisDB.exec`
      INSERT INTO signal_generation_analytics (
        generation_timestamp,
        total_signals_generated,
        avg_confidence,
        avg_generation_time_ms,
        long_signals_count,
        short_signals_count,
        strategy_distribution,
        session_distribution,
        symbols_analyzed,
        market_conditions_summary
      ) VALUES (
        NOW(),
        ${totalSignals},
        ${avgConfidence},
        ${avgGenerationTime},
        ${longSignals},
        ${shortSignals},
        ${JSON.stringify(strategyCounts)},
        ${JSON.stringify(sessionCounts)},
        ${JSON.stringify(SYMBOLS_TO_SCAN)},
        ${JSON.stringify({
          avgConfluence: analyticsData.reduce((sum, d) => sum + d.marketConditions.confluence, 0) / totalSignals,
          volatilityStates: analyticsData.reduce((acc, d) => {
            const vol = d.marketConditions.volatilityState;
            acc[vol] = (acc[vol] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        })}
      )
    `;
    
    console.log(`📊 Stored aggregated analytics for ${totalSignals} signals`);
  } catch (error) {
    console.error('Error storing aggregated analytics:', error);
  }
}
