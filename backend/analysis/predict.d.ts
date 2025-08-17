import { TradingStrategy } from "./trading-strategies";
interface PredictRequest {
    symbol: string;
    strategy?: TradingStrategy;
    riskPercentage?: number;
    accountBalance?: number;
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
    chartUrl?: string;
    strategyRecommendation: string;
    analysis: {
        technical: {
            trend: string;
            structure: string;
            keyLevels: number[];
            breakoutProbability: number;
            support: number;
            resistance: number;
            rsi: number;
            macd: number;
            atr: number;
        };
        smartMoney: {
            institutionalFlow: string;
            volumeProfile: string;
            orderFlow: string;
            liquidityZones: number[];
        };
        professional: {
            topTraders: string[];
            consensusView: string;
            riskReward: number;
            timeframe: string;
        };
        sentiment: {
            score: number;
            sources: string[];
            summary?: string;
        };
        volatility: {
            hourly: number;
            daily: number;
        };
        strategy: {
            name: string;
            description: string;
            timeframes: string[];
            marketConditions: string[];
            riskLevel: "LOW" | "MEDIUM" | "HIGH";
        };
    };
}
export declare const predict: (params: PredictRequest) => Promise<TradingSignal>;
export {};
