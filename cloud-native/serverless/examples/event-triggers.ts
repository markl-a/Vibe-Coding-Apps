/**
 * Event-Driven Serverless Functions
 *
 * Comprehensive examples of event-driven Lambda functions triggered by various AWS services
 * including EventBridge, SNS, Kinesis, Step Functions, and custom event patterns.
 */

import {
  SNSEvent,
  SQSEvent,
  KinesisStreamEvent,
  EventBridgeEvent,
  CloudWatchLogsEvent,
  ScheduledEvent,
  Context
} from 'aws-lambda';
import { SNS, SQS, Kinesis, EventBridge, StepFunctions } from 'aws-sdk';

const sns = new SNS();
const sqs = new SQS();
const kinesis = new Kinesis();
const eventBridge = new EventBridge();
const stepFunctions = new StepFunctions();

// ============================================================================
// 1. SNS Event Handler (Pub/Sub Pattern)
// ============================================================================

export const snsEventHandler = async (event: SNSEvent): Promise<void> => {
  console.log(`Processing ${event.Records.length} SNS messages`);

  for (const record of event.Records) {
    const message = record.Sns;
    console.log('SNS Message:', {
      messageId: message.MessageId,
      subject: message.Subject,
      timestamp: message.Timestamp,
      topicArn: message.TopicArn
    });

    try {
      // Parse message body
      const body = JSON.parse(message.Message);

      // Route based on message attributes or subject
      const messageType = message.MessageAttributes?.type?.Value || 'default';

      switch (messageType) {
        case 'user.notification':
          await handleUserNotification(body);
          break;

        case 'order.confirmation':
          await handleOrderConfirmation(body);
          break;

        case 'system.alert':
          await handleSystemAlert(body, message.Subject);
          break;

        default:
          console.log('Unknown message type:', messageType);
          await handleDefaultMessage(body);
      }
    } catch (error) {
      console.error(`Error processing SNS message ${message.MessageId}:`, error);

      // Send to DLQ or error notification
      await notifyError('SNS Handler', message.MessageId, error);

      // Don't throw - SNS doesn't support selective message retry
    }
  }
};

// ============================================================================
// 2. Kinesis Stream Handler (Real-time Data Processing)
// ============================================================================

export const kinesisStreamHandler = async (
  event: KinesisStreamEvent
): Promise<void> => {
  console.log(`Processing ${event.Records.length} Kinesis records`);

  // Process records in batches for efficiency
  const batchSize = 10;
  const batches: any[][] = [];

  for (let i = 0; i < event.Records.length; i += batchSize) {
    batches.push(event.Records.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    try {
      await processBatch(batch);
    } catch (error) {
      console.error('Error processing batch:', error);
      // Continue with next batch
    }
  }
};

async function processBatch(records: any[]): Promise<void> {
  const processedRecords = records.map((record) => {
    // Decode Kinesis data
    const payload = Buffer.from(record.kinesis.data, 'base64').toString('utf-8');
    const data = JSON.parse(payload);

    console.log('Kinesis Record:', {
      sequenceNumber: record.kinesis.sequenceNumber,
      partitionKey: record.kinesis.partitionKey,
      data
    });

    return data;
  });

  // Process records based on type
  const clickEvents = processedRecords.filter(r => r.type === 'click');
  const viewEvents = processedRecords.filter(r => r.type === 'view');
  const purchaseEvents = processedRecords.filter(r => r.type === 'purchase');

  await Promise.all([
    processClickEvents(clickEvents),
    processViewEvents(viewEvents),
    processPurchaseEvents(purchaseEvents)
  ]);
}

// ============================================================================
// 3. EventBridge Event Patterns
// ============================================================================

// Custom Application Events
interface OrderEvent {
  orderId: string;
  customerId: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  timestamp: string;
}

export const orderEventHandler = async (
  event: EventBridgeEvent<'OrderStatusChanged', OrderEvent>
): Promise<void> => {
  console.log('Order Event:', event);

  const order = event.detail;

  try {
    switch (order.status) {
      case 'confirmed':
        await handleOrderConfirmed(order);
        // Trigger inventory reservation
        await publishEvent('InventoryReserve', {
          orderId: order.orderId,
          requestedBy: 'OrderService'
        });
        break;

      case 'shipped':
        await handleOrderShipped(order);
        // Send tracking notification
        await sendNotification(order.customerId, 'order-shipped', {
          orderId: order.orderId
        });
        break;

      case 'delivered':
        await handleOrderDelivered(order);
        // Request feedback
        await scheduleTask('RequestFeedback', order.customerId, {
          delay: 86400 // 24 hours
        });
        break;
    }
  } catch (error) {
    console.error('Error handling order event:', error);
    throw error;
  }
};

// AWS Service Events
export const ec2StateChangeHandler = async (
  event: EventBridgeEvent<'EC2 Instance State-change Notification', any>
): Promise<void> => {
  console.log('EC2 State Change:', event);

  const { state, 'instance-id': instanceId } = event.detail;

  if (state === 'terminated') {
    // Clean up resources associated with instance
    await cleanupInstanceResources(instanceId);

    // Notify operations team
    await sns.publish({
      TopicArn: process.env.OPS_TOPIC_ARN!,
      Subject: 'EC2 Instance Terminated',
      Message: JSON.stringify({
        instanceId,
        timestamp: event.time,
        account: event.account,
        region: event.region
      })
    }).promise();
  }
};

// ============================================================================
// 4. CloudWatch Logs Event Handler (Log Processing)
// ============================================================================

export const cloudwatchLogsHandler = async (
  event: CloudWatchLogsEvent
): Promise<void> => {
  // Decode and decompress CloudWatch Logs data
  const payload = Buffer.from(event.awslogs.data, 'base64');
  const decompressed = await decompressGzip(payload);
  const logData = JSON.parse(decompressed.toString('utf-8'));

  console.log('Log Group:', logData.logGroup);
  console.log('Log Stream:', logData.logStream);

  // Process log events
  for (const logEvent of logData.logEvents) {
    const message = logEvent.message;

    // Parse structured logs (JSON)
    try {
      const structured = JSON.parse(message);

      // Route based on log level or type
      if (structured.level === 'ERROR' || structured.level === 'FATAL') {
        await handleErrorLog(structured, logData.logGroup, logData.logStream);
      } else if (structured.type === 'audit') {
        await handleAuditLog(structured);
      } else if (structured.type === 'metrics') {
        await handleMetricsLog(structured);
      }
    } catch {
      // Plain text log
      if (message.includes('ERROR') || message.includes('Exception')) {
        await handlePlainTextError(message, logData.logGroup);
      }
    }
  }
};

// ============================================================================
// 5. Scheduled Events (Cron Jobs)
// ============================================================================

export const dailyScheduledTask = async (
  event: ScheduledEvent
): Promise<void> => {
  console.log('Daily task triggered at:', event.time);

  const tasks = [
    { name: 'Database Cleanup', fn: performDatabaseCleanup },
    { name: 'Report Generation', fn: generateDailyReports },
    { name: 'Data Aggregation', fn: aggregateDailyMetrics },
    { name: 'Backup Verification', fn: verifyBackups }
  ];

  const results = await Promise.allSettled(
    tasks.map(async (task) => {
      console.log(`Starting: ${task.name}`);
      const start = Date.now();

      try {
        await task.fn();
        const duration = Date.now() - start;
        console.log(`✓ ${task.name} completed in ${duration}ms`);
        return { task: task.name, status: 'success', duration };
      } catch (error) {
        console.error(`✗ ${task.name} failed:`, error);
        throw error;
      }
    })
  );

  // Report results
  const summary = {
    timestamp: event.time,
    tasks: results.map((r, i) => ({
      name: tasks[i].name,
      status: r.status,
      ...(r.status === 'fulfilled' ? r.value : { error: (r as any).reason })
    }))
  };

  await publishEvent('ScheduledTaskCompleted', summary);
};

// ============================================================================
// 6. Step Functions Integration (Workflow Orchestration)
// ============================================================================

interface WorkflowInput {
  workflowId: string;
  type: string;
  data: any;
}

export const startWorkflow = async (event: any): Promise<void> => {
  console.log('Starting workflow:', event);

  const input: WorkflowInput = {
    workflowId: generateId(),
    type: event.workflowType || 'default',
    data: event.data
  };

  try {
    const execution = await stepFunctions.startExecution({
      stateMachineArn: process.env.STATE_MACHINE_ARN!,
      name: input.workflowId,
      input: JSON.stringify(input)
    }).promise();

    console.log('Workflow started:', execution.executionArn);

    // Store execution reference
    await storeWorkflowExecution(input.workflowId, execution.executionArn);
  } catch (error) {
    console.error('Failed to start workflow:', error);
    throw error;
  }
};

// Step Functions Task Handler
export const workflowTaskHandler = async (
  event: WorkflowInput,
  context: Context
): Promise<any> => {
  console.log('Executing workflow task:', event);

  try {
    // Perform task based on workflow type
    const result = await executeWorkflowTask(event.type, event.data);

    return {
      statusCode: 200,
      body: result
    };
  } catch (error) {
    console.error('Workflow task failed:', error);

    // Return error for Step Functions to handle
    return {
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// ============================================================================
// 7. Fan-Out Pattern (Parallel Processing)
// ============================================================================

export const fanOutHandler = async (event: any): Promise<void> => {
  console.log('Fan-out event received:', event);

  const items = event.items || [];

  // Split items into chunks for parallel processing
  const chunkSize = 100;
  const chunks: any[][] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  // Publish each chunk to SQS for parallel processing
  const promises = chunks.map((chunk, index) =>
    sqs.sendMessage({
      QueueUrl: process.env.PROCESSING_QUEUE_URL!,
      MessageBody: JSON.stringify({
        chunkIndex: index,
        totalChunks: chunks.length,
        items: chunk
      }),
      MessageAttributes: {
        chunkIndex: {
          DataType: 'Number',
          StringValue: index.toString()
        }
      }
    }).promise()
  );

  await Promise.all(promises);

  console.log(`Fan-out complete: ${chunks.length} chunks queued`);
};

// ============================================================================
// 8. Circuit Breaker Pattern (Fault Tolerance)
// ============================================================================

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime! >= this.timeout) {
        console.log('Circuit breaker entering HALF_OPEN state');
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();

      // Success - reset circuit breaker
      if (this.state === 'HALF_OPEN') {
        console.log('Circuit breaker closing');
        this.state = 'CLOSED';
      }
      this.failures = 0;

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.threshold) {
        console.log('Circuit breaker opening');
        this.state = 'OPEN';
      }

      throw error;
    }
  }
}

const externalServiceBreaker = new CircuitBreaker(5, 60000);

export const resilientEventHandler = async (event: any): Promise<void> => {
  try {
    await externalServiceBreaker.execute(async () => {
      await callExternalService(event.data);
    });

    console.log('Event processed successfully');
  } catch (error) {
    console.error('Failed to process event:', error);

    // Send to DLQ for later retry
    await sendToDeadLetterQueue(event, error);
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

async function handleUserNotification(body: any): Promise<void> {
  console.log('Handling user notification:', body);
  // Send email, SMS, or push notification
}

async function handleOrderConfirmation(body: any): Promise<void> {
  console.log('Handling order confirmation:', body);
  // Send confirmation email
}

async function handleSystemAlert(body: any, subject?: string): Promise<void> {
  console.log('System alert:', subject, body);
  // Send to monitoring system
}

async function handleDefaultMessage(body: any): Promise<void> {
  console.log('Handling default message:', body);
}

async function notifyError(source: string, messageId: string, error: any): Promise<void> {
  await sns.publish({
    TopicArn: process.env.ERROR_TOPIC_ARN!,
    Subject: `Error in ${source}`,
    Message: JSON.stringify({ messageId, error: error.message })
  }).promise();
}

async function processClickEvents(events: any[]): Promise<void> {
  console.log(`Processing ${events.length} click events`);
}

async function processViewEvents(events: any[]): Promise<void> {
  console.log(`Processing ${events.length} view events`);
}

async function processPurchaseEvents(events: any[]): Promise<void> {
  console.log(`Processing ${events.length} purchase events`);
}

async function handleOrderConfirmed(order: OrderEvent): Promise<void> {
  console.log('Order confirmed:', order.orderId);
}

async function handleOrderShipped(order: OrderEvent): Promise<void> {
  console.log('Order shipped:', order.orderId);
}

async function handleOrderDelivered(order: OrderEvent): Promise<void> {
  console.log('Order delivered:', order.orderId);
}

async function publishEvent(eventType: string, detail: any): Promise<void> {
  await eventBridge.putEvents({
    Entries: [{
      Source: 'custom.application',
      DetailType: eventType,
      Detail: JSON.stringify(detail),
      EventBusName: process.env.EVENT_BUS_NAME || 'default'
    }]
  }).promise();
}

async function sendNotification(
  userId: string,
  type: string,
  data: any
): Promise<void> {
  console.log(`Sending ${type} notification to user ${userId}`);
}

async function scheduleTask(
  taskType: string,
  targetId: string,
  options: any
): Promise<void> {
  console.log(`Scheduling ${taskType} for ${targetId}`, options);
}

async function cleanupInstanceResources(instanceId: string): Promise<void> {
  console.log(`Cleaning up resources for instance ${instanceId}`);
}

async function decompressGzip(buffer: Buffer): Promise<Buffer> {
  const zlib = require('zlib');
  return new Promise((resolve, reject) => {
    zlib.gunzip(buffer, (err: any, result: Buffer) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function handleErrorLog(
  log: any,
  logGroup: string,
  logStream: string
): Promise<void> {
  console.log('Error log detected:', log);

  await sns.publish({
    TopicArn: process.env.ERROR_TOPIC_ARN!,
    Subject: 'Application Error Detected',
    Message: JSON.stringify({ log, logGroup, logStream })
  }).promise();
}

async function handleAuditLog(log: any): Promise<void> {
  console.log('Audit log:', log);
  // Store in audit database
}

async function handleMetricsLog(log: any): Promise<void> {
  console.log('Metrics log:', log);
  // Send to metrics aggregation service
}

async function handlePlainTextError(message: string, logGroup: string): Promise<void> {
  console.log('Plain text error:', message);
}

async function performDatabaseCleanup(): Promise<void> {
  console.log('Performing database cleanup...');
  await sleep(1000);
}

async function generateDailyReports(): Promise<void> {
  console.log('Generating daily reports...');
  await sleep(1500);
}

async function aggregateDailyMetrics(): Promise<void> {
  console.log('Aggregating daily metrics...');
  await sleep(1200);
}

async function verifyBackups(): Promise<void> {
  console.log('Verifying backups...');
  await sleep(800);
}

async function storeWorkflowExecution(
  workflowId: string,
  executionArn: string
): Promise<void> {
  console.log(`Storing workflow ${workflowId}: ${executionArn}`);
}

async function executeWorkflowTask(type: string, data: any): Promise<any> {
  console.log(`Executing workflow task: ${type}`);
  await sleep(500);
  return { status: 'completed', data };
}

async function callExternalService(data: any): Promise<void> {
  // Simulate external service call that might fail
  if (Math.random() > 0.8) {
    throw new Error('External service unavailable');
  }
  console.log('External service call successful');
}

async function sendToDeadLetterQueue(event: any, error: any): Promise<void> {
  await sqs.sendMessage({
    QueueUrl: process.env.DLQ_URL!,
    MessageBody: JSON.stringify({
      originalEvent: event,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }).promise();
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
