import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { TrendingUp, TrendingDown, Target, Shield, Zap, Clock, BarChart3, AlertTriangle } from "lucide-react";
import backend from "~backend/client";
import type { TradingSignal } from "~backend/analysis/predict";

type TradingStrategy = "SCALPING" | "INTRADAY" | "SWING";

export default function TradingSignals() {
  const [symbol, setSymbol] = useState("BTCUSD");
  const [strategy, setStrategy] = useState<TradingStrategy>("INTRADAY");
  const [lotSize, setLotSize] = useState("0.1");
  const [riskPercentage, setRiskPercentage] = useState("2");
  const [accountBalance, setAccountBalance] = useState("10000");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const predictMutation = useMutation({
    mutationFn: async (params: { symbol: string; strategy?: TradingStrategy; riskPercentage?: number; accountBalance?: number }) => {
      try {
        return await backend.analysis.predict(params);
      } catch (error: any) {
        // Enhanced error handling
        console.error("Prediction API error:", error);
        
        if (error.message?.includes("fetch")) {
          throw new Error("Impossibile connettersi al server. Verifica la tua connessione internet.");
        } else if (error.message?.includes("404")) {
          throw new Error("Servizio di analisi non disponibile. Riprova più tardi.");
        } else if (error.message?.includes("500")) {
          throw new Error("Errore interno del server. Controlla la connessione MT5 e riprova.");
        } else if (error.message?.includes("timeout")) {
          throw new Error("Timeout della richiesta. L'analisi sta richiedendo più tempo del previsto.");
        }
        
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Segnale Generato",
        description: `Nuovo segnale ${data.strategy} ${data.direction} per ${data.symbol}`,
      });
      queryClient.setQueryData(["currentSignal"], data);
    },
    onError: (error: Error) => {
      console.error("Errore previsione:", error);
      toast({
        title: "Previsione Fallita",
        description: error.message || "Si è verificato un errore sconosciuto. Controlla la connessione al server.",
        variant: "destructive",
      });
    },
  });

  const executeMutation = useMutation({
    mutationFn: async ({ tradeId, lotSize, strategy }: { tradeId: string; lotSize: number; strategy?: TradingStrategy }) => {
      try {
        return await backend.analysis.execute({ tradeId, lotSize, strategy });
      } catch (error: any) {
        // Enhanced error handling
        console.error("Execution API error:", error);
        
        if (error.message?.includes("fetch")) {
          throw new Error("Impossibile connettersi al server. Verifica la tua connessione internet.");
        } else if (error.message?.includes("not found")) {
          throw new Error("Il segnale di trading non è più disponibile. Potrebbe essere scaduto o già eseguito.");
        } else if (error.message?.includes("already executed")) {
          throw new Error("Questo segnale è già stato eseguito in precedenza.");
        } else if (error.message?.includes("Invalid lot size")) {
          throw new Error("Dimensione lotto non valida. Inserisci un valore tra 0.01 e 100.");
        } else if (error.message?.includes("MT5")) {
          throw new Error("Errore MT5. Verifica che MetaTrader 5 sia connesso e il trading sia abilitato.");
        }
        
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Trade Eseguito",
          description: `Ordine ${data.strategy} #${data.orderId} eseguito con successo`,
        });
        // Clear the current signal after successful execution
        queryClient.setQueryData(["currentSignal"], null);
      } else {
        toast({
          title: "Esecuzione Fallita",
          description: data.error || "Si è verificato un errore sconosciuto.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Errore esecuzione:", error);
      
      // Handle specific error cases
      let errorMessage = error.message || "Impossibile eseguire il trade. Controlla la tua connessione MT5.";
      
      if (error.message?.includes("not found")) {
        // Clear the current signal if it's not found
        queryClient.setQueryData(["currentSignal"], null);
      } else if (error.message?.includes("already executed")) {
        // Clear the current signal if it's already executed
        queryClient.setQueryData(["currentSignal"], null);
      }
      
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const { data: currentSignal } = useQuery<TradingSignal>({
    queryKey: ["currentSignal"],
    enabled: false,
  });

  const handlePredict = async () => {
    if (!symbol.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un simbolo valido",
        variant: "destructive",
      });
      return;
    }

    const risk = parseFloat(riskPercentage);
    const balance = parseFloat(accountBalance);

    if (isNaN(risk) || risk <= 0 || risk > 10) {
      toast({
        title: "Errore",
        description: "La percentuale di rischio deve essere tra 0.1% e 10%",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(balance) || balance <= 0) {
      toast({
        title: "Errore",
        description: "Inserisci un saldo account valido",
        variant: "destructive",
      });
      return;
    }

    // Clear any existing signal before generating a new one
    queryClient.setQueryData(["currentSignal"], null);

    try {
      await predictMutation.mutateAsync({
        symbol: symbol.toUpperCase(),
        strategy,
        riskPercentage: risk,
        accountBalance: balance,
      });
    } catch (error) {
      // Error is already handled in the mutation
    }
  };

  const handleExecute = async () => {
    if (!currentSignal) {
      toast({
        title: "Errore",
        description: "Nessun segnale disponibile per l'esecuzione",
        variant: "destructive",
      });
      return;
    }
    
    const lot = parseFloat(lotSize);
    if (isNaN(lot) || lot <= 0 || lot > 100) {
      toast({
        title: "Errore",
        description: "Inserisci una dimensione lotto valida (0.01 - 100)",
        variant: "destructive",
      });
      return;
    }

    try {
      await executeMutation.mutateAsync({
        tradeId: currentSignal.tradeId,
        lotSize: lot,
        strategy: currentSignal.strategy,
      });
    } catch (error) {
      // Error is already handled in the mutation
    }
  };

  // Funzione helper per formattare numeri in sicurezza
  const safeToFixed = (value: any, decimals: number = 2): string => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return 'N/A';
    }
    return Number(value).toFixed(decimals);
  };

  // Funzione helper per accedere a proprietà annidate in sicurezza
  const safeGet = (obj: any, path: string, defaultValue: any = 'N/A'): any => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const getStrategyIcon = (strategy: TradingStrategy) => {
    switch (strategy) {
      case "SCALPING": return "⚡";
      case "INTRADAY": return "📈";
      case "SWING": return "🎯";
      default: return "📊";
    }
  };

  const getStrategyColor = (strategy: TradingStrategy) => {
    switch (strategy) {
      case "SCALPING": return "bg-yellow-100 text-yellow-800";
      case "INTRADAY": return "bg-blue-100 text-blue-800";
      case "SWING": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "LOW": return "bg-green-100 text-green-800";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800";
      case "HIGH": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStrategyName = (strategy: TradingStrategy) => {
    switch (strategy) {
      case "SCALPING": return "Scalping (1-15 min)";
      case "INTRADAY": return "Intraday (1-8 ore)";
      case "SWING": return "Swing (1-7 giorni)";
      default: return strategy;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Segnali Trading</h1>
        <p className="text-gray-600 mt-1">Genera ed esegui segnali di trading basati su AI con strategie multiple</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Genera Segnale</CardTitle>
          <CardDescription>
            Configura i tuoi parametri di trading e preferenze strategiche
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Simbolo
              </label>
              <Input
                placeholder="es. BTCUSD, EURUSD"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="uppercase"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strategia
              </label>
              <Select value={strategy} onValueChange={(value: TradingStrategy) => setStrategy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCALPING">⚡ Scalping (1-15 min)</SelectItem>
                  <SelectItem value="INTRADAY">📈 Intraday (1-8 ore)</SelectItem>
                  <SelectItem value="SWING">🎯 Swing (1-7 giorni)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rischio %
              </label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                placeholder="2.0"
                value={riskPercentage}
                onChange={(e) => setRiskPercentage(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Saldo Account
              </label>
              <Input
                type="number"
                step="100"
                min="100"
                placeholder="10000"
                value={accountBalance}
                onChange={(e) => setAccountBalance(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handlePredict}
            disabled={predictMutation.isPending}
            className="w-full md:w-auto min-w-[200px]"
          >
            {predictMutation.isPending ? "Analizzando..." : `Genera Segnale ${getStrategyName(strategy)}`}
          </Button>
        </CardContent>
      </Card>

      {currentSignal && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {getStrategyIcon(currentSignal.strategy)} Segnale {currentSignal.strategy} - {currentSignal.symbol}
                  <Badge 
                    variant={currentSignal.direction === "LONG" ? "default" : "destructive"}
                    className="flex items-center gap-1"
                  >
                    {currentSignal.direction === "LONG" ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {currentSignal.direction}
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-4 mt-1">
                  <span>ID Trade: {currentSignal.tradeId}</span>
                  <span>•</span>
                  <span>Confidenza: {currentSignal.confidence}%</span>
                  <span>•</span>
                  <span>Rischio/Rendimento: 1:{currentSignal.riskRewardRatio}</span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStrategyColor(currentSignal.strategy)}>
                  {currentSignal.strategy}
                </Badge>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {currentSignal.confidence}%
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Prezzo Entrata</div>
                <div className="text-2xl font-bold text-blue-900">
                  {safeToFixed(currentSignal.entryPrice, 5)}
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600 font-medium flex items-center justify-center gap-1">
                  <Target className="h-4 w-4" />
                  Take Profit
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {safeToFixed(currentSignal.takeProfit, 5)}
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-red-600 font-medium flex items-center justify-center gap-1">
                  <Shield className="h-4 w-4" />
                  Stop Loss
                </div>
                <div className="text-2xl font-bold text-red-900">
                  {safeToFixed(currentSignal.stopLoss, 5)}
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600 font-medium flex items-center justify-center gap-1">
                  <Clock className="h-4 w-4" />
                  Durata Max
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {currentSignal.maxHoldingTime}h
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Informazioni Strategia
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Strategia</div>
                  <div className="font-medium flex items-center gap-2">
                    <Badge className={getStrategyColor(currentSignal.strategy)}>
                      {getStrategyIcon(currentSignal.strategy)} {safeGet(currentSignal, 'analysis.strategy.name')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Livello Rischio</div>
                  <div className="font-medium">
                    <Badge className={getRiskLevelColor(safeGet(currentSignal, 'analysis.strategy.riskLevel'))}>
                      {safeGet(currentSignal, 'analysis.strategy.riskLevel')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Dimensione Consigliata</div>
                  <div className="font-medium">{safeToFixed(currentSignal.recommendedLotSize, 2)} lotti</div>
                </div>
                <div>
                  <div className="text-gray-600">Timeframe</div>
                  <div className="font-medium">
                    {safeGet(currentSignal, 'analysis.strategy.timeframes', []).join(', ')}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Raccomandazione Strategia</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {currentSignal.strategyRecommendation}
                </pre>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Analisi Tecnica</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">RSI</div>
                  <div className="font-medium">
                    {safeToFixed(safeGet(currentSignal, 'analysis.technical.rsi'), 1)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">MACD</div>
                  <div className="font-medium">
                    {safeToFixed(safeGet(currentSignal, 'analysis.technical.macd'), 5)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">ATR</div>
                  <div className="font-medium">
                    {safeToFixed(safeGet(currentSignal, 'analysis.technical.atr'), 5)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Supporto</div>
                  <div className="font-medium">
                    {safeToFixed(safeGet(currentSignal, 'analysis.technical.support'), 5)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Resistenza</div>
                  <div className="font-medium">
                    {safeToFixed(safeGet(currentSignal, 'analysis.technical.resistance'), 5)}
                  </div>
                </div>
              </div>
            </div>

            {currentSignal.analysis?.smartMoney && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Analisi Smart Money</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Flusso Istituzionale</div>
                    <div className="font-medium">
                      {safeGet(currentSignal, 'analysis.smartMoney.institutionalFlow', 'N/A')}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Profilo Volume</div>
                    <div className="font-medium">
                      {safeGet(currentSignal, 'analysis.smartMoney.volumeProfile', 'N/A')}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Flusso Ordini</div>
                    <div className="font-medium">
                      {safeGet(currentSignal, 'analysis.smartMoney.orderFlow', 'N/A')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced VWAP Analysis */}
            {currentSignal.analysis?.vwap && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">📊 Analisi VWAP</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">VWAP</div>
                    <div className="font-medium">
                      {safeToFixed(safeGet(currentSignal, 'analysis.vwap.analysis.vwap'), 5)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Posizione</div>
                    <div className="font-medium">
                      <Badge variant={safeGet(currentSignal, 'analysis.vwap.analysis.position') === 'ABOVE' ? 'default' : 'secondary'}>
                        {safeGet(currentSignal, 'analysis.vwap.analysis.position')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Trend VWAP</div>
                    <div className="font-medium">
                      <Badge className={safeGet(currentSignal, 'analysis.vwap.analysis.trend') === 'BULLISH' ? 'bg-green-100 text-green-800' : 
                                       safeGet(currentSignal, 'analysis.vwap.analysis.trend') === 'BEARISH' ? 'bg-red-100 text-red-800' : 
                                       'bg-gray-100 text-gray-800'}>
                        {safeGet(currentSignal, 'analysis.vwap.analysis.trend')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Forza Segnale</div>
                    <div className="font-medium">
                      {safeToFixed(safeGet(currentSignal, 'analysis.vwap.analysis.strength'), 0)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orderbook Analysis */}
            {currentSignal.analysis?.orderbook && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">📖 Analisi Orderbook</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Breakout Liquidità</div>
                    <div className="font-medium">
                      <Badge className={safeGet(currentSignal, 'analysis.orderbook.signals.liquidityBreakout') === 'BULLISH' ? 'bg-green-100 text-green-800' : 
                                       safeGet(currentSignal, 'analysis.orderbook.signals.liquidityBreakout') === 'BEARISH' ? 'bg-red-100 text-red-800' : 
                                       'bg-gray-100 text-gray-800'}>
                        {safeGet(currentSignal, 'analysis.orderbook.signals.liquidityBreakout')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Direzione Istituzionale</div>
                    <div className="font-medium">
                      <Badge className={safeGet(currentSignal, 'analysis.orderbook.signals.institutionalDirection') === 'LONG' ? 'bg-green-100 text-green-800' : 
                                       safeGet(currentSignal, 'analysis.orderbook.signals.institutionalDirection') === 'SHORT' ? 'bg-red-100 text-red-800' : 
                                       'bg-gray-100 text-gray-800'}>
                        {safeGet(currentSignal, 'analysis.orderbook.signals.institutionalDirection')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Confidenza Orderbook</div>
                    <div className="font-medium">
                      {safeToFixed(safeGet(currentSignal, 'analysis.orderbook.signals.confidence'), 0)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Options Analysis */}
            {currentSignal.analysis?.options && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">🎯 Analisi Opzioni 0DTE</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Direzione Opzioni</div>
                    <div className="font-medium">
                      <Badge className={safeGet(currentSignal, 'analysis.options.signals.direction') === 'BULLISH' ? 'bg-green-100 text-green-800' : 
                                       safeGet(currentSignal, 'analysis.options.signals.direction') === 'BEARISH' ? 'bg-red-100 text-red-800' : 
                                       'bg-yellow-100 text-yellow-800'}>
                        {safeGet(currentSignal, 'analysis.options.signals.direction')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Rischio Pin</div>
                    <div className="font-medium">
                      {safeToFixed(safeGet(currentSignal, 'analysis.options.zdte.pinRisk'), 0)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Max Gamma</div>
                    <div className="font-medium">
                      {safeToFixed(safeGet(currentSignal, 'analysis.options.gammaLevels.maxGamma'), 5)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Call Wall</div>
                    <div className="font-medium">
                      {safeToFixed(safeGet(currentSignal, 'analysis.options.deltaLevels.callWall'), 5)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Machine Learning Analysis */}
            {currentSignal.analysis?.machineLearning && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">🤖 Analisi Machine Learning</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Previsione ML</div>
                    <div className="font-medium">
                      <Badge className={safeGet(currentSignal, 'analysis.machineLearning.prediction.direction') === 'LONG' ? 'bg-green-100 text-green-800' : 
                                       safeGet(currentSignal, 'analysis.machineLearning.prediction.direction') === 'SHORT' ? 'bg-red-100 text-red-800' : 
                                       'bg-gray-100 text-gray-800'}>
                        {safeGet(currentSignal, 'analysis.machineLearning.prediction.direction')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Confidenza ML</div>
                    <div className="font-medium">
                      {safeToFixed(safeGet(currentSignal, 'analysis.machineLearning.prediction.confidence'), 0)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Consenso Ensemble</div>
                    <div className="font-medium">
                      {safeToFixed(safeGet(currentSignal, 'analysis.machineLearning.ensemble.consensusStrength'), 0)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Accuratezza Modello</div>
                    <div className="font-medium">
                      {safeToFixed(safeGet(currentSignal, 'analysis.machineLearning.modelValidation.accuracy'), 0)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Forecasting Analysis */}
            {currentSignal.analysis?.forecasts && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">🔮 Previsioni e Proiezioni</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-green-600 font-medium">Scenario Rialzista</div>
                      <div className="text-green-800 font-bold text-lg">
                        {safeToFixed(safeGet(currentSignal, 'analysis.forecasts.priceTargets.bullish.target1'), 5)}
                      </div>
                      <div className="text-green-600 text-xs">
                        Probabilità: {safeToFixed(safeGet(currentSignal, 'analysis.forecasts.priceTargets.bullish.probability'), 0)}%
                      </div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-red-600 font-medium">Scenario Ribassista</div>
                      <div className="text-red-800 font-bold text-lg">
                        {safeToFixed(safeGet(currentSignal, 'analysis.forecasts.priceTargets.bearish.target1'), 5)}
                      </div>
                      <div className="text-red-600 text-xs">
                        Probabilità: {safeToFixed(safeGet(currentSignal, 'analysis.forecasts.priceTargets.bearish.probability'), 0)}%
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-blue-600 font-medium">Previsione 1h</div>
                      <div className="text-blue-800 font-bold text-lg">
                        {safeToFixed(safeGet(currentSignal, 'analysis.forecasts.timeHorizons.1h.price'), 5)}
                      </div>
                      <div className="text-blue-600 text-xs">
                        Confidenza: {safeToFixed(safeGet(currentSignal, 'analysis.forecasts.timeHorizons.1h.confidence'), 0)}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-600 text-sm mb-2">Scenario Base Probabile</div>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      <div className="font-medium">
                        {safeGet(currentSignal, 'analysis.forecasts.scenarios.base.description', 'Nessuna descrizione disponibile')}
                      </div>
                      <div className="text-gray-600 mt-1">
                        Target: {safeToFixed(safeGet(currentSignal, 'analysis.forecasts.scenarios.base.priceTarget'), 5)} | 
                        Probabilità: {safeToFixed(safeGet(currentSignal, 'analysis.forecasts.scenarios.base.probability'), 0)}% | 
                        Timeline: {safeGet(currentSignal, 'analysis.forecasts.scenarios.base.timeline', 'N/A')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Esegui Trade</h4>
              
              {/* Warning about signal expiration */}
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Attenzione:</span>
                  <span>I segnali possono essere eseguiti una sola volta. Assicurati di controllare i parametri prima dell'esecuzione.</span>
                </div>
              </div>

              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dimensione Lotto
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    placeholder={currentSignal.recommendedLotSize.toString()}
                    value={lotSize}
                    onChange={(e) => setLotSize(e.target.value)}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Consigliato: {currentSignal.recommendedLotSize} lotti (Range: 0.01 - 100)
                  </div>
                </div>
                <Button 
                  onClick={handleExecute}
                  disabled={executeMutation.isPending}
                  className="min-w-[140px] flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  {executeMutation.isPending ? "Eseguendo..." : `Esegui ${currentSignal.strategy}`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
