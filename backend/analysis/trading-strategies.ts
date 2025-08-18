export enum TradingStrategy {
  SCALPING = "SCALPING",
  INTRADAY = "INTRADAY", 
  SWING = "SWING"
}

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
  [TradingStrategy.SCALPING]: {
    name: "Scalping",
    description: "Trade veloci che catturano piccoli movimenti di prezzo (1-15 minuti)",
    timeframes: ["1m", "5m"],
    riskRewardRatio: 1.5,
    stopLossMultiplier: 0.8,
    takeProfitMultiplier: 1.2,
    maxHoldingTime: 0.25,
    minConfidence: 90,
    maxLotSize: 0.5,
    volatilityThreshold: 0.002,
    trendStrengthRequired: 0.7,
    marketConditions: ["HIGH_VOLUME", "TRENDING", "LOW_SPREAD"]
  },
  
  [TradingStrategy.INTRADAY]: {
    name: "Intraday",
    description: "Day trading che cattura movimenti di prezzo medi (1-8 ore)",
    timeframes: ["5m", "15m", "30m"],
    riskRewardRatio: 2.0,
    stopLossMultiplier: 1.0,
    takeProfitMultiplier: 2.0,
    maxHoldingTime: 8,
    minConfidence: 80,
    maxLotSize: 1.0,
    volatilityThreshold: 0.005,
    trendStrengthRequired: 0.5,
    marketConditions: ["NORMAL_VOLUME", "TRENDING", "BREAKOUT"]
  },
  
  [TradingStrategy.SWING]: {
    name: "Swing Trading",
    description: "Trade multi-giorno che catturano ampi movimenti di prezzo (1-7 giorni)",
    timeframes: ["30m", "1h", "4h"],
    riskRewardRatio: 3.0,
    stopLossMultiplier: 1.5,
    takeProfitMultiplier: 4.5,
    maxHoldingTime: 168,
    minConfidence: 75,
    maxLotSize: 2.0,
    volatilityThreshold: 0.01,
    trendStrengthRequired: 0.3,
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
  
  const adjustedATR = atr * symbolCharacteristics.volatilityMultiplier;
  
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
  
  const minMovement = symbolCharacteristics.minMovement;
  
  if (direction === "LONG") {
    stopLoss = Math.min(stopLoss, currentPrice - minMovement);
    takeProfit = Math.max(takeProfit, currentPrice + minMovement * config.riskRewardRatio);
  } else {
    stopLoss = Math.max(stopLoss, currentPrice + minMovement);
    takeProfit = Math.min(takeProfit, currentPrice - minMovement * config.riskRewardRatio);
  }
  
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
  if (userPreference && isStrategyValid(userPreference, marketData, aiAnalysis, symbol)) {
    return userPreference;
  }
  
  const volatility = calculateMarketVolatility(marketData);
  const trendStrength = calculateTrendStrength(marketData);
  const confidence = aiAnalysis.confidence;
  
  const scores = {
    [TradingStrategy.SCALPING]: calculateStrategyScore(TradingStrategy.SCALPING, volatility, trendStrength, confidence),
    [TradingStrategy.INTRADAY]: calculateStrategyScore(TradingStrategy.INTRADAY, volatility, trendStrength, confidence),
    [TradingStrategy.SWING]: calculateStrategyScore(TradingStrategy.SWING, volatility, trendStrength, confidence)
  };
  
  return Object.entries(scores).reduce((best, [strategy, score]) => 
    score > (scores as any)[best] ? strategy as TradingStrategy : best, TradingStrategy.INTRADAY
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
  
  return (
    aiAnalysis.confidence >= config.minConfidence &&
    volatility <= config.volatilityThreshold * 2 &&
    trendStrength >= config.trendStrengthRequired * 0.8
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
  
  if (confidence >= config.minConfidence) {
    score += Math.min(40, (confidence - config.minConfidence) / (100 - config.minConfidence) * 40);
  }
  
  const volatilityFit = 1 - Math.abs(volatility - config.volatilityThreshold) / config.volatilityThreshold;
  score += Math.max(0, volatilityFit * 30);
  
  if (trendStrength >= config.trendStrengthRequired) {
    score += Math.min(30, (trendStrength - config.trendStrengthRequired) / (1 - config.trendStrengthRequired) * 30);
  }
  
  return score;
}

function calculateMarketVolatility(marketData: any): number {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];
  
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
  
  const prices = [data5m.close, data15m.close, data30m.close];
  const isUptrend = prices.every((price, i) => i === 0 || price >= prices[i - 1]);
  const isDowntrend = prices.every((price, i) => i === 0 || price <= prices[i - 1]);
  
  if (isUptrend || isDowntrend) {
    const totalMove = Math.abs(prices[0] - prices[prices.length - 1]);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    return Math.min(1, totalMove / avgPrice * 100);
  }
  
  return 0;
}

function getSymbolCharacteristics(symbol: string) {
  const characteristics: Record<string, any> = {
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
  
  switch (strategy) {
    case TradingStrategy.SCALPING:
      recommendation += "🔥 SCALPING SETUP:\n";
      recommendation += "• Quick entry/exit (1-15 minutes)\n";
      recommendation += "• Tight stop loss for capital protection\n";
      recommendation += "• High confidence signals only\n";
      recommendation += "• Monitor spreads and slippage\n";
      recommendation += "• Best during high volume sessions\n";
      break;
      
    case TradingStrategy.INTRADAY:
      recommendation += "⚡ INTRADAY SETUP:\n";
      recommendation += "• Hold for 1-8 hours maximum\n";
      recommendation += "• Balanced risk/reward ratio\n";
      recommendation += "• Follow trend direction\n";
      recommendation += "• Close before market close\n";
      recommendation += "• Monitor news and events\n";
      break;
      
    case TradingStrategy.SWING:
      recommendation += "📈 SWING TRADING SETUP:\n";
      recommendation += "• Multi-day holding period\n";
      recommendation += "• Wider stops for volatility\n";
      recommendation += "• Larger profit targets\n";
      recommendation += "• Less frequent monitoring\n";
      recommendation += "• Focus on weekly trends\n";
      break;
  }
  
  recommendation += `\n📊 MARKET CONDITIONS:\n`;
  recommendation += `• Volatility: ${(volatility * 100).toFixed(2)}%\n`;
  recommendation += `• Trend Strength: ${(trendStrength * 100).toFixed(0)}%\n`;
  recommendation += `• Confidence: ${aiAnalysis.confidence}%\n`;
  
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
  
  const maxRiskAmount = accountBalance * (riskPercentage / 100);
  const positionSize = Math.min(maxRiskAmount / riskAmount, config.maxLotSize);
  
  return Math.round(positionSize * 100) / 100;
}
