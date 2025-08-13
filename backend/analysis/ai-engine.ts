import { secret } from "encore.dev/config";
import { TimeframeData } from "./market-data";

const geminiApiKey = secret("GeminiApiKey");

export interface AIAnalysis {
  direction: "LONG" | "SHORT";
  confidence: number;
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
}

export async function analyzeWithAI(marketData: TimeframeData, symbol: string): Promise<AIAnalysis> {
  // Extract key data from different timeframes
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];

  // Advanced price action analysis
  const priceActionAnalysis = analyzePriceAction(data5m, data15m, data30m);
  
  // Smart money analysis
  const smartMoneyAnalysis = analyzeSmartMoney(data5m, data15m, data30m);
  
  // Volume and order flow analysis
  const volumeAnalysis = analyzeVolumeProfile(data5m, data15m, data30m);
  
  // Professional trader consensus
  const professionalAnalysis = await analyzeProfessionalTraders(symbol, marketData);

  // Use Gemini AI for enhanced analysis with better error handling and rate limiting
  const geminiAnalysis = await analyzeWithGemini(marketData, symbol, {
    priceAction: priceActionAnalysis,
    smartMoney: smartMoneyAnalysis,
    volume: volumeAnalysis,
    professional: professionalAnalysis
  });

  // Calculate support and resistance using smart money concepts
  const keyLevels = calculateKeyLevels(data5m, data15m, data30m);
  const support = Math.min(...keyLevels.support);
  const resistance = Math.max(...keyLevels.resistance);

  // Combine all analyses for final decision
  const finalDirection = determineDirection(
    priceActionAnalysis,
    smartMoneyAnalysis,
    volumeAnalysis,
    geminiAnalysis
  );

  const finalConfidence = calculateConfidence(
    priceActionAnalysis,
    smartMoneyAnalysis,
    volumeAnalysis,
    professionalAnalysis,
    geminiAnalysis
  );

  // Simulate sentiment analysis (in real implementation, this would use news APIs)
  const sentiment = await simulateSentimentAnalysis();

  // Calculate volatility
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

  return {
    direction: finalDirection,
    confidence: finalConfidence,
    support: Math.round(support * 100000) / 100000,
    resistance: Math.round(resistance * 100000) / 100000,
    sentiment,
    volatility,
    smartMoney: smartMoneyAnalysis,
    priceAction: priceActionAnalysis,
    professionalAnalysis,
    technical,
  };
}

function analyzePriceAction(data5m: any, data15m: any, data30m: any) {
  const prices = [data5m, data15m, data30m];
  
  // Analyze market structure
  const highs = prices.map(d => d.high);
  const lows = prices.map(d => d.low);
  const closes = prices.map(d => d.close);
  
  // Determine trend using higher highs/lower lows concept
  const isUptrend = highs[2] > highs[1] && highs[1] > highs[0] && lows[2] > lows[1];
  const isDowntrend = highs[2] < highs[1] && highs[1] < highs[0] && lows[2] < lows[1];
  
  const trend = isUptrend ? "UPTREND" : isDowntrend ? "DOWNTREND" : "SIDEWAYS";
  
  // Analyze market structure breaks
  const structureBreak = analyzeStructureBreak(prices);
  const structure = structureBreak > 0 ? "BULLISH" : structureBreak < 0 ? "BEARISH" : "NEUTRAL";
  
  // Calculate key levels using swing highs/lows
  const keyLevels = calculateSwingLevels(prices);
  
  // Calculate breakout probability based on consolidation and volume
  const breakoutProbability = calculateBreakoutProbability(prices);
  
  return {
    trend,
    structure,
    keyLevels,
    breakoutProbability,
  };
}

function analyzeSmartMoney(data5m: any, data15m: any, data30m: any) {
  const volumes = [data5m.volume, data15m.volume, data30m.volume];
  const prices = [data5m.close, data15m.close, data30m.close];
  
  // Analyze institutional flow using volume-price relationship
  const institutionalFlow = analyzeInstitutionalFlow(volumes, prices);
  
  // Volume profile analysis
  const volumeProfile = analyzeVolumeProfilePattern(volumes, prices);
  
  // Order flow analysis using price-volume divergence
  const orderFlow = analyzeOrderFlow(volumes, prices);
  
  // Identify liquidity zones where smart money operates
  const liquidityZones = identifyLiquidityZones(data5m, data15m, data30m);
  
  return {
    institutionalFlow,
    volumeProfile,
    orderFlow,
    liquidityZones,
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

async function analyzeWithGemini(
  marketData: TimeframeData, 
  symbol: string, 
  additionalData: any
): Promise<{ direction: "LONG" | "SHORT"; confidence: number }> {
  try {
    const apiKey = geminiApiKey();
    if (!apiKey || apiKey === "your_gemini_key") {
      console.log("Gemini API key not configured, using fallback analysis");
      return fallbackAnalysis(marketData);
    }

    const prompt = createAdvancedTradingPrompt(marketData, symbol, additionalData);
    
    // Add retry logic with exponential backoff for rate limiting
    const maxRetries = 3;
    let retryDelay = 1000; // Start with 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
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
              maxOutputTokens: 300,
            }
          })
        });

        if (response.status === 503) {
          console.log(`Gemini service overloaded, attempt ${attempt}/${maxRetries}`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryDelay *= 2; // Exponential backoff
            continue;
          } else {
            console.log("Gemini service unavailable after retries, using fallback");
            return fallbackAnalysis(marketData);
          }
        }

        if (response.status === 429) {
          console.log(`Gemini rate limit exceeded, attempt ${attempt}/${maxRetries}`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryDelay *= 2;
            continue;
          } else {
            console.log("Gemini rate limit exceeded after retries, using fallback");
            return fallbackAnalysis(marketData);
          }
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
          return fallbackAnalysis(marketData);
        }

        const data = await response.json();
        
        if (data.error) {
          console.error("Gemini API response error:", data.error);
          return fallbackAnalysis(marketData);
        }
        
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
          console.log("No text response from Gemini, using fallback");
          return fallbackAnalysis(marketData);
        }

        console.log("Gemini advanced analysis successful");
        return parseGeminiResponse(text);
        
      } catch (error) {
        console.error(`Gemini API attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          return fallbackAnalysis(marketData);
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2;
      }
    }

    return fallbackAnalysis(marketData);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return fallbackAnalysis(marketData);
  }
}

function createAdvancedTradingPrompt(marketData: TimeframeData, symbol: string, additionalData: any): string {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];

  return `
You are an elite institutional trader with 20+ years of experience. Analyze ${symbol} using advanced trading concepts.

MARKET DATA:
5-minute: Open ${data5m.open}, High ${data5m.high}, Low ${data5m.low}, Close ${data5m.close}, Volume ${data5m.volume}
15-minute: Open ${data15m.open}, High ${data15m.high}, Low ${data15m.low}, Close ${data15m.close}, Volume ${data15m.volume}
30-minute: Open ${data30m.open}, High ${data30m.high}, Low ${data30m.low}, Close ${data30m.close}, Volume ${data30m.volume}

SMART MONEY ANALYSIS:
- Institutional Flow: ${additionalData.smartMoney.institutionalFlow}
- Volume Profile: ${additionalData.smartMoney.volumeProfile}
- Order Flow: ${additionalData.smartMoney.orderFlow}

PRICE ACTION ANALYSIS:
- Market Structure: ${additionalData.priceAction.structure}
- Trend: ${additionalData.priceAction.trend}
- Breakout Probability: ${additionalData.priceAction.breakoutProbability}%

PROFESSIONAL TRADER CONSENSUS:
- Top Traders: ${additionalData.professional.topTraders.slice(0, 3).join(", ")}
- Consensus View: ${additionalData.professional.consensusView}
- Risk-Reward: ${additionalData.professional.riskReward}

ANALYSIS FRAMEWORK:
1. MARKET STRUCTURE: Analyze higher highs/lower lows, structure breaks, liquidity zones
2. VOLUME ANALYSIS: Volume profile, VWAP relationship, volume-price divergence
3. ORDER FLOW: Smart money footprints, institutional accumulation/distribution
4. LIQUIDITY: Where are the stops? Where is smart money hunting liquidity?
5. RISK MANAGEMENT: Professional risk-reward ratios, position sizing

Think like an institutional trader:
- Where is smart money positioned?
- What are the key liquidity zones?
- Is this a continuation or reversal setup?
- What would professional traders do in this scenario?

Based on this PROFESSIONAL analysis, provide your recommendation:

DIRECTION: [LONG or SHORT]
CONFIDENCE: [number between 70-95]
REASONING: [Brief explanation of smart money concepts used]

Focus on:
- Market structure and liquidity
- Volume profile and order flow
- Professional trader positioning
- Risk-reward optimization
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

function fallbackAnalysis(marketData: TimeframeData): { direction: "LONG" | "SHORT"; confidence: number } {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];

  // Advanced price action analysis
  const priceAction = analyzePriceAction(data5m, data15m, data30m);
  const smartMoney = analyzeSmartMoney(data5m, data15m, data30m);
  
  let bullishSignals = 0;
  let bearishSignals = 0;
  
  // Price action signals
  if (priceAction.trend === "UPTREND") bullishSignals++;
  if (priceAction.trend === "DOWNTREND") bearishSignals++;
  if (priceAction.structure === "BULLISH") bullishSignals++;
  if (priceAction.structure === "BEARISH") bearishSignals++;
  
  // Smart money signals
  if (smartMoney.institutionalFlow === "BUYING") bullishSignals++;
  if (smartMoney.institutionalFlow === "SELLING") bearishSignals++;
  if (smartMoney.volumeProfile === "ACCUMULATION") bullishSignals++;
  if (smartMoney.volumeProfile === "DISTRIBUTION") bearishSignals++;
  if (smartMoney.orderFlow === "BULLISH") bullishSignals++;
  if (smartMoney.orderFlow === "BEARISH") bearishSignals++;
  
  // Volume confirmation
  if (data5m.volume > data15m.volume && data5m.close > data5m.open) bullishSignals++;
  if (data5m.volume > data15m.volume && data5m.close < data5m.open) bearishSignals++;
  
  const direction = bullishSignals > bearishSignals ? "LONG" : "SHORT";
  const signalStrength = Math.abs(bullishSignals - bearishSignals);
  const confidence = Math.min(90, 70 + (signalStrength * 5));

  return { direction, confidence };
}

// Helper functions for advanced analysis

function analyzeStructureBreak(prices: any[]): number {
  // Analyze if market structure is breaking to the upside or downside
  const recentHigh = Math.max(...prices.map(p => p.high));
  const recentLow = Math.min(...prices.map(p => p.low));
  const currentPrice = prices[0].close;
  
  if (currentPrice > recentHigh * 0.999) return 1; // Bullish structure break
  if (currentPrice < recentLow * 1.001) return -1; // Bearish structure break
  return 0; // No clear break
}

function calculateSwingLevels(prices: any[]): number[] {
  const highs = prices.map(p => p.high);
  const lows = prices.map(p => p.low);
  
  return [
    Math.max(...highs),
    Math.min(...lows),
    (Math.max(...highs) + Math.min(...lows)) / 2
  ];
}

function calculateBreakoutProbability(prices: any[]): number {
  const ranges = prices.map(p => p.high - p.low);
  const avgRange = ranges.reduce((sum, range) => sum + range, 0) / ranges.length;
  const currentRange = ranges[0];
  
  // Lower range suggests consolidation, higher breakout probability
  const consolidationFactor = currentRange < avgRange * 0.7 ? 0.3 : 0;
  
  // Volume factor
  const volumes = prices.map(p => p.volume);
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  const volumeFactor = volumes[0] > avgVolume * 1.2 ? 0.4 : 0;
  
  return Math.min(90, (consolidationFactor + volumeFactor) * 100 + 30);
}

function analyzeInstitutionalFlow(volumes: number[], prices: number[]): "BUYING" | "SELLING" | "NEUTRAL" {
  // Analyze if institutions are accumulating or distributing
  const volumeWeightedPrice = volumes.reduce((sum, vol, i) => sum + (vol * prices[i]), 0) / volumes.reduce((sum, vol) => sum + vol, 0);
  const currentPrice = prices[0];
  
  if (currentPrice > volumeWeightedPrice * 1.002) return "BUYING";
  if (currentPrice < volumeWeightedPrice * 0.998) return "SELLING";
  return "NEUTRAL";
}

function analyzeVolumeProfilePattern(volumes: number[], prices: number[]): "ACCUMULATION" | "DISTRIBUTION" | "CONSOLIDATION" {
  const priceChanges = prices.map((price, i) => i > 0 ? price - prices[i] : 0).slice(1);
  const volumeChanges = volumes.map((vol, i) => i > 0 ? vol - volumes[i] : 0).slice(1);
  
  let accumulationScore = 0;
  let distributionScore = 0;
  
  for (let i = 0; i < priceChanges.length; i++) {
    if (priceChanges[i] > 0 && volumeChanges[i] > 0) accumulationScore++;
    if (priceChanges[i] < 0 && volumeChanges[i] > 0) distributionScore++;
  }
  
  if (accumulationScore > distributionScore) return "ACCUMULATION";
  if (distributionScore > accumulationScore) return "DISTRIBUTION";
  return "CONSOLIDATION";
}

function analyzeOrderFlow(volumes: number[], prices: number[]): "BULLISH" | "BEARISH" | "NEUTRAL" {
  // Analyze buying vs selling pressure
  const buyingPressure = volumes.filter((vol, i) => prices[i] > (i > 0 ? prices[i-1] : prices[i])).reduce((sum, vol) => sum + vol, 0);
  const sellingPressure = volumes.filter((vol, i) => prices[i] < (i > 0 ? prices[i-1] : prices[i])).reduce((sum, vol) => sum + vol, 0);
  
  const ratio = buyingPressure / (sellingPressure || 1);
  
  if (ratio > 1.2) return "BULLISH";
  if (ratio < 0.8) return "BEARISH";
  return "NEUTRAL";
}

function identifyLiquidityZones(data5m: any, data15m: any, data30m: any): number[] {
  // Identify key levels where liquidity is likely to be resting
  const levels = [];
  
  // Previous highs and lows (where stops are likely placed)
  levels.push(data30m.high, data30m.low);
  levels.push(data15m.high, data15m.low);
  
  // Round numbers (psychological levels)
  const currentPrice = data5m.close;
  const roundNumber = Math.round(currentPrice / 100) * 100;
  levels.push(roundNumber, roundNumber + 100, roundNumber - 100);
  
  // VWAP levels
  const vwap = (data5m.close + data15m.close + data30m.close) / 3;
  levels.push(vwap);
  
  return levels.filter((level, index, self) => self.indexOf(level) === index).sort((a, b) => a - b);
}

function calculateKeyLevels(data5m: any, data15m: any, data30m: any) {
  const highs = [data5m.high, data15m.high, data30m.high];
  const lows = [data5m.low, data15m.low, data30m.low];
  
  return {
    support: lows,
    resistance: highs
  };
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

function determineDirection(
  priceAction: any,
  smartMoney: any,
  volumeAnalysis: any,
  geminiAnalysis: any
): "LONG" | "SHORT" {
  let bullishScore = 0;
  let bearishScore = 0;
  
  // Price action weight: 30%
  if (priceAction.trend === "UPTREND") bullishScore += 0.15;
  if (priceAction.trend === "DOWNTREND") bearishScore += 0.15;
  if (priceAction.structure === "BULLISH") bullishScore += 0.15;
  if (priceAction.structure === "BEARISH") bearishScore += 0.15;
  
  // Smart money weight: 40%
  if (smartMoney.institutionalFlow === "BUYING") bullishScore += 0.15;
  if (smartMoney.institutionalFlow === "SELLING") bearishScore += 0.15;
  if (smartMoney.volumeProfile === "ACCUMULATION") bullishScore += 0.1;
  if (smartMoney.volumeProfile === "DISTRIBUTION") bearishScore += 0.1;
  if (smartMoney.orderFlow === "BULLISH") bullishScore += 0.15;
  if (smartMoney.orderFlow === "BEARISH") bearishScore += 0.15;
  
  // Gemini AI weight: 30%
  if (geminiAnalysis.direction === "LONG") bullishScore += 0.3;
  if (geminiAnalysis.direction === "SHORT") bearishScore += 0.3;
  
  return bullishScore > bearishScore ? "LONG" : "SHORT";
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
  
  // Gemini confidence boost
  alignmentScore += (geminiAnalysis.confidence - 70) * 0.3;
  
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
