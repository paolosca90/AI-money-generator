import { TimeframeData } from "./market-data";

export interface OrderbookAnalysis {
  bidAskSpread: number;
  depth: {
    bidDepth: number;
    askDepth: number;
    ratio: number; // bid/ask ratio
  };
  liquidityLevels: {
    supportLevels: Array<{ price: number; volume: number; strength: number }>;
    resistanceLevels: Array<{ price: number; volume: number; strength: number }>;
  };
  marketMicrostructure: {
    tickDirection: "UPTICK" | "DOWNTICK" | "NEUTRAL";
    orderFlow: "AGGRESSIVE_BUYING" | "AGGRESSIVE_SELLING" | "BALANCED";
    institutionalActivity: "HIGH" | "MEDIUM" | "LOW";
  };
  futuresSpecific: {
    rolloverPressure: number; // 0-100, pressure from contract rollover
    openInterest: number;
    volumeProfile: "NORMAL" | "EXPIRY_DRIVEN" | "NEWS_DRIVEN";
    basis: number; // futures-spot basis
  };
  signals: {
    liquidityBreakout: "BULLISH" | "BEARISH" | "NEUTRAL";
    institutionalDirection: "LONG" | "SHORT" | "NEUTRAL";
    confidence: number;
  };
}

export function analyzeOrderbook(marketData: TimeframeData, symbol: string): OrderbookAnalysis {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];
  
  // Simulate orderbook data (in real implementation would come from broker feed)
  const orderbookData = simulateOrderbookData(data5m, symbol);
  
  // Analyze bid-ask dynamics
  const bidAskSpread = calculateBidAskSpread(orderbookData, symbol);
  
  // Analyze market depth
  const depth = analyzeMarketDepth(orderbookData, data5m.volume);
  
  // Identify key liquidity levels
  const liquidityLevels = identifyLiquidityLevels(orderbookData, [data5m, data15m, data30m]);
  
  // Analyze market microstructure
  const marketMicrostructure = analyzeMarketMicrostructure([data5m, data15m, data30m]);
  
  // Futures-specific analysis
  const futuresSpecific = analyzeFuturesSpecifics(marketData, symbol);
  
  // Generate trading signals
  const signals = generateOrderbookSignals(bidAskSpread, depth, liquidityLevels, marketMicrostructure);
  
  return {
    bidAskSpread,
    depth,
    liquidityLevels,
    marketMicrostructure,
    futuresSpecific,
    signals
  };
}

function simulateOrderbookData(data5m: any, symbol: string): any {
  const currentPrice = data5m.close;
  const spread = getTypicalSpread(symbol, currentPrice);
  
  // Simulate 10 levels on each side
  const bids = [];
  const asks = [];
  
  for (let i = 0; i < 10; i++) {
    const bidPrice = currentPrice - spread * (i + 1);
    const askPrice = currentPrice + spread * (i + 1);
    
    // Simulate volume with realistic distribution (more volume closer to mid)
    const baseVolume = data5m.volume / 20; // Distribute volume across levels
    const volumeMultiplier = Math.exp(-i * 0.3); // Exponential decay
    
    bids.push({
      price: bidPrice,
      volume: baseVolume * volumeMultiplier * (0.8 + Math.random() * 0.4)
    });
    
    asks.push({
      price: askPrice,
      volume: baseVolume * volumeMultiplier * (0.8 + Math.random() * 0.4)
    });
  }
  
  return { bids, asks, midPrice: currentPrice };
}

function getTypicalSpread(symbol: string, price: number): number {
  // Typical spreads for different instruments (as percentage of price)
  const spreadMap: { [key: string]: number } = {
    "BTCUSD": 0.0001,   // 0.01% for crypto
    "ETHUSD": 0.0001,
    "EURUSD": 0.00001,  // 1 pip ≈ 0.001%
    "GBPUSD": 0.00001,
    "USDJPY": 0.0001,   // 1 pip in JPY pairs
    "XAUUSD": 0.0005,   // $0.50 spread on gold
    "CRUDE": 0.001,     // $0.01 spread on oil
    "ES": 0.00005,      // E-mini S&P 500
    "NQ": 0.00005,      // E-mini NASDAQ
  };
  
  const spreadPercent = spreadMap[symbol] || 0.0002;
  return price * spreadPercent;
}

function calculateBidAskSpread(orderbookData: any, symbol: string): number {
  const bestBid = orderbookData.bids[0].price;
  const bestAsk = orderbookData.asks[0].price;
  return bestAsk - bestBid;
}

function analyzeMarketDepth(orderbookData: any, currentVolume: number): any {
  const bidDepth = orderbookData.bids.reduce((sum: number, level: any) => sum + level.volume, 0);
  const askDepth = orderbookData.asks.reduce((sum: number, level: any) => sum + level.volume, 0);
  
  return {
    bidDepth,
    askDepth,
    ratio: bidDepth / askDepth
  };
}

function identifyLiquidityLevels(orderbookData: any, priceData: any[]): any {
  const supportLevels = [];
  const resistanceLevels = [];
  
  // Identify significant bid levels (support)
  const significantBids = orderbookData.bids
    .filter((level: any) => level.volume > orderbookData.bids[0].volume * 0.5)
    .slice(0, 5);
  
  for (const bid of significantBids) {
    supportLevels.push({
      price: bid.price,
      volume: bid.volume,
      strength: calculateLevelStrength(bid, orderbookData.bids)
    });
  }
  
  // Identify significant ask levels (resistance)
  const significantAsks = orderbookData.asks
    .filter((level: any) => level.volume > orderbookData.asks[0].volume * 0.5)
    .slice(0, 5);
  
  for (const ask of significantAsks) {
    resistanceLevels.push({
      price: ask.price,
      volume: ask.volume,
      strength: calculateLevelStrength(ask, orderbookData.asks)
    });
  }
  
  return { supportLevels, resistanceLevels };
}

function calculateLevelStrength(level: any, allLevels: any[]): number {
  const totalVolume = allLevels.reduce((sum, l) => sum + l.volume, 0);
  const volumeRatio = level.volume / totalVolume;
  
  // Strength is based on relative volume size
  return Math.min(100, volumeRatio * 500); // Scale to 0-100
}

function analyzeMarketMicrostructure(priceData: any[]): any {
  const recentData = priceData[0]; // Most recent timeframe
  const previousData = priceData[1] || priceData[0];
  
  // Determine tick direction
  let tickDirection: "UPTICK" | "DOWNTICK" | "NEUTRAL" = "NEUTRAL";
  if (recentData.close > previousData.close) {
    tickDirection = "UPTICK";
  } else if (recentData.close < previousData.close) {
    tickDirection = "DOWNTICK";
  }
  
  // Analyze order flow based on volume and price action
  let orderFlow: "AGGRESSIVE_BUYING" | "AGGRESSIVE_SELLING" | "BALANCED" = "BALANCED";
  
  if (recentData.volume > previousData.volume * 1.3) {
    if (recentData.close > recentData.open) {
      orderFlow = "AGGRESSIVE_BUYING";
    } else if (recentData.close < recentData.open) {
      orderFlow = "AGGRESSIVE_SELLING";
    }
  }
  
  // Estimate institutional activity based on volume patterns
  const avgVolume = priceData.reduce((sum, d) => sum + d.volume, 0) / priceData.length;
  let institutionalActivity: "HIGH" | "MEDIUM" | "LOW" = "LOW";
  
  if (recentData.volume > avgVolume * 2) {
    institutionalActivity = "HIGH";
  } else if (recentData.volume > avgVolume * 1.5) {
    institutionalActivity = "MEDIUM";
  }
  
  return {
    tickDirection,
    orderFlow,
    institutionalActivity
  };
}

function analyzeFuturesSpecifics(marketData: TimeframeData, symbol: string): any {
  const data5m = marketData["5m"];
  
  // Simulate futures-specific metrics (in real implementation would come from futures data)
  const rolloverPressure = calculateRolloverPressure(symbol);
  const openInterest = simulateOpenInterest(data5m.volume, symbol);
  const volumeProfile = analyzeVolumeProfile(marketData);
  const basis = calculateBasis(data5m.close, symbol);
  
  return {
    rolloverPressure,
    openInterest,
    volumeProfile,
    basis
  };
}

function calculateRolloverPressure(symbol: string): number {
  // Simulate rollover pressure based on time to expiry
  // In real implementation, would calculate based on actual contract expiry dates
  const now = new Date();
  const dayOfMonth = now.getDate();
  
  // Assume monthly contracts, pressure increases as expiry approaches
  let pressureScore = 0;
  
  if (dayOfMonth > 15) {
    pressureScore = (dayOfMonth - 15) * 5; // Pressure builds in last 2 weeks
  }
  
  // Commodity futures tend to have more rollover pressure
  if (symbol.includes("CRUDE") || symbol.includes("GOLD") || symbol.includes("SILVER")) {
    pressureScore *= 1.5;
  }
  
  return Math.min(100, pressureScore);
}

function simulateOpenInterest(volume: number, symbol: string): number {
  // Simulate open interest as multiple of daily volume
  const multipliers: { [key: string]: number } = {
    "ES": 3.5,       // E-mini S&P highly liquid
    "NQ": 3.0,       // E-mini NASDAQ
    "CRUDE": 2.8,    // WTI Crude
    "GOLD": 2.5,     // Gold futures
    "EURUSD": 4.0,   // FX futures
  };
  
  const multiplier = multipliers[symbol] || 3.0;
  return volume * multiplier;
}

function analyzeVolumeProfile(marketData: TimeframeData): "NORMAL" | "EXPIRY_DRIVEN" | "NEWS_DRIVEN" {
  const data5m = marketData["5m"];
  const data15m = marketData["15m"];
  const data30m = marketData["30m"];
  
  const recentVolume = data5m.volume;
  const avgVolume = (data5m.volume + data15m.volume + data30m.volume) / 3;
  
  const volumeRatio = recentVolume / avgVolume;
  
  if (volumeRatio > 3) {
    return "NEWS_DRIVEN"; // Extremely high volume suggests news
  } else if (volumeRatio > 2) {
    return "EXPIRY_DRIVEN"; // High volume could be expiry-related
  } else {
    return "NORMAL";
  }
}

function calculateBasis(currentPrice: number, symbol: string): number {
  // Simulate futures-spot basis (in real implementation would use actual spot prices)
  // Basis = Futures Price - Spot Price
  
  // Simulate small random basis with symbol-specific characteristics
  const baselineBasesMap: { [key: string]: number } = {
    "CRUDE": 0.1,    // $0.10 typical basis for oil
    "GOLD": 0.5,     // $0.50 typical basis for gold
    "ES": 0.02,      // Small basis for equity index futures
    "EURUSD": 0.0001,// Minimal basis for FX
  };
  
  const baselineBasis = baselineBasesMap[symbol] || 0.05;
  const randomFactor = -0.5 + Math.random(); // -50% to +50% variation
  
  return baselineBasis * (1 + randomFactor);
}

function generateOrderbookSignals(bidAskSpread: number, depth: any, liquidityLevels: any, microstructure: any): any {
  let liquidityBreakout: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";
  let institutionalDirection: "LONG" | "SHORT" | "NEUTRAL" = "NEUTRAL";
  let confidence = 50;
  
  // Analyze depth ratio for directional bias
  if (depth.ratio > 1.5) {
    // More bids than asks - bullish bias
    liquidityBreakout = "BULLISH";
    confidence += 15;
  } else if (depth.ratio < 0.67) {
    // More asks than bids - bearish bias
    liquidityBreakout = "BEARISH";
    confidence += 15;
  }
  
  // Incorporate microstructure signals
  if (microstructure.orderFlow === "AGGRESSIVE_BUYING") {
    institutionalDirection = "LONG";
    confidence += 20;
  } else if (microstructure.orderFlow === "AGGRESSIVE_SELLING") {
    institutionalDirection = "SHORT";
    confidence += 20;
  }
  
  // Boost confidence with institutional activity
  if (microstructure.institutionalActivity === "HIGH") {
    confidence += 10;
  }
  
  // Consider liquidity level strength
  const strongSupport = liquidityLevels.supportLevels.some((level: any) => level.strength > 50);
  const strongResistance = liquidityLevels.resistanceLevels.some((level: any) => level.strength > 50);
  
  if (strongSupport && !strongResistance) {
    if (liquidityBreakout === "BULLISH") confidence += 10;
  } else if (strongResistance && !strongSupport) {
    if (liquidityBreakout === "BEARISH") confidence += 10;
  }
  
  return {
    liquidityBreakout,
    institutionalDirection,
    confidence: Math.min(95, confidence)
  };
}