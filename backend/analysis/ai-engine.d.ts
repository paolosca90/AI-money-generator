import { TimeframeData } from "./market-data";
import { MultiTimeframeAnalysis, MarketConditionContext, EnhancedIndicators } from "./enhanced-technical-analysis";
import { EnhancedConfidenceResult } from "./enhanced-confidence-system";
export interface AIAnalysis {
    direction: "LONG" | "SHORT";
    confidence: number;
    enhancedConfidence: EnhancedConfidenceResult;
    support: number;
    resistance: number;
    sentiment: {
        score: number;
        sources: string[];
    };
    volatility: {
        hourly: number;
        daily: number;
    };
    smartMoney: {
        institutionalFlow: "BUYING" | "SELLING" | "NEUTRAL";
        volumeProfile: "ACCUMULATION" | "DISTRIBUTION" | "CONSOLIDATION";
        orderFlow: "BULLISH" | "BEARISH" | "NEUTRAL";
        liquidityZones: number[];
    };
    priceAction: {
        trend: "UPTREND" | "DOWNTREND" | "SIDEWAYS";
        structure: "BULLISH" | "BEARISH" | "NEUTRAL";
        keyLevels: number[];
        breakoutProbability: number;
    };
    professionalAnalysis: {
        topTraders: string[];
        consensusView: "BULLISH" | "BEARISH" | "NEUTRAL";
        riskReward: number;
        timeframe: string;
    };
    technical: {
        rsi: number;
        macd: number;
        atr: number;
    };
    enhancedTechnical: {
        indicators5m: EnhancedIndicators;
        indicators15m: EnhancedIndicators;
        indicators30m: EnhancedIndicators;
        multiTimeframeAnalysis: MultiTimeframeAnalysis;
        marketContext: MarketConditionContext;
    };
    vwap: {
        analysis: any;
        signals: any;
    };
}
export declare function analyzeWithAI(marketData: TimeframeData, symbol: string): Promise<AIAnalysis>;
