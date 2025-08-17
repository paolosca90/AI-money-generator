import { api, APIError } from "encore.dev/api";
import { analysisDB } from "./db";
import { generateTradeId } from "./utils";
import { fetchMarketData } from "./market-data";
import { analyzeWithAI } from "./ai-engine";
import { generateChart } from "./chart-generator";
import { analyzeSentiment } from "./sentiment-analyzer";
import { 
  TradingStrategy, 
  TRADING_STRATEGIES, 
  calculateStrategyTargets, 
  getOptimalStrategy,
  getStrategyRecommendation,
  calculatePositionSize
} from "./trading-strategies";

interface PredictRequest {
  symbol: string;
  strategy?: TradingStrategy;
  riskPercentage?: number;
  accountBalance?: number;
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
  chartUrl?: string;
  strategyRecommendation: string;
  analysis: {
    technical: {
      trend: string;
      structure: string;
      keyLevels: number[];
      breakoutProbability: number;
      support: number;
      resistance: number;
      rsi: number;
      macd: number;
      atr: number;
    };
    smartMoney: {
      institutionalFlow: string;
      volumeProfile: string;
      orderFlow: string;
      liquidityZones: number[];
    };
    professional: {
      topTraders: string[];
      consensusView: string;
      riskReward: number;
      timeframe: string;
    };
    sentiment: {
      score: number;
      sources: string[];
      summary?: string;
    };
    volatility: {
      hourly: number;
      daily: number;
    };
    strategy: {
      name: string;
      description: string;
      timeframes: string[];
      marketConditions: string[];
      riskLevel: "LOW" | "MEDIUM" | "HIGH";
    };
  };
}

// Generates AI-powered trading predictions with multiple strategy options.
export const predict = api<PredictRequest, TradingSignal>(
  { expose: true, method: "POST", path: "/analysis/predict" },
  async (req) => {
    const { 
      symbol, 
      strategy: userStrategy, 
      riskPercentage = 2, 
      accountBalance = 10000 
    } = req;
    
    // Validate input parameters
    if (!symbol || symbol.trim() === "") {
      throw APIError.invalidArgument("Symbol is required");
    }

    if (riskPercentage <= 0 || riskPercentage > 10) {
      throw APIError.invalidArgument("Risk percentage must be between 0.1% and 10%");
    }

    if (accountBalance <= 0) {
      throw APIError.invalidArgument("Account balance must be greater than 0");
    }
    
    const tradeId = generateTradeId(symbol);

    try {
      // Fetch multi-timeframe market data
      console.log(`Starting prediction for ${symbol} with trade ID ${tradeId}`);
      const marketData = await fetchMarketData(symbol, ["1m", "5m", "15m", "30m", "1h"]);
      
      // Check if we received any data
      const availableTimeframes = Object.keys(marketData);
      
      if (availableTimeframes.length === 0) {
        console.error(`No market data available for ${symbol}`);
        throw APIError.unavailable(
          `Unable to fetch market data for ${symbol}. The system will continue to work with simulated data for demonstration purposes.`
        );
      }
      
      console.log(`Market data available for ${symbol}: ${availableTimeframes.join(', ')}`);
      
      // Ensure we have required timeframes for strategy analysis
      const requiredTimeframes = ["5m", "15m", "30m"];
      const completeMarketData: any = {};
      
      // Find a fallback timeframe (first available, prefer 5m if exists)
      const fallbackTimeframe = availableTimeframes.includes("5m") ? "5m" : availableTimeframes[0];
      const fallbackData = (marketData as any)[fallbackTimeframe];

      for (const tf of requiredTimeframes) {
        completeMarketData[tf] = (marketData as any)[tf] || fallbackData;
      }
      
      // Add additional timeframes if available
      if ((marketData as any)["1m"]) completeMarketData["1m"] = (marketData as any)["1m"];
      if ((marketData as any)["1h"]) completeMarketData["1h"] = (marketData as any)["1h"];
      
      // Perform advanced AI analysis
      console.log(`Performing AI analysis for ${symbol}`);
      const aiAnalysis = await analyzeWithAI(completeMarketData, symbol);
      
      // Determine optimal trading strategy
      const optimalStrategy = getOptimalStrategy(completeMarketData, aiAnalysis, symbol, userStrategy);
      const strategyConfig = TRADING_STRATEGIES[optimalStrategy];
      
      console.log(`Selected strategy: ${optimalStrategy} for ${symbol}`);
      
      // Perform sentiment analysis
      console.log(`Analyzing sentiment for ${symbol}`);
      const sentimentAnalysis = await analyzeSentiment(symbol);
      
      // Calculate strategy-specific price targets
      const currentPrice = completeMarketData["5m"].close;
      const atr = completeMarketData["5m"].indicators.atr;
      
      console.log(`Calculating ${optimalStrategy} price targets for ${symbol} at price ${currentPrice}`);
      
      const priceTargets = calculateStrategyTargets(
        optimalStrategy,
        currentPrice,
        atr,
        aiAnalysis.direction,
        symbol
      );
      
      // Calculate recommended position size
      const recommendedLotSize = calculatePositionSize(
        optimalStrategy,
        accountBalance,
        riskPercentage,
        priceTargets.riskAmount
      );
      
      // Generate strategy recommendation
      const strategyRecommendation = getStrategyRecommendation(
        optimalStrategy,
        completeMarketData,
        aiAnalysis
      );
      
      // Generate chart
      console.log(`Generating chart for ${symbol}`);
      const chartUrl = await generateChart(symbol, completeMarketData, aiAnalysis);
      
      // Determine risk level based on strategy and market conditions
      const riskLevel = determineRiskLevel(optimalStrategy, aiAnalysis, completeMarketData);
      
      // Ensure confidence is an integer for database storage
      const confidenceInt = Math.round(aiAnalysis.confidence);

      // Convert maxHoldingTime to number (double precision)
      const maxHoldingTimeHours = Number(strategyConfig.maxHoldingTime);

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
        chartUrl,
        strategyRecommendation,
        analysis: {
          technical: {
            trend: aiAnalysis.priceAction.trend,
            structure: aiAnalysis.priceAction.structure,
            keyLevels: aiAnalysis.priceAction.keyLevels,
            breakoutProbability: aiAnalysis.priceAction.breakoutProbability,
            support: aiAnalysis.support,
            resistance: aiAnalysis.resistance,
            rsi: aiAnalysis.technical.rsi,
            macd: aiAnalysis.technical.macd,
            atr: aiAnalysis.technical.atr,
          },
          smartMoney: {
            institutionalFlow: aiAnalysis.smartMoney.institutionalFlow,
            volumeProfile: aiAnalysis.smartMoney.volumeProfile,
            orderFlow: aiAnalysis.smartMoney.orderFlow,
            liquidityZones: aiAnalysis.smartMoney.liquidityZones,
          },
          professional: {
            topTraders: aiAnalysis.professionalAnalysis.topTraders,
            consensusView: aiAnalysis.professionalAnalysis.consensusView,
            riskReward: aiAnalysis.professionalAnalysis.riskReward,
            timeframe: aiAnalysis.professionalAnalysis.timeframe,
          },
          sentiment: {
            score: sentimentAnalysis.score,
            sources: sentimentAnalysis.sources,
            summary: sentimentAnalysis.summary,
          },
          volatility: aiAnalysis.volatility,
          strategy: {
            name: strategyConfig.name,
            description: strategyConfig.description,
            timeframes: strategyConfig.timeframes,
            marketConditions: strategyConfig.marketConditions,
            riskLevel,
          },
        },
      };

      try {
        // Store the signal in database with strategy information
        console.log(`Storing ${optimalStrategy} signal ${tradeId} in database`);
        await analysisDB.exec`
          INSERT INTO trading_signals (
            trade_id, symbol, direction, strategy, entry_price, take_profit, stop_loss, 
            confidence, risk_reward_ratio, recommended_lot_size, max_holding_hours,
            analysis_data, created_at
          ) VALUES (
            ${tradeId}, ${symbol}, ${aiAnalysis.direction}, ${optimalStrategy}, 
            ${priceTargets.entryPrice}, ${priceTargets.takeProfit}, ${priceTargets.stopLoss}, 
            ${confidenceInt}, ${priceTargets.riskRewardRatio}, ${recommendedLotSize},
            ${maxHoldingTimeHours}, ${JSON.stringify(signal.analysis)}, NOW()
          )
        `;

        console.log(`✅ Successfully generated ${optimalStrategy} signal ${tradeId} for ${symbol}`);
      } catch (dbError) {
        console.error(`Database error storing signal ${tradeId}:`, dbError);
        // Don't throw here - return the signal even if database storage fails
        console.log(`⚠️ Signal generated but not stored in database: ${tradeId}`);
      }

      return signal;

    } catch (error) {
      console.error(`Error generating prediction for ${symbol}:`, error);
      
      // If it's already an APIError, re-throw it
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      
      // Otherwise, wrap it in a more user-friendly error
      throw APIError.internal(
        `Failed to generate trading signal for ${symbol}. This could be due to MT5 connection issues or temporary service unavailability.`
      );
    }
  }
);

function determineRiskLevel(
  strategy: TradingStrategy,
  aiAnalysis: any,
  marketData: any
): "LOW" | "MEDIUM" | "HIGH" {
  const strategyConfig = TRADING_STRATEGIES[strategy];
  const volatility = calculateMarketVolatility(marketData);
  
  // Base risk level on strategy
  let riskScore = 0;
  
  switch (strategy) {
    case "SCALPING":
      riskScore = 2; // Medium base risk due to tight stops
      break;
    case "INTRADAY":
      riskScore = 1; // Low-medium base risk
      break;
    case "SWING":
      riskScore = 3; // Higher base risk due to longer holding
      break;
  }
  
  // Adjust based on confidence
  if (aiAnalysis.confidence < 75) riskScore += 1;
  if (aiAnalysis.confidence > 90) riskScore -= 1;
  
  // Adjust based on volatility
  if (volatility > strategyConfig.volatilityThreshold * 1.5) riskScore += 1;
  if (volatility < strategyConfig.volatilityThreshold * 0.5) riskScore -= 1;
  
  // Adjust based on market structure
  if (aiAnalysis.priceAction.structure === "NEUTRAL") riskScore += 1;
  if (aiAnalysis.smartMoney.institutionalFlow === "NEUTRAL") riskScore += 1;
  
  // Convert score to risk level
  if (riskScore <= 1) return "LOW";
  if (riskScore <= 3) return "MEDIUM";
  return "HIGH";
}

function calculateMarketVolatility(marketData: any): number {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];
  
  // Calculate average volatility across timeframes
  const volatilities = [
    data5m.indicators.atr / data5m.close,
    data15m.indicators.atr / data15m.close,
    data30m.indicators.atr / data30m.close
  ];
  
  return volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length;
}
