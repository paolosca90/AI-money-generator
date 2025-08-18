import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import SignalCard from "../components/cards/SignalCard";
import PositionsTable from "../components/tables/PositionsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TradingStrategy } from "~backend/analysis/trading-strategies";
import { useLocation } from "react-router-dom";
import { Sparkles, TrendingUp, Clock, Target } from "lucide-react";

const assetCategories = {
  "🔥 Popolari": [
    "BTCUSD", "ETHUSD", "EURUSD", "GBPUSD", "XAUUSD", "US500", "NAS100"
  ],
  "💱 Forex Majors": [
    "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD"
  ],
  "💱 Forex Minors": [
    "EURGBP", "EURJPY", "EURCHF", "EURAUD", "EURCAD", "EURNZD", 
    "GBPJPY", "GBPCHF", "GBPAUD", "GBPCAD", "GBPNZD",
    "AUDJPY", "AUDCHF", "AUDCAD", "AUDNZD",
    "NZDJPY", "NZDCHF", "NZDCAD",
    "CADJPY", "CADCHF", "CHFJPY"
  ],
  "💱 Forex Exotics": [
    "USDSEK", "USDNOK", "USDDKK", "USDPLN", "USDHUF", "USDCZK",
    "USDTRY", "USDZAR", "USDMXN", "USDBRL", "USDSGD", "USDHKD",
    "EURPLN", "EURSEK", "EURNOK", "EURDKK", "EURTRY", "EURZAR",
    "GBPPLN", "GBPSEK", "GBPNOK", "GBPDKK", "GBPTRY", "GBPZAR"
  ],
  "📈 Indici CFD": [
    "US30", "SPX500", "NAS100", "UK100", "GER40", "FRA40", "ESP35", 
    "ITA40", "AUS200", "JPN225", "HK50", "CHINA50", "INDIA50"
  ],
  "🏗️ Materie Prime": [
    "XAUUSD", "XAGUSD", "XPTUSD", "XPDUSD", // Metalli preziosi
    "CRUDE", "BRENT", "NATGAS", // Energia
    "WHEAT", "CORN", "SOYBEAN", "SUGAR", "COFFEE", "COCOA", "COTTON" // Agricole
  ],
  "₿ Criptovalute": [
    "BTCUSD", "ETHUSD", "LTCUSD", "XRPUSD", "ADAUSD", "DOTUSD", 
    "LINKUSD", "BCHUSD", "XLMUSD", "EOSUSD"
  ]
};

const strategyDescriptions = {
  "auto": {
    name: "🤖 Strategia Automatica",
    description: "L'AI sceglie la strategia ottimale basandosi sulle condizioni di mercato",
    icon: Sparkles
  },
  [TradingStrategy.SCALPING]: {
    name: "⚡ Scalping",
    description: "Trade veloci (1-15 min) per catturare piccoli movimenti",
    icon: TrendingUp
  },
  [TradingStrategy.INTRADAY]: {
    name: "📊 Intraday",
    description: "Posizioni mantenute per 1-6 ore con chiusura automatica",
    icon: Clock
  }
};

export default function Trade() {
  const location = useLocation();
  const [symbol, setSymbol] = useState("BTCUSD");
  const [strategy, setStrategy] = useState<TradingStrategy | "auto">("auto");
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if a symbol was passed from navigation
  useEffect(() => {
    if (location.state?.selectedSymbol) {
      setSymbol(location.state.selectedSymbol);
    }
  }, [location.state]);

  const predictMutation = useMutation({
    mutationFn: () => {
      const strategyParam = strategy === "auto" ? undefined : strategy;
      return backend.analysis