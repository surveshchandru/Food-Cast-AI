import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";

interface ModelMetrics {
  modelName: string;
  accuracy: number;
  rmse: number;
  f1Score: number;
  precision: number;
  recall: number;
  lastTraining: string;
}

export default function PerformanceMetrics() {
  const { data: metrics, isLoading } = useQuery<ModelMetrics>({
    queryKey: ["/api/model/metrics"],
  });

  if (isLoading) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Model Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Model Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-onSurfaceSecondary py-8">
            No performance metrics available
          </div>
        </CardContent>
      </Card>
    );
  }

  const lastTrainingDate = new Date(metrics.lastTraining);
  const timeAgo = Math.floor((Date.now() - lastTrainingDate.getTime()) / (1000 * 60 * 60));

  return (
    <Card className="card-shadow" data-testid="card-performance-metrics">
      <CardHeader>
        <CardTitle>Model Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-onSurfaceSecondary">Accuracy (RMSE)</span>
            <span className="font-medium text-onSurface" data-testid="text-rmse">
              {metrics.rmse.toFixed(3)}
            </span>
          </div>
          <Progress value={metrics.accuracy * 100} className="w-full h-2" />
          
          <div className="flex justify-between items-center">
            <span className="text-onSurfaceSecondary">F1-Score</span>
            <span className="font-medium text-onSurface" data-testid="text-f1-score">
              {metrics.f1Score.toFixed(3)}
            </span>
          </div>
          <Progress value={metrics.f1Score * 100} className="w-full h-2" />
          
          <div className="flex justify-between items-center">
            <span className="text-onSurfaceSecondary">Precision</span>
            <span className="font-medium text-onSurface" data-testid="text-precision">
              {metrics.precision.toFixed(3)}
            </span>
          </div>
          <Progress value={metrics.precision * 100} className="w-full h-2" />
          
          <div className="mt-4 p-3 bg-secondary/10 rounded-lg">
            <p className="text-sm text-onSurface font-medium">
              Last Training: {timeAgo} hours ago
            </p>
            <p className="text-xs text-onSurfaceSecondary">
              Next scheduled training: Tomorrow 2:00 AM
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
