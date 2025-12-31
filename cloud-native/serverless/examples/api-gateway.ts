/**
 * API Gateway Integration Patterns
 *
 * Comprehensive examples of AWS API Gateway integration patterns including
 * REST APIs, HTTP APIs, WebSocket APIs, custom authorizers, and request/response transformations.
 */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayTokenAuthorizerEvent,
  APIGatewayRequestAuthorizerEvent,
  APIGatewayAuthorizerResult,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  APIGatewayProxyWebsocketEventV2,
  Context
} from 'aws-lambda';
import { DynamoDB, ApiGatewayManagementApi } from 'aws-sdk';

// ============================================================================
// 1. REST API - CRUD Operations
// ============================================================================

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

const dynamodb = new DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || 'users';

// GET /users - List all users
export const listUsers = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Listing users');

  try {
    // Parse query parameters for pagination
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 20;
    const lastKey = event.queryStringParameters?.lastKey;

    const params: DynamoDB.DocumentClient.ScanInput = {
      TableName: USERS_TABLE,
      Limit: limit
    };

    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(
        Buffer.from(lastKey, 'base64').toString('utf-8')
      );
    }

    const result = await dynamodb.scan(params).promise();

    const response = {
      users: result.Items,
      count: result.Count,
      ...(result.LastEvaluatedKey && {
        nextToken: Buffer.from(
          JSON.stringify(result.LastEvaluatedKey)
        ).toString('base64')
      })
    };

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error listing users:', error);
    return errorResponse(500, 'Failed to list users');
  }
};

// GET /users/{id} - Get user by ID
export const getUser = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userId = event.pathParameters?.id;

  if (!userId) {
    return errorResponse(400, 'User ID is required');
  }

  try {
    const result = await dynamodb.get({
      TableName: USERS_TABLE,
      Key: { id: userId }
    }).promise();

    if (!result.Item) {
      return errorResponse(404, 'User not found');
    }

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify(result.Item)
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return errorResponse(500, 'Failed to get user');
  }
};

// POST /users - Create new user
export const createUser = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { name, email } = body;

    // Validate input
    if (!name || !email) {
      return errorResponse(400, 'Name and email are required');
    }

    if (!isValidEmail(email)) {
      return errorResponse(400, 'Invalid email format');
    }

    const now = new Date().toISOString();
    const user: User = {
      id: generateId(),
      name,
      email,
      createdAt: now,
      updatedAt: now
    };

    await dynamodb.put({
      TableName: USERS_TABLE,
      Item: user,
      ConditionExpression: 'attribute_not_exists(id)'
    }).promise();

    return {
      statusCode: 201,
      headers: corsHeaders(),
      body: JSON.stringify(user)
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return errorResponse(500, 'Failed to create user');
  }
};

// PUT /users/{id} - Update user
export const updateUser = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userId = event.pathParameters?.id;

  if (!userId) {
    return errorResponse(400, 'User ID is required');
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { name, email } = body;

    const updateExpression: string[] = [];
    const expressionAttributeValues: any = {};
    const expressionAttributeNames: any = {};

    if (name) {
      updateExpression.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = name;
    }

    if (email) {
      if (!isValidEmail(email)) {
        return errorResponse(400, 'Invalid email format');
      }
      updateExpression.push('email = :email');
      expressionAttributeValues[':email'] = email;
    }

    if (updateExpression.length === 0) {
      return errorResponse(400, 'No fields to update');
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await dynamodb.update({
      TableName: USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: 'SET ' + updateExpression.join(', '),
      ExpressionAttributeValues: expressionAttributeValues,
      ...(Object.keys(expressionAttributeNames).length > 0 && {
        ExpressionAttributeNames: expressionAttributeNames
      }),
      ReturnValues: 'ALL_NEW'
    }).promise();

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify(result.Attributes)
    };
  } catch (error) {
    console.error('Error updating user:', error);
    return errorResponse(500, 'Failed to update user');
  }
};

// DELETE /users/{id} - Delete user
export const deleteUser = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userId = event.pathParameters?.id;

  if (!userId) {
    return errorResponse(400, 'User ID is required');
  }

  try {
    await dynamodb.delete({
      TableName: USERS_TABLE,
      Key: { id: userId },
      ConditionExpression: 'attribute_exists(id)'
    }).promise();

    return {
      statusCode: 204,
      headers: corsHeaders(),
      body: ''
    };
  } catch (error: any) {
    if (error.code === 'ConditionalCheckFailedException') {
      return errorResponse(404, 'User not found');
    }
    console.error('Error deleting user:', error);
    return errorResponse(500, 'Failed to delete user');
  }
};

// ============================================================================
// 2. HTTP API (v2) - Simplified Format
// ============================================================================

export const httpApiHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  console.log('HTTP API Event:', JSON.stringify(event, null, 2));

  const { requestContext, body, queryStringParameters, pathParameters } = event;
  const { http, requestId } = requestContext;

  try {
    // Route based on HTTP method and path
    const route = `${http.method} ${http.path}`;

    switch (route) {
      case 'GET /api/health':
        return {
          statusCode: 200,
          body: JSON.stringify({ status: 'healthy', timestamp: Date.now() })
        };

      case 'POST /api/data':
        const data = body ? JSON.parse(body) : {};
        const result = await processData(data);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result)
        };

      default:
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Route not found' })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        requestId
      })
    };
  }
};

// ============================================================================
// 3. Custom Authorizers
// ============================================================================

// Token-based authorizer (JWT)
export const tokenAuthorizer = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  console.log('Token Authorizer Event:', JSON.stringify(event, null, 2));

  const token = event.authorizationToken;

  try {
    // Verify token (mock implementation)
    const decoded = await verifyJwtToken(token);

    // Generate IAM policy
    return generatePolicy(
      decoded.sub,
      'Allow',
      event.methodArn,
      {
        userId: decoded.sub,
        email: decoded.email,
        role: decoded.role
      }
    );
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Unauthorized');
  }
};

// Request-based authorizer
export const requestAuthorizer = async (
  event: APIGatewayRequestAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  console.log('Request Authorizer Event:', JSON.stringify(event, null, 2));

  const { headers, queryStringParameters } = event;

  try {
    // Check API key in header or query parameter
    const apiKey = headers?.['x-api-key'] || queryStringParameters?.apiKey;

    if (!apiKey) {
      throw new Error('API key is required');
    }

    // Validate API key
    const user = await validateApiKey(apiKey);

    // Generate policy with context
    return generatePolicy(
      user.id,
      'Allow',
      event.methodArn,
      {
        userId: user.id,
        tier: user.tier,
        rateLimit: user.rateLimit.toString()
      }
    );
  } catch (error) {
    console.error('Authorization failed:', error);
    throw new Error('Unauthorized');
  }
};

// ============================================================================
// 4. WebSocket API Handlers
// ============================================================================

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || 'websocket-connections';

// WebSocket Connect
export const websocketConnect = async (
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;

  console.log(`WebSocket client connecting: ${connectionId}`);

  try {
    // Store connection in DynamoDB
    await dynamodb.put({
      TableName: CONNECTIONS_TABLE,
      Item: {
        connectionId,
        connectedAt: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 86400 // 24 hours
      }
    }).promise();

    return { statusCode: 200, body: 'Connected' };
  } catch (error) {
    console.error('Error storing connection:', error);
    return { statusCode: 500, body: 'Failed to connect' };
  }
};

// WebSocket Disconnect
export const websocketDisconnect = async (
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;

  console.log(`WebSocket client disconnecting: ${connectionId}`);

  try {
    // Remove connection from DynamoDB
    await dynamodb.delete({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId }
    }).promise();

    return { statusCode: 200, body: 'Disconnected' };
  } catch (error) {
    console.error('Error removing connection:', error);
    return { statusCode: 500, body: 'Failed to disconnect' };
  }
};

// WebSocket Default (Message Handler)
export const websocketDefault = async (
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;
  const body = event.body ? JSON.parse(event.body) : {};

  console.log(`Message from ${connectionId}:`, body);

  const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
  const apiGateway = new ApiGatewayManagementApi({ endpoint });

  try {
    const { action, message, targetId } = body;

    switch (action) {
      case 'broadcast':
        // Send message to all connections
        await broadcastMessage(apiGateway, message);
        break;

      case 'send':
        // Send message to specific connection
        if (targetId) {
          await sendToConnection(apiGateway, targetId, message);
        }
        break;

      case 'echo':
        // Echo message back to sender
        await sendToConnection(apiGateway, connectionId, { echo: message });
        break;

      default:
        await sendToConnection(apiGateway, connectionId, {
          error: 'Unknown action'
        });
    }

    return { statusCode: 200, body: 'Message processed' };
  } catch (error) {
    console.error('Error processing message:', error);
    return { statusCode: 500, body: 'Failed to process message' };
  }
};

// ============================================================================
// 5. Request/Response Validation and Transformation
// ============================================================================

interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'email' | 'array' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

const validateRequest = (body: any, rules: ValidationRule[]): string[] => {
  const errors: string[] = [];

  for (const rule of rules) {
    const value = body[rule.field];

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${rule.field} is required`);
      continue;
    }

    // Skip validation if not required and not provided
    if (!rule.required && (value === undefined || value === null)) {
      continue;
    }

    // Type validation
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${rule.field} must be a string`);
        } else {
          if (rule.min && value.length < rule.min) {
            errors.push(`${rule.field} must be at least ${rule.min} characters`);
          }
          if (rule.max && value.length > rule.max) {
            errors.push(`${rule.field} must be at most ${rule.max} characters`);
          }
          if (rule.pattern && !rule.pattern.test(value)) {
            errors.push(`${rule.field} format is invalid`);
          }
        }
        break;

      case 'number':
        if (typeof value !== 'number') {
          errors.push(`${rule.field} must be a number`);
        } else {
          if (rule.min !== undefined && value < rule.min) {
            errors.push(`${rule.field} must be at least ${rule.min}`);
          }
          if (rule.max !== undefined && value > rule.max) {
            errors.push(`${rule.field} must be at most ${rule.max}`);
          }
        }
        break;

      case 'email':
        if (!isValidEmail(value)) {
          errors.push(`${rule.field} must be a valid email`);
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${rule.field} must be an array`);
        }
        break;

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          errors.push(`${rule.field} must be an object`);
        }
        break;
    }
  }

  return errors;
};

export const validatedHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');

    const validationRules: ValidationRule[] = [
      { field: 'name', type: 'string', required: true, min: 2, max: 100 },
      { field: 'email', type: 'email', required: true },
      { field: 'age', type: 'number', min: 18, max: 120 },
      { field: 'tags', type: 'array' }
    ];

    const errors = validateRequest(body, validationRules);

    if (errors.length > 0) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ errors })
      };
    }

    // Process valid request
    const result = await processValidatedRequest(body);

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error:', error);
    return errorResponse(500, 'Internal server error');
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

function corsHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  };
}

function errorResponse(statusCode: number, message: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify({ error: message })
  };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generatePolicy(
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string,
  context?: Record<string, string>
): APIGatewayAuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }
      ]
    },
    ...(context && { context })
  };
}

async function verifyJwtToken(token: string): Promise<any> {
  // Mock JWT verification
  if (!token || token === 'invalid') {
    throw new Error('Invalid token');
  }

  return {
    sub: '123',
    email: 'user@example.com',
    role: 'user'
  };
}

async function validateApiKey(apiKey: string): Promise<any> {
  // Mock API key validation
  const validKeys: Record<string, any> = {
    'test-api-key': {
      id: 'user-123',
      tier: 'premium',
      rateLimit: 1000
    }
  };

  const user = validKeys[apiKey];
  if (!user) {
    throw new Error('Invalid API key');
  }

  return user;
}

async function broadcastMessage(
  apiGateway: ApiGatewayManagementApi,
  message: any
): Promise<void> {
  // Get all connections
  const connections = await dynamodb.scan({
    TableName: CONNECTIONS_TABLE,
    ProjectionExpression: 'connectionId'
  }).promise();

  // Send to all connections
  const promises = (connections.Items || []).map(async (item) => {
    try {
      await apiGateway.postToConnection({
        ConnectionId: item.connectionId,
        Data: JSON.stringify(message)
      }).promise();
    } catch (error: any) {
      if (error.statusCode === 410) {
        // Connection is stale, delete it
        await dynamodb.delete({
          TableName: CONNECTIONS_TABLE,
          Key: { connectionId: item.connectionId }
        }).promise();
      }
    }
  });

  await Promise.all(promises);
}

async function sendToConnection(
  apiGateway: ApiGatewayManagementApi,
  connectionId: string,
  message: any
): Promise<void> {
  try {
    await apiGateway.postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify(message)
    }).promise();
  } catch (error: any) {
    if (error.statusCode === 410) {
      // Connection is stale, delete it
      await dynamodb.delete({
        TableName: CONNECTIONS_TABLE,
        Key: { connectionId }
      }).promise();
    }
    throw error;
  }
}

async function processData(data: any): Promise<any> {
  // Mock data processing
  return { success: true, processed: data, timestamp: Date.now() };
}

async function processValidatedRequest(data: any): Promise<any> {
  // Mock processing
  return { success: true, data };
}
