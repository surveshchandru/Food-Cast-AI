import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface Recommendation {
  id: string;
  itemName: string;
  category: string;
  currentStock: number;
  predictedDemand: number;
  confidence: number;
  needsRestock: boolean;
  action: string;
  icon: string;
}

const iconMap: Record<string, string> = {
  "drumstick-bite": "🍗",
  "fish": "🐟", 
  "seedling": "🌱",
  "pizza-slice": "🍕",
  "utensils": "🍽️",
};

export default function RecommendationsTable() {
  const [filter, setFilter] = useState('All');
  
  const { data: recommendations, isLoading } = useQuery<Recommendation[]>({
    queryKey: ["/api/inventory/recommendations"],
  });

  const filteredRecommendations = recommendations?.filter(item => {
    if (filter === 'All') return true;
    if (filter === 'High Demand') return item.predictedDemand > item.currentStock;
    if (filter === 'Low Stock') return item.currentStock < 50;
    if (filter === 'Trending') return item.confidence > 0.8;
    return true;
  }) || [];

  if (isLoading) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-shadow" data-testid="card-recommendations">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <CardTitle className="mb-4 lg:mb-0">AI Recommendations</CardTitle>
          <div className="flex flex-wrap gap-2">
            {['All', 'High Demand', 'Low Stock', 'Trending'].map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterOption)}
                className="px-3 py-1 text-sm rounded-full"
                data-testid={`button-filter-${filterOption.toLowerCase().replace(' ', '-')}`}
              >
                {filterOption}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredRecommendations.length === 0 ? (
          <div className="text-center text-onSurfaceSecondary py-8">
            No recommendations available for the selected filter
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-onSurfaceSecondary text-sm">Item</th>
                  <th className="text-left py-3 px-4 font-medium text-onSurfaceSecondary text-sm">Current Stock</th>
                  <th className="text-left py-3 px-4 font-medium text-onSurfaceSecondary text-sm">Predicted Demand</th>
                  <th className="text-left py-3 px-4 font-medium text-onSurfaceSecondary text-sm">Confidence</th>
                  <th className="text-left py-3 px-4 font-medium text-onSurfaceSecondary text-sm">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRecommendations.map((item) => (
                  <tr key={item.id} data-testid={`row-recommendation-${item.itemName.toLowerCase().replace(/\s+/g, '-')}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-sm">{iconMap[item.icon] || iconMap["utensils"]}</span>
                        </div>
                        <span className="font-medium text-onSurface">{item.itemName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-onSurfaceSecondary">
                      {item.currentStock} units
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${item.needsRestock ? 'text-error' : 'text-secondary'}`}>
                        {item.predictedDemand} units
                      </span>
                      <span className={`text-sm ml-1 ${item.needsRestock ? 'text-error' : 'text-secondary'}`}>
                        {item.needsRestock ? '↑' : '→'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant={item.confidence > 0.8 ? 'default' : 'secondary'}
                        className="px-2 py-1"
                      >
                        {Math.round(item.confidence * 100)}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant={item.needsRestock ? 'default' : 'ghost'}
                        size="sm"
                        className="text-sm font-medium"
                        data-testid={`button-action-${item.itemName.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {item.action}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
