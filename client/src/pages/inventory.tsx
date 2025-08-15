import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Package, AlertTriangle, CheckCircle } from "lucide-react";

interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  maxStock: number;
  updatedAt: string;
}

export default function Inventory() {
  const { data: inventory, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= item.minimumStock) return 'low';
    if (item.currentStock >= item.maxStock * 0.8) return 'high';
    return 'normal';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'low':
        return <Badge variant="destructive">Low Stock</Badge>;
      case 'high':
        return <Badge className="bg-secondary text-secondary-foreground">High Stock</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-error" />;
      case 'high':
        return <CheckCircle className="h-4 w-4 text-secondary" />;
      default:
        return <Package className="h-4 w-4 text-onSurfaceSecondary" />;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-onSurface">Inventory Management</h1>
        <p className="text-onSurfaceSecondary">Monitor and manage your food inventory levels</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="card-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-onSurfaceSecondary">Total Items</p>
                <p className="text-2xl font-bold text-onSurface">{inventory?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-error" />
              </div>
              <div>
                <p className="text-sm text-onSurfaceSecondary">Low Stock Items</p>
                <p className="text-2xl font-bold text-onSurface">
                  {inventory?.filter(item => getStockStatus(item) === 'low').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-onSurfaceSecondary">Well Stocked</p>
                <p className="text-2xl font-bold text-onSurface">
                  {inventory?.filter(item => getStockStatus(item) === 'normal').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Current Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : !inventory || inventory.length === 0 ? (
            <div className="text-center py-8 text-onSurfaceSecondary">
              No inventory data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-onSurfaceSecondary">Item</th>
                    <th className="text-left py-3 px-4 font-medium text-onSurfaceSecondary">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-onSurfaceSecondary">Current Stock</th>
                    <th className="text-left py-3 px-4 font-medium text-onSurfaceSecondary">Min/Max</th>
                    <th className="text-left py-3 px-4 font-medium text-onSurfaceSecondary">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-onSurfaceSecondary">Last Updated</th>
                    <th className="text-left py-3 px-4 font-medium text-onSurfaceSecondary">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {inventory.map((item) => {
                    const status = getStockStatus(item);
                    return (
                      <tr key={item.id} data-testid={`row-inventory-${item.itemName.toLowerCase().replace(/\s+/g, '-')}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(status)}
                            <span className="font-medium text-onSurface">{item.itemName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-onSurfaceSecondary">
                          {item.category}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-onSurface">
                            {item.currentStock} units
                          </span>
                        </td>
                        <td className="py-3 px-4 text-onSurfaceSecondary">
                          {item.minimumStock} / {item.maxStock}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(status)}
                        </td>
                        <td className="py-3 px-4 text-onSurfaceSecondary">
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant={status === 'low' ? 'default' : 'outline'}
                            size="sm"
                            data-testid={`button-restock-${item.itemName.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {status === 'low' ? 'Restock' : 'Update'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
