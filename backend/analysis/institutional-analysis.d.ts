/**
 * Institutional Trading Analysis Module (v2.0)
 * * Implementa concetti avanzati di trading istituzionale (Market Structure, BOS/CHOCH, Order Blocks)
 * per migliorare drasticamente la qualità dei segnali.
 */
export interface OrderBlock {
    id: string;
    type: "BULLISH" | "BEARISH";
    timeframe: string;
    high: number;
    low: number;
    volume: number;
    timestamp: number;
    strength: "WEAK" | "MODERATE" | "STRONG" | "EXTREME";
    status: "FRESH" | "TESTED" | "BROKEN";
    distance: number;
}
export interface FairValueGap {
    id: string;
    type: "BULLISH" | "BEARISH";
    timeframe: string;
    top: number;
    bottom: number;
    timestamp: number;
    status: "OPEN" | "PARTIAL_FILL" | "FILLED";
    strength: "WEAK" | "MODERATE" | "STRONG";
    volume: number;
}
export interface StructurePoint {
    type: "HH" | "HL" | "LH" | "LL";
    price: number;
    timestamp: number;
}
export interface MarketStructure {
    trend: "UPTREND" | "DOWNTREND" | "RANGING";
    bias: "BULLISH" | "BEARISH" | "NEUTRAL";
    lastBOS: {
        type: "BULLISH" | "BEARISH";
        price: number;
        timestamp: number;
    } | null;
    lastCHOCH: {
        type: "BULLISH" | "BEARISH";
        price: number;
        timestamp: number;
    } | null;
    swingHighs: {
        price: number;
        timestamp: number;
    }[];
    swingLows: {
        price: number;
        timestamp: number;
    }[];
    structurePoints: StructurePoint[];
    keyLevels: number[];
}
export interface SupplyDemandZone {
    id: string;
    type: "SUPPLY" | "DEMAND";
    timeframe: string;
    top: number;
    bottom: number;
    timestamp: number;
    strength: "WEAK" | "MODERATE" | "STRONG" | "EXTREME";
    status: "FRESH" | "TESTED" | "BROKEN";
    volume: number;
    touches: number;
    reaction: "STRONG" | "MODERATE" | "WEAK";
}
export interface InstitutionalSession {
    name: "SYDNEY" | "TOKYO" | "LONDON" | "NEW_YORK";
    isActive: boolean;
    openTime: string;
    closeTime: string;
    volatilityMultiplier: number;
    preferredPairs: string[];
    characteristics: string[];
}
export interface MarketMakerModel {
    phase: "ACCUMULATION" | "MANIPULATION" | "DISTRIBUTION" | "REACCUMULATION";
    confidence: number;
    liquiditySweepProbability: number;
    stopHuntLevel: number | null;
    institutionalFlow: "BUYING" | "SELLING" | "NEUTRAL";
    smartMoneyDirection: "LONG" | "SHORT" | "SIDEWAYS";
}
export interface InstitutionalAnalysis {
    orderBlocks: OrderBlock[];
    fairValueGaps: FairValueGap[];
    marketStructure: MarketStructure;
    supplyDemandZones: SupplyDemandZone[];
    activeSessions: InstitutionalSession[];
    marketMakerModel: MarketMakerModel;
    institutionalLevels: {
        dailyHigh: number;
        dailyLow: number;
        weeklyHigh: number;
        weeklyLow: number;
        monthlyHigh: number;
        monthlyLow: number;
        previousDayHigh: number;
        previousDayLow: number;
    };
    killZones: Array<{
        name: string;
        startTime: string;
        endTime: string;
        isActive: boolean;
        volatilityExpected: "LOW" | "MODERATE" | "HIGH" | "EXTREME";
    }>;
}
/**
 * Identifica gli Swing Highs (massimi di swing) in una serie di candele.
 * Uno swing high è un massimo locale più alto delle candele circostanti.
 */
export declare function identifySwingHighs(candles: Array<{
    high: number;
    timestamp: number;
}>, lookback?: number): {
    price: number;
    timestamp: number;
}[];
/**
 * Identifica gli Swing Lows (minimi di swing) in una serie di candele.
 * Uno swing low è un minimo locale più basso delle candele circostanti.
 */
export declare function identifySwingLows(candles: Array<{
    low: number;
    timestamp: number;
}>, lookback?: number): {
    price: number;
    timestamp: number;
}[];
/**
 * Funzione principale che orchestra l'analisi della struttura di mercato.
 */
export declare function analyzeMarketStructure(candles: Array<{
    high: number;
    low: number;
    open: number;
    close: number;
    volume: number;
    timestamp: number;
}>): MarketStructure;
/**
 * Identify Order Blocks based on institutional order flow patterns
 */
export declare function identifyOrderBlocks(candles: Array<{
    high: number;
    low: number;
    open: number;
    close: number;
    volume: number;
    timestamp: number;
}>, timeframe: string, currentPrice: number): OrderBlock[];
/**
 * Identify Fair Value Gaps (imbalances in price action)
 */
export declare function identifyFairValueGaps(candles: Array<{
    high: number;
    low: number;
    open: number;
    close: number;
    volume: number;
    timestamp: number;
}>, timeframe: string): FairValueGap[];
/**
 * Identify Supply and Demand zones with institutional characteristics
 */
export declare function identifySupplyDemandZones(candles: Array<{
    high: number;
    low: number;
    open: number;
    close: number;
    volume: number;
    timestamp: number;
}>, timeframe: string, currentPrice: number): SupplyDemandZone[];
/**
 * Get current active institutional trading sessions
 */
export declare function getActiveInstitutionalSessions(): InstitutionalSession[];
/**
 * Analyze market maker models and institutional behavior
 */
export declare function analyzeMarketMakerModel(candles: Array<{
    high: number;
    low: number;
    open: number;
    close: number;
    volume: number;
    timestamp: number;
}>, orderBlocks: OrderBlock[], fvgs: FairValueGap[]): MarketMakerModel;
/**
 * Get institutional levels (daily, weekly, monthly highs/lows)
 */
export declare function getInstitutionalLevels(dailyCandles: any[], weeklyCandles: any[], monthlyCandles: any[]): {
    dailyHigh: number;
    dailyLow: number;
    weeklyHigh: number;
    weeklyLow: number;
    monthlyHigh: number;
    monthlyLow: number;
    previousDayHigh: number;
    previousDayLow: number;
};
/**
 * Get kill zones (high probability trading times)
 */
export declare function getKillZones(): Array<{
    name: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
    volatilityExpected: "LOW" | "MODERATE" | "HIGH" | "EXTREME";
}>;
/**
 * Main function to perform comprehensive institutional analysis
 */
export declare function performInstitutionalAnalysis(data5m: any, data15m: any, data30m: any, data1h: any, data4h: any, data1d: any, symbol: string): InstitutionalAnalysis;
