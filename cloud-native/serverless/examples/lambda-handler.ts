/**
 * AWS Lambda Handler Patterns
 *
 * Comprehensive examples of AWS Lambda function patterns and best practices
 * including different event sources, error handling, and optimization techniques.
 */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  SQSEvent,
  S3Event,
  DynamoDBStreamEvent,
  EventBridgeEvent,
  Context,
  Callback
} from 'aws-lambda';
import { DynamoDB, S3, SNS } from 'aws-sdk';

// ============================================================================
// 1. Basic HTTP API Handler (API Gateway)
// ============================================================================

export const simpleHttpHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { name, email } = body;

    if (!name || !email) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Missing required fields: name and email'
        })
      };
    }

    // Process the request
    const result = await processUser({ name, email });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'User processed successfully',
        data: result
      })
    };
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

// ============================================================================
// 2. Advanced HTTP Handler with Middleware Pattern
// ============================================================================

interface MiddlewareContext {
  event: APIGatewayProxyEvent;
  context: Context;
  data?: any;
}

type Middleware = (
  ctx: MiddlewareContext
) => Promise<MiddlewareContext | APIGatewayProxyResult>;

const compose = (...middlewares: Middleware[]) => {
  return async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    let ctx: MiddlewareContext = { event, context };

    for (const middleware of middlewares) {
      const result = await middleware(ctx);

      // If middleware returns a response, short-circuit
      if ('statusCode' in result) {
        return result;
      }

      ctx = result;
    }

    // If we get here, return error (no handler returned a response)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'No response generated' })
    };
  };
};

// Logging middleware
const loggingMiddleware: Middleware = async (ctx) => {
  console.log('Request received:', {
    path: ctx.event.path,
    method: ctx.event.httpMethod,
    requestId: ctx.context.requestId
  });
  return ctx;
};

// Authentication middleware
const authMiddleware: Middleware = async (ctx) => {
  const authHeader = ctx.event.headers.Authorization || ctx.event.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  const token = authHeader.substring(7);

  try {
    // Verify token (mock implementation)
    const user = await verifyToken(token);
    ctx.data = { ...ctx.data, user };
    return ctx;
  } catch (error) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid token' })
    };
  }
};

// Business logic handler
const businessLogicMiddleware: Middleware = async (ctx) => {
  const body = ctx.event.body ? JSON.parse(ctx.event.body) : {};
  const user = ctx.data?.user;

  const result = await processBusinessLogic(body, user);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result)
  };
};

// Composed handler
export const advancedHttpHandler = compose(
  loggingMiddleware,
  authMiddleware,
  businessLogicMiddleware
);

// ============================================================================
// 3. SQS Event Handler (Batch Processing)
// ============================================================================

export const sqsHandler = async (event: SQSEvent): Promise<void> => {
  console.log(`Processing ${event.Records.length} SQS messages`);

  // Process messages in parallel with error handling
  const results = await Promise.allSettled(
    event.Records.map(async (record) => {
      try {
        const message = JSON.parse(record.body);
        console.log('Processing message:', message);

        // Process the message
        await processMessage(message);

        console.log(`Successfully processed message: ${record.messageId}`);
      } catch (error) {
        console.error(`Failed to process message ${record.messageId}:`, error);

        // Optionally send to DLQ or error notification
        await handleMessageError(record, error);

        // Re-throw to make the message visible again for retry
        throw error;
      }
    })
  );

  // Report on batch processing results
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`Batch processing complete: ${succeeded} succeeded, ${failed} failed`);

  // If any message failed, Lambda will automatically retry
  if (failed > 0) {
    throw new Error(`${failed} messages failed to process`);
  }
};

// ============================================================================
// 4. S3 Event Handler
// ============================================================================

export const s3EventHandler = async (event: S3Event): Promise<void> => {
  const s3 = new S3();

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const eventName = record.eventName;

    console.log(`S3 Event: ${eventName} - ${bucket}/${key}`);

    try {
      if (eventName.startsWith('ObjectCreated:')) {
        // Handle new object
        const object = await s3.getObject({ Bucket: bucket, Key: key }).promise();

        // Process the file based on type
        if (key.endsWith('.json')) {
          const data = JSON.parse(object.Body!.toString('utf-8'));
          await processJsonFile(data, bucket, key);
        } else if (key.endsWith('.csv')) {
          await processCsvFile(object.Body!.toString('utf-8'), bucket, key);
        } else if (key.match(/\.(jpg|jpeg|png|gif)$/i)) {
          await processImageFile(object.Body!, bucket, key);
        }

        console.log(`Successfully processed ${bucket}/${key}`);
      } else if (eventName.startsWith('ObjectRemoved:')) {
        // Handle object deletion
        await handleObjectDeletion(bucket, key);
      }
    } catch (error) {
      console.error(`Error processing S3 object ${bucket}/${key}:`, error);
      throw error;
    }
  }
};

// ============================================================================
// 5. DynamoDB Stream Handler
// ============================================================================

export const dynamodbStreamHandler = async (
  event: DynamoDBStreamEvent
): Promise<void> => {
  console.log(`Processing ${event.Records.length} DynamoDB stream records`);

  for (const record of event.Records) {
    console.log('Event Type:', record.eventName);

    try {
      switch (record.eventName) {
        case 'INSERT':
          if (record.dynamodb?.NewImage) {
            const newItem = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
            await handleInsert(newItem);
          }
          break;

        case 'MODIFY':
          if (record.dynamodb?.NewImage && record.dynamodb?.OldImage) {
            const newItem = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
            const oldItem = DynamoDB.Converter.unmarshall(record.dynamodb.OldImage);
            await handleUpdate(oldItem, newItem);
          }
          break;

        case 'REMOVE':
          if (record.dynamodb?.OldImage) {
            const deletedItem = DynamoDB.Converter.unmarshall(record.dynamodb.OldImage);
            await handleDelete(deletedItem);
          }
          break;
      }
    } catch (error) {
      console.error(`Error processing DynamoDB record:`, error);
      // Continue processing other records
    }
  }
};

// ============================================================================
// 6. EventBridge Handler
// ============================================================================

interface CustomEventDetail {
  action: string;
  resourceId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export const eventBridgeHandler = async (
  event: EventBridgeEvent<string, CustomEventDetail>
): Promise<void> => {
  console.log('EventBridge Event:', {
    source: event.source,
    detailType: event['detail-type'],
    detail: event.detail
  });

  const { action, resourceId, metadata } = event.detail;

  try {
    switch (action) {
      case 'user.created':
        await handleUserCreated(resourceId, metadata);
        break;

      case 'order.placed':
        await handleOrderPlaced(resourceId, metadata);
        break;

      case 'payment.processed':
        await handlePaymentProcessed(resourceId, metadata);
        break;

      default:
        console.warn(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error(`Error handling event ${action}:`, error);
    throw error;
  }
};

// ============================================================================
// 7. Scheduled Lambda (CloudWatch Events/EventBridge)
// ============================================================================

export const scheduledHandler = async (
  event: any,
  context: Context
): Promise<void> => {
  console.log('Scheduled Lambda execution started');
  console.log('Time:', event.time);
  console.log('Region:', event.region);

  const startTime = Date.now();

  try {
    // Perform scheduled task
    await performDailyCleanup();
    await generateDailyReports();
    await syncExternalData();

    const duration = Date.now() - startTime;
    console.log(`Scheduled task completed successfully in ${duration}ms`);

    // Send success notification
    await sendNotification('Success', `Scheduled task completed in ${duration}ms`);
  } catch (error) {
    console.error('Scheduled task failed:', error);

    // Send failure notification
    await sendNotification('Error', `Scheduled task failed: ${error}`);

    throw error;
  }
};

// ============================================================================
// 8. Warm-up Handler (Prevent Cold Starts)
// ============================================================================

let isWarm = false;

export const warmUpHandler = async (
  event: any,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Check if this is a warming event
  if (event.source === 'serverless-plugin-warmup') {
    console.log('Warming up Lambda function');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Lambda is warm' })
    };
  }

  // Mark function as warm
  if (!isWarm) {
    console.log('Cold start detected, initializing...');
    await initialize();
    isWarm = true;
  } else {
    console.log('Warm start - function already initialized');
  }

  // Process actual request
  return await simpleHttpHandler(event);
};

// ============================================================================
// 9. Error Handling and Retry Pattern
// ============================================================================

interface RetryOptions {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = { maxRetries: 3, retryDelay: 1000, backoffMultiplier: 2 }
): Promise<T> {
  let lastError: Error;
  let delay = options.retryDelay;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < options.maxRetries) {
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await sleep(delay);
        delay *= options.backoffMultiplier;
      }
    }
  }

  throw lastError!;
}

export const resilientHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Call external service with retry logic
    const result = await withRetry(
      () => callExternalService(event.body),
      { maxRetries: 3, retryDelay: 1000, backoffMultiplier: 2 }
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('All retry attempts failed:', error);
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Service temporarily unavailable',
        message: 'Please try again later'
      })
    };
  }
};

// ============================================================================
// Helper Functions (Mock Implementations)
// ============================================================================

async function processUser(data: { name: string; email: string }) {
  // Mock implementation
  return { id: Date.now(), ...data, createdAt: new Date().toISOString() };
}

async function verifyToken(token: string): Promise<any> {
  // Mock JWT verification
  if (token === 'invalid') throw new Error('Invalid token');
  return { id: '123', username: 'testuser', role: 'user' };
}

async function processBusinessLogic(body: any, user: any) {
  return { success: true, user, body };
}

async function processMessage(message: any): Promise<void> {
  // Mock message processing
  await sleep(100);
}

async function handleMessageError(record: any, error: any): Promise<void> {
  const sns = new SNS();
  await sns.publish({
    TopicArn: process.env.ERROR_TOPIC_ARN!,
    Message: JSON.stringify({ record, error: error.message })
  }).promise();
}

async function processJsonFile(data: any, bucket: string, key: string): Promise<void> {
  console.log(`Processing JSON file: ${bucket}/${key}`);
}

async function processCsvFile(content: string, bucket: string, key: string): Promise<void> {
  console.log(`Processing CSV file: ${bucket}/${key}`);
}

async function processImageFile(buffer: Buffer, bucket: string, key: string): Promise<void> {
  console.log(`Processing image file: ${bucket}/${key}`);
}

async function handleObjectDeletion(bucket: string, key: string): Promise<void> {
  console.log(`Object deleted: ${bucket}/${key}`);
}

async function handleInsert(item: any): Promise<void> {
  console.log('New item inserted:', item);
}

async function handleUpdate(oldItem: any, newItem: any): Promise<void> {
  console.log('Item updated:', { oldItem, newItem });
}

async function handleDelete(item: any): Promise<void> {
  console.log('Item deleted:', item);
}

async function handleUserCreated(userId: string, metadata?: any): Promise<void> {
  console.log(`User created: ${userId}`, metadata);
}

async function handleOrderPlaced(orderId: string, metadata?: any): Promise<void> {
  console.log(`Order placed: ${orderId}`, metadata);
}

async function handlePaymentProcessed(paymentId: string, metadata?: any): Promise<void> {
  console.log(`Payment processed: ${paymentId}`, metadata);
}

async function performDailyCleanup(): Promise<void> {
  console.log('Performing daily cleanup...');
  await sleep(1000);
}

async function generateDailyReports(): Promise<void> {
  console.log('Generating daily reports...');
  await sleep(1000);
}

async function syncExternalData(): Promise<void> {
  console.log('Syncing external data...');
  await sleep(1000);
}

async function sendNotification(level: string, message: string): Promise<void> {
  console.log(`[${level}] ${message}`);
}

async function initialize(): Promise<void> {
  console.log('Initializing connections and resources...');
  await sleep(500);
}

async function callExternalService(data: any): Promise<any> {
  // Mock external service call that might fail
  if (Math.random() > 0.7) {
    throw new Error('External service temporarily unavailable');
  }
  return { success: true, data };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
