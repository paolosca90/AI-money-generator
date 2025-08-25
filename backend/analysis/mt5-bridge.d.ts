import type { Mt5Config } from "~backend/user/api";
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
export declare function fetchWithTimeout(resource: string, options?: any, timeout?: number): Promise<import("node-fetch").Response>;
export declare function executeMT5Order(order: MT5OrderRequest, mt5Config: Mt5Config): Promise<MT5OrderResult>;
export declare function getMT5Positions(mt5Config: Mt5Config): Promise<MT5Position[]>;
export declare function closeMT5Position(ticket: number, mt5Config: Mt5Config): Promise<MT5OrderResult>;
