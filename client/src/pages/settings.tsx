import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Settings as SettingsIcon, Bell, Brain, Clock, Save, RefreshCw, Database, Cloud, Zap, Shield, AlertTriangle, CheckCircle } from "lucide-react";

const settingsSchema = z.object({
  // Advanced ML Settings
  defaultForecastPeriod: z.string().min(1, "Forecast period is required"),
  forecastHorizon: z.number().min(1).max(30, "Horizon must be between 1-30 days"),
  confidenceThreshold: z.number().min(0).max(1, "Confidence threshold must be between 0 and 1"),
  ensembleMethod: z.string().min(1, "Ensemble method is required"),
  seasonalAdjustment: z.boolean(),
  trendAnalysis: z.boolean(),
  includeHolidays: z.boolean(),
  includeWeather: z.boolean(),
  enableAnomalyDetection: z.boolean(),
  
  // Model Configuration
  enableARIMA: z.boolean(),
  enableNeuralNetwork: z.boolean(),
  enableExponentialSmoothing: z.boolean(),
  trainingFrequency: z.string().min(1, "Training frequency is required"),
  dataRetentionDays: z.number().min(30, "Minimum retention is 30 days"),
  autoRetraining: z.boolean(),
  modelDriftThreshold: z.number().min(0).max(1, "Drift threshold must be between 0 and 1"),
  
  // Notification Settings
  enableNotifications: z.boolean(),
  inventoryAlerts: z.boolean(),
  demandSpikeAlerts: z.boolean(),
  modelDriftAlerts: z.boolean(),
  dailyReports: z.boolean(),
  lowStockThreshold: z.number().min(1, "Threshold must be at least 1"),
  demandSpikeMultiplier: z.number().min(1, "Multiplier must be at least 1"),
  
  // Display Settings
  defaultDashboardView: z.string().min(1, "Dashboard view is required"),
  chartAnimations: z.boolean(),
  darkMode: z.boolean(),
  refreshInterval: z.number().min(10, "Minimum refresh interval is 10 seconds"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      // Advanced ML Settings
      defaultForecastPeriod: "daily",
      forecastHorizon: 7,
      confidenceThreshold: 0.8,
      ensembleMethod: "weighted",
      seasonalAdjustment: true,
      trendAnalysis: true,
      includeHolidays: true,
      includeWeather: false,
      enableAnomalyDetection: true,
      
      // Model Configuration
      enableARIMA: true,
      enableNeuralNetwork: true,
      enableExponentialSmoothing: true,
      trainingFrequency: "daily",
      dataRetentionDays: 365,
      autoRetraining: true,
      modelDriftThreshold: 0.1,
      
      // Notification Settings
      enableNotifications: true,
      inventoryAlerts: true,
      demandSpikeAlerts: true,
      modelDriftAlerts: true,
      dailyReports: false,
      lowStockThreshold: 20,
      demandSpikeMultiplier: 2.0,
      
      // Display Settings
      defaultDashboardView: "overview",
      chartAnimations: true,
      darkMode: false,
      refreshInterval: 30,
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    setIsLoading(true);
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToDefaults = () => {
    form.reset();
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to default values.",
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-onSurface flex items-center space-x-2">
          <SettingsIcon className="h-6 w-6" />
          <span>Advanced ML Configuration</span>
        </h1>
        <p className="text-onSurfaceSecondary">Configure machine learning models, notifications, and system preferences</p>
      </div>

      <Tabs defaultValue="models" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models" data-testid="tab-models">ML Models</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
          <TabsTrigger value="external" data-testid="tab-external">External Data</TabsTrigger>
          <TabsTrigger value="system" data-testid="tab-system">System</TabsTrigger>
        </TabsList>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* ML Models Configuration */}
          <TabsContent value="models" className="space-y-6">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span>Forecasting Algorithms</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Algorithm Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Active Algorithms</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">ARIMA</div>
                        <div className="text-sm text-onSurfaceSecondary">Time series analysis</div>
                      </div>
                      <Switch 
                        checked={form.watch("enableARIMA")}
                        onCheckedChange={(checked) => form.setValue("enableARIMA", checked)}
                        data-testid="switch-arima"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Neural Network</div>
                        <div className="text-sm text-onSurfaceSecondary">Deep learning</div>
                      </div>
                      <Switch 
                        checked={form.watch("enableNeuralNetwork")}
                        onCheckedChange={(checked) => form.setValue("enableNeuralNetwork", checked)}
                        data-testid="switch-neural"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Exponential Smoothing</div>
                        <div className="text-sm text-onSurfaceSecondary">Statistical method</div>
                      </div>
                      <Switch 
                        checked={form.watch("enableExponentialSmoothing")}
                        onCheckedChange={(checked) => form.setValue("enableExponentialSmoothing", checked)}
                        data-testid="switch-exponential"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Ensemble Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="ensembleMethod">Ensemble Method</Label>
                    <Select 
                      onValueChange={(value) => form.setValue("ensembleMethod", value)} 
                      defaultValue="weighted"
                    >
                      <SelectTrigger data-testid="select-ensemble-method">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weighted">Weighted Average</SelectItem>
                        <SelectItem value="voting">Majority Voting</SelectItem>
                        <SelectItem value="stacking">Stacking</SelectItem>
                        <SelectItem value="boosting">Gradient Boosting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="forecastHorizon">Forecast Horizon (Days)</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[form.watch("forecastHorizon")]}
                        onValueChange={(value) => form.setValue("forecastHorizon", value[0])}
                        max={30}
                        min={1}
                        step={1}
                        className="w-full"
                        data-testid="slider-horizon"
                      />
                      <div className="text-sm text-onSurfaceSecondary text-center">
                        {form.watch("forecastHorizon")} days
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="confidenceThreshold">Confidence Threshold</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[form.watch("confidenceThreshold") * 100]}
                        onValueChange={(value) => form.setValue("confidenceThreshold", value[0] / 100)}
                        max={100}
                        min={50}
                        step={5}
                        className="w-full"
                        data-testid="slider-confidence"
                      />
                      <div className="text-sm text-onSurfaceSecondary text-center">
                        {Math.round(form.watch("confidenceThreshold") * 100)}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="modelDriftThreshold">Model Drift Threshold</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[form.watch("modelDriftThreshold") * 100]}
                        onValueChange={(value) => form.setValue("modelDriftThreshold", value[0] / 100)}
                        max={50}
                        min={5}
                        step={1}
                        className="w-full"
                        data-testid="slider-drift"
                      />
                      <div className="text-sm text-onSurfaceSecondary text-center">
                        {Math.round(form.watch("modelDriftThreshold") * 100)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Features */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Advanced Features</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Seasonal Adjustment</div>
                        <div className="text-sm text-onSurfaceSecondary">Account for seasonal patterns</div>
                      </div>
                      <Switch 
                        checked={form.watch("seasonalAdjustment")}
                        onCheckedChange={(checked) => form.setValue("seasonalAdjustment", checked)}
                        data-testid="switch-seasonal"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Trend Analysis</div>
                        <div className="text-sm text-onSurfaceSecondary">Detect long-term trends</div>
                      </div>
                      <Switch 
                        checked={form.watch("trendAnalysis")}
                        onCheckedChange={(checked) => form.setValue("trendAnalysis", checked)}
                        data-testid="switch-trend"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Anomaly Detection</div>
                        <div className="text-sm text-onSurfaceSecondary">Identify unusual patterns</div>
                      </div>
                      <Switch 
                        checked={form.watch("enableAnomalyDetection")}
                        onCheckedChange={(checked) => form.setValue("enableAnomalyDetection", checked)}
                        data-testid="switch-anomaly"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Auto Retraining</div>
                        <div className="text-sm text-onSurfaceSecondary">Automatic model updates</div>
                      </div>
                      <Switch 
                        checked={form.watch("autoRetraining")}
                        onCheckedChange={(checked) => form.setValue("autoRetraining", checked)}
                        data-testid="switch-retrain"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Configuration */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <span>Notification Rules</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Master Toggle */}
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                  <div>
                    <div className="font-medium">Enable Notifications</div>
                    <div className="text-sm text-onSurfaceSecondary">Master switch for all alerts</div>
                  </div>
                  <Switch 
                    checked={form.watch("enableNotifications")}
                    onCheckedChange={(checked) => form.setValue("enableNotifications", checked)}
                    data-testid="switch-notifications"
                  />
                </div>

                {/* Notification Types */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Alert Types</Label>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        <div>
                          <div className="font-medium">Inventory Alerts</div>
                          <div className="text-sm text-onSurfaceSecondary">Low stock warnings</div>
                        </div>
                      </div>
                      <Switch 
                        checked={form.watch("inventoryAlerts")}
                        onCheckedChange={(checked) => form.setValue("inventoryAlerts", checked)}
                        disabled={!form.watch("enableNotifications")}
                        data-testid="switch-inventory-alerts"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Zap className="h-5 w-5 text-orange-500" />
                        <div>
                          <div className="font-medium">Demand Spike Alerts</div>
                          <div className="text-sm text-onSurfaceSecondary">Unusual demand increases</div>
                        </div>
                      </div>
                      <Switch 
                        checked={form.watch("demandSpikeAlerts")}
                        onCheckedChange={(checked) => form.setValue("demandSpikeAlerts", checked)}
                        disabled={!form.watch("enableNotifications")}
                        data-testid="switch-spike-alerts"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium">Model Drift Alerts</div>
                          <div className="text-sm text-onSurfaceSecondary">Model performance degradation</div>
                        </div>
                      </div>
                      <Switch 
                        checked={form.watch("modelDriftAlerts")}
                        onCheckedChange={(checked) => form.setValue("modelDriftAlerts", checked)}
                        disabled={!form.watch("enableNotifications")}
                        data-testid="switch-drift-alerts"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium">Daily Reports</div>
                          <div className="text-sm text-onSurfaceSecondary">Automated daily summaries</div>
                        </div>
                      </div>
                      <Switch 
                        checked={form.watch("dailyReports")}
                        onCheckedChange={(checked) => form.setValue("dailyReports", checked)}
                        disabled={!form.watch("enableNotifications")}
                        data-testid="switch-daily-reports"
                      />
                    </div>
                  </div>
                </div>

                {/* Threshold Configuration */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Alert Thresholds</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="lowStockThreshold">Low Stock Threshold (units)</Label>
                      <Input
                        type="number"
                        {...form.register("lowStockThreshold", { valueAsNumber: true })}
                        data-testid="input-stock-threshold"
                      />
                    </div>
                    <div>
                      <Label htmlFor="demandSpikeMultiplier">Demand Spike Multiplier</Label>
                      <div className="space-y-2">
                        <Slider
                          value={[form.watch("demandSpikeMultiplier")]}
                          onValueChange={(value) => form.setValue("demandSpikeMultiplier", value[0])}
                          max={5}
                          min={1.5}
                          step={0.1}
                          className="w-full"
                          data-testid="slider-spike-multiplier"
                        />
                        <div className="text-sm text-onSurfaceSecondary text-center">
                          {form.watch("demandSpikeMultiplier").toFixed(1)}x normal demand
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* External Data Sources */}
          <TabsContent value="external" className="space-y-6">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cloud className="h-5 w-5 text-primary" />
                  <span>External Data Sources</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Data Source Integration */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Available Integrations</Label>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium">Holiday Calendar</div>
                          <div className="text-sm text-onSurfaceSecondary">National and regional holidays</div>
                        </div>
                      </div>
                      <Switch 
                        checked={form.watch("includeHolidays")}
                        onCheckedChange={(checked) => form.setValue("includeHolidays", checked)}
                        data-testid="switch-holidays"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Cloud className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium">Weather Data</div>
                          <div className="text-sm text-onSurfaceSecondary">Local weather conditions</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={form.watch("includeWeather") ? "default" : "secondary"}>
                          {form.watch("includeWeather") ? "Connected" : "Disconnected"}
                        </Badge>
                        <Switch 
                          checked={form.watch("includeWeather")}
                          onCheckedChange={(checked) => form.setValue("includeWeather", checked)}
                          data-testid="switch-weather"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* API Configuration */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">API Configuration</Label>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="weatherApiKey">Weather API Key</Label>
                      <Input
                        type="password"
                        placeholder="Enter your weather API key"
                        disabled={!form.watch("includeWeather")}
                        data-testid="input-weather-api"
                      />
                      <div className="text-sm text-onSurfaceSecondary mt-1">
                        Required for weather data integration
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-primary" />
                  <span>System Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Training Configuration */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Model Training</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="trainingFrequency">Training Frequency</Label>
                      <Select 
                        onValueChange={(value) => form.setValue("trainingFrequency", value)} 
                        defaultValue="daily"
                      >
                        <SelectTrigger data-testid="select-training-frequency">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="dataRetentionDays">Data Retention (Days)</Label>
                      <Input
                        type="number"
                        {...form.register("dataRetentionDays", { valueAsNumber: true })}
                        data-testid="input-retention-days"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Display Settings */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Display Preferences</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="defaultDashboardView">Default Dashboard View</Label>
                      <Select 
                        onValueChange={(value) => form.setValue("defaultDashboardView", value)} 
                        defaultValue="overview"
                      >
                        <SelectTrigger data-testid="select-dashboard-view">
                          <SelectValue placeholder="Select view" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="overview">Overview</SelectItem>
                          <SelectItem value="analytics">Analytics</SelectItem>
                          <SelectItem value="predictions">Predictions</SelectItem>
                          <SelectItem value="inventory">Inventory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="refreshInterval">Auto Refresh (seconds)</Label>
                      <Input
                        type="number"
                        {...form.register("refreshInterval", { valueAsNumber: true })}
                        data-testid="input-refresh-interval"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Chart Animations</div>
                      <div className="text-sm text-onSurfaceSecondary">Enable smooth chart transitions</div>
                    </div>
                    <Switch 
                      checked={form.watch("chartAnimations")}
                      onCheckedChange={(checked) => form.setValue("chartAnimations", checked)}
                      data-testid="switch-animations"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetToDefaults}
              data-testid="button-reset-defaults"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            
            <Button
              type="submit"
              disabled={isLoading}
              data-testid="button-save-settings"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Configuration
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
}
