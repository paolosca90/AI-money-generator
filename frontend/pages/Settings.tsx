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
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your trading bot preferences and risk management</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Bot Configuration
            </CardTitle>
            <CardDescription>
              Configure AI trading bot behavior and automation settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Telegram Notifications</Label>
                <div className="text-sm text-gray-600">
                  Receive trading signals via Telegram
                </div>
              </div>
              <Switch
                checked={settings.telegramNotifications}
                onCheckedChange={(checked) => handleSettingChange("telegramNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto Execution</Label>
                <div className="text-sm text-gray-600">
                  Automatically execute high-confidence signals
                </div>
              </div>
              <Switch
                checked={settings.autoExecution}
                onCheckedChange={(checked) => handleSettingChange("autoExecution", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Risk Management</Label>
                <div className="text-sm text-gray-600">
                  Enable automatic stop-loss and take-profit
                </div>
              </div>
              <Switch
                checked={settings.riskManagement}
                onCheckedChange={(checked) => handleSettingChange("riskManagement", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confidence">Minimum Confidence Threshold (%)</Label>
              <Input
                id="confidence"
                type="number"
                min="50"
                max="95"
                value={settings.confidenceThreshold}
                onChange={(e) => handleSettingChange("confidenceThreshold", e.target.value)}
              />
              <div className="text-sm text-gray-600">
                Only execute signals above this confidence level
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk Management
            </CardTitle>
            <CardDescription>
              Set trading limits and risk parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="maxLot">Maximum Lot Size</Label>
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
                Maximum position size per trade
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTrades">Maximum Daily Trades</Label>
              <Input
                id="maxTrades"
                type="number"
                min="1"
                max="50"
                value={settings.maxDailyTrades}
                onChange={(e) => handleSettingChange("maxDailyTrades", e.target.value)}
              />
              <div className="text-sm text-gray-600">
                Limit the number of trades per day
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
                <Shield className="h-4 w-4" />
                Risk Warning
              </div>
              <div className="text-sm text-yellow-700">
                Trading involves substantial risk of loss. Never trade with money you cannot afford to lose.
                Past performance does not guarantee future results.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              MT5 Connection
            </CardTitle>
            <CardDescription>
              MetaTrader 5 integration status and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connection Status</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Connected
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Account Balance</span>
              <span className="font-medium">$10,000.00</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Free Margin</span>
              <span className="font-medium">$9,500.00</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Server</span>
              <span className="font-medium">Demo Server</span>
            </div>

            <Button variant="outline" className="w-full">
              Test Connection
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure alert preferences and notification settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Signal Alerts</Label>
                  <div className="text-xs text-gray-600">
                    Get notified when new signals are generated
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Execution Alerts</Label>
                  <div className="text-xs text-gray-600">
                    Get notified when trades are executed
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Performance Reports</Label>
                  <div className="text-xs text-gray-600">
                    Receive daily performance summaries
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
          Save Settings
        </Button>
      </div>
    </div>
  );
}
