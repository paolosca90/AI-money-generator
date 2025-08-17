import { secret } from "encore.dev/config";
import { TimeframeData } from "./market-data";
import { calculateAllIndicators, TechnicalIndicators } from "./enhanced-technical-analysis.js";
import { calculateEnhancedConfidence, ConfidenceResult } from "./enhanced-confidence-system.js";
import { analyzeVWAP, VWAPAnalysis, getVWAPRecommendations } from "./vwap-analyzer.js";
import { analyzeOrderbook, OrderbookAnalysis, getOrderbookSignals } from "./orderbook-analyzer.js";
import { analyzeOptions, OptionsAnalysis, getOptionsSignals } from "./options-analyzer.js";
import { analyzeWithMLEnsemble, MLAnalysis, getMLRecommendations } from "./ml-analyzer.js";
import { generateForecasts, ForecastAnalysis, getForecastingInsights } from "./forecast-analyzer.js";

const geminiApiKey = secret("GeminiApiKey");

export interface AIAnalysis {
  direction: "LONG" | "SHORT";
  confidence: number;
  confidenceResult?: ConfidenceResult; // Enhanced confidence breakdown
  support: number;
  resistance: number;
  sentiment: {
    score: number;
    sources: string[];
  };
  volatility: {
    hourly: number;
    daily: number;
  };
  smartMoney: {
    institutionalFlow: "BUYING" | "SELLING" | "NEUTRAL";
    volumeProfile: "ACCUMULATION" | "DISTRIBUTION" | "CONSOLIDATION";
    orderFlow: "BULLISH" | "BEARISH" | "NEUTRAL";
    liquidityZones: number[];
  };
  priceAction: {
    trend: "UPTREND" | "DOWNTREND" | "SIDEWAYS";
    structure: "BULLISH" | "BEARISH" | "NEUTRAL";
    keyLevels: number[];
    breakoutProbability: number;
  };
  professionalAnalysis: {
    topTraders: string[];
    consensusView: "BULLISH" | "BEARISH" | "NEUTRAL";
    riskReward: number;
    timeframe: string;
  };
  technical: TechnicalIndicators; // Enhanced technical indicators
  // Advanced Analysis Components (PR #2)
  vwapAnalysis?: VWAPAnalysis;
  orderbookAnalysis?: OrderbookAnalysis;
  optionsAnalysis?: OptionsAnalysis;
  mlAnalysis?: MLAnalysis;
  forecastAnalysis?: ForecastAnalysis;
  advancedRecommendations?: string[];
}

// Cache for Gemini responses to reduce API calls
const geminiCache = new Map<string, { response: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function analyzeWithAI(marketData: TimeframeData, symbol: string): Promise<AIAnalysis> {
  // Extract key data from different timeframes
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];

  // Calculate enhanced technical indicators
  const highs = [data5m.high, data15m.high, data30m.high];
  const lows = [data5m.low, data15m.low, data30m.low];
  const closes = [data5m.close, data15m.close, data30m.close];
  const volumes = [data5m.volume, data15m.volume, data30m.volume];
  
  const technicalIndicators = calculateAllIndicators(highs, lows, closes, volumes);

  // Advanced price action analysis with enhanced calculations
  const priceActionAnalysis = analyzePriceActionEnhanced(data5m, data15m, data30m, symbol);
  
  // Smart money analysis with improved liquidity zone detection
  const smartMoneyAnalysis = analyzeSmartMoneyEnhanced(data5m, data15m, data30m, symbol);
  
  // Volume and order flow analysis
  const volumeAnalysis = analyzeVolumeProfile(data5m, data15m, data30m);
  
  // Professional trader consensus
  const professionalAnalysis = await analyzeProfessionalTraders(symbol, marketData);

  // Advanced analysis components (PR #2)
  const vwapAnalysis = analyzeVWAP(marketData, data5m.close);
  const orderbookAnalysis = analyzeOrderbook(marketData, symbol);
  const optionsAnalysis = analyzeOptions(marketData, symbol);
  const mlAnalysis = analyzeWithMLEnsemble(marketData, symbol);
  const forecastAnalysis = generateForecasts(marketData, symbol);

  // Use Gemini Pro for enhanced analysis with comprehensive prompt
  const geminiAnalysis = await analyzeWithGeminiCached(marketData, symbol, {
    priceAction: priceActionAnalysis,
    smartMoney: smartMoneyAnalysis,
    volume: volumeAnalysis,
    professional: professionalAnalysis,
    vwap: vwapAnalysis,
    orderbook: orderbookAnalysis,
    options: optionsAnalysis,
    ml: mlAnalysis,
    forecast: forecastAnalysis
  });

  // Calculate enhanced support and resistance using multiple methods
  const enhancedLevels = calculateEnhancedSupportResistance(data5m, data15m, data30m, symbol);
  
  // Determine direction using weighted ensemble approach
  const finalDirection = determineDirectionWithAdvancedAnalysis(
    priceActionAnalysis,
    smartMoneyAnalysis,
    volumeAnalysis,
    geminiAnalysis,
    vwapAnalysis,
    orderbookAnalysis,
    optionsAnalysis,
    mlAnalysis
  );

  // Use enhanced confidence calculation system
  const confidenceResult = calculateEnhancedConfidence(
    technicalIndicators,
    symbol,
    finalDirection,
    data5m.close,
    data5m.volume,
    mlAnalysis.backtestingMetrics.accuracy * 100 // Use ML accuracy as historical baseline
  );

  // Generate advanced recommendations
  const advancedRecommendations = generateAdvancedRecommendations(
    vwapAnalysis,
    orderbookAnalysis,
    optionsAnalysis,
    mlAnalysis,
    forecastAnalysis,
    finalDirection
  );

  // Simulate sentiment analysis (in real implementation, this would use news APIs)
  const sentiment = await simulateSentimentAnalysis();

  // Calculate volatility
  const volatility = {
    hourly: data5m.indicators.atr / data5m.close,
    daily: data30m.indicators.atr / data30m.close,
  };

  return {
    direction: finalDirection,
    confidence: confidenceResult.overall,
    confidenceResult,
    support: enhancedLevels.support,
    resistance: enhancedLevels.resistance,
    sentiment,
    volatility,
    smartMoney: smartMoneyAnalysis,
    priceAction: priceActionAnalysis,
    professionalAnalysis,
    technical: technicalIndicators,
    vwapAnalysis,
    orderbookAnalysis,
    optionsAnalysis,
    mlAnalysis,
    forecastAnalysis,
    advancedRecommendations,
  };
}

function analyzePriceActionEnhanced(data5m: any, data15m: any, data30m: any, symbol: string) {
  const prices = [data5m, data15m, data30m];
  
  // Analyze market structure with enhanced logic
  const highs = prices.map(d => d.high);
  const lows = prices.map(d => d.low);
  const closes = prices.map(d => d.close);
  
  // Enhanced trend detection using multiple criteria
  const trendStrength = calculateTrendStrength(prices);
  const trend = determineTrendDirection(prices, trendStrength);
  
  // Enhanced market structure analysis
  const structureBreak = analyzeStructureBreakEnhanced(prices, symbol);
  const structure = structureBreak > 0.3 ? "BULLISH" : structureBreak < -0.3 ? "BEARISH" : "NEUTRAL";
  
  // Calculate enhanced key levels using multiple methods
  const keyLevels = calculateEnhancedSwingLevels(prices, symbol);
  
  // Enhanced breakout probability calculation
  const breakoutProbability = calculateEnhancedBreakoutProbability(prices, symbol);
  
  return {
    trend,
    structure,
    keyLevels,
    breakoutProbability,
  };
}

function calculateTrendStrength(prices: any[]): number {
  // Calculate trend strength using multiple factors
  let trendScore = 0;
  
  // Price momentum across timeframes
  const priceChanges = prices.map((p, i) => 
    i > 0 ? (p.close - prices[i-1].close) / prices[i-1].close : 0
  ).slice(1);
  
  // Consistent direction adds to trend strength
  const positiveChanges = priceChanges.filter(change => change > 0).length;
  const negativeChanges = priceChanges.filter(change => change < 0).length;
  
  if (positiveChanges > negativeChanges) {
    trendScore = positiveChanges / priceChanges.length;
  } else {
    trendScore = -(negativeChanges / priceChanges.length);
  }
  
  // Volume confirmation
  const volumes = prices.map(p => p.volume);
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  const volumeConfirmation = volumes[0] > avgVolume ? 0.2 : -0.1;
  
  return Math.max(-1, Math.min(1, trendScore + volumeConfirmation));
}

function determineTrendDirection(prices: any[], trendStrength: number): "UPTREND" | "DOWNTREND" | "SIDEWAYS" {
  if (Math.abs(trendStrength) < 0.3) return "SIDEWAYS";
  return trendStrength > 0 ? "UPTREND" : "DOWNTREND";
}

function analyzeStructureBreakEnhanced(prices: any[], symbol: string): number {
  // Enhanced structure break analysis with symbol-specific thresholds
  const symbolThresholds = {
    "BTCUSD": 0.02,    // 2% movement needed for BTC
    "ETHUSD": 0.025,   // 2.5% for ETH
    "EURUSD": 0.005,   // 0.5% for major forex
    "GBPUSD": 0.008,   // 0.8% for GBP
    "XAUUSD": 0.01,    // 1% for Gold
    "CRUDE": 0.015     // 1.5% for Oil
  };
  
  const threshold = symbolThresholds[symbol] || 0.01;
  
  const recentHigh = Math.max(...prices.map(p => p.high));
  const recentLow = Math.min(...prices.map(p => p.low));
  const currentPrice = prices[0].close;
  
  // Calculate relative position and movement
  const highBreak = (currentPrice - recentHigh) / recentHigh;
  const lowBreak = (recentLow - currentPrice) / currentPrice;
  
  if (highBreak > threshold) return 1; // Strong bullish break
  if (lowBreak > threshold) return -1; // Strong bearish break
  
  // Partial breaks
  if (highBreak > threshold * 0.5) return 0.5;
  if (lowBreak > threshold * 0.5) return -0.5;
  
  return 0; // No significant break
}

function calculateEnhancedSwingLevels(prices: any[], symbol: string): number[] {
  const highs = prices.map(p => p.high);
  const lows = prices.map(p => p.low);
  const closes = prices.map(p => p.close);
  
  // Basic swing levels
  const basicLevels = [
    Math.max(...highs),
    Math.min(...lows),
    (Math.max(...highs) + Math.min(...lows)) / 2
  ];
  
  // Add Fibonacci-like retracement levels
  const range = Math.max(...highs) - Math.min(...lows);
  const fibLevels = [
    Math.min(...lows) + (range * 0.236),
    Math.min(...lows) + (range * 0.382),
    Math.min(...lows) + (range * 0.618),
    Math.min(...lows) + (range * 0.786)
  ];
  
  // Add volume-weighted levels
  const totalVolume = prices.reduce((sum, p) => sum + p.volume, 0);
  const vwap = prices.reduce((sum, p) => sum + (p.close * p.volume), 0) / totalVolume;
  
  // Combine all levels and remove duplicates
  const allLevels = [...basicLevels, ...fibLevels, vwap];
  return [...new Set(allLevels.map(level => Math.round(level * 100000) / 100000))];
}

function calculateEnhancedBreakoutProbability(prices: any[], symbol: string): number {
  const ranges = prices.map(p => p.high - p.low);
  const avgRange = ranges.reduce((sum, range) => sum + range, 0) / ranges.length;
  const currentRange = ranges[0];
  
  // Consolidation factor (lower range = higher breakout probability)
  const consolidationFactor = currentRange < avgRange * 0.6 ? 0.4 : 0;
  
  // Volume factor
  const volumes = prices.map(p => p.volume);
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  const volumeFactor = volumes[0] > avgVolume * 1.3 ? 0.3 : 0;
  
  // Time compression factor (multiple timeframes showing similar patterns)
  const timeCompressionFactor = calculateTimeCompression(prices);
  
  // Symbol-specific volatility expectations
  const symbolVolatility = getSymbolVolatilityExpectation(symbol);
  
  const totalProbability = (consolidationFactor + volumeFactor + timeCompressionFactor + symbolVolatility) * 100;
  
  return Math.min(95, Math.max(20, totalProbability + 30)); // Base 30% + factors
}

function calculateTimeCompression(prices: any[]): number {
  // Analyze if multiple timeframes are showing similar patterns
  const ranges = prices.map(p => (p.high - p.low) / p.close);
  const avgRange = ranges.reduce((sum, r) => sum + r, 0) / ranges.length;
  const rangeVariation = ranges.reduce((sum, r) => sum + Math.abs(r - avgRange), 0) / ranges.length;
  
  // Lower variation = higher compression = higher breakout probability
  return rangeVariation < avgRange * 0.3 ? 0.2 : 0;
}

function getSymbolVolatilityExpectation(symbol: string): number {
  const volatilityExpectations = {
    "BTCUSD": 0.15,    // High volatility crypto
    "ETHUSD": 0.12,    // High volatility crypto
    "EURUSD": 0.05,    // Low volatility major pair
    "GBPUSD": 0.08,    // Medium volatility
    "XAUUSD": 0.10,    // Medium-high volatility
    "CRUDE": 0.12      // High volatility commodity
  };
  
  return volatilityExpectations[symbol] || 0.08;
}

function analyzeSmartMoneyEnhanced(data5m: any, data15m: any, data30m: any, symbol: string) {
  const volumes = [data5m.volume, data15m.volume, data30m.volume];
  const prices = [data5m.close, data15m.close, data30m.close];
  
  // Enhanced institutional flow analysis
  const institutionalFlow = analyzeInstitutionalFlowEnhanced(volumes, prices, symbol);
  
  // Enhanced volume profile analysis
  const volumeProfile = analyzeVolumeProfilePatternEnhanced(volumes, prices, symbol);
  
  // Enhanced order flow analysis
  const orderFlow = analyzeOrderFlowEnhanced(volumes, prices, symbol);
  
  // Enhanced liquidity zones identification
  const liquidityZones = identifyLiquidityZonesEnhanced(data5m, data15m, data30m, symbol);
  
  return {
    institutionalFlow,
    volumeProfile,
    orderFlow,
    liquidityZones,
  };
}

function analyzeInstitutionalFlowEnhanced(volumes: number[], prices: number[], symbol: string): "BUYING" | "SELLING" | "NEUTRAL" {
  // Enhanced analysis with symbol-specific volume thresholds
  const volumeThresholds = {
    "BTCUSD": 1.5,     // Higher threshold for crypto
    "ETHUSD": 1.4,
    "EURUSD": 1.2,     // Lower threshold for forex
    "GBPUSD": 1.3,
    "XAUUSD": 1.4,
    "CRUDE": 1.5
  };
  
  const threshold = volumeThresholds[symbol] || 1.3;
  
  const volumeWeightedPrice = volumes.reduce((sum, vol, i) => sum + (vol * prices[i]), 0) / volumes.reduce((sum, vol) => sum + vol, 0);
  const currentPrice = prices[0];
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  
  // Check if current volume is significant
  if (volumes[0] < avgVolume * threshold) return "NEUTRAL";
  
  const priceDeviation = (currentPrice - volumeWeightedPrice) / volumeWeightedPrice;
  
  if (priceDeviation > 0.003) return "BUYING";   // 0.3% above VWAP with high volume
  if (priceDeviation < -0.003) return "SELLING"; // 0.3% below VWAP with high volume
  return "NEUTRAL";
}

function analyzeVolumeProfilePatternEnhanced(volumes: number[], prices: number[], symbol: string): "ACCUMULATION" | "DISTRIBUTION" | "CONSOLIDATION" {
  const priceChanges = prices.map((price, i) => i > 0 ? price - prices[i] : 0).slice(1);
  const volumeChanges = volumes.map((vol, i) => i > 0 ? vol - volumes[i] : 0).slice(1);
  
  let accumulationScore = 0;
  let distributionScore = 0;
  let consolidationScore = 0;
  
  for (let i = 0; i < priceChanges.length; i++) {
    const priceChange = priceChanges[i];
    const volumeChange = volumeChanges[i];
    const volumeRatio = volumes[i] / (volumes[i + 1] || 1);
    
    // Enhanced scoring with volume ratio consideration
    if (priceChange > 0 && volumeChange > 0 && volumeRatio > 1.2) {
      accumulationScore += 2; // Strong accumulation
    } else if (priceChange > 0 && volumeChange > 0) {
      accumulationScore += 1; // Weak accumulation
    }
    
    if (priceChange < 0 && volumeChange > 0 && volumeRatio > 1.2) {
      distributionScore += 2; // Strong distribution
    } else if (priceChange < 0 && volumeChange > 0) {
      distributionScore += 1; // Weak distribution
    }
    
    if (Math.abs(priceChange) < prices[i] * 0.005 && volumeChange < 0) {
      consolidationScore += 1; // Low volatility with decreasing volume
    }
  }
  
  const maxScore = Math.max(accumulationScore, distributionScore, consolidationScore);
  
  if (maxScore === accumulationScore && accumulationScore > 0) return "ACCUMULATION";
  if (maxScore === distributionScore && distributionScore > 0) return "DISTRIBUTION";
  return "CONSOLIDATION";
}

function analyzeOrderFlowEnhanced(volumes: number[], prices: number[], symbol: string): "BULLISH" | "BEARISH" | "NEUTRAL" {
  // Enhanced order flow analysis with price momentum consideration
  const buyingPressure = volumes.filter((vol, i) => {
    const priceUp = prices[i] > (i > 0 ? prices[i-1] : prices[i]);
    const significantVolume = vol > (volumes.reduce((sum, v) => sum + v, 0) / volumes.length) * 1.1;
    return priceUp && significantVolume;
  }).reduce((sum, vol) => sum + vol, 0);
  
  const sellingPressure = volumes.filter((vol, i) => {
    const priceDown = prices[i] < (i > 0 ? prices[i-1] : prices[i]);
    const significantVolume = vol > (volumes.reduce((sum, v) => sum + v, 0) / volumes.length) * 1.1;
    return priceDown && significantVolume;
  }).reduce((sum, vol) => sum + vol, 0);
  
  const totalSignificantVolume = buyingPressure + sellingPressure;
  
  if (totalSignificantVolume === 0) return "NEUTRAL";
  
  const buyingRatio = buyingPressure / totalSignificantVolume;
  
  if (buyingRatio > 0.65) return "BULLISH";
  if (buyingRatio < 0.35) return "BEARISH";
  return "NEUTRAL";
}

function identifyLiquidityZonesEnhanced(data5m: any, data15m: any, data30m: any, symbol: string): number[] {
  const currentPrice = data5m.close;
  const levels = [];
  
  // Previous highs and lows with enhanced weighting
  levels.push(
    { price: data30m.high, weight: 3 },
    { price: data30m.low, weight: 3 },
    { price: data15m.high, weight: 2 },
    { price: data15m.low, weight: 2 },
    { price: data5m.high, weight: 1 },
    { price: data5m.low, weight: 1 }
  );
  
  // Enhanced psychological levels based on symbol characteristics
  const psychLevels = calculatePsychologicalLevels(currentPrice, symbol);
  psychLevels.forEach(level => levels.push({ price: level, weight: 2 }));
  
  // VWAP levels with different timeframe weights
  const vwap5m = data5m.close;
  const vwap15m = (data5m.close + data15m.close) / 2;
  const vwap30m = (data5m.close + data15m.close + data30m.close) / 3;
  
  levels.push(
    { price: vwap5m, weight: 1 },
    { price: vwap15m, weight: 2 },
    { price: vwap30m, weight: 3 }
  );
  
  // Enhanced Fibonacci levels
  const recentHigh = Math.max(data5m.high, data15m.high, data30m.high);
  const recentLow = Math.min(data5m.low, data15m.low, data30m.low);
  const range = recentHigh - recentLow;
  
  if (range > 0) {
    const fibLevels = [0.236, 0.382, 0.5, 0.618, 0.786];
    fibLevels.forEach(fib => {
      levels.push({ price: recentLow + (range * fib), weight: 2 });
    });
  }
  
  // Sort by weight and proximity to current price
  const weightedLevels = levels
    .map(level => ({
      ...level,
      distance: Math.abs(level.price - currentPrice) / currentPrice,
      score: level.weight / (1 + level.distance * 10) // Closer levels get higher scores
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8) // Take top 8 levels
    .map(level => level.price)
    .filter((price, index, self) => self.indexOf(price) === index) // Remove duplicates
    .sort((a, b) => a - b);
  
  return weightedLevels;
}

function calculatePsychologicalLevels(currentPrice: number, symbol: string): number[] {
  const levels = [];
  
  // Symbol-specific psychological level spacing
  const spacingMap = {
    "BTCUSD": [1000, 5000, 10000],      // $1k, $5k, $10k levels
    "ETHUSD": [100, 500, 1000],         // $100, $500, $1k levels
    "EURUSD": [0.01, 0.05, 0.1],        // 1 cent, 5 cent, 10 cent levels
    "GBPUSD": [0.01, 0.05, 0.1],        // 1 cent, 5 cent, 10 cent levels
    "USDJPY": [1, 5, 10],               // 1 yen, 5 yen, 10 yen levels
    "XAUUSD": [10, 50, 100],            // $10, $50, $100 levels
    "CRUDE": [1, 5, 10]                 // $1, $5, $10 levels
  };
  
  const spacings = spacingMap[symbol] || [currentPrice * 0.01, currentPrice * 0.05, currentPrice * 0.1];
  
  spacings.forEach(spacing => {
    const nearestLevel = Math.round(currentPrice / spacing) * spacing;
    levels.push(
      nearestLevel,
      nearestLevel + spacing,
      nearestLevel - spacing,
      nearestLevel + (spacing * 2),
      nearestLevel - (spacing * 2)
    );
  });
  
  return levels.filter(level => level > 0);
}

function calculateEnhancedSupportResistance(data5m: any, data15m: any, data30m: any, symbol: string) {
  const currentPrice = data5m.close;
  const allLevels = identifyLiquidityZonesEnhanced(data5m, data15m, data30m, symbol);
  
  // Separate into support and resistance with enhanced logic
  const supportLevels = allLevels.filter(level => level < currentPrice * 0.995); // 0.5% buffer
  const resistanceLevels = allLevels.filter(level => level > currentPrice * 1.005); // 0.5% buffer
  
  // Find the most significant levels (closest to current price)
  const nearestSupport = supportLevels.length > 0 
    ? supportLevels.sort((a, b) => b - a)[0] // Highest support below current price
    : currentPrice * 0.95; // Fallback 5% below
    
  const nearestResistance = resistanceLevels.length > 0
    ? resistanceLevels.sort((a, b) => a - b)[0] // Lowest resistance above current price
    : currentPrice * 1.05; // Fallback 5% above
  
  return {
    support: Math.round(nearestSupport * 100000) / 100000,
    resistance: Math.round(nearestResistance * 100000) / 100000
  };
}

function analyzeVolumeProfile(data5m: any, data15m: any, data30m: any) {
  const timeframes = [data5m, data15m, data30m];
  
  // Calculate volume-weighted average price (VWAP) concept
  const vwap = calculateVWAP(timeframes);
  
  // Analyze volume distribution
  const volumeDistribution = analyzeVolumeDistribution(timeframes);
  
  // Identify high volume nodes (HVN) and low volume nodes (LVN)
  const volumeNodes = identifyVolumeNodes(timeframes);
  
  return {
    vwap,
    distribution: volumeDistribution,
    nodes: volumeNodes,
  };
}

async function analyzeProfessionalTraders(symbol: string, marketData: TimeframeData) {
  // Simulate analysis of top professional traders for the asset
  const topTraders = getTopTradersForAsset(symbol);
  
  // Analyze their typical strategies and current market view
  const consensusView = analyzeTraderConsensus(symbol, marketData);
  
  // Calculate risk-reward based on professional standards
  const riskReward = calculateProfessionalRiskReward(marketData);
  
  // Determine optimal timeframe based on asset characteristics
  const timeframe = determineOptimalTimeframe(symbol);
  
  return {
    topTraders,
    consensusView,
    riskReward,
    timeframe,
  };
}

function getTopTradersForAsset(symbol: string): string[] {
  const traderDatabase = {
    "BTCUSD": [
      "Plan B (S2F Model Creator)",
      "Willy Woo (On-chain Analyst)", 
      "Benjamin Cowen (Crypto Analyst)",
      "Coin Bureau (Educational Content)",
      "The Moon (Technical Analysis)"
    ],
    "EURUSD": [
      "Kathy Lien (BK Asset Management)",
      "Boris Schlossberg (BK Asset Management)",
      "James Stanley (DailyFX)",
      "Christopher Vecchio (DailyFX)",
      "Nick Cawley (DailyFX)"
    ],
    "GBPUSD": [
      "Kathy Lien (BK Asset Management)",
      "James Stanley (DailyFX)",
      "Nick Cawley (DailyFX)",
      "Christopher Vecchio (DailyFX)",
      "Paul Robinson (FXPro)"
    ],
    "XAUUSD": [
      "Peter Schiff (Euro Pacific Capital)",
      "Jim Rickards (Strategic Intelligence)",
      "Mike Maloney (GoldSilver.com)",
      "Rick Rule (Sprott Inc)",
      "David Morgan (Silver Investor)"
    ],
    "CRUDE": [
      "Phil Flynn (Price Futures Group)",
      "John Kilduff (Again Capital)",
      "Andy Lipow (Lipow Oil Associates)",
      "Bob Yawger (Mizuho Securities)",
      "Rebecca Babin (CIBC Private Wealth)"
    ]
  };
  
  return traderDatabase[symbol] || [
    "Professional Trader 1",
    "Professional Trader 2", 
    "Professional Trader 3",
    "Professional Trader 4",
    "Professional Trader 5"
  ];
}

function analyzeTraderConsensus(symbol: string, marketData: TimeframeData): "BULLISH" | "BEARISH" | "NEUTRAL" {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];
  
  // Simulate professional trader analysis based on market conditions
  const factors = [];
  
  // Price momentum
  if (data5m.close > data15m.close && data15m.close > data30m.close) {
    factors.push(1); // Bullish momentum
  } else if (data5m.close < data15m.close && data15m.close < data30m.close) {
    factors.push(-1); // Bearish momentum
  } else {
    factors.push(0); // Neutral
  }
  
  // Volume confirmation
  if (data5m.volume > data15m.volume * 1.2) {
    factors.push(data5m.close > data5m.open ? 1 : -1);
  } else {
    factors.push(0);
  }
  
  // Volatility analysis
  const avgVolatility = (data5m.indicators.atr + data15m.indicators.atr + data30m.indicators.atr) / 3;
  if (avgVolatility > data5m.close * 0.02) {
    factors.push(0); // High volatility = neutral
  } else {
    factors.push(data5m.close > data30m.close ? 1 : -1);
  }
  
  const consensus = factors.reduce((sum, factor) => sum + factor, 0);
  
  if (consensus > 1) return "BULLISH";
  if (consensus < -1) return "BEARISH";
  return "NEUTRAL";
}

function calculateProfessionalRiskReward(marketData: TimeframeData): number {
  const data5m = marketData["5m"];
  const atr = data5m.indicators.atr;
  
  // Professional traders typically aim for 1:2 or 1:3 risk-reward
  const stopLoss = atr * 1.5;
  const takeProfit = atr * 3;
  
  return takeProfit / stopLoss;
}

function determineOptimalTimeframe(symbol: string): string {
  const timeframeMap = {
    "BTCUSD": "15m-1h", // Crypto moves fast
    "ETHUSD": "15m-1h",
    "EURUSD": "5m-15m", // Forex scalping
    "GBPUSD": "5m-15m",
    "USDJPY": "5m-15m",
    "XAUUSD": "15m-30m", // Gold intermediate moves
    "CRUDE": "15m-30m", // Oil intermediate moves
  };
  
  return timeframeMap[symbol] || "15m";
}

async function analyzeWithGeminiCached(
  marketData: TimeframeData, 
  symbol: string, 
  additionalData: any
): Promise<{ direction: "LONG" | "SHORT"; confidence: number }> {
  try {
    // Create cache key based on market data and symbol
    const cacheKey = `${symbol}_${marketData["5m"].close}_${Date.now() - (Date.now() % (5 * 60 * 1000))}`;
    
    // Check cache first
    const cached = geminiCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log("Using cached Gemini analysis");
      return cached.response;
    }

    const apiKey = geminiApiKey();
    if (!apiKey || apiKey === "your_gemini_key") {
      console.log("Gemini API key not configured, using fallback analysis");
      return fallbackAnalysis(marketData);
    }

    const prompt = createAdvancedTradingPrompt(marketData, symbol, additionalData);
    
    // Simplified single request with longer timeout to Gemini Pro
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 500, // Increased for comprehensive analysis
          }
        })
      });

      if (response.status === 429) {
        console.log("Gemini quota exceeded, using enhanced fallback analysis");
        return enhancedFallbackAnalysis(marketData, additionalData);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
        return enhancedFallbackAnalysis(marketData, additionalData);
      }

      const data = await response.json();
      
      if (data.error) {
        console.error("Gemini API response error:", data.error);
        return enhancedFallbackAnalysis(marketData, additionalData);
      }
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        console.log("No text response from Gemini, using enhanced fallback");
        return enhancedFallbackAnalysis(marketData, additionalData);
      }

      const result = parseGeminiResponse(text);
      
      // Cache the result
      geminiCache.set(cacheKey, {
        response: result,
        timestamp: Date.now()
      });
      
      // Clean old cache entries
      cleanCache();
      
      console.log("Gemini analysis successful");
      return result;
      
    } catch (error) {
      console.error("Gemini API request failed:", error);
      return enhancedFallbackAnalysis(marketData, additionalData);
    }

  } catch (error) {
    console.error("Error in Gemini analysis:", error);
    return enhancedFallbackAnalysis(marketData, additionalData);
  }
}

function cleanCache() {
  const now = Date.now();
  for (const [key, value] of geminiCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      geminiCache.delete(key);
    }
  }
}

function createAdvancedTradingPrompt(marketData: TimeframeData, symbol: string, additionalData: any): string {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];

  // Comprehensive prompt for Gemini Pro with all analysis components
  return `
Comprehensive ${symbol} Trading Signal Analysis:

MARKET DATA:
5m: O:${data5m.open} H:${data5m.high} L:${data5m.low} C:${data5m.close} V:${data5m.volume}
15m: O:${data15m.open} H:${data15m.high} L:${data15m.low} C:${data15m.close} V:${data15m.volume}
30m: O:${data30m.open} H:${data30m.high} L:${data30m.low} C:${data30m.close} V:${data30m.volume}

TECHNICAL ANALYSIS:
- Trend: ${additionalData.priceAction.trend}
- Structure: ${additionalData.priceAction.structure}
- RSI: ${data5m.indicators?.rsi?.toFixed(1) || 'N/A'}
- MACD: ${data5m.indicators?.macd?.toFixed(4) || 'N/A'}

SMART MONEY FLOW:
- Institutional: ${additionalData.smartMoney.institutionalFlow}
- Volume Profile: ${additionalData.smartMoney.volumeProfile}
- Order Flow: ${additionalData.smartMoney.orderFlow}

VWAP ANALYSIS:
- Position: ${additionalData.vwap?.position || 'N/A'}
- Signal: ${additionalData.vwap?.signalType || 'N/A'}
- Trend Strength: ${additionalData.vwap?.trendStrength?.toFixed(2) || 'N/A'}

ORDERBOOK DEPTH:
- Institutional Direction: ${additionalData.orderbook?.institutionalFlow?.direction || 'N/A'}
- Flow Strength: ${additionalData.orderbook?.institutionalFlow?.strength?.toFixed(2) || 'N/A'}
- Large Orders: ${additionalData.orderbook?.institutionalFlow?.largeOrderDetection || 'N/A'}

ML ENSEMBLE:
- Signal: ${additionalData.ml?.ensembleConsensus?.signal || 'N/A'}
- Confidence: ${additionalData.ml?.ensembleConsensus?.confidence?.toFixed(2) || 'N/A'}
- Agreement: ${additionalData.ml?.ensembleConsensus?.agreement?.toFixed(2) || 'N/A'}

OPTIONS FLOW:
- Gamma: ${additionalData.options?.gammaExposure?.direction || 'N/A'}
- Impact: ${additionalData.options?.gammaExposure?.impact || 'N/A'}
- MM Flow: ${additionalData.options?.marketMakerFlow?.hedgingDirection || 'N/A'}

PROFESSIONAL CONSENSUS: ${additionalData.professional.consensusView}

Analyze all factors and provide:
DIRECTION: [LONG/SHORT]
CONFIDENCE: [70-95]
KEY_FACTOR: [Most important analysis component]
RISK_LEVEL: [LOW/MEDIUM/HIGH]
REASONING: [2-3 sentence explanation]
`;
}

function parseGeminiResponse(text: string): { direction: "LONG" | "SHORT"; confidence: number } {
  try {
    const directionMatch = text.match(/DIRECTION:\s*(LONG|SHORT)/i);
    const confidenceMatch = text.match(/CONFIDENCE:\s*(\d+)/i);

    const direction = directionMatch?.[1]?.toUpperCase() as "LONG" | "SHORT" || "LONG";
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 75;

    return {
      direction,
      confidence: Math.max(70, Math.min(95, confidence))
    };
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return { direction: "LONG", confidence: 75 };
  }
}

function enhancedFallbackAnalysis(marketData: TimeframeData, additionalData: any): { direction: "LONG" | "SHORT"; confidence: number } {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];

  // Enhanced fallback analysis using all available data
  let bullishSignals = 0;
  let bearishSignals = 0;
  let totalWeight = 0;
  
  // Price momentum analysis (weight: 3)
  const priceChanges = [
    (data5m.close - data15m.close) / data15m.close,
    (data15m.close - data30m.close) / data30m.close
  ];
  
  priceChanges.forEach(change => {
    if (change > 0.001) bullishSignals += 3; // 0.1% threshold
    else if (change < -0.001) bearishSignals += 3;
    totalWeight += 3;
  });
  
  // Volume analysis (weight: 2)
  if (data5m.volume > data15m.volume * 1.2) {
    if (data5m.close > data5m.open) bullishSignals += 2;
    else bearishSignals += 2;
    totalWeight += 2;
  }
  
  // Technical indicators (weight: 2)
  if (data5m.indicators.rsi < 30) bullishSignals += 2; // Oversold
  else if (data5m.indicators.rsi > 70) bearishSignals += 2; // Overbought
  totalWeight += 2;
  
  if (data5m.indicators.macd > 0) bullishSignals += 1;
  else bearishSignals += 1;
  totalWeight += 1;
  
  // Smart money analysis (weight: 4)
  if (additionalData.smartMoney.institutionalFlow === "BUYING") bullishSignals += 2;
  else if (additionalData.smartMoney.institutionalFlow === "SELLING") bearishSignals += 2;
  totalWeight += 2;
  
  if (additionalData.smartMoney.volumeProfile === "ACCUMULATION") bullishSignals += 1;
  else if (additionalData.smartMoney.volumeProfile === "DISTRIBUTION") bearishSignals += 1;
  totalWeight += 1;
  
  if (additionalData.smartMoney.orderFlow === "BULLISH") bullishSignals += 1;
  else if (additionalData.smartMoney.orderFlow === "BEARISH") bearishSignals += 1;
  totalWeight += 1;
  
  // Price action analysis (weight: 3)
  if (additionalData.priceAction.trend === "UPTREND") bullishSignals += 2;
  else if (additionalData.priceAction.trend === "DOWNTREND") bearishSignals += 2;
  totalWeight += 2;
  
  if (additionalData.priceAction.structure === "BULLISH") bullishSignals += 1;
  else if (additionalData.priceAction.structure === "BEARISH") bearishSignals += 1;
  totalWeight += 1;
  
  // Calculate direction and confidence
  const direction = bullishSignals > bearishSignals ? "LONG" : "SHORT";
  const signalStrength = Math.abs(bullishSignals - bearishSignals);
  const confidence = Math.min(90, 70 + (signalStrength / totalWeight) * 20);

  console.log(`Enhanced fallback analysis: ${direction} with ${confidence}% confidence (${bullishSignals}/${bearishSignals} signals)`);

  return { direction, confidence };
}

function fallbackAnalysis(marketData: TimeframeData): { direction: "LONG" | "SHORT"; confidence: number } {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];

  // Basic price action analysis
  let bullishSignals = 0;
  let bearishSignals = 0;
  
  // Price momentum
  if (data5m.close > data15m.close) bullishSignals++;
  else bearishSignals++;
  
  if (data15m.close > data30m.close) bullishSignals++;
  else bearishSignals++;
  
  // Volume confirmation
  if (data5m.volume > data15m.volume && data5m.close > data5m.open) bullishSignals++;
  if (data5m.volume > data15m.volume && data5m.close < data5m.open) bearishSignals++;
  
  // Technical indicators
  if (data5m.indicators.rsi < 30) bullishSignals++; // Oversold
  if (data5m.indicators.rsi > 70) bearishSignals++; // Overbought
  
  const direction = bullishSignals > bearishSignals ? "LONG" : "SHORT";
  const signalStrength = Math.abs(bullishSignals - bearishSignals);
  const confidence = Math.min(85, 70 + (signalStrength * 3));

  return { direction, confidence };
}

function calculateVWAP(timeframes: any[]) {
  const totalVolume = timeframes.reduce((sum, tf) => sum + tf.volume, 0);
  const vwap = timeframes.reduce((sum, tf) => sum + (tf.close * tf.volume), 0) / totalVolume;
  return vwap;
}

function analyzeVolumeDistribution(timeframes: any[]) {
  const volumes = timeframes.map(tf => tf.volume);
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  
  if (volumes[0] > avgVolume * 1.5) return "HIGH_VOLUME";
  if (volumes[0] < avgVolume * 0.5) return "LOW_VOLUME";
  return "NORMAL_VOLUME";
}

function identifyVolumeNodes(timeframes: any[]) {
  const priceVolumePairs = timeframes.map(tf => ({ price: tf.close, volume: tf.volume }));
  
  // Find high volume nodes (areas of high trading activity)
  const sortedByVolume = priceVolumePairs.sort((a, b) => b.volume - a.volume);
  
  return {
    highVolumeNodes: sortedByVolume.slice(0, 2).map(pair => pair.price),
    lowVolumeNodes: sortedByVolume.slice(-2).map(pair => pair.price)
  };
}

function determineDirectionWithAdvancedAnalysis(
  priceAction: any,
  smartMoney: any,
  volumeAnalysis: any,
  geminiAnalysis: any,
  vwapAnalysis: VWAPAnalysis,
  orderbookAnalysis: OrderbookAnalysis,
  optionsAnalysis: OptionsAnalysis,
  mlAnalysis: MLAnalysis
): "LONG" | "SHORT" {
  let bullishScore = 0;
  let bearishScore = 0;
  
  // Original analysis weight: 60%
  // Price action weight: 20%
  if (priceAction.trend === "UPTREND") bullishScore += 0.10;
  if (priceAction.trend === "DOWNTREND") bearishScore += 0.10;
  if (priceAction.structure === "BULLISH") bullishScore += 0.10;
  if (priceAction.structure === "BEARISH") bearishScore += 0.10;
  
  // Smart money weight: 20%
  if (smartMoney.institutionalFlow === "BUYING") bullishScore += 0.08;
  if (smartMoney.institutionalFlow === "SELLING") bearishScore += 0.08;
  if (smartMoney.volumeProfile === "ACCUMULATION") bullishScore += 0.06;
  if (smartMoney.volumeProfile === "DISTRIBUTION") bearishScore += 0.06;
  if (smartMoney.orderFlow === "BULLISH") bullishScore += 0.06;
  if (smartMoney.orderFlow === "BEARISH") bearishScore += 0.06;
  
  // Gemini AI weight: 10%
  if (geminiAnalysis.direction === "LONG") bullishScore += 0.10;
  if (geminiAnalysis.direction === "SHORT") bearishScore += 0.10;
  
  // Advanced analysis weight: 40%
  // VWAP analysis weight: 15%
  if (vwapAnalysis.position === 'ABOVE_VWAP' && vwapAnalysis.signalType === 'TREND_CONTINUATION') {
    bullishScore += 0.15;
  } else if (vwapAnalysis.position === 'BELOW_VWAP' && vwapAnalysis.signalType === 'TREND_CONTINUATION') {
    bearishScore += 0.15;
  } else if (vwapAnalysis.signalType === 'MEAN_REVERSION') {
    // Mean reversion signal - opposite bias
    if (vwapAnalysis.position === 'ABOVE_VWAP') bearishScore += 0.08;
    else if (vwapAnalysis.position === 'BELOW_VWAP') bullishScore += 0.08;
  }
  
  // ML Ensemble weight: 15%
  if (mlAnalysis.ensembleConsensus.signal === 'LONG') {
    bullishScore += 0.15 * mlAnalysis.ensembleConsensus.confidence;
  } else if (mlAnalysis.ensembleConsensus.signal === 'SHORT') {
    bearishScore += 0.15 * mlAnalysis.ensembleConsensus.confidence;
  }
  
  // Orderbook analysis weight: 10%
  if (orderbookAnalysis.institutionalFlow.direction === 'BUYING' && orderbookAnalysis.institutionalFlow.strength > 0.6) {
    bullishScore += 0.10;
  } else if (orderbookAnalysis.institutionalFlow.direction === 'SELLING' && orderbookAnalysis.institutionalFlow.strength > 0.6) {
    bearishScore += 0.10;
  }
  
  return bullishScore > bearishScore ? "LONG" : "SHORT";
}

function generateAdvancedRecommendations(
  vwapAnalysis: VWAPAnalysis,
  orderbookAnalysis: OrderbookAnalysis,
  optionsAnalysis: OptionsAnalysis,
  mlAnalysis: MLAnalysis,
  forecastAnalysis: ForecastAnalysis,
  direction: "LONG" | "SHORT"
): string[] {
  const recommendations: string[] = [];
  
  // VWAP recommendations
  const vwapRecs = getVWAPRecommendations(vwapAnalysis, direction);
  recommendations.push(...vwapRecs);
  
  // Orderbook recommendations
  const orderbookSignals = getOrderbookSignals(orderbookAnalysis);
  recommendations.push(...orderbookSignals);
  
  // Options recommendations
  const optionsSignals = getOptionsSignals(optionsAnalysis, forecastAnalysis.priceForecasts['1h'].price);
  recommendations.push(...optionsSignals);
  
  // ML recommendations
  const mlRecs = getMLRecommendations(mlAnalysis);
  recommendations.push(...mlRecs);
  
  // Forecasting recommendations
  const forecastInsights = getForecastingInsights(forecastAnalysis);
  recommendations.push(...forecastInsights);
  
  return recommendations;
}

function calculateConfidence(
  priceAction: any,
  smartMoney: any,
  volumeAnalysis: any,
  professionalAnalysis: any,
  geminiAnalysis: any
): number {
  let baseConfidence = 70;
  
  // Add confidence based on signal alignment
  let alignmentScore = 0;
  
  // Price action alignment
  if (priceAction.trend !== "SIDEWAYS" && priceAction.structure !== "NEUTRAL") {
    alignmentScore += 5;
  }
  
  // Smart money alignment
  if (smartMoney.institutionalFlow !== "NEUTRAL" && smartMoney.orderFlow !== "NEUTRAL") {
    alignmentScore += 8;
  }
  
  // Professional consensus alignment
  if (professionalAnalysis.consensusView !== "NEUTRAL") {
    alignmentScore += 5;
  }
  
  // Gemini confidence boost (reduced impact to account for fallback)
  alignmentScore += Math.min(10, (geminiAnalysis.confidence - 70) * 0.2);
  
  // Breakout probability boost
  if (priceAction.breakoutProbability > 70) {
    alignmentScore += 5;
  }
  
  return Math.min(95, Math.max(70, baseConfidence + alignmentScore));
}

async function simulateSentimentAnalysis(): Promise<{ score: number; sources: string[] }> {
  // In a real implementation, this would analyze news, social media, etc.
  const score = -0.5 + Math.random(); // Random sentiment between -0.5 and 0.5
  const sources = ["Economic Calendar", "Social Media", "News Analysis"];
  
  return { score, sources };
}
