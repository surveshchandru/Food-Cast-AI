import { SalesData, Inventory, Prediction } from "@shared/schema";
import { EventEmitter } from 'events';

export interface RealTimeMetrics {
  timestamp: Date;
  totalSales: number;
  totalRevenue: number;
  activeItems: number;
  averageOrderValue: number;
  topPerformingCategory: string;
  inventoryTurnover: number;
  demandForecastAccuracy: number;
  alerts: number;
}

export interface LiveDataStream {
  id: string;
  type: 'sales' | 'inventory' | 'predictions' | 'alerts';
  data: any;
  timestamp: Date;
}

export interface PerformanceKPI {
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  unit: string;
  category: 'sales' | 'inventory' | 'accuracy' | 'efficiency';
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'table' | 'alert';
  data: any;
  refreshRate: number; // seconds
  lastUpdated: Date;
  position: { x: number; y: number; width: number; height: number };
}

export interface ExternalDataSource {
  id: string;
  name: string;
  type: 'weather' | 'holidays' | 'social' | 'competitor' | 'market';
  endpoint: string;
  apiKey?: string;
  refreshInterval: number; // minutes
  enabled: boolean;
  lastSync: Date | null;
  dataCache: any;
}

export class RealTimeAnalyticsService extends EventEmitter {
  private metrics: RealTimeMetrics[] = [];
  private liveStreams: Map<string, LiveDataStream> = new Map();
  private kpis: Map<string, PerformanceKPI> = new Map();
  private widgets: Map<string, DashboardWidget> = new Map();
  private dataSources: Map<string, ExternalDataSource> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeKPIs();
    this.initializeDataSources();
    this.startRealTimeUpdates();
  }

  private initializeKPIs(): void {
    const defaultKPIs: PerformanceKPI[] = [
      {
        name: 'Daily Sales Volume',
        value: 0,
        target: 1000,
        trend: 'stable',
        change: 0,
        unit: 'units',
        category: 'sales'
      },
      {
        name: 'Revenue Growth',
        value: 0,
        target: 15,
        trend: 'up',
        change: 0,
        unit: '%',
        category: 'sales'
      },
      {
        name: 'Inventory Turnover',
        value: 0,
        target: 12,
        trend: 'stable',
        change: 0,
        unit: 'times/year',
        category: 'inventory'
      },
      {
        name: 'Forecast Accuracy',
        value: 0,
        target: 90,
        trend: 'up',
        change: 0,
        unit: '%',
        category: 'accuracy'
      },
      {
        name: 'Stockout Prevention',
        value: 0,
        target: 95,
        trend: 'stable',
        change: 0,
        unit: '%',
        category: 'efficiency'
      }
    ];

    defaultKPIs.forEach(kpi => this.kpis.set(kpi.name, kpi));
  }

  private initializeDataSources(): void {
    const defaultSources: ExternalDataSource[] = [
      {
        id: 'weather-api',
        name: 'Weather Data',
        type: 'weather',
        endpoint: 'https://api.openweathermap.org/data/2.5/weather',
        refreshInterval: 60,
        enabled: false,
        lastSync: null,
        dataCache: null
      },
      {
        id: 'holiday-api',
        name: 'Holiday Calendar',
        type: 'holidays',
        endpoint: 'https://api.api-ninjas.com/v1/holidays',
        refreshInterval: 1440, // Daily
        enabled: true,
        lastSync: null,
        dataCache: null
      },
      {
        id: 'market-trends',
        name: 'Market Trends',
        type: 'market',
        endpoint: 'https://api.example.com/market-trends',
        refreshInterval: 240, // 4 hours
        enabled: false,
        lastSync: null,
        dataCache: null
      }
    ];

    defaultSources.forEach(source => this.dataSources.set(source.id, source));
  }

  private startRealTimeUpdates(): void {
    // Update metrics every 30 seconds
    this.updateInterval = setInterval(() => {
      this.updateRealTimeMetrics();
      this.emit('metrics-updated', this.getCurrentMetrics());
    }, 30000);
  }

  /**
   * Calculate real-time metrics from current data
   */
  private updateRealTimeMetrics(): void {
    // This would be called with actual data in production
    const mockMetrics: RealTimeMetrics = {
      timestamp: new Date(),
      totalSales: Math.floor(Math.random() * 1000) + 500,
      totalRevenue: Math.floor(Math.random() * 50000) + 25000,
      activeItems: Math.floor(Math.random() * 50) + 100,
      averageOrderValue: Math.floor(Math.random() * 100) + 50,
      topPerformingCategory: ['Main Courses', 'Beverages', 'Desserts'][Math.floor(Math.random() * 3)],
      inventoryTurnover: Math.random() * 5 + 8,
      demandForecastAccuracy: Math.random() * 0.2 + 0.8,
      alerts: Math.floor(Math.random() * 5)
    };

    this.metrics.push(mockMetrics);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Process live sales data and update streams
   */
  processSalesUpdate(salesData: SalesData[]): void {
    const stream: LiveDataStream = {
      id: `sales-${Date.now()}`,
      type: 'sales',
      data: {
        totalTransactions: salesData.length,
        totalRevenue: salesData.reduce((sum, sale) => sum + sale.revenue, 0),
        itemsSold: salesData.reduce((sum, sale) => sum + sale.quantity, 0),
        categories: this.groupByCategory(salesData)
      },
      timestamp: new Date()
    };

    this.liveStreams.set(stream.id, stream);
    this.emit('sales-update', stream);
    
    // Update KPIs
    this.updateSalesKPIs(salesData);
  }

  /**
   * Process inventory changes and update streams
   */
  processInventoryUpdate(inventory: Inventory[]): void {
    const lowStockItems = inventory.filter(item => 
      item.currentStock <= item.minimumStock
    );

    const stream: LiveDataStream = {
      id: `inventory-${Date.now()}`,
      type: 'inventory',
      data: {
        totalItems: inventory.length,
        lowStockCount: lowStockItems.length,
        totalValue: inventory.reduce((sum, item) => sum + (item.currentStock * 10), 0), // Assuming $10 per unit
        turnoverRate: this.calculateInventoryTurnover(inventory)
      },
      timestamp: new Date()
    };

    this.liveStreams.set(stream.id, stream);
    this.emit('inventory-update', stream);
    
    // Update inventory KPIs
    this.updateInventoryKPIs(inventory);
  }

  /**
   * Process prediction updates
   */
  processPredictionUpdate(predictions: Prediction[]): void {
    const stream: LiveDataStream = {
      id: `predictions-${Date.now()}`,
      type: 'predictions',
      data: {
        totalPredictions: predictions.length,
        averageConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length,
        highConfidencePredictions: predictions.filter(p => p.confidence > 0.8).length,
        predictedDemand: predictions.reduce((sum, p) => sum + p.predictedQuantity, 0)
      },
      timestamp: new Date()
    };

    this.liveStreams.set(stream.id, stream);
    this.emit('predictions-update', stream);
    
    // Update accuracy KPIs
    this.updateAccuracyKPIs(predictions);
  }

  /**
   * Get current real-time metrics
   */
  getCurrentMetrics(): RealTimeMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get metrics history for specified time range
   */
  getMetricsHistory(hours: number = 24): RealTimeMetrics[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp > cutoffTime);
  }

  /**
   * Get all KPIs with current values
   */
  getAllKPIs(): PerformanceKPI[] {
    return Array.from(this.kpis.values());
  }

  /**
   * Update KPI value and calculate trend
   */
  updateKPI(name: string, newValue: number): void {
    const kpi = this.kpis.get(name);
    if (kpi) {
      const previousValue = kpi.value;
      kpi.change = newValue - previousValue;
      kpi.value = newValue;
      
      // Determine trend
      if (Math.abs(kpi.change) < 0.01) {
        kpi.trend = 'stable';
      } else if (kpi.change > 0) {
        kpi.trend = 'up';
      } else {
        kpi.trend = 'down';
      }

      this.emit('kpi-updated', { name, kpi });
    }
  }

  /**
   * Get live data streams for dashboard
   */
  getLiveStreams(type?: string, limit: number = 50): LiveDataStream[] {
    const streams = Array.from(this.liveStreams.values());
    const filtered = type ? streams.filter(s => s.type === type) : streams;
    return filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Configure dashboard widget
   */
  setDashboardWidget(widget: DashboardWidget): void {
    this.widgets.set(widget.id, widget);
    this.emit('widget-updated', widget);
  }

  /**
   * Get dashboard widgets
   */
  getDashboardWidgets(): DashboardWidget[] {
    return Array.from(this.widgets.values())
      .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
  }

  /**
   * External data source management
   */
  async syncExternalData(sourceId: string): Promise<boolean> {
    const source = this.dataSources.get(sourceId);
    if (!source || !source.enabled) return false;

    try {
      // Simulate API call (in production, make actual HTTP request)
      const mockData = this.generateMockExternalData(source.type);
      
      source.dataCache = mockData;
      source.lastSync = new Date();
      
      this.emit('external-data-synced', { sourceId, data: mockData });
      return true;
    } catch (error) {
      console.error(`Failed to sync external data source ${sourceId}:`, error);
      return false;
    }
  }

  /**
   * Get cached external data
   */
  getExternalData(sourceId: string): any {
    const source = this.dataSources.get(sourceId);
    return source?.dataCache || null;
  }

  /**
   * Configure external data source
   */
  configureDataSource(sourceId: string, config: Partial<ExternalDataSource>): boolean {
    const source = this.dataSources.get(sourceId);
    if (source) {
      Object.assign(source, config);
      return true;
    }
    return false;
  }

  /**
   * Performance analytics
   */
  calculatePerformanceInsights(): {
    efficiency: number;
    growth: number;
    accuracy: number;
    alerts: number;
  } {
    const recentMetrics = this.getMetricsHistory(1); // Last hour
    if (recentMetrics.length === 0) {
      return { efficiency: 0, growth: 0, accuracy: 0, alerts: 0 };
    }

    const latest = recentMetrics[recentMetrics.length - 1];
    const oldest = recentMetrics[0];

    const efficiency = (latest.inventoryTurnover / 12) * 100; // Normalized to yearly target
    const growth = recentMetrics.length > 1 ? 
      ((latest.totalRevenue - oldest.totalRevenue) / oldest.totalRevenue) * 100 : 0;
    const accuracy = latest.demandForecastAccuracy * 100;
    const alerts = latest.alerts;

    return { efficiency, growth, accuracy, alerts };
  }

  /**
   * Helper methods
   */
  private groupByCategory(salesData: SalesData[]): Record<string, number> {
    return salesData.reduce((groups, sale) => {
      groups[sale.category] = (groups[sale.category] || 0) + sale.quantity;
      return groups;
    }, {} as Record<string, number>);
  }

  private calculateInventoryTurnover(inventory: Inventory[]): number {
    // Simplified calculation - in production, use COGS/Average Inventory
    const totalStock = inventory.reduce((sum, item) => sum + item.currentStock, 0);
    const totalCapacity = inventory.reduce((sum, item) => sum + item.maxStock, 0);
    return totalCapacity > 0 ? (totalStock / totalCapacity) * 12 : 0;
  }

  private updateSalesKPIs(salesData: SalesData[]): void {
    const totalSales = salesData.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.revenue, 0);
    const avgOrderValue = salesData.length > 0 ? totalRevenue / salesData.length : 0;

    this.updateKPI('Daily Sales Volume', totalSales);
    this.updateKPI('Revenue Growth', avgOrderValue);
  }

  private updateInventoryKPIs(inventory: Inventory[]): void {
    const turnover = this.calculateInventoryTurnover(inventory);
    const stockoutPrevention = inventory.filter(item => 
      item.currentStock > item.minimumStock
    ).length / inventory.length * 100;

    this.updateKPI('Inventory Turnover', turnover);
    this.updateKPI('Stockout Prevention', stockoutPrevention);
  }

  private updateAccuracyKPIs(predictions: Prediction[]): void {
    const avgConfidence = predictions.length > 0 ? 
      predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length * 100 : 0;
    
    this.updateKPI('Forecast Accuracy', avgConfidence);
  }

  private generateMockExternalData(type: string): any {
    switch (type) {
      case 'weather':
        return {
          temperature: Math.floor(Math.random() * 30) + 10,
          condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)],
          humidity: Math.floor(Math.random() * 50) + 30
        };
      case 'holidays':
        return {
          isHoliday: Math.random() > 0.9,
          holidayName: 'Example Holiday',
          impact: Math.random() * 0.3 + 0.1
        };
      case 'market':
        return {
          trend: Math.random() > 0.5 ? 'bullish' : 'bearish',
          volatility: Math.random() * 0.2,
          sentiment: Math.random()
        };
      default:
        return {};
    }
  }

  /**
   * Cleanup method
   */
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.removeAllListeners();
  }
}

export const realTimeAnalyticsService = new RealTimeAnalyticsService();