interface ClosePositionRequest {
    ticket: number;
}
interface ClosePositionResponse {
    success: boolean;
    closedPrice?: number;
    profit?: number;
    error?: string;
}
export declare const closePosition: (params: ClosePositionRequest) => Promise<ClosePositionResponse>;
export {};
