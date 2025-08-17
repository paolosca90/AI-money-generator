export interface MarketDataPoint {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    indicators: {
        rsi: number;
        macd: number;
        atr: number;
    };
}
export interface TimeframeData {
    [timeframe: string]: MarketDataPoint;
}
export declare function fetchMarketData(symbol: string, timeframes: string[]): Promise<TimeframeData>;
