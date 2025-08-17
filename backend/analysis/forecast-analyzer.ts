import { TimeframeData } from "./market-data";

export interface ForecastAnalysis {
  priceTargets: {
    bullish: {
      target1: number; // Conservative target
      target2: number; // Moderate target
      target3: number; // Optimistic target
      probability: number; // 0-100 probability of reaching target1
    };
    bearish: {
      target1: number; // Conservative target
      target2: number; // Moderate target
      target3: number; // Optimistic target
      probability: number; // 0-100 probability of reaching target1
    };
  };
  timeHorizons: {
    "1h": { price: number; confidence: number };
    "4h": { price: number; confidence: number };
    "1d": { price: number; confidence: number };
    "1w": { price: number; confidence: number };
  };
  scenarios: {
    bullish: {
      description: string;
      probability: number;
      priceTarget: number;
      catalysts: string[];
      timeline: string;
    };
    base: {
      description: string;
      probability: number;
      priceTarget: number;
      catalysts: string[];
      timeline: string;
    };
    bearish: {
      description: string;
      probability: number;
      priceTarget: number;
      catalysts: string[];
      timeline: string;
    };
  };
  technicalProjections: {
    fibonacciProjections: Array<{ level: number; price: number; significance: "HIGH" | "MEDIUM" | "LOW" }>;
    trendChannels: {
      upper: number;
      middle: number;
      lower: number;
      angle: number; // Trend angle in degrees
    };
    patternProjections: Array<{
      pattern: string;
      target: number;
      probability: number;
      invalidationLevel: number;
    }>;
  };
  volatility: {
    expectedVolatility: number; // Next period expected volatility
    volatilityRegime: "LOW" | "NORMAL" | "HIGH" | "EXTREME";
    volCones: {
      "1d": { low: number; high: number };
      "1w": { low: number; high: number };
      "1m": { low: number; high: number };
    };
  };
  confidenceIntervals: {
    "68%": { upper: number; lower: number }; // 1 std deviation
    "95%": { upper: number; lower: number }; // 2 std deviations
    "99%": { upper: number; lower: number }; // 3 std deviations
  };
}

export function generateForecasts(marketData: TimeframeData, symbol: string): ForecastAnalysis {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];
  const currentPrice = data5m.close;
  
  // Calculate volatility for projections
  const volatility = calculateHistoricalVolatility([data5m, data15m, data30m]);
  
  // Generate price targets using multiple methods
  const priceTargets = calculatePriceTargets(marketData, symbol, volatility);
  
  // Create time-based forecasts
  const timeHorizons = generateTimeHorizonForecasts(marketData, volatility);
  
  // Generate scenario analysis
  const scenarios = generateScenarios(marketData, symbol, volatility);
  
  // Technical projections
  const technicalProjections = generateTechnicalProjections(marketData, symbol);
  
  // Volatility analysis
  const volatilityAnalysis = analyzeVolatilityRegime(marketData, volatility);
  
  // Confidence intervals
  const confidenceIntervals = calculateConfidenceIntervals(currentPrice, volatility);
  
  return {
    priceTargets,
    timeHorizons,
    scenarios,
    technicalProjections,
    volatility: volatilityAnalysis,
    confidenceIntervals
  };
}

function calculatePriceTargets(marketData: TimeframeData, symbol: string, volatility: number): any {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];
  const currentPrice = data5m.close;
  
  // Calculate ATR-based targets
  const atr = data5m.indicators.atr;
  
  // Support and resistance levels
  const resistance1 = Math.max(data5m.high, data15m.high, data30m.high);
  const resistance2 = resistance1 + (atr * 1.5);
  const resistance3 = resistance1 + (atr * 3);
  
  const support1 = Math.min(data5m.low, data15m.low, data30m.low);
  const support2 = support1 - (atr * 1.5);
  const support3 = support1 - (atr * 3);
  
  // Calculate probabilities based on volatility and momentum
  const momentum = (currentPrice - data30m.close) / data30m.close;
  const bullishProbability = calculateDirectionalProbability(momentum, volatility, "BULLISH");
  const bearishProbability = calculateDirectionalProbability(momentum, volatility, "BEARISH");
  
  return {
    bullish: {
      target1: resistance1,
      target2: resistance2,
      target3: resistance3,
      probability: bullishProbability
    },
    bearish: {
      target1: support1,
      target2: support2,
      target3: support3,
      probability: bearishProbability
    }
  };
}

function generateTimeHorizonForecasts(marketData: TimeframeData, volatility: number): any {
  const currentPrice = marketData["5m"].close;
  const momentum = calculateMomentum(marketData);
  const trend = calculateTrend(marketData);
  
  // Base drift rate (simplified random walk with drift)
  const driftRate = momentum * 0.1; // Scale momentum for drift
  
  return {
    "1h": generateTimeBasedForecast(currentPrice, driftRate, volatility, 1/24, trend),
    "4h": generateTimeBasedForecast(currentPrice, driftRate, volatility, 4/24, trend),
    "1d": generateTimeBasedForecast(currentPrice, driftRate, volatility, 1, trend),
    "1w": generateTimeBasedForecast(currentPrice, driftRate, volatility, 7, trend)
  };
}

function generateTimeBasedForecast(currentPrice: number, drift: number, volatility: number, timeInDays: number, trend: number): any {
  // Geometric Brownian Motion forecast
  const expectedPrice = currentPrice * Math.exp(drift * timeInDays);
  
  // Adjust for trend
  const trendAdjustment = currentPrice * trend * Math.sqrt(timeInDays) * 0.1;
  const forecastPrice = expectedPrice + trendAdjustment;
  
  // Confidence decreases with time
  const baseConfidence = 75;
  const timeDecay = Math.exp(-timeInDays * 0.5); // Exponential decay
  const confidence = Math.max(40, baseConfidence * timeDecay);
  
  return {
    price: Math.round(forecastPrice * 100000) / 100000,
    confidence: Math.round(confidence)
  };
}

function generateScenarios(marketData: TimeframeData, symbol: string, volatility: number): any {
  const currentPrice = marketData["5m"].close;
  const atr = marketData["5m"].indicators.atr;
  
  // Get symbol-specific scenarios
  const symbolScenarios = getSymbolScenarios(symbol, currentPrice, atr, volatility);
  
  return symbolScenarios;
}

function getSymbolScenarios(symbol: string, currentPrice: number, atr: number, volatility: number): any {
  const baseScenarios = {
    "BTCUSD": {
      bullish: {
        description: "Institutional adoption accelerates, regulatory clarity improves",
        probability: 35,
        priceTarget: currentPrice * 1.15,
        catalysts: ["ETF inflows", "Corporate adoption", "Regulatory approval"],
        timeline: "2-4 weeks"
      },
      base: {
        description: "Consolidation continues with gradual upward bias",
        probability: 40,
        priceTarget: currentPrice * 1.05,
        catalysts: ["Technical consolidation", "Stable macro environment"],
        timeline: "1-2 weeks"
      },
      bearish: {
        description: "Regulatory concerns and macro headwinds pressure crypto",
        probability: 25,
        priceTarget: currentPrice * 0.85,
        catalysts: ["Regulatory crackdown", "Fed hawkishness", "Risk-off sentiment"],
        timeline: "1-3 weeks"
      }
    },
    "EURUSD": {
      bullish: {
        description: "ECB turns more hawkish, US economic data disappoints",
        probability: 30,
        priceTarget: currentPrice * 1.03,
        catalysts: ["ECB rate hikes", "Weak US data", "Dollar weakness"],
        timeline: "2-6 weeks"
      },
      base: {
        description: "Range-bound trading continues with central bank divergence",
        probability: 50,
        priceTarget: currentPrice * 1.005,
        catalysts: ["Central bank meetings", "Economic data releases"],
        timeline: "1-4 weeks"
      },
      bearish: {
        description: "Fed remains hawkish, European growth concerns mount",
        probability: 20,
        priceTarget: currentPrice * 0.97,
        catalysts: ["Fed hawkishness", "European recession", "Energy crisis"],
        timeline: "2-8 weeks"
      }
    },
    "XAUUSD": {
      bullish: {
        description: "Inflation concerns return, safe haven demand increases",
        probability: 40,
        priceTarget: currentPrice * 1.08,
        catalysts: ["Inflation spike", "Geopolitical tensions", "Dollar weakness"],
        timeline: "2-6 weeks"
      },
      base: {
        description: "Gold consolidates as markets await Fed policy clarity",
        probability: 35,
        priceTarget: currentPrice * 1.02,
        catalysts: ["Fed policy uncertainty", "Mixed economic data"],
        timeline: "2-4 weeks"
      },
      bearish: {
        description: "Strong dollar and rising real yields pressure gold",
        probability: 25,
        priceTarget: currentPrice * 0.94,
        catalysts: ["Rising rates", "Strong dollar", "Risk-on sentiment"],
        timeline: "1-4 weeks"
      }
    }
  };
  
  // Default scenarios for other symbols
  const defaultScenarios = {
    bullish: {
      description: "Technical breakout with strong momentum continuation",
      probability: 35,
      priceTarget: currentPrice + (atr * 3),
      catalysts: ["Technical breakout", "Volume confirmation", "Trend continuation"],
      timeline: "1-2 weeks"
    },
    base: {
      description: "Consolidation within current range",
      probability: 40,
      priceTarget: currentPrice + (atr * 0.5),
      catalysts: ["Range-bound trading", "Awaiting catalysts"],
      timeline: "1-2 weeks"
    },
    bearish: {
      description: "Technical breakdown with momentum reversal",
      probability: 25,
      priceTarget: currentPrice - (atr * 3),
      catalysts: ["Technical breakdown", "Support failure", "Trend reversal"],
      timeline: "1-2 weeks"
    }
  };
  
  return baseScenarios[symbol] || defaultScenarios;
}

function generateTechnicalProjections(marketData: TimeframeData, symbol: string): any {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];
  const currentPrice = data5m.close;
  
  // Fibonacci projections
  const fibonacciProjections = calculateFibonacciProjections([data5m, data15m, data30m]);
  
  // Trend channels
  const trendChannels = calculateTrendChannels([data5m, data15m, data30m]);
  
  // Pattern projections
  const patternProjections = identifyPatternProjections([data5m, data15m, data30m], symbol);
  
  return {
    fibonacciProjections,
    trendChannels,
    patternProjections
  };
}

function calculateFibonacciProjections(data: any[]): any[] {
  const prices = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  
  const recentHigh = Math.max(...highs);
  const recentLow = Math.min(...lows);
  const range = recentHigh - recentLow;
  
  const fibLevels = [0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.618];
  
  return fibLevels.map(level => ({
    level,
    price: recentLow + (range * level),
    significance: level === 0.618 || level === 1.0 || level === 1.618 ? "HIGH" : 
                 level === 0.382 || level === 0.786 || level === 1.272 ? "MEDIUM" : "LOW"
  }));
}

function calculateTrendChannels(data: any[]): any {
  const prices = data.map(d => d.close);
  
  // Simple linear regression for trend
  const n = prices.length;
  const xSum = n * (n - 1) / 2;
  const ySum = prices.reduce((sum, price) => sum + price, 0);
  const xySum = prices.reduce((sum, price, i) => sum + (price * i), 0);
  const xSquaredSum = n * (n - 1) * (2 * n - 1) / 6;
  
  const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);
  const intercept = (ySum - slope * xSum) / n;
  
  // Calculate standard deviation for channel width
  const fitted = prices.map((_, i) => intercept + slope * i);
  const residuals = prices.map((price, i) => price - fitted[i]);
  const stdDev = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / n);
  
  const currentTrend = intercept + slope * (n - 1);
  const angle = Math.atan(slope) * (180 / Math.PI);
  
  return {
    upper: currentTrend + (stdDev * 2),
    middle: currentTrend,
    lower: currentTrend - (stdDev * 2),
    angle: Math.round(angle * 100) / 100
  };
}

function identifyPatternProjections(data: any[], symbol: string): any[] {
  const patterns = [];
  
  // Simplified pattern recognition
  const closes = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  
  const currentPrice = closes[0];
  const range = Math.max(...highs) - Math.min(...lows);
  
  // Triangle pattern
  if (isTrianglePattern(closes, highs, lows)) {
    patterns.push({
      pattern: "Ascending Triangle",
      target: currentPrice + (range * 0.8),
      probability: 70,
      invalidationLevel: Math.min(...lows)
    });
  }
  
  // Flag pattern
  if (isFlagPattern(closes, data.map(d => d.volume))) {
    patterns.push({
      pattern: "Bull Flag",
      target: currentPrice + (range * 1.2),
      probability: 65,
      invalidationLevel: currentPrice * 0.95
    });
  }
  
  // Head and shoulders
  if (isHeadAndShouldersPattern(highs)) {
    patterns.push({
      pattern: "Head and Shoulders",
      target: currentPrice - (range * 0.6),
      probability: 60,
      invalidationLevel: Math.max(...highs)
    });
  }
  
  return patterns;
}

function analyzeVolatilityRegime(marketData: TimeframeData, volatility: number): any {
  const currentPrice = marketData["5m"].close;
  
  // Determine volatility regime
  let volatilityRegime: "LOW" | "NORMAL" | "HIGH" | "EXTREME";
  if (volatility < 0.01) volatilityRegime = "LOW";
  else if (volatility < 0.03) volatilityRegime = "NORMAL";
  else if (volatility < 0.05) volatilityRegime = "HIGH";
  else volatilityRegime = "EXTREME";
  
  // Expected volatility (with mean reversion)
  const longTermVol = 0.025; // Assumed long-term volatility
  const meanReversionSpeed = 0.1;
  const expectedVolatility = volatility + meanReversionSpeed * (longTermVol - volatility);
  
  // Volatility cones (expected ranges)
  const volCones = {
    "1d": {
      low: currentPrice * (1 - expectedVolatility * Math.sqrt(1/252)),
      high: currentPrice * (1 + expectedVolatility * Math.sqrt(1/252))
    },
    "1w": {
      low: currentPrice * (1 - expectedVolatility * Math.sqrt(7/252)),
      high: currentPrice * (1 + expectedVolatility * Math.sqrt(7/252))
    },
    "1m": {
      low: currentPrice * (1 - expectedVolatility * Math.sqrt(30/252)),
      high: currentPrice * (1 + expectedVolatility * Math.sqrt(30/252))
    }
  };
  
  return {
    expectedVolatility,
    volatilityRegime,
    volCones
  };
}

function calculateConfidenceIntervals(currentPrice: number, volatility: number): any {
  // Time horizon for confidence intervals (1 day)
  const timeHorizon = 1/252; // 1 day in years
  const sigma = volatility * Math.sqrt(timeHorizon);
  
  return {
    "68%": {
      upper: currentPrice * (1 + sigma),
      lower: currentPrice * (1 - sigma)
    },
    "95%": {
      upper: currentPrice * (1 + 2 * sigma),
      lower: currentPrice * (1 - 2 * sigma)
    },
    "99%": {
      upper: currentPrice * (1 + 3 * sigma),
      lower: currentPrice * (1 - 3 * sigma)
    }
  };
}

// Helper functions
function calculateHistoricalVolatility(data: any[]): number {
  const returns = data.slice(1).map((d, i) => Math.log(d.close / data[i].close));
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
  return Math.sqrt(variance * 252); // Annualized volatility
}

function calculateMomentum(marketData: TimeframeData): number {
  const data5m = marketData["5m"];
  const data30m = marketData["30m"];
  return (data5m.close - data30m.close) / data30m.close;
}

function calculateTrend(marketData: TimeframeData): number {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];
  
  const prices = [data30m.close, data15m.close, data5m.close];
  
  // Simple trend calculation: 1 if all increasing, -1 if all decreasing, 0 otherwise
  if (prices[0] < prices[1] && prices[1] < prices[2]) return 1;
  if (prices[0] > prices[1] && prices[1] > prices[2]) return -1;
  return 0;
}

function calculateDirectionalProbability(momentum: number, volatility: number, direction: "BULLISH" | "BEARISH"): number {
  const baseProbability = 50;
  
  // Adjust for momentum
  const momentumAdjustment = direction === "BULLISH" ? momentum * 100 : -momentum * 100;
  
  // Adjust for volatility (higher volatility = more uncertainty)
  const volatilityPenalty = volatility * 50;
  
  const probability = baseProbability + momentumAdjustment - volatilityPenalty;
  return Math.max(15, Math.min(85, probability));
}

// Pattern recognition helper functions
function isTrianglePattern(closes: number[], highs: number[], lows: number[]): boolean {
  // Simplified triangle detection: converging highs and lows
  const recentHighs = highs.slice(0, 3);
  const recentLows = lows.slice(0, 3);
  
  const highsDecreasing = recentHighs[0] > recentHighs[1] && recentHighs[1] > recentHighs[2];
  const lowsIncreasing = recentLows[0] < recentLows[1] && recentLows[1] < recentLows[2];
  
  return highsDecreasing && lowsIncreasing;
}

function isFlagPattern(closes: number[], volumes: number[]): boolean {
  // Simplified flag detection: consolidation after strong move with decreasing volume
  const priceRange = Math.max(...closes) - Math.min(...closes);
  const avgPrice = closes.reduce((sum, c) => sum + c, 0) / closes.length;
  
  const isConsolidating = (priceRange / avgPrice) < 0.02; // Less than 2% range
  const volumeDecreasing = volumes[0] < volumes[volumes.length - 1];
  
  return isConsolidating && volumeDecreasing;
}

function isHeadAndShouldersPattern(highs: number[]): boolean {
  if (highs.length < 3) return false;
  
  // Simplified H&S: middle high is highest
  const maxHigh = Math.max(...highs);
  const maxIndex = highs.indexOf(maxHigh);
  
  // Check if max is in the middle third
  const middleStart = Math.floor(highs.length / 3);
  const middleEnd = Math.floor((highs.length * 2) / 3);
  
  return maxIndex >= middleStart && maxIndex <= middleEnd;
}