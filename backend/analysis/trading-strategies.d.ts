export type TradingStrategy = "SCALPING" | "INTRADAY" | "SWING";
export declare enum TradingStrategyEnum {
    SCALPING = "SCALPING",
    INTRADAY = "INTRADAY",
    SWING = "SWING"
}
export type TechnicalAnalysisStrategy = "MOVING_AVERAGE" | "BOLLINGER_BANDS" | "RSI" | "MACD" | "SUPPORT_RESISTANCE";
export declare enum TechnicalAnalysisStrategyEnum {
    MOVING_AVERAGE = "MOVING_AVERAGE",
    BOLLINGER_BANDS = "BOLLINGER_BANDS",
    RSI = "RSI",
    MACD = "MACD",
    SUPPORT_RESISTANCE = "SUPPORT_RESISTANCE"
}
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
export interface StrategyResult {
    success: boolean;
    signal: "LONG" | "SHORT" | "NONE";
    confidence: number;
    entryPrice?: number;
    stopLoss?: number;
    takeProfit?: number;
    reason: string;
}
export interface MovingAverageParams {
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod?: number;
}
export interface RSIParams {
    period: number;
    overboughtLevel: number;
    oversoldLevel: number;
}
export interface MACDParams {
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod: number;
}
export interface BollingerBandsParams {
    period: number;
    standardDeviations: number;
}
export interface SupportResistanceParams {
    lookbackPeriods: number;
    minTouches: number;
    tolerance: number;
}
export type StrategyParams = MovingAverageParams | RSIParams | MACDParams | BollingerBandsParams | SupportResistanceParams;
export declare function calculateStrategyTargets(strategy: TradingStrategy, currentPrice: number, atr: number, direction: "LONG" | "SHORT", symbol: string): StrategyPriceTargets;
export declare function getOptimalStrategy(marketData: any, aiAnalysis: any, symbol: string, userPreference?: TradingStrategy): TradingStrategy;
export declare function getStrategyRecommendation(strategy: TradingStrategy, marketData: any, aiAnalysis: any): string;
export declare function calculatePositionSize(strategy: TradingStrategy, accountBalance: number, riskPercentage: number, riskAmount: number): number;
