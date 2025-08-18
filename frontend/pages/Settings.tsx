import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@clerk/clerk-react";

const preferencesSchema = z.object({
  riskPercentage: z.coerce.number().min(0.1).max(10),
  accountBalance: z.coerce.number().min(100),
});

const mt5ConfigSchema = z.object({
  host: z.string().min(1, "Host è richiesto"),
  port: z.coerce.number().min(1).max(65535),
  login: z.string().min(1, "Login è richiesto"),
  server: z.string().min(1, "Server è richiesto"),
  password: z.string().optional(),
});

export default function Settings() {
  const backend = useBackend();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isSignedIn, isLoaded } = useAuth();

  const { data: prefsData, isLoading: isLoadingPrefs, error: prefsError } = useQuery({
    queryKey: ["preferences"],
    queryFn: () => backend.user.getPreferences(),
    enabled: isLoaded && isSignedIn,
    retry: 1,
  });

  const { data: mt5Data, isLoading: isLoadingMt5, error: mt5Error } = useQuery({
    queryKey: ["mt5Config"],
    queryFn: () => backend.user.getMt5Config(),
    enabled: isLoaded && isSignedIn,
    retry: 1,
  });

  const prefsForm = useForm<z.infer<typeof preferencesSchema>>({
    resolver: zodResolver(preferencesSchema),
    values: {
      riskPercentage: prefsData?.preferences?.riskPercentage || 2,
      accountBalance: prefsData?.preferences?.accountBalance || 10000,
    },
  });

  const mt5Form = useForm<z.infer<typeof mt5ConfigSchema>>({
    resolver: zodResolver(mt5ConfigSchema),
    values: {
      host: mt5Data?.config?.host || "",
      port: mt5Data?.config?.port || 8080,
      login: mt5Data?.config?.login || "",
      server: mt5Data?.config?.server || "",
      password: "",
    },
  });

  const updatePrefsMutation = useMutation({
    mutationFn: (values: z.infer<typeof preferencesSchema>) => backend.user.updatePreferences(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
      toast({ title: "Successo", description: "Preferenze di trading aggiornate." });
    },
    onError: (err) => {
      console.error("Update preferences error:", err);
      toast({ variant: "destructive", title: "Errore", description: err.message });
    },
  });

  const updateMt5Mutation = useMutation({
    mutationFn: (values: z.infer<typeof mt5ConfigSchema>) => backend.user.updateMt5Config(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mt5Config"] });
      toast({ title: "Successo", description: "Configurazione MT5 aggiornata." });
    },
    onError: (err) => {
      console.error("Update MT5 config error:", err);
      toast({ variant: "destructive", title: "Errore", description: err.message });
    },
  });

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return <div>Caricamento autenticazione...</div>;
  }

  // Show sign-in prompt if not authenticated
  if (!isSignedIn) {
    return <div>Effettua l'accesso per accedere alle impostazioni.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Impostazioni</h1>
        <p className="text-muted-foreground">Gestisci le preferenze del tuo account e le configurazioni.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Preferenze di Trading</CardTitle>
            <CardDescription>Imposta il tuo profilo di rischio e il saldo del conto.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPrefs ? (
              <p>Caricamento...</p>
            ) : prefsError ? (
              <div className="text-red-500">Errore: {prefsError.message}</div>
            ) : (
              <Form {...prefsForm}>
                <form onSubmit={prefsForm.handleSubmit((v) => updatePrefsMutation.mutate(v))} className="space-y-4">
                  <FormField
                    control={prefsForm.control}
                    name="riskPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rischio per Trade (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={prefsForm.control}
                    name="accountBalance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Saldo Conto ($)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={updatePrefsMutation.isPending}>
                    {updatePrefsMutation.isPending ? "Salvataggio..." : "Salva Preferenze"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurazione MT5</CardTitle>
            <CardDescription>Collega il tuo account MetaTrader 5 per l'esecuzione dei trade.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMt5 ? (
              <p>Caricamento...</p>
            ) : mt5Error ? (
              <div className="text-red-500">Errore: {mt5Error.message}</div>
            ) : (
              <Form {...mt5Form}>
                <form onSubmit={mt5Form.handleSubmit((v) => updateMt5Mutation.mutate(v))} className="space-y-4">
                  <FormField control={mt5Form.control} name="host" render={({ field }) => (
                    <FormItem><FormLabel>Host/IP VPS</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={mt5Form.control} name="port" render={({ field }) => (
                    <FormItem><FormLabel>Porta</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={mt5Form.control} name="login" render={({ field }) => (
                    <FormItem><FormLabel>Login MT5</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={mt5Form.control} name="server" render={({ field }) => (
                    <FormItem><FormLabel>Server MT5</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={mt5Form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Password MT5 (opzionale)</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" disabled={updateMt5Mutation.isPending}>
                    {updateMt5Mutation.isPending ? "Salvataggio..." : "Salva Configurazione MT5"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
