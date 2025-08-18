import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import SignalCard from "../components/cards/SignalCard";
import PositionsTable from "../components/tables/PositionsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TradingStrategy } from "~backend/analysis/trading-strategies";

const supportedSymbols = ["BTCUSD", "ETHUSD", "EURUSD", "GBPUSD", "XAUUSD", "CRUDE"];

export default function Trade() {
  const [symbol, setSymbol] = useState("BTCUSD");
  const [strategy, setStrategy] = useState<TradingStrategy | undefined>(undefined);
  const backend = useBackend();
  const { toast } = useToast();

  const predictMutation = useMutation({
    mutationFn: () => backend.analysis.predict({ symbol, strategy }),
    onSuccess: () => {
      toast({ title: "Successo", description: `Segnale generato per ${symbol}.` });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Errore", description: err.message });
    },
  });

  const executeMutation = useMutation({
    mutationFn: (params: { tradeId: string; lotSize: number }) => backend.analysis.execute(params),
    onSuccess: () => {
      toast({ title: "Successo", description: "Trade eseguito con successo." });
      // Invalidate positions query to refetch
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Errore", description: err.message });
    },
  });

  const { data: positionsData, isLoading: isLoadingPositions } = useQuery({
    queryKey: ["positions"],
    queryFn: () => backend.analysis.listPositions(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trading</h1>
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
          <Select value={strategy} onValueChange={(v) => setStrategy(v as TradingStrategy)}>
            <SelectTrigger>
              <SelectValue placeholder="Strategia Ottimale" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TradingStrategy.SCALPING}>Scalping</SelectItem>
              <SelectItem value={TradingStrategy.INTRADAY}>Intraday</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => predictMutation.mutate()} disabled={predictMutation.isPending}>
            {predictMutation.isPending ? "Generazione..." : "Genera Segnale"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          {predictMutation.isPending && <p>Generazione segnale in corso...</p>}
          {predictMutation.data && (
            <SignalCard
              signal={predictMutation.data}
              onExecute={(tradeId, lotSize) => executeMutation.mutate({ tradeId, lotSize })}
            />
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Posizioni Aperte</CardTitle>
          </CardHeader>
          <CardContent>
            <PositionsTable
              positions={positionsData?.positions || []}
              isLoading={isLoadingPositions}
              onClose={() => { /* Implement close logic */ }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
