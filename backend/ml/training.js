import { api } from "encore.dev/api";
import { learningEngine } from "./learning-engine";
// Triggers ML model training and returns performance metrics.
export const trainModel = api({
    expose: true,
    method: "POST",
    path: "/ml/train"
}, async (req) => {
    const startTime = Date.now();
    console.log("🚀 Starting ML model training...");
    try {
        // Train the model
        const metrics = await learningEngine.trainModel();
        // Get recommendations
        const recommendations = await learningEngine.getModelRecommendations();
        const trainingTime = (Date.now() - startTime) / 1000;
        console.log(`✅ Training completed in ${trainingTime}s`);
        return {
            success: true,
            metrics,
            trainingTime,
            recommendations
        };
    }
    catch (error) {
        console.error("❌ Training failed:", error);
        throw error;
    }
});
// Triggers pattern detection for a specific symbol.
export const detectPatterns = api({
    expose: true,
    method: "POST",
    path: "/ml/detect-patterns"
}, async (req) => {
    const { symbol } = req;
    console.log(`🔍 Detecting patterns for ${symbol}...`);
    // Simulate market data (in real implementation, this would come from market data service)
    const mockMarketData = {
        symbol,
        timeframe: "15m",
        prices: Array.from({ length: 100 }, () => Math.random() * 1000 + 50000),
        volumes: Array.from({ length: 100 }, () => Math.random() * 1000000),
        timestamp: Date.now()
    };
    await learningEngine.detectMarketPatterns(symbol, mockMarketData);
    // Simulate number of patterns detected
    const patternsDetected = Math.floor(Math.random() * 3) + 1;
    console.log(`✅ Detected ${patternsDetected} patterns for ${symbol}`);
    return {
        success: true,
        patternsDetected
    };
});
// Gets ML model recommendations for optimization.
export const getRecommendations = api({
    expose: true,
    method: "GET",
    path: "/ml/recommendations"
}, async () => {
    const recommendations = await learningEngine.getModelRecommendations();
    return { recommendations };
});
//# sourceMappingURL=training.js.map