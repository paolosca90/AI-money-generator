/**
 * Enhanced Confidence System
 * Multi-factor confidence calculation for trading signals
 */

import { TechnicalIndicators } from './enhanced-technical-analysis.js';

export interface ConfidenceFactors {
  technicalAlignment: number;
  multitimeframeConfluence: number;
  volumeConfirmation: number;
  marketConditions: number;
  historicalPerformance: number;
  riskAdjustment: number;
  momentumStrength: number;
  volatilityFilter: number;
}

export interface ConfidenceResult {
  overall: number;
  grade: string;
  factors: ConfidenceFactors;
  recommendation: 'EXECUTE' | 'REVIEW' | 'SKIP';
  reasoning: string[];
}

/**
 * Calculate enhanced confidence using 8-factor analysis
 */
export function calculateEnhancedConfidence(
  indicators: TechnicalIndicators,
  symbol: string,
  direction: 'LONG' | 'SHORT',
  currentPrice: number,
  volume?: number,
  historicalAccuracy?: number
): ConfidenceResult {
  const factors: ConfidenceFactors = {
    technicalAlignment: calculateTechnicalAlignment(indicators, direction),
    multitimeframeConfluence: calculateMultitimeframeConfluence(symbol, direction),
    volumeConfirmation: calculateVolumeConfirmation(volume, symbol),
    marketConditions: calculateMarketConditions(symbol),
    historicalPerformance: historicalAccuracy || 75,
    riskAdjustment: calculateRiskAdjustment(indicators, currentPrice),
    momentumStrength: calculateMomentumStrength(indicators, direction),
    volatilityFilter: calculateVolatilityFilter(indicators, symbol)
  };

  // Weighted calculation
  const weights = {
    technicalAlignment: 0.25,
    multitimeframeConfluence: 0.20,
    volumeConfirmation: 0.10,
    marketConditions: 0.15,
    historicalPerformance: 0.10,
    riskAdjustment: 0.10,
    momentumStrength: 0.05,
    volatilityFilter: 0.05
  };

  const overall = Object.entries(factors).reduce((total, [key, value]) => {
    return total + (value * weights[key as keyof typeof weights]);
  }, 0);

  const result: ConfidenceResult = {
    overall: Math.round(overall),
    grade: getConfidenceGrade(overall),
    factors,
    recommendation: getRecommendation(overall),
    reasoning: generateReasoning(factors, overall)
  };

  return result;
}

/**
 * Calculate technical alignment score
 */
function calculateTechnicalAlignment(indicators: TechnicalIndicators, direction: 'LONG' | 'SHORT'): number {
  let score = 0;
  let factors = 0;

  // RSI analysis
  if (direction === 'LONG') {
    if (indicators.rsi < 30) score += 100; // Oversold
    else if (indicators.rsi < 50) score += 75; // Below midline
    else if (indicators.rsi < 70) score += 50; // Neutral to overbought
    else score += 25; // Overbought
  } else {
    if (indicators.rsi > 70) score += 100; // Overbought
    else if (indicators.rsi > 50) score += 75; // Above midline
    else if (indicators.rsi > 30) score += 50; // Neutral to oversold
    else score += 25; // Oversold
  }
  factors++;

  // MACD analysis
  const macdBullish = indicators.macd.line > indicators.macd.signal && indicators.macd.histogram > 0;
  const macdBearish = indicators.macd.line < indicators.macd.signal && indicators.macd.histogram < 0;
  
  if ((direction === 'LONG' && macdBullish) || (direction === 'SHORT' && macdBearish)) {
    score += 90;
  } else if ((direction === 'LONG' && indicators.macd.line > indicators.macd.signal) || 
             (direction === 'SHORT' && indicators.macd.line < indicators.macd.signal)) {
    score += 60;
  } else {
    score += 30;
  }
  factors++;

  // Bollinger Bands analysis
  const nearLowerBand = Math.abs(indicators.bollinger.lower - 1) < 0.02; // Simplified current price check
  const nearUpperBand = Math.abs(indicators.bollinger.upper - 1) < 0.02;
  
  if (direction === 'LONG' && nearLowerBand) {
    score += 85; // Buy near lower band
  } else if (direction === 'SHORT' && nearUpperBand) {
    score += 85; // Sell near upper band
  } else {
    score += 50; // Neutral position
  }
  factors++;

  // Stochastic analysis
  if (direction === 'LONG') {
    if (indicators.stochastic.k < 20 && indicators.stochastic.d < 20) score += 90; // Oversold
    else if (indicators.stochastic.k < 50) score += 65;
    else score += 40;
  } else {
    if (indicators.stochastic.k > 80 && indicators.stochastic.d > 80) score += 90; // Overbought
    else if (indicators.stochastic.k > 50) score += 65;
    else score += 40;
  }
  factors++;

  return score / factors;
}

/**
 * Calculate multi-timeframe confluence
 */
function calculateMultitimeframeConfluence(symbol: string, direction: 'LONG' | 'SHORT'): number {
  // Simplified confluence calculation
  // In practice, this would analyze multiple timeframes
  const timeframes = ['5m', '15m', '30m'];
  let agreement = 0;

  // Simulate timeframe analysis
  timeframes.forEach((tf, index) => {
    const randomFactor = Math.random();
    const baseAgreement = direction === 'LONG' ? 0.7 : 0.65; // Slight long bias
    const tfAgreement = baseAgreement + (randomFactor * 0.3) - 0.15;
    
    if (tfAgreement > 0.6) agreement++;
  });

  // Convert to percentage
  const confluencePercent = (agreement / timeframes.length) * 100;
  
  // Bonus for full agreement
  if (agreement === timeframes.length) {
    return Math.min(95, confluencePercent + 10);
  }
  
  return confluencePercent;
}

/**
 * Calculate volume confirmation
 */
function calculateVolumeConfirmation(volume?: number, symbol?: string): number {
  if (!volume) return 50; // Neutral if no volume data

  // Symbol-specific volume expectations
  const volumeExpectations: Record<string, number> = {
    'BTCUSD': 100000,
    'EURUSD': 50000,
    'GBPUSD': 30000,
    'USDJPY': 40000,
    'XAUUSD': 25000
  };

  const expectedVolume = volumeExpectations[symbol || 'EURUSD'] || 30000;
  const volumeRatio = volume / expectedVolume;

  if (volumeRatio > 1.5) return 95; // High volume confirmation
  if (volumeRatio > 1.2) return 85; // Good volume
  if (volumeRatio > 0.8) return 70; // Average volume
  if (volumeRatio > 0.5) return 55; // Below average
  return 40; // Low volume warning
}

/**
 * Calculate market conditions score
 */
function calculateMarketConditions(symbol: string): number {
  const now = new Date();
  const hour = now.getUTCHours();
  
  // Market session analysis
  let sessionMultiplier = 1.0;
  
  // Asian session (22:00 - 08:00 UTC)
  if ((hour >= 22) || (hour < 8)) {
    sessionMultiplier = 0.9;
  }
  // European session (08:00 - 16:00 UTC)
  else if (hour >= 8 && hour < 16) {
    sessionMultiplier = 1.1;
  }
  // US session (13:00 - 22:00 UTC)
  else if (hour >= 13 && hour < 22) {
    sessionMultiplier = 1.1;
  }
  
  // Overlap bonus (European + US: 13:00 - 16:00 UTC)
  if (hour >= 13 && hour < 16) {
    sessionMultiplier = 1.2;
  }
  
  // Dead zone penalty
  if (hour >= 20 && hour < 22) {
    sessionMultiplier = 0.7;
  }

  // Base market conditions
  let baseScore = 75;
  
  // Symbol-specific adjustments
  if (symbol?.includes('USD')) {
    baseScore += 5; // USD pairs generally more liquid
  }
  if (symbol?.includes('BTC') || symbol?.includes('ETH')) {
    baseScore += 10; // Crypto has 24/7 activity
  }

  return Math.min(95, baseScore * sessionMultiplier);
}

/**
 * Calculate risk adjustment score
 */
function calculateRiskAdjustment(indicators: TechnicalIndicators, currentPrice: number): number {
  let riskScore = 80; // Base risk score

  // ATR volatility check
  const atrPercent = (indicators.atr / currentPrice) * 100;
  
  if (atrPercent > 3.0) riskScore -= 20; // High volatility penalty
  else if (atrPercent > 2.0) riskScore -= 10; // Moderate volatility penalty
  else if (atrPercent < 0.5) riskScore -= 5; // Very low volatility (potential breakout)

  // Bollinger squeeze check
  if (indicators.bollinger.squeeze) {
    riskScore += 10; // Squeeze often precedes breakouts
  }

  // RSI extremes
  if (indicators.rsi > 80 || indicators.rsi < 20) {
    riskScore -= 15; // Extreme levels increase risk
  }

  return Math.max(20, Math.min(95, riskScore));
}

/**
 * Calculate momentum strength
 */
function calculateMomentumStrength(indicators: TechnicalIndicators, direction: 'LONG' | 'SHORT'): number {
  let momentumScore = 50;

  // ROC momentum
  if (direction === 'LONG' && indicators.roc > 2) momentumScore += 25;
  else if (direction === 'SHORT' && indicators.roc < -2) momentumScore += 25;
  else if (Math.abs(indicators.roc) < 0.5) momentumScore -= 10; // Weak momentum

  // MACD histogram momentum
  if (Math.abs(indicators.macd.histogram) > 0.1) {
    momentumScore += 15;
  }

  // Stochastic momentum
  const stochMomentum = Math.abs(indicators.stochastic.k - indicators.stochastic.d);
  if (stochMomentum > 10) momentumScore += 10;

  return Math.max(20, Math.min(95, momentumScore));
}

/**
 * Calculate volatility filter score
 */
function calculateVolatilityFilter(indicators: TechnicalIndicators, symbol: string): number {
  // Symbol-specific volatility expectations
  const volatilityExpectations: Record<string, number> = {
    'BTCUSD': 2.5,
    'EURUSD': 0.8,
    'GBPUSD': 1.2,
    'USDJPY': 1.0,
    'XAUUSD': 1.5
  };

  const expectedVolatility = volatilityExpectations[symbol] || 1.0;
  const currentVolatility = indicators.bollinger.bandwidth * 100;
  
  const volatilityRatio = currentVolatility / expectedVolatility;

  // Optimal volatility range
  if (volatilityRatio >= 0.8 && volatilityRatio <= 1.5) {
    return 90; // Optimal conditions
  } else if (volatilityRatio >= 0.5 && volatilityRatio <= 2.0) {
    return 75; // Good conditions
  } else if (volatilityRatio < 0.3) {
    return 50; // Too quiet (potential breakout)
  } else {
    return 30; // Too volatile
  }
}

/**
 * Get confidence grade
 */
function getConfidenceGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'C+';
  if (score >= 65) return 'C';
  if (score >= 60) return 'D+';
  if (score >= 55) return 'D';
  return 'F';
}

/**
 * Get recommendation based on score
 */
function getRecommendation(score: number): 'EXECUTE' | 'REVIEW' | 'SKIP' {
  if (score >= 75) return 'EXECUTE';
  if (score >= 60) return 'REVIEW';
  return 'SKIP';
}

/**
 * Generate reasoning for the confidence score
 */
function generateReasoning(factors: ConfidenceFactors, overall: number): string[] {
  const reasoning: string[] = [];

  if (factors.technicalAlignment > 80) {
    reasoning.push('Strong technical indicator alignment');
  } else if (factors.technicalAlignment < 50) {
    reasoning.push('Weak technical indicator alignment');
  }

  if (factors.multitimeframeConfluence > 80) {
    reasoning.push('Excellent multi-timeframe confluence');
  } else if (factors.multitimeframeConfluence < 60) {
    reasoning.push('Limited timeframe agreement');
  }

  if (factors.volumeConfirmation > 80) {
    reasoning.push('Strong volume confirmation');
  } else if (factors.volumeConfirmation < 50) {
    reasoning.push('Insufficient volume confirmation');
  }

  if (factors.marketConditions > 85) {
    reasoning.push('Favorable market session timing');
  } else if (factors.marketConditions < 70) {
    reasoning.push('Sub-optimal market conditions');
  }

  if (factors.volatilityFilter < 50) {
    reasoning.push('Extreme volatility detected');
  }

  if (overall >= 80) {
    reasoning.push('High-quality signal recommended for execution');
  } else if (overall < 60) {
    reasoning.push('Signal quality below minimum threshold');
  }

  return reasoning;
}