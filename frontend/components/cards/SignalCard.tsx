import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TradingSignal } from "~backend/analysis/predict";
import { TrendingUp, TrendingDown, Zap, Shield, Target, Clock, BarChart } from "lucide-react";

interface SignalCardProps {
  signal: TradingSignal;
  onExecute: (tradeId: string, lotSize: number) => void;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal, onExecute }) => {
  const isLong = signal.direction === "LONG";
  const confidenceColor = signal.confidence > 85 ? "bg-green-500" : signal.confidence > 75 ? "bg-yellow-500" : "bg-red-500";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLong ? <TrendingUp className="h-6 w-6 text-green-500" /> : <TrendingDown className="h-6 w-6 text-red-500" />}
            <span>{signal.symbol} - {signal.strategy}</span>
          </div>
          <Badge variant={isLong ? "default" : "destructive"}>{signal.direction}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>Confidenza</span>
          </div>
          <span className={`font-bold text-lg ${confidenceColor} text-white px-2 py-1 rounded`}>{signal.confidence}%</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span>Entrata:</span>
            <span className="font-mono">{signal.entryPrice.toFixed(5)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span>Stop Loss:</span>
            <span className="font-mono">{signal.stopLoss.toFixed(5)}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span>Take Profit:</span>
            <span className="font-mono">{signal.takeProfit.toFixed(5)}</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart className="h-4 w-4 text-muted-foreground" />
            <span>R/R:</span>
            <span className="font-mono">1:{signal.riskRewardRatio.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Scadenza:</span>
            <span className="font-mono">{new Date(signal.expiresAt).toLocaleTimeString()}</span>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Analisi Strategia:</h4>
          <p className="text-xs text-muted-foreground">{signal.strategyRecommendation}</p>
        </div>
        
        {/* NEW: Institutional Analysis Section */}
        {signal.institutionalAnalysis && (
          <div className="border-t pt-3">
            <h4 className="font-semibold mb-2 text-purple-600">🏛️ Analisi Istituzionale:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="font-semibold">📊 Smart Money:</span>
                <span className={`px-1 py-0.5 rounded text-xs ${
                  signal.institutionalAnalysis.marketMakerModel.smartMoneyDirection === 'LONG' 
                    ? 'bg-green-100 text-green-700' 
                    : signal.institutionalAnalysis.marketMakerModel.smartMoneyDirection === 'SHORT'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {signal.institutionalAnalysis.marketMakerModel.smartMoneyDirection}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <span className="font-semibold">🎯 Fase MM:</span>
                <span className="text-blue-600 font-mono text-xs">
                  {signal.institutionalAnalysis.marketMakerModel.phase}
                </span>
              </div>
              
              {signal.institutionalAnalysis.orderBlocks.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold">🏛️ Order Blocks:</span>
                  <span className="font-mono text-xs">
                    {signal.institutionalAnalysis.orderBlocks.filter(ob => ob.type === 'BULLISH').length}B/
                    {signal.institutionalAnalysis.orderBlocks.filter(ob => ob.type === 'BEARISH').length}S
                  </span>
                </div>
              )}
              
              {signal.institutionalAnalysis.fairValueGaps.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold">⚡ FVG Aperti:</span>
                  <span className="font-mono text-xs text-orange-600">
                    {signal.institutionalAnalysis.fairValueGaps.filter(fvg => fvg.status === 'OPEN').length}
                  </span>
                </div>
              )}
              
              {signal.institutionalAnalysis.activeSessions.length > 0 && (
                <div className="col-span-2 flex items-center gap-1">
                  <span className="font-semibold">🌍 Sessioni:</span>
                  <div className="flex gap-1">
                    {signal.institutionalAnalysis.activeSessions.map(session => (
                      <span key={session.name} className={`px-1 py-0.5 rounded text-xs ${
                        session.volatilityMultiplier >= 1.2 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {session.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {signal.enhancedConfidence?.institutionalScore && (
                <div className="col-span-2 flex items-center gap-1">
                  <span className="font-semibold">📈 Score Istituzionale:</span>
                  <span className={`font-bold ${
                    signal.enhancedConfidence.institutionalScore >= 80 ? 'text-green-600' :
                    signal.enhancedConfidence.institutionalScore >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {signal.enhancedConfidence.institutionalScore.toFixed(1)}%
                  </span>
                  <span className={`px-1 py-0.5 rounded text-xs ml-1 ${
                    signal.enhancedConfidence.recommendations.institutionalBias.includes('BULLISH') 
                      ? 'bg-green-100 text-green-700' 
                      : signal.enhancedConfidence.recommendations.institutionalBias.includes('BEARISH')
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {signal.enhancedConfidence.recommendations.institutionalBias}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => onExecute(signal.tradeId, signal.recommendedLotSize)}>
          Esegui Trade ({signal.recommendedLotSize} lots)
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SignalCard;
