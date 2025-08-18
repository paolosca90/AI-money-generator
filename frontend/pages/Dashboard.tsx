import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import StatCard from "../components/cards/StatCard";
import { DollarSign, Percent, TrendingUp, TrendingDown, Zap, BarChart } from "lucide-react";
import PositionsTable from "../components/tables/PositionsTable";
import HistoryTable from "../components/tables/HistoryTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const backend = useBackend();

  const { data: performanceData, isLoading: isLoadingPerformance, error: performanceError } = useQuery({
    queryKey: ["performance"],
    queryFn: () => backend.analysis.getPerformance(),
    retry: 1,
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

  const stats = [
    { title: "Win Rate", value: `${performanceData?.winRate?.toFixed(1) || 0}%`, icon: Percent, description: "Percentuale di trade in profitto" },
    { title: "Profit Factor", value: performanceData?.profitFactor?.toFixed(2) || "0", icon: BarChart, description: "Profitto lordo / Perdita lorda" },
    { title: "Avg. Profit", value: `$${performanceData?.avgProfit?.toFixed(2) || 0}`, icon: TrendingUp, description: "Profitto medio per trade" },
    { title: "Avg. Loss", value: `$${Math.abs(performanceData?.avgLoss || 0).toFixed(2)}`, icon: TrendingDown, description: "Perdita media per trade" },
    { title: "Total Trades", value: performanceData?.totalTrades?.toString() || "0", icon: Zap, description: "Numero totale di trade chiusi" },
    { title: "Avg. Confidence", value: `${performanceData?.avgConfidence?.toFixed(1) || 0}%`, icon: Zap, description: "Confidenza media dei segnali" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Panoramica delle tue performance di trading.</p>
      </div>

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
