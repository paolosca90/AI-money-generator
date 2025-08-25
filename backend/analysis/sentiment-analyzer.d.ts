export interface SentimentAnalysis {
    score: number;
    sources: string[];
    summary: string;
}
export declare function analyzeSentiment(symbol: string): Promise<SentimentAnalysis>;
