/**
 * Enhanced Confidence Calculation System
 * 
 * This module provides sophisticated confidence scoring for trading signals
 * based on multiple factors including technical analysis, market conditions,
 * and historical performance.
 */

import { MultiTimeframeAnalysis, MarketConditionContext, EnhancedIndicators } from "./enhanced-technical-analysis";

export interface ConfidenceFactors {
  technicalAlignment: number; // 0-100
  multiTimeframeConfluence: number; // 0-100
  volumeConfirmation: number; // 0-100
  marketConditions: number; // 0-100
  historicalPerformance: number; // 0-100
  riskAdjustment: number; // 0-100
  momentumStrength: number; // 0-100
  volatilityFilter: number; // 0-100
}

export interface EnhancedConfidenceResult {
  finalConfidence: number;
  confidenceGrade: "A+" | "A" | "B+" | "B" | "C" | "D" | "F";
  factors: ConfidenceFactors;
  recommendations: {
    shouldTrade: boolean;
    suggestedLotSizeMultiplier: number; // 0.1 to 2.0
    riskAdjustment: "REDUCE" | "NORMAL" | "INCREASE";
    timeframeRecommendation: "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM";
  };
  warnings: string[];
}

/**
 * Calculate enhanced confidence score with multiple sophisticated factors
 */
export function calculateEnhancedConfidence(
  indicators5m: EnhancedIndicators,
  indicators15m: EnhancedIndicators,
  indicators30m: EnhancedIndicators,
  multiTimeframeAnalysis: MultiTimeframeAnalysis,
  marketContext: MarketConditionContext,
  direction: "LONG" | "SHORT",
  symbol: string,
  historicalWinRate?: number
): EnhancedConfidenceResult {
  
  const factors: ConfidenceFactors = {
    technicalAlignment: calculateTechnicalAlignment(indicators5m, indicators15m, indicators30m, direction),
    multiTimeframeConfluence: multiTimeframeAnalysis.confluence,
    volumeConfirmation: calculateVolumeConfirmation(indicators5m, indicators15m, indicators30m),
    marketConditions: calculateMarketConditionsScore(marketContext, multiTimeframeAnalysis),
    historicalPerformance: calculateHistoricalPerformanceScore(historicalWinRate, symbol),
    riskAdjustment: calculateRiskAdjustmentScore(multiTimeframeAnalysis, marketContext),
    momentumStrength: calculateMomentumStrength(indicators5m, indicators15m, direction),
    volatilityFilter: calculateVolatilityFilterScore(multiTimeframeAnalysis, marketContext)
  };

  // Calculate weighted confidence score
  const weightedConfidence = calculateWeightedConfidence(factors);
  
  // Apply dynamic thresholds based on market conditions
  const finalConfidence = applyDynamicThresholds(weightedConfidence, marketContext, multiTimeframeAnalysis);
  
  // Determine confidence grade
  const confidenceGrade = getConfidenceGrade(finalConfidence);
  
  // Generate recommendations
  const recommendations = generateRecommendations(finalConfidence, factors, marketContext);
  
  // Generate warnings
  const warnings = generateWarnings(factors, marketContext, multiTimeframeAnalysis);

  return {
    finalConfidence,
    confidenceGrade,
    factors,
    recommendations,
    warnings
  };
}

/**
 * Calculate technical indicator alignment score
 */
function calculateTechnicalAlignment(
  indicators5m: EnhancedIndicators,
  indicators15m: EnhancedIndicators,
  indicators30m: EnhancedIndicators,
  direction: "LONG" | "SHORT"
): number {
  let alignmentScore = 0;
  let totalWeight = 0;

  // RSI alignment across timeframes
  const rsiScores = [indicators5m.rsi, indicators15m.rsi, indicators30m.rsi];
  const rsiWeight = 3;
  
  if (direction === "LONG") {
    // Look for oversold conditions or bullish momentum
    const oversoldCount = rsiScores.filter(rsi => rsi < 40).length;
    const bullishMomentum = rsiScores.filter(rsi => rsi > 50 && rsi < 70).length;
    alignmentScore += (oversoldCount * 10 + bullishMomentum * 5) * rsiWeight;
  } else {
    // Look for overbought conditions or bearish momentum
    const overboughtCount = rsiScores.filter(rsi => rsi > 60).length;
    const bearishMomentum = rsiScores.filter(rsi => rsi < 50 && rsi > 30).length;
    alignmentScore += (overboughtCount * 10 + bearishMomentum * 5) * rsiWeight;
  }
  totalWeight += rsiWeight * 15; // Max possible score for RSI

  // MACD alignment
  const macdWeight = 4;
  const macds = [indicators5m.macd, indicators15m.macd, indicators30m.macd];
  
  macds.forEach(macd => {
    if (direction === "LONG") {
      if (macd.line > macd.signal && macd.histogram > 0) alignmentScore += 15 * macdWeight;
      else if (macd.line > macd.signal) alignmentScore += 10 * macdWeight;
      else if (macd.histogram > 0) alignmentScore += 5 * macdWeight;
    } else {
      if (macd.line < macd.signal && macd.histogram < 0) alignmentScore += 15 * macdWeight;
      else if (macd.line < macd.signal) alignmentScore += 10 * macdWeight;
      else if (macd.histogram < 0) alignmentScore += 5 * macdWeight;
    }
  });
  totalWeight += 15 * macds.length * macdWeight;

  // Moving average alignment
  const maWeight = 2;
  const smaAlignments = [indicators5m.sma, indicators15m.sma, indicators30m.sma];
  
  smaAlignments.forEach(sma => {
    if (direction === "LONG") {
      if (sma.sma20 > sma.sma50 && sma.sma50 > sma.sma200) alignmentScore += 20 * maWeight;
      else if (sma.sma20 > sma.sma50) alignmentScore += 10 * maWeight;
    } else {
      if (sma.sma20 < sma.sma50 && sma.sma50 < sma.sma200) alignmentScore += 20 * maWeight;
      else if (sma.sma20 < sma.sma50) alignmentScore += 10 * maWeight;
    }
  });
  totalWeight += 20 * smaAlignments.length * maWeight;

  return Math.min(100, (alignmentScore / totalWeight) * 100);
}

/**
 * Calculate volume confirmation score
 */
function calculateVolumeConfirmation(
  indicators5m: EnhancedIndicators,
  indicators15m: EnhancedIndicators,
  indicators30m: EnhancedIndicators
): number {
  // This is a placeholder - in real implementation, volume analysis would be more sophisticated
  // For now, we'll use a simplified approach based on momentum indicators
  
  const momentum5m = indicators5m.momentum.momentum;
  const momentum15m = indicators15m.momentum.momentum;
  const momentum30m = indicators30m.momentum.momentum;
  
  const momentumAlignment = [momentum5m, momentum15m, momentum30m].filter(m => 
    Math.sign(momentum5m) === Math.sign(m)
  ).length;
  
  // Higher alignment suggests volume confirmation
  return (momentumAlignment / 3) * 100;
}

/**
 * Calculate market conditions score
 */
function calculateMarketConditionsScore(
  marketContext: MarketConditionContext,
  multiTimeframeAnalysis: MultiTimeframeAnalysis
): number {
  let score = 50; // Base score
  
  // Session-based scoring
  switch (marketContext.sessionType) {
    case "OVERLAP":
      score += 20; // High activity periods are better
      break;
    case "EUROPEAN":
    case "US":
      score += 10;
      break;
    case "ASIAN":
      score += 5;
      break;
    case "DEAD":
      score -= 20; // Penalize low activity periods
      break;
  }
  
  // Volatility-based scoring
  switch (multiTimeframeAnalysis.volatilityState) {
    case "NORMAL":
      score += 10; // Ideal volatility
      break;
    case "LOW":
      score -= 5; // Harder to profit
      break;
    case "HIGH":
      score -= 10; // Higher risk
      break;
    case "EXTREME":
      score -= 25; // Dangerous conditions
      break;
  }
  
  // Trend strength bonus
  score += marketContext.trendStrength * 20;
  
  // Market noise penalty
  score -= marketContext.marketNoise * 15;
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate historical performance score
 */
function calculateHistoricalPerformanceScore(
  historicalWinRate?: number,
  symbol?: string
): number {
  if (!historicalWinRate) {
    return 60; // Neutral if no history
  }
  
  // Convert win rate to confidence boost/penalty
  if (historicalWinRate > 0.7) return 90;
  if (historicalWinRate > 0.6) return 80;
  if (historicalWinRate > 0.5) return 70;
  if (historicalWinRate > 0.4) return 60;
  if (historicalWinRate > 0.3) return 50;
  return 30;
}

/**
 * Calculate risk adjustment score
 */
function calculateRiskAdjustmentScore(
  multiTimeframeAnalysis: MultiTimeframeAnalysis,
  marketContext: MarketConditionContext
): number {
  let score = 70; // Base risk score
  
  // Adjust based on volatility
  switch (multiTimeframeAnalysis.volatilityState) {
    case "LOW":
      score += 15; // Lower risk
      break;
    case "NORMAL":
      score += 10;
      break;
    case "HIGH":
      score -= 10;
      break;
    case "EXTREME":
      score -= 30; // Very high risk
      break;
  }
  
  // Adjust based on trend alignment
  switch (multiTimeframeAnalysis.trendAlignment) {
    case "STRONG_BULL":
    case "STRONG_BEAR":
      score += 15; // Strong trends are more predictable
      break;
    case "BULL":
    case "BEAR":
      score += 5;
      break;
    case "NEUTRAL":
      score -= 10; // Neutral trends are riskier
      break;
  }
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate momentum strength score
 */
function calculateMomentumStrength(
  indicators5m: EnhancedIndicators,
  indicators15m: EnhancedIndicators,
  direction: "LONG" | "SHORT"
): number {
  const roc5m = indicators5m.momentum.roc;
  const roc15m = indicators15m.momentum.roc;
  
  // Check momentum alignment with direction
  let score = 0;
  
  if (direction === "LONG") {
    if (roc5m > 0 && roc15m > 0) score += 40;
    else if (roc5m > 0 || roc15m > 0) score += 20;
    
    // Bonus for accelerating momentum
    if (roc5m > roc15m && roc5m > 0) score += 20;
  } else {
    if (roc5m < 0 && roc15m < 0) score += 40;
    else if (roc5m < 0 || roc15m < 0) score += 20;
    
    // Bonus for accelerating momentum
    if (roc5m < roc15m && roc5m < 0) score += 20;
  }
  
  // MACD momentum confirmation
  const macd5m = indicators5m.macd;
  if (direction === "LONG" && macd5m.histogram > 0) score += 20;
  if (direction === "SHORT" && macd5m.histogram < 0) score += 20;
  
  return Math.min(100, score);
}

/**
 * Calculate volatility filter score
 */
function calculateVolatilityFilterScore(
  multiTimeframeAnalysis: MultiTimeframeAnalysis,
  marketContext: MarketConditionContext
): number {
  let score = 50; // Base score
  
  // Ideal volatility for trading
  switch (multiTimeframeAnalysis.volatilityState) {
    case "NORMAL":
      score = 90; // Perfect for trading
      break;
    case "LOW":
      score = 70; // Acceptable but lower profit potential
      break;
    case "HIGH":
      score = 60; // Risky but tradeable
      break;
    case "EXTREME":
      score = 20; // Very risky
      break;
  }
  
  return score;
}

/**
 * Calculate weighted confidence score
 */
function calculateWeightedConfidence(factors: ConfidenceFactors): number {
  const weights = {
    technicalAlignment: 0.25,
    multiTimeframeConfluence: 0.20,
    volumeConfirmation: 0.10,
    marketConditions: 0.15,
    historicalPerformance: 0.10,
    riskAdjustment: 0.10,
    momentumStrength: 0.05,
    volatilityFilter: 0.05
  };

  let weightedScore = 0;
  let totalWeight = 0;

  Object.entries(factors).forEach(([factor, score]) => {
    const weight = weights[factor as keyof typeof weights] || 0;
    weightedScore += score * weight;
    totalWeight += weight;
  });

  return weightedScore / totalWeight;
}

/**
 * Apply dynamic thresholds based on market conditions
 */
function applyDynamicThresholds(
  baseConfidence: number,
  marketContext: MarketConditionContext,
  multiTimeframeAnalysis: MultiTimeframeAnalysis
): number {
  let adjustedConfidence = baseConfidence;

  // Apply volatility adjustment
  adjustedConfidence *= marketContext.volatilityAdjustment;

  // Reduce confidence during extreme volatility
  if (multiTimeframeAnalysis.volatilityState === "EXTREME") {
    adjustedConfidence *= 0.7;
  }

  // Boost confidence during strong trends
  if (multiTimeframeAnalysis.trendAlignment === "STRONG_BULL" || 
      multiTimeframeAnalysis.trendAlignment === "STRONG_BEAR") {
    adjustedConfidence *= 1.1;
  }

  // Ensure confidence stays within reasonable bounds
  return Math.min(98, Math.max(15, adjustedConfidence));
}

/**
 * Get confidence grade based on score
 */
function getConfidenceGrade(confidence: number): EnhancedConfidenceResult["confidenceGrade"] {
  if (confidence >= 90) return "A+";
  if (confidence >= 85) return "A";
  if (confidence >= 80) return "B+";
  if (confidence >= 75) return "B";
  if (confidence >= 60) return "C";
  if (confidence >= 45) return "D";
  return "F";
}

/**
 * Generate trading recommendations
 */
function generateRecommendations(
  confidence: number,
  factors: ConfidenceFactors,
  marketContext: MarketConditionContext
): EnhancedConfidenceResult["recommendations"] {
  const shouldTrade = confidence >= 60; // Minimum threshold
  
  let suggestedLotSizeMultiplier = 1.0;
  
  // Adjust lot size based on confidence
  if (confidence >= 85) suggestedLotSizeMultiplier = 1.5;
  else if (confidence >= 75) suggestedLotSizeMultiplier = 1.2;
  else if (confidence >= 60) suggestedLotSizeMultiplier = 1.0;
  else if (confidence >= 45) suggestedLotSizeMultiplier = 0.5;
  else suggestedLotSizeMultiplier = 0.1;
  
  // Risk adjustment recommendation
  let riskAdjustment: EnhancedConfidenceResult["recommendations"]["riskAdjustment"];
  if (factors.riskAdjustment >= 80) riskAdjustment = "INCREASE";
  else if (factors.riskAdjustment >= 60) riskAdjustment = "NORMAL";
  else riskAdjustment = "REDUCE";
  
  // Timeframe recommendation
  let timeframeRecommendation: EnhancedConfidenceResult["recommendations"]["timeframeRecommendation"];
  if (factors.momentumStrength >= 80) timeframeRecommendation = "SHORT_TERM";
  else if (factors.multiTimeframeConfluence >= 75) timeframeRecommendation = "MEDIUM_TERM";
  else timeframeRecommendation = "LONG_TERM";

  return {
    shouldTrade,
    suggestedLotSizeMultiplier,
    riskAdjustment,
    timeframeRecommendation
  };
}

/**
 * Generate warnings based on analysis
 */
function generateWarnings(
  factors: ConfidenceFactors,
  marketContext: MarketConditionContext,
  multiTimeframeAnalysis: MultiTimeframeAnalysis
): string[] {
  const warnings: string[] = [];

  if (factors.technicalAlignment < 50) {
    warnings.push("⚠️ Weak technical alignment across indicators");
  }

  if (factors.multiTimeframeConfluence < 40) {
    warnings.push("⚠️ Poor multi-timeframe confluence - signals conflicting");
  }

  if (marketContext.sessionType === "DEAD") {
    warnings.push("⚠️ Trading during low-activity session - reduced liquidity");
  }

  if (multiTimeframeAnalysis.volatilityState === "EXTREME") {
    warnings.push("🚨 Extreme market volatility detected - high risk");
  }

  if (factors.volumeConfirmation < 30) {
    warnings.push("⚠️ Weak volume confirmation for price movement");
  }

  if (factors.historicalPerformance < 40) {
    warnings.push("⚠️ Poor historical performance for this symbol/conditions");
  }

  if (factors.riskAdjustment < 40) {
    warnings.push("🚨 High-risk market conditions - consider reducing position size");
  }

  return warnings;
}