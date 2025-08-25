export interface MLAnalytics {
    modelPerformance: {
        accuracy: number;
        precision: number;
        recall: number;
        f1Score: number;
        sharpeRatio: number;
        maxDrawdown: number;
    };
    predictionStats: {
        totalPredictions: number;
        correctPredictions: number;
        avgConfidence: number;
        winRate: number;
        profitFactor: number;
    };
    featureImportance: Array<{
        feature: string;
        importance: number;
        type: string;
    }>;
    learningProgress: Array<{
        epoch: number;
        trainingLoss: number;
        validationLoss: number;
        accuracy: number;
    }>;
    marketPatterns: Array<{
        pattern: string;
        type: string;
        confidence: number;
        successRate: number;
        avgProfit: number;
        detectedAt: Date;
    }>;
    performanceTimeline: Array<{
        date: string;
        accuracy: number;
        profitLoss: number;
        predictions: number;
    }>;
    adaptiveParameters: Array<{
        parameter: string;
        currentValue: number;
        previousValue: number;
        adaptationReason: string;
        performanceImprovement: number;
    }>;
    signalAnalytics: {
        successRateBySymbol: Array<{
            symbol: string;
            totalSignals: number;
            successfulSignals: number;
            successRate: number;
            avgGenerationTime: number;
        }>;
        performanceByConditions: Array<{
            sessionType: string;
            volatilityState: string;
            signalCount: number;
            avgConfidence: number;
            successfulCount: number;
        }>;
        trendAnalysis: Array<{
            hour: string;
            signalsGenerated: number;
            avgConfidence: number;
            successfulSignals: number;
        }>;
    };
    mlTrainingInsights: {
        totalTrainingRecords: number;
        accuracyBySymbol: Array<{
            symbol: string;
            accuracy: number;
            sampleSize: number;
        }>;
        confidenceCalibration: Array<{
            confidenceRange: string;
            actualSuccessRate: number;
            sampleSize: number;
        }>;
        marketConditionPerformance: Array<{
            condition: string;
            accuracy: number;
            avgProfitLoss: number;
            sampleSize: number;
        }>;
    };
}
export declare const getMLAnalytics: () => Promise<MLAnalytics>;
export declare const recordModelMetrics: (params: {
    modelName: string;
    modelVersion: string;
    metrics: Record<string, number>;
}) => Promise<{
    success: boolean;
}>;
export declare const recordFeatureImportance: (params: {
    modelName: string;
    modelVersion: string;
    features: Array<{
        name: string;
        importance: number;
        type: string;
    }>;
}) => Promise<{
    success: boolean;
}>;
export declare const recordPredictionAccuracy: (params: {
    tradeId: string;
    predictedDirection: string;
    actualDirection?: string;
    predictedConfidence: number;
    actualProfitLoss?: number;
    modelVersion: string;
    symbol: string;
    timeframe: string;
}) => Promise<{
    success: boolean;
}>;
export declare const recordMarketPattern: (params: {
    patternName: string;
    patternType: string;
    symbol: string;
    timeframe: string;
    confidence: number;
    successRate: number;
    avgProfit: number;
    patternData: any;
}) => Promise<{
    success: boolean;
}>;
export declare const getMLTrainingAnalytics: () => Promise<{
    trainingData: any[];
    insights: any;
    recommendations: string[];
}>;
