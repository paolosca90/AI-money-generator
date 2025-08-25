import { TradingStrategy } from "./trading-strategies";
import type { Mt5Config } from "~backend/user/api";
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
}
export declare function generateSignalForSymbol(symbol: string, mt5Config: Mt5Config, tradeParams: {
    accountBalance: number;
    riskPercentage: number;
}, userStrategy?: TradingStrategy, requireRealData?: boolean): Promise<TradingSignal>;
