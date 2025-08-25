/**
 * Enhanced Confidence Calculation System
 *
 * This module provides sophisticated confidence scoring for trading signals
 * based on multiple factors including technical analysis, market conditions,
 * and historical performance.
 */
import { MultiTimeframeAnalysis, MarketConditionContext, EnhancedIndicators } from "./enhanced-technical-analysis";
import { InstitutionalAnalysis } from "./institutional-analysis";
export interface ConfidenceFactors {
    technicalAlignment: number;
    multiTimeframeConfluence: number;
    volumeConfirmation: number;
    marketConditions: number;
    historicalPerformance: number;
    riskAdjustment: number;
    momentumStrength: number;
    volatilityFilter: number;
    institutionalAlignment: number;
    orderBlockConfirmation: number;
    liquidityZoneConfirmation: number;
    marketMakerConfidence: number;
}
export interface EnhancedConfidenceResult {
    finalConfidence: number;
    confidenceGrade: "A+" | "A" | "B+" | "B" | "C" | "D" | "F";
    factors: ConfidenceFactors;
    institutionalScore: number;
    recommendations: {
        shouldTrade: boolean;
        suggestedLotSizeMultiplier: number;
        riskAdjustment: "REDUCE" | "NORMAL" | "INCREASE";
        timeframeRecommendation: "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM";
        institutionalBias: "STRONG_BULLISH" | "BULLISH" | "NEUTRAL" | "BEARISH" | "STRONG_BEARISH";
    };
    warnings: string[];
}
/**
 * Calculate enhanced confidence score with multiple sophisticated factors
 */
export declare function calculateEnhancedConfidence(indicators5m: EnhancedIndicators, indicators15m: EnhancedIndicators, indicators30m: EnhancedIndicators, multiTimeframeAnalysis: MultiTimeframeAnalysis, marketContext: MarketConditionContext, direction: "LONG" | "SHORT", symbol: string, historicalWinRate?: number, institutionalAnalysis?: InstitutionalAnalysis): EnhancedConfidenceResult;
