import { api, APIError } from "encore.dev/api";
import { analysisDB } from "./db";
import { TradingStrategy } from "./trading-strategies";
import { TradingSignal, generateSignalForSymbol } from "./signal-generator";
import { user } from "~encore/clients";

interface PredictRequest {
  symbol: string;
  strategy?: TradingStrategy;
}

// Generates AI-powered trading predictions with automatic NY session closure.
export const predict = api<PredictRequest, TradingSignal>(
  { 
    expose: true, 
    method: "POST", 
    path: "/analysis/predict"
  },
  async (req) => {
    const { symbol, strategy: userStrategy } = req;
    
    if (!symbol || symbol.trim() === "") {
      throw APIError.invalidArgument("Symbol is required");
    }

    try {
      // Fetch the MT5 configuration and user preferences from the single source of truth
      const { config: mt5Config } = await user.getMt5Config();
      const { preferences } = await user.getPreferences();

      if (!mt5Config || !preferences) {
        throw APIError.failedPrecondition("MT5 configuration or user preferences are not set up. Please configure them in the settings.");
      }

      const tradeParams = {
        accountBalance: preferences.accountBalance,
        riskPercentage: preferences.riskPercentage
      };

      const signal = await generateSignalForSymbol(symbol, mt5Config, tradeParams, userStrategy);

      // Insert the generated signal into the database
      await analysisDB.exec`
        INSERT INTO trading_signals (
          trade_id, user_id, symbol, direction, strategy, entry_price, take_profit, stop_loss, 
          confidence, risk_reward_ratio, recommended_lot_size, max_holding_hours,
          expires_at, analysis_data, created_at, status
        ) VALUES (
          ${signal.tradeId}, 1, ${signal.symbol}, ${signal.direction}, ${signal.strategy}, 
          ${signal.entryPrice}, ${signal.takeProfit}, ${signal.stopLoss}, 
          ${signal.confidence}, ${signal.riskRewardRatio}, ${signal.recommendedLotSize},
          ${signal.maxHoldingTime}, ${signal.expiresAt}, ${JSON.stringify(signal.analysis)}, NOW(), 'pending'
        )
      `;
      console.log(`✅ Successfully generated and stored ${signal.strategy} signal ${signal.tradeId} for ${symbol}`);

      return signal;

    } catch (error) {
      console.error(`Error generating prediction for ${symbol}:`, error);
      if (error && typeof error === 'object' && 'code' in error) throw error;
      throw APIError.internal(`Failed to generate trading signal for ${symbol}.`);
    }
  }
);
