import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import SignalCard from "../components/cards/SignalCard";
import PositionsTable from "../components/tables/PositionsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TradingStrategy } from "~backend/analysis/trading-strategies";

const assetCategories = {
  "Forex Majors": [
    "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD"
  ],
  "Forex Minors": [
    "EURGBP", "EURJPY", "EURCHF", "EURAUD", "EURCAD", "EURNZD", 
    "GBPJPY", "GBPCHF", "GBPAUD", "GBPCAD", "GBPNZD",
    "AUDJPY", "AUDCHF", "AUDCAD", "AUDNZD",
    "NZDJPY", "NZDCHF", "NZDCAD",
    "CADJPY", "CADCHF", "CHFJPY"
  ],
  "Forex Exotics": [
    "USDSEK", "USDNOK", "USDDKK", "USDPLN", "USDHUF", "USDCZK",
    "USDTRY", "USDZAR", "USDMXN", "USDBRL", "USDSGD", "USDHKD",
    "EURPLN", "EURSEK", "EURNOK", "EURDKK", "EURTRY", "EURZAR",
    "GBPPLN", "GBPSEK", "GBPNOK", "GBPDKK", "GBPTRY", "GBPZAR"
  ],
  "Indici CFD": [
    "US30", "SPX500", "NAS100", "UK100", "GER40", "FRA40", "ESP35", 
    "ITA40", "AUS200", "JPN225", "HK50", "CHINA50", "INDIA50"
  ],
  "Materie Prime": [
    "XAUUSD", "XAGUSD", "XPTUSD", "XPDUSD", // Metalli preziosi
    "CRUDE", "BRENT", "NATGAS", // Energia
    "WHEAT", "CORN", "SOYBEAN", "SUGAR", "COFFEE", "COCOA", "COTTON" // Agricole
  ],
  "Criptovalute": [
    "BTCUSD", "ETHUSD", "LTCUSD", "XRPUSD", "ADAUSD", "DOTUSD", 
    "LINKUSD", "BCHUSD", "XLMUSD", "EOSUSD"
  ]
};

export default function Trade() {
  const [symbol, setSymbol] = useState("BTCUSD");
  const [strategy, setStrategy] = useState<TradingStrategy | "auto">("auto");
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const predictMutation = useMutation({
    mutationFn: () => {
      const strategyParam = strategy === "auto" ? undefined : strategy;
      return backend.analysis.predict({ symbol, strategy: strategyParam });
    },
    onSuccess: (data) => {
      toast({ title: "Successo", description: `Segnale generato per ${symbol}.` });
    },
    onError: (err: any) => {
      console.error("Predict error:", err);
      toast({ 
        variant: "destructive", 
        title: "Errore", 
        description: err.message || "Errore nella generazione del segnale" 
      });
    },
  });

  const executeMutation = useMutation({
    mutationFn: (params: { tradeId: string; lotSize: number }) => {
      return backend.analysis.execute(params);
    },
    onSuccess: () => {
      toast({ title: "Successo", description: "Trade eseguito con successo." });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
    onError: (err: any) => {
      console.error("Execute error:", err);
      toast({ 
        variant: "destructive", 
        title: "Errore", 
        description: err.message || "Errore nell'esecuzione del trade" 
      });
    },
  });

  const closePositionMutation = useMutation({
    mutationFn: (ticket: number) => {
      return backend.analysis.closePosition({ ticket });
    },
    onSuccess: () => {
      toast({ title: "Successo", description: "Posizione chiusa con successo." });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
    onError: (err: any) => {
      console.error("Close position error:", err);
      toast({ 
        variant: "destructive", 
        title: "Errore", 
        description: err.message || "Errore nella chiusura della posizione" 
      });
    },
  });

  const { data: positionsData, isLoading: isLoadingPositions, error: positionsError } = useQuery({
    queryKey: ["positions"],
    queryFn: () => backend.analysis.listPositions(),
    retry: 1,
    refetchInterval: 30000,
  });

  const handleClosePosition = (ticket: number) => {
    closePositionMutation.mutate(ticket);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trading & Segnali</h1>
        <p className="text-muted-foreground">Genera segnali AI ed esegui trade su oltre 100 asset finanziari.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Genera Segnale</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Select value={symbol} onValueChange={setSymbol}>
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="Seleziona Asset" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {Object.entries(assetCategories).map(([category, assets]) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                    {category}
                  </div>
                  {assets.map(asset => (
                    <SelectItem key={asset} value={asset} className="pl-4">
                      {asset}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
          <Select value={strategy} onValueChange={(v) => setStrategy(v as TradingStrategy | "auto")}>
            <SelectTrigger>
              <SelectValue placeholder="Strategia Ottimale" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (Ottimale)</SelectItem>
              <SelectItem value={TradingStrategy.SCALPING}>Scalping</SelectItem>
              <SelectItem value={TradingStrategy.INTRADAY}>Intraday</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => predictMutation.mutate()} 
            disabled={predictMutation.isPending}
            className="min-w-[140px]"
          >
            {predictMutation.isPending ? "Generazione..." : "Genera Segnale"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          {predictMutation.isPending && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Generazione segnale in corso...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Analizzando {symbol} con AI avanzata
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {predictMutation.error && (
            <Card>
              <CardContent className="p-6">
                <div className="text-red-500 text-center">
                  <h3 className="font-semibold mb-2">Errore nella generazione del segnale</h3>
                  <p className="text-sm">{predictMutation.error.message}</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {predictMutation.data && (
            <SignalCard
              signal={predictMutation.data}
              onExecute={(tradeId, lotSize) => executeMutation.mutate({ tradeId, lotSize })}
            />
          )}
          
          {!predictMutation.isPending && !predictMutation.error && !predictMutation.data && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <p>Seleziona un asset e genera un segnale per iniziare</p>
                  <p className="text-sm mt-2">Disponibili oltre 100 asset tra Forex, Indici, Materie Prime e Crypto</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Posizioni Aperte</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPositions ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p>Caricamento posizioni...</p>
              </div>
            ) : positionsError ? (
              <div className="text-red-500 text-center">
                <p>Errore nel caricamento delle posizioni</p>
                <p className="text-sm mt-1">{positionsError.message}</p>
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
                onClose={handleClosePosition}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
