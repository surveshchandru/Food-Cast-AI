/**
 * Client-side forecasting utilities for FoodCast AI
 * Provides data processing, validation, and basic forecasting calculations
 */

export interface SalesDataPoint {
  date: Date;
  quantity: number;
  revenue: number;
  itemName: string;
  category: string;
}

export interface ForecastOptions {
  period: 'daily' | 'weekly' | 'monthly';
  confidence?: number;
  seasonalAdjustment?: boolean;
  trendAnalysis?: boolean;
}

export interface ForecastResult {
  predictedQuantity: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonalFactor: number;
}

export interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates sales data for forecasting
 */
export function validateSalesData(data: SalesDataPoint[]): DataValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || data.length === 0) {
    errors.push("No data provided for validation");
    return { isValid: false, errors, warnings };
  }

  // Check for minimum data points
  if (data.length < 7) {
    warnings.push("Less than 7 data points available. Predictions may be less accurate.");
  }

  // Validate each data point
  data.forEach((point, index) => {
    if (!point.date || isNaN(point.date.getTime())) {
      errors.push(`Invalid date at index ${index}`);
    }
    
    if (typeof point.quantity !== 'number' || point.quantity < 0) {
      errors.push(`Invalid quantity at index ${index}: must be a non-negative number`);
    }
    
    if (typeof point.revenue !== 'number' || point.revenue < 0) {
      errors.push(`Invalid revenue at index ${index}: must be a non-negative number`);
    }
    
    if (!point.itemName || point.itemName.trim().length === 0) {
      errors.push(`Missing item name at index ${index}`);
    }
    
    if (!point.category || point.category.trim().length === 0) {
      errors.push(`Missing category at index ${index}`);
    }
  });

  // Check for data consistency
  const dateGaps = findDateGaps(data);
  if (dateGaps.length > 0) {
    warnings.push(`Found ${dateGaps.length} date gaps in the data series`);
  }

  // Check for outliers
  const outliers = detectOutliers(data.map(d => d.quantity));
  if (outliers.length > 0) {
    warnings.push(`Found ${outliers.length} potential outliers in quantity data`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Simple moving average calculation
 */
export function calculateMovingAverage(values: number[], window: number): number[] {
  if (window <= 0 || window > values.length) {
    throw new Error("Invalid window size for moving average");
  }

  const result: number[] = [];
  
  for (let i = window - 1; i < values.length; i++) {
    const slice = values.slice(i - window + 1, i + 1);
    const average = slice.reduce((sum, val) => sum + val, 0) / window;
    result.push(average);
  }
  
  return result;
}

/**
 * Calculate linear trend from data points
 */
export function calculateTrend(values: number[]): {
  slope: number;
  intercept: number;
  r2: number;
  trend: 'increasing' | 'decreasing' | 'stable';
} {
  const n = values.length;
  if (n < 2) {
    return { slope: 0, intercept: values[0] || 0, r2: 0, trend: 'stable' };
  }

  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssRes = y.reduce((acc, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return acc + Math.pow(yi - predicted, 2);
  }, 0);
  const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
  const r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);

  // Determine trend direction
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (Math.abs(slope) > 0.1) { // threshold for significant trend
    trend = slope > 0 ? 'increasing' : 'decreasing';
  }

  return { slope, intercept, r2, trend };
}

/**
 * Calculate seasonal factors based on day of week or month
 */
export function calculateSeasonalFactors(
  data: SalesDataPoint[], 
  type: 'daily' | 'weekly' | 'monthly' = 'daily'
): Record<string, number> {
  const groups: Record<string, number[]> = {};
  
  data.forEach(point => {
    let key: string;
    
    switch (type) {
      case 'daily':
        key = point.date.getDay().toString(); // 0-6 for Sunday-Saturday
        break;
      case 'weekly':
        const weekOfYear = Math.floor(
          (point.date.getTime() - new Date(point.date.getFullYear(), 0, 1).getTime()) 
          / (7 * 24 * 60 * 60 * 1000)
        );
        key = (weekOfYear % 4).toString(); // 0-3 for weeks in month
        break;
      case 'monthly':
        key = point.date.getMonth().toString(); // 0-11 for January-December
        break;
      default:
        key = '0';
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(point.quantity);
  });

  // Calculate average for each group
  const averages: Record<string, number> = {};
  Object.keys(groups).forEach(key => {
    const values = groups[key];
    averages[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
  });

  // Calculate overall average
  const overallAverage = Object.values(averages).reduce((sum, val) => sum + val, 0) / Object.values(averages).length;

  // Calculate seasonal factors (ratio to overall average)
  const factors: Record<string, number> = {};
  Object.keys(averages).forEach(key => {
    factors[key] = overallAverage === 0 ? 1 : averages[key] / overallAverage;
  });

  return factors;
}

/**
 * Simple forecasting function using moving average and trend
 */
export function generateSimpleForecast(
  data: SalesDataPoint[], 
  options: ForecastOptions = { period: 'daily' }
): ForecastResult {
  if (data.length === 0) {
    return {
      predictedQuantity: 0,
      confidence: 0,
      trend: 'stable',
      seasonalFactor: 1
    };
  }

  const quantities = data.map(d => d.quantity);
  
  // Calculate moving average (use last 7 days or available data)
  const windowSize = Math.min(7, quantities.length);
  const movingAvg = calculateMovingAverage(quantities, windowSize);
  const lastMovingAvg = movingAvg[movingAvg.length - 1] || quantities[quantities.length - 1];

  // Calculate trend if enabled
  let trendAdjustment = 0;
  let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
  
  if (options.trendAnalysis && quantities.length >= 3) {
    const trendData = calculateTrend(quantities);
    trendDirection = trendData.trend;
    // Project trend one period forward
    trendAdjustment = trendData.slope;
  }

  // Calculate seasonal factor if enabled
  let seasonalFactor = 1;
  if (options.seasonalAdjustment && data.length >= 7) {
    const factors = calculateSeasonalFactors(data, options.period);
    const today = new Date();
    let key: string;
    
    switch (options.period) {
      case 'daily':
        key = today.getDay().toString();
        break;
      case 'weekly':
        const weekOfYear = Math.floor(
          (today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) 
          / (7 * 24 * 60 * 60 * 1000)
        );
        key = (weekOfYear % 4).toString();
        break;
      case 'monthly':
        key = today.getMonth().toString();
        break;
      default:
        key = '0';
    }
    
    seasonalFactor = factors[key] || 1;
  }

  // Combine predictions
  const basePrediction = lastMovingAvg + trendAdjustment;
  const predictedQuantity = Math.round(Math.max(0, basePrediction * seasonalFactor));

  // Calculate confidence based on data consistency
  const confidence = calculateConfidence(quantities, predictedQuantity);

  return {
    predictedQuantity,
    confidence: Math.min(options.confidence || 1, confidence),
    trend: trendDirection,
    seasonalFactor
  };
}

/**
 * Calculate confidence score based on data variance and prediction distance
 */
function calculateConfidence(historicalData: number[], prediction: number): number {
  if (historicalData.length === 0) return 0.5;
  
  const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
  const variance = historicalData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / historicalData.length;
  const stdDev = Math.sqrt(variance);
  
  // Confidence decreases with higher variance
  const coefficientOfVariation = mean === 0 ? 1 : stdDev / mean;
  const baseConfidence = Math.max(0.3, 1 - coefficientOfVariation);
  
  // Adjust confidence based on how far prediction is from historical mean
  const predictionDeviation = Math.abs(prediction - mean) / (stdDev || 1);
  const adjustedConfidence = baseConfidence * Math.exp(-predictionDeviation / 2);
  
  return Math.min(0.98, Math.max(0.3, adjustedConfidence));
}

/**
 * Find gaps in date series
 */
function findDateGaps(data: SalesDataPoint[]): { start: Date; end: Date }[] {
  if (data.length < 2) return [];
  
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  const gaps: { start: Date; end: Date }[] = [];
  
  for (let i = 1; i < sortedData.length; i++) {
    const prev = sortedData[i - 1].date;
    const current = sortedData[i].date;
    const daysDiff = (current.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);
    
    if (daysDiff > 1.5) { // More than 1 day gap
      gaps.push({ start: prev, end: current });
    }
  }
  
  return gaps;
}

/**
 * Detect outliers using IQR method
 */
function detectOutliers(values: number[]): number[] {
  if (values.length < 4) return [];
  
  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return values.filter(value => value < lowerBound || value > upperBound);
}

/**
 * Format forecast data for charts
 */
export function formatForecastData(
  historical: SalesDataPoint[],
  predictions: ForecastResult[],
  days: number = 7
): {
  labels: string[];
  historical: number[];
  predicted: number[];
} {
  const labels: string[] = [];
  const historicalValues: number[] = [];
  const predictedValues: number[] = [];
  
  // Get last N days of historical data
  const sortedHistorical = [...historical]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-days);
  
  sortedHistorical.forEach(point => {
    labels.push(point.date.toLocaleDateString('en-US', { weekday: 'short' }));
    historicalValues.push(point.quantity);
    predictedValues.push(0); // No predictions for historical dates
  });
  
  // Add future predictions
  for (let i = 0; i < Math.min(predictions.length, 7); i++) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + i + 1);
    
    labels.push(futureDate.toLocaleDateString('en-US', { weekday: 'short' }));
    historicalValues.push(0); // No historical data for future dates
    predictedValues.push(predictions[i]?.predictedQuantity || 0);
  }
  
  return {
    labels,
    historical: historicalValues,
    predicted: predictedValues
  };
}

/**
 * Export functions for CSV data processing
 */
export function parseCSVData(csvContent: string): SalesDataPoint[] {
  const lines = csvContent.trim().split('\n');
  const data: SalesDataPoint[] = [];
  
  // Skip header if present
  const startIndex = lines[0].toLowerCase().includes('item') ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const [itemName, category, quantity, revenue, dateStr] = line.split(',').map(s => s.trim());
    
    if (itemName && category && quantity && revenue && dateStr) {
      data.push({
        itemName,
        category,
        quantity: parseFloat(quantity),
        revenue: parseFloat(revenue),
        date: new Date(dateStr)
      });
    }
  }
  
  return data;
}
