export interface AIAnalysis {
    signal_strength: number;
    confidence: number;
    direction: 'BUY' | 'SELL' | 'HOLD';
    entry_price: number;
    stop_loss: number;
    take_profit: number;
    holding_period: string;
    risk_reward: number;
    technical_score: number;
    fundamental_score: number;
    reasoning: string[];
    provider: string;
    timestamp: number;
}
export interface MarketData {
    symbol: string;
    current_price: number;
    timeframes: {
        [tf: string]: Array<{
            time: number;
            open: number;
            high: number;
            low: number;
            close: number;
            volume: number;
        }>;
    };
    technical_indicators: any;
    market_context: any;
}
