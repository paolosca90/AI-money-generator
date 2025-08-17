/**
 * Orderbook Market Microstructure Analysis
 * Analyzes market depth, institutional flow, and liquidity zones
 */

export interface OrderbookAnalysis {
  marketDepth: {
    bidDepth: number;
    askDepth: number;
    imbalance: number;
    spread: number;
    impactPrice: number;
  };
  institutionalFlow: {
    direction: 'BUYING' | 'SELLING' | 'NEUTRAL';
    strength: number;
    volumeProfile: 'ACCUMULATION' | 'DISTRIBUTION' | 'BALANCED';
    largeOrderDetection: boolean;
  };
  liquidityZones: {
    levels: number[];
    strength: number[];
    type: ('SUPPORT' | 'RESISTANCE')[];
  };
  futuresMetrics?: {
    rolloverPressure: number;
    openInterest: number;
    contangoBackwardation: 'CONTANGO' | 'BACKWARDATION' | 'NEUTRAL';
  };
}

/**
 * Analyze orderbook market microstructure
 */
export function analyzeOrderbook(marketData: any, symbol: string): OrderbookAnalysis {
  // Simulate realistic orderbook data based on symbol characteristics
  const marketDepth = simulateMarketDepth(marketData, symbol);
  const institutionalFlow = analyzeInstitutionalFlow(marketData, symbol);
  const liquidityZones = identifyLiquidityZones(marketData, symbol);
  const futuresMetrics = symbol.includes('FUTURES') || symbol.includes('USD') ? 
    simulateFuturesMetrics(marketData, symbol) : undefined;

  return {
    marketDepth,
    institutionalFlow,
    liquidityZones,
    futuresMetrics
  };
}

function simulateMarketDepth(marketData: any, symbol: string): OrderbookAnalysis['marketDepth'] {
  const currentPrice = marketData['5m']?.close || 1;
  
  // Symbol-specific spread characteristics
  const spreadCharacteristics: Record<string, number> = {
    'BTCUSD': 0.0001, // 0.01%
    'ETHUSD': 0.0002, // 0.02%
    'EURUSD': 0.00001, // 0.001%
    'GBPUSD': 0.00002, // 0.002%
    'XAUUSD': 0.0001, // 0.01%
    'CRUDE': 0.0002 // 0.02%
  };

  const baseSpread = spreadCharacteristics[symbol] || 0.0001;
  const spread = currentPrice * baseSpread * (0.8 + Math.random() * 0.4); // ±20% variation

  // Simulate market depth
  const bidDepth = 50000 + Math.random() * 100000; // Random depth 50k-150k
  const askDepth = 40000 + Math.random() * 120000; // Random depth 40k-160k
  
  const imbalance = (bidDepth - askDepth) / (bidDepth + askDepth);
  const impactPrice = currentPrice + (spread * Math.sign(imbalance) * Math.abs(imbalance));

  return {
    bidDepth,
    askDepth,
    imbalance,
    spread,
    impactPrice
  };
}

function analyzeInstitutionalFlow(marketData: any, symbol: string): OrderbookAnalysis['institutionalFlow'] {
  const volume5m = marketData['5m']?.volume || 10000;
  const volume15m = marketData['15m']?.volume || 8000;
  const volume30m = marketData['30m']?.volume || 6000;
  
  const price5m = marketData['5m']?.close || 1;
  const price15m = marketData['15m']?.close || 1;
  const price30m = marketData['30m']?.close || 1;

  // Detect large orders through volume spikes
  const avgVolume = (volume5m + volume15m + volume30m) / 3;
  const largeOrderDetection = volume5m > avgVolume * 2;

  // Analyze price vs volume relationship
  let direction: 'BUYING' | 'SELLING' | 'NEUTRAL' = 'NEUTRAL';
  let strength = 0.5;

  if (price5m > price15m && volume5m > avgVolume * 1.2) {
    direction = 'BUYING';
    strength = Math.min(1, (price5m - price15m) / price15m * 100 + 0.3);
  } else if (price5m < price15m && volume5m > avgVolume * 1.2) {
    direction = 'SELLING';
    strength = Math.min(1, (price15m - price5m) / price15m * 100 + 0.3);
  }

  // Determine volume profile
  let volumeProfile: 'ACCUMULATION' | 'DISTRIBUTION' | 'BALANCED';
  const volumeTrend = (volume5m - volume30m) / volume30m;
  const priceTrend = (price5m - price30m) / price30m;

  if (volumeTrend > 0.1 && priceTrend > 0) {
    volumeProfile = 'ACCUMULATION';
  } else if (volumeTrend > 0.1 && priceTrend < 0) {
    volumeProfile = 'DISTRIBUTION';
  } else {
    volumeProfile = 'BALANCED';
  }

  return {
    direction,
    strength,
    volumeProfile,
    largeOrderDetection
  };
}

function identifyLiquidityZones(marketData: any, symbol: string): OrderbookAnalysis['liquidityZones'] {
  const currentPrice = marketData['5m']?.close || 1;
  const high5m = marketData['5m']?.high || currentPrice * 1.01;
  const low5m = marketData['5m']?.low || currentPrice * 0.99;
  const high15m = marketData['15m']?.high || currentPrice * 1.015;
  const low15m = marketData['15m']?.low || currentPrice * 0.985;
  
  const levels: number[] = [];
  const strength: number[] = [];
  const type: ('SUPPORT' | 'RESISTANCE')[] = [];

  // Add significant price levels
  const significantLevels = [
    { price: high15m, type: 'RESISTANCE' as const, strength: 0.8 },
    { price: high5m, type: 'RESISTANCE' as const, strength: 0.6 },
    { price: currentPrice, type: currentPrice > (high5m + low5m) / 2 ? 'SUPPORT' as const : 'RESISTANCE' as const, strength: 0.5 },
    { price: low5m, type: 'SUPPORT' as const, strength: 0.6 },
    { price: low15m, type: 'SUPPORT' as const, strength: 0.8 }
  ];

  // Add psychological levels based on symbol
  const psychLevels = calculatePsychologicalLevels(currentPrice, symbol);
  psychLevels.forEach(level => {
    significantLevels.push({
      price: level,
      type: level > currentPrice ? 'RESISTANCE' as const : 'SUPPORT' as const,
      strength: 0.7
    });
  });

  // Sort and filter levels
  significantLevels
    .filter(level => level.price > currentPrice * 0.98 && level.price < currentPrice * 1.02)
    .sort((a, b) => a.price - b.price)
    .forEach(level => {
      levels.push(level.price);
      strength.push(level.strength);
      type.push(level.type);
    });

  return { levels, strength, type };
}

function calculatePsychologicalLevels(currentPrice: number, symbol: string): number[] {
  const levels = [];
  
  // Symbol-specific psychological level spacing
  const spacingMap: Record<string, number[]> = {
    'BTCUSD': [1000, 5000],
    'ETHUSD': [100, 500],
    'EURUSD': [0.01, 0.05],
    'GBPUSD': [0.01, 0.05],
    'XAUUSD': [10, 50],
    'CRUDE': [5, 10]
  };
  
  const spacings = spacingMap[symbol] || [currentPrice * 0.01, currentPrice * 0.05];
  
  spacings.forEach(spacing => {
    const nearestLevel = Math.round(currentPrice / spacing) * spacing;
    levels.push(nearestLevel, nearestLevel + spacing, nearestLevel - spacing);
  });
  
  return levels.filter(level => level > 0);
}

function simulateFuturesMetrics(marketData: any, symbol: string): OrderbookAnalysis['futuresMetrics'] {
  // Simulate futures-specific metrics
  const rolloverPressure = -0.5 + Math.random(); // -0.5 to 0.5
  const openInterest = 100000 + Math.random() * 500000; // 100k - 600k contracts
  
  let contangoBackwardation: 'CONTANGO' | 'BACKWARDATION' | 'NEUTRAL';
  if (rolloverPressure > 0.2) contangoBackwardation = 'CONTANGO';
  else if (rolloverPressure < -0.2) contangoBackwardation = 'BACKWARDATION';
  else contangoBackwardation = 'NEUTRAL';

  return {
    rolloverPressure,
    openInterest,
    contangoBackwardation
  };
}

/**
 * Get orderbook trading signals
 */
export function getOrderbookSignals(analysis: OrderbookAnalysis): string[] {
  const signals: string[] = [];

  // Market depth signals
  if (Math.abs(analysis.marketDepth.imbalance) > 0.3) {
    const side = analysis.marketDepth.imbalance > 0 ? 'bid' : 'ask';
    signals.push(`Strong ${side} side imbalance detected (${(analysis.marketDepth.imbalance * 100).toFixed(1)}%)`);
  }

  // Institutional flow signals
  if (analysis.institutionalFlow.strength > 0.7) {
    signals.push(`Strong institutional ${analysis.institutionalFlow.direction.toLowerCase()} detected`);
  }

  if (analysis.institutionalFlow.largeOrderDetection) {
    signals.push('Large order activity detected');
  }

  // Liquidity zone signals
  if (analysis.liquidityZones.levels.length > 0) {
    const strongLevels = analysis.liquidityZones.strength.filter(s => s > 0.7).length;
    if (strongLevels > 0) {
      signals.push(`${strongLevels} strong liquidity zones identified`);
    }
  }

  // Futures signals
  if (analysis.futuresMetrics) {
    if (Math.abs(analysis.futuresMetrics.rolloverPressure) > 0.3) {
      signals.push(`${analysis.futuresMetrics.contangoBackwardation.toLowerCase()} pressure detected`);
    }
  }

  return signals;
}