import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from "react";

interface TrendData {
  actual: number[];
  predicted: number[];
  labels: string[];
}

export default function DemandChart() {
  const [period, setPeriod] = useState('7');
  
  const { data: trends, isLoading } = useQuery<TrendData>({
    queryKey: ["/api/dashboard/trends", { days: period }],
  });

  if (isLoading) {
    return (
      <Card className="xl:col-span-2 card-shadow">
        <CardHeader>
          <CardTitle>Demand Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 lg:h-80 flex items-center justify-center">
            <div className="animate-pulse text-onSurfaceSecondary">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trends) {
    return (
      <Card className="xl:col-span-2 card-shadow">
        <CardHeader>
          <CardTitle>Demand Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 lg:h-80 flex items-center justify-center text-onSurfaceSecondary">
            No trend data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = trends.labels.map((label, index) => ({
    day: label,
    actual: trends.actual[index] || 0,
    predicted: trends.predicted[index] || 0,
  }));

  return (
    <Card className="xl:col-span-2 card-shadow" data-testid="card-demand-chart">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <CardTitle className="mb-2 sm:mb-0">Demand Trends</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant={period === '7' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('7')}
              className="px-3 py-1 text-sm rounded-full"
              data-testid="button-period-7d"
            >
              7D
            </Button>
            <Button
              variant={period === '30' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('30')}
              className="px-3 py-1 text-sm rounded-full"
              data-testid="button-period-30d"
            >
              30D
            </Button>
            <Button
              variant={period === '90' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('90')}
              className="px-3 py-1 text-sm rounded-full"
              data-testid="button-period-90d"
            >
              90D
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis
                dataKey="day"
                tick={{ fill: '#757575', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
              />
              <YAxis
                tick={{ fill: '#757575', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="hsl(207.3, 70.5%, 44.9%)"
                strokeWidth={2}
                fill="rgba(25, 118, 210, 0.1)"
                name="Actual Demand"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="hsl(135.5, 49.4%, 39.8%)"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Predicted Demand"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
