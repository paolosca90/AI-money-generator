import { TradingStrategy } from "./trading-strategies";
import { TradingSignal } from "./signal-generator";
interface PredictRequest {
    symbol: string;
    strategy?: TradingStrategy;
}
export interface TradingSignal {
    tradeId: string;
    symbol: string;
    direction: "LONG" | "SHORT";
    strategy: TradingStrategy;
    entryPrice: number;
    takeProfit: number;
    stopLoss: number;
    confidence: number;
    riskRewardRatio: number;
    recommendedLotSize: number;
    maxHoldingTime: number;
    expiresAt: Date;
    chartUrl?: string;
    strategyRecommendation: string;
    analysis: any;
    institutionalAnalysis?: any;
    enhancedConfidence?: any;
}
export declare const predict: (params: PredictRequest) => Promise<TradingSignal>;
export {};
