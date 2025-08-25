export interface AutoSignal {
    symbol: string;
    direction: "LONG" | "SHORT";
    confidence: number;
    entryPrice: number;
    takeProfit: number;
    stopLoss: number;
    riskRewardRatio: number;
    strategy: string;
    timeframe: string;
    analysis: {
        rsi: number;
        macd: number;
        trend: string;
        volatility: string;
    };
    createdAt: Date;
    tradeId: string;
}
interface GetTopSignalsResponse {
    signals: AutoSignal[];
}
export declare const getTopSignals: () => Promise<GetTopSignalsResponse>;
export declare const getSignalStats: () => Promise<{
    totalGenerated: number;
    totalExecuted: number;
    totalClosed: number;
    avgConfidence: number;
    topPerformingSymbol: string;
    lastGenerationTime: Date | null;
}>;
export declare const forceSignalGeneration: () => Promise<{
    success: boolean;
    message: string;
}>;
export {};
