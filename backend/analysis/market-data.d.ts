import type { Mt5Config } from "~backend/user/api";
export interface MarketDataPoint {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    spread: number;
    indicators: {
        rsi: number;
        macd: number;
        atr: number;
    };
    source: 'MT5' | 'FALLBACK';
}
export interface TimeframeData {
    [timeframe: string]: MarketDataPoint;
}
export declare function fetchMarketData(symbol: string, timeframes: string[], mt5Config: Mt5Config, requireRealData?: boolean): Promise<TimeframeData>;
