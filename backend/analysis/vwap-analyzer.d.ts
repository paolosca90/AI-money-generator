import { TimeframeData } from "./market-data";
export interface VWAPAnalysis {
    vwap: number;
    vwapBands: {
        upper: number;
        lower: number;
        deviation: number;
    };
    position: "ABOVE" | "BELOW" | "AT_VWAP";
    strength: number;
    multiTimeframe: {
        "5m": number;
        "15m": number;
        "30m": number;
        "1h": number;
        "4h": number;
    };
    trend: "BULLISH" | "BEARISH" | "NEUTRAL";
    support: number;
    resistance: number;
}
export declare function analyzeVWAP(marketData: TimeframeData, symbol: string): VWAPAnalysis;
export declare function generateVWAPSignals(vwapAnalysis: VWAPAnalysis): {
    entry: "BUY" | "SELL" | "WAIT";
    exit: "TAKE_PROFIT" | "STOP_LOSS" | "HOLD";
    confidence: number;
};
