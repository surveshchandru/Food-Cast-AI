import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, TrendingUp, Brain, AlertTriangle, BarChart3, Zap, Eye } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Prediction {
  id: string;
  itemName: string;
  category: string;
  predictedQuantity: number;
  confidence: number;
  predictionDate: string;
  forecastPeriod: string;
}

interface AdvancedForecastResult {
  itemName: string;
  category: string;
  models: ForecastModel[];
  bestModel: ForecastModel;
  ensemblePrediction: number[];
  ensembleConfidence: number[];
  forecastHorizon: number;
  externalFactorsImpact: Record<string, number>;
  seasonalComponents: {
    trend: number[];
    seasonal: number[];
    residual: number[];
  };
  anomalies: {
    date: string;
    value: number;
    anomalyScore: number;
  }[];
}

interface ForecastModel {
  name: string;
  type: 'arima' | 'exponential_smoothing' | 'neural_network' | 'ensemble';
  predictions: number[];
  confidence: number[];
  metrics: {
    mae: number;
    mape: number;
    rmse: number;
    r2: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  hyperparameters: Record<string, any>;
}

export default function Predictions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: predictions, isLoading } = useQuery<Prediction[]>({
    queryKey: ["/api/predictions"],
  });

  const { data: advancedForecasts, isLoading: advancedLoading } = useQuery<AdvancedForecastResult[]>({
    queryKey: ["/api/forecasting/advanced"],
    queryFn: async () => {
      const response = await fetch("/api/forecasting/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options: { period: 'daily', horizon: 7, ensembleMethod: 'weighted' } })
      });
      return response.json();
    },
    enabled: false, // Don't auto-fetch, only on demand
  });

  const generatePredictionsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/predictions/generate"),
    onSuccess: () => {
      toast({
        title: "Predictions Generated",
        description: "New demand predictions have been generated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/predictions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forecasting/advanced"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate predictions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateAdvancedForecastsMutation = useMutation({
    mutationFn: (options: any) => apiRequest("POST", "/api/forecasting/advanced", { options }),
    onSuccess: () => {
      toast({
        title: "Advanced Forecasts Generated",
        description: "ML ensemble forecasts with ARIMA, Neural Networks, and seasonal analysis completed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/forecasting/advanced"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate advanced forecasts. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-onSurface">Advanced ML Forecasting</h1>
          <p className="text-onSurfaceSecondary">ARIMA, Neural Networks, and Ensemble Model Predictions</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => generatePredictionsMutation.mutate()}
            disabled={generatePredictionsMutation.isPending}
            variant="outline"
            className="flex items-center space-x-2"
            data-testid="button-generate-basic-predictions"
          >
            <RefreshCw className={`h-4 w-4 ${generatePredictionsMutation.isPending ? 'animate-spin' : ''}`} />
            <span>Basic Predictions</span>
          </Button>
          <Button
            onClick={() => generateAdvancedForecastsMutation.mutate({ 
              period: 'daily', 
              horizon: 7, 
              ensembleMethod: 'weighted',
              includeSeasonality: true,
              includeHolidays: true 
            })}
            disabled={generateAdvancedForecastsMutation.isPending}
            className="flex items-center space-x-2"
            data-testid="button-generate-advanced-predictions"
          >
            <Brain className={`h-4 w-4 ${generateAdvancedForecastsMutation.isPending ? 'animate-spin' : ''}`} />
            <span>Advanced ML Forecast</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="ensemble" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ensemble" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Ensemble Models</span>
          </TabsTrigger>
          <TabsTrigger value="individual" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Individual Models</span>
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Anomaly Detection</span>
          </TabsTrigger>
          <TabsTrigger value="basic" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Basic Predictions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ensemble" className="space-y-6">
          {advancedLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="card-shadow animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : advancedForecasts && advancedForecasts.length > 0 ? (
            <div className="space-y-6">
              {/* Ensemble Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(advancedForecasts || []).slice(0, 3).map((forecast: AdvancedForecastResult, index: number) => (
                  <Card key={index} className="card-shadow">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{forecast.itemName}</span>
                        <Badge variant="secondary">{forecast.category}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-onSurfaceSecondary">Best Model:</span>
                          <Badge variant="outline">{forecast.bestModel.name}</Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Ensemble Confidence:</span>
                            <span className="text-sm font-medium">
                              {Math.round((forecast.ensembleConfidence[0] || 0) * 100)}%
                            </span>
                          </div>
                          <Progress value={(forecast.ensembleConfidence[0] || 0) * 100} className="h-2" />
                        </div>

                        <div className="pt-2 border-t">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {Math.round(forecast.ensemblePrediction[0] || 0)}
                            </div>
                            <div className="text-xs text-onSurfaceSecondary">
                              Predicted Demand (Next Day)
                            </div>
                          </div>
                        </div>

                        {/* External Factors Impact */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium">External Factors Impact:</div>
                          {Object.entries(forecast.externalFactorsImpact).map(([factor, impact]: [string, any]) => (
                            <div key={factor} className="flex justify-between text-xs">
                              <span className="capitalize">{factor}:</span>
                              <span className={impact > 0.1 ? 'text-warning' : 'text-onSurfaceSecondary'}>
                                {Math.round(impact * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Detailed Forecast Chart */}
              {advancedForecasts && advancedForecasts[0] && (
                <Card className="card-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>7-Day Ensemble Forecast - {advancedForecasts[0].itemName}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={(advancedForecasts[0]?.ensemblePrediction || []).map((pred: number, index: number) => ({
                          day: `Day ${index + 1}`,
                          prediction: Math.round(pred),
                          confidence: Math.round((advancedForecasts[0]?.ensembleConfidence[index] || 0) * 100),
                          upper: Math.round(pred * 1.2),
                          lower: Math.round(pred * 0.8)
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="prediction" 
                            stroke="#3B82F6" 
                            strokeWidth={3}
                            name="Ensemble Prediction"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="upper" 
                            stroke="#93C5FD" 
                            strokeDasharray="5 5"
                            name="Upper Bound"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="lower" 
                            stroke="#93C5FD" 
                            strokeDasharray="5 5"
                            name="Lower Bound"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="card-shadow">
              <CardContent className="p-6 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-onSurfaceSecondary">No advanced forecasts available. Generate new ML forecasts to see ensemble predictions.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="individual" className="space-y-6">
          {advancedForecasts && advancedForecasts.length > 0 ? (
            <div className="space-y-6">
              {advancedForecasts && advancedForecasts[0] && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(advancedForecasts[0]?.models || []).map((model: ForecastModel, index: number) => (
                    <Card key={index} className="card-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>{model.name}</span>
                          <Badge 
                            variant={model.type === 'neural_network' ? 'default' : 
                                   model.type === 'arima' ? 'secondary' : 'outline'}
                          >
                            {model.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Model Performance Metrics */}
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Accuracy:</span>
                              <span className="text-sm font-medium">
                                {Math.round(model.metrics.accuracy * 100)}%
                              </span>
                            </div>
                            <Progress value={model.metrics.accuracy * 100} className="h-2" />
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span>RMSE:</span>
                                <span>{model.metrics.rmse.toFixed(3)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>MAE:</span>
                                <span>{model.metrics.mae.toFixed(3)}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span>Precision:</span>
                                <span>{Math.round(model.metrics.precision * 100)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>F1-Score:</span>
                                <span>{Math.round(model.metrics.f1Score * 100)}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Prediction Value */}
                          <div className="pt-2 border-t text-center">
                            <div className="text-xl font-bold text-primary">
                              {Math.round(model.predictions[0] || 0)}
                            </div>
                            <div className="text-xs text-onSurfaceSecondary">
                              Next Day Prediction
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Card className="card-shadow">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-onSurfaceSecondary">Generate advanced forecasts to compare individual model performances.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-6">
          {advancedForecasts && advancedForecasts.length > 0 ? (
            <div className="space-y-6">
              {(advancedForecasts || []).map((forecast: AdvancedForecastResult, index: number) => (
                forecast.anomalies && forecast.anomalies.length > 0 && (
                  <Card key={index} className="card-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        <span>Anomalies Detected - {forecast.itemName}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(forecast.anomalies || []).slice(0, 5).map((anomaly: any, anomalyIndex: number) => (
                          <div key={anomalyIndex} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/20">
                            <div>
                              <div className="font-medium text-onSurface">
                                {new Date(anomaly.date).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-onSurfaceSecondary">
                                Unusual demand: {anomaly.value} units
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-warning">
                                {anomaly.anomalyScore.toFixed(1)}σ
                              </div>
                              <div className="text-xs text-onSurfaceSecondary">
                                Anomaly Score
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              ))}
              
              {(advancedForecasts || []).every((f: AdvancedForecastResult) => (f.anomalies || []).length === 0) && (
                <Card className="card-shadow">
                  <CardContent className="p-6 text-center">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="text-onSurfaceSecondary">No significant anomalies detected in recent data patterns.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="card-shadow">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-onSurfaceSecondary">Generate advanced forecasts to detect anomalies in demand patterns.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="basic" className="space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Basic Predictions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : !predictions || predictions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-onSurfaceSecondary mb-4">No predictions available</p>
              <Button
                onClick={() => generatePredictionsMutation.mutate()}
                disabled={generatePredictionsMutation.isPending}
                data-testid="button-generate-first-predictions"
              >
                Generate Predictions
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-onSurfaceSecondary">Item</th>
                    <th className="text-left py-3 px-4 font-medium text-onSurfaceSecondary">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-onSurfaceSecondary">Predicted Demand</th>
                    <th className="text-left py-3 px-4 font-medium text-onSurfaceSecondary">Confidence</th>
                    <th className="text-left py-3 px-4 font-medium text-onSurfaceSecondary">Period</th>
                    <th className="text-left py-3 px-4 font-medium text-onSurfaceSecondary">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {predictions.map((prediction) => (
                    <tr key={prediction.id} data-testid={`row-prediction-${prediction.itemName.toLowerCase().replace(/\s+/g, '-')}`}>
                      <td className="py-3 px-4">
                        <span className="font-medium text-onSurface">{prediction.itemName}</span>
                      </td>
                      <td className="py-3 px-4 text-onSurfaceSecondary">
                        {prediction.category}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-onSurface">
                          {prediction.predictedQuantity} units
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={prediction.confidence > 0.8 ? 'default' : 'secondary'}
                          className="px-2 py-1"
                        >
                          {Math.round(prediction.confidence * 100)}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-onSurfaceSecondary capitalize">
                        {prediction.forecastPeriod}
                      </td>
                      <td className="py-3 px-4 text-onSurfaceSecondary">
                        {new Date(prediction.predictionDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
