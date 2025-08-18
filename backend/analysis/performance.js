import { api } from "encore.dev/api";
import { analysisDB } from "./db";
// Retrieves AI model performance statistics.
export const getPerformance = api({ expose: true, method: "GET", path: "/analysis/performance" }, async () => {
    const stats = await analysisDB.queryRow `
      SELECT 
        CAST(COUNT(*) AS DOUBLE PRECISION) as total_trades,
        COALESCE(CAST(AVG(CASE WHEN profit_loss > 0 THEN 1.0 ELSE 0.0 END) * 100 AS DOUBLE PRECISION), 0.0) as win_rate,
        COALESCE(CAST(AVG(CASE WHEN profit_loss > 0 THEN profit_loss END) AS DOUBLE PRECISION), 0.0) as avg_profit,
        COALESCE(CAST(AVG(CASE WHEN profit_loss < 0 THEN profit_loss END) AS DOUBLE PRECISION), 0.0) as avg_loss,
        COALESCE(CAST(MAX(profit_loss) AS DOUBLE PRECISION), 0.0) as best_trade,
        COALESCE(CAST(MIN(profit_loss) AS DOUBLE PRECISION), 0.0) as worst_trade,
        COALESCE(CAST(AVG(confidence) AS DOUBLE PRECISION), 0.0) as avg_confidence
      FROM trading_signals 
      WHERE profit_loss IS NOT NULL
    `;
    const totalProfit = await analysisDB.queryRow `
      SELECT COALESCE(CAST(SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) AS DOUBLE PRECISION), 0.0) as total_profit
      FROM trading_signals WHERE profit_loss IS NOT NULL
    `;
    const totalLoss = await analysisDB.queryRow `
      SELECT COALESCE(CAST(ABS(SUM(CASE WHEN profit_loss < 0 THEN profit_loss ELSE 0 END)) AS DOUBLE PRECISION), 0.0) as total_loss
      FROM trading_signals WHERE profit_loss IS NOT NULL
    `;
    // Handle case where there are no trades yet
    if (!stats || Number(stats.total_trades) === 0) {
        return {
            totalTrades: 0,
            winRate: 0,
            avgProfit: 0,
            avgLoss: 0,
            profitFactor: 0,
            bestTrade: 0,
            worstTrade: 0,
            avgConfidence: 0,
        };
    }
    const totalProfitValue = Number(totalProfit?.total_profit) || 0;
    const totalLossValue = Number(totalLoss?.total_loss) || 0;
    const profitFactor = totalLossValue > 0 ? totalProfitValue / totalLossValue : 0;
    return {
        totalTrades: Number(stats.total_trades) || 0,
        winRate: Number(stats.win_rate) || 0,
        avgProfit: Number(stats.avg_profit) || 0,
        avgLoss: Number(stats.avg_loss) || 0,
        profitFactor: Number(profitFactor) || 0,
        bestTrade: Number(stats.best_trade) || 0,
        worstTrade: Number(stats.worst_trade) || 0,
        avgConfidence: Number(stats.avg_confidence) || 0,
    };
});
//# sourceMappingURL=performance.js.map