import { TimeframeData } from "./market-data";

export interface OptionsAnalysis {
  gammaLevels: {
    maxGamma: number; // Price level with maximum gamma exposure
    gammaFlip: number; // Price where dealers flip from long to short gamma
    zeroGamma: number; // Price with zero net gamma
  };
  deltaLevels: {
    callWall: number; // Strong resistance from call options
    putWall: number; // Strong support from put options
    netDelta: number; // Net delta exposure
  };
  zdte: {
    expiryLevels: Array<{ strike: number; volume: number; gamma: number; type: "CALL" | "PUT" }>;
    pinRisk: number; // 0-100, probability of pinning to strike
    timeDecay: number; // Theta impact on price movement
    volatility: {
      implied: number;
      realized: number;
      skew: number; // Put-call volatility skew
    };
  };
  marketImpact: {
    dealerHedging: "BUYING" | "SELLING" | "NEUTRAL"; // Expected dealer flow
    suppressionLevels: number[]; // Prices where movement is suppressed
    accelerationLevels: number[]; // Prices where movement accelerates
  };
  signals: {
    direction: "BULLISH" | "BEARISH" | "RANGE_BOUND";
    confidence: number;
    targetLevels: number[];
    riskLevels: number[];
  };
}

export function analyzeZDTEOptions(marketData: TimeframeData, symbol: string): OptionsAnalysis {
  const data5m = marketData["5m"];
  const currentPrice = data5m.close;
  
  // Generate simulated options data (in real implementation would come from options feed)
  const optionsChain = simulateOptionsChain(currentPrice, symbol);
  
  // Calculate gamma exposure levels
  const gammaLevels = calculateGammaLevels(optionsChain, currentPrice);
  
  // Calculate delta exposure levels
  const deltaLevels = calculateDeltaLevels(optionsChain, currentPrice);
  
  // Analyze 0DTE specific metrics
  const zdte = analyzeZDTEMetrics(optionsChain, currentPrice, data5m);
  
  // Assess market impact from options flow
  const marketImpact = assessMarketImpact(optionsChain, gammaLevels, deltaLevels, currentPrice);
  
  // Generate trading signals
  const signals = generateOptionsSignals(gammaLevels, deltaLevels, zdte, marketImpact, currentPrice);
  
  return {
    gammaLevels,
    deltaLevels,
    zdte,
    marketImpact,
    signals
  };
}

function simulateOptionsChain(currentPrice: number, symbol: string): any[] {
  const options = [];
  const strikes = generateStrikes(currentPrice, symbol);
  
  for (const strike of strikes) {
    // Simulate call and put options
    const callVolume = simulateOptionVolume(strike, currentPrice, "CALL");
    const putVolume = simulateOptionVolume(strike, currentPrice, "PUT");
    
    const callGamma = calculateGamma(strike, currentPrice, "CALL");
    const putGamma = calculateGamma(strike, currentPrice, "PUT");
    
    const callDelta = calculateDelta(strike, currentPrice, "CALL");
    const putDelta = calculateDelta(strike, currentPrice, "PUT");
    
    options.push({
      strike,
      type: "CALL",
      volume: callVolume,
      gamma: callGamma,
      delta: callDelta,
      openInterest: callVolume * 2.5, // Simulate OI as multiple of volume
    });
    
    options.push({
      strike,
      type: "PUT",
      volume: putVolume,
      gamma: putGamma,
      delta: putDelta,
      openInterest: putVolume * 2.5,
    });
  }
  
  return options;
}

function generateStrikes(currentPrice: number, symbol: string): number[] {
  const strikes = [];
  const strikesSpacing = getStrikeSpacing(symbol, currentPrice);
  
  // Generate strikes around current price (±10% range)
  const range = currentPrice * 0.1;
  const numStrikes = Math.floor(range / strikesSpacing);
  
  for (let i = -numStrikes; i <= numStrikes; i++) {
    const strike = currentPrice + (i * strikesSpacing);
    if (strike > 0) {
      strikes.push(Math.round(strike / strikesSpacing) * strikesSpacing);
    }
  }
  
  return strikes.sort((a, b) => a - b);
}

function getStrikeSpacing(symbol: string, price: number): number {
  // Strike spacing varies by instrument and price level
  const spacingMap: { [key: string]: number } = {
    "SPY": 1,         // $1 strikes for SPY
    "QQQ": 1,         // $1 strikes for QQQ  
    "AAPL": 2.5,      // $2.50 strikes for AAPL
    "TSLA": 5,        // $5 strikes for TSLA
    "BTCUSD": 1000,   // $1000 strikes for Bitcoin
    "EURUSD": 0.01,   // 1 cent strikes for FX
  };
  
  return spacingMap[symbol] || Math.max(1, Math.round(price * 0.01)); // Default 1% of price
}

function simulateOptionVolume(strike: number, currentPrice: number, type: "CALL" | "PUT"): number {
  // Volume typically highest at-the-money and decreases with distance
  const moneyness = Math.abs(strike - currentPrice) / currentPrice;
  const atmVolume = 10000; // Base volume for ATM options
  
  // Exponential decay with distance from ATM
  const distanceDecay = Math.exp(-moneyness * 20);
  
  // Add some randomness
  const randomFactor = 0.5 + Math.random();
  
  // Puts tend to have higher volume in down markets
  const typeMultiplier = type === "PUT" ? 1.2 : 1.0;
  
  return Math.round(atmVolume * distanceDecay * randomFactor * typeMultiplier);
}

function calculateGamma(strike: number, currentPrice: number, type: "CALL" | "PUT"): number {
  // Simplified gamma calculation (real implementation would use Black-Scholes)
  const moneyness = Math.abs(strike - currentPrice) / currentPrice;
  
  // Gamma is highest ATM and decreases with distance
  const maxGamma = 0.1; // Maximum gamma value
  const gamma = maxGamma * Math.exp(-Math.pow(moneyness * 10, 2));
  
  return gamma;
}

function calculateDelta(strike: number, currentPrice: number, type: "CALL" | "PUT"): number {
  // Simplified delta calculation
  const moneyness = (currentPrice - strike) / currentPrice;
  
  if (type === "CALL") {
    // Call delta ranges from 0 to 1
    return Math.max(0, Math.min(1, 0.5 + moneyness * 5));
  } else {
    // Put delta ranges from -1 to 0
    return Math.min(0, Math.max(-1, -0.5 + moneyness * 5));
  }
}

function calculateGammaLevels(optionsChain: any[], currentPrice: number): any {
  const gammaByStrike = new Map<number, number>();
  
  // Aggregate gamma by strike
  for (const option of optionsChain) {
    const netGamma = option.volume * option.gamma * (option.type === "CALL" ? 1 : -1);
    const currentGamma = gammaByStrike.get(option.strike) || 0;
    gammaByStrike.set(option.strike, currentGamma + netGamma);
  }
  
  // Find key gamma levels
  let maxGamma = 0;
  let maxGammaStrike = currentPrice;
  let zeroGammaStrike = currentPrice;
  let flipStrike = currentPrice;
  
  for (const [strike, gamma] of gammaByStrike.entries()) {
    if (Math.abs(gamma) > Math.abs(maxGamma)) {
      maxGamma = gamma;
      maxGammaStrike = strike;
    }
    
    // Find zero gamma level (closest to zero)
    if (Math.abs(gamma) < Math.abs(gammaByStrike.get(zeroGammaStrike) || 1000)) {
      zeroGammaStrike = strike;
    }
  }
  
  // Gamma flip level is where net gamma changes sign
  const strikes = Array.from(gammaByStrike.keys()).sort((a, b) => a - b);
  for (let i = 1; i < strikes.length; i++) {
    const prevGamma = gammaByStrike.get(strikes[i-1]) || 0;
    const currGamma = gammaByStrike.get(strikes[i]) || 0;
    
    if (prevGamma * currGamma < 0) { // Sign change
      flipStrike = strikes[i];
      break;
    }
  }
  
  return {
    maxGamma: maxGammaStrike,
    gammaFlip: flipStrike,
    zeroGamma: zeroGammaStrike
  };
}

function calculateDeltaLevels(optionsChain: any[], currentPrice: number): any {
  let callWall = 0;
  let putWall = 0;
  let netDelta = 0;
  
  const callWalls: Array<{ strike: number; strength: number }> = [];
  const putWalls: Array<{ strike: number; strength: number }> = [];
  
  for (const option of optionsChain) {
    const deltaExposure = option.volume * option.delta;
    netDelta += deltaExposure;
    
    if (option.type === "CALL" && option.strike > currentPrice) {
      const wallStrength = option.volume * Math.abs(option.delta);
      callWalls.push({ strike: option.strike, strength: wallStrength });
    } else if (option.type === "PUT" && option.strike < currentPrice) {
      const wallStrength = option.volume * Math.abs(option.delta);
      putWalls.push({ strike: option.strike, strength: wallStrength });
    }
  }
  
  // Find strongest walls
  if (callWalls.length > 0) {
    callWall = callWalls.sort((a, b) => b.strength - a.strength)[0].strike;
  }
  
  if (putWalls.length > 0) {
    putWall = putWalls.sort((a, b) => b.strength - a.strength)[0].strike;
  }
  
  return {
    callWall: callWall || currentPrice * 1.05,
    putWall: putWall || currentPrice * 0.95,
    netDelta
  };
}

function analyzeZDTEMetrics(optionsChain: any[], currentPrice: number, marketData: any): any {
  // Filter for 0DTE (simulated as high-volume options near current price)
  const zdteOptions = optionsChain
    .filter(opt => Math.abs(opt.strike - currentPrice) / currentPrice < 0.05) // Within 5%
    .filter(opt => opt.volume > 1000) // High volume threshold
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10); // Top 10 by volume
  
  const expiryLevels = zdteOptions.map(opt => ({
    strike: opt.strike,
    volume: opt.volume,
    gamma: opt.gamma,
    type: opt.type
  }));
  
  // Calculate pin risk (probability of closing near a high-volume strike)
  const totalVolume = zdteOptions.reduce((sum, opt) => sum + opt.volume, 0);
  const nearestStrike = zdteOptions.find(opt => 
    Math.abs(opt.strike - currentPrice) === Math.min(...zdteOptions.map(o => Math.abs(o.strike - currentPrice)))
  );
  
  const pinRisk = nearestStrike ? (nearestStrike.volume / totalVolume) * 100 : 0;
  
  // Time decay impact (higher for 0DTE)
  const timeDecay = calculateTimeDecay(zdteOptions, currentPrice);
  
  // Volatility metrics
  const volatility = {
    implied: 0.3 + Math.random() * 0.4, // Simulate 30-70% IV
    realized: marketData.indicators.atr / currentPrice * Math.sqrt(252), // Annualized realized vol
    skew: -0.1 + Math.random() * 0.1 // Put skew typically negative
  };
  
  return {
    expiryLevels,
    pinRisk,
    timeDecay,
    volatility
  };
}

function calculateTimeDecay(zdteOptions: any[], currentPrice: number): number {
  // Time decay is massive for 0DTE options
  // Simplified calculation - real implementation would use proper theta
  const avgGamma = zdteOptions.reduce((sum, opt) => sum + opt.gamma, 0) / zdteOptions.length;
  
  // Higher gamma = higher time decay
  return avgGamma * 1000; // Scale factor for display
}

function assessMarketImpact(optionsChain: any[], gammaLevels: any, deltaLevels: any, currentPrice: number): any {
  // Determine expected dealer hedging flow
  let dealerHedging: "BUYING" | "SELLING" | "NEUTRAL" = "NEUTRAL";
  
  if (deltaLevels.netDelta > 0) {
    dealerHedging = "SELLING"; // Dealers short deltas, need to sell underlying
  } else if (deltaLevels.netDelta < 0) {
    dealerHedging = "BUYING"; // Dealers long deltas, need to buy underlying
  }
  
  // Identify suppression levels (high gamma areas pin price)
  const suppressionLevels = [];
  const accelerationLevels = [];
  
  // Areas with high gamma tend to suppress movement (pinning)
  if (Math.abs(gammaLevels.maxGamma - currentPrice) < currentPrice * 0.02) {
    suppressionLevels.push(gammaLevels.maxGamma);
  }
  
  // Areas beyond gamma flip can see accelerated movement
  if (currentPrice > gammaLevels.gammaFlip) {
    accelerationLevels.push(deltaLevels.callWall);
  } else {
    accelerationLevels.push(deltaLevels.putWall);
  }
  
  return {
    dealerHedging,
    suppressionLevels,
    accelerationLevels
  };
}

function generateOptionsSignals(gammaLevels: any, deltaLevels: any, zdte: any, marketImpact: any, currentPrice: number): any {
  let direction: "BULLISH" | "BEARISH" | "RANGE_BOUND" = "RANGE_BOUND";
  let confidence = 50;
  const targetLevels = [];
  const riskLevels = [];
  
  // High pin risk suggests range-bound behavior
  if (zdte.pinRisk > 30) {
    direction = "RANGE_BOUND";
    confidence = Math.min(85, 50 + zdte.pinRisk * 0.5);
    
    // Add pin levels as targets
    const pinLevel = zdte.expiryLevels[0]?.strike;
    if (pinLevel) targetLevels.push(pinLevel);
  } else {
    // Low pin risk - directional move more likely
    if (marketImpact.dealerHedging === "BUYING") {
      direction = "BULLISH";
      targetLevels.push(deltaLevels.callWall);
      riskLevels.push(deltaLevels.putWall);
      confidence = 70;
    } else if (marketImpact.dealerHedging === "SELLING") {
      direction = "BEARISH";
      targetLevels.push(deltaLevels.putWall);
      riskLevels.push(deltaLevels.callWall);
      confidence = 70;
    }
  }
  
  // Boost confidence if price is near acceleration levels
  const nearAcceleration = marketImpact.accelerationLevels.some(
    (level: number) => Math.abs(currentPrice - level) / currentPrice < 0.01
  );
  
  if (nearAcceleration && direction !== "RANGE_BOUND") {
    confidence += 15;
  }
  
  // Add gamma levels as key reference points
  targetLevels.push(gammaLevels.maxGamma);
  riskLevels.push(gammaLevels.gammaFlip);
  
  return {
    direction,
    confidence: Math.min(95, confidence),
    targetLevels: [...new Set(targetLevels)], // Remove duplicates
    riskLevels: [...new Set(riskLevels)]
  };
}