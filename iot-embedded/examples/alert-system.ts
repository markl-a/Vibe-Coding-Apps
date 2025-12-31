/**
 * Alert System Example
 * Demonstrates defining thresholds, triggering alerts, and notification channels
 */

import { EventEmitter } from 'events';

// ===== Type Definitions =====

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Alert threshold configuration
 */
export interface AlertThreshold {
  id: string;
  sensorType: string;
  condition: 'above' | 'below' | 'equals' | 'range' | 'change-rate';
  value?: number;
  rangeMin?: number;
  rangeMax?: number;
  changeRate?: number; // Per second
  severity: AlertSeverity;
  enabled: boolean;
  cooldownPeriod: number; // milliseconds - prevent alert spam
  hysteresis?: number; // Prevent flapping
}

/**
 * Alert definition
 */
export interface Alert {
  id: string;
  thresholdId: string;
  deviceId: string;
  sensorType: string;
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold: number | string;
  timestamp: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  resolved: boolean;
  resolvedAt?: number;
  metadata?: Record<string, any>;
}

/**
 * Notification channel types
 */
export type ChannelType = 'email' | 'sms' | 'webhook' | 'push' | 'mqtt' | 'slack';

/**
 * Notification channel configuration
 */
export interface NotificationChannel {
  id: string;
  type: ChannelType;
  enabled: boolean;
  severityFilter: AlertSeverity[]; // Only send alerts with these severities
  config: {
    // Email
    to?: string[];
    from?: string;
    // SMS
    phoneNumbers?: string[];
    // Webhook
    url?: string;
    headers?: Record<string, string>;
    // Push
    tokens?: string[];
    // MQTT
    topic?: string;
    broker?: string;
    // Slack
    webhookUrl?: string;
    channel?: string;
  };
  retryPolicy: {
    maxRetries: number;
    retryDelay: number; // milliseconds
  };
}

/**
 * Notification delivery status
 */
export interface NotificationDelivery {
  alertId: string;
  channelId: string;
  channelType: ChannelType;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  attempts: number;
  lastAttempt: number;
  error?: string;
}

/**
 * Alert statistics
 */
export interface AlertStatistics {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  acknowledgedAlerts: number;
  bySeverity: Record<AlertSeverity, number>;
  byDevice: Record<string, number>;
  bySensor: Record<string, number>;
  avgResolutionTime: number; // milliseconds
}

// ===== Alert System Service =====

/**
 * Service for managing alerts and notifications
 */
export class AlertSystemService extends EventEmitter {
  private thresholds: Map<string, AlertThreshold> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private channels: Map<string, NotificationChannel> = new Map();
  private deliveries: NotificationDelivery[] = [];
  private lastAlertTime: Map<string, number> = new Map();
  private sensorHistory: Map<string, { value: number; timestamp: number }[]> = new Map();

  constructor() {
    super();
  }

  /**
   * Define alert threshold
   */
  public defineThreshold(threshold: AlertThreshold): void {
    console.log(`\nDefining threshold: ${threshold.id}`);
    console.log(`  Sensor: ${threshold.sensorType}`);
    console.log(`  Condition: ${threshold.condition} ${threshold.value || ''}`);
    console.log(`  Severity: ${threshold.severity}`);

    this.thresholds.set(threshold.id, threshold);
    this.emit('threshold-defined', threshold);
  }

  /**
   * Add notification channel
   */
  public addChannel(channel: NotificationChannel): void {
    console.log(`\nAdding notification channel: ${channel.id}`);
    console.log(`  Type: ${channel.type}`);
    console.log(`  Severity Filter: ${channel.severityFilter.join(', ')}`);

    this.channels.set(channel.id, channel);
    this.emit('channel-added', channel);
  }

  /**
   * Process sensor reading and check thresholds
   */
  public processSensorData(
    deviceId: string,
    sensorType: string,
    value: number,
    timestamp: number = Date.now()
  ): void {
    // Store sensor history
    this.storeSensorHistory(sensorType, value, timestamp);

    // Check all thresholds for this sensor type
    for (const threshold of this.thresholds.values()) {
      if (threshold.sensorType === sensorType && threshold.enabled) {
        this.checkThreshold(deviceId, sensorType, value, timestamp, threshold);
      }
    }
  }

  /**
   * Check if threshold is violated
   */
  private checkThreshold(
    deviceId: string,
    sensorType: string,
    value: number,
    timestamp: number,
    threshold: AlertThreshold
  ): void {
    // Check cooldown period
    const lastAlertKey = `${deviceId}-${threshold.id}`;
    const lastAlertTime = this.lastAlertTime.get(lastAlertKey) || 0;
    if (timestamp - lastAlertTime < threshold.cooldownPeriod) {
      return;
    }

    let violated = false;
    let thresholdValue: number | string = '';
    let message = '';

    switch (threshold.condition) {
      case 'above':
        if (threshold.value !== undefined) {
          violated = value > threshold.value + (threshold.hysteresis || 0);
          thresholdValue = threshold.value;
          message = `${sensorType} is above threshold: ${value.toFixed(2)} > ${threshold.value}`;
        }
        break;

      case 'below':
        if (threshold.value !== undefined) {
          violated = value < threshold.value - (threshold.hysteresis || 0);
          thresholdValue = threshold.value;
          message = `${sensorType} is below threshold: ${value.toFixed(2)} < ${threshold.value}`;
        }
        break;

      case 'equals':
        if (threshold.value !== undefined) {
          violated = Math.abs(value - threshold.value) < 0.01;
          thresholdValue = threshold.value;
          message = `${sensorType} equals threshold: ${value.toFixed(2)} = ${threshold.value}`;
        }
        break;

      case 'range':
        if (threshold.rangeMin !== undefined && threshold.rangeMax !== undefined) {
          violated = value < threshold.rangeMin || value > threshold.rangeMax;
          thresholdValue = `${threshold.rangeMin}-${threshold.rangeMax}`;
          message = `${sensorType} is out of range: ${value.toFixed(2)} not in [${threshold.rangeMin}, ${threshold.rangeMax}]`;
        }
        break;

      case 'change-rate':
        const changeRate = this.calculateChangeRate(sensorType);
        if (threshold.changeRate !== undefined && changeRate !== null) {
          violated = Math.abs(changeRate) > threshold.changeRate;
          thresholdValue = threshold.changeRate;
          message = `${sensorType} change rate exceeded: ${changeRate.toFixed(2)}/s > ${threshold.changeRate}/s`;
        }
        break;
    }

    if (violated) {
      this.triggerAlert(deviceId, threshold, value, thresholdValue, message, timestamp);
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(
    deviceId: string,
    threshold: AlertThreshold,
    value: number,
    thresholdValue: number | string,
    message: string,
    timestamp: number
  ): void {
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const alert: Alert = {
      id: alertId,
      thresholdId: threshold.id,
      deviceId,
      sensorType: threshold.sensorType,
      severity: threshold.severity,
      message,
      value,
      threshold: thresholdValue,
      timestamp,
      acknowledged: false,
      resolved: false,
      metadata: {
        condition: threshold.condition,
      },
    };

    this.alerts.set(alertId, alert);
    this.lastAlertTime.set(`${deviceId}-${threshold.id}`, timestamp);

    console.log(`\n🚨 ALERT TRIGGERED [${alert.severity.toUpperCase()}]`);
    console.log(`  ID: ${alertId}`);
    console.log(`  Device: ${deviceId}`);
    console.log(`  Message: ${message}`);

    // Emit alert event
    this.emit('alert-triggered', alert);

    // Send notifications
    this.sendNotifications(alert);
  }

  /**
   * Send notifications through configured channels
   */
  private async sendNotifications(alert: Alert): Promise<void> {
    console.log(`\nSending notifications for alert ${alert.id}...`);

    for (const channel of this.channels.values()) {
      // Check if channel is enabled and severity matches
      if (!channel.enabled || !channel.severityFilter.includes(alert.severity)) {
        continue;
      }

      const delivery: NotificationDelivery = {
        alertId: alert.id,
        channelId: channel.id,
        channelType: channel.type,
        status: 'pending',
        attempts: 0,
        lastAttempt: Date.now(),
      };

      this.deliveries.push(delivery);

      // Send notification
      await this.sendNotification(channel, alert, delivery);
    }
  }

  /**
   * Send notification through a specific channel
   */
  private async sendNotification(
    channel: NotificationChannel,
    alert: Alert,
    delivery: NotificationDelivery
  ): Promise<void> {
    try {
      delivery.attempts++;
      delivery.lastAttempt = Date.now();
      delivery.status = 'pending';

      console.log(`  Sending via ${channel.type} (${channel.id})...`);

      // Simulate sending based on channel type
      switch (channel.type) {
        case 'email':
          await this.sendEmail(channel, alert);
          break;

        case 'sms':
          await this.sendSMS(channel, alert);
          break;

        case 'webhook':
          await this.sendWebhook(channel, alert);
          break;

        case 'push':
          await this.sendPushNotification(channel, alert);
          break;

        case 'mqtt':
          await this.sendMQTT(channel, alert);
          break;

        case 'slack':
          await this.sendSlack(channel, alert);
          break;
      }

      delivery.status = 'sent';
      console.log(`  ✓ Sent successfully via ${channel.type}`);

      this.emit('notification-sent', { channel, alert, delivery });
    } catch (error) {
      delivery.status = 'failed';
      delivery.error = (error as Error).message;

      console.error(`  ✗ Failed to send via ${channel.type}: ${delivery.error}`);

      // Retry if configured
      if (delivery.attempts < channel.retryPolicy.maxRetries) {
        delivery.status = 'retrying';
        setTimeout(() => {
          this.sendNotification(channel, alert, delivery);
        }, channel.retryPolicy.retryDelay);
      }

      this.emit('notification-failed', { channel, alert, delivery });
    }
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);

    if (!alert) {
      console.error(`Alert ${alertId} not found`);
      return false;
    }

    if (alert.acknowledged) {
      console.log(`Alert ${alertId} already acknowledged`);
      return false;
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = Date.now();

    console.log(`\nAlert ${alertId} acknowledged by ${acknowledgedBy}`);

    this.emit('alert-acknowledged', alert);
    return true;
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);

    if (!alert) {
      console.error(`Alert ${alertId} not found`);
      return false;
    }

    if (alert.resolved) {
      console.log(`Alert ${alertId} already resolved`);
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = Date.now();

    console.log(`\nAlert ${alertId} resolved`);

    this.emit('alert-resolved', alert);
    return true;
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(deviceId?: string): Alert[] {
    const active = Array.from(this.alerts.values()).filter(
      (alert) => !alert.resolved && (!deviceId || alert.deviceId === deviceId)
    );

    return active.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get alert statistics
   */
  public getStatistics(): AlertStatistics {
    const allAlerts = Array.from(this.alerts.values());

    const stats: AlertStatistics = {
      totalAlerts: allAlerts.length,
      activeAlerts: allAlerts.filter((a) => !a.resolved).length,
      resolvedAlerts: allAlerts.filter((a) => a.resolved).length,
      acknowledgedAlerts: allAlerts.filter((a) => a.acknowledged).length,
      bySeverity: {
        info: 0,
        warning: 0,
        error: 0,
        critical: 0,
      },
      byDevice: {},
      bySensor: {},
      avgResolutionTime: 0,
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    for (const alert of allAlerts) {
      // By severity
      stats.bySeverity[alert.severity]++;

      // By device
      stats.byDevice[alert.deviceId] = (stats.byDevice[alert.deviceId] || 0) + 1;

      // By sensor
      stats.bySensor[alert.sensorType] = (stats.bySensor[alert.sensorType] || 0) + 1;

      // Resolution time
      if (alert.resolved && alert.resolvedAt) {
        totalResolutionTime += alert.resolvedAt - alert.timestamp;
        resolvedCount++;
      }
    }

    if (resolvedCount > 0) {
      stats.avgResolutionTime = totalResolutionTime / resolvedCount;
    }

    return stats;
  }

  // ===== Private Helper Methods =====

  /**
   * Store sensor history for change-rate calculations
   */
  private storeSensorHistory(sensorType: string, value: number, timestamp: number): void {
    if (!this.sensorHistory.has(sensorType)) {
      this.sensorHistory.set(sensorType, []);
    }

    const history = this.sensorHistory.get(sensorType)!;
    history.push({ value, timestamp });

    // Keep only last 10 readings
    if (history.length > 10) {
      history.shift();
    }
  }

  /**
   * Calculate rate of change
   */
  private calculateChangeRate(sensorType: string): number | null {
    const history = this.sensorHistory.get(sensorType);

    if (!history || history.length < 2) {
      return null;
    }

    const latest = history[history.length - 1];
    const previous = history[history.length - 2];

    const valueDiff = latest.value - previous.value;
    const timeDiff = (latest.timestamp - previous.timestamp) / 1000; // seconds

    return valueDiff / timeDiff;
  }

  /**
   * Simulate sending email
   */
  private async sendEmail(channel: NotificationChannel, alert: Alert): Promise<void> {
    await this.sleep(100);
    // In real implementation: use nodemailer or email service
  }

  /**
   * Simulate sending SMS
   */
  private async sendSMS(channel: NotificationChannel, alert: Alert): Promise<void> {
    await this.sleep(100);
    // In real implementation: use Twilio or SMS gateway
  }

  /**
   * Simulate sending webhook
   */
  private async sendWebhook(channel: NotificationChannel, alert: Alert): Promise<void> {
    await this.sleep(100);
    // In real implementation: HTTP POST to webhook URL
  }

  /**
   * Simulate sending push notification
   */
  private async sendPushNotification(
    channel: NotificationChannel,
    alert: Alert
  ): Promise<void> {
    await this.sleep(100);
    // In real implementation: use FCM, APNS, or push service
  }

  /**
   * Simulate sending MQTT message
   */
  private async sendMQTT(channel: NotificationChannel, alert: Alert): Promise<void> {
    await this.sleep(100);
    // In real implementation: publish to MQTT broker
  }

  /**
   * Simulate sending Slack message
   */
  private async sendSlack(channel: NotificationChannel, alert: Alert): Promise<void> {
    await this.sleep(100);
    // In real implementation: POST to Slack webhook
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ===== Example Usage =====

async function main() {
  // Create alert system
  const alertSystem = new AlertSystemService();

  console.log('=== Alert System Initialized ===\n');

  // Define thresholds
  alertSystem.defineThreshold({
    id: 'temp-high',
    sensorType: 'temperature',
    condition: 'above',
    value: 30,
    severity: 'warning',
    enabled: true,
    cooldownPeriod: 10000, // 10 seconds
    hysteresis: 0.5,
  });

  alertSystem.defineThreshold({
    id: 'temp-critical',
    sensorType: 'temperature',
    condition: 'above',
    value: 35,
    severity: 'critical',
    enabled: true,
    cooldownPeriod: 5000,
  });

  alertSystem.defineThreshold({
    id: 'humid-range',
    sensorType: 'humidity',
    condition: 'range',
    rangeMin: 30,
    rangeMax: 70,
    severity: 'warning',
    enabled: true,
    cooldownPeriod: 15000,
  });

  // Add notification channels
  alertSystem.addChannel({
    id: 'email-critical',
    type: 'email',
    enabled: true,
    severityFilter: ['critical', 'error'],
    config: {
      to: ['admin@example.com', 'ops@example.com'],
      from: 'alerts@iot.example.com',
    },
    retryPolicy: {
      maxRetries: 3,
      retryDelay: 5000,
    },
  });

  alertSystem.addChannel({
    id: 'slack-all',
    type: 'slack',
    enabled: true,
    severityFilter: ['info', 'warning', 'error', 'critical'],
    config: {
      webhookUrl: 'https://hooks.slack.com/services/XXX/YYY/ZZZ',
      channel: '#iot-alerts',
    },
    retryPolicy: {
      maxRetries: 2,
      retryDelay: 3000,
    },
  });

  // Listen to events
  alertSystem.on('alert-triggered', (alert: Alert) => {
    console.log(`[Event] Alert triggered: ${alert.id} (${alert.severity})`);
  });

  alertSystem.on('notification-sent', ({ channel, alert }: any) => {
    console.log(`[Event] Notification sent via ${channel.type} for alert ${alert.id}`);
  });

  // Simulate sensor data
  console.log('\n=== Simulating Sensor Data ===');

  const deviceId = 'sensor-device-001';

  // Normal readings
  alertSystem.processSensorData(deviceId, 'temperature', 25);
  alertSystem.processSensorData(deviceId, 'humidity', 50);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Warning threshold violation
  alertSystem.processSensorData(deviceId, 'temperature', 32);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Critical threshold violation
  alertSystem.processSensorData(deviceId, 'temperature', 37);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Humidity out of range
  alertSystem.processSensorData(deviceId, 'humidity', 85);

  // Get active alerts
  console.log('\n=== Active Alerts ===');
  const activeAlerts = alertSystem.getActiveAlerts();
  activeAlerts.forEach((alert) => {
    console.log(`${alert.id}: [${alert.severity}] ${alert.message}`);
  });

  // Acknowledge an alert
  if (activeAlerts.length > 0) {
    alertSystem.acknowledgeAlert(activeAlerts[0].id, 'operator-john');
  }

  // Resolve an alert
  if (activeAlerts.length > 1) {
    alertSystem.resolveAlert(activeAlerts[1].id);
  }

  // Get statistics
  console.log('\n=== Alert Statistics ===');
  const stats = alertSystem.getStatistics();
  console.log(`Total Alerts: ${stats.totalAlerts}`);
  console.log(`Active Alerts: ${stats.activeAlerts}`);
  console.log(`Resolved Alerts: ${stats.resolvedAlerts}`);
  console.log(`Acknowledged Alerts: ${stats.acknowledgedAlerts}`);
  console.log('By Severity:', stats.bySeverity);
  console.log('By Sensor:', stats.bySensor);
}

// Run example if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
