import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import StatCard from "../components/cards/StatCard";
import AssetCard from "../components/cards/AssetCard";
import NewsCard from "../components/cards/NewsCard";
import { DollarSign, Percent, TrendingUp, TrendingDown, Zap, BarChart, Brain, Target, Activity, Lightbulb, Globe, Clock, AlertCircle } from "lucide-react";
import PositionsTable from "../components/tables/PositionsTable";
import HistoryTable from "../components/tables/HistoryTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: performanceData, isLoading: isLoadingPerformance, error: performanceError } = useQuery({
    queryKey: ["performance"],
    queryFn: () => backend.analysis.getPerformance(),
    retry: 1,
  });

  const { data: marketOverview, isLoading: isLoadingMarket, error: marketError } = useQuery({
    queryKey: ["marketOverview"],
    queryFn: () => backend.analysis.getMarketOverview(),
    retry: 1,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const { data: mlAnalytics, isLoading: isLoadingML, error: mlError } = useQuery({
    queryKey: ["mlAnalytics"],
    queryFn: () => backend.ml.getMLAnalytics(),
    retry: 1,
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: positionsData, isLoading: isLoadingPositions, error: positionsError } = useQuery({
    queryKey: ["positions"],
    queryFn: () => backend.analysis.listPositions(),
    retry: 1,
  });

  const { data: historyData, isLoading: isLoadingHistory, error: historyError } = useQuery({
    queryKey: ["history"],
    queryFn: () => backend.analysis.listHistory(),
    retry: 1,
  });

  const trainModelMutation = useMutation({
    mutationFn: () => backend.ml.trainModel({}),
    onSuccess: (data) => {
      toast({ 
        title: "Training Completato", 
        description: `Modello addestrato con accuratezza ${(data.metrics.accuracy * 100).toFixed(1)}%` 
      });
      queryClient.invalidateQueries({ queryKey: ["mlAnalytics"] });
    },
    onError: (err: any) => {
      toast({ 
        variant: "destructive", 
        title: "Errore Training", 
        description: err.message 
      });
    },
  });

  const detectPatternsMutation = useMutation({
    mutationFn: (symbol: string) => backend.ml.detectPatterns({ symbol }),
    onSuccess: (data, symbol) => {
      toast({ 
        title: "Pattern Rilevati", 
        description: `${data.patternsDetected} pattern trovati per ${symbol}` 
      });
      queryClient.invalidateQueries({ queryKey: ["mlAnalytics"] });
    },
    onError: (err: any) => {
      toast({ 
        variant: "destructive", 
        title: "Errore Rilevamento", 
        description: err.message 
      });
    },
  });

  const handleAssetClick = (symbol: string) => {
    navigate('/trade', { state: { selectedSymbol: symbol } });
  };

  const stats = [
    { title: "Win Rate", value: `${performanceData?.winRate?.toFixed(1) || 0}%`, icon: Percent, description: "Percentuale di trade in profitto" },
    { title: "Profit Factor", value: performanceData?.profitFactor?.toFixed(2) || "0", icon: BarChart, description: "Profitto lordo / Perdita lorda" },
    { title: "Avg. Profit", value: `$${performanceData?.avgProfit?.toFixed(2) || 0}`, icon: TrendingUp, description: "Profitto medio per trade" },
    { title: "Avg. Loss", value: `$${Math.abs(performanceData?.avgLoss || 0).toFixed(2)}`, icon: TrendingDown, description: "Perdita media per trade" },
    { title: "Total Trades", value: performanceData?.totalTrades?.toString() || "0", icon: Zap, description: "Numero totale di trade chiusi" },
    { title: "Avg. Confidence", value: `${performanceData?.avgConfidence?.toFixed(1) || 0}%`, icon: Zap, description: "Confidenza media dei segnali" },
  ];

  const mlStats = [
    { title: "ML Accuracy", value: `${(mlAnalytics?.modelPerformance.accuracy * 100)?.toFixed(1) || 0}%`, icon: Brain, description: "Accuratezza del modello ML" },
    { title: "Precision", value: `${(mlAnalytics?.modelPerformance.precision * 100)?.toFixed(1) || 0}%`, icon: Target, description: "Precisione delle predizioni" },
    { title: "F1 Score", value: `${(mlAnalytics?.modelPerformance.f1Score * 100)?.toFixed(1) || 0}%`, icon: Activity, description: "Bilanciamento precision/recall" },
    { title: "Sharpe Ratio", value: mlAnalytics?.modelPerformance.sharpeRatio?.toFixed(2) || "0", icon: TrendingUp, description: "Rapporto rischio/rendimento" },
  ];

  // Prepare chart data
  const performanceChartData = mlAnalytics?.performanceTimeline.map(pt => ({
    date: new Date(pt.date).toLocaleDateString(),
    accuracy: (pt.accuracy * 100).toFixed(1),
    profitLoss: pt.profitLoss.toFixed(0),
    predictions: pt.predictions
  })) || [];

  const featureImportanceData = mlAnalytics?.featureImportance.slice(0, 8).map(f => ({
    feature: f.feature,
    importance: (f.importance * 100).toFixed(1),
    type: f.type
  })) || [];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "BULLISH": return "text-green-600";
      case "BEARISH": return "text-red-600";
      case "NEUTRAL": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "BULLISH": return "📈";
      case "BEARISH": return "📉";
      case "NEUTRAL": return "➡️";
      default: return "➡️";
    }
  };

  const getSessionColor = (session: string) => {
    switch (session) {
      case "OVERLAP": return "text-green-600 bg-green-50";
      case "EUROPEAN":
      case "US": return "text-blue-600 bg-blue-50";
      case "ASIAN": return "text-yellow-600 bg-yellow-50";
      case "DEAD": return "text-gray-600 bg-gray-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard AI & Machine Learning</h1>
          <p className="text-muted-foreground">Panoramica delle performance di trading e analisi ML avanzata.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => trainModelMutation.mutate()}
            disabled={trainModelMutation.isPending}
            variant="outline"
            size="sm"
          >
            {trainModelMutation.isPending ? "Training..." : "🤖 Addestra Modello"}
          </Button>
          <Button 
            onClick={() => detectPatternsMutation.mutate("BTCUSD")}
            disabled={detectPatternsMutation.isPending}
            variant="outline"
            size="sm"
          >
            {detectPatternsMutation.isPending ? "Rilevando..." : "🔍 Rileva Pattern"}
          </Button>
        </div>
      </div>

      {/* Market Overview Section */}
      {marketOverview && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">🌍 Panoramica Mercati</h2>
          
          {/* Session Info and Market Sentiment */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Sessione Corrente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-bold px-2 py-1 rounded ${getSessionColor(marketOverview.sessionInfo.currentSession)}`}>
                  {marketOverview.sessionInfo.currentSession}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Prossima: {marketOverview.sessionInfo.nextSession} in {marketOverview.sessionInfo.timeToNext}
                </p>
                <p className="text-xs text-muted-foreground">
                  Volatilità attesa: {marketOverview.sessionInfo.volatilityExpected}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Sentiment Generale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-bold ${getSentimentColor(marketOverview.marketSentiment.overall)}`}>
                  {getSentimentIcon(marketOverview.marketSentiment.overall)} {marketOverview.marketSentiment.overall}
                </div>
                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                  <div>Forex: <span className={getSentimentColor(marketOverview.marketSentiment.forex)}>{marketOverview.marketSentiment.forex}</span></div>
                  <div>Crypto: <span className={getSentimentColor(marketOverview.marketSentiment.crypto)}>{marketOverview.marketSentiment.crypto}</span></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  Indici
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-bold ${getSentimentColor(marketOverview.marketSentiment.indices)}`}>
                  {getSentimentIcon(marketOverview.marketSentiment.indices)} {marketOverview.marketSentiment.indices}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sentiment indici azionari
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Materie Prime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-bold ${getSentimentColor(marketOverview.marketSentiment.commodities)}`}>
                  {getSentimentIcon(marketOverview.marketSentiment.commodities)} {marketOverview.marketSentiment.commodities}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sentiment commodities
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Assets */}
          <div>
            <h3 className="text-md font-semibold mb-3">🏆 Asset Più Affidabili</h3>
            {isLoadingMarket ? (
              <div className="text-center py-4">Caricamento asset...</div>
            ) : marketError ? (
              <div className="text-red-500">Errore nel caricamento: {marketError.message}</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {marketOverview.topAssets.slice(0, 8).map((asset, index) => (
                  <AssetCard 
                    key={asset.symbol} 
                    asset={asset} 
                    onClick={handleAssetClick}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Market News */}
          <div>
            <h3 className="text-md font-semibold mb-3">📰 Notizie di Mercato</h3>
            {isLoadingMarket ? (
              <div className="text-center py-4">Caricamento notizie...</div>
            ) : marketError ? (
              <div className="text-red-500">Errore nel caricamento: {marketError.message}</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {marketOverview.marketNews.map((news, index) => (
                  <NewsCard key={news.id} news={news} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trading Performance Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3">📊 Performance Trading</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoadingPerformance ? (
            <div className="col-span-full">Caricamento statistiche...</div>
          ) : performanceError ? (
            <div className="col-span-full text-red-500">
              Errore nel caricamento delle statistiche: {performanceError.message}
            </div>
          ) : (
            stats.map(stat => <StatCard key={stat.title} {...stat} />)
          )}
        </div>
      </div>

      {/* ML Performance Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3">🤖 Performance Machine Learning</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoadingML ? (
            <div className="col-span-full">Caricamento analytics ML...</div>
          ) : mlError ? (
            <div className="col-span-full text-red-500">
              Errore nel caricamento ML: {mlError.message}
            </div>
          ) : (
            mlStats.map(stat => <StatCard key={stat.title} {...stat} />)
          )}
        </div>
      </div>

      {/* ML Analytics Charts */}
      {mlAnalytics && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Performance Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>📈 Andamento Performance ML</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="accuracy" stroke="#8884d8" name="Accuratezza %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Feature Importance */}
          <Card>
            <CardHeader>
              <CardTitle>🎯 Importanza Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={featureImportanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feature" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="importance" fill="#8884d8" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ML Recommendations */}
      {mlAnalytics?.adaptiveParameters && mlAnalytics.adaptiveParameters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Raccomandazioni ML & Parametri Adattivi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Parametri Adattivi</h4>
                <div className="space-y-2">
                  {mlAnalytics.adaptiveParameters.map((param, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{param.parameter}</span>
                      <div className="text-right">
                        <div className="text-sm font-mono">{param.currentValue.toFixed(4)}</div>
                        <div className={`text-xs ${param.performanceImprovement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {param.performanceImprovement > 0 ? '+' : ''}{(param.performanceImprovement * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Statistiche Predizioni</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Predizioni Totali:</span>
                    <span className="font-semibold">{mlAnalytics.predictionStats.totalPredictions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Predizioni Corrette:</span>
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Traditional Dashboard Content */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Posizioni Aperte</CardTitle>
          </CardHeader>
          <CardContent>
            {positionsError ? (
              <div className="text-red-500">Errore: {positionsError.message}</div>
            ) : (
              <PositionsTable
                positions={positionsData?.positions || []}
                isLoading={isLoadingPositions}
                onClose={() => { /* Implement close logic */ }}
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Storico Trade Recenti</CardTitle>
          </CardHeader>
          <CardContent>
            {historyError ? (
              <div className="text-red-500">Errore: {historyError.message}</div>
            ) : (
              <HistoryTable
                signals={historyData?.signals?.slice(0, 5) || []}
                isLoading={isLoadingHistory}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
