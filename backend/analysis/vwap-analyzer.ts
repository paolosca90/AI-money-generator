/**
 * Multi-Timeframe VWAP Analysis
 * Volume-weighted average price analysis across multiple timeframes
 */

export interface VWAPAnalysis {
  position: 'ABOVE_VWAP' | 'BELOW_VWAP' | 'AT_VWAP';
  trendStrength: number;
  supportResistanceLevels: number[];
  signalType: 'TREND_CONTINUATION' | 'MEAN_REVERSION' | 'NEUTRAL';
  timeframeAlignment: {
    '5m': VWAPTimeframeData;
    '15m': VWAPTimeframeData;
    '30m': VWAPTimeframeData;
    '1h': VWAPTimeframeData;
    '4h': VWAPTimeframeData;
  };
}

export interface VWAPTimeframeData {
  vwap: number;
  position: 'ABOVE' | 'BELOW' | 'AT';
  deviation: number;
  volumeWeight: number;
}

/**
 * Calculate multi-timeframe VWAP analysis
 */
export function analyzeVWAP(marketData: any, currentPrice: number): VWAPAnalysis {
  const timeframes = ['5m', '15m', '30m', '1h', '4h'];
  const timeframeAlignment: any = {};
  
  // Calculate VWAP for each timeframe
  timeframes.forEach(tf => {
    timeframeAlignment[tf] = calculateTimeframeVWAP(marketData, tf, currentPrice);
  });

  // Determine overall position relative to VWAP
  const vwapPositions = Object.values(timeframeAlignment).map((data: any) => data.position);
  const aboveCount = vwapPositions.filter(pos => pos === 'ABOVE').length;
  const belowCount = vwapPositions.filter(pos => pos === 'BELOW').length;
  
  let position: 'ABOVE_VWAP' | 'BELOW_VWAP' | 'AT_VWAP';
  if (aboveCount > belowCount) position = 'ABOVE_VWAP';
  else if (belowCount > aboveCount) position = 'BELOW_VWAP';
  else position = 'AT_VWAP';

  // Calculate trend strength based on VWAP alignment
  const trendStrength = calculateVWAPTrendStrength(timeframeAlignment);

  // Identify support/resistance levels from VWAP bands
  const supportResistanceLevels = identifyVWAPLevels(timeframeAlignment, currentPrice);

  // Determine signal type
  const signalType = determineVWAPSignal(timeframeAlignment, position, trendStrength);

  return {
    position,
    trendStrength,
    supportResistanceLevels,
    signalType,
    timeframeAlignment
  };
}

function calculateTimeframeVWAP(marketData: any, timeframe: string, currentPrice: number): VWAPTimeframeData {
  // Simulate VWAP calculation for the timeframe
  // In real implementation, this would use historical price and volume data
  
  const basePrice = currentPrice;
  const volatility = 0.01 + Math.random() * 0.02; // 1-3% volatility
  const volumeWeight = 0.5 + Math.random() * 0.5; // 50-100% weight
  
  // Simulate VWAP based on timeframe characteristics
  const timeframeMultipliers: Record<string, number> = {
    '5m': 0.9995 + Math.random() * 0.001,
    '15m': 0.999 + Math.random() * 0.002,
    '30m': 0.998 + Math.random() * 0.004,
    '1h': 0.995 + Math.random() * 0.01,
    '4h': 0.99 + Math.random() * 0.02
  };

  const vwap = basePrice * (timeframeMultipliers[timeframe] || 1.0);
  const deviation = Math.abs(currentPrice - vwap) / vwap;
  
  let position: 'ABOVE' | 'BELOW' | 'AT';
  if (currentPrice > vwap * 1.001) position = 'ABOVE';
  else if (currentPrice < vwap * 0.999) position = 'BELOW';
  else position = 'AT';

  return {
    vwap,
    position,
    deviation,
    volumeWeight
  };
}

function calculateVWAPTrendStrength(timeframeAlignment: any): number {
  const timeframes = ['5m', '15m', '30m', '1h', '4h'];
  let strengthScore = 0;
  let totalWeight = 0;

  timeframes.forEach((tf, index) => {
    const data = timeframeAlignment[tf];
    const weight = index + 1; // Higher timeframes get more weight
    
    // Score based on deviation from VWAP
    if (data.position === 'ABOVE') {
      strengthScore += data.deviation * 100 * weight;
    } else if (data.position === 'BELOW') {
      strengthScore -= data.deviation * 100 * weight;
    }
    
    totalWeight += weight;
  });

  // Normalize to 0-1 range
  const normalizedStrength = Math.abs(strengthScore / totalWeight);
  return Math.min(1, normalizedStrength);
}

function identifyVWAPLevels(timeframeAlignment: any, currentPrice: number): number[] {
  const levels: number[] = [];
  
  // Add VWAP levels from each timeframe
  Object.values(timeframeAlignment).forEach((data: any) => {
    levels.push(data.vwap);
    
    // Add standard deviation bands
    const stdDev = data.vwap * 0.01; // 1% standard deviation approximation
    levels.push(data.vwap + stdDev);
    levels.push(data.vwap - stdDev);
    levels.push(data.vwap + stdDev * 2);
    levels.push(data.vwap - stdDev * 2);
  });

  // Filter levels within reasonable range and remove duplicates
  const filteredLevels = levels
    .filter(level => level > currentPrice * 0.95 && level < currentPrice * 1.05)
    .filter((level, index, self) => {
      return self.findIndex(l => Math.abs(l - level) < currentPrice * 0.001) === index;
    })
    .sort((a, b) => a - b);

  return filteredLevels;
}

function determineVWAPSignal(
  timeframeAlignment: any, 
  position: 'ABOVE_VWAP' | 'BELOW_VWAP' | 'AT_VWAP', 
  trendStrength: number
): 'TREND_CONTINUATION' | 'MEAN_REVERSION' | 'NEUTRAL' {
  // Check for alignment across timeframes
  const timeframes = ['5m', '15m', '30m', '1h', '4h'];
  const positions = timeframes.map(tf => timeframeAlignment[tf].position);
  
  const strongAlignment = positions.every(pos => pos === positions[0]);
  
  if (strongAlignment && trendStrength > 0.6) {
    return 'TREND_CONTINUATION';
  } else if (trendStrength > 0.8) {
    return 'MEAN_REVERSION'; // Price too far from VWAP
  } else {
    return 'NEUTRAL';
  }
}

/**
 * Get VWAP trading recommendations
 */
export function getVWAPRecommendations(analysis: VWAPAnalysis, direction: 'LONG' | 'SHORT'): string[] {
  const recommendations: string[] = [];

  if (analysis.position === 'ABOVE_VWAP' && direction === 'LONG') {
    recommendations.push('Price above VWAP supports bullish bias');
    if (analysis.signalType === 'TREND_CONTINUATION') {
      recommendations.push('Strong uptrend continuation signal');
    }
  } else if (analysis.position === 'BELOW_VWAP' && direction === 'SHORT') {
    recommendations.push('Price below VWAP supports bearish bias');
    if (analysis.signalType === 'TREND_CONTINUATION') {
      recommendations.push('Strong downtrend continuation signal');
    }
  } else if (analysis.signalType === 'MEAN_REVERSION') {
    recommendations.push('Price showing mean reversion to VWAP');
  }

  if (analysis.trendStrength > 0.7) {
    recommendations.push('High VWAP trend strength detected');
  } else if (analysis.trendStrength < 0.3) {
    recommendations.push('Weak VWAP trend - consider waiting');
  }

  return recommendations;
}