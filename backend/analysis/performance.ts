import { api } from "encore.dev/api";
import { analysisDB } from "./db";

interface PerformanceStats {
  totalTrades: number;
  winRate: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
  avgConfidence: number;
}

// Retrieves AI model performance statistics.
export const getPerformance = api<void, PerformanceStats>(
  { expose: true, method: "GET", path: "/analysis/performance" },
  async () => {
    const stats = await analysisDB.queryRow`
      SELECT 
        COUNT(*) as total_trades,
        AVG(CASE WHEN profit_loss > 0 THEN 1 ELSE 0 END) * 100 as win_rate,
        AVG(CASE WHEN profit_loss > 0 THEN profit_loss END) as avg_profit,
        AVG(CASE WHEN profit_loss < 0 THEN profit_loss END) as avg_loss,
        MAX(profit_loss) as best_trade,
        MIN(profit_loss) as worst_trade,
        AVG(confidence) as avg_confidence
      FROM trading_signals 
      WHERE profit_loss IS NOT NULL
    `;

    const totalProfit = await analysisDB.queryRow`
      SELECT SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) as total_profit
      FROM trading_signals WHERE profit_loss IS NOT NULL
    `;

    const totalLoss = await analysisDB.queryRow`
      SELECT ABS(SUM(CASE WHEN profit_loss < 0 THEN profit_loss ELSE 0 END)) as total_loss
      FROM trading_signals WHERE profit_loss IS NOT NULL
    `;

    const profitFactor = totalLoss?.total_loss > 0 ? 
      (totalProfit?.total_profit || 0) / (totalLoss?.total_loss || 1) : 0;

    return {
      totalTrades: parseInt(stats?.total_trades || "0"),
      winRate: parseFloat(stats?.win_rate || "0"),
      avgProfit: parseFloat(stats?.avg_profit || "0"),
      avgLoss: parseFloat(stats?.avg_loss || "0"),
      profitFactor,
      bestTrade: parseFloat(stats?.best_trade || "0"),
      worstTrade: parseFloat(stats?.worst_trade || "0"),
      avgConfidence: parseFloat(stats?.avg_confidence || "0"),
    };
  }
);
