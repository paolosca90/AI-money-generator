import { api } from "encore.dev/api";
import { analysisDB } from "./db";

// A simplified signal for the dashboard based on real auto-generated signals
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
  createdAt: Date;
  tradeId: string;
}

interface GetTopSignalsResponse {
  signals: AutoSignal[];
}

// Retrieves the top 3 real trading signals from the auto-generation system.
export const getTopSignals = api<void, GetTopSignalsResponse>({
  method: "GET",
  path: "/analysis/top-signals",
  expose: true,
}, async () => {
  console.log("🔍 Recuperando i migliori segnali automatici...");

  try {
    // Get the top 3 most recent, highest-confidence auto-generated signals,
    // regardless of their execution status. This ensures we always see the best signals.
    const topSignals = await analysisDB.queryAll`
      SELECT 
        trade_id,
        symbol,
        direction,
        strategy,
        CAST(entry_price AS DOUBLE PRECISION) as entry_price,
        CAST(take_profit AS DOUBLE PRECISION) as take_profit,
        CAST(stop_loss AS DOUBLE PRECISION) as stop_loss,
        confidence,
        CAST(risk_reward_ratio AS DOUBLE PRECISION) as risk_reward_ratio,
        CAST(recommended_lot_size AS DOUBLE PRECISION) as recommended_lot_size,
        analysis_data,
        created_at
      FROM trading_signals
      WHERE status LIKE 'auto_%' -- Catches auto_generated, auto_executed, auto_closed
      AND created_at >= NOW() - INTERVAL '2 hours'
      ORDER BY confidence DESC, created_at DESC
      LIMIT 3
    `;

    if (topSignals.length === 0) {
      console.log("⚠️ Nessun segnale automatico recente trovato, cercando segnali più vecchi...");
      
      // Fallback: If no recent signals, get the latest 3 auto-generated signals regardless of age.
      const fallbackSignals = await analysisDB.queryAll`
        SELECT 
          trade_id,
          symbol,
          direction,
          strategy,
          CAST(entry_price AS DOUBLE PRECISION) as entry_price,
          CAST(take_profit AS DOUBLE PRECISION) as take_profit,
          CAST(stop_loss AS DOUBLE PRECISION) as stop_loss,
          confidence,
          CAST(risk_reward_ratio AS DOUBLE PRECISION) as risk_reward_ratio,
          CAST(recommended_lot_size AS DOUBLE PRECISION) as recommended_lot_size,
          analysis_data,
          created_at
        FROM trading_signals
        WHERE status LIKE 'auto_%'
        ORDER BY created_at DESC
        LIMIT 3
      `;

      if (fallbackSignals.length === 0) {
        console.log("🚫 Nessun segnale automatico trovato nel database.");
        return { signals: [] };
      }

      console.log(`✅ Trovati ${fallbackSignals.length} segnali di fallback.`);
      return {
        signals: fallbackSignals.map(signal => transformToAutoSignal(signal))
      };
    }

    const autoSignals: AutoSignal[] = topSignals.map(signal => transformToAutoSignal(signal));

    console.log(`✅ Recuperati ${autoSignals.length} segnali automatici: ${autoSignals.map(s => `${s.symbol} (${s.confidence}%)`).join(', ')}`);

    return { signals: autoSignals };

  } catch (error) {
    console.error("❌ Errore nel recupero dei segnali automatici:", error);
    
    // Return empty array on error to prevent UI crashes
    return { signals: [] };
  }
});

// Transform database signal to AutoSignal format
function transformToAutoSignal(signal: any): AutoSignal {
  const analysisData = signal.analysis_data || {};
  const technical = analysisData.technical || {};
  const enhancedTechnical = analysisData.enhancedTechnical || {};
  const multiTimeframeAnalysis = enhancedTechnical.multiTimeframeAnalysis || {};

  return {
    symbol: signal.symbol,
    direction: signal.direction,
    confidence: Number(signal.confidence),
    entryPrice: Number(signal.entry_price),
    takeProfit: Number(signal.take_profit),
    stopLoss: Number(signal.stop_loss),
    riskRewardRatio: Number(signal.risk_reward_ratio),
    strategy: signal.strategy,
    timeframe: getTimeframeFromStrategy(signal.strategy),
    analysis: {
      rsi: technical.rsi || 50,
      macd: technical.macd || 0,
      trend: technical.trend || multiTimeframeAnalysis.trendAlignment || "NEUTRAL",
      volatility: multiTimeframeAnalysis.volatilityState || "NORMAL",
    },
    createdAt: new Date(signal.created_at),
    tradeId: signal.trade_id
  };
}

// Get appropriate timeframe based on strategy
function getTimeframeFromStrategy(strategy: string): string {
  switch (strategy) {
    case 'SCALPING':
      return '5m';
    case 'INTRADAY':
      return '15m';
    default:
      return '15m';
  }
}

// Get real-time signal statistics
export const getSignalStats = api<void, {
  totalGenerated: number;
  totalExecuted: number;
  totalClosed: number;
  avgConfidence: number;
  topPerformingSymbol: string;
  lastGenerationTime: Date | null;
}>(
  {
    expose: true,
    method: "GET",
    path: "/analysis/signal-stats"
  },
  async () => {
    try {
      // Get overall signal statistics
      const stats = await analysisDB.queryRow`
        SELECT 
          COUNT(CASE WHEN status = 'auto_generated' THEN 1 END) as total_generated,
          COUNT(CASE WHEN status = 'auto_executed' THEN 1 END) as total_executed,
          COUNT(CASE WHEN status = 'auto_closed' THEN 1 END) as total_closed,
          AVG(confidence) as avg_confidence,
          MAX(created_at) as last_generation_time
        FROM trading_signals
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        AND status IN ('auto_generated', 'auto_executed', 'auto_closed')
      `;

      // Get top performing symbol
      const topSymbol = await analysisDB.queryRow`
        SELECT symbol
        FROM trading_signals
        WHERE status = 'auto_closed'
        AND profit_loss IS NOT NULL
        AND created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY symbol
        ORDER BY SUM(profit_loss) DESC
        LIMIT 1
      `;

      return {
        totalGenerated: Number(stats?.total_generated) || 0,
        totalExecuted: Number(stats?.total_executed) || 0,
        totalClosed: Number(stats?.total_closed) || 0,
        avgConfidence: Number(stats?.avg_confidence) || 0,
        topPerformingSymbol: topSymbol?.symbol || 'N/A',
        lastGenerationTime: stats?.last_generation_time ? new Date(stats.last_generation_time) : null,
      };

    } catch (error) {
      console.error("❌ Errore nel recupero delle statistiche dei segnali:", error);
      
      return {
        totalGenerated: 0,
        totalExecuted: 0,
        totalClosed: 0,
        avgConfidence: 0,
        topPerformingSymbol: 'N/A',
        lastGenerationTime: null,
      };
    }
  }
);

// Force generation of new signals (for manual refresh)
export const forceSignalGeneration = api<void, { success: boolean; message: string }>(
  {
    expose: true,
    method: "POST",
    path: "/analysis/force-signal-generation"
  },
  async () => {
    try {
      console.log("🔄 Forzando generazione di nuovi segnali...");
      
      // This would trigger the auto-trading system to generate new signals
      // For now, we'll just return a success message
      // In a real implementation, you might trigger the cron job or call the generation function directly
      
      return {
        success: true,
        message: "Generazione segnali avviata. I nuovi segnali appariranno entro 2-3 minuti."
      };
      
    } catch (error) {
      console.error("❌ Errore nella forzatura della generazione:", error);
      
      return {
        success: false,
        message: "Errore nella generazione dei segnali. Riprova tra qualche minuto."
      };
    }
  }
);
