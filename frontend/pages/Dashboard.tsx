import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Bot } from "lucide-react";
import backend from "~backend/client";
import RecentSignals from "../components/RecentSignals";
import PerformanceChart from "../components/PerformanceChart";

export default function Dashboard() {
  const { data: performance, isLoading, error } = useQuery({
    queryKey: ["performance"],
    queryFn: async () => {
      try {
        return await backend.analysis.getPerformance();
      } catch (error: any) {
        console.error("Performance API error:", error);
        
        if (error.message?.includes("fetch")) {
          throw new Error("Impossibile connettersi al server. Verifica la tua connessione internet.");
        } else if (error.message?.includes("404")) {
          throw new Error("Servizio di performance non disponibile. Riprova più tardi.");
        } else if (error.message?.includes("500")) {
          throw new Error("Errore interno del server. Riprova più tardi.");
        }
        
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Bot Trading</h1>
            <p className="text-gray-600 mt-1">Segnali di trading basati su AI e analisi delle performance</p>
          </div>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-600 font-medium mb-2">Errore nel caricamento dei dati</div>
              <div className="text-sm text-red-500">
                {error instanceof Error ? error.message : "Si è verificato un errore sconosciuto"}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Verifica la connessione al server e riprova
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Bot Trading</h1>
          <p className="text-gray-600 mt-1">Segnali di trading basati su AI e analisi delle performance</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          AI Attiva
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Trade</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance?.totalTrades || 0}</div>
            <p className="text-xs text-muted-foreground">
              Segnali generati
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasso Vincita</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {performance?.winRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Previsioni riuscite
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fattore Profitto</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {performance?.profitFactor.toFixed(2) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Rendimenti aggiustati per il rischio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confidenza Media</CardTitle>
            <Bot className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {performance?.avgConfidence.toFixed(0) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Confidenza previsioni AI
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Panoramica Performance</CardTitle>
            <CardDescription>
              Metriche di performance del trading nel tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Segnali Recenti</CardTitle>
            <CardDescription>
              Ultimi segnali di trading generati dall'AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentSignals />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
