interface TrainingRequest {
    modelName?: string;
    epochs?: number;
    learningRate?: number;
}
interface TrainingResponse {
    success: boolean;
    metrics: {
        accuracy: number;
        precision: number;
        recall: number;
        f1Score: number;
    };
    trainingTime: number;
    recommendations: string[];
}
export declare const trainModel: (params: TrainingRequest) => Promise<TrainingResponse>;
export declare const detectPatterns: (params: {
    symbol: string;
}) => Promise<{
    success: boolean;
    patternsDetected: number;
}>;
export declare const getRecommendations: () => Promise<{
    recommendations: string[];
}>;
export {};
