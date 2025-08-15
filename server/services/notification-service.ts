import { Inventory, SalesData, Prediction } from "@shared/schema";

export interface NotificationRule {
  id: string;
  name: string;
  type: 'inventory_low' | 'demand_spike' | 'model_drift' | 'anomaly_detected' | 'restock_needed';
  enabled: boolean;
  threshold: number;
  conditions: Record<string, any>;
  channels: ('email' | 'sms' | 'push' | 'dashboard')[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface NotificationEvent {
  id: string;
  ruleId: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  data: Record<string, any>;
  timestamp: Date;
  acknowledged: boolean;
  actionRequired: boolean;
}

export interface AlertThresholds {
  lowStockPercentage: number;
  demandSpikeMultiplier: number;
  accuracyDropThreshold: number;
  anomalyScoreThreshold: number;
  reorderDaysThreshold: number;
}

export class NotificationService {
  private notifications: Map<string, NotificationEvent> = new Map();
  private rules: Map<string, NotificationRule> = new Map();
  private alertThresholds: AlertThresholds;

  constructor() {
    this.alertThresholds = {
      lowStockPercentage: 0.2, // 20% of max stock
      demandSpikeMultiplier: 2.0, // 2x normal demand
      accuracyDropThreshold: 0.15, // 15% drop in accuracy
      anomalyScoreThreshold: 2.5, // Z-score threshold
      reorderDaysThreshold: 3 // Days until stockout
    };

    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    const defaultRules: NotificationRule[] = [
      {
        id: 'low-stock-alert',
        name: 'Low Stock Alert',
        type: 'inventory_low',
        enabled: true,
        threshold: this.alertThresholds.lowStockPercentage,
        conditions: { checkFrequency: 'hourly' },
        channels: ['dashboard', 'email'],
        priority: 'high'
      },
      {
        id: 'demand-spike-alert',
        name: 'Demand Spike Detection',
        type: 'demand_spike',
        enabled: true,
        threshold: this.alertThresholds.demandSpikeMultiplier,
        conditions: { timeWindow: '24h' },
        channels: ['dashboard', 'push'],
        priority: 'medium'
      },
      {
        id: 'model-drift-alert',
        name: 'Model Performance Degradation',
        type: 'model_drift',
        enabled: true,
        threshold: this.alertThresholds.accuracyDropThreshold,
        conditions: { evaluationPeriod: '7d' },
        channels: ['dashboard', 'email'],
        priority: 'critical'
      },
      {
        id: 'restock-needed',
        name: 'Restock Recommendation',
        type: 'restock_needed',
        enabled: true,
        threshold: this.alertThresholds.reorderDaysThreshold,
        conditions: { leadTime: 2 },
        channels: ['dashboard', 'email'],
        priority: 'high'
      }
    ];

    defaultRules.forEach(rule => this.rules.set(rule.id, rule));
  }

  /**
   * Check inventory levels and trigger low stock alerts
   */
  checkInventoryLevels(inventory: Inventory[]): NotificationEvent[] {
    const events: NotificationEvent[] = [];
    const lowStockRule = this.rules.get('low-stock-alert');
    
    if (!lowStockRule?.enabled) return events;

    inventory.forEach(item => {
      const stockPercentage = item.currentStock / item.maxStock;
      
      if (stockPercentage <= lowStockRule.threshold) {
        const event: NotificationEvent = {
          id: `low-stock-${item.id}-${Date.now()}`,
          ruleId: lowStockRule.id,
          type: 'inventory_low',
          title: 'Low Stock Alert',
          message: `${item.itemName} is running low (${item.currentStock} units remaining, ${Math.round(stockPercentage * 100)}% of capacity)`,
          priority: stockPercentage <= 0.1 ? 'critical' : 'high',
          data: {
            itemId: item.id,
            itemName: item.itemName,
            currentStock: item.currentStock,
            minimumStock: item.minimumStock,
            maxStock: item.maxStock,
            stockPercentage
          },
          timestamp: new Date(),
          acknowledged: false,
          actionRequired: true
        };

        this.notifications.set(event.id, event);
        events.push(event);
      }
    });

    return events;
  }

  /**
   * Detect demand spikes and anomalies
   */
  checkDemandAnomalies(
    currentSales: SalesData[], 
    historicalAverage: number
  ): NotificationEvent[] {
    const events: NotificationEvent[] = [];
    const demandRule = this.rules.get('demand-spike-alert');
    
    if (!demandRule?.enabled) return events;

    const currentDemand = currentSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const demandRatio = historicalAverage > 0 ? currentDemand / historicalAverage : 1;

    if (demandRatio >= demandRule.threshold) {
      const event: NotificationEvent = {
        id: `demand-spike-${Date.now()}`,
        ruleId: demandRule.id,
        type: 'demand_spike',
        title: 'Demand Spike Detected',
        message: `Current demand is ${demandRatio.toFixed(1)}x higher than average (${currentDemand} vs ${historicalAverage.toFixed(0)} units)`,
        priority: demandRatio >= 3 ? 'critical' : 'medium',
        data: {
          currentDemand,
          historicalAverage,
          demandRatio,
          itemsAffected: currentSales.map(s => s.itemName)
        },
        timestamp: new Date(),
        acknowledged: false,
        actionRequired: true
      };

      this.notifications.set(event.id, event);
      events.push(event);
    }

    return events;
  }

  /**
   * Monitor model performance and detect drift
   */
  checkModelPerformance(
    currentAccuracy: number, 
    baselineAccuracy: number
  ): NotificationEvent[] {
    const events: NotificationEvent[] = [];
    const driftRule = this.rules.get('model-drift-alert');
    
    if (!driftRule?.enabled) return events;

    const accuracyDrop = baselineAccuracy - currentAccuracy;
    
    if (accuracyDrop >= driftRule.threshold) {
      const event: NotificationEvent = {
        id: `model-drift-${Date.now()}`,
        ruleId: driftRule.id,
        type: 'model_drift',
        title: 'Model Performance Degradation',
        message: `Model accuracy has dropped by ${(accuracyDrop * 100).toFixed(1)}% (from ${(baselineAccuracy * 100).toFixed(1)}% to ${(currentAccuracy * 100).toFixed(1)}%)`,
        priority: 'critical',
        data: {
          currentAccuracy,
          baselineAccuracy,
          accuracyDrop,
          recommendedAction: 'retrain_model'
        },
        timestamp: new Date(),
        acknowledged: false,
        actionRequired: true
      };

      this.notifications.set(event.id, event);
      events.push(event);
    }

    return events;
  }

  /**
   * Generate restock recommendations based on predictions
   */
  generateRestockAlerts(
    inventory: Inventory[], 
    predictions: Prediction[]
  ): NotificationEvent[] {
    const events: NotificationEvent[] = [];
    const restockRule = this.rules.get('restock-needed');
    
    if (!restockRule?.enabled) return events;

    inventory.forEach(item => {
      const prediction = predictions.find(p => p.itemName === item.itemName);
      if (!prediction) return;

      const daysUntilStockout = item.currentStock / (prediction.predictedQuantity || 1);
      
      if (daysUntilStockout <= restockRule.threshold) {
        const recommendedOrderQuantity = Math.max(
          item.minimumStock,
          prediction.predictedQuantity * 7 // Week's supply
        );

        const event: NotificationEvent = {
          id: `restock-${item.id}-${Date.now()}`,
          ruleId: restockRule.id,
          type: 'restock_needed',
          title: 'Restock Recommendation',
          message: `${item.itemName} needs restocking. Predicted to run out in ${daysUntilStockout.toFixed(1)} days`,
          priority: daysUntilStockout <= 1 ? 'critical' : 'high',
          data: {
            itemId: item.id,
            itemName: item.itemName,
            currentStock: item.currentStock,
            predictedDemand: prediction.predictedQuantity,
            daysUntilStockout,
            recommendedOrderQuantity,
            confidence: prediction.confidence
          },
          timestamp: new Date(),
          acknowledged: false,
          actionRequired: true
        };

        this.notifications.set(event.id, event);
        events.push(event);
      }
    });

    return events;
  }

  /**
   * Get all active notifications
   */
  getActiveNotifications(): NotificationEvent[] {
    return Array.from(this.notifications.values())
      .filter(n => !n.acknowledged)
      .sort((a, b) => {
        // Sort by priority then by timestamp
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
  }

  /**
   * Acknowledge a notification
   */
  acknowledgeNotification(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Get notification summary for dashboard
   */
  getNotificationSummary(): {
    total: number;
    byPriority: Record<string, number>;
    recentCount: number;
  } {
    const active = this.getActiveNotifications();
    const byPriority: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    active.forEach(n => {
      byPriority[n.priority] = (byPriority[n.priority] || 0) + 1;
    });

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = active.filter(n => n.timestamp > oneHourAgo).length;

    return {
      total: active.length,
      byPriority,
      recentCount
    };
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(newThresholds: Partial<AlertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...newThresholds };
    
    // Update corresponding rules
    Object.entries(newThresholds).forEach(([key, value]) => {
      switch (key) {
        case 'lowStockPercentage':
          const lowStockRule = this.rules.get('low-stock-alert');
          if (lowStockRule) lowStockRule.threshold = value;
          break;
        case 'demandSpikeMultiplier':
          const demandRule = this.rules.get('demand-spike-alert');
          if (demandRule) demandRule.threshold = value;
          break;
        // Add other mappings as needed
      }
    });
  }

  /**
   * Get notification rule configuration
   */
  getNotificationRules(): NotificationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Update notification rule
   */
  updateNotificationRule(ruleId: string, updates: Partial<NotificationRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      Object.assign(rule, updates);
      return true;
    }
    return false;
  }

  /**
   * Comprehensive monitoring check
   */
  async performMonitoringCheck(
    inventory: Inventory[],
    recentSales: SalesData[],
    predictions: Prediction[],
    modelAccuracy: number,
    baselineAccuracy: number = 0.9
  ): Promise<NotificationEvent[]> {
    const allEvents: NotificationEvent[] = [];

    // Check all monitoring categories
    allEvents.push(...this.checkInventoryLevels(inventory));
    
    if (recentSales.length > 0) {
      const avgHistoricalDemand = 100; // This should come from historical analysis
      allEvents.push(...this.checkDemandAnomalies(recentSales, avgHistoricalDemand));
    }

    allEvents.push(...this.checkModelPerformance(modelAccuracy, baselineAccuracy));
    allEvents.push(...this.generateRestockAlerts(inventory, predictions));

    return allEvents;
  }
}

export const notificationService = new NotificationService();