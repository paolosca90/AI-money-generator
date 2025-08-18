import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import HistoryTable from "../components/tables/HistoryTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@clerk/clerk-react";

export default function History() {
  const backend = useBackend();
  const { isSignedIn, isLoaded } = useAuth();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["history"],
    queryFn: () => backend.analysis.listHistory(),
    enabled: isLoaded && isSignedIn,
    retry: 1,
  });

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return <div>Caricamento autenticazione...</div>;
  }

  // Show sign-in prompt if not authenticated
  if (!isSignedIn) {
    return <div>Effettua l'accesso per visualizzare lo storico.</div>;
  }

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
