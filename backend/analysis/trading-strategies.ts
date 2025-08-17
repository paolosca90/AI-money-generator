export type TradingStrategy = "SCALPING" | "INTRADAY" | "SWING";

export interface StrategyConfig {
  name: string;
  description: string;
  timeframes: string[];
  riskRewardRatio: number;
  stopLossMultiplier: number;
  takeProfitMultiplier: number;
  maxHoldingTime: number; // in hours
  minConfidence: number;
  maxLotSize: number;
  volatilityThreshold: number;
  trendStrengthRequired: number;
  marketConditions: string[];
}

export const TRADING_STRATEGIES: Record<TradingStrategy, StrategyConfig> = {
  SCALPING: {
    name: "Scalping",
    description: "Quick trades capturing small price movements (1-15 minutes)",
    timeframes: ["1m", "5m"],
    riskRewardRatio: 1.5, // 1:1.5 risk/reward
    stopLossMultiplier: 0.8, // Tight stop loss
    takeProfitMultiplier: 1.2, // Quick profit taking
    maxHoldingTime: 0.25, // 15 minutes max
    minConfidence: 90, // Increased from 85 - scalping needs highest quality signals
    maxLotSize: 0.5, // Moderate position size
    volatilityThreshold: 0.002, // Low volatility preferred
    trendStrengthRequired: 0.7, // Strong trend required
    marketConditions: ["HIGH_VOLUME", "TRENDING", "LOW_SPREAD"]
  },
  
  INTRADAY: {
    name: "Intraday",
    description: "Day trading capturing medium price movements (1-8 hours)",
    timeframes: ["5m", "15m", "30m"],
    riskRewardRatio: 2.0, // 1:2 risk/reward
    stopLossMultiplier: 1.0, // Standard stop loss
    takeProfitMultiplier: 2.0, // Standard profit taking
    maxHoldingTime: 8, // 8 hours max
    minConfidence: 80, // Increased from 75 for better quality
    maxLotSize: 1.0, // Standard position size
    volatilityThreshold: 0.005, // Medium volatility
    trendStrengthRequired: 0.5, // Moderate trend required
    marketConditions: ["NORMAL_VOLUME", "TRENDING", "BREAKOUT"]
  },
  
  SWING: {
    name: "Swing Trading",
    description: "Multi-day trades capturing large price movements (1-7 days)",
    timeframes: ["30m", "1h", "4h"],
    riskRewardRatio: 3.0, // 1:3 risk/reward
    stopLossMultiplier: 1.5, // Wider stop loss
    takeProfitMultiplier: 4.5, // Larger profit targets
    maxHoldingTime: 168, // 7 days max
    minConfidence: 75, // Increased from 70 for improved quality
    maxLotSize: 2.0, // Larger position size
    volatilityThreshold: 0.01, // Higher volatility acceptable
    trendStrengthRequired: 0.3, // Trend not strictly required
    marketConditions: ["ANY_VOLUME", "REVERSAL", "CONSOLIDATION"]
  }
};

export interface StrategyPriceTargets {
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskAmount: number;
  rewardAmount: number;
  riskRewardRatio: number;
}

export function calculateStrategyTargets(
  strategy: TradingStrategy,
  currentPrice: number,
  atr: number,
  direction: "LONG" | "SHORT",
  symbol: string
): StrategyPriceTargets {
  const config = TRADING_STRATEGIES[strategy];
  const symbolCharacteristics = getSymbolCharacteristics(symbol);
  
  // Adjust ATR based on strategy and symbol
  const adjustedATR = atr * symbolCharacteristics.volatilityMultiplier;
  
  // Calculate base stop loss and take profit distances
  const stopLossDistance = adjustedATR * config.stopLossMultiplier;
  const takeProfitDistance = adjustedATR * config.takeProfitMultiplier;
  
  let stopLoss: number;
  let takeProfit: number;
  
  if (direction === "LONG") {
    stopLoss = currentPrice - stopLossDistance;
    takeProfit = currentPrice + takeProfitDistance;
  } else {
    stopLoss = currentPrice + stopLossDistance;
    takeProfit = currentPrice - takeProfitDistance;
  }
  
  // Apply symbol-specific minimum movements
  const minMovement = symbolCharacteristics.minMovement;
  
  if (direction === "LONG") {
    stopLoss = Math.min(stopLoss, currentPrice - minMovement);
    takeProfit = Math.max(takeProfit, currentPrice + minMovement * config.riskRewardRatio);
  } else {
    stopLoss = Math.max(stopLoss, currentPrice + minMovement);
    takeProfit = Math.min(takeProfit, currentPrice - minMovement * config.riskRewardRatio);
  }
  
  // Calculate risk and reward amounts
  const riskAmount = Math.abs(currentPrice - stopLoss);
  const rewardAmount = Math.abs(takeProfit - currentPrice);
  const actualRiskReward = rewardAmount / riskAmount;
  
  return {
    entryPrice: currentPrice,
    stopLoss: Math.round(stopLoss * 100000) / 100000,
    takeProfit: Math.round(takeProfit * 100000) / 100000,
    riskAmount: Math.round(riskAmount * 100000) / 100000,
    rewardAmount: Math.round(rewardAmount * 100000) / 100000,
    riskRewardRatio: Math.round(actualRiskReward * 100) / 100
  };
}

export function getOptimalStrategy(
  marketData: any,
  aiAnalysis: any,
  symbol: string,
  userPreference?: TradingStrategy
): TradingStrategy {
  // If user has a preference, validate it and return if suitable
  if (userPreference && isStrategyValid(userPreference, marketData, aiAnalysis, symbol)) {
    return userPreference;
  }
  
  // Analyze market conditions to determine best strategy
  const volatility = calculateMarketVolatility(marketData);
  const trendStrength = calculateTrendStrength(marketData);
  const confidence = aiAnalysis.confidence;
  
  // Score each strategy based on current conditions
  const scores = {
    SCALPING: calculateStrategyScore("SCALPING", volatility, trendStrength, confidence),
    INTRADAY: calculateStrategyScore("INTRADAY", volatility, trendStrength, confidence),
    SWING: calculateStrategyScore("SWING", volatility, trendStrength, confidence)
  };
  
  // Return strategy with highest score
  return Object.entries(scores).reduce((best, [strategy, score]) => 
    score > scores[best] ? strategy as TradingStrategy : best, "INTRADAY" as TradingStrategy
  );
}

function isStrategyValid(
  strategy: TradingStrategy,
  marketData: any,
  aiAnalysis: any,
  symbol: string
): boolean {
  const config = TRADING_STRATEGIES[strategy];
  const volatility = calculateMarketVolatility(marketData);
  const trendStrength = calculateTrendStrength(marketData);
  
  // Check if conditions meet strategy requirements
  return (
    aiAnalysis.confidence >= config.minConfidence &&
    volatility <= config.volatilityThreshold * 2 && // Allow some flexibility
    trendStrength >= config.trendStrengthRequired * 0.8 // Allow some flexibility
  );
}

function calculateStrategyScore(
  strategy: TradingStrategy,
  volatility: number,
  trendStrength: number,
  confidence: number
): number {
  const config = TRADING_STRATEGIES[strategy];
  let score = 0;
  
  // Confidence score (0-40 points)
  if (confidence >= config.minConfidence) {
    score += Math.min(40, (confidence - config.minConfidence) / (100 - config.minConfidence) * 40);
  }
  
  // Volatility score (0-30 points)
  const volatilityFit = 1 - Math.abs(volatility - config.volatilityThreshold) / config.volatilityThreshold;
  score += Math.max(0, volatilityFit * 30);
  
  // Trend strength score (0-30 points)
  if (trendStrength >= config.trendStrengthRequired) {
    score += Math.min(30, (trendStrength - config.trendStrengthRequired) / (1 - config.trendStrengthRequired) * 30);
  }
  
  return score;
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

function calculateTrendStrength(marketData: any): number {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];
  
  // Calculate trend consistency across timeframes
  const prices = [data5m.close, data15m.close, data30m.close];
  const isUptrend = prices.every((price, i) => i === 0 || price >= prices[i - 1]);
  const isDowntrend = prices.every((price, i) => i === 0 || price <= prices[i - 1]);
  
  if (isUptrend || isDowntrend) {
    // Calculate strength based on price movement
    const totalMove = Math.abs(prices[0] - prices[prices.length - 1]);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    return Math.min(1, totalMove / avgPrice * 100);
  }
  
  return 0; // No clear trend
}

function getSymbolCharacteristics(symbol: string) {
  const characteristics = {
    "BTCUSD": {
      volatilityMultiplier: 1.0,
      minMovement: 100,
      tickSize: 0.01
    },
    "ETHUSD": {
      volatilityMultiplier: 1.0,
      minMovement: 5,
      tickSize: 0.01
    },
    "EURUSD": {
      volatilityMultiplier: 1.0,
      minMovement: 0.0010,
      tickSize: 0.00001
    },
    "GBPUSD": {
      volatilityMultiplier: 1.2,
      minMovement: 0.0015,
      tickSize: 0.00001
    },
    "USDJPY": {
      volatilityMultiplier: 1.0,
      minMovement: 0.10,
      tickSize: 0.001
    },
    "XAUUSD": {
      volatilityMultiplier: 1.0,
      minMovement: 2.0,
      tickSize: 0.01
    },
    "CRUDE": {
      volatilityMultiplier: 1.5,
      minMovement: 0.50,
      tickSize: 0.01
    }
  };
  
  return characteristics[symbol] || {
    volatilityMultiplier: 1.0,
    minMovement: 0.001,
    tickSize: 0.00001
  };
}

export function getStrategyRecommendation(
  strategy: TradingStrategy,
  marketData: any,
  aiAnalysis: any
): string {
  const config = TRADING_STRATEGIES[strategy];
  const volatility = calculateMarketVolatility(marketData);
  const trendStrength = calculateTrendStrength(marketData);
  
  let recommendation = `${config.name} Strategy Selected:\n\n`;
  
  // Add strategy-specific recommendations
  switch (strategy) {
    case "SCALPING":
      recommendation += "🔥 SCALPING SETUP:\n";
      recommendation += "• Quick entry/exit (1-15 minutes)\n";
      recommendation += "• Tight stop loss for capital protection\n";
      recommendation += "• High confidence signals only\n";
      recommendation += "• Monitor spreads and slippage\n";
      recommendation += "• Best during high volume sessions\n";
      break;
      
    case "INTRADAY":
      recommendation += "⚡ INTRADAY SETUP:\n";
      recommendation += "• Hold for 1-8 hours maximum\n";
      recommendation += "• Balanced risk/reward ratio\n";
      recommendation += "• Follow trend direction\n";
      recommendation += "• Close before market close\n";
      recommendation += "• Monitor news and events\n";
      break;
      
    case "SWING":
      recommendation += "📈 SWING TRADING SETUP:\n";
      recommendation += "• Multi-day holding period\n";
      recommendation += "• Wider stops for volatility\n";
      recommendation += "• Larger profit targets\n";
      recommendation += "• Less frequent monitoring\n";
      recommendation += "• Focus on weekly trends\n";
      break;
  }
  
  // Add market condition analysis
  recommendation += `\n📊 MARKET CONDITIONS:\n`;
  recommendation += `• Volatility: ${(volatility * 100).toFixed(2)}%\n`;
  recommendation += `• Trend Strength: ${(trendStrength * 100).toFixed(0)}%\n`;
  recommendation += `• Confidence: ${aiAnalysis.confidence}%\n`;
  
  // Add warnings if conditions are not optimal
  if (aiAnalysis.confidence < config.minConfidence) {
    recommendation += `\n⚠️ WARNING: Confidence below optimal (${config.minConfidence}%)\n`;
  }
  
  if (volatility > config.volatilityThreshold * 1.5) {
    recommendation += `\n⚠️ WARNING: High volatility detected\n`;
  }
  
  if (trendStrength < config.trendStrengthRequired) {
    recommendation += `\n⚠️ WARNING: Weak trend strength\n`;
  }
  
  return recommendation;
}

export function calculatePositionSize(
  strategy: TradingStrategy,
  accountBalance: number,
  riskPercentage: number,
  riskAmount: number
): number {
  const config = TRADING_STRATEGIES[strategy];
  
  // Calculate position size based on risk management
  const maxRiskAmount = accountBalance * (riskPercentage / 100);
  const positionSize = Math.min(maxRiskAmount / riskAmount, config.maxLotSize);
  
  // Round to appropriate lot size increments
  return Math.round(positionSize * 100) / 100;
}
