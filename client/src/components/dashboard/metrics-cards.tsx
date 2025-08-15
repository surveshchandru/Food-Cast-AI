import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Target, Crown, DollarSign, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface DashboardMetrics {
  todayDemand: number;
  demandChange: number;
  forecastAccuracy: number;
  topItem: string;
  topItemPrediction: number;
  revenueForecast: number;
}

export default function MetricsCards() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 lg:p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
        <Card>
          <CardContent className="p-4 lg:p-6 text-center text-onSurfaceSecondary">
            No metrics data available
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
      <Card className="card-shadow transition-all hover:shadow-lg">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-onSurfaceSecondary text-sm font-medium">Today's Demand</span>
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-onSurface" data-testid="text-today-demand">
            {metrics.todayDemand.toLocaleString()}
          </p>
          <p className={`text-sm ${metrics.demandChange >= 0 ? 'text-secondary' : 'text-error'}`}>
            {metrics.demandChange >= 0 ? '+' : ''}{metrics.demandChange.toFixed(1)}% from yesterday
          </p>
        </CardContent>
      </Card>

      <Card className="card-shadow transition-all hover:shadow-lg">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-onSurfaceSecondary text-sm font-medium">Forecast Accuracy</span>
            <Target className="h-5 w-5 text-secondary" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-onSurface" data-testid="text-forecast-accuracy">
            {(metrics.forecastAccuracy * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-secondary">High confidence</p>
        </CardContent>
      </Card>

      <Card className="card-shadow transition-all hover:shadow-lg">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-onSurfaceSecondary text-sm font-medium">Top Item</span>
            <Crown className="h-5 w-5 text-warning" />
          </div>
          <p className="text-lg lg:text-xl font-bold text-onSurface" data-testid="text-top-item">
            {metrics.topItem}
          </p>
          <p className="text-sm text-onSurfaceSecondary">
            {metrics.topItemPrediction} orders predicted
          </p>
        </CardContent>
      </Card>

      <Card className="card-shadow transition-all hover:shadow-lg">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-onSurfaceSecondary text-sm font-medium">Revenue Forecast</span>
            <DollarSign className="h-5 w-5 text-secondary" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-onSurface" data-testid="text-revenue-forecast">
            ${metrics.revenueForecast.toLocaleString()}
          </p>
          <p className="text-sm text-secondary">+8.7% projected</p>
        </CardContent>
      </Card>
    </div>
  );
}
