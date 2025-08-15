import { type User, type InsertUser, type SalesData, type InsertSalesData, type Prediction, type InsertPrediction, type Inventory, type InsertInventory, type ModelMetrics, type InsertModelMetrics } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Sales Data
  getSalesData(limit?: number): Promise<SalesData[]>;
  getSalesDataByDateRange(startDate: Date, endDate: Date): Promise<SalesData[]>;
  getSalesDataByCategory(category: string): Promise<SalesData[]>;
  createSalesData(data: InsertSalesData): Promise<SalesData>;
  bulkCreateSalesData(data: InsertSalesData[]): Promise<SalesData[]>;
  
  // Predictions
  getPredictions(limit?: number): Promise<Prediction[]>;
  getPredictionsByDate(date: Date): Promise<Prediction[]>;
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  bulkCreatePredictions(predictions: InsertPrediction[]): Promise<Prediction[]>;
  
  // Inventory
  getInventory(): Promise<Inventory[]>;
  getInventoryByItem(itemName: string): Promise<Inventory | undefined>;
  createInventory(inventory: InsertInventory): Promise<Inventory>;
  updateInventory(id: string, updates: Partial<Inventory>): Promise<Inventory | undefined>;
  
  // Model Metrics
  getLatestModelMetrics(): Promise<ModelMetrics | undefined>;
  createModelMetrics(metrics: InsertModelMetrics): Promise<ModelMetrics>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private salesData: Map<string, SalesData>;
  private predictions: Map<string, Prediction>;
  private inventory: Map<string, Inventory>;
  private modelMetrics: Map<string, ModelMetrics>;

  constructor() {
    this.users = new Map();
    this.salesData = new Map();
    this.predictions = new Map();
    this.inventory = new Map();
    this.modelMetrics = new Map();
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Initialize sample inventory
    const sampleInventory: InsertInventory[] = [
      { itemName: "Grilled Chicken", category: "Main Dishes", currentStock: 45, minimumStock: 20, maxStock: 100 },
      { itemName: "Salmon Bowl", category: "Main Dishes", currentStock: 78, minimumStock: 30, maxStock: 120 },
      { itemName: "Veggie Wrap", category: "Main Dishes", currentStock: 32, minimumStock: 15, maxStock: 80 },
      { itemName: "Margherita Pizza", category: "Main Dishes", currentStock: 56, minimumStock: 25, maxStock: 90 },
    ];

    sampleInventory.forEach(item => {
      const id = randomUUID();
      const inventoryItem: Inventory = { 
        ...item, 
        id, 
        updatedAt: new Date() 
      };
      this.inventory.set(id, inventoryItem);
    });

    // Initialize model metrics
    const metrics: InsertModelMetrics = {
      modelName: "Time Series LSTM",
      accuracy: 0.942,
      rmse: 0.087,
      f1Score: 0.912,
      precision: 0.897,
      recall: 0.928,
      lastTraining: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    };

    const metricsId = randomUUID();
    const modelMetrics: ModelMetrics = {
      ...metrics,
      id: metricsId,
      createdAt: new Date(),
    };
    this.modelMetrics.set(metricsId, modelMetrics);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getSalesData(limit?: number): Promise<SalesData[]> {
    const data = Array.from(this.salesData.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    return limit ? data.slice(0, limit) : data;
  }

  async getSalesDataByDateRange(startDate: Date, endDate: Date): Promise<SalesData[]> {
    return Array.from(this.salesData.values())
      .filter(data => data.date >= startDate && data.date <= endDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getSalesDataByCategory(category: string): Promise<SalesData[]> {
    return Array.from(this.salesData.values())
      .filter(data => data.category === category)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createSalesData(data: InsertSalesData): Promise<SalesData> {
    const id = randomUUID();
    const salesRecord: SalesData = { 
      ...data, 
      id, 
      createdAt: new Date() 
    };
    this.salesData.set(id, salesRecord);
    return salesRecord;
  }

  async bulkCreateSalesData(data: InsertSalesData[]): Promise<SalesData[]> {
    const results: SalesData[] = [];
    for (const item of data) {
      const result = await this.createSalesData(item);
      results.push(result);
    }
    return results;
  }

  async getPredictions(limit?: number): Promise<Prediction[]> {
    const data = Array.from(this.predictions.values())
      .sort((a, b) => b.predictionDate.getTime() - a.predictionDate.getTime());
    return limit ? data.slice(0, limit) : data;
  }

  async getPredictionsByDate(date: Date): Promise<Prediction[]> {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    return Array.from(this.predictions.values())
      .filter(p => p.predictionDate >= startOfDay && p.predictionDate <= endOfDay)
      .sort((a, b) => b.confidence - a.confidence);
  }

  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const id = randomUUID();
    const pred: Prediction = { 
      ...prediction, 
      id, 
      createdAt: new Date() 
    };
    this.predictions.set(id, pred);
    return pred;
  }

  async bulkCreatePredictions(predictions: InsertPrediction[]): Promise<Prediction[]> {
    const results: Prediction[] = [];
    for (const prediction of predictions) {
      const result = await this.createPrediction(prediction);
      results.push(result);
    }
    return results;
  }

  async getInventory(): Promise<Inventory[]> {
    return Array.from(this.inventory.values())
      .sort((a, b) => a.itemName.localeCompare(b.itemName));
  }

  async getInventoryByItem(itemName: string): Promise<Inventory | undefined> {
    return Array.from(this.inventory.values())
      .find(item => item.itemName === itemName);
  }

  async createInventory(inventory: InsertInventory): Promise<Inventory> {
    const id = randomUUID();
    const item: Inventory = { 
      ...inventory, 
      id, 
      updatedAt: new Date() 
    };
    this.inventory.set(id, item);
    return item;
  }

  async updateInventory(id: string, updates: Partial<Inventory>): Promise<Inventory | undefined> {
    const existing = this.inventory.get(id);
    if (!existing) return undefined;
    
    const updated: Inventory = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.inventory.set(id, updated);
    return updated;
  }

  async getLatestModelMetrics(): Promise<ModelMetrics | undefined> {
    const metrics = Array.from(this.modelMetrics.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    return metrics[0];
  }

  async createModelMetrics(metrics: InsertModelMetrics): Promise<ModelMetrics> {
    const id = randomUUID();
    const modelMetrics: ModelMetrics = { 
      ...metrics, 
      id, 
      createdAt: new Date() 
    };
    this.modelMetrics.set(id, modelMetrics);
    return modelMetrics;
  }
}

export const storage = new MemStorage();
