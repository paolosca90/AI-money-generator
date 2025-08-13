import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Settings as SettingsIcon, Bot, Zap, Shield, Bell } from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState({
    telegramNotifications: true,
    autoExecution: false,
    riskManagement: true,
    maxLotSize: "1.0",
    maxDailyTrades: "10",
    confidenceThreshold: "70",
  });

  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Impostazioni Salvate",
      description: "Le tue preferenze sono state aggiornate con successo.",
    });
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Impostazioni</h1>
        <p className="text-gray-600 mt-1">Configura le preferenze del bot trading e la gestione del rischio</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Configurazione Bot
            </CardTitle>
            <CardDescription>
              Configura il comportamento del bot AI e le impostazioni di automazione
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Notifiche Telegram</Label>
                <div className="text-sm text-gray-600">
                  Ricevi segnali di trading via Telegram
                </div>
              </div>
              <Switch
                checked={settings.telegramNotifications}
                onCheckedChange={(checked) => handleSettingChange("telegramNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Esecuzione Automatica</Label>
                <div className="text-sm text-gray-600">
                  Esegui automaticamente segnali ad alta confidenza
                </div>
              </div>
              <Switch
                checked={settings.autoExecution}
                onCheckedChange={(checked) => handleSettingChange("autoExecution", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Gestione Rischio</Label>
                <div className="text-sm text-gray-600">
                  Abilita stop-loss e take-profit automatici
                </div>
              </div>
              <Switch
                checked={settings.riskManagement}
                onCheckedChange={(checked) => handleSettingChange("riskManagement", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confidence">Soglia Minima Confidenza (%)</Label>
              <Input
                id="confidence"
                type="number"
                min="50"
                max="95"
                value={settings.confidenceThreshold}
                onChange={(e) => handleSettingChange("confidenceThreshold", e.target.value)}
              />
              <div className="text-sm text-gray-600">
                Esegui solo segnali sopra questo livello di confidenza
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Gestione Rischio
            </CardTitle>
            <CardDescription>
              Imposta limiti di trading e parametri di rischio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="maxLot">Dimensione Massima Lotto</Label>
              <Input
                id="maxLot"
                type="number"
                step="0.01"
                min="0.01"
                max="10"
                value={settings.maxLotSize}
                onChange={(e) => handleSettingChange("maxLotSize", e.target.value)}
              />
              <div className="text-sm text-gray-600">
                Dimensione massima posizione per trade
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTrades">Massimo Trade Giornalieri</Label>
              <Input
                id="maxTrades"
                type="number"
                min="1"
                max="50"
                value={settings.maxDailyTrades}
                onChange={(e) => handleSettingChange("maxDailyTrades", e.target.value)}
              />
              <div className="text-sm text-gray-600">
                Limita il numero di trade per giorno
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
                <Shield className="h-4 w-4" />
                Avviso di Rischio
              </div>
              <div className="text-sm text-yellow-700">
                Il trading comporta un rischio sostanziale di perdita. Non fare mai trading con denaro che non puoi permetterti di perdere.
                Le performance passate non garantiscono risultati futuri.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Connessione MT5
            </CardTitle>
            <CardDescription>
              Stato integrazione MetaTrader 5 e impostazioni
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Stato Connessione</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Connesso
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Saldo Account</span>
              <span className="font-medium">$10.000,00</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Margine Libero</span>
              <span className="font-medium">$9.500,00</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Server</span>
              <span className="font-medium">Server Demo</span>
            </div>

            <Button variant="outline" className="w-full">
              Testa Connessione
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifiche
            </CardTitle>
            <CardDescription>
              Configura preferenze avvisi e impostazioni notifiche
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Avvisi Segnali</Label>
                  <div className="text-xs text-gray-600">
                    Ricevi notifiche quando vengono generati nuovi segnali
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Avvisi Esecuzione</Label>
                  <div className="text-xs text-gray-600">
                    Ricevi notifiche quando i trade vengono eseguiti
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Report Performance</Label>
                  <div className="text-xs text-gray-600">
                    Ricevi riepiloghi giornalieri delle performance
                  </div>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="min-w-[120px]">
          Salva Impostazioni
        </Button>
      </div>
    </div>
  );
}
