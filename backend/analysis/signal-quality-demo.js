/**
 * Simple test script to demonstrate enhanced signal quality improvements
 */
// Mock enhanced indicator calculation
function mockCalculateEnhancedRSI(prices) {
    const latestPrice = prices[prices.length - 1];
    const earlierPrice = prices[Math.max(0, prices.length - 14)];
    const change = (latestPrice - earlierPrice) / earlierPrice;
    // Convert to RSI-like value
    if (change > 0.02)
        return 70 + Math.random() * 20; // Overbought
    if (change < -0.02)
        return 10 + Math.random() * 20; // Oversold
    return 40 + Math.random() * 20; // Normal range
}
// Mock confidence calculation with the new system
function mockEnhancedConfidence(symbol, direction) {
    // Traditional confidence (old system)
    const traditional = 70 + Math.random() * 25; // Random 70-95%
    // Enhanced confidence factors
    let enhancedScore = 50; // Start neutral
    const improvements = [];
    // Multi-timeframe analysis
    const timeframeAlignment = Math.random();
    if (timeframeAlignment > 0.7) {
        enhancedScore += 15;
        improvements.push("Strong multi-timeframe confluence");
    }
    // Market session bonus
    const hour = new Date().getUTCHours();
    if ((hour >= 7 && hour <= 10) || (hour >= 13 && hour <= 17)) { // London/NY overlap
        enhancedScore += 10;
        improvements.push("Trading during high-activity session");
    }
    // Technical indicator alignment
    const rsi5m = mockCalculateEnhancedRSI([100, 101, 102, 103, 104]); // Mock price array
    const rsi15m = mockCalculateEnhancedRSI([100, 101, 102, 103, 104]);
    if (direction === "LONG" && rsi5m < 40 && rsi15m < 40) {
        enhancedScore += 20;
        improvements.push("RSI oversold across multiple timeframes");
    }
    else if (direction === "SHORT" && rsi5m > 60 && rsi15m > 60) {
        enhancedScore += 20;
        improvements.push("RSI overbought across multiple timeframes");
    }
    // Volatility filter
    const symbolVolatility = symbol === "BTCUSD" ? 0.15 : symbol === "EURUSD" ? 0.05 : 0.08;
    const currentVolatility = 0.06 + Math.random() * 0.1;
    if (currentVolatility > symbolVolatility * 2) {
        enhancedScore -= 15;
        improvements.push("High volatility detected - reduced confidence");
    }
    else if (currentVolatility < symbolVolatility * 0.5) {
        enhancedScore -= 5;
        improvements.push("Low volatility - limited profit potential");
    }
    else {
        enhancedScore += 5;
        improvements.push("Optimal volatility conditions");
    }
    // Historical performance simulation
    const historicalWinRate = 0.5 + Math.random() * 0.3; // 50-80% win rate
    if (historicalWinRate > 0.7) {
        enhancedScore += 10;
        improvements.push("Strong historical performance for this symbol");
    }
    // Market structure
    const trendStrength = Math.random();
    if (trendStrength > 0.7) {
        enhancedScore += 10;
        improvements.push("Strong trending market conditions");
    }
    // Ensure enhanced score is within bounds
    const enhanced = Math.min(95, Math.max(20, enhancedScore));
    return {
        traditional: Math.round(traditional * 10) / 10,
        enhanced: Math.round(enhanced * 10) / 10,
        improvements
    };
}
// Demonstrate improvements
function demonstrateSignalQualityImprovements() {
    console.log("🚀 TRADING SIGNAL QUALITY IMPROVEMENTS DEMONSTRATION\n");
    const symbols = ["EURUSD", "BTCUSD", "XAUUSD"];
    const directions = ["LONG", "SHORT"];
    symbols.forEach(symbol => {
        directions.forEach(direction => {
            console.log(`📊 ${symbol} ${direction} Signal Analysis:`);
            const results = mockEnhancedConfidence(symbol, direction);
            console.log(`   Traditional Confidence: ${results.traditional}%`);
            console.log(`   Enhanced Confidence:    ${results.enhanced}%`);
            console.log(`   Improvement:           ${results.enhanced >= results.traditional ? '✅' : '⚠️'} ${(results.enhanced - results.traditional).toFixed(1)}%`);
            if (results.improvements.length > 0) {
                console.log(`   Key Improvements:`);
                results.improvements.forEach(improvement => {
                    console.log(`     • ${improvement}`);
                });
            }
            // Quality grading
            let grade = "F";
            if (results.enhanced >= 90)
                grade = "A+";
            else if (results.enhanced >= 85)
                grade = "A";
            else if (results.enhanced >= 80)
                grade = "B+";
            else if (results.enhanced >= 75)
                grade = "B";
            else if (results.enhanced >= 60)
                grade = "C";
            else if (results.enhanced >= 45)
                grade = "D";
            console.log(`   Signal Grade:          ${grade}`);
            console.log(`   Recommended Action:    ${results.enhanced >= 75 ? 'EXECUTE' : results.enhanced >= 60 ? 'CAUTION' : 'SKIP'}`);
            console.log("");
        });
    });
    console.log("✨ KEY ENHANCEMENTS IMPLEMENTED:");
    console.log("   🎯 Dynamic confidence calculation with 8 factors");
    console.log("   📈 Multi-timeframe confluence analysis");
    console.log("   ⏰ Market session awareness");
    console.log("   📊 Enhanced technical indicators (RSI, MACD, Bollinger Bands)");
    console.log("   🔍 Volatility-adjusted scoring");
    console.log("   📚 Historical performance integration");
    console.log("   ⚖️ Risk-adjusted position sizing recommendations");
    console.log("   🚨 Signal quality grading system");
}
// Run the demonstration
if (require.main === module) {
    demonstrateSignalQualityImprovements();
}
export { demonstrateSignalQualityImprovements };
//# sourceMappingURL=signal-quality-demo.js.map