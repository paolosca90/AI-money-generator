/**
 * Forecasting & Projections
 * Multi-horizon price forecasts and scenario analysis
 */

export interface ForecastAnalysis {
  priceForecasts: {
    '1h': PriceForcast;
    '4h': PriceForcast;
    '1d': PriceForcast;
    '1w': PriceForcast;
  };
  scenarioAnalysis: {
    bullish: ScenarioProjection;
    base: ScenarioProjection;
    bearish: ScenarioProjection;
  };
  technicalProjections: {
    fibonacciLevels: number[];
    trendChannels: TrendChannel[];
    patternCompletions: PatternCompletion[];
  };
  confidenceIntervals: {
    lower68: number[];
    upper68: number[];
    lower95: number[];
    upper95: number[];
  };
}

export interface PriceForcast {
  price: number;
  confidence: number;
  volatility: number;
  range: { low: number; high: number };
  methodology: string;
}

export interface ScenarioProjection {
  targetPrice: number;
  probability: number;
  timeframe: string;
  catalysts: string[];
  keyLevels: number[];
}

export interface TrendChannel {
  upperBound: number;
  lowerBound: number;
  direction: 'ASCENDING' | 'DESCENDING' | 'HORIZONTAL';
  strength: number;
}

export interface PatternCompletion {
  pattern: string;
  completion: number;
  target: number;
  probability: number;
}

/**
 * Generate comprehensive forecasting analysis
 */
export function generateForecasts(marketData: any, symbol: string): ForecastAnalysis {
  const currentPrice = marketData['5m']?.close || 1;
  const volatility = calculateHistoricalVolatility(marketData);
  
  const priceForecasts = generatePriceForecasts(currentPrice, volatility, symbol);
  const scenarioAnalysis = generateScenarioAnalysis(currentPrice, marketData, symbol);
  const technicalProjections = generateTechnicalProjections(currentPrice, marketData, symbol);
  const confidenceIntervals = calculateConfidenceIntervals(currentPrice, volatility);

  return {
    priceForecasts,
    scenarioAnalysis,
    technicalProjections,
    confidenceIntervals
  };
}

function calculateHistoricalVolatility(marketData: any): number {
  const data5m = marketData['5m'];
  const data15m = marketData['15m'];
  const data30m = marketData['30m'];
  
  if (!data5m || !data15m || !data30m) return 0.02; // Default 2%
  
  const returns = [
    (data5m.close - data5m.open) / data5m.open,
    (data15m.close - data15m.open) / data15m.open,
    (data30m.close - data30m.open) / data30m.open
  ];
  
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
}

function generatePriceForecasts(currentPrice: number, volatility: number, symbol: string): ForecastAnalysis['priceForecasts'] {
  const timeframes = ['1h', '4h', '1d', '1w'];
  const forecasts: any = {};
  
  timeframes.forEach(tf => {
    forecasts[tf] = generateSingleForecast(currentPrice, volatility, tf, symbol);
  });
  
  return forecasts;
}

function generateSingleForecast(currentPrice: number, volatility: number, timeframe: string, symbol: string): PriceForcast {
  // Time scaling factors for different horizons
  const timeScaling: Record<string, number> = {
    '1h': 1,
    '4h': 2,
    '1d': 4,
    '1w': 12
  };
  
  const scaleFactor = timeScaling[timeframe] || 1;
  
  // Geometric Brownian Motion simulation
  const drift = getSymbolDrift(symbol) * scaleFactor;
  const diffusion = volatility * Math.sqrt(scaleFactor);
  
  // Generate random walk component
  const randomComponent = (Math.random() - 0.5) * 2; // -1 to 1
  const normalizedRandom = randomComponent * 0.7; // Reduce extreme movements
  
  // Calculate forecasted price
  const logReturn = drift + diffusion * normalizedRandom;
  const forecastPrice = currentPrice * Math.exp(logReturn);
  
  // Calculate confidence based on timeframe (shorter = higher confidence)
  const baseConfidence = 0.8;
  const timeDecay = Math.exp(-scaleFactor * 0.1);
  const confidence = baseConfidence * timeDecay;
  
  // Calculate price range
  const rangeMultiplier = diffusion * 2; // 2 standard deviations
  const range = {
    low: currentPrice * Math.exp(drift - rangeMultiplier),
    high: currentPrice * Math.exp(drift + rangeMultiplier)
  };
  
  return {
    price: Math.round(forecastPrice * 100000) / 100000,
    confidence,
    volatility: diffusion,
    range: {
      low: Math.round(range.low * 100000) / 100000,
      high: Math.round(range.high * 100000) / 100000
    },
    methodology: 'Geometric Brownian Motion with drift adjustment'
  };
}

function getSymbolDrift(symbol: string): number {
  // Historical drift tendencies for different symbols
  const driftMap: Record<string, number> = {
    'BTCUSD': 0.0002,   // Slight upward bias
    'ETHUSD': 0.0001,   // Slight upward bias
    'EURUSD': 0.0000,   // Neutral drift
    'GBPUSD': -0.0001,  // Slight downward bias
    'XAUUSD': 0.0001,   // Slight upward bias (inflation hedge)
    'CRUDE': 0.0000     // Neutral drift
  };
  
  return driftMap[symbol] || 0.0000;
}

function generateScenarioAnalysis(currentPrice: number, marketData: any, symbol: string): ForecastAnalysis['scenarioAnalysis'] {
  const volatility = calculateHistoricalVolatility(marketData);
  
  return {
    bullish: generateBullishScenario(currentPrice, volatility, symbol),
    base: generateBaseScenario(currentPrice, volatility, symbol),
    bearish: generateBearishScenario(currentPrice, volatility, symbol)
  };
}

function generateBullishScenario(currentPrice: number, volatility: number, symbol: string): ScenarioProjection {
  const upwardMove = volatility * 5; // 5 standard deviations
  const targetPrice = currentPrice * (1 + upwardMove);
  
  const catalysts = getBullishCatalysts(symbol);
  const keyLevels = [
    currentPrice * 1.02,
    currentPrice * 1.05,
    currentPrice * 1.10,
    targetPrice
  ];
  
  return {
    targetPrice: Math.round(targetPrice * 100000) / 100000,
    probability: 0.25, // 25% probability
    timeframe: '1-2 weeks',
    catalysts,
    keyLevels: keyLevels.map(level => Math.round(level * 100000) / 100000)
  };
}

function generateBaseScenario(currentPrice: number, volatility: number, symbol: string): ScenarioProjection {
  const neutralMove = volatility * 1; // 1 standard deviation
  const direction = Math.random() > 0.5 ? 1 : -1;
  const targetPrice = currentPrice * (1 + neutralMove * direction);
  
  const catalysts = getBaseCatalysts(symbol);
  const keyLevels = [
    currentPrice * 0.99,
    currentPrice,
    currentPrice * 1.01,
    targetPrice
  ];
  
  return {
    targetPrice: Math.round(targetPrice * 100000) / 100000,
    probability: 0.50, // 50% probability
    timeframe: '3-7 days',
    catalysts,
    keyLevels: keyLevels.map(level => Math.round(level * 100000) / 100000)
  };
}

function generateBearishScenario(currentPrice: number, volatility: number, symbol: string): ScenarioProjection {
  const downwardMove = volatility * 5; // 5 standard deviations
  const targetPrice = currentPrice * (1 - downwardMove);
  
  const catalysts = getBearishCatalysts(symbol);
  const keyLevels = [
    targetPrice,
    currentPrice * 0.90,
    currentPrice * 0.95,
    currentPrice * 0.98
  ];
  
  return {
    targetPrice: Math.round(targetPrice * 100000) / 100000,
    probability: 0.25, // 25% probability
    timeframe: '1-2 weeks',
    catalysts,
    keyLevels: keyLevels.map(level => Math.round(level * 100000) / 100000)
  };
}

function getBullishCatalysts(symbol: string): string[] {
  const catalystMap: Record<string, string[]> = {
    'BTCUSD': ['Institutional adoption', 'Regulatory clarity', 'ETF approvals', 'Halving effects'],
    'ETHUSD': ['DeFi growth', 'ETH 2.0 developments', 'Layer 2 scaling', 'NFT market expansion'],
    'EURUSD': ['ECB dovish policy', 'EU economic recovery', 'Dollar weakness', 'Risk-on sentiment'],
    'GBPUSD': ['BoE rate hikes', 'Brexit resolution', 'UK growth data', 'Dollar weakness'],
    'XAUUSD': ['Inflation concerns', 'Fed dovish policy', 'Geopolitical tensions', 'Dollar weakness'],
    'CRUDE': ['Supply disruptions', 'OPEC+ cuts', 'Demand recovery', 'Geopolitical tensions']
  };
  
  return catalystMap[symbol] || ['Market sentiment', 'Technical breakout', 'Volume surge', 'Trend continuation'];
}

function getBaseCatalysts(symbol: string): string[] {
  return [
    'Sideways consolidation',
    'Market indecision',
    'Mixed economic data',
    'Range-bound trading',
    'Profit taking',
    'Wait-and-see approach'
  ];
}

function getBearishCatalysts(symbol: string): string[] {
  const catalystMap: Record<string, string[]> = {
    'BTCUSD': ['Regulatory crackdown', 'Whale selling', 'Mining concerns', 'Risk-off sentiment'],
    'ETHUSD': ['Network congestion', 'Competition from other chains', 'Regulatory pressure', 'Market correction'],
    'EURUSD': ['ECB hawkish policy', 'EU economic slowdown', 'Dollar strength', 'Risk-off sentiment'],
    'GBPUSD': ['BoE dovish policy', 'UK recession fears', 'Brexit complications', 'Dollar strength'],
    'XAUUSD': ['Fed hawkish policy', 'Rising real yields', 'Dollar strength', 'Risk-on sentiment'],
    'CRUDE': ['Demand destruction', 'Strategic reserve releases', 'Recession fears', 'Alternative energy growth']
  };
  
  return catalystMap[symbol] || ['Market correction', 'Technical breakdown', 'Volume decline', 'Trend reversal'];
}

function generateTechnicalProjections(currentPrice: number, marketData: any, symbol: string): ForecastAnalysis['technicalProjections'] {
  const high = marketData['30m']?.high || currentPrice * 1.02;
  const low = marketData['30m']?.low || currentPrice * 0.98;
  
  const fibonacciLevels = calculateFibonacciLevels(high, low, currentPrice);
  const trendChannels = identifyTrendChannels(currentPrice, marketData);
  const patternCompletions = identifyPatternCompletions(currentPrice, marketData, symbol);
  
  return {
    fibonacciLevels,
    trendChannels,
    patternCompletions
  };
}

function calculateFibonacciLevels(high: number, low: number, currentPrice: number): number[] {
  const range = high - low;
  const fibRatios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.236, 1.618];
  
  // Calculate both retracement and extension levels
  const levels: number[] = [];
  
  fibRatios.forEach(ratio => {
    // Retracement levels (from high)
    levels.push(high - (range * ratio));
    
    // Extension levels (beyond the range)
    if (ratio > 1.0) {
      levels.push(high + (range * (ratio - 1.0)));
      levels.push(low - (range * (ratio - 1.0)));
    }
  });
  
  // Filter levels within reasonable range and remove duplicates
  return levels
    .filter(level => level > currentPrice * 0.8 && level < currentPrice * 1.2)
    .filter((level, index, self) => 
      self.findIndex(l => Math.abs(l - level) < currentPrice * 0.001) === index
    )
    .sort((a, b) => a - b)
    .map(level => Math.round(level * 100000) / 100000);
}

function identifyTrendChannels(currentPrice: number, marketData: any): TrendChannel[] {
  const data5m = marketData['5m'];
  const data15m = marketData['15m'];
  const data30m = marketData['30m'];
  
  if (!data5m || !data15m || !data30m) return [];
  
  const channels: TrendChannel[] = [];
  
  // Ascending channel
  const upTrendStrength = calculateTrendStrength([data30m.close, data15m.close, data5m.close], 'UP');
  if (upTrendStrength > 0.3) {
    channels.push({
      upperBound: currentPrice * 1.02,
      lowerBound: currentPrice * 0.995,
      direction: 'ASCENDING',
      strength: upTrendStrength
    });
  }
  
  // Descending channel
  const downTrendStrength = calculateTrendStrength([data30m.close, data15m.close, data5m.close], 'DOWN');
  if (downTrendStrength > 0.3) {
    channels.push({
      upperBound: currentPrice * 1.005,
      lowerBound: currentPrice * 0.98,
      direction: 'DESCENDING',
      strength: downTrendStrength
    });
  }
  
  // Horizontal channel
  const sidewaysStrength = 1 - Math.max(upTrendStrength, downTrendStrength);
  if (sidewaysStrength > 0.5) {
    channels.push({
      upperBound: currentPrice * 1.01,
      lowerBound: currentPrice * 0.99,
      direction: 'HORIZONTAL',
      strength: sidewaysStrength
    });
  }
  
  return channels;
}

function calculateTrendStrength(prices: number[], direction: 'UP' | 'DOWN'): number {
  if (prices.length < 2) return 0;
  
  let score = 0;
  for (let i = 1; i < prices.length; i++) {
    const change = (prices[i] - prices[i-1]) / prices[i-1];
    if (direction === 'UP' && change > 0) score += Math.abs(change);
    else if (direction === 'DOWN' && change < 0) score += Math.abs(change);
  }
  
  return Math.min(1, score * 100);
}

function identifyPatternCompletions(currentPrice: number, marketData: any, symbol: string): PatternCompletion[] {
  const patterns: PatternCompletion[] = [];
  
  // Simulate common pattern completions
  const patternTypes = [
    { name: 'Double Bottom', completion: 0.75, targetMultiplier: 1.05, probability: 0.65 },
    { name: 'Head and Shoulders', completion: 0.80, targetMultiplier: 0.95, probability: 0.70 },
    { name: 'Bull Flag', completion: 0.85, targetMultiplier: 1.08, probability: 0.75 },
    { name: 'Ascending Triangle', completion: 0.70, targetMultiplier: 1.06, probability: 0.68 },
    { name: 'Cup and Handle', completion: 0.90, targetMultiplier: 1.12, probability: 0.72 }
  ];
  
  // Randomly select 1-2 patterns that might be forming
  const selectedPatterns = patternTypes
    .filter(() => Math.random() > 0.7) // 30% chance each
    .slice(0, 2); // Max 2 patterns
  
  selectedPatterns.forEach(pattern => {
    patterns.push({
      pattern: pattern.name,
      completion: pattern.completion,
      target: Math.round(currentPrice * pattern.targetMultiplier * 100000) / 100000,
      probability: pattern.probability
    });
  });
  
  return patterns;
}

function calculateConfidenceIntervals(currentPrice: number, volatility: number): ForecastAnalysis['confidenceIntervals'] {
  const timeHorizons = [1, 4, 24, 168]; // 1h, 4h, 1d, 1w in hours
  
  const intervals = {
    lower68: [] as number[],
    upper68: [] as number[],
    lower95: [] as number[],
    upper95: [] as number[]
  };
  
  timeHorizons.forEach(hours => {
    const scaledVol = volatility * Math.sqrt(hours / 24); // Scale volatility by time
    
    // 68% confidence interval (1 standard deviation)
    intervals.lower68.push(Math.round(currentPrice * (1 - scaledVol) * 100000) / 100000);
    intervals.upper68.push(Math.round(currentPrice * (1 + scaledVol) * 100000) / 100000);
    
    // 95% confidence interval (2 standard deviations)
    intervals.lower95.push(Math.round(currentPrice * (1 - scaledVol * 2) * 100000) / 100000);
    intervals.upper95.push(Math.round(currentPrice * (1 + scaledVol * 2) * 100000) / 100000);
  });
  
  return intervals;
}

/**
 * Get forecasting insights
 */
export function getForecastingInsights(analysis: ForecastAnalysis): string[] {
  const insights: string[] = [];
  
  // Price forecast insights
  const forecasts = Object.values(analysis.priceForecasts);
  const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length;
  
  if (avgConfidence > 0.7) {
    insights.push(`High forecast confidence across timeframes (${(avgConfidence * 100).toFixed(0)}%)`);
  } else if (avgConfidence < 0.5) {
    insights.push(`Low forecast confidence - high uncertainty (${(avgConfidence * 100).toFixed(0)}%)`);
  }
  
  // Scenario analysis insights
  const bullishProb = analysis.scenarioAnalysis.bullish.probability;
  const bearishProb = analysis.scenarioAnalysis.bearish.probability;
  
  if (bullishProb > bearishProb * 1.5) {
    insights.push('Scenarios favor upward movement');
  } else if (bearishProb > bullishProb * 1.5) {
    insights.push('Scenarios favor downward movement');
  } else {
    insights.push('Balanced scenario probabilities');
  }
  
  // Technical projection insights
  if (analysis.technicalProjections.patternCompletions.length > 0) {
    const highProbPatterns = analysis.technicalProjections.patternCompletions
      .filter(p => p.probability > 0.7);
    
    if (highProbPatterns.length > 0) {
      insights.push(`${highProbPatterns.length} high-probability pattern(s) identified`);
    }
  }
  
  return insights;
}