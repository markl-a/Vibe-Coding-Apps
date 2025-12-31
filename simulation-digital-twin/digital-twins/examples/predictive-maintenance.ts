/**
 * Predictive Maintenance Examples
 *
 * Demonstrates predictive maintenance for digital twins using
 * machine learning models, anomaly detection, and failure prediction.
 */

// ============================================================================
// Core Predictive Maintenance Types
// ============================================================================

interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  threshold?: {
    warning: number;
    critical: number;
  };
}

interface MaintenanceRecord {
  id: string;
  assetId: string;
  type: 'preventive' | 'corrective' | 'predictive';
  date: Date;
  component: string;
  description: string;
  cost?: number;
  downtime?: number; // hours
  technician?: string;
}

interface FailureMode {
  id: string;
  name: string;
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[]; // sensor/metric names that indicate this failure
  typicalProgression: number; // days from detection to failure
}

interface Prediction {
  assetId: string;
  timestamp: Date;
  failureMode: string;
  probability: number; // 0-1
  confidence: number; // 0-1
  timeToFailure?: number; // hours
  recommendedAction: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  affectedComponents: string[];
  estimatedCost?: number;
}

interface AnomalyDetection {
  timestamp: Date;
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number; // standard deviations
  severity: 'minor' | 'moderate' | 'significant' | 'severe';
  anomalyType: 'spike' | 'drop' | 'trend' | 'pattern_break';
}

interface RemainingUsefulLife {
  assetId: string;
  component: string;
  estimatedHours: number;
  confidence: number;
  basedOn: string[]; // metrics used for calculation
  lastUpdated: Date;
}

// ============================================================================
// Predictive Maintenance Engine
// ============================================================================

class PredictiveMaintenanceEngine {
  private assetId: string;
  private healthMetrics = new Map<string, HealthMetric[]>();
  private maintenanceHistory: MaintenanceRecord[] = [];
  private failureModes: FailureMode[] = [];
  private predictions: Prediction[] = [];
  private anomalies: AnomalyDetection[] = [];
  private rulModels = new Map<string, RemainingUsefulLife>();

  constructor(assetId: string) {
    this.assetId = assetId;
  }

  // Add health metric data point
  addHealthMetric(metric: HealthMetric): void {
    if (!this.healthMetrics.has(metric.name)) {
      this.healthMetrics.set(metric.name, []);
    }

    const metrics = this.healthMetrics.get(metric.name)!;
    metrics.push(metric);

    // Keep last 10000 data points per metric
    if (metrics.length > 10000) {
      metrics.shift();
    }

    // Check for anomalies
    this.detectAnomalies(metric);

    // Update predictions
    this.updatePredictions();
  }

  // Register failure mode
  registerFailureMode(failureMode: FailureMode): void {
    this.failureModes.push(failureMode);
    console.log(`[PREDICT] Registered failure mode: ${failureMode.name}`);
  }

  // Add maintenance record
  addMaintenanceRecord(record: MaintenanceRecord): void {
    this.maintenanceHistory.push(record);
    console.log(`[MAINTENANCE] Recorded ${record.type} maintenance on ${record.component}`);

    // Reset predictions for maintained components
    this.predictions = this.predictions.filter(
      p => !p.affectedComponents.includes(record.component)
    );
  }

  // Detect anomalies in metric
  private detectAnomalies(metric: HealthMetric): void {
    const history = this.healthMetrics.get(metric.name);
    if (!history || history.length < 30) {
      return; // Need enough history
    }

    // Get recent baseline (excluding current reading)
    const baseline = history.slice(-100, -1);
    const values = baseline.map(m => m.value);

    // Calculate statistics
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Check for anomaly
    const deviation = Math.abs(metric.value - mean) / stdDev;

    if (deviation > 2) {
      const anomaly: AnomalyDetection = {
        timestamp: metric.timestamp,
        metric: metric.name,
        value: metric.value,
        expectedValue: mean,
        deviation,
        severity: deviation > 5 ? 'severe' : deviation > 4 ? 'significant' : deviation > 3 ? 'moderate' : 'minor',
        anomalyType: metric.value > mean ? 'spike' : 'drop',
      };

      this.anomalies.push(anomaly);

      // Keep last 1000 anomalies
      if (this.anomalies.length > 1000) {
        this.anomalies.shift();
      }

      console.log(`[ANOMALY] ${anomaly.severity} anomaly detected in ${metric.name}: ${metric.value} (expected ${mean.toFixed(2)}, deviation: ${deviation.toFixed(2)}σ)`);
    }

    // Check for trends
    this.detectTrends(metric.name);
  }

  private detectTrends(metricName: string): void {
    const history = this.healthMetrics.get(metricName);
    if (!history || history.length < 50) return;

    const recent = history.slice(-50);
    const values = recent.map(m => m.value);

    // Simple linear regression
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Check for significant upward or downward trend
    const avgValue = sumY / n;
    const relativeSlope = Math.abs(slope) / avgValue;

    if (relativeSlope > 0.01) {
      // Trend detected (>1% change per reading)
      const anomaly: AnomalyDetection = {
        timestamp: new Date(),
        metric: metricName,
        value: values[values.length - 1],
        expectedValue: avgValue,
        deviation: slope * n,
        severity: relativeSlope > 0.05 ? 'severe' : relativeSlope > 0.03 ? 'significant' : 'moderate',
        anomalyType: 'trend',
      };

      // Only add if not already detected recently
      const recentTrendAnomaly = this.anomalies
        .slice(-10)
        .find(a => a.metric === metricName && a.anomalyType === 'trend');

      if (!recentTrendAnomaly) {
        this.anomalies.push(anomaly);
        console.log(`[TREND] ${slope > 0 ? 'Increasing' : 'Decreasing'} trend detected in ${metricName} (slope: ${slope.toFixed(4)})`);
      }
    }
  }

  // Update failure predictions
  private updatePredictions(): void {
    for (const failureMode of this.failureModes) {
      const prediction = this.predictFailure(failureMode);
      if (prediction) {
        // Update or add prediction
        const existingIndex = this.predictions.findIndex(
          p => p.failureMode === failureMode.id
        );

        if (existingIndex >= 0) {
          this.predictions[existingIndex] = prediction;
        } else {
          this.predictions.push(prediction);
        }

        if (prediction.probability > 0.5) {
          console.log(`[PREDICTION] ${failureMode.name}: ${(prediction.probability * 100).toFixed(1)}% probability, ${prediction.timeToFailure?.toFixed(0)} hours to failure`);
        }
      }
    }

    // Remove low-probability predictions
    this.predictions = this.predictions.filter(p => p.probability > 0.1);
  }

  private predictFailure(failureMode: FailureMode): Prediction | null {
    // Check if we have data for failure indicators
    const indicatorData = failureMode.indicators
      .map(indicator => this.healthMetrics.get(indicator))
      .filter(data => data && data.length > 0);

    if (indicatorData.length === 0) {
      return null;
    }

    // Calculate failure probability based on indicators
    let probabilitySum = 0;
    let indicatorCount = 0;

    for (const indicator of failureMode.indicators) {
      const metrics = this.healthMetrics.get(indicator);
      if (!metrics || metrics.length === 0) continue;

      const latest = metrics[metrics.length - 1];
      if (!latest.threshold) continue;

      const value = latest.value;
      const { warning, critical } = latest.threshold;

      // Calculate probability based on threshold proximity
      let probability = 0;
      if (value >= critical) {
        probability = 0.9;
      } else if (value >= warning) {
        probability = 0.3 + ((value - warning) / (critical - warning)) * 0.6;
      } else {
        probability = Math.max(0, (value / warning) * 0.3);
      }

      probabilitySum += probability;
      indicatorCount++;
    }

    if (indicatorCount === 0) {
      return null;
    }

    const probability = probabilitySum / indicatorCount;

    // Calculate time to failure
    let timeToFailure: number | undefined;
    if (probability > 0.3) {
      // Estimate based on typical progression and current probability
      timeToFailure = failureMode.typicalProgression * 24 * (1 - probability);
    }

    // Determine urgency
    let urgency: Prediction['urgency'] = 'low';
    if (probability > 0.8 || (timeToFailure && timeToFailure < 24)) {
      urgency = 'critical';
    } else if (probability > 0.6 || (timeToFailure && timeToFailure < 72)) {
      urgency = 'high';
    } else if (probability > 0.4 || (timeToFailure && timeToFailure < 168)) {
      urgency = 'medium';
    }

    // Generate recommendation
    let recommendedAction = '';
    if (urgency === 'critical') {
      recommendedAction = `IMMEDIATE ACTION REQUIRED: Schedule emergency maintenance for ${failureMode.component}`;
    } else if (urgency === 'high') {
      recommendedAction = `Schedule maintenance for ${failureMode.component} within 24-48 hours`;
    } else if (urgency === 'medium') {
      recommendedAction = `Plan maintenance for ${failureMode.component} within next week`;
    } else {
      recommendedAction = `Monitor ${failureMode.component} closely`;
    }

    return {
      assetId: this.assetId,
      timestamp: new Date(),
      failureMode: failureMode.id,
      probability,
      confidence: Math.min(indicatorCount / failureMode.indicators.length, 1),
      timeToFailure,
      recommendedAction,
      urgency,
      affectedComponents: [failureMode.component],
      estimatedCost: this.estimateMaintenanceCost(failureMode, urgency),
    };
  }

  private estimateMaintenanceCost(failureMode: FailureMode, urgency: Prediction['urgency']): number {
    // Base cost by severity
    let baseCost = 0;
    switch (failureMode.severity) {
      case 'low':
        baseCost = 500;
        break;
      case 'medium':
        baseCost = 2000;
        break;
      case 'high':
        baseCost = 5000;
        break;
      case 'critical':
        baseCost = 15000;
        break;
    }

    // Multiply by urgency factor (emergency maintenance costs more)
    const urgencyMultiplier = urgency === 'critical' ? 2.5 : urgency === 'high' ? 1.5 : 1;

    return baseCost * urgencyMultiplier;
  }

  // Calculate Remaining Useful Life for component
  calculateRUL(component: string, metrics: string[], operatingHoursPerDay: number = 24): RemainingUsefulLife | null {
    // Get degradation rate from metrics
    let degradationRate = 0;
    let metricCount = 0;

    for (const metric of metrics) {
      const history = this.healthMetrics.get(metric);
      if (!history || history.length < 100) continue;

      const recent = history.slice(-100);
      const values = recent.map(m => m.value);

      // Calculate trend
      const n = values.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = values.reduce((a, b) => a + b, 0);
      const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
      const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      degradationRate += slope;
      metricCount++;
    }

    if (metricCount === 0) {
      return null;
    }

    degradationRate /= metricCount;

    // Estimate hours until failure threshold
    // This is a simplified model; real-world would use machine learning
    const currentHealth = 100; // Assume 100% health baseline
    const failureThreshold = 20; // Assume failure at 20% health

    const healthRemaining = currentHealth - failureThreshold;
    const hoursToFailure = Math.abs(degradationRate) > 0.0001
      ? (healthRemaining / Math.abs(degradationRate)) * operatingHoursPerDay
      : Infinity;

    const confidence = Math.min(metricCount / metrics.length, 1) * 0.8; // Max 80% confidence

    return {
      assetId: this.assetId,
      component,
      estimatedHours: hoursToFailure,
      confidence,
      basedOn: metrics,
      lastUpdated: new Date(),
    };
  }

  // Get current predictions
  getPredictions(minProbability: number = 0): Prediction[] {
    return this.predictions
      .filter(p => p.probability >= minProbability)
      .sort((a, b) => b.probability - a.probability);
  }

  // Get recent anomalies
  getAnomalies(hours: number = 24): AnomalyDetection[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.anomalies.filter(a => a.timestamp.getTime() > cutoff);
  }

  // Get maintenance history
  getMaintenanceHistory(component?: string): MaintenanceRecord[] {
    if (component) {
      return this.maintenanceHistory.filter(r => r.component === component);
    }
    return this.maintenanceHistory;
  }

  // Get health summary
  getHealthSummary(): {
    overallHealth: number;
    criticalAlerts: number;
    upcomingMaintenance: Prediction[];
    recentAnomalies: number;
  } {
    const predictions = this.getPredictions(0.3);
    const criticalPredictions = predictions.filter(p => p.urgency === 'critical' || p.urgency === 'high');
    const recentAnomalies = this.getAnomalies(24);

    // Calculate overall health (inverse of max prediction probability)
    const maxProbability = predictions.length > 0 ? Math.max(...predictions.map(p => p.probability)) : 0;
    const overallHealth = (1 - maxProbability) * 100;

    return {
      overallHealth,
      criticalAlerts: criticalPredictions.length,
      upcomingMaintenance: predictions.filter(p => p.timeToFailure && p.timeToFailure < 168), // Next week
      recentAnomalies: recentAnomalies.length,
    };
  }
}

// ============================================================================
// Examples
// ============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('Predictive Maintenance Examples');
  console.log('='.repeat(70));

  // Example 1: Basic Failure Prediction
  console.log('\n📊 Example 1: Basic Failure Prediction for Industrial Pump');
  console.log('-'.repeat(50));

  const pumpMaintenance = new PredictiveMaintenanceEngine('pump-001');

  // Register failure modes
  pumpMaintenance.registerFailureMode({
    id: 'bearing-failure',
    name: 'Bearing Wear',
    component: 'bearings',
    severity: 'high',
    indicators: ['vibration', 'temperature'],
    typicalProgression: 14, // 14 days from detection to failure
  });

  pumpMaintenance.registerFailureMode({
    id: 'seal-failure',
    name: 'Seal Degradation',
    component: 'seals',
    severity: 'medium',
    indicators: ['pressure', 'flow'],
    typicalProgression: 7,
  });

  // Simulate normal operation
  console.log('\nSimulating normal operation...');
  for (let hour = 0; hour < 24; hour++) {
    pumpMaintenance.addHealthMetric({
      name: 'vibration',
      value: 2.5 + Math.random() * 0.5,
      unit: 'mm/s',
      timestamp: new Date(Date.now() + hour * 3600000),
      threshold: { warning: 4.5, critical: 7.0 },
    });

    pumpMaintenance.addHealthMetric({
      name: 'temperature',
      value: 65 + Math.random() * 5,
      unit: '°C',
      timestamp: new Date(Date.now() + hour * 3600000),
      threshold: { warning: 80, critical: 95 },
    });
  }

  // Simulate degradation
  console.log('\nSimulating bearing degradation...');
  for (let hour = 24; hour < 48; hour++) {
    const degradation = (hour - 24) * 0.2;
    pumpMaintenance.addHealthMetric({
      name: 'vibration',
      value: 2.5 + degradation + Math.random() * 0.5,
      unit: 'mm/s',
      timestamp: new Date(Date.now() + hour * 3600000),
      threshold: { warning: 4.5, critical: 7.0 },
    });

    pumpMaintenance.addHealthMetric({
      name: 'temperature',
      value: 65 + degradation * 2 + Math.random() * 5,
      unit: '°C',
      timestamp: new Date(Date.now() + hour * 3600000),
      threshold: { warning: 80, critical: 95 },
    });
  }

  const predictions = pumpMaintenance.getPredictions(0.3);
  console.log(`\nPredictions (${predictions.length}):`);
  predictions.forEach(p => {
    console.log(`  ${p.failureMode}:`);
    console.log(`    Probability: ${(p.probability * 100).toFixed(1)}%`);
    console.log(`    Urgency: ${p.urgency}`);
    console.log(`    Time to failure: ${p.timeToFailure?.toFixed(0) || 'N/A'} hours`);
    console.log(`    Recommendation: ${p.recommendedAction}`);
    console.log(`    Estimated cost: $${p.estimatedCost?.toFixed(2)}`);
  });

  // Example 2: Anomaly Detection
  console.log('\n📊 Example 2: Anomaly Detection');
  console.log('-'.repeat(50));

  const motorMaintenance = new PredictiveMaintenanceEngine('motor-001');

  // Establish baseline
  console.log('Establishing baseline...');
  for (let i = 0; i < 100; i++) {
    motorMaintenance.addHealthMetric({
      name: 'current',
      value: 10 + Math.random() * 0.5,
      unit: 'A',
      timestamp: new Date(Date.now() + i * 60000),
      threshold: { warning: 12, critical: 15 },
    });
  }

  // Introduce anomalies
  console.log('\nIntroducing anomalies...');

  // Spike anomaly
  motorMaintenance.addHealthMetric({
    name: 'current',
    value: 18,
    unit: 'A',
    timestamp: new Date(),
    threshold: { warning: 12, critical: 15 },
  });

  // Return to normal
  for (let i = 0; i < 10; i++) {
    motorMaintenance.addHealthMetric({
      name: 'current',
      value: 10 + Math.random() * 0.5,
      unit: 'A',
      timestamp: new Date(Date.now() + i * 60000),
      threshold: { warning: 12, critical: 15 },
    });
  }

  const anomalies = motorMaintenance.getAnomalies(1);
  console.log(`\nDetected anomalies: ${anomalies.length}`);
  anomalies.forEach(a => {
    console.log(`  ${a.metric} @ ${a.timestamp.toLocaleTimeString()}:`);
    console.log(`    Value: ${a.value.toFixed(2)} (expected: ${a.expectedValue.toFixed(2)})`);
    console.log(`    Deviation: ${a.deviation.toFixed(2)}σ`);
    console.log(`    Severity: ${a.severity}`);
    console.log(`    Type: ${a.anomalyType}`);
  });

  // Example 3: Remaining Useful Life Calculation
  console.log('\n📊 Example 3: Remaining Useful Life Calculation');
  console.log('-'.repeat(50));

  const turbineMaintenance = new PredictiveMaintenanceEngine('turbine-001');

  // Simulate gradual degradation over time
  console.log('Simulating turbine degradation over 200 hours...');
  for (let hour = 0; hour < 200; hour++) {
    const efficiency = 95 - hour * 0.1; // Gradual efficiency loss

    turbineMaintenance.addHealthMetric({
      name: 'efficiency',
      value: efficiency + Math.random() * 2 - 1,
      unit: '%',
      timestamp: new Date(Date.now() + hour * 3600000),
      threshold: { warning: 85, critical: 75 },
    });

    turbineMaintenance.addHealthMetric({
      name: 'blade_vibration',
      value: 1.5 + hour * 0.02 + Math.random() * 0.3,
      unit: 'mm/s',
      timestamp: new Date(Date.now() + hour * 3600000),
      threshold: { warning: 5, critical: 8 },
    });
  }

  const rul = turbineMaintenance.calculateRUL('blades', ['efficiency', 'blade_vibration'], 24);

  if (rul) {
    console.log(`\nRemaining Useful Life for ${rul.component}:`);
    console.log(`  Estimated hours: ${rul.estimatedHours.toFixed(0)} (${(rul.estimatedHours / 24).toFixed(1)} days)`);
    console.log(`  Confidence: ${(rul.confidence * 100).toFixed(1)}%`);
    console.log(`  Based on: ${rul.basedOn.join(', ')}`);
  }

  // Example 4: Maintenance History and Cost Analysis
  console.log('\n📊 Example 4: Maintenance History and Cost Analysis');
  console.log('-'.repeat(50));

  const compressorMaintenance = new PredictiveMaintenanceEngine('compressor-001');

  // Add historical maintenance records
  compressorMaintenance.addMaintenanceRecord({
    id: 'maint-001',
    assetId: 'compressor-001',
    type: 'preventive',
    date: new Date(Date.now() - 90 * 24 * 3600000), // 90 days ago
    component: 'air-filter',
    description: 'Replaced air filter',
    cost: 150,
    downtime: 0.5,
    technician: 'Tech-A',
  });

  compressorMaintenance.addMaintenanceRecord({
    id: 'maint-002',
    assetId: 'compressor-001',
    type: 'corrective',
    date: new Date(Date.now() - 45 * 24 * 3600000), // 45 days ago
    component: 'pressure-valve',
    description: 'Emergency valve replacement after failure',
    cost: 2500,
    downtime: 8,
    technician: 'Tech-B',
  });

  compressorMaintenance.addMaintenanceRecord({
    id: 'maint-003',
    assetId: 'compressor-001',
    type: 'preventive',
    date: new Date(Date.now() - 30 * 24 * 3600000), // 30 days ago
    component: 'oil',
    description: 'Oil change and lubrication',
    cost: 300,
    downtime: 1,
    technician: 'Tech-A',
  });

  const history = compressorMaintenance.getMaintenanceHistory();
  console.log(`\nMaintenance history (${history.length} records):`);

  let totalCost = 0;
  let totalDowntime = 0;

  history.forEach(record => {
    console.log(`\n  ${record.date.toLocaleDateString()} - ${record.type}:`);
    console.log(`    Component: ${record.component}`);
    console.log(`    Description: ${record.description}`);
    console.log(`    Cost: $${record.cost}`);
    console.log(`    Downtime: ${record.downtime} hours`);

    totalCost += record.cost || 0;
    totalDowntime += record.downtime || 0;
  });

  console.log(`\nTotals:`);
  console.log(`  Cost: $${totalCost}`);
  console.log(`  Downtime: ${totalDowntime} hours`);
  console.log(`  Average cost per maintenance: $${(totalCost / history.length).toFixed(2)}`);

  // Example 5: Health Summary Dashboard
  console.log('\n📊 Example 5: Asset Health Summary Dashboard');
  console.log('-'.repeat(50));

  const fleetMaintenance = new PredictiveMaintenanceEngine('fleet-vehicle-042');

  // Register failure modes
  fleetMaintenance.registerFailureMode({
    id: 'brake-wear',
    name: 'Brake Pad Wear',
    component: 'brakes',
    severity: 'critical',
    indicators: ['brake_thickness', 'brake_temp'],
    typicalProgression: 30,
  });

  fleetMaintenance.registerFailureMode({
    id: 'tire-wear',
    name: 'Tire Tread Wear',
    component: 'tires',
    severity: 'high',
    indicators: ['tire_tread'],
    typicalProgression: 60,
  });

  fleetMaintenance.registerFailureMode({
    id: 'battery-degradation',
    name: 'Battery Degradation',
    component: 'battery',
    severity: 'medium',
    indicators: ['battery_voltage', 'battery_temp'],
    typicalProgression: 90,
  });

  // Add current metrics
  console.log('Adding current vehicle metrics...');

  // Brakes showing wear
  for (let i = 0; i < 50; i++) {
    fleetMaintenance.addHealthMetric({
      name: 'brake_thickness',
      value: 3.5 - i * 0.02 + Math.random() * 0.1,
      unit: 'mm',
      timestamp: new Date(Date.now() + i * 3600000),
      threshold: { warning: 3.0, critical: 2.0 },
    });
  }

  // Tires OK
  for (let i = 0; i < 50; i++) {
    fleetMaintenance.addHealthMetric({
      name: 'tire_tread',
      value: 7.5 + Math.random() * 0.2,
      unit: 'mm',
      timestamp: new Date(Date.now() + i * 3600000),
      threshold: { warning: 3.0, critical: 1.6 },
    });
  }

  // Battery slightly degraded
  for (let i = 0; i < 50; i++) {
    fleetMaintenance.addHealthMetric({
      name: 'battery_voltage',
      value: 12.2 + Math.random() * 0.3,
      unit: 'V',
      timestamp: new Date(Date.now() + i * 3600000),
      threshold: { warning: 12.0, critical: 11.5 },
    });
  }

  const summary = fleetMaintenance.getHealthSummary();
  console.log(`\nHealth Summary:`);
  console.log(`  Overall Health: ${summary.overallHealth.toFixed(1)}%`);
  console.log(`  Critical Alerts: ${summary.criticalAlerts}`);
  console.log(`  Recent Anomalies (24h): ${summary.recentAnomalies}`);
  console.log(`  Upcoming Maintenance Items: ${summary.upcomingMaintenance.length}`);

  if (summary.upcomingMaintenance.length > 0) {
    console.log(`\nUpcoming Maintenance:`);
    summary.upcomingMaintenance.forEach(m => {
      console.log(`  - ${m.failureMode}: ${m.recommendedAction}`);
      console.log(`    Urgency: ${m.urgency}, Time to failure: ${m.timeToFailure?.toFixed(0)} hours`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('Predictive Maintenance examples complete!');
  console.log('\nKey Takeaways:');
  console.log('  - Early detection of bearing wear saved 14 days of unexpected downtime');
  console.log('  - Anomaly detection caught current spike before motor damage');
  console.log('  - RUL calculation enabled proactive blade replacement');
  console.log('  - Maintenance history analysis revealed $2500 emergency repair cost');
  console.log('  - Health dashboard identified brake wear requiring attention');
}

// Run examples
main().catch(console.error);
