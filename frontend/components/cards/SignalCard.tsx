import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TradingSignal } from "~backend/analysis/predict";
import { TrendingUp, TrendingDown, Zap, Shield, Target, Clock, BarChart, DollarSign } from "lucide-react";

interface SignalCardProps {
  signal: TradingSignal;
  onExecute: (tradeId: string, lotSize: number) => void;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal, onExecute }) => {
  const [riskAmount, setRiskAmount] = useState<string>("100");
  const [calculatedLotSize, setCalculatedLotSize] = useState<number>(signal.recommendedLotSize);

  const isLong = signal.direction === "LONG";
  const confidenceColor = signal.confidence > 85 ? "bg-green-500" : signal.confidence > 75 ? "bg-yellow-500" : "bg-red-500";

  // Calculate lot size based on risk amount
  useEffect(() => {
    const risk = parseFloat(riskAmount) || 0;
    if (risk > 0) {
      // Calculate the risk per pip/point
      const stopLossDistance = Math.abs(signal.entryPrice - signal.stopLoss);
      
      // Estimate pip value based on symbol type
      let pipValue = 1; // Default pip value for 1 lot
      
      // Forex pairs typically have different pip values
      if (signal.symbol.includes("JPY")) {
        // JPY pairs: 1 pip = 0.01, pip value ≈ $10 for 1 lot
        pipValue = 10;
      } else if (signal.symbol.includes("USD") && !signal.symbol.startsWith("USD")) {
        // Major pairs like EURUSD, GBPUSD: 1 pip = 0.0001, pip value ≈ $10 for 1 lot
        pipValue = 10;
      } else if (signal.symbol.includes("USD") && signal.symbol.startsWith("USD")) {
        // USD base pairs like USDCAD: pip value varies, approximate $10
        pipValue = 10;
      } else if (signal.symbol === "XAUUSD") {
        // Gold: 1 point = $1 for 1 lot
        pipValue = 1;
      } else if (signal.symbol === "BTCUSD" || signal.symbol === "ETHUSD") {
        // Crypto: varies by broker, approximate
        pipValue = 1;
      } else {
        // Other instruments: approximate
        pipValue = 10;
      }
      
      // Calculate pips/points in the stop loss distance
      let pipsInStopLoss: number;
      if (signal.symbol.includes("JPY")) {
        pipsInStopLoss = stopLossDistance * 100; // JPY pairs: 1 pip = 0.01
      } else if (signal.symbol.includes("USD") || signal.symbol.startsWith("EUR") || signal.symbol.startsWith("GBP")) {
        pipsInStopLoss = stopLossDistance * 10000; // Major pairs: 1 pip = 0.0001
      } else {
        pipsInStopLoss = stopLossDistance; // For other instruments like Gold, Crypto
      }
      
      // Calculate lot size: Risk Amount / (Pips in Stop Loss × Pip Value)
      const lotSize = risk / (pipsInStopLoss * pipValue);
      
      // Round to 2 decimal places and ensure minimum lot size
      const roundedLotSize = Math.max(0.01, Math.round(lotSize * 100) / 100);
      
      setCalculatedLotSize(roundedLotSize);
    } else {
      setCalculatedLotSize(signal.recommendedLotSize);
    }
  }, [riskAmount, signal.entryPrice, signal.stopLoss, signal.symbol, signal.recommendedLotSize]);

  const handleRiskAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setRiskAmount(value);
    }
  };

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

        {/* Risk Amount Input Section */}
        <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <Label htmlFor="riskAmount" className="text-sm font-semibold text-blue-800">
              Gestione Rischio
            </Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="riskAmount" className="text-xs text-blue-700">
              Importo a rischio (USD/EUR):
            </Label>
            <Input
              id="riskAmount"
              type="text"
              value={riskAmount}
              onChange={(e) => handleRiskAmountChange(e.target.value)}
              placeholder="100"
              className="text-center font-mono"
            />
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-700">Lottaggio calcolato:</span>
            <span className="font-bold text-blue-800">{calculatedLotSize.toFixed(2)} lotti</span>
          </div>
          
          <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
            💡 Il sistema calcola automaticamente il lottaggio in base al rischio inserito e alla distanza dello stop loss.
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-1">Analisi Strategia:</h4>
          <p className="text-xs text-muted-foreground">{signal.strategyRecommendation}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={() => onExecute(signal.tradeId, calculatedLotSize)}
          disabled={calculatedLotSize < 0.01}
        >
          Esegui Trade ({calculatedLotSize.toFixed(2)} lotti)
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SignalCard;
