import { api } from "encore.dev/api";
import { analysisDB } from "./db";
// Records trading results for AI model improvement.
export const recordFeedback = api({ expose: true, method: "POST", path: "/analysis/feedback" }, async (req) => {
    const { tradeId, actualDirection, profitLoss } = req;
    // Update the trading signal with actual results
    await analysisDB.exec `
      UPDATE trading_signals 
      SET closed_at = NOW(), profit_loss = ${profitLoss}
      WHERE trade_id = ${tradeId}
    `;
    // Get the original prediction for performance tracking
    const signal = await analysisDB.queryRow `
      SELECT direction, confidence FROM trading_signals 
      WHERE trade_id = ${tradeId}
    `;
    if (signal) {
        // Record performance data for model improvement
        await analysisDB.exec `
        INSERT INTO ai_model_performance (
          model_version, trade_id, predicted_direction, actual_direction, 
          confidence, profit_loss, created_at
        ) VALUES (
          'v1.0', ${tradeId}, ${signal.direction}, ${actualDirection}, 
          ${signal.confidence}, ${profitLoss}, NOW()
        )
      `;
    }
    return { success: true };
});
//# sourceMappingURL=feedback.js.map