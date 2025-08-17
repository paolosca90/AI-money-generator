export interface MT5OrderRequest {
    symbol: string;
    direction: "LONG" | "SHORT";
    lotSize: number;
    entryPrice: number;
    takeProfit: number;
    stopLoss: number;
    comment?: string;
}
export interface MT5OrderResult {
    success: boolean;
    orderId?: number;
    executionPrice?: number;
    error?: string;
}
export interface MT5AccountInfo {
    balance: number;
    equity: number;
    margin: number;
    freeMargin: number;
    marginLevel: number;
    currency: string;
}
export interface MT5Position {
    ticket: number;
    symbol: string;
    type: number;
    volume: number;
    openPrice: number;
    currentPrice: number;
    profit: number;
    swap: number;
    comment: string;
}
export interface SymbolValidationResult {
    symbol: string;
    tradable: boolean;
    reason?: string;
}
export declare function fetchWithTimeout(resource: string, options?: any, timeout?: number): Promise<import("node-fetch").Response>;
export declare function executeMT5Order(order: MT5OrderRequest): Promise<MT5OrderResult>;
export declare function simulateMT5Execution(order: MT5OrderRequest): Promise<MT5OrderResult>;
export declare function getMT5AccountInfo(): Promise<MT5AccountInfo | null>;
export declare function getMT5Positions(): Promise<MT5Position[]>;
export declare function closeMT5Position(ticket: number): Promise<MT5OrderResult>;
export declare function getSymbolVariations(symbol: string): string[];
export declare function validateSymbolForTrading(symbolInfo: any, symbol: string): {
    tradable: boolean;
    reason?: string;
};
export declare function findTradableSymbolForExecution(baseUrl: string, symbol: string): Promise<SymbolValidationResult>;
