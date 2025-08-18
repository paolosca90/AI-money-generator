import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { useAuth } from "../hooks/useAuth";
import HistoryTable from "../components/tables/HistoryTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function History() {
  const backend = useBackend();
  const { isAuthenticated } = useAuth();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["history"],
    queryFn: () => backend.analysis.listHistory(),
    enabled: isAuthenticated,
    retry: 1,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Storico Trade</h1>
        <p className="text-muted-foreground">Visualizza tutti i tuoi trade passati.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Elenco Trade</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500">Errore: {error.message}</div>
          ) : (
            <HistoryTable signals={data?.signals || []} isLoading={isLoading} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
