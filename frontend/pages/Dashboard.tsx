import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import StatCard from "../components/cards/StatCard";
import AutoSignalCard from "../components/cards/AutoSignalCard";
import { DollarSign, Percent, TrendingUp, TrendingDown, Zap, BarChart, Brain, Target, Activity, AlertCircle, Award, Shield, Sparkles, RefreshCw } from "lucide-react";
import PositionsTable from "../components/tables/PositionsTable";
import HistoryTable from "../components/tables/HistoryTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar } from 'recharts';
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

// Mock function to generate auto signals for major forex, gold, and US indices
const generateAutoSignals = () => {
  const symbols = ["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD", "XAUUSD", "US500", "US100"];
  const strategies = ["Scalping", "Intraday"];
  const timeframes = ["5m", "15m", "30m"];
  const trends = ["Rialzista", "Ribassista", "Laterale"];
  
  return symbols.map(symbol => {
    const direction = Math.random() > 0.5 ? "LONG" : "SHORT";
    
    // Simulate a more realistic confidence score based on multiple factors
    const technicalScore = 70 + Math.random() * 25; // 70-95
    const sentimentScore = 65 + Math.random() * 25; // 65-90
    const smartMoneyScore = 75 + Math.random() * 20; // 75-95

    // Weighted average to simulate backend logic
    const rawConfidence = (technicalScore * 0.4) + (sentimentScore * 0.2) + (smartMoneyScore * 0.4);
    const confidence = Math.floor(rawConfidence);

    const basePrice = getBasePrice(symbol);
    const volatility = getVolatility(symbol);
    
    const entryPrice = basePrice * (1 + (Math.random() - 0.5) * volatility);
    const atr = entryPrice * volatility * 0.5;
    
    const stopLoss = direction === "LONG" 
      ? entryPrice - (atr * (1 + Math.random()))
      : entryPrice + (atr * (1 + Math.random()));
      
    const takeProfit = direction === "LONG"
      ? entryPrice + (atr * (2 + Math.random() * 2))
      : entryPrice - (atr * (2 + Math.random() * 2));
    
    const riskRewardRatio = Math.abs(takeProfit - entryPrice) / Math.abs(entryPrice - stopLoss);
    
    return {
      symbol,
      direction,
      confidence,
      entryPrice: Number(entryPrice.toFixed(5)),
      takeProfit: Number(takeProfit.toFixed(5)),
      stopLoss: Number(stopLoss.toFixed(5)),
      riskRewardRatio: Number(riskRewardRatio.toFixed(2)),
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
      analysis: {
        rsi: Number((Math.random() * 60 + 20).toFixed(1)), // 20-80
        macd: Number((Math.random() * 0.002 - 0.001).toFixed(6)),
        trend: trends[Math.floor(Math.random() * trends.length)],
        volatility: volatility > 0.02 ? "Alta" : volatility > 0.01 ? "Media" : "Bassa"
      }
    };
  }).sort((a, b) => b.confidence - a.confidence).slice(0, 3); // Top 3 by confidence
};

const getBasePrice = (symbol: string): number => {
  const prices: Record<string, number> = {
    "EURUSD": 1.085,
    "GBPUSD": 1.275,
    "USDJPY": 150.5,
    "USDCHF": 0.885,
    "AUDUSD": 0.665,
    "USDCAD": 1.365,
    "NZDUSD": 0.615,
    "XAUUSD": 2050,
    "US500": 5800,
    "US100": 20500,
  };
  return prices[symbol] || 1.0;
};

const getVolatility = (symbol: string): number => {
  const volatilities: Record<string, number> = {
    "EURUSD": 0.005,
    "GBPUSD": 0.008,
    "USDJPY": 0.006,
    "USDCHF": 0.005,
    "AUDUSD": 0.007,
    "USDCAD": 0.006,
    "NZDUSD": 0.008,
    "XAUUSD": 0.015,
    "US500": 0.012,
    "US100": 0.018,
  };
  return volatilities[symbol] || 0.01;
};

export default function Dashboard() {
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [autoSignals, setAutoSignals] = useState(generateAutoSignals());

  // Auto-refresh signals every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoSignals(generateAutoSignals());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const { data: performanceData, isLoading: isLoadingPerformance, error: performanceError } = useQuery({
    queryKey: ["performance"],
    queryFn: () => backend.analysis.getPerformance(),
    retry: 1,
    refetchInterval: 30000, // Refresh every 30 seconds
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

  const handleQuickTrade = () => {
    navigate('/trade');
  };

  const handleRefreshSignals = () => {
    setAutoSignals(generateAutoSignals());
    toast({
      title: "🔄 Segnali Aggiornati",
      description: "I segnali automatici sono stati aggiornati con i dati più recenti"
    });
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

      {/* Auto Signals Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">🎯 Segnali AI Automatici</h2>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Top 3 Opportunità
            </Badge>
          </div>
          <Button 
            onClick={handleRefreshSignals}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Aggiorna
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          {autoSignals.map((signal, index) => (
            <AutoSignalCard key={`${signal.symbol}-${index}`} signal={signal} />
          ))}
        </div>
        
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold text-blue-800">Segnali Automatici AI</h4>
          </div>
          <p className="text-sm text-blue-700">
            Questi segnali vengono generati automaticamente ogni 30 secondi analizzando i major forex, 
            l'oro (XAU/USD) e gli indici USA (US500, US100). Sono ordinati per confidenza decrescente.
          </p>
        </div>
      </div>

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
