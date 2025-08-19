import { secret } from "encore.dev/config";
import { TimeframeData } from "./market-data";
import { analyzeSentiment } from "./sentiment-analyzer";
import { analyzeVWAP, generateVWAPSignals } from "./vwap-analyzer";
import { 
  calculateEnhancedIndicators, 
  analyzeMultiTimeframeConfluence, 
  getMarketConditionContext,
  MultiTimeframeAnalysis,
  MarketConditionContext,
  EnhancedIndicators
} from "./enhanced-technical-analysis";
import { 
  calculateEnhancedConfidence,
  EnhancedConfidenceResult
} from "./enhanced-confidence-system";
import {
  performInstitutionalAnalysis,
  InstitutionalAnalysis
} from "./institutional-analysis";
import { learningEngine } from "../ml/learning-engine";
import { TradingStrategy } from "./trading-strategies";
const geminiApiKey = secret("GeminiApiKey");

export interface AIAnalysis {
  direction: "LONG" | "SHORT";
  confidence: number;
  enhancedConfidence: EnhancedConfidenceResult; // New enhanced confidence system
  institutionalAnalysis: InstitutionalAnalysis; // New institutional analysis
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
  technical: {
    rsi: number;
    macd: number;
    atr: number;
  };
  enhancedTechnical: {
    indicators5m: EnhancedIndicators;
    indicators15m: EnhancedIndicators;
    indicators30m: EnhancedIndicators;
    multiTimeframeAnalysis: MultiTimeframeAnalysis;
    marketContext: MarketConditionContext;
  };
  // Enhanced analysis components
  vwap: {
    analysis: any;
    signals: any;
  };
}

// Cache for Gemini responses to reduce API calls
const geminiCache = new Map<string, { response: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function analyzeWithAI(marketData: TimeframeData, symbol: string, strategy: TradingStrategy): Promise<AIAnalysis> {
  // Extract key data from different timeframes
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];

  console.log(`🔍 Starting enhanced AI analysis for ${symbol}`);

  // ========== ENHANCED TECHNICAL ANALYSIS ==========
  const indicators5m = calculateEnhancedIndicators(
    [data5m.open], [data5m.high], [data5m.low], [data5m.close]
  );
  
  const indicators15m = calculateEnhancedIndicators(
    [data15m.open], [data15m.high], [data15m.low], [data15m.close]
  );
  
  const indicators30m = calculateEnhancedIndicators(
    [data30m.open], [data30m.high], [data30m.low], [data30m.close]
  );

  // Analyze multi-timeframe confluence
  const multiTimeframeAnalysis = analyzeMultiTimeframeConfluence(data5m, data15m, data30m);
  
  // Get current market condition context
  const marketContext = getMarketConditionContext();

  console.log(`📊 Multi-timeframe confluence: ${multiTimeframeAnalysis.confluence}%`);
  console.log(`⏰ Market session: ${marketContext.sessionType}`);
  console.log(`📈 Volatility state: ${multiTimeframeAnalysis.volatilityState}`);

  // ========== INSTITUTIONAL ANALYSIS (eseguita presto per il filtro) ==========
  const institutionalAnalysis = performInstitutionalAnalysis(
    data5m, data15m, data30m, data30m, data30m, data30m, symbol
  );
  const institutionalBias = institutionalAnalysis.marketMakerModel.smartMoneyDirection;

  // Direzione Tecnica
  const technicalDirection = determineEnhancedDirection(
    indicators5m, indicators15m, indicators30m, 
    multiTimeframeAnalysis, "LONG"
  );

  // *** NUOVO: Filtro Istituzionale Stretto ***
  if (
    (technicalDirection === "LONG" && institutionalBias === "SHORT") ||
    (technicalDirection === "SHORT" && institutionalBias === "LONG")
  ) {
    const conflictMessage = `Signal for ${symbol} discarded due to institutional conflict: Technical Direction ${technicalDirection}, Institutional Bias ${institutionalBias}`;
    console.log(`❌ ${conflictMessage}`);
    throw new Error(conflictMessage);
  }

  // Se il filtro è superato, si procede con l'analisi completa
  const priceActionAnalysis = analyzePriceActionEnhanced(data5m, data15m, data30m, symbol);
  const smartMoneyAnalysis = analyzeSmartMoneyEnhanced(data5m, data15m, data30m, symbol);
  const volumeAnalysis = analyzeVolumeProfile(data5m, data15m, data30m);
  const professionalAnalysis = await analyzeProfessionalTraders(symbol, marketData);
  const vwapAnalysis = analyzeVWAP(marketData, symbol);
  const vwapSignals = generateVWAPSignals(vwapAnalysis);
  const sentimentAnalysis = await analyzeSentiment(symbol);
  const geminiAnalysis = await analyzeWithGeminiCached(marketData, symbol, {
    priceAction: priceActionAnalysis,
    smartMoney: smartMoneyAnalysis,
    volume: volumeAnalysis,
    professional: professionalAnalysis,
    vwap: vwapAnalysis
  });
  const enhancedLevels = calculateEnhancedSupportResistance(data5m, data15m, data30m, symbol);

  // ========== ENHANCED CONFIDENCE CALCULATION ==========
  const enhancedConfidence = calculateEnhancedConfidence(
    indicators5m,
    indicators15m, 
    indicators30m,
    multiTimeframeAnalysis,
    marketContext,
    technicalDirection,
    symbol,
    undefined, // historicalWinRate
    institutionalAnalysis // Pass institutional analysis
  );

  // *** NUOVO: Apprendimento Adattivo ***
  let finalConfidence = enhancedConfidence.finalConfidence;
  const adjustments = await learningEngine.getConfidenceAdjustments(symbol, marketContext.sessionType, strategy);
  if (adjustments.length > 0) {
    console.log(`🧠 Applying ${adjustments.length} adaptive learning adjustments...`);
    for (const adj of adjustments) {
      console.log(`   - ${adj.parameter}: ${adj.value}%`);
      finalConfidence *= (1 + (adj.value / 100));
    }
    finalConfidence = Math.max(15, Math.min(98, finalConfidence));
    console.log(`🧠 Adjusted confidence: ${finalConfidence.toFixed(1)}%`);
  }

  // Log warnings if any
  if (enhancedConfidence.warnings.length > 0) {
    console.log(`⚠️ Warnings: ${enhancedConfidence.warnings.join(', ')}`);
  }

  // ========== SENTIMENT AND VOLATILITY ==========
  const volatility = {
    hourly: data5m.indicators.atr / data5m.close,
    daily: data30m.indicators.atr / data30m.close,
  };

  // Extract technical indicators for frontend compatibility
  const technical = {
    rsi: data5m.indicators.rsi,
    macd: data5m.indicators.macd,
    atr: data5m.indicators.atr,
  };

  console.log(`✅ Enhanced AI analysis completed for ${symbol}`);

  return {
    direction: technicalDirection,
    confidence: finalConfidence,
    enhancedConfidence, // Include full enhanced confidence result
    institutionalAnalysis, // Include comprehensive institutional analysis
    support: enhancedLevels.support,
    resistance: enhancedLevels.resistance,
    sentiment: {
      score: sentimentAnalysis.score,
      sources: sentimentAnalysis.sources,
    },
    volatility,
    smartMoney: smartMoneyAnalysis,
    priceAction: priceActionAnalysis,
    professionalAnalysis,
    technical,
    enhancedTechnical: {
      indicators5m,
      indicators15m,
      indicators30m,
      multiTimeframeAnalysis,
      marketContext,
    },
    // Enhanced analysis components
    vwap: {
      analysis: vwapAnalysis,
      signals: vwapSignals
    },
  };
}

function analyzePriceActionEnhanced(data5m: any, data15m: any, data30m: any, symbol: string) {
  const prices = [data5m, data15m, data30m];
  const trendStrength = calculateTrendStrength(prices);
  const trend = determineTrendDirection(prices, trendStrength);
  const structureBreak = analyzeStructureBreakEnhanced(prices, symbol);
  const structure: "BULLISH" | "BEARISH" | "NEUTRAL" = structureBreak > 0.3 ? "BULLISH" : structureBreak < -0.3 ? "BEARISH" : "NEUTRAL";
  const keyLevels = calculateEnhancedSwingLevels(prices, symbol);
  const breakoutProbability = calculateEnhancedBreakoutProbability(prices, symbol);
  
  return {
    trend,
    structure,
    keyLevels,
    breakoutProbability,
  };
}

function calculateTrendStrength(prices: any[]): number {
  let trendScore = 0;
  const priceChanges = prices.map((p, i) => 
    i > 0 ? (p.close - prices[i-1].close) / prices[i-1].close : 0
  ).slice(1);
  const positiveChanges = priceChanges.filter(change => change > 0).length;
  const negativeChanges = priceChanges.filter(change => change < 0).length;
  if (positiveChanges > negativeChanges) {
    trendScore = positiveChanges / priceChanges.length;
  } else {
    trendScore = -(negativeChanges / priceChanges.length);
  }
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
  const symbolThresholds: Record<string, number> = {
    "BTCUSD": 0.02, "ETHUSD": 0.025, "EURUSD": 0.005, "GBPUSD": 0.008, "XAUUSD": 0.01, "CRUDE": 0.015
  };
  const threshold = symbolThresholds[symbol] || 0.01;
  const recentHigh = Math.max(...prices.map(p => p.high));
  const recentLow = Math.min(...prices.map(p => p.low));
  const currentPrice = prices[0].close;
  const highBreak = (currentPrice - recentHigh) / recentHigh;
  const lowBreak = (recentLow - currentPrice) / currentPrice;
  if (highBreak > threshold) return 1;
  if (lowBreak > threshold) return -1;
  if (highBreak > threshold * 0.5) return 0.5;
  if (lowBreak > threshold * 0.5) return -0.5;
  return 0;
}

function calculateEnhancedSwingLevels(prices: any[], symbol: string): number[] {
  const highs = prices.map(p => p.high);
  const lows = prices.map(p => p.low);
  const basicLevels = [Math.max(...highs), Math.min(...lows), (Math.max(...highs) + Math.min(...lows)) / 2];
  const range = Math.max(...highs) - Math.min(...lows);
  const fibLevels = [0.236, 0.382, 0.618, 0.786].map(fib => Math.min(...lows) + (range * fib));
  const totalVolume = prices.reduce((sum, p) => sum + p.volume, 0);
  const vwap = prices.reduce((sum, p) => sum + (p.close * p.volume), 0) / totalVolume;
  const allLevels = [...basicLevels, ...fibLevels, vwap];
  return [...new Set(allLevels.map(level => Math.round(level * 100000) / 100000))];
}

function calculateEnhancedBreakoutProbability(prices: any[], symbol: string): number {
  const ranges = prices.map(p => p.high - p.low);
  const avgRange = ranges.reduce((sum, range) => sum + range, 0) / ranges.length;
  const currentRange = ranges[0];
  const consolidationFactor = currentRange < avgRange * 0.6 ? 0.4 : 0;
  const volumes = prices.map(p => p.volume);
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  const volumeFactor = volumes[0] > avgVolume * 1.3 ? 0.3 : 0;
  const timeCompressionFactor = calculateTimeCompression(prices);
  const symbolVolatility = getSymbolVolatilityExpectation(symbol);
  const totalProbability = (consolidationFactor + volumeFactor + timeCompressionFactor + symbolVolatility) * 100;
  return Math.min(95, Math.max(20, totalProbability + 30));
}

function calculateTimeCompression(prices: any[]): number {
  const ranges = prices.map(p => (p.high - p.low) / p.close);
  const avgRange = ranges.reduce((sum, r) => sum + r, 0) / ranges.length;
  const rangeVariation = ranges.reduce((sum, r) => sum + Math.abs(r - avgRange), 0) / ranges.length;
  return rangeVariation < avgRange * 0.3 ? 0.2 : 0;
}

function getSymbolVolatilityExpectation(symbol: string): number {
  const volatilityExpectations: Record<string, number> = {
    "BTCUSD": 0.15, "ETHUSD": 0.12, "EURUSD": 0.05, "GBPUSD": 0.08, "XAUUSD": 0.10, "CRUDE": 0.12
  };
  return volatilityExpectations[symbol] || 0.08;
}

function analyzeSmartMoneyEnhanced(data5m: any, data15m: any, data30m: any, symbol: string) {
  const volumes = [data5m.volume, data15m.volume, data30m.volume];
  const prices = [data5m.close, data15m.close, data30m.close];
  const institutionalFlow = analyzeInstitutionalFlowEnhanced(volumes, prices, symbol);
  const volumeProfile = analyzeVolumeProfilePatternEnhanced(volumes, prices, symbol);
  const orderFlow = analyzeOrderFlowEnhanced(volumes, prices, symbol);
  const liquidityZones = identifyLiquidityZonesEnhanced(data5m, data15m, data30m, symbol);
  return { institutionalFlow, volumeProfile, orderFlow, liquidityZones };
}

function analyzeInstitutionalFlowEnhanced(volumes: number[], prices: number[], symbol: string): "BUYING" | "SELLING" | "NEUTRAL" {
  const volumeThresholds: Record<string, number> = { "BTCUSD": 1.5, "ETHUSD": 1.4, "EURUSD": 1.2, "GBPUSD": 1.3, "XAUUSD": 1.4, "CRUDE": 1.5 };
  const threshold = volumeThresholds[symbol] || 1.3;
  const volumeWeightedPrice = volumes.reduce((sum, vol, i) => sum + (vol * prices[i]), 0) / volumes.reduce((sum, vol) => sum + vol, 0);
  const currentPrice = prices[0];
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  if (volumes[0] < avgVolume * threshold) return "NEUTRAL";
  const priceDeviation = (currentPrice - volumeWeightedPrice) / volumeWeightedPrice;
  if (priceDeviation > 0.003) return "BUYING";
  if (priceDeviation < -0.003) return "SELLING";
  return "NEUTRAL";
}

function analyzeVolumeProfilePatternEnhanced(volumes: number[], prices: number[], symbol: string): "ACCUMULATION" | "DISTRIBUTION" | "CONSOLIDATION" {
  const priceChanges = prices.map((price, i) => i > 0 ? price - prices[i-1] : 0).slice(1);
  const volumeChanges = volumes.map((vol, i) => i > 0 ? vol - volumes[i-1] : 0).slice(1);
  let accumulationScore = 0, distributionScore = 0, consolidationScore = 0;
  for (let i = 0; i < priceChanges.length; i++) {
    const priceChange = priceChanges[i];
    const volumeChange = volumeChanges[i];
    const volumeRatio = volumes[i] / (volumes[i + 1] || 1);
    if (priceChange > 0 && volumeChange > 0) accumulationScore += (volumeRatio > 1.2 ? 2 : 1);
    if (priceChange < 0 && volumeChange > 0) distributionScore += (volumeRatio > 1.2 ? 2 : 1);
    if (Math.abs(priceChange) < prices[i] * 0.005 && volumeChange < 0) consolidationScore++;
  }
  const maxScore = Math.max(accumulationScore, distributionScore, consolidationScore);
  if (maxScore === accumulationScore && accumulationScore > 0) return "ACCUMULATION";
  if (maxScore === distributionScore && distributionScore > 0) return "DISTRIBUTION";
  return "CONSOLIDATION";
}

function analyzeOrderFlowEnhanced(volumes: number[], prices: number[], symbol: string): "BULLISH" | "BEARISH" | "NEUTRAL" {
  const avgVol = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const buyingPressure = volumes.filter((vol, i) => prices[i] > (prices[i-1] || prices[i]) && vol > avgVol * 1.1).reduce((a, b) => a + b, 0);
  const sellingPressure = volumes.filter((vol, i) => prices[i] < (prices[i-1] || prices[i]) && vol > avgVol * 1.1).reduce((a, b) => a + b, 0);
  const totalPressure = buyingPressure + sellingPressure;
  if (totalPressure === 0) return "NEUTRAL";
  const buyingRatio = buyingPressure / totalPressure;
  if (buyingRatio > 0.65) return "BULLISH";
  if (buyingRatio < 0.35) return "BEARISH";
  return "NEUTRAL";
}

function identifyLiquidityZonesEnhanced(data5m: any, data15m: any, data30m: any, symbol: string): number[] {
  const currentPrice = data5m.close;
  const levels: Array<{price: number, weight: number}> = [
    { price: data30m.high, weight: 3 }, { price: data30m.low, weight: 3 },
    { price: data15m.high, weight: 2 }, { price: data15m.low, weight: 2 },
    { price: data5m.high, weight: 1 }, { price: data5m.low, weight: 1 }
  ];
  const psychLevels = calculatePsychologicalLevels(currentPrice, symbol);
  psychLevels.forEach(level => levels.push({ price: level, weight: 2 }));
  const vwap5m = data5m.close, vwap15m = (data5m.close + data15m.close) / 2, vwap30m = (data5m.close + data15m.close + data30m.close) / 3;
  levels.push({ price: vwap5m, weight: 1 }, { price: vwap15m, weight: 2 }, { price: vwap30m, weight: 3 });
  const recentHigh = Math.max(data5m.high, data15m.high, data30m.high);
  const recentLow = Math.min(data5m.low, data15m.low, data30m.low);
  const range = recentHigh - recentLow;
  if (range > 0) {
    [0.236, 0.382, 0.5, 0.618, 0.786].forEach(fib => levels.push({ price: recentLow + (range * fib), weight: 2 }));
  }
  return [...new Set(levels.map(l => ({ ...l, score: l.weight / (1 + Math.abs(l.price - currentPrice) / currentPrice * 10) })).sort((a,b) => b.score - a.score).slice(0, 8).map(l => l.price))].sort((a,b) => a - b);
}

function calculatePsychologicalLevels(currentPrice: number, symbol: string): number[] {
  const spacingMap: Record<string, number[]> = {
    "BTCUSD": [1000, 5000, 10000], "ETHUSD": [100, 500, 1000], "EURUSD": [0.01, 0.05, 0.1],
    "GBPUSD": [0.01, 0.05, 0.1], "USDJPY": [1, 5, 10], "XAUUSD": [10, 50, 100], "CRUDE": [1, 5, 10]
  };
  const spacings = spacingMap[symbol] || [currentPrice * 0.01, currentPrice * 0.05, currentPrice * 0.1];
  const levels: number[] = [];
  spacings.forEach(s => { const n = Math.round(currentPrice / s) * s; levels.push(n, n+s, n-s, n+2*s, n-2*s); });
  return levels.filter(l => l > 0);
}

function calculateEnhancedSupportResistance(data5m: any, data15m: any, data30m: any, symbol: string) {
  const currentPrice = data5m.close;
  const allLevels = identifyLiquidityZonesEnhanced(data5m, data15m, data30m, symbol);
  const supportLevels = allLevels.filter(level => level < currentPrice * 0.995);
  const resistanceLevels = allLevels.filter(level => level > currentPrice * 1.005);
  const nearestSupport = supportLevels.length > 0 ? Math.max(...supportLevels) : currentPrice * 0.95;
  const nearestResistance = resistanceLevels.length > 0 ? Math.min(...resistanceLevels) : currentPrice * 1.05;
  return { support: Math.round(nearestSupport * 100000) / 100000, resistance: Math.round(nearestResistance * 100000) / 100000 };
}

function analyzeVolumeProfile(data5m: any, data15m: any, data30m: any) {
  const timeframes = [data5m, data15m, data30m];
  const totalVolume = timeframes.reduce((sum, tf) => sum + tf.volume, 0);
  const vwap = timeframes.reduce((sum, tf) => sum + (tf.close * tf.volume), 0) / totalVolume;
  const distribution = analyzeVolumeDistribution(timeframes);
  const nodes = identifyVolumeNodes(timeframes);
  return { vwap, distribution, nodes };
}

async function analyzeProfessionalTraders(symbol: string, marketData: TimeframeData) {
  const topTraders = getTopTradersForAsset(symbol);
  const consensusView = analyzeTraderConsensus(symbol, marketData);
  const riskReward = calculateProfessionalRiskReward(marketData);
  const timeframe = determineOptimalTimeframe(symbol);
  return { topTraders, consensusView, riskReward, timeframe };
}

function getTopTradersForAsset(symbol: string): string[] {
  const traderDatabase: Record<string, string[]> = {
    "BTCUSD": ["Plan B", "Willy Woo", "Benjamin Cowen"], "EURUSD": ["Kathy Lien", "Boris Schlossberg", "James Stanley"],
    "GBPUSD": ["Kathy Lien", "James Stanley", "Nick Cawley"], "XAUUSD": ["Peter Schiff", "Jim Rickards", "Mike Maloney"], "CRUDE": ["Phil Flynn", "John Kilduff", "Andy Lipow"]
  };
  return traderDatabase[symbol] || ["Pro Trader 1", "Pro Trader 2", "Pro Trader 3"];
}

function analyzeTraderConsensus(symbol: string, marketData: TimeframeData): "BULLISH" | "BEARISH" | "NEUTRAL" {
  const data5m = marketData["5m"], data15m = marketData["15m"], data30m = marketData["30m"];
  let score = 0;
  if (data5m.close > data15m.close && data15m.close > data30m.close) score++;
  if (data5m.close < data15m.close && data15m.close < data30m.close) score--;
  if (data5m.volume > data15m.volume * 1.2) score += (data5m.close > data5m.open ? 1 : -1);
  if (score > 0) return "BULLISH"; if (score < 0) return "BEARISH"; return "NEUTRAL";
}

function calculateProfessionalRiskReward(marketData: TimeframeData): number {
  const atr = marketData["5m"].indicators.atr;
  const stopLoss = atr * 1.5;
  const takeProfit = atr * 3;
  return takeProfit / stopLoss;
}

function determineOptimalTimeframe(symbol: string): string {
  const timeframeMap: Record<string, string> = { "BTCUSD": "15m-1h", "EURUSD": "5m-15m", "XAUUSD": "15m-30m", "CRUDE": "15m-30m" };
  return timeframeMap[symbol] || "15m";
}

async function analyzeWithGeminiCached(marketData: TimeframeData, symbol: string, additionalData: any): Promise<{ direction: "LONG" | "SHORT"; confidence: number }> {
  const cacheKey = `${symbol}_${marketData["5m"].close}_${Date.now() - (Date.now() % CACHE_DURATION)}`;
  const cached = geminiCache.get(cacheKey);
  if (cached) { console.log("Using cached Gemini analysis"); return cached.response; }

  const apiKey = geminiApiKey();
  if (!apiKey || apiKey === "your_gemini_key") return enhancedFallbackAnalysis(marketData, additionalData);

  const prompt = createAdvancedTradingPrompt(marketData, symbol, additionalData);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, topK: 1, topP: 1, maxOutputTokens: 200 } })
    });
    if (!response.ok) { console.error(`Gemini API error: ${response.status}`); return enhancedFallbackAnalysis(marketData, additionalData); }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return enhancedFallbackAnalysis(marketData, additionalData);
    const result = parseGeminiResponse(text);
    geminiCache.set(cacheKey, { response: result, timestamp: Date.now() });
    cleanCache();
    return result;
  } catch (error) { console.error("Gemini request failed:", error); return enhancedFallbackAnalysis(marketData, additionalData); }
}

function cleanCache() {
  const now = Date.now();
  for (const [key, value] of geminiCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) geminiCache.delete(key);
  }
}

function createAdvancedTradingPrompt(marketData: TimeframeData, symbol: string, additionalData: any): string {
  const { "5m": data5m, "15m": data15m, "30m": data30m } = marketData;
  return `Analyze ${symbol} trading signal:\n\nPRICE DATA:\n5m: ${data5m.close} (Vol: ${data5m.volume})\n15m: ${data15m.close} (Vol: ${data15m.volume})\n30m: ${data30m.close} (Vol: ${data30m.volume})\n\nANALYSIS:\n- Trend: ${additionalData.priceAction.trend}\n- Structure: ${additionalData.priceAction.structure}\n- Smart Money: ${additionalData.smartMoney.institutionalFlow}\n- Volume: ${additionalData.smartMoney.volumeProfile}\n\nProvide trading recommendation:\nDIRECTION: [LONG or SHORT]\nCONFIDENCE: [70-95]\nREASON: [Brief explanation]`;
}

function parseGeminiResponse(text: string): { direction: "LONG" | "SHORT"; confidence: number } {
  try {
    const directionMatch = text.match(/DIRECTION:\s*(LONG|SHORT)/i);
    const confidenceMatch = text.match(/CONFIDENCE:\s*(\d+)/i);
    const direction = directionMatch?.[1]?.toUpperCase() as "LONG" | "SHORT" || "LONG";
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 75;
    return { direction, confidence: Math.max(70, Math.min(95, confidence)) };
  } catch (error) { console.error("Error parsing Gemini response:", error); return { direction: "LONG", confidence: 75 }; }
}

function enhancedFallbackAnalysis(marketData: TimeframeData, additionalData: any): { direction: "LONG" | "SHORT"; confidence: number } {
  let bullishSignals = 0, bearishSignals = 0, totalWeight = 0;
  const { "5m": data5m, "15m": data15m, "30m": data30m } = marketData;
  [(data5m.close - data15m.close) / data15m.close, (data15m.close - data30m.close) / data30m.close].forEach(c => { if (c > 0.001) bullishSignals += 3; else if (c < -0.001) bearishSignals += 3; totalWeight += 3; });
  if (data5m.volume > data15m.volume * 1.2) { if (data5m.close > data5m.open) bullishSignals += 2; else bearishSignals += 2; totalWeight += 2; }
  if (data5m.indicators.rsi < 30) bullishSignals += 2; else if (data5m.indicators.rsi > 70) bearishSignals += 2; totalWeight += 2;
  if (data5m.indicators.macd > 0) bullishSignals += 1; else bearishSignals += 1; totalWeight += 1;
  if (additionalData.smartMoney.institutionalFlow === "BUYING") bullishSignals += 2; else if (additionalData.smartMoney.institutionalFlow === "SELLING") bearishSignals += 2; totalWeight += 2;
  if (additionalData.smartMoney.volumeProfile === "ACCUMULATION") bullishSignals += 1; else if (additionalData.smartMoney.volumeProfile === "DISTRIBUTION") bearishSignals += 1; totalWeight += 1;
  if (additionalData.smartMoney.orderFlow === "BULLISH") bullishSignals += 1; else if (additionalData.smartMoney.orderFlow === "BEARISH") bearishSignals += 1; totalWeight += 1;
  if (additionalData.priceAction.trend === "UPTREND") bullishSignals += 2; else if (additionalData.priceAction.trend === "DOWNTREND") bearishSignals += 2; totalWeight += 2;
  if (additionalData.priceAction.structure === "BULLISH") bullishSignals += 1; else if (additionalData.priceAction.structure === "BEARISH") bearishSignals += 1; totalWeight += 1;
  const direction = bullishSignals > bearishSignals ? "LONG" : "SHORT";
  const confidence = Math.min(90, 70 + (Math.abs(bullishSignals - bearishSignals) / totalWeight) * 20);
  console.log(`Enhanced fallback analysis: ${direction} with ${confidence}% confidence`);
  return { direction, confidence };
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
  const sortedByVolume = [...priceVolumePairs].sort((a, b) => b.volume - a.volume);
  return {
    highVolumeNodes: sortedByVolume.slice(0, 2).map(pair => pair.price),
    lowVolumeNodes: sortedByVolume.slice(-2).map(pair => pair.price)
  };
}

function determineEnhancedDirection(
  indicators5m: EnhancedIndicators, indicators15m: EnhancedIndicators, indicators30m: EnhancedIndicators,
  multiTimeframeAnalysis: MultiTimeframeAnalysis, traditionalDirection: "LONG" | "SHORT"
): "LONG" | "SHORT" {
  let bullishScore = 0, bearishScore = 0;
  [indicators5m.rsi, indicators15m.rsi, indicators30m.rsi].forEach((rsi, i) => {
    const w = 3 - i;
    if (rsi < 30) bullishScore += 2*w; else if (rsi < 50) bullishScore += 1*w;
    if (rsi > 70) bearishScore += 2*w; else if (rsi > 50) bearishScore += 1*w;
  });
  [indicators5m.macd, indicators15m.macd, indicators30m.macd].forEach((macd, i) => {
    const w = 3 - i;
    if (macd.line > macd.signal) { bullishScore += 2*w; if (macd.histogram > 0) bullishScore += 1*w; }
    else { bearishScore += 2*w; if (macd.histogram < 0) bearishScore += 1*w; }
  });
  [indicators5m.sma, indicators15m.sma, indicators30m.sma].forEach((sma, i) => {
    const w = 3-i;
    if (sma.sma20 > sma.sma50 && sma.sma50 > sma.sma200) bullishScore += 3*w;
    else if (sma.sma20 < sma.sma50 && sma.sma50 < sma.sma200) bearishScore += 3*w;
    else if (sma.sma20 > sma.sma50) bullishScore += 1*w;
    else if (sma.sma20 < sma.sma50) bearishScore += 1*w;
  });
  if (multiTimeframeAnalysis.confluence > 70) {
    if (["STRONG_BULL", "BULL"].includes(multiTimeframeAnalysis.trendAlignment)) bullishScore += 5;
    else if (["STRONG_BEAR", "BEAR"].includes(multiTimeframeAnalysis.trendAlignment)) bearishScore += 5;
  }
  if (traditionalDirection === "LONG") bullishScore++; else bearishScore++;
  const enhancedDirection = bullishScore > bearishScore ? "LONG" : "SHORT";
  console.log(`🎯 Enhanced direction analysis: BULL ${bullishScore} vs BEAR ${bearishScore} = ${enhancedDirection}`);
  return enhancedDirection;
}