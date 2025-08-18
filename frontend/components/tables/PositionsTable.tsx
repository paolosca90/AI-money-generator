import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MT5Position } from "~backend/analysis/mt5-bridge";

interface PositionsTableProps {
  positions: MT5Position[];
  isLoading: boolean;
  onClose: (ticket: number) => void;
}

const PositionsTable: React.FC<PositionsTableProps> = ({ positions, isLoading, onClose }) => {
  if (isLoading) {
    return <div>Caricamento posizioni...</div>;
  }

  if (!positions || positions.length === 0) {
    return <div className="text-center py-8">Nessuna posizione aperta.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticket</TableHead>
          <TableHead>Simbolo</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Volume</TableHead>
          <TableHead>Prezzo Apertura</TableHead>
          <TableHead>Prezzo Corrente</TableHead>
          <TableHead>P/L</TableHead>
          <TableHead>Azione</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {positions.map((pos) => (
          <TableRow key={pos.ticket}>
            <TableCell>{pos.ticket}</TableCell>
            <TableCell>{pos.symbol}</TableCell>
            <TableCell>
              <Badge variant={pos.type === 0 ? "default" : "destructive"}>
                {pos.type === 0 ? "BUY" : "SELL"}
              </Badge>
            </TableCell>
            <TableCell>{pos.volume}</TableCell>
            <TableCell>{pos.openPrice.toFixed(5)}</TableCell>
            <TableCell>{pos.currentPrice.toFixed(5)}</TableCell>
            <TableCell className={pos.profit >= 0 ? "text-green-500" : "text-red-500"}>
              ${pos.profit.toFixed(2)}
            </TableCell>
            <TableCell>
              <Button variant="destructive" size="sm" onClick={() => onClose(pos.ticket)}>
                Chiudi
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default PositionsTable;
