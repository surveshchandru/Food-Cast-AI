import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon } from "lucide-react";

const COLORS = ['#1976D2', '#388E3C', '#F57C00', '#D32F2F', '#7B1FA2'];

export default function Analytics() {
  const { data: trends } = useQuery({
    queryKey: ["/api/dashboard/trends", { days: 30 }],
  });

  const { data: topItems } = useQuery({
    queryKey: ["/api/dashboard/top-items"],
  });

  // Mock category data for pie chart
  const categoryData = [
    { name: 'Main Dishes', value: 45, color: '#1976D2' },
    { name: 'Appetizers', value: 25, color: '#388E3C' },
    { name: 'Beverages', value: 20, color: '#F57C00' },
    { name: 'Desserts', value: 10, color: '#D32F2F' },
  ];

  const chartData = trends && trends.labels ? trends.labels.map((label: string, index: number) => ({
    day: label,
    actual: trends.actual[index] || 0,
    predicted: trends.predicted[index] || 0,
  })) : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-onSurface">Analytics Dashboard</h1>
        <p className="text-onSurfaceSecondary">Detailed insights into demand patterns and trends</p>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="card-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-onSurfaceSecondary">Avg Daily Demand</p>
                <p className="text-2xl font-bold text-onSurface">1,247</p>
                <p className="text-xs text-secondary">+12.3% vs last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-onSurfaceSecondary">Peak Demand Day</p>
                <p className="text-2xl font-bold text-onSurface">Friday</p>
                <p className="text-xs text-secondary">1,350 orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <PieChartIcon className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-onSurfaceSecondary">Top Category</p>
                <p className="text-2xl font-bold text-onSurface">Main Dishes</p>
                <p className="text-xs text-secondary">45% of total demand</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Demand Comparison Chart */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>30-Day Demand Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="day" tick={{ fill: '#757575', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#757575', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="actual" fill="#1976D2" name="Actual Demand" />
                  <Bar dataKey="predicted" fill="#388E3C" name="Predicted Demand" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Demand by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Items */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Top Performing Items This Month</CardTitle>
        </CardHeader>
        <CardContent>
          {topItems && topItems.length > 0 ? (
            <div className="space-y-4">
              {topItems.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg" data-testid={`item-performance-${item.itemName.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-onSurface">{item.itemName}</p>
                      <p className="text-sm text-onSurfaceSecondary">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-onSurface">{item.predictedQuantity} orders</p>
                    <p className="text-sm text-secondary">{Math.round(item.confidence * 100)}% confidence</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-onSurfaceSecondary">
              No performance data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
