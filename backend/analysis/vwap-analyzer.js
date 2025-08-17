export function analyzeVWAP(marketData, symbol) {
    const data5m = marketData["5m"];
    const data15m = marketData["15m"];
    const data30m = marketData["30m"];
    // Calculate multi-timeframe VWAP
    const vwap5m = calculateVWAP([data5m]);
    const vwap15m = calculateVWAP([data5m, data15m]);
    const vwap30m = calculateVWAP([data5m, data15m, data30m]);
    // Simulate 1h and 4h VWAP (in real implementation would use actual data)
    const vwap1h = vwap30m * (1 + (Math.random() - 0.5) * 0.002);
    const vwap4h = vwap30m * (1 + (Math.random() - 0.5) * 0.005);
    const currentPrice = data5m.close;
    const mainVWAP = vwap15m; // Use 15m as main VWAP
    // Calculate VWAP bands using standard deviation
    const priceData = [data5m, data15m, data30m];
    const deviation = calculatePriceDeviation(priceData, mainVWAP);
    const vwapBands = {
        upper: mainVWAP + (deviation * 2),
        lower: mainVWAP - (deviation * 2),
        deviation: deviation
    };
    // Determine position relative to VWAP
    const position = getVWAPPosition(currentPrice, mainVWAP);
    // Calculate signal strength
    const strength = calculateVWAPStrength(currentPrice, mainVWAP, deviation, priceData);
    // Determine VWAP trend
    const trend = determineVWAPTrend(vwap5m, vwap15m, vwap30m);
    // Calculate dynamic support and resistance based on VWAP
    const { support, resistance } = calculateVWAPLevels(mainVWAP, vwapBands, currentPrice);
    return {
        vwap: mainVWAP,
        vwapBands,
        position,
        strength,
        multiTimeframe: {
            "5m": vwap5m,
            "15m": vwap15m,
            "30m": vwap30m,
            "1h": vwap1h,
            "4h": vwap4h
        },
        trend,
        support,
        resistance
    };
}
function calculateVWAP(timeframes) {
    const totalVolume = timeframes.reduce((sum, tf) => sum + tf.volume, 0);
    const volumeWeightedSum = timeframes.reduce((sum, tf) => {
        const typicalPrice = (tf.high + tf.low + tf.close) / 3;
        return sum + (typicalPrice * tf.volume);
    }, 0);
    return totalVolume > 0 ? volumeWeightedSum / totalVolume : timeframes[0].close;
}
function calculatePriceDeviation(priceData, vwap) {
    const prices = priceData.map(d => (d.high + d.low + d.close) / 3);
    const squaredDiffs = prices.map(price => Math.pow(price - vwap, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / prices.length;
    return Math.sqrt(variance);
}
function getVWAPPosition(currentPrice, vwap) {
    const threshold = vwap * 0.0005; // 0.05% threshold
    if (currentPrice > vwap + threshold)
        return "ABOVE";
    if (currentPrice < vwap - threshold)
        return "BELOW";
    return "AT_VWAP";
}
function calculateVWAPStrength(currentPrice, vwap, deviation, priceData) {
    // Calculate how far price is from VWAP in terms of standard deviations
    const priceDistance = Math.abs(currentPrice - vwap) / deviation;
    // Volume confirmation
    const volumes = priceData.map(d => d.volume);
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const volumeConfirmation = volumes[0] > avgVolume * 1.2 ? 1.5 : 1;
    // Base strength on distance and volume
    let strength = Math.min(100, (priceDistance * 50) * volumeConfirmation);
    // Boost strength if price is consistently above/below VWAP
    const priceAboveVWAP = priceData.filter(d => d.close > vwap).length;
    const consistency = priceAboveVWAP === priceData.length || priceAboveVWAP === 0 ? 1.3 : 1;
    return Math.min(100, strength * consistency);
}
function determineVWAPTrend(vwap5m, vwap15m, vwap30m) {
    // Check if VWAPs are in ascending order (bullish) or descending (bearish)
    if (vwap5m > vwap15m && vwap15m > vwap30m) {
        const avgIncrease = ((vwap5m - vwap30m) / vwap30m);
        return avgIncrease > 0.001 ? "BULLISH" : "NEUTRAL"; // 0.1% threshold
    }
    if (vwap5m < vwap15m && vwap15m < vwap30m) {
        const avgDecrease = ((vwap30m - vwap5m) / vwap30m);
        return avgDecrease > 0.001 ? "BEARISH" : "NEUTRAL"; // 0.1% threshold
    }
    return "NEUTRAL";
}
function calculateVWAPLevels(vwap, bands, currentPrice) {
    // Dynamic support and resistance based on VWAP position
    let support;
    let resistance;
    if (currentPrice > vwap) {
        // Price above VWAP - VWAP acts as support
        support = vwap;
        resistance = bands.upper;
    }
    else {
        // Price below VWAP - VWAP acts as resistance
        support = bands.lower;
        resistance = vwap;
    }
    return { support, resistance };
}
// Enhanced VWAP-based entry and exit signals
export function generateVWAPSignals(vwapAnalysis) {
    const { position, strength, trend, vwap, vwapBands } = vwapAnalysis;
    let entry = "WAIT";
    let exit = "HOLD";
    let confidence = 50;
    // Entry signals based on VWAP position and trend
    if (position === "ABOVE" && trend === "BULLISH" && strength > 60) {
        entry = "BUY";
        confidence = Math.min(95, 70 + (strength * 0.3));
    }
    else if (position === "BELOW" && trend === "BEARISH" && strength > 60) {
        entry = "SELL";
        confidence = Math.min(95, 70 + (strength * 0.3));
    }
    // Mean reversion signals (when price is far from VWAP)
    if (strength > 80) {
        if (position === "ABOVE" && trend !== "BULLISH") {
            entry = "SELL"; // Mean reversion short
            confidence = Math.min(90, 60 + (strength * 0.2));
        }
        else if (position === "BELOW" && trend !== "BEARISH") {
            entry = "BUY"; // Mean reversion long
            confidence = Math.min(90, 60 + (strength * 0.2));
        }
    }
    return { entry, exit, confidence };
}
//# sourceMappingURL=vwap-analyzer.js.map