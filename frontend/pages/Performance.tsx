import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, DollarSign } from "lucide-react";
import backend from "~backend/client";

export default function Performance() {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analisi Performance</h1>
          <p className="text-gray-600 mt-1">Analisi dettagliata delle performance del modello AI di trading</p>
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

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return "text-green-600";
    if (winRate >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getProfitFactorColor = (profitFactor: number) => {
    if (profitFactor >= 2) return "text-green-600";
    if (profitFactor >= 1) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analisi Performance</h1>
        <p className="text-gray-600 mt-1">Analisi dettagliata delle performance del modello AI di trading</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Trade</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance?.totalTrades || 0}</div>
            <p className="text-xs text-muted-foreground">
              Segnali eseguiti
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasso Vincita</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getWinRateColor(performance?.winRate || 0)}`}>
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
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProfitFactorColor(performance?.profitFactor || 0)}`}>
              {performance?.profitFactor.toFixed(2) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Rapporto Profitto vs Perdita
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profitto Medio</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${performance?.avgProfit.toFixed(2) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Per trade vincente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perdita Media</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${performance?.avgLoss.toFixed(2) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Per trade perdente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miglior Trade</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${performance?.bestTrade.toFixed(2) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Profitto più alto
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Riepilogo Performance</CardTitle>
            <CardDescription>
              Metriche chiave e statistiche di trading
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Tasso Vincita</span>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={performance?.winRate >= 60 ? "default" : "secondary"}
                  className={getWinRateColor(performance?.winRate || 0)}
                >
                  {performance?.winRate.toFixed(1)}%
                </Badge>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Fattore Profitto</span>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={performance?.profitFactor >= 1.5 ? "default" : "secondary"}
                  className={getProfitFactorColor(performance?.profitFactor || 0)}
                >
                  {performance?.profitFactor.toFixed(2)}
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Confidenza Media</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {performance?.avgConfidence.toFixed(0)}%
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Totale Trade</span>
              <span className="font-medium">{performance?.totalTrades}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analisi Rischio</CardTitle>
            <CardDescription>
              Gestione del rischio e metriche di drawdown
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Peggior Trade</span>
              <span className="font-medium text-red-600">
                ${performance?.worstTrade.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Miglior Trade</span>
              <span className="font-medium text-green-600">
                ${performance?.bestTrade.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Rapporto Rischio/Rendimento</span>
              <span className="font-medium">
                1:{(performance?.profitFactor || 0).toFixed(2)}
              </span>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-gray-600 mb-2">Valutazione Performance</div>
              <div className="flex items-center gap-2">
                {performance?.winRate >= 70 && performance?.profitFactor >= 2 ? (
                  <Badge className="bg-green-100 text-green-800">Eccellente</Badge>
                ) : performance?.winRate >= 60 && performance?.profitFactor >= 1.5 ? (
                  <Badge className="bg-blue-100 text-blue-800">Buono</Badge>
                ) : performance?.winRate >= 50 && performance?.profitFactor >= 1 ? (
                  <Badge className="bg-yellow-100 text-yellow-800">Medio</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">Da Migliorare</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
