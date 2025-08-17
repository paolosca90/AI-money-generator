/**
 * Enhanced Technical Analysis Module
 *
 * This module provides sophisticated technical analysis calculations
 * to significantly improve trading signal quality.
 */
export interface EnhancedIndicators {
    rsi: number;
    macd: {
        line: number;
        signal: number;
        histogram: number;
    };
    atr: number;
    sma: {
        sma20: number;
        sma50: number;
        sma200: number;
    };
    ema: {
        ema12: number;
        ema26: number;
    };
    bollinger: {
        upper: number;
        middle: number;
        lower: number;
        squeeze: boolean;
    };
    stochastic: {
        k: number;
        d: number;
    };
    momentum: {
        roc: number;
        momentum: number;
    };
}
export interface MultiTimeframeAnalysis {
    confluence: number;
    trendAlignment: "STRONG_BULL" | "BULL" | "NEUTRAL" | "BEAR" | "STRONG_BEAR";
    momentumAlignment: "INCREASING" | "DECREASING" | "DIVERGING" | "NEUTRAL";
    volatilityState: "LOW" | "NORMAL" | "HIGH" | "EXTREME";
}
export interface MarketConditionContext {
    sessionType: "ASIAN" | "EUROPEAN" | "US" | "OVERLAP" | "DEAD";
    volatilityAdjustment: number;
    trendStrength: number;
    marketNoise: number;
}
/**
 * Calculate enhanced RSI with more sophisticated smoothing
 */
export declare function calculateEnhancedRSI(prices: number[], period?: number): number;
/**
 * Calculate enhanced MACD with signal line and histogram
 */
export declare function calculateEnhancedMACD(prices: number[]): {
    line: number;
    signal: number;
    histogram: number;
};
/**
 * Calculate True Range and Average True Range
 */
export declare function calculateEnhancedATR(highs: number[], lows: number[], closes: number[], period?: number): number;
/**
 * Calculate exponential moving average
 */
export declare function calculateEMA(data: number[], period: number): number[];
/**
 * Calculate simple moving average
 */
export declare function calculateSMA(data: number[], period: number): number[];
/**
 * Calculate Bollinger Bands
 */
export declare function calculateBollingerBands(prices: number[], period?: number, stdDev?: number): {
    upper: number;
    middle: number;
    lower: number;
    squeeze: boolean;
};
/**
 * Calculate Stochastic Oscillator
 */
export declare function calculateStochastic(highs: number[], lows: number[], closes: number[], kPeriod?: number, dPeriod?: number): {
    k: number;
    d: number;
};
/**
 * Analyze multi-timeframe confluence
 */
export declare function analyzeMultiTimeframeConfluence(tf5m: any, tf15m: any, tf30m: any): MultiTimeframeAnalysis;
/**
 * Determine market context for better signal quality
 */
export declare function getMarketConditionContext(): MarketConditionContext;
/**
 * Calculate comprehensive technical indicators for a dataset
 */
export declare function calculateEnhancedIndicators(opens: number[], highs: number[], lows: number[], closes: number[], volumes?: number[]): EnhancedIndicators;
