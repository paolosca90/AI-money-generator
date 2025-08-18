import { api, APIError } from "encore.dev/api";
import { analysisDB } from "./db";
import { getAuthData } from "~encore/auth";

interface FeedbackRequest {
  tradeId: string;
  actualDirection: "LONG" | "SHORT";
  profitLoss: number;
}

interface FeedbackResponse {
  success: boolean;
}

// Records trading results for AI model improvement.
export const recordFeedback = api<FeedbackRequest, FeedbackResponse>(
  { 
    expose: true, 
    method: "POST", 
    path: "/analysis/feedback", 
    auth: true 
  },
  async (req) => {
    const auth = getAuthData()!;
    console.log("Feedback endpoint called for user:", auth.userID, "email:", auth.email);
    
    const { tradeId, actualDirection, profitLoss } = req;

    // Get the original prediction for performance tracking and authorization
    const signal = await analysisDB.queryRow`
      SELECT direction, confidence, user_id FROM trading_signals 
      WHERE trade_id = ${tradeId}
    `;

    if (!signal) {
      throw APIError.notFound("Trade signal not found.");
    }

    if (signal.user_id !== auth.userID) {
      throw APIError.permissionDenied("You are not authorized to record feedback for this trade.");
    }

    // Update the trading signal with actual results
    await analysisDB.exec`
      UPDATE trading_signals 
      SET closed_at = NOW(), profit_loss = ${profitLoss}, status = 'closed'
      WHERE trade_id = ${tradeId}
    `;

    // Record performance data for model improvement
    await analysisDB.exec`
      INSERT INTO ai_model_performance (
        model_version, trade_id, predicted_direction, actual_direction, 
        confidence, profit_loss, created_at
      ) VALUES (
        'v1.0', ${tradeId}, ${signal.direction}, ${actualDirection}, 
        ${signal.confidence}, ${profitLoss}, NOW()
      )
    `;

    return { success: true };
  }
);
