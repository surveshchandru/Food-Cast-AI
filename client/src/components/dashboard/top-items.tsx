import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

interface TopItem {
  itemName: string;
  category: string;
  predictedQuantity: number;
  confidence: number;
  icon: string;
  change: number;
}

const iconMap: Record<string, string> = {
  "drumstick-bite": "🍗",
  "fish": "🐟", 
  "seedling": "🌱",
  "pizza-slice": "🍕",
  "utensils": "🍽️",
};

export default function TopItems() {
  const { data: topItems, isLoading } = useQuery<TopItem[]>({
    queryKey: ["/api/dashboard/top-items"],
  });

  if (isLoading) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Top Predicted Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topItems || topItems.length === 0) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Top Predicted Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-onSurfaceSecondary py-8">
            No prediction data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-shadow" data-testid="card-top-items">
      <CardHeader>
        <CardTitle>Top Predicted Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between" data-testid={`item-${item.itemName.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-lg">{iconMap[item.icon] || iconMap["utensils"]}</span>
                </div>
                <div>
                  <p className="font-medium text-onSurface">{item.itemName}</p>
                  <p className="text-sm text-onSurfaceSecondary">
                    {item.predictedQuantity} predicted orders
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-medium ${item.change >= 0 ? 'text-secondary' : 'text-error'}`}>
                  {item.change >= 0 ? '+' : ''}{item.change}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
