import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, DollarSign } from "lucide-react";
import backend from "~backend/client";

export default function Performance() {
  const { data: performance, isLoading } = useQuery({
    queryKey: ["performance"],
    queryFn: () => backend.analysis.getPerformance(),
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
        <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
        <p className="text-gray-600 mt-1">Detailed analysis of AI trading model performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance?.totalTrades || 0}</div>
            <p className="text-xs text-muted-foreground">
              Signals executed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getWinRateColor(performance?.winRate || 0)}`}>
              {performance?.winRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Successful predictions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProfitFactorColor(performance?.profitFactor || 0)}`}>
              {performance?.profitFactor.toFixed(2) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Profit vs Loss ratio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${performance?.avgProfit.toFixed(2) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Per winning trade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Loss</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${performance?.avgLoss.toFixed(2) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Per losing trade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Trade</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${performance?.bestTrade.toFixed(2) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Highest profit
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>
              Key metrics and trading statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Win Rate</span>
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
              <span className="text-sm font-medium">Profit Factor</span>
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
              <span className="text-sm font-medium">Average Confidence</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {performance?.avgConfidence.toFixed(0)}%
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Trades</span>
              <span className="font-medium">{performance?.totalTrades}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Analysis</CardTitle>
            <CardDescription>
              Risk management and drawdown metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Worst Trade</span>
              <span className="font-medium text-red-600">
                ${performance?.worstTrade.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Best Trade</span>
              <span className="font-medium text-green-600">
                ${performance?.bestTrade.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Risk/Reward Ratio</span>
              <span className="font-medium">
                1:{(performance?.profitFactor || 0).toFixed(2)}
              </span>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-gray-600 mb-2">Performance Rating</div>
              <div className="flex items-center gap-2">
                {performance?.winRate >= 70 && performance?.profitFactor >= 2 ? (
                  <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                ) : performance?.winRate >= 60 && performance?.profitFactor >= 1.5 ? (
                  <Badge className="bg-blue-100 text-blue-800">Good</Badge>
                ) : performance?.winRate >= 50 && performance?.profitFactor >= 1 ? (
                  <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
