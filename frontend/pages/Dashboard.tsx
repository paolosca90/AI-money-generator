import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import StatCard from "../components/cards/StatCard";
import AssetCard from "../components/cards/AssetCard";
import NewsCard from "../components/cards/NewsCard";
import { DollarSign, Percent, TrendingUp, TrendingDown, Zap, BarChart, Brain, Target, Activity, Lightbulb, Globe, Clock, AlertCircle, Award, Shield } from "lucide-react";
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
    refetchInterval: 30000, // Refresh every 30 seconds
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
    refetchInterval: 15000, // Refresh every 15 seconds
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

  const handleAssetClick = (symbol: string) => {
    navigate('/trade', { state: { selectedSymbol: symbol } });
  };

  const handleQuickTrade = () => {
    navigate('/trade');
  };

  // Enhanced stats with better formatting and additional metrics
  const stats = [
    { 
      title: "Profitto Totale", 
      value: `$${performanceData?.totalProfitLoss?.toFixed(2) || "0.00"}`, 
      icon: DollarSign, 
      description: "Profitto/perdita totale degli ultimi 30 giorni",
      color: (performanceData?.totalProfitLoss || 0) >= 0 ? "text-green-600" : "text-red-600"
    },
    { 
      title: "Win Rate", 
      value: `${performanceData?.winRate?.toFixed(1) || 0}%`, 
      icon: Percent, 
      description: "Percentuale di trade in profitto",
      color: (performanceData?.winRate || 0) >= 70 ? "text-green-600" : "text-yellow-600"
    },
    { 
      title: "Profit Factor", 
      value: performanceData?.profitFactor?.toFixed(2) || "0", 
      icon: BarChart, 
      description: "Rapporto profitto lordo / perdita lorda",
      color: (performanceData?.profitFactor || 0) >= 1.5 ? "text-green-600" : "text-yellow-600"
    },
    { 
      title: "Miglior Trade", 
      value: `$${performanceData?.bestTrade?.toFixed(2) || 0}`, 
      icon: TrendingUp, 
      description: "Il trade più profittevole"
    },
    { 
      title: "Streak Corrente", 
      value: `${Math.abs(performanceData?.currentStreak || 0)}${(performanceData?.currentStreak || 0) >= 0 ? ' W' : ' L'}`, 
      icon: Award, 
      description: "Serie di vittorie/sconfitte consecutive",
      color: (performanceData?.currentStreak || 0) >= 0 ? "text-green-600" : "text-red-600"
    },
    { 
      title: "Sharpe Ratio", 
      value: performanceData?.sharpeRatio?.toFixed(2) || "0", 
      icon: Shield, 
      description: "Rendimento corretto per il rischio",
      color: (performanceData?.sharpeRatio || 0) >= 1.5 ? "text-green-600" : "text-yellow-600"
    },
  ];

  const mlStats = [
    { 
      title: "ML Accuracy", 
      value: `${(mlAnalytics?.modelPerformance.accuracy * 100)?.toFixed(1) || 0}%`, 
      icon: Brain, 
      description: "Accuratezza del modello ML",
      color: (mlAnalytics?.modelPerformance.accuracy || 0) >= 0.8 ? "text-green-600" : "text-yellow-600"
    },
    { 
      title: "Precision", 
      value: `${(mlAnalytics?.modelPerformance.precision * 100)?.toFixed(1) || 0}%`, 
      icon: Target, 
      description: "Precisione delle predizioni"
    },
    { 
      title: "F1 Score", 
      value: `${(mlAnalytics?.modelPerformance.f1Score * 100)?.toFixed(1) || 0}%`, 
      icon: Activity, 
      description: "Bilanciamento precision/recall"
    },
    { 
      title: "Predizioni", 
      value: mlAnalytics?.predictionStats.totalPredictions?.toString() || "0", 
      icon: Zap, 
      description: "Numero totale di predizioni generate"
    },
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
      case "OVERLAP": return "text-green-600 bg-green-50 border-green-200";
      case "EUROPEAN":
      case "US": return "text-blue-600 bg-blue-50 border-blue-200";
      case "ASIAN": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "DEAD": return "text-gray-600 bg-gray-50 border-gray-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">🚀 AI Trading Dashboard</h1>
          <p className="text-muted-foreground">Sistema di trading automatizzato con intelligenza artificiale avanzata</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleQuickTrade}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            ⚡ Genera Segnale
          </Button>
          <Button 
            onClick={() => trainModelMutation.mutate()}
            disabled={trainModelMutation.isPending}
            variant="outline"
            size="sm"
          >
            {trainModelMutation.isPending ? "Training..." : "🤖 Addestra AI"}
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

      {/* Performance Overview with Enhanced Styling */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold">📊 Performance Trading</h2>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Ultimi 30 giorni
          </Badge>
          {performanceData?.totalTrades && (
            <Badge variant="outline">
              {performanceData.totalTrades} trade
            </Badge>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoadingPerformance ? (
            <div className="col-span-full flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
              <span>Caricamento performance...</span>
            </div>
          ) : performanceError ? (
            <div className="col-span-full">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-700">Errore nel caricamento delle performance</p>
                  <p className="text-sm text-red-600 mt-1">{performanceError.message}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["performance"] })}
                  >
                    Riprova
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            stats.map(stat => (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stat.color || ''}`}>{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Market Overview Section */}
      {marketOverview && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">🌍 Panoramica Mercati</h2>
          
          {/* Session Info and Market Sentiment */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Sessione Corrente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-bold px-3 py-2 rounded-lg border ${getSessionColor(marketOverview.sessionInfo.currentSession)}`}>
                  {marketOverview.sessionInfo.currentSession}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Prossima: {marketOverview.sessionInfo.nextSession} in {marketOverview.sessionInfo.timeToNext}
                </p>
                <p className="text-xs text-muted-foreground">
                  Volatilità attesa: <span className="font-semibold">{marketOverview.sessionInfo.volatilityExpected}</span>
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
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
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  <div>Forex: <span className={getSentimentColor(marketOverview.marketSentiment.forex)}>{marketOverview.marketSentiment.forex}</span></div>
                  <div>Crypto: <span className={getSentimentColor(marketOverview.marketSentiment.crypto)}>{marketOverview.marketSentiment.crypto}</span></div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
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
                <p className="text-xs text-muted-foreground mt-2">
                  Sentiment indici azionari
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
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
                <p className="text-xs text-muted-foreground mt-2">
                  Sentiment commodities
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Assets */}
          <div>
            <h3 className="text-lg font-semibold mb-3">🏆 Asset Più Affidabili</h3>
            {isLoadingMarket ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Caricamento asset...</p>
              </div>
            ) : marketError ? (
              <div className="text-red-500 text-center py-4">
                <p>Errore nel caricamento: {marketError.message}</p>
              </div>
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
            <h3 className="text-lg font-semibold mb-3">📰 Notizie di Mercato</h3>
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

      {/* ML Performance Stats */}
      <div>
        <h2 className="text-xl font-semibold mb-3">🤖 Performance Machine Learning</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoadingML ? (
            <div className="col-span-full text-center py-4">Caricamento analytics ML...</div>
          ) : mlError ? (
            <div className="col-span-full text-red-500">
              Errore nel caricamento ML: {mlError.message}
            </div>
          ) : (
            mlStats.map(stat => (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stat.color || ''}`}>{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* ML Analytics Charts */}
      {mlAnalytics && performanceChartData.length > 0 && (
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
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="accuracy" stroke="#8884d8" name="Accuratezza %" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
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

      {/* Trading Activity Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Posizioni Aperte</span>
              <Badge variant="outline">
                {positionsData?.positions?.length || 0} posizioni
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {positionsError ? (
              <div className="text-red-500 text-center py-4">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Errore: {positionsError.message}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["positions"] })}
                >
                  Riprova
                </Button>
              </div>
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
            <CardTitle className="flex items-center justify-between">
              <span>Storico Trade Recenti</span>
              <Badge variant="outline">
                {historyData?.signals?.length || 0} trade
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyError ? (
              <div className="text-red-500 text-center py-4">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Errore: {historyError.message}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["history"] })}
                >
                  Riprova
                </Button>
              </div>
            ) : (
              <HistoryTable
                signals={historyData?.signals?.slice(0, 5) || []}
                isLoading={isLoadingHistory}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Guide for New Users */}
      {(!performanceData || performanceData.totalTrades === 0) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              🚀 Inizia Subito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">1️⃣</span>
                </div>
                <h4 className="font-semibold text-blue-800">Genera Segnale</h4>
                <p className="text-sm text-blue-600">Vai su Trading e genera il tuo primo segnale AI</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">2️⃣</span>
                </div>
                <h4 className="font-semibold text-blue-800">Esegui Trade</h4>
                <p className="text-sm text-blue-600">Esegui il trade con un click se la confidenza è alta</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">3️⃣</span>
                </div>
                <h4 className="font-semibold text-blue-800">Monitora</h4>
                <p className="text-sm text-blue-600">Segui le performance e ottimizza l'AI</p>
              </div>
            </div>
            <div className="text-center mt-4">
              <Button onClick={handleQuickTrade} className="bg-blue-600 hover:bg-blue-700">
                🚀 Inizia Ora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
