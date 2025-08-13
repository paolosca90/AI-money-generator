import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { TrendingUp, TrendingDown, Target, Shield, Zap } from "lucide-react";
import backend from "~backend/client";
import type { TradingSignal } from "~backend/analysis/predict";

export default function TradingSignals() {
  const [symbol, setSymbol] = useState("BTCUSD");
  const [lotSize, setLotSize] = useState("0.1");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const predictMutation = useMutation({
    mutationFn: (symbol: string) => backend.analysis.predict({ symbol }),
    onSuccess: (data) => {
      toast({
        title: "Signal Generated",
        description: `New ${data.direction} signal for ${data.symbol}`,
      });
      queryClient.setQueryData(["currentSignal"], data);
    },
    onError: (error) => {
      console.error("Prediction error:", error);
      toast({
        title: "Error",
        description: "Failed to generate trading signal",
        variant: "destructive",
      });
    },
  });

  const executeMutation = useMutation({
    mutationFn: ({ tradeId, lotSize }: { tradeId: string; lotSize: number }) =>
      backend.analysis.execute({ tradeId, lotSize }),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Trade Executed",
          description: `Order #${data.orderId} executed successfully`,
        });
      } else {
        toast({
          title: "Execution Failed",
          description: data.error,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Execution error:", error);
      toast({
        title: "Error",
        description: "Failed to execute trade",
        variant: "destructive",
      });
    },
  });

  const { data: currentSignal } = useQuery<TradingSignal>({
    queryKey: ["currentSignal"],
    enabled: false,
  });

  const handlePredict = () => {
    if (!symbol.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid symbol",
        variant: "destructive",
      });
      return;
    }
    predictMutation.mutate(symbol.toUpperCase());
  };

  const handleExecute = () => {
    if (!currentSignal) return;
    
    const lot = parseFloat(lotSize);
    if (isNaN(lot) || lot <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid lot size",
        variant: "destructive",
      });
      return;
    }

    executeMutation.mutate({
      tradeId: currentSignal.tradeId,
      lotSize: lot,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Trading Signals</h1>
        <p className="text-gray-600 mt-1">Generate and execute AI-powered trading signals</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Signal</CardTitle>
          <CardDescription>
            Enter a trading symbol to get AI analysis and trading recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter symbol (e.g., BTCUSD, EURUSD)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="uppercase"
              />
            </div>
            <Button 
              onClick={handlePredict}
              disabled={predictMutation.isPending}
              className="min-w-[120px]"
            >
              {predictMutation.isPending ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {currentSignal && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Trading Signal - {currentSignal.symbol}
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
                <CardDescription>
                  Trade ID: {currentSignal.tradeId} • Confidence: {currentSignal.confidence}%
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {currentSignal.confidence}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Entry Price</div>
                <div className="text-2xl font-bold text-blue-900">
                  {currentSignal.entryPrice}
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600 font-medium flex items-center justify-center gap-1">
                  <Target className="h-4 w-4" />
                  Take Profit
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {currentSignal.takeProfit}
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-red-600 font-medium flex items-center justify-center gap-1">
                  <Shield className="h-4 w-4" />
                  Stop Loss
                </div>
                <div className="text-2xl font-bold text-red-900">
                  {currentSignal.stopLoss}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Technical Analysis</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">RSI</div>
                  <div className="font-medium">
                    {currentSignal.analysis?.technical?.rsi?.toFixed(1) || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">MACD</div>
                  <div className="font-medium">
                    {currentSignal.analysis?.technical?.macd?.toFixed(5) || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">ATR</div>
                  <div className="font-medium">
                    {currentSignal.analysis?.technical?.atr?.toFixed(5) || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Support</div>
                  <div className="font-medium">
                    {currentSignal.analysis?.technical?.support || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Resistance</div>
                  <div className="font-medium">
                    {currentSignal.analysis?.technical?.resistance || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {currentSignal.analysis?.smartMoney && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Smart Money Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Institutional Flow</div>
                    <div className="font-medium">
                      {currentSignal.analysis.smartMoney.institutionalFlow}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Volume Profile</div>
                    <div className="font-medium">
                      {currentSignal.analysis.smartMoney.volumeProfile}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Order Flow</div>
                    <div className="font-medium">
                      {currentSignal.analysis.smartMoney.orderFlow}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentSignal.analysis?.professional && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Professional Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Consensus View</div>
                    <div className="font-medium">
                      {currentSignal.analysis.professional.consensusView}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Risk/Reward</div>
                    <div className="font-medium">
                      1:{currentSignal.analysis.professional.riskReward?.toFixed(1) || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Timeframe</div>
                    <div className="font-medium">
                      {currentSignal.analysis.professional.timeframe}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Execute Trade</h4>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lot Size
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.1"
                    value={lotSize}
                    onChange={(e) => setLotSize(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleExecute}
                  disabled={executeMutation.isPending}
                  className="min-w-[140px] flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  {executeMutation.isPending ? "Executing..." : "Execute Trade"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
