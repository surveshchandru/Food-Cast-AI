import MetricsCards from "@/components/dashboard/metrics-cards";
import DemandChart from "@/components/dashboard/demand-chart";
import TopItems from "@/components/dashboard/top-items";
import PerformanceMetrics from "@/components/dashboard/performance-metrics";
import RecommendationsTable from "@/components/dashboard/recommendations-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Dashboard() {
  const [showAlert, setShowAlert] = useState(true);

  return (
    <div>
      {/* Alert Banner */}
      {showAlert && (
        <Alert className="mb-6 border-l-4 border-warning bg-warning/10" data-testid="alert-inventory">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium text-onSurface">Inventory Alert</p>
              <p className="text-sm text-onSurfaceSecondary">
                Predicted high demand for "Grilled Chicken" exceeds current inventory by 15%
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAlert(false)}
              className="ml-auto text-onSurfaceSecondary hover:text-onSurface"
              data-testid="button-close-alert"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Cards */}
      <MetricsCards />

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <DemandChart />
        <TopItems />
      </div>

      {/* Model Performance & Data Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PerformanceMetrics />
        <div className="bg-surface rounded-lg p-6 card-shadow">
          <h2 className="text-lg font-medium text-onSurface mb-4">Quick Data Input</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-onSurfaceSecondary mb-2">Date Range</label>
              <div className="flex space-x-2">
                <input 
                  type="date" 
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  data-testid="input-start-date"
                />
                <input 
                  type="date" 
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  data-testid="input-end-date"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-onSurfaceSecondary mb-2">Product Category</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="select-category"
              >
                <option>All Categories</option>
                <option>Main Dishes</option>
                <option>Appetizers</option>
                <option>Beverages</option>
                <option>Desserts</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-onSurfaceSecondary mb-2">Upload Sales Data</label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-primary transition-colors">
                <div className="text-2xl text-onSurfaceSecondary mb-2">☁️</div>
                <p className="text-sm text-onSurfaceSecondary">Drop CSV file here or click to browse</p>
              </div>
            </div>
            
            <Button 
              className="w-full bg-primary text-white hover:bg-primary-dark"
              data-testid="button-process-data"
            >
              Process Data
            </Button>
          </div>
        </div>
      </div>

      {/* Recommendations Table */}
      <RecommendationsTable />
    </div>
  );
}
