import { TradingStrategy } from "./trading-strategies";
interface ExecuteRequest {
    tradeId: string;
    lotSize?: number;
    strategy?: TradingStrategy;
}
interface ExecuteResponse {
    success: boolean;
    orderId?: number;
    executionPrice?: number;
    strategy?: TradingStrategy;
    estimatedHoldingTime?: string;
    error?: string;
}
export declare const execute: (params: ExecuteRequest) => Promise<ExecuteResponse>;
export {};
