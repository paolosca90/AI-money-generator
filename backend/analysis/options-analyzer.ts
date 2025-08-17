/**
 * 0DTE Options Analysis
 * Gamma exposure, delta walls, and pin risk analysis
 */

export interface OptionsAnalysis {
  gammaExposure: {
    level: number;
    flipPoint: number;
    direction: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  deltaWalls: {
    support: number[];
    resistance: number[];
    strength: number[];
  };
  pinRisk: {
    level: number;
    probability: number;
    expiryImpact: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  marketMakerFlow: {
    hedgingDirection: 'BUYING' | 'SELLING' | 'NEUTRAL';
    flowStrength: number;
    expectedVolatility: number;
  };
}

/**
 * Analyze 0DTE options impact on underlying
 */
export function analyzeOptions(marketData: any, symbol: string): OptionsAnalysis {
  const currentPrice = marketData['5m']?.close || 1;
  const volatility = calculateImpliedVolatility(marketData, symbol);
  
  const gammaExposure = calculateGammaExposure(currentPrice, symbol);
  const deltaWalls = identifyDeltaWalls(currentPrice, symbol);
  const pinRisk = calculatePinRisk(currentPrice, symbol, volatility);
  const marketMakerFlow = analyzeMarketMakerFlow(marketData, gammaExposure, symbol);

  return {
    gammaExposure,
    deltaWalls,
    pinRisk,
    marketMakerFlow
  };
}

function calculateImpliedVolatility(marketData: any, symbol: string): number {
  // Estimate implied volatility from recent price movements
  const data5m = marketData['5m'];
  const data15m = marketData['15m'];
  const data30m = marketData['30m'];
  
  if (!data5m || !data15m || !data30m) return 0.2; // Default 20%
  
  const priceChanges = [
    Math.abs(data5m.close - data5m.open) / data5m.open,
    Math.abs(data15m.close - data15m.open) / data15m.open,
    Math.abs(data30m.close - data30m.open) / data30m.open
  ];
  
  const avgChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
  
  // Annualize the volatility (rough approximation)
  const annualizedVol = avgChange * Math.sqrt(252 * 24 * 12); // 5-minute periods in a year
  
  return Math.min(2.0, Math.max(0.05, annualizedVol)); // Cap between 5% and 200%
}

function calculateGammaExposure(currentPrice: number, symbol: string): OptionsAnalysis['gammaExposure'] {
  // Simulate gamma exposure levels based on symbol characteristics
  const gammaProfiles: Record<string, { multiplier: number; flipRange: number }> = {
    'BTCUSD': { multiplier: 1.5, flipRange: 0.02 },
    'ETHUSD': { multiplier: 1.3, flipRange: 0.025 },
    'EURUSD': { multiplier: 0.8, flipRange: 0.005 },
    'GBPUSD': { multiplier: 1.0, flipRange: 0.008 },
    'XAUUSD': { multiplier: 1.2, flipRange: 0.01 },
    'CRUDE': { multiplier: 1.4, flipRange: 0.015 }
  };

  const profile = gammaProfiles[symbol] || { multiplier: 1.0, flipRange: 0.01 };
  
  // Calculate gamma exposure level (-1 to 1)
  const level = (Math.random() - 0.5) * 2 * profile.multiplier;
  
  // Calculate gamma flip point (price where gamma changes sign)
  const flipPoint = currentPrice * (1 + (Math.random() - 0.5) * profile.flipRange);
  
  let direction: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  if (level > 0.3) direction = 'POSITIVE';
  else if (level < -0.3) direction = 'NEGATIVE';
  else direction = 'NEUTRAL';
  
  let impact: 'HIGH' | 'MEDIUM' | 'LOW';
  if (Math.abs(level) > 0.7) impact = 'HIGH';
  else if (Math.abs(level) > 0.4) impact = 'MEDIUM';
  else impact = 'LOW';

  return { level, flipPoint, direction, impact };
}

function identifyDeltaWalls(currentPrice: number, symbol: string): OptionsAnalysis['deltaWalls'] {
  // Simulate delta walls (large option positions that act as support/resistance)
  const strikeSpacing = getStrikeSpacing(currentPrice, symbol);
  
  const support: number[] = [];
  const resistance: number[] = [];
  const strength: number[] = [];

  // Generate potential delta walls around current price
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue; // Skip current price
    
    const strike = currentPrice + (i * strikeSpacing);
    const isSupport = strike < currentPrice;
    const distance = Math.abs(strike - currentPrice) / currentPrice;
    
    // Simulate wall strength (higher for closer strikes)
    const baseStrength = 1 - Math.min(0.8, distance * 50);
    const wallStrength = baseStrength * (0.5 + Math.random() * 0.5);
    
    if (wallStrength > 0.3) {
      if (isSupport) {
        support.push(strike);
      } else {
        resistance.push(strike);
      }
      strength.push(wallStrength);
    }
  }

  return { support, resistance, strength };
}

function getStrikeSpacing(currentPrice: number, symbol: string): number {
  // Define typical option strike spacing for different symbols
  const spacingMap: Record<string, number> = {
    'BTCUSD': 1000,    // $1000 spacing
    'ETHUSD': 100,     // $100 spacing
    'EURUSD': 0.01,    // 1 cent spacing
    'GBPUSD': 0.01,    // 1 cent spacing
    'XAUUSD': 10,      // $10 spacing
    'CRUDE': 1         // $1 spacing
  };

  return spacingMap[symbol] || currentPrice * 0.01; // Default 1% spacing
}

function calculatePinRisk(currentPrice: number, symbol: string, volatility: number): OptionsAnalysis['pinRisk'] {
  // Simulate pin risk (tendency for price to "pin" to option strikes at expiry)
  const strikeSpacing = getStrikeSpacing(currentPrice, symbol);
  const nearestStrike = Math.round(currentPrice / strikeSpacing) * strikeSpacing;
  
  const distanceToStrike = Math.abs(currentPrice - nearestStrike) / currentPrice;
  
  // Calculate pin probability (higher when closer to strike and lower volatility)
  const baseProbability = 1 - Math.min(1, distanceToStrike * 20);
  const volatilityAdjustment = 1 - Math.min(1, volatility * 2);
  const probability = baseProbability * volatilityAdjustment;
  
  let expiryImpact: 'HIGH' | 'MEDIUM' | 'LOW';
  if (probability > 0.7) expiryImpact = 'HIGH';
  else if (probability > 0.4) expiryImpact = 'MEDIUM';
  else expiryImpact = 'LOW';

  return {
    level: nearestStrike,
    probability,
    expiryImpact
  };
}

function analyzeMarketMakerFlow(
  marketData: any, 
  gammaExposure: OptionsAnalysis['gammaExposure'], 
  symbol: string
): OptionsAnalysis['marketMakerFlow'] {
  const volume5m = marketData['5m']?.volume || 10000;
  const price5m = marketData['5m']?.close || 1;
  const price15m = marketData['15m']?.close || 1;
  
  const priceChange = (price5m - price15m) / price15m;
  
  // Market makers typically hedge opposite to gamma exposure
  let hedgingDirection: 'BUYING' | 'SELLING' | 'NEUTRAL';
  
  if (gammaExposure.direction === 'POSITIVE' && priceChange > 0.001) {
    hedgingDirection = 'SELLING'; // MM sells as price rises (positive gamma)
  } else if (gammaExposure.direction === 'NEGATIVE' && priceChange < -0.001) {
    hedgingDirection = 'BUYING'; // MM buys as price falls (negative gamma)
  } else {
    hedgingDirection = 'NEUTRAL';
  }
  
  // Flow strength based on gamma impact and volume
  const flowStrength = Math.abs(gammaExposure.level) * Math.min(1, volume5m / 50000);
  
  // Expected volatility impact
  const expectedVolatility = calculateImpliedVolatility(marketData, symbol) * 
    (1 + Math.abs(gammaExposure.level) * 0.2);

  return {
    hedgingDirection,
    flowStrength,
    expectedVolatility
  };
}

/**
 * Get options trading signals
 */
export function getOptionsSignals(analysis: OptionsAnalysis, currentPrice: number): string[] {
  const signals: string[] = [];

  // Gamma exposure signals
  if (analysis.gammaExposure.impact === 'HIGH') {
    signals.push(`High ${analysis.gammaExposure.direction.toLowerCase()} gamma exposure detected`);
    
    if (analysis.gammaExposure.direction === 'POSITIVE') {
      signals.push('Positive gamma may dampen volatility');
    } else {
      signals.push('Negative gamma may amplify price moves');
    }
  }

  // Delta wall signals
  const nearSupport = analysis.deltaWalls.support.find(level => 
    Math.abs(level - currentPrice) / currentPrice < 0.02
  );
  const nearResistance = analysis.deltaWalls.resistance.find(level => 
    Math.abs(level - currentPrice) / currentPrice < 0.02
  );

  if (nearSupport) {
    signals.push(`Strong delta wall support near ${nearSupport.toFixed(2)}`);
  }
  if (nearResistance) {
    signals.push(`Strong delta wall resistance near ${nearResistance.toFixed(2)}`);
  }

  // Pin risk signals
  if (analysis.pinRisk.expiryImpact === 'HIGH') {
    signals.push(`High pin risk at ${analysis.pinRisk.level.toFixed(2)} (${(analysis.pinRisk.probability * 100).toFixed(0)}%)`);
  }

  // Market maker flow signals
  if (analysis.marketMakerFlow.flowStrength > 0.6) {
    signals.push(`Strong MM ${analysis.marketMakerFlow.hedgingDirection.toLowerCase()} flow expected`);
  }

  return signals;
}

/**
 * Calculate options-adjusted price targets
 */
export function calculateOptionsAdjustedTargets(
  analysis: OptionsAnalysis, 
  currentPrice: number,
  direction: 'LONG' | 'SHORT'
): { adjustedTarget: number; reasoning: string } {
  let adjustedTarget = currentPrice;
  const reasoning: string[] = [];

  // Adjust based on pin risk
  if (analysis.pinRisk.expiryImpact === 'HIGH') {
    adjustedTarget = analysis.pinRisk.level;
    reasoning.push(`Target adjusted to pin level ${analysis.pinRisk.level.toFixed(2)}`);
  }

  // Adjust based on delta walls
  if (direction === 'LONG' && analysis.deltaWalls.resistance.length > 0) {
    const nearestResistance = analysis.deltaWalls.resistance
      .filter(level => level > currentPrice)
      .sort((a, b) => a - b)[0];
    
    if (nearestResistance && nearestResistance < adjustedTarget * 1.05) {
      adjustedTarget = nearestResistance * 0.995; // Stop just below resistance
      reasoning.push(`Target adjusted below delta wall resistance`);
    }
  } else if (direction === 'SHORT' && analysis.deltaWalls.support.length > 0) {
    const nearestSupport = analysis.deltaWalls.support
      .filter(level => level < currentPrice)
      .sort((a, b) => b - a)[0];
    
    if (nearestSupport && nearestSupport > adjustedTarget * 0.95) {
      adjustedTarget = nearestSupport * 1.005; // Stop just above support
      reasoning.push(`Target adjusted above delta wall support`);
    }
  }

  return {
    adjustedTarget,
    reasoning: reasoning.join('; ')
  };
}