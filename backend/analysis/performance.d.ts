interface PerformanceStats {
    totalTrades: number;
    winRate: number;
    avgProfit: number;
    avgLoss: number;
    profitFactor: number;
    bestTrade: number;
    worstTrade: number;
    avgConfidence: number;
}
export declare const getPerformance: () => Promise<PerformanceStats>;
export {};
