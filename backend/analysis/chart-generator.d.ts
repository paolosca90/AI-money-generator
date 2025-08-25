import { TimeframeData } from "./market-data";
import { AIAnalysis } from "./ai-engine";
export declare function generateChart(symbol: string, marketData: TimeframeData, analysis: AIAnalysis): Promise<string>;
export declare function generateChartWithChartJS(symbol: string, marketData: TimeframeData, analysis: AIAnalysis): Promise<string>;
