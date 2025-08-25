import type { TradingSignal } from "./signal-generator";
export interface SignalAnalyticsData {
    symbol: string;
    success: boolean;
    signal?: TradingSignal;
    error?: string;
    generationTime: number;
    marketConditions?: {
        sessionType: string;
        volatilityState: string;
        trendAlignment: string;
        confluence: number;
    };
    timestamp: Date;
}
export interface SignalPerformanceData {
    tradeId: string;
    symbol: string;
    predictedDirection: "LONG" | "SHORT";
    actualDirection?: "LONG" | "SHORT";
    predictedConfidence: number;
    actualProfitLoss?: number;
    executionTime?: Date;
    closeTime?: Date;
    marketConditionsAtEntry: any;
    marketConditionsAtExit?: any;
    technicalIndicatorsAtEntry: any;
    technicalIndicatorsAtExit?: any;
}
export declare function recordSignalAnalytics(data: SignalAnalyticsData): Promise<void>;
export declare function recordSignalPerformance(data: SignalPerformanceData): Promise<void>;
export declare function getSignalAnalytics(timeframe?: 'hour' | 'day' | 'week' | 'month'): Promise<{
    successRateBySymbol: {
        symbol: any;
        totalSignals: number;
        successfulSignals: number;
        successRate: number;
        avgGenerationTime: number;
    }[];
    performanceByConditions: {
        sessionType: any;
        volatilityState: any;
        signalCount: number;
        avgConfidence: number;
        successfulCount: number;
    }[];
    trendAnalysis: {
        hour: any;
        signalsGenerated: number;
        avgConfidence: number;
        successfulSignals: number;
    }[];
}>;
export declare function getMLTrainingData(): Promise<{
    tradeId: any;
    symbol: any;
    predictedDirection: any;
    actualDirection: any;
    predictedConfidence: number;
    actualProfitLoss: number;
    marketConditionsEntry: any;
    technicalIndicatorsEntry: any;
    executionTime: any;
    closeTime: any;
    generationTime: number;
    generationMarketConditions: any;
    wasCorrect: boolean;
    wasProfitable: boolean;
}[]>;
export declare function updateSignalOutcome(tradeId: string, actualDirection: "LONG" | "SHORT", profitLoss: number): Promise<void>;
