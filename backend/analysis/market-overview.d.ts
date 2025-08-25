export interface AssetReliability {
    symbol: string;
    category: string;
    reliabilityScore: number;
    avgConfidence: number;
    winRate: number;
    recentPerformance: number;
    volatility: "LOW" | "MEDIUM" | "HIGH";
    recommendation: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
    lastAnalyzed: Date;
}
export interface MarketNews {
    id: string;
    title: string;
    summary: string;
    impact: "HIGH" | "MEDIUM" | "LOW";
    affectedAssets: string[];
    source: string;
    publishedAt: Date;
    sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
}
export interface MarketOverview {
    topAssets: AssetReliability[];
    marketNews: MarketNews[];
    marketSentiment: {
        overall: "BULLISH" | "BEARISH" | "NEUTRAL";
        forex: "BULLISH" | "BEARISH" | "NEUTRAL";
        indices: "BULLISH" | "BEARISH" | "NEUTRAL";
        commodities: "BULLISH" | "BEARISH" | "NEUTRAL";
        crypto: "BULLISH" | "BEARISH" | "NEUTRAL";
    };
    sessionInfo: {
        currentSession: "ASIAN" | "EUROPEAN" | "US" | "OVERLAP" | "DEAD";
        nextSession: string;
        timeToNext: string;
        volatilityExpected: "LOW" | "MEDIUM" | "HIGH";
    };
}
export declare const getMarketOverview: () => Promise<MarketOverview>;
