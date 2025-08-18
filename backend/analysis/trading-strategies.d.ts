export type TradingStrategy = "SCALPING" | "INTRADAY" | "SWING";
export interface StrategyConfig {
    name: string;
    description: string;
    timeframes: string[];
    riskRewardRatio: number;
    stopLossMultiplier: number;
    takeProfitMultiplier: number;
    maxHoldingTime: number;
    minConfidence: number;
    maxLotSize: number;
    volatilityThreshold: number;
    trendStrengthRequired: number;
    marketConditions: string[];
}
export declare const TRADING_STRATEGIES: Record<TradingStrategy, StrategyConfig>;
export interface StrategyPriceTargets {
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    riskAmount: number;
    rewardAmount: number;
    riskRewardRatio: number;
}
export declare function calculateStrategyTargets(strategy: TradingStrategy, currentPrice: number, atr: number, direction: "LONG" | "SHORT", symbol: string): StrategyPriceTargets;
export declare function getOptimalStrategy(marketData: any, aiAnalysis: any, symbol: string, userPreference?: TradingStrategy): TradingStrategy;
export declare function getStrategyRecommendation(strategy: TradingStrategy, marketData: any, aiAnalysis: any): string;
export declare function calculatePositionSize(strategy: TradingStrategy, accountBalance: number, riskPercentage: number, riskAmount: number): number;
