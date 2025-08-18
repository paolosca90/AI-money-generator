import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import SignalCard from "../components/cards/SignalCard";
import PositionsTable from "../components/tables/PositionsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TradingStrategy } from "~backend/analysis/trading-strategies";

const supportedSymbols = ["BTCUSD", "ETHUSD", "EURUSD", "GBPUSD", "XAUUSD", "CRUDE"];

export default function Trade() {
  const [symbol, setSymbol] = useState("BTCUSD");
  const [strategy, setStrategy] = useState<TradingStrategy | "auto">("auto");
  const backend = useBackend();
  const { toast } = useToast();
  const { isAuthenticated, validateSession } = useAuth();
  const queryClient = useQueryClient();

  const predictMutation = useMutation({
    mutationFn: async () => {
      // Validate session before making the predict call
      const isSessionValid = await validateSession();
      if (!isSessionValid) {
        throw new Error("Your session has expired. Please log in again.");
      }
      
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
    mutationFn: async (params: { tradeId: string; lotSize: number }) => {
      // Validate session before making the execute call
      const isSessionValid = await validateSession();
      if (!isSessionValid) {
        throw new Error("Your session has expired. Please log in again.");
      }
      
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

  const { data: positionsData, isLoading: isLoadingPositions, error: positionsError } = useQuery({
    queryKey: ["positions"],
    queryFn: () => backend.analysis.listPositions(),
    enabled: isAuthenticated,
    retry: 1,
    refetchInterval: 30000,
  });

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <p>Devi essere autenticato per accedere al trading.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trading & Segnali</h1>
        <p className="text-muted-foreground">Genera segnali AI ed esegui trade.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Genera Segnale</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Select value={symbol} onValueChange={setSymbol}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona Simbolo" />
            </SelectTrigger>
            <SelectContent>
              {supportedSymbols.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                  <p>Seleziona un simbolo e genera un segnale per iniziare</p>
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
                onClose={() => { /* Implement close logic */ }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
