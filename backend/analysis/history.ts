import { api } from "encore.dev/api";
import { analysisDB } from "./db";
import { TradingSignal } from "./predict";

interface ListHistoryResponse {
  signals: TradingSignal[];
}

// Retrieves the trading history.
export const listHistory = api<void, ListHistoryResponse>({
  method: "GET",
  path: "/analysis/history",
  expose: true,
}, async () => {
  const signals = await analysisDB.queryAll`
    SELECT 
      trade_id,
      symbol,
      direction,
      strategy,
      entry_price,
      take_profit,
      stop_loss,
      confidence,
      risk_reward_ratio,
      recommended_lot_size,
      max_holding_hours as "maxHoldingTime",
      expires_at as "expiresAt",
      analysis_data->>'chartUrl' as "chartUrl",
      analysis_data->>'strategyRecommendation' as "strategyRecommendation",
      analysis_data as analysis,
      created_at
    FROM trading_signals
    ORDER BY created_at DESC
    LIMIT 50
  `;

  return { signals: signals as TradingSignal[] };
});
