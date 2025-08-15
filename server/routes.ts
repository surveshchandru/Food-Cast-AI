import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { forecastingService } from "./services/forecasting";
import { advancedForecastingService } from "./services/advanced-forecasting";
import { notificationService } from "./services/notification-service";
import { realTimeAnalyticsService } from "./services/real-time-analytics";
import { insertSalesDataSchema, insertPredictionSchema, insertInventorySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));
      const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
      const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));
      
      const todaySales = await storage.getSalesDataByDateRange(todayStart, todayEnd);
      const yesterdaySales = await storage.getSalesDataByDateRange(yesterdayStart, yesterdayEnd);
      const predictions = await storage.getPredictionsByDate(new Date());
      const modelMetrics = await storage.getLatestModelMetrics();
      
      const todayDemand = todaySales.reduce((sum, sale) => sum + sale.quantity, 0);
      const yesterdayDemand = yesterdaySales.reduce((sum, sale) => sum + sale.quantity, 0);
      const demandChange = yesterdayDemand > 0 ? ((todayDemand - yesterdayDemand) / yesterdayDemand) * 100 : 0;
      
      const topPrediction = predictions.sort((a, b) => b.predictedQuantity - a.predictedQuantity)[0];
      const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.revenue, 0);
      
      res.json({
        todayDemand,
        demandChange,
        forecastAccuracy: modelMetrics?.accuracy || 0.942,
        topItem: topPrediction?.itemName || "No predictions",
        topItemPrediction: topPrediction?.predictedQuantity || 0,
        revenueForecast: Math.round(totalRevenue * 1.1), // Simple 10% growth projection
        modelMetrics,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Demand trends for charts
  app.get("/api/dashboard/trends", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const salesData = await storage.getSalesData();
      const trends = forecastingService.generateDemandTrends(salesData, days);
      res.json(trends);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch demand trends" });
    }
  });

  // Top predicted items
  app.get("/api/dashboard/top-items", async (req, res) => {
    try {
      const today = new Date();
      const predictions = await storage.getPredictionsByDate(today);
      const topItems = predictions
        .slice(0, 4)
        .map(prediction => ({
          ...prediction,
          icon: getItemIcon(prediction.category),
          change: Math.floor(Math.random() * 30) - 5, // Mock change percentage
        }));
      res.json(topItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch top items" });
    }
  });

  // Inventory recommendations
  app.get("/api/inventory/recommendations", async (req, res) => {
    try {
      const inventory = await storage.getInventory();
      const today = new Date();
      const predictions = await storage.getPredictionsByDate(today);
      
      const recommendations = inventory.map(item => {
        const prediction = predictions.find(p => p.itemName === item.itemName);
        const predictedDemand = prediction?.predictedQuantity || 0;
        const needsRestock = predictedDemand > item.currentStock;
        
        return {
          ...item,
          predictedDemand,
          confidence: prediction?.confidence || 0.5,
          needsRestock,
          action: needsRestock ? 'Restock' : 'Monitor',
          icon: getItemIcon(item.category),
        };
      });
      
      res.json(recommendations.sort((a, b) => (b.needsRestock ? 1 : 0) - (a.needsRestock ? 1 : 0)));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory recommendations" });
    }
  });

  // Generate new predictions
  app.post("/api/predictions/generate", async (req, res) => {
    try {
      const salesData = await storage.getSalesData();
      const { predictions, metrics } = await forecastingService.generateForecasts(salesData);
      
      // Store predictions
      await storage.bulkCreatePredictions(predictions);
      
      // Update model metrics
      await storage.createModelMetrics({
        modelName: "Time Series LSTM",
        accuracy: metrics.accuracy,
        rmse: metrics.rmse,
        f1Score: metrics.f1Score,
        precision: metrics.precision,
        recall: metrics.recall,
        lastTraining: new Date(),
      });
      
      res.json({ predictions, metrics });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate predictions" });
    }
  });

  // Sales data operations
  app.get("/api/sales", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || undefined;
      const salesData = await storage.getSalesData(limit);
      res.json(salesData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales data" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const validatedData = insertSalesDataSchema.parse(req.body);
      const salesData = await storage.createSalesData(validatedData);
      res.json(salesData);
    } catch (error) {
      res.status(400).json({ message: "Invalid sales data format" });
    }
  });

  app.post("/api/sales/bulk", async (req, res) => {
    try {
      const salesDataArray = req.body;
      if (!Array.isArray(salesDataArray)) {
        return res.status(400).json({ message: "Expected array of sales data" });
      }
      
      const validatedData = salesDataArray.map(item => insertSalesDataSchema.parse(item));
      const results = await storage.bulkCreateSalesData(validatedData);
      res.json(results);
    } catch (error) {
      res.status(400).json({ message: "Invalid sales data format" });
    }
  });

  // Inventory operations
  app.get("/api/inventory", async (req, res) => {
    try {
      const inventory = await storage.getInventory();
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const validatedData = insertInventorySchema.parse(req.body);
      const inventory = await storage.createInventory(validatedData);
      res.json(inventory);
    } catch (error) {
      res.status(400).json({ message: "Invalid inventory data format" });
    }
  });

  app.patch("/api/inventory/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const inventory = await storage.updateInventory(id, updates);
      
      if (!inventory) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      res.json(inventory);
    } catch (error) {
      res.status(400).json({ message: "Failed to update inventory" });
    }
  });

  // Model metrics
  app.get("/api/model/metrics", async (req, res) => {
    try {
      const metrics = await storage.getLatestModelMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch model metrics" });
    }
  });

  // Advanced Forecasting Routes
  app.post("/api/forecasting/advanced", async (req, res) => {
    try {
      const { options = { period: 'daily', horizon: 7 } } = req.body;
      const salesData = await storage.getSalesData();
      const results = await advancedForecastingService.generateAdvancedForecasts(salesData, options);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate advanced forecasts" });
    }
  });

  app.get("/api/forecasting/ensemble/:itemName", async (req, res) => {
    try {
      const { itemName } = req.params;
      const salesData = await storage.getSalesData();
      const itemSales = salesData.filter(sale => sale.itemName === itemName);
      const results = await advancedForecastingService.generateAdvancedForecasts(itemSales);
      res.json(results[0] || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate ensemble forecast" });
    }
  });

  // Real-time Analytics Routes
  app.get("/api/analytics/real-time/metrics", async (req, res) => {
    try {
      const metrics = realTimeAnalyticsService.getCurrentMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch real-time metrics" });
    }
  });

  app.get("/api/analytics/real-time/kpis", async (req, res) => {
    try {
      const kpis = realTimeAnalyticsService.getAllKPIs();
      res.json(kpis);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch KPIs" });
    }
  });

  app.get("/api/analytics/real-time/streams", async (req, res) => {
    try {
      const { type, limit = 50 } = req.query;
      const streams = realTimeAnalyticsService.getLiveStreams(type as string, parseInt(limit as string));
      res.json(streams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch live streams" });
    }
  });

  app.get("/api/analytics/performance-insights", async (req, res) => {
    try {
      const insights = realTimeAnalyticsService.calculatePerformanceInsights();
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate performance insights" });
    }
  });

  app.get("/api/analytics/metrics-history", async (req, res) => {
    try {
      const { hours = 24 } = req.query;
      const history = realTimeAnalyticsService.getMetricsHistory(parseInt(hours as string));
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch metrics history" });
    }
  });

  // Notification Routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const notifications = notificationService.getActiveNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/summary", async (req, res) => {
    try {
      const summary = notificationService.getNotificationSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notification summary" });
    }
  });

  app.post("/api/notifications/:id/acknowledge", async (req, res) => {
    try {
      const { id } = req.params;
      const success = notificationService.acknowledgeNotification(id);
      if (success) {
        res.json({ message: "Notification acknowledged" });
      } else {
        res.status(404).json({ message: "Notification not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to acknowledge notification" });
    }
  });

  app.get("/api/notifications/rules", async (req, res) => {
    try {
      const rules = notificationService.getNotificationRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notification rules" });
    }
  });

  app.patch("/api/notifications/rules/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const success = notificationService.updateNotificationRule(id, updates);
      if (success) {
        res.json({ message: "Rule updated successfully" });
      } else {
        res.status(404).json({ message: "Rule not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update notification rule" });
    }
  });

  app.post("/api/notifications/check", async (req, res) => {
    try {
      const inventory = await storage.getInventory();
      const recentSales = await storage.getSalesData(100);
      const predictions = await storage.getPredictions(50);
      const modelMetrics = await storage.getLatestModelMetrics();
      
      const events = await notificationService.performMonitoringCheck(
        inventory, 
        recentSales, 
        predictions, 
        modelMetrics?.accuracy || 0.9
      );
      
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to perform monitoring check" });
    }
  });

  // External Data Integration Routes
  app.get("/api/external-data/sources", async (req, res) => {
    try {
      // In production, this would fetch from database
      const sources = [
        { id: 'weather-api', name: 'Weather Data', type: 'weather', enabled: false },
        { id: 'holiday-api', name: 'Holiday Calendar', type: 'holidays', enabled: true },
        { id: 'market-trends', name: 'Market Trends', type: 'market', enabled: false }
      ];
      res.json(sources);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch data sources" });
    }
  });

  app.post("/api/external-data/sync/:sourceId", async (req, res) => {
    try {
      const { sourceId } = req.params;
      const success = await realTimeAnalyticsService.syncExternalData(sourceId);
      if (success) {
        res.json({ message: "Data source synchronized successfully" });
      } else {
        res.status(400).json({ message: "Failed to sync data source" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error syncing data source" });
    }
  });

  app.get("/api/external-data/:sourceId", async (req, res) => {
    try {
      const { sourceId } = req.params;
      const data = realTimeAnalyticsService.getExternalData(sourceId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch external data" });
    }
  });

  // Dashboard Widget Configuration
  app.get("/api/dashboard/widgets", async (req, res) => {
    try {
      const widgets = realTimeAnalyticsService.getDashboardWidgets();
      res.json(widgets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard widgets" });
    }
  });

  app.post("/api/dashboard/widgets", async (req, res) => {
    try {
      const widget = req.body;
      realTimeAnalyticsService.setDashboardWidget(widget);
      res.json({ message: "Widget configured successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to configure widget" });
    }
  });

  // What-if Scenario Analysis
  app.post("/api/analytics/scenario", async (req, res) => {
    try {
      const { baseData, modifications } = req.body;
      
      // Apply scenario modifications to historical data
      const modifiedData = baseData.map((item: any) => ({
        ...item,
        quantity: modifications.demandMultiplier ? 
          item.quantity * modifications.demandMultiplier : item.quantity,
        revenue: modifications.priceChange ? 
          item.revenue * (1 + modifications.priceChange) : item.revenue
      }));

      // Generate forecasts with modified data
      const results = await advancedForecastingService.generateAdvancedForecasts(modifiedData);
      
      res.json({
        scenario: modifications,
        originalPredictions: baseData,
        modifiedPredictions: results,
        impact: {
          demandChange: modifications.demandMultiplier || 1,
          revenueChange: modifications.priceChange || 0,
          forecastAccuracy: results.reduce((sum, r) => sum + r.ensembleConfidence[0], 0) / results.length
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze scenario" });
    }
  });

  // Menu Optimization Recommendations
  app.get("/api/analytics/menu-optimization", async (req, res) => {
    try {
      const salesData = await storage.getSalesData();
      const inventory = await storage.getInventory();
      
      // Group sales by category and calculate profitability
      const categoryPerformance = salesData.reduce((acc, sale) => {
        if (!acc[sale.category]) {
          acc[sale.category] = { totalRevenue: 0, totalQuantity: 0, items: new Set() };
        }
        acc[sale.category].totalRevenue += sale.revenue;
        acc[sale.category].totalQuantity += sale.quantity;
        acc[sale.category].items.add(sale.itemName);
        return acc;
      }, {} as Record<string, any>);

      // Generate recommendations
      const recommendations = Object.entries(categoryPerformance).map(([category, performance]) => {
        const avgPrice = performance.totalRevenue / performance.totalQuantity;
        const profitability = performance.totalRevenue / performance.items.size; // Revenue per unique item
        
        return {
          category,
          performance: performance.totalRevenue > 10000 ? 'high' : 
                     performance.totalRevenue > 5000 ? 'medium' : 'low',
          avgPrice,
          profitability,
          recommendation: profitability > 1000 ? 
            'Expand menu items in this category' : 
            'Consider optimizing or reducing items in this category',
          priority: profitability > 1000 ? 'high' : 'medium'
        };
      });

      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate menu optimization recommendations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function getItemIcon(category: string): string {
  const iconMap: Record<string, string> = {
    "Main Dishes": "drumstick-bite",
    "Appetizers": "seedling",
    "Beverages": "coffee",
    "Desserts": "ice-cream",
  };
  return iconMap[category] || "utensils";
}
