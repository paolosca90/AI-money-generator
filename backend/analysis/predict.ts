import { api, APIError } from "encore.dev/api";
import { analysisDB } from "./db";
import { TradingStrategy } from "./trading-strategies";
import { TradingSignal, generateSignalForSymbol } from "./signal-generator";
import { user } from "~encore/clients";

interface PredictRequest {
  symbol: string;
  strategy?: TradingStrategy;
}

export interface TradingSignal {
  tradeId: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  strategy: TradingStrategy;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  confidence: number;
  riskRewardRatio: number;
  recommendedLotSize: number;
  maxHoldingTime: number;
  expiresAt: Date;
  chartUrl?: string;
  strategyRecommendation: string;
  analysis: any;
  // NEW: Enhanced institutional analysis
  institutionalAnalysis?: any; // Will contain InstitutionalAnalysis data
  enhancedConfidence?: any; // Will contain EnhancedConfidenceResult data
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

for (const tf of requiredTimeframes) {
        completeMarketData[tf] = (marketData as any)[tf] || fallbackData;
      }
      if ((marketData as any)["1m"]) completeMarketData["1m"] = (marketData as any)["1m"];
      if ((marketData as any)["1h"]) completeMarketData["1h"] = (marketData as any)["1h"];
      
      console.log(`Performing AI analysis for ${symbol}`);
      const aiAnalysis = await analyzeWithAI(completeMarketData, symbol);
      
      const optimalStrategy = getOptimalStrategy(completeMarketData, aiAnalysis, symbol, userStrategy);
      const strategyConfig = TRADING_STRATEGIES[optimalStrategy];
      
      console.log(`Selected strategy: ${optimalStrategy} for ${symbol}`);
      
      const sentimentAnalysis = await analyzeSentiment(symbol);
      
      const currentPrice = completeMarketData["5m"].close;
      const atr = completeMarketData["5m"].indicators.atr;
      
      const priceTargets = calculateStrategyTargets(
        optimalStrategy, currentPrice, atr, aiAnalysis.direction, symbol
      );
      
      const recommendedLotSize = calculatePositionSize(
        optimalStrategy, accountBalance, riskPercentage, priceTargets.riskAmount
      );
      
      const strategyRecommendation = getStrategyRecommendation(optimalStrategy, completeMarketData, aiAnalysis);
      
      const chartUrl = await generateChart(symbol, completeMarketData, aiAnalysis);
      
      const riskLevel = determineRiskLevel(optimalStrategy, aiAnalysis, completeMarketData);
      
      const confidenceInt = Math.round(aiAnalysis.confidence);
      const maxHoldingTimeHours = Number(strategyConfig.maxHoldingTime);
      const expiresAt = calculateExpirationTime(optimalStrategy, maxHoldingTimeHours);

      const signal: TradingSignal = {
        tradeId,
        symbol,
        direction: aiAnalysis.direction,
        strategy: optimalStrategy,
        entryPrice: priceTargets.entryPrice,
        takeProfit: priceTargets.takeProfit,
        stopLoss: priceTargets.stopLoss,
        confidence: confidenceInt,
        riskRewardRatio: priceTargets.riskRewardRatio,
        recommendedLotSize,
        maxHoldingTime: maxHoldingTimeHours,
        expiresAt,
        chartUrl,
        strategyRecommendation,
        analysis: {
          technical: { ...aiAnalysis.technical, ...aiAnalysis.priceAction, support: aiAnalysis.support, resistance: aiAnalysis.resistance },
          smartMoney: aiAnalysis.smartMoney,
          professional: aiAnalysis.professionalAnalysis,
          sentiment: { ...sentimentAnalysis, summary: sentimentAnalysis.summary },
          volatility: aiAnalysis.volatility,
          strategy: { name: strategyConfig.name, description: strategyConfig.description, timeframes: strategyConfig.timeframes, marketConditions: strategyConfig.marketConditions, riskLevel },
          enhancedTechnical: aiAnalysis.enhancedTechnical,
          vwap: aiAnalysis.vwap,
        },
        // NEW: Enhanced institutional analysis for improved signal quality
        institutionalAnalysis: aiAnalysis.institutionalAnalysis,
        enhancedConfidence: aiAnalysis.enhancedConfidence,
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
