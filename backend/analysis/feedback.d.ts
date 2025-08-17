interface FeedbackRequest {
    tradeId: string;
    actualDirection: "LONG" | "SHORT";
    profitLoss: number;
}
interface FeedbackResponse {
    success: boolean;
}
export declare const recordFeedback: (params: FeedbackRequest) => Promise<FeedbackResponse>;
export {};
