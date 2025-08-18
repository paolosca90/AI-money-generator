import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { TradingSignal } from "~backend/analysis/predict";

interface HistoryTableProps {
  signals: TradingSignal[];
  isLoading: boolean;
}

const HistoryTable: React.FC<HistoryTableProps> = ({ signals, isLoading }) => {
  if (isLoading) {
    return <div>Caricamento storico trade...</div>;
  }

  if (!signals || signals.length === 0) {
    return <div className="text-center py-8">Nessun trade nello storico.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Simbolo</TableHead>
          <TableHead>Direzione</TableHead>
          <TableHead>Entrata</TableHead>
          <TableHead>Chiusura</TableHead>
          <TableHead>P/L</TableHead>
          <TableHead>Stato</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {signals.map((signal) => (
          <TableRow key={signal.tradeId}>
            <TableCell>{new Date(signal.analysis.createdAt).toLocaleString()}</TableCell>
            <TableCell>{signal.symbol}</TableCell>
            <TableCell>
              <Badge variant={signal.direction === "LONG" ? "default" : "destructive"}>
                {signal.direction}
              </Badge>
            </TableCell>
            <TableCell>{signal.entryPrice.toFixed(5)}</TableCell>
            <TableCell>{signal.analysis.executionPrice?.toFixed(5) || "-"}</TableCell>
            <TableCell className={signal.analysis.profitLoss > 0 ? "text-green-500" : "text-red-500"}>
              {signal.analysis.profitLoss?.toFixed(2) || "-"}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{signal.analysis.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default HistoryTable;
