import { api, APIError } from "encore.dev/api";
import { analysisDB } from "./db";
import { generateTradeId } from "./utils";
import { fetchMarketData } from "./market-data";
import { analyzeWithAI } from "./ai-engine";
import { generateChart } from "./chart-generator";
import { analyzeSentiment } from "./sentiment-analyzer";

interface PredictRequest {
  symbol: string;
}

export interface TradingSignal {
  tradeId: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  confidence: number;
  chartUrl?: string;
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
  };
}

// Generates AI-powered trading predictions for a given symbol using advanced ML and professional trading concepts.
export const predict = api<PredictRequest, TradingSignal>(
  { expose: true, method: "POST", path: "/analysis/predict" },
  async (req) => {
    const { symbol } = req;
    const tradeId = generateTradeId(symbol);

    try {
      // Fetch multi-timeframe market data with improved error handling
      console.log(`Starting prediction for ${symbol} with trade ID ${tradeId}`);
      const marketData = await fetchMarketData(symbol, ["5m", "15m", "30m"]);
      
      // Check if we received any data
      const availableTimeframes = Object.keys(marketData);
      
      if (availableTimeframes.length === 0) {
        console.error(`No market data available for ${symbol}`);
        throw APIError.unavailable(
          `Unable to fetch market data for ${symbol}. The system will continue to work with simulated data for demonstration purposes. To get real market data, please ensure your MT5 connection is properly configured.`
        );
      }
      
      // Log what data we have
      console.log(`Market data available for ${symbol}: ${availableTimeframes.join(', ')}`);
      
      // Ensure we have all required timeframes (use fallback if needed)
      const completeMarketData = {
        "5m": marketData["5m"],
        "15m": marketData["15m"],
        "30m": marketData["30m"],
      };
      
      // Perform advanced AI analysis with professional trading concepts
      console.log(`Performing AI analysis for ${symbol}`);
      const aiAnalysis = await analyzeWithAI(completeMarketData, symbol);
      
      // Perform sentiment analysis
      console.log(`Analyzing sentiment for ${symbol}`);
      const sentimentAnalysis = await analyzeSentiment(symbol);
      
      // Generate chart
      console.log(`Generating chart for ${symbol}`);
      const chartUrl = await generateChart(symbol, completeMarketData, aiAnalysis);
      
      // Calculate entry, TP, and SL based on professional risk management with improved calculations
      const currentPrice = completeMarketData["5m"].close;
      const atr = completeMarketData["5m"].indicators.atr;
      
      console.log(`Calculating price targets for ${symbol} at price ${currentPrice}`);
      
      // Calculate realistic price targets based on market structure and volatility
      const priceTargets = calculateRealisticPriceTargets(
        currentPrice, 
        atr, 
        aiAnalysis, 
        completeMarketData, 
        symbol
      );
      
      let entryPrice: number;
      let takeProfit: number;
      let stopLoss: number;
      
      if (aiAnalysis.direction === "LONG") {
        entryPrice = currentPrice;
        takeProfit = priceTargets.longTakeProfit;
        stopLoss = priceTargets.longStopLoss;
      } else {
        entryPrice = currentPrice;
        takeProfit = priceTargets.shortTakeProfit;
        stopLoss = priceTargets.shortStopLoss;
      }

      // Ensure confidence is an integer for database storage
      const confidenceInt = Math.round(aiAnalysis.confidence);

      const signal: TradingSignal = {
        tradeId,
        symbol,
        direction: aiAnalysis.direction,
        entryPrice: Math.round(entryPrice * 100000) / 100000,
        takeProfit: Math.round(takeProfit * 100000) / 100000,
        stopLoss: Math.round(stopLoss * 100000) / 100000,
        confidence: confidenceInt,
        chartUrl,
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
        },
      };

      // Store the signal in database with proper type conversion
      console.log(`Storing signal ${tradeId} in database`);
      await analysisDB.exec`
        INSERT INTO trading_signals (
          trade_id, symbol, direction, entry_price, take_profit, stop_loss, 
          confidence, analysis_data, created_at
        ) VALUES (
          ${tradeId}, ${symbol}, ${aiAnalysis.direction}, ${entryPrice}, 
          ${takeProfit}, ${stopLoss}, ${confidenceInt}, 
          ${JSON.stringify(signal.analysis)}, NOW()
        )
      `;

      console.log(`✅ Successfully generated signal ${tradeId} for ${symbol}`);
      return signal;

    } catch (error) {
      console.error(`Error generating prediction for ${symbol}:`, error);
      
      // If it's already an APIError, re-throw it
      if (error.code) {
        throw error;
      }
      
      // Otherwise, wrap it in a more user-friendly error
      throw APIError.internal(
        `Failed to generate trading signal for ${symbol}. This could be due to MT5 connection issues or temporary service unavailability. Please try again in a few moments.`
      );
    }
  }
);

function calculateRealisticPriceTargets(
  currentPrice: number,
  atr: number,
  aiAnalysis: any,
  marketData: any,
  symbol: string
) {
  // Get symbol-specific volatility and movement characteristics
  const symbolCharacteristics = getSymbolCharacteristics(symbol);
  
  // Calculate enhanced ATR based on multiple timeframes
  const enhancedATR = calculateEnhancedATR(marketData, symbolCharacteristics);
  
  // Calculate dynamic multipliers based on confidence and market conditions
  const multipliers = calculateDynamicMultipliers(aiAnalysis, symbolCharacteristics);
  
  // Calculate support and resistance levels with better spacing
  const keyLevels = calculateEnhancedKeyLevels(currentPrice, marketData, symbolCharacteristics);
  
  // Calculate realistic targets based on market structure
  const longTakeProfit = calculateLongTakeProfit(
    currentPrice, 
    enhancedATR, 
    keyLevels, 
    multipliers, 
    aiAnalysis
  );
  
  const longStopLoss = calculateLongStopLoss(
    currentPrice, 
    enhancedATR, 
    keyLevels, 
    multipliers, 
    aiAnalysis
  );
  
  const shortTakeProfit = calculateShortTakeProfit(
    currentPrice, 
    enhancedATR, 
    keyLevels, 
    multipliers, 
    aiAnalysis
  );
  
  const shortStopLoss = calculateShortStopLoss(
    currentPrice, 
    enhancedATR, 
    keyLevels, 
    multipliers, 
    aiAnalysis
  );
  
  return {
    longTakeProfit,
    longStopLoss,
    shortTakeProfit,
    shortStopLoss
  };
}

function getSymbolCharacteristics(symbol: string) {
  const characteristics = {
    "BTCUSD": {
      volatilityMultiplier: 3.0,
      minMovement: 500,      // Minimum meaningful movement in price units
      maxMovement: 5000,     // Maximum realistic movement
      supportResistanceSpacing: 1000,
      riskRewardRatio: 2.5,
      confidenceBonus: 1.2
    },
    "ETHUSD": {
      volatilityMultiplier: 2.8,
      minMovement: 50,
      maxMovement: 500,
      supportResistanceSpacing: 100,
      riskRewardRatio: 2.3,
      confidenceBonus: 1.1
    },
    "EURUSD": {
      volatilityMultiplier: 1.5,
      minMovement: 0.0050,   // 50 pips
      maxMovement: 0.0200,   // 200 pips
      supportResistanceSpacing: 0.0100,
      riskRewardRatio: 2.0,
      confidenceBonus: 1.0
    },
    "GBPUSD": {
      volatilityMultiplier: 1.8,
      minMovement: 0.0080,   // 80 pips
      maxMovement: 0.0300,   // 300 pips
      supportResistanceSpacing: 0.0150,
      riskRewardRatio: 2.2,
      confidenceBonus: 1.1
    },
    "USDJPY": {
      volatilityMultiplier: 1.6,
      minMovement: 0.50,     // 50 pips
      maxMovement: 2.00,     // 200 pips
      supportResistanceSpacing: 1.00,
      riskRewardRatio: 2.1,
      confidenceBonus: 1.0
    },
    "XAUUSD": {
      volatilityMultiplier: 2.2,
      minMovement: 10.0,     // $10
      maxMovement: 50.0,     // $50
      supportResistanceSpacing: 20.0,
      riskRewardRatio: 2.4,
      confidenceBonus: 1.2
    },
    "CRUDE": {
      volatilityMultiplier: 2.5,
      minMovement: 2.0,      // $2
      maxMovement: 8.0,      // $8
      supportResistanceSpacing: 3.0,
      riskRewardRatio: 2.3,
      confidenceBonus: 1.1
    }
  };
  
  // Default characteristics for unknown symbols
  return characteristics[symbol] || {
    volatilityMultiplier: 2.0,
    minMovement: 0.01,  // 1% of current price
    maxMovement: 0.05,  // 5% of current price
    supportResistanceSpacing: 0.02,
    riskRewardRatio: 2.0,
    confidenceBonus: 1.0
  };
}

function calculateEnhancedATR(marketData: any, characteristics: any) {
  const atr5m = marketData["5m"].indicators.atr;
  const atr15m = marketData["15m"].indicators.atr;
  const atr30m = marketData["30m"].indicators.atr;
  
  // Weighted average ATR with emphasis on longer timeframes for more stable readings
  const weightedATR = (atr5m * 0.2 + atr15m * 0.3 + atr30m * 0.5);
  
  // Apply symbol-specific volatility multiplier
  return weightedATR * characteristics.volatilityMultiplier;
}

function calculateDynamicMultipliers(aiAnalysis: any, characteristics: any) {
  // Base multipliers
  let takeProfitMultiplier = characteristics.riskRewardRatio;
  let stopLossMultiplier = 1.0;
  
  // Adjust based on confidence level
  const confidenceBonus = (aiAnalysis.confidence - 70) / 100 * characteristics.confidenceBonus;
  takeProfitMultiplier += confidenceBonus;
  
  // Adjust based on trend strength
  if (aiAnalysis.priceAction.trend !== "SIDEWAYS") {
    takeProfitMultiplier *= 1.3; // Stronger moves in trending markets
  }
  
  // Adjust based on breakout probability
  if (aiAnalysis.priceAction.breakoutProbability > 70) {
    takeProfitMultiplier *= 1.4; // Larger moves expected on breakouts
    stopLossMultiplier *= 0.8;   // Tighter stops on high probability setups
  }
  
  // Adjust based on market structure
  if (aiAnalysis.priceAction.structure === "BULLISH" || aiAnalysis.priceAction.structure === "BEARISH") {
    takeProfitMultiplier *= 1.2;
  }
  
  // Adjust based on smart money flow
  if (aiAnalysis.smartMoney.institutionalFlow !== "NEUTRAL") {
    takeProfitMultiplier *= 1.25; // Follow smart money for larger moves
  }
  
  return {
    takeProfit: Math.max(1.5, Math.min(4.0, takeProfitMultiplier)), // Clamp between 1.5x and 4x
    stopLoss: Math.max(0.5, Math.min(1.5, stopLossMultiplier))      // Clamp between 0.5x and 1.5x
  };
}

function calculateEnhancedKeyLevels(currentPrice: number, marketData: any, characteristics: any) {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];
  
  // Calculate multiple support and resistance levels
  const levels = [];
  
  // Recent highs and lows from different timeframes
  levels.push(data30m.high, data30m.low);
  levels.push(data15m.high, data15m.low);
  levels.push(data5m.high, data5m.low);
  
  // Psychological levels (round numbers)
  const roundNumberSpacing = characteristics.supportResistanceSpacing;
  const nearestRound = Math.round(currentPrice / roundNumberSpacing) * roundNumberSpacing;
  levels.push(
    nearestRound,
    nearestRound + roundNumberSpacing,
    nearestRound - roundNumberSpacing,
    nearestRound + (roundNumberSpacing * 2),
    nearestRound - (roundNumberSpacing * 2)
  );
  
  // VWAP-based levels
  const vwap = (data5m.close + data15m.close + data30m.close) / 3;
  levels.push(vwap);
  
  // Fibonacci-like levels based on recent range
  const recentHigh = Math.max(data5m.high, data15m.high, data30m.high);
  const recentLow = Math.min(data5m.low, data15m.low, data30m.low);
  const range = recentHigh - recentLow;
  
  if (range > 0) {
    levels.push(
      recentLow + (range * 0.236),
      recentLow + (range * 0.382),
      recentLow + (range * 0.618),
      recentLow + (range * 0.786)
    );
  }
  
  // Remove duplicates and sort
  const uniqueLevels = [...new Set(levels)].sort((a, b) => a - b);
  
  // Separate into support and resistance
  const support = uniqueLevels.filter(level => level < currentPrice);
  const resistance = uniqueLevels.filter(level => level > currentPrice);
  
  return { support, resistance };
}

function calculateLongTakeProfit(
  currentPrice: number,
  enhancedATR: number,
  keyLevels: any,
  multipliers: any,
  aiAnalysis: any
) {
  // Calculate ATR-based target
  const atrTarget = currentPrice + (enhancedATR * multipliers.takeProfit);
  
  // Find next significant resistance level
  const nextResistance = keyLevels.resistance.find(level => level > currentPrice + (enhancedATR * 0.5));
  
  // Choose the more conservative target (closer to current price) but ensure minimum movement
  let takeProfit = atrTarget;
  
  if (nextResistance && nextResistance < atrTarget) {
    // Use resistance level but with small buffer
    takeProfit = nextResistance * 0.995; // 0.5% before resistance
  }
  
  // Ensure minimum meaningful movement
  const symbolChar = getSymbolCharacteristics(getSymbolFromPrice(currentPrice));
  const minTarget = currentPrice + symbolChar.minMovement;
  const maxTarget = currentPrice + symbolChar.maxMovement;
  
  // Apply bounds
  takeProfit = Math.max(minTarget, Math.min(maxTarget, takeProfit));
  
  return takeProfit;
}

function calculateLongStopLoss(
  currentPrice: number,
  enhancedATR: number,
  keyLevels: any,
  multipliers: any,
  aiAnalysis: any
) {
  // Calculate ATR-based stop
  const atrStop = currentPrice - (enhancedATR * multipliers.stopLoss);
  
  // Find nearest support level
  const nearestSupport = keyLevels.support
    .filter(level => level < currentPrice - (enhancedATR * 0.3))
    .sort((a, b) => b - a)[0]; // Closest support below current price
  
  // Choose the more conservative stop (further from current price)
  let stopLoss = atrStop;
  
  if (nearestSupport && nearestSupport < atrStop) {
    // Use support level with small buffer
    stopLoss = nearestSupport * 0.998; // 0.2% below support
  }
  
  // Ensure reasonable stop loss (not too tight, not too wide)
  const maxStop = currentPrice * 0.95; // Maximum 5% stop loss
  const minStop = currentPrice * 0.98; // Minimum 2% stop loss
  
  stopLoss = Math.max(maxStop, Math.min(minStop, stopLoss));
  
  return stopLoss;
}

function calculateShortTakeProfit(
  currentPrice: number,
  enhancedATR: number,
  keyLevels: any,
  multipliers: any,
  aiAnalysis: any
) {
  // Calculate ATR-based target
  const atrTarget = currentPrice - (enhancedATR * multipliers.takeProfit);
  
  // Find next significant support level
  const nextSupport = keyLevels.support
    .filter(level => level < currentPrice - (enhancedATR * 0.5))
    .sort((a, b) => b - a)[0]; // Closest support below
  
  // Choose the more conservative target
  let takeProfit = atrTarget;
  
  if (nextSupport && nextSupport > atrTarget) {
    // Use support level with small buffer
    takeProfit = nextSupport * 1.005; // 0.5% above support
  }
  
  // Ensure minimum meaningful movement
  const symbolChar = getSymbolCharacteristics(getSymbolFromPrice(currentPrice));
  const minTarget = currentPrice - symbolChar.minMovement;
  const maxTarget = currentPrice - symbolChar.maxMovement;
  
  // Apply bounds
  takeProfit = Math.min(minTarget, Math.max(maxTarget, takeProfit));
  
  return takeProfit;
}

function calculateShortStopLoss(
  currentPrice: number,
  enhancedATR: number,
  keyLevels: any,
  multipliers: any,
  aiAnalysis: any
) {
  // Calculate ATR-based stop
  const atrStop = currentPrice + (enhancedATR * multipliers.stopLoss);
  
  // Find nearest resistance level
  const nearestResistance = keyLevels.resistance
    .filter(level => level > currentPrice + (enhancedATR * 0.3))
    .sort((a, b) => a - b)[0]; // Closest resistance above current price
  
  // Choose the more conservative stop
  let stopLoss = atrStop;
  
  if (nearestResistance && nearestResistance > atrStop) {
    // Use resistance level with small buffer
    stopLoss = nearestResistance * 1.002; // 0.2% above resistance
  }
  
  // Ensure reasonable stop loss
  const maxStop = currentPrice * 1.05; // Maximum 5% stop loss
  const minStop = currentPrice * 1.02; // Minimum 2% stop loss
  
  stopLoss = Math.min(maxStop, Math.max(minStop, stopLoss));
  
  return stopLoss;
}

function getSymbolFromPrice(price: number): string {
  // Simple heuristic to guess symbol from price range
  if (price > 10000) return "BTCUSD";
  if (price > 1000) return "ETHUSD";
  if (price > 100) return "USDJPY";
  if (price > 10) return "CRUDE";
  if (price > 1) return "EURUSD";
  return "EURUSD"; // Default
}
