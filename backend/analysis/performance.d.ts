interface PerformanceStats {
    totalTrades: number;
    winRate: number;
    avgProfit: number;
    avgLoss: number;
    profitFactor: number;
    bestTrade: number;
    worstTrade: number;
    avgConfidence: number;
    totalProfitLoss: number;
    currentStreak: number;
    maxDrawdown: number;
    sharpeRatio: number;
}
export declare const getPerformance: () => Promise<PerformanceStats>;
export declare const getDetailedPerformance: () => Promise<{
    daily: PerformanceStats[];
    weekly: PerformanceStats[];
    monthly: PerformanceStats[];
}>;
interface PerformanceBySymbol {
    symbol: string;
    totalTrades: number;
    winRate: number;
    totalProfitLoss: number;
    avgConfidence: number;
    bestTrade: number;
    worstTrade: number;
}
interface GetPerformanceBySymbolResponse {
    performance: PerformanceBySymbol[];
}
export declare const getPerformanceBySymbol: () => Promise<GetPerformanceBySymbolResponse>;
interface PerformanceByStrategy {
    strategy: string;
    totalTrades: number;
    winRate: number;
    totalProfitLoss: number;
    avgConfidence: number;
    avgHoldingTime: number;
}
interface GetPerformanceByStrategyResponse {
    performance: PerformanceByStrategy[];
}
export declare const getPerformanceByStrategy: () => Promise<GetPerformanceByStrategyResponse>;
export {};
