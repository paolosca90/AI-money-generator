export interface LearningMetrics {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix: number[][];
}
export interface FeatureImportance {
    rsi: number;
    macd: number;
    atr: number;
    volume: number;
    sentiment: number;
    smartMoney: number;
    priceAction: number;
    multiTimeframe: number;
}
export interface AdaptiveLearning {
    learningRate: number;
    regularization: number;
    batchSize: number;
    dropoutRate: number;
    optimizerType: string;
}
export declare class MLLearningEngine {
    private modelVersion;
    private currentEpoch;
    trainModel(): Promise<LearningMetrics>;
    detectMarketPatterns(symbol: string, marketData: any): Promise<void>;
    private generateRealisticPatterns;
    private getTrainingData;
    private analyzeAndAdaptByDimension;
    getConfidenceAdjustments(symbol: string, session: string, strategy: string): Promise<{
        parameter: string;
        value: number;
    }[]>;
    private simulateTraining;
    private generateSimulatedMetrics;
    private recordTrainingProgress;
    private updateFeatureImportance;
    getModelRecommendations(): Promise<string[]>;
}
export declare const learningEngine: MLLearningEngine;
