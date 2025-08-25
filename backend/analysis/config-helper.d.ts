/**
 * Unified configuration helper to ensure consistent MT5 and trading parameters
 * across all signal generation methods (automatic, manual, and forced).
 *
 * This centralizes configuration retrieval to eliminate timing discrepancies
 * between automatic signals (fetched every 2 minutes) and manual signals
 * (fetched at request time).
 */
export interface UnifiedTradingConfig {
    mt5Config: any;
    tradeParams: {
        accountBalance: number;
        riskPercentage: number;
    };
}
/**
 * Gets unified trading configuration for consistent signal generation.
 * This function ensures all signal generation methods use the same
 * configuration source and validation logic.
 *
 * @returns Promise<UnifiedTradingConfig> The unified configuration
 * @throws Error if MT5 configuration or preferences are not available
 */
export declare function getUnifiedTradingConfig(): Promise<UnifiedTradingConfig>;
/**
 * Validates that a generated signal uses real MT5 data.
 * This ensures consistency across all signal generation methods.
 *
 * @param signal The trading signal to validate
 * @param symbol The trading symbol (for error messages)
 * @returns boolean True if signal uses MT5 data, throws error if not
 * @throws Error if signal uses fallback data
 */
export declare function validateMT5DataSource(signal: any, symbol: string): boolean;
/**
 * Creates standardized database parameters for signal insertion.
 * This ensures all signals use consistent user_id and database structure.
 *
 * @param signal The trading signal
 * @param status The signal status ('pending' for manual, 'auto_generated' for automatic)
 * @returns Object with standardized database parameters
 */
export declare function createStandardizedSignalParams(signal: any, status: 'pending' | 'auto_generated'): {
    tradeId: any;
    userId: number;
    symbol: any;
    direction: any;
    strategy: any;
    entryPrice: any;
    takeProfit: any;
    stopLoss: any;
    confidence: any;
    riskRewardRatio: any;
    recommendedLotSize: any;
    maxHoldingTime: any;
    expiresAt: any;
    analysisData: string;
    status: "pending" | "auto_generated";
};
