import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import MLMetricCard from "../components/cards/MLMetricCard";
import MLChart from "../components/charts/MLChart";
import { Brain, Target, Activity, TrendingUp, Zap, BarChart, Lightbulb, Settings, Play, RefreshCw } from "lucide-react";

const availableSymbols = [
  "BTCUSD", "ETHUSD", "EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "CRUDE", "US500", "NAS100"
];

export default function MLDashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSD");
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mlAnalytics, isLoading, error, refetch } = useQuery({
    queryKey: ["mlAnalytics"],
    queryFn: () => backend.ml.getMLAnalytics(),
    retry: 1,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const { data: recommendations } = useQuery({
    queryKey: ["mlRecommendations"],
    queryFn: () => backend.ml.getRecommendations(),
    retry: 1,
  });

  const trainModelMutation = useMutation({
    mutationFn: () => backend.ml.trainModel({}),
    onSuccess: (data) => {
      toast({ 
        title: "🎯 Training Completato", 
        description: `Modello addestrato con accuratezza ${(data.metrics.accuracy * 100).toFixed(1)}%` 
      });
      queryClient.invalidateQueries({ queryKey: ["mlAnalytics"] });
    },
    onError: (err: any) => {
      toast({ 
        variant: "destructive", 
        title: "❌ Errore Training", 
        description: err.message 
      });
    },
  });

  const detectPatternsMutation = useMutation({
    mutationFn: (symbol: string) => backend.ml.detectPatterns({ symbol }),
    onSuccess: (data, symbol) => {
      toast({ 
        title: "🔍 Pattern Rilevati", 
        description: `${data.patternsDetected} pattern trovati per ${symbol}` 
      });
      queryClient.invalidateQueries({ queryKey: ["mlAnalytics"] });
    },
    onError: (err: any) => {
      toast({ 
        variant: "destructive", 
        title: "❌ Errore Rilevamento", 
        description: err.message 
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Caricamento analytics ML...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-red-500 text-lg mb-4">Errore nel caricamento: {error.message}</p>
          <Button onClick={() => refetch()}>Riprova</Button>
        </div>
      </div>
    );
  }

  if (!mlAnalytics) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nessun dato ML disponibile</p>
        </div>
      </div>
    );
  }

  const mlMetrics = [
    { 
      title: "Accuratezza Modello", 
      value: `${(mlAnalytics.modelPerformance.accuracy * 100).toFixed(1)}%`, 
      icon: Brain, 
      description: "Precisione delle predizioni ML",
      progress: mlAnalytics.modelPerformance.accuracy * 100,
      color: mlAnalytics.modelPerformance.accuracy > 0.8 ? "green" : mlAnalytics.modelPerformance.accuracy > 0.7 ? "yellow" : "red" as const,
      trend: "up" as const
    },
    { 
      title: "Precision", 
      value: `${(mlAnalytics.modelPerformance.precision * 100).toFixed(1)}%`, 
      icon: Target, 
      description: "Precisione delle predizioni positive",
      progress: mlAnalytics.modelPerformance.precision * 100,
      color: "default" as const
    },
    { 
      title: "F1 Score", 
      value: `${(mlAnalytics.modelPerformance.f1Score * 100).toFixed(1)}%`, 
      icon: Activity, 
      description: "Bilanciamento precision/recall",
      progress: mlAnalytics.modelPerformance.f1Score * 100,
      color: "default" as const
    },
    { 
      title: "Sharpe Ratio", 
      value: mlAnalytics.modelPerformance.sharpeRatio.toFixed(2), 
      icon: TrendingUp, 
      description: "Rapporto rischio/rendimento",
      badge: mlAnalytics.modelPerformance.sharpeRatio > 1.5 ? "Eccellente" : mlAnalytics.modelPerformance.sharpeRatio > 1 ? "Buono" : "Migliorabile",
      color: mlAnalytics.modelPerformance.sharpeRatio > 1.5 ? "green" : "default" as const
    },
    { 
      title: "Predizioni Totali", 
      value: mlAnalytics.predictionStats.totalPredictions.toString(), 
      icon: Zap, 
      description: "Numero di predizioni generate",
      color: "default" as const
    },
    { 
      title: "Win Rate ML", 
      value: `${(mlAnalytics.predictionStats.winRate * 100).toFixed(1)}%`, 
      icon: BarChart, 
      description: "Percentuale di predizioni vincenti",
      progress: mlAnalytics.predictionStats.winRate * 100,
      color: mlAnalytics.predictionStats.winRate > 0.7 ? "green" : "default" as const
    },
  ];

  // Prepare chart data
  const performanceChartData = mlAnalytics.performanceTimeline.map(pt => ({
    date: new Date(pt.date).toLocaleDateString(),
    accuracy: parseFloat((pt.accuracy * 100).toFixed(1)),
    profitLoss: pt.profitLoss,
    predictions: pt.predictions
  }));

  const featureImportanceData = mlAnalytics.featureImportance.slice(0, 8).map(f => ({
    feature: f.feature.length > 10 ? f.feature.substring(0, 10) + '...' : f.feature,
    importance: parseFloat((f.importance * 100).toFixed(1)),
    type: f.type
  }));

  const learningProgressData = mlAnalytics.learningProgress.slice(-15).map(lp => ({
    epoch: lp.epoch,
    trainingLoss: parseFloat(lp.trainingLoss.toFixed(3)),
    validationLoss: parseFloat(lp.validationLoss.toFixed(3)),
    accuracy: parseFloat((lp.accuracy * 100).toFixed(1))
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">🤖 Machine Learning Dashboard</h1>
          <p className="text-muted-foreground">Analisi avanzata e monitoraggio delle performance ML</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
          <Button 
            onClick={() => trainModelMutation.mutate()}
            disabled={trainModelMutation.isPending}
            size="sm"
          >
            <Play className="h-4 w-4 mr-2" />
            {trainModelMutation.isPending ? "Training..." : "Addestra Modello"}
          </Button>
        </div>
      </div>

      {/* Pattern Detection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Rilevamento Pattern
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Seleziona Asset" />
            </SelectTrigger>
            <SelectContent>
              {availableSymbols.map(symbol => (
                <SelectItem key={symbol} value={symbol}>
                  {symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={() => detectPatternsMutation.mutate(selectedSymbol)}
            disabled={detectPatternsMutation.isPending}
            className="min-w-[140px]"
          >
            {detectPatternsMutation.isPending ? "Rilevando..." : "🔍 Rileva Pattern"}
          </Button>
        </CardContent>
      </Card>

      {/* ML Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mlMetrics.map(metric => (
          <MLMetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Andamento Performance ML
              <Badge variant="secondary">{performanceChartData.length} giorni</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MLChart
              data={performanceChartData}
              type="line"
              dataKey="accuracy"
              xAxisKey="date"
              color="#8884d8"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Feature Importance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Importanza Features
              <Badge variant="secondary">Top {featureImportanceData.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MLChart
              data={featureImportanceData}
              type="bar"
              dataKey="importance"
              xAxisKey="feature"
              color="#82ca9d"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Learning Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📚 Progresso Apprendimento
              <Badge variant="secondary">{learningProgressData.length} epoche</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MLChart
              data={learningProgressData}
              type="line"
              dataKey="accuracy"
              xAxisKey="epoch"
              color="#ff7300"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Market Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔍 Pattern di Mercato Rilevati
              <Badge variant="secondary">{mlAnalytics.marketPatterns.length} pattern</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {mlAnalytics.marketPatterns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nessun pattern rilevato di recente</p>
                  <p className="text-sm mt-2">Seleziona un asset e clicca "Rileva Pattern" per iniziare</p>
                </div>
              ) : (
                mlAnalytics.marketPatterns.map((pattern, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{pattern.pattern}</div>
                      <div className="text-xs text-muted-foreground">
                        {pattern.type} • {(pattern.successRate * 100).toFixed(1)}% successo • {new Date(pattern.detectedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={pattern.confidence > 0.8 ? "default" : pattern.confidence > 0.6 ? "secondary" : "outline"}>
                        {(pattern.confidence * 100).toFixed(0)}%
                      </Badge>
                      <div className="text-xs text-green-600 mt-1">
                        +${pattern.avgProfit.toFixed(0)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adaptive Parameters & Recommendations */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Adaptive Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚙️ Parametri Adattivi
              <Badge variant="secondary">{mlAnalytics.adaptiveParameters.length} parametri</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mlAnalytics.adaptiveParameters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nessun parametro adattivo configurato</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mlAnalytics.adaptiveParameters.map((param, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{param.parameter}</div>
                      <div className="text-xs text-muted-foreground">{param.adaptationReason}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono">{param.currentValue.toFixed(4)}</div>
                      <div className={`text-xs ${param.performanceImprovement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {param.performanceImprovement > 0 ? '+' : ''}{(param.performanceImprovement * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ML Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Raccomandazioni ML
              <Badge variant="secondary">{recommendations?.recommendations.length || 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!recommendations || recommendations.recommendations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nessuna raccomandazione disponibile</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.recommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">{rec}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Statistiche Dettagliate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h4 className="font-semibold mb-3">Performance Modello</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Accuratezza:</span>
                  <span className="font-semibold">{(mlAnalytics.modelPerformance.accuracy * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Precision:</span>
                  <span className="font-semibold">{(mlAnalytics.modelPerformance.precision * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Recall:</span>
                  <span className="font-semibold">{(mlAnalytics.modelPerformance.recall * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Drawdown:</span>
                  <span className="font-semibold text-red-600">{(mlAnalytics.modelPerformance.maxDrawdown * 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Statistiche Predizioni</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Totali:</span>
                  <span className="font-semibold">{mlAnalytics.predictionStats.totalPredictions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Corrette:</span>
                  <span className="font-semibold text-green-600">{mlAnalytics.predictionStats.correctPredictions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Confidenza Media:</span>
                  <span className="font-semibold">{(mlAnalytics.predictionStats.avgConfidence * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Profit Factor:</span>
                  <span className="font-semibold">{mlAnalytics.predictionStats.profitFactor.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Analisi Features</h4>
              <div className="space-y-2 text-sm">
                {mlAnalytics.featureImportance.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{feature.feature}:</span>
                    <span className="font-semibold">{(feature.importance * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
