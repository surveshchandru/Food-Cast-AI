import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSalesDataSchema } from "@shared/schema";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Plus } from "lucide-react";
import { useState } from "react";

const formSchema = insertSalesDataSchema.extend({
  date: z.string().min(1, "Date is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function DataInput() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bulkData, setBulkData] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: "",
      category: "Main Dishes",
      quantity: 1,
      revenue: 0,
      date: new Date().toISOString().split('T')[0],
    },
  });

  const createSalesDataMutation = useMutation({
    mutationFn: (data: FormData) => {
      const salesData = {
        ...data,
        date: new Date(data.date),
      };
      return apiRequest("POST", "/api/sales", salesData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sales data has been added successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add sales data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: (data: FormData[]) => apiRequest("POST", "/api/sales/bulk", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bulk sales data has been uploaded successfully.",
      });
      setBulkData("");
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload bulk data. Please check the format and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createSalesDataMutation.mutate(data);
  };

  const handleBulkUpload = () => {
    try {
      const lines = bulkData.trim().split('\n');
      const data: FormData[] = lines.map(line => {
        const [itemName, category, quantity, revenue, date] = line.split(',');
        return {
          itemName: itemName.trim(),
          category: category.trim(),
          quantity: parseInt(quantity.trim()),
          revenue: parseFloat(revenue.trim()),
          date: date.trim(),
        };
      });
      
      bulkUploadMutation.mutate(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid bulk data format. Please check your input.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-onSurface">Data Input</h1>
        <p className="text-onSurfaceSecondary">Add historical sales data to improve prediction accuracy</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single Entry Form */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Add Single Entry</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="itemName">Item Name</Label>
                <Input
                  id="itemName"
                  {...form.register("itemName")}
                  placeholder="e.g., Grilled Chicken"
                  data-testid="input-item-name"
                />
                {form.formState.errors.itemName && (
                  <p className="text-sm text-error mt-1">{form.formState.errors.itemName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(value) => form.setValue("category", value)} defaultValue="Main Dishes">
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Main Dishes">Main Dishes</SelectItem>
                    <SelectItem value="Appetizers">Appetizers</SelectItem>
                    <SelectItem value="Beverages">Beverages</SelectItem>
                    <SelectItem value="Desserts">Desserts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    {...form.register("quantity", { valueAsNumber: true })}
                    data-testid="input-quantity"
                  />
                  {form.formState.errors.quantity && (
                    <p className="text-sm text-error mt-1">{form.formState.errors.quantity.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="revenue">Revenue ($)</Label>
                  <Input
                    id="revenue"
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register("revenue", { valueAsNumber: true })}
                    data-testid="input-revenue"
                  />
                  {form.formState.errors.revenue && (
                    <p className="text-sm text-error mt-1">{form.formState.errors.revenue.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  {...form.register("date")}
                  data-testid="input-date"
                />
                {form.formState.errors.date && (
                  <p className="text-sm text-error mt-1">{form.formState.errors.date.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createSalesDataMutation.isPending}
                data-testid="button-add-entry"
              >
                {createSalesDataMutation.isPending ? "Adding..." : "Add Entry"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Bulk Upload */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Bulk Upload</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulkData">CSV Data</Label>
                <p className="text-sm text-onSurfaceSecondary mb-2">
                  Format: Item Name, Category, Quantity, Revenue, Date (YYYY-MM-DD)
                </p>
                <Textarea
                  id="bulkData"
                  placeholder="Grilled Chicken, Main Dishes, 25, 375.00, 2024-01-15&#10;Salmon Bowl, Main Dishes, 18, 324.00, 2024-01-15"
                  rows={8}
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  data-testid="textarea-bulk-data"
                />
              </div>

              <Button
                onClick={handleBulkUpload}
                className="w-full"
                disabled={bulkUploadMutation.isPending || !bulkData.trim()}
                data-testid="button-bulk-upload"
              >
                {bulkUploadMutation.isPending ? "Uploading..." : "Upload Bulk Data"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File Upload Section */}
      <Card className="card-shadow mt-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>File Upload</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
            <Upload className="h-12 w-12 text-onSurfaceSecondary mx-auto mb-4" />
            <p className="text-lg font-medium text-onSurface mb-2">Drop CSV file here</p>
            <p className="text-sm text-onSurfaceSecondary mb-4">or click to browse</p>
            <Button variant="outline" data-testid="button-file-upload">
              Choose File
            </Button>
            <div className="mt-4 text-xs text-onSurfaceSecondary">
              <p>Supported format: CSV</p>
              <p>Maximum file size: 10MB</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
