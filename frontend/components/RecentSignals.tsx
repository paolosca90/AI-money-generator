import React from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";

const mockSignals = [
  {
    id: "BTC-001",
    symbol: "BTCUSD",
    direction: "LONG" as const,
    confidence: 85,
    time: "2 ore fa",
    status: "eseguito" as const,
  },
  {
    id: "EUR-002",
    symbol: "EURUSD",
    direction: "SHORT" as const,
    confidence: 78,
    time: "4 ore fa",
    status: "in attesa" as const,
  },
  {
    id: "XAU-003",
    symbol: "XAUUSD",
    direction: "LONG" as const,
    confidence: 92,
    time: "6 ore fa",
    status: "eseguito" as const,
  },
];

export default function RecentSignals() {
  return (
    <div className="space-y-4">
      {mockSignals.map((signal) => (
        <div key={signal.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              signal.direction === "LONG" ? "bg-green-100" : "bg-red-100"
            }`}>
              {signal.direction === "LONG" ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div>
              <div className="font-medium">{signal.symbol}</div>
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {signal.time}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">{signal.confidence}%</Badge>
            <Badge 
              variant={signal.status === "eseguito" ? "default" : "secondary"}
              className={signal.status === "eseguito" ? "bg-green-100 text-green-800" : ""}
            >
              {signal.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
