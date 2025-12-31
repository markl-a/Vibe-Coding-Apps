/**
 * Event-Driven Microservices Examples
 *
 * Demonstrates:
 * - Event bus setup (RabbitMQ, Redis, Kafka)
 * - Event publishing patterns
 * - Event subscription and handling
 * - Event sourcing basics
 * - CQRS (Command Query Responsibility Segregation)
 * - Saga pattern for distributed transactions
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import * as amqp from 'amqplib';
import { Redis } from 'ioredis';
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// EVENT TYPES AND INTERFACES
// ============================================================================

export enum EventType {
  // User events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',

  // Order events
  ORDER_CREATED = 'order.created',
  ORDER_CONFIRMED = 'order.confirmed',
  ORDER_SHIPPED = 'order.shipped',
  ORDER_DELIVERED = 'order.delivered',
  ORDER_CANCELLED = 'order.cancelled',

  // Payment events
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',

  // Inventory events
  INVENTORY_RESERVED = 'inventory.reserved',
  INVENTORY_RELEASED = 'inventory.released',
  INVENTORY_DEPLETED = 'inventory.depleted',

  // Notification events
  EMAIL_SEND_REQUESTED = 'email.send.requested',
  SMS_SEND_REQUESTED = 'sms.send.requested',
  NOTIFICATION_SENT = 'notification.sent'
}

export interface DomainEvent<T = any> {
  id: string;
  type: EventType;
  aggregateId: string;
  aggregateType: string;
  payload: T;
  metadata: EventMetadata;
  timestamp: Date;
  version: number;
}

export interface EventMetadata {
  userId?: string;
  correlationId: string;
  causationId?: string;
  source: string;
  ip?: string;
}

// ============================================================================
// IN-MEMORY EVENT BUS (For development and testing)
// ============================================================================

@Injectable()
export class InMemoryEventBus {
  private readonly logger = new Logger(InMemoryEventBus.name);
  private readonly eventEmitter: EventEmitter2;
  private readonly eventStore: DomainEvent[] = [];

  constructor() {
    this.eventEmitter = new EventEmitter2({
      wildcard: true,
      delimiter: '.',
      maxListeners: 100
    });
  }

  /**
   * Publish event
   */
  async publish<T>(event: DomainEvent<T>): Promise<void> {
    this.logger.log(`📤 Publishing event: ${event.type} [${event.id}]`);

    // Store event
    this.eventStore.push(event);

    // Emit event to subscribers
    this.eventEmitter.emit(event.type, event);
  }

  /**
   * Publish multiple events
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map(event => this.publish(event)));
  }

  /**
   * Subscribe to events
   */
  subscribe<T>(
    eventType: EventType | string,
    handler: (event: DomainEvent<T>) => Promise<void>
  ): void {
    this.logger.log(`📥 Subscribing to: ${eventType}`);
    this.eventEmitter.on(eventType, handler);
  }

  /**
   * Subscribe to multiple event types
   */
  subscribeToMany<T>(
    eventTypes: (EventType | string)[],
    handler: (event: DomainEvent<T>) => Promise<void>
  ): void {
    eventTypes.forEach(type => this.subscribe(type, handler));
  }

  /**
   * Get event history for an aggregate
   */
  getEventHistory(aggregateId: string): DomainEvent[] {
    return this.eventStore.filter(event => event.aggregateId === aggregateId);
  }

  /**
   * Get all events
   */
  getAllEvents(): DomainEvent[] {
    return [...this.eventStore];
  }
}

// ============================================================================
// RABBITMQ EVENT BUS
// ============================================================================

@Injectable()
export class RabbitMQEventBus implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQEventBus.name);
  private connection: amqp.Connection;
  private publishChannel: amqp.Channel;
  private consumeChannel: amqp.Channel;
  private readonly exchangeName = 'domain-events';

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  /**
   * Connect to RabbitMQ
   */
  private async connect(): Promise<void> {
    try {
      const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      this.connection = await amqp.connect(rabbitUrl);

      this.publishChannel = await this.connection.createChannel();
      this.consumeChannel = await this.connection.createChannel();

      // Create exchange for events
      await this.publishChannel.assertExchange(this.exchangeName, 'topic', {
        durable: true
      });

      this.logger.log('✅ Connected to RabbitMQ');
    } catch (error) {
      this.logger.error('❌ Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  /**
   * Disconnect from RabbitMQ
   */
  private async disconnect(): Promise<void> {
    try {
      await this.publishChannel?.close();
      await this.consumeChannel?.close();
      await this.connection?.close();
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error);
    }
  }

  /**
   * Publish event
   */
  async publish<T>(event: DomainEvent<T>): Promise<void> {
    try {
      const routingKey = event.type.replace('.', '_');
      const message = Buffer.from(JSON.stringify(event));

      this.publishChannel.publish(this.exchangeName, routingKey, message, {
        persistent: true,
        contentType: 'application/json',
        messageId: event.id,
        correlationId: event.metadata.correlationId,
        timestamp: event.timestamp.getTime()
      });

      this.logger.log(`📤 Published event: ${event.type} [${event.id}]`);
    } catch (error) {
      this.logger.error(`Failed to publish event: ${event.type}`, error);
      throw error;
    }
  }

  /**
   * Subscribe to events
   */
  async subscribe<T>(
    eventPattern: string,
    handler: (event: DomainEvent<T>) => Promise<void>,
    queueName?: string
  ): Promise<void> {
    try {
      const queue = queueName || `queue-${eventPattern}-${uuidv4()}`;

      // Assert queue
      await this.consumeChannel.assertQueue(queue, {
        durable: true,
        autoDelete: !queueName // Auto-delete if queue name not specified
      });

      // Bind queue to exchange with routing key
      const routingKey = eventPattern.replace('.', '_');
      await this.consumeChannel.bindQueue(queue, this.exchangeName, routingKey);

      // Consume messages
      await this.consumeChannel.consume(
        queue,
        async (msg) => {
          if (msg) {
            try {
              const event = JSON.parse(msg.content.toString()) as DomainEvent<T>;
              this.logger.log(`📥 Received event: ${event.type} [${event.id}]`);

              await handler(event);

              // Acknowledge message
              this.consumeChannel.ack(msg);
            } catch (error) {
              this.logger.error('Error handling event', error);
              // Negative acknowledge - requeue message
              this.consumeChannel.nack(msg, false, true);
            }
          }
        },
        { noAck: false }
      );

      this.logger.log(`📥 Subscribed to: ${eventPattern} on queue: ${queue}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to ${eventPattern}`, error);
      throw error;
    }
  }
}

// ============================================================================
// KAFKA EVENT BUS
// ============================================================================

@Injectable()
export class KafkaEventBus implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaEventBus.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private readonly topicPrefix = 'domain-events';

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  /**
   * Connect to Kafka
   */
  private async connect(): Promise<void> {
    try {
      this.kafka = new Kafka({
        clientId: process.env.KAFKA_CLIENT_ID || 'microservice-app',
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
      });

      this.producer = this.kafka.producer();
      await this.producer.connect();

      this.consumer = this.kafka.consumer({
        groupId: process.env.KAFKA_GROUP_ID || 'default-group'
      });
      await this.consumer.connect();

      this.logger.log('✅ Connected to Kafka');
    } catch (error) {
      this.logger.error('❌ Failed to connect to Kafka', error);
      throw error;
    }
  }

  /**
   * Disconnect from Kafka
   */
  private async disconnect(): Promise<void> {
    try {
      await this.producer?.disconnect();
      await this.consumer?.disconnect();
      this.logger.log('Disconnected from Kafka');
    } catch (error) {
      this.logger.error('Error disconnecting from Kafka', error);
    }
  }

  /**
   * Publish event
   */
  async publish<T>(event: DomainEvent<T>): Promise<void> {
    try {
      const topic = `${this.topicPrefix}-${event.aggregateType}`;

      await this.producer.send({
        topic,
        messages: [
          {
            key: event.aggregateId,
            value: JSON.stringify(event),
            headers: {
              'event-type': event.type,
              'correlation-id': event.metadata.correlationId
            }
          }
        ]
      });

      this.logger.log(`📤 Published event to Kafka: ${event.type} [${event.id}]`);
    } catch (error) {
      this.logger.error(`Failed to publish event: ${event.type}`, error);
      throw error;
    }
  }

  /**
   * Subscribe to events
   */
  async subscribe<T>(
    aggregateType: string,
    handler: (event: DomainEvent<T>) => Promise<void>
  ): Promise<void> {
    try {
      const topic = `${this.topicPrefix}-${aggregateType}`;

      await this.consumer.subscribe({ topic, fromBeginning: false });

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
          try {
            const event = JSON.parse(message.value!.toString()) as DomainEvent<T>;
            this.logger.log(`📥 Received event from Kafka: ${event.type} [${event.id}]`);

            await handler(event);
          } catch (error) {
            this.logger.error('Error handling Kafka event', error);
            throw error;
          }
        }
      });

      this.logger.log(`📥 Subscribed to Kafka topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to ${aggregateType}`, error);
      throw error;
    }
  }
}

// ============================================================================
// REDIS PUB/SUB EVENT BUS
// ============================================================================

@Injectable()
export class RedisPubSubEventBus implements OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubEventBus.name);
  private publisher: Redis;
  private subscriber: Redis;

  constructor() {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    };

    this.publisher = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);

    this.logger.log('✅ Connected to Redis Pub/Sub');
  }

  async onModuleDestroy(): Promise<void> {
    await this.publisher.quit();
    await this.subscriber.quit();
  }

  /**
   * Publish event
   */
  async publish<T>(event: DomainEvent<T>): Promise<void> {
    const channel = `events:${event.type}`;
    const message = JSON.stringify(event);

    await this.publisher.publish(channel, message);

    this.logger.log(`📤 Published event to Redis: ${event.type} [${event.id}]`);
  }

  /**
   * Subscribe to events
   */
  async subscribe<T>(
    eventType: EventType | string,
    handler: (event: DomainEvent<T>) => Promise<void>
  ): Promise<void> {
    const channel = `events:${eventType}`;

    await this.subscriber.subscribe(channel);

    this.subscriber.on('message', async (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const event = JSON.parse(message) as DomainEvent<T>;
          this.logger.log(`📥 Received event from Redis: ${event.type} [${event.id}]`);

          await handler(event);
        } catch (error) {
          this.logger.error('Error handling Redis event', error);
        }
      }
    });

    this.logger.log(`📥 Subscribed to Redis channel: ${channel}`);
  }
}

// ============================================================================
// EVENT FACTORY
// ============================================================================

@Injectable()
export class EventFactory {
  /**
   * Create domain event
   */
  createEvent<T>(
    type: EventType,
    aggregateId: string,
    aggregateType: string,
    payload: T,
    metadata: Partial<EventMetadata> = {}
  ): DomainEvent<T> {
    return {
      id: uuidv4(),
      type,
      aggregateId,
      aggregateType,
      payload,
      metadata: {
        correlationId: metadata.correlationId || uuidv4(),
        causationId: metadata.causationId,
        userId: metadata.userId,
        source: metadata.source || 'microservice',
        ip: metadata.ip
      },
      timestamp: new Date(),
      version: 1
    };
  }
}

// ============================================================================
// EVENT HANDLERS (Decorators)
// ============================================================================

/**
 * Example event handlers using decorators
 */
@Injectable()
export class OrderEventHandlers {
  private readonly logger = new Logger(OrderEventHandlers.name);

  @OnEvent(EventType.ORDER_CREATED)
  async handleOrderCreated(event: DomainEvent<OrderCreatedPayload>): Promise<void> {
    this.logger.log(`Handling ORDER_CREATED: ${event.aggregateId}`);

    // Send confirmation email
    // Reserve inventory
    // Create invoice
  }

  @OnEvent(EventType.ORDER_CONFIRMED)
  async handleOrderConfirmed(event: DomainEvent<OrderConfirmedPayload>): Promise<void> {
    this.logger.log(`Handling ORDER_CONFIRMED: ${event.aggregateId}`);

    // Initiate payment
    // Update inventory
  }

  @OnEvent(EventType.PAYMENT_COMPLETED)
  async handlePaymentCompleted(event: DomainEvent<PaymentCompletedPayload>): Promise<void> {
    this.logger.log(`Handling PAYMENT_COMPLETED for order: ${event.payload.orderId}`);

    // Update order status
    // Send notification
  }

  @OnEvent(EventType.PAYMENT_FAILED)
  async handlePaymentFailed(event: DomainEvent<PaymentFailedPayload>): Promise<void> {
    this.logger.log(`Handling PAYMENT_FAILED for order: ${event.payload.orderId}`);

    // Release inventory
    // Cancel order
    // Send notification
  }
}

// ============================================================================
// SAGA PATTERN (Distributed Transaction)
// ============================================================================

/**
 * Order Saga - Coordinates distributed transaction across services
 */
@Injectable()
export class OrderSaga {
  private readonly logger = new Logger(OrderSaga.name);

  constructor(
    private readonly eventBus: RabbitMQEventBus,
    private readonly eventFactory: EventFactory
  ) {}

  /**
   * Start order saga
   */
  async startOrderSaga(orderData: CreateOrderData): Promise<void> {
    const correlationId = uuidv4();
    const orderId = uuidv4();

    try {
      // Step 1: Create order
      await this.createOrder(orderId, orderData, correlationId);

      // Step 2: Reserve inventory
      await this.reserveInventory(orderId, orderData.items, correlationId);

      // Step 3: Process payment
      await this.processPayment(orderId, orderData.amount, correlationId);

      // Step 4: Confirm order
      await this.confirmOrder(orderId, correlationId);

      this.logger.log(`✅ Order saga completed successfully: ${orderId}`);
    } catch (error) {
      this.logger.error(`❌ Order saga failed: ${orderId}`, error);

      // Compensate - rollback all steps
      await this.compensateOrderSaga(orderId, correlationId);
    }
  }

  private async createOrder(
    orderId: string,
    orderData: CreateOrderData,
    correlationId: string
  ): Promise<void> {
    const event = this.eventFactory.createEvent(
      EventType.ORDER_CREATED,
      orderId,
      'order',
      orderData,
      { correlationId }
    );

    await this.eventBus.publish(event);
  }

  private async reserveInventory(
    orderId: string,
    items: OrderItem[],
    correlationId: string
  ): Promise<void> {
    const event = this.eventFactory.createEvent(
      EventType.INVENTORY_RESERVED,
      orderId,
      'inventory',
      { orderId, items },
      { correlationId }
    );

    await this.eventBus.publish(event);
  }

  private async processPayment(
    orderId: string,
    amount: number,
    correlationId: string
  ): Promise<void> {
    const event = this.eventFactory.createEvent(
      EventType.PAYMENT_INITIATED,
      orderId,
      'payment',
      { orderId, amount },
      { correlationId }
    );

    await this.eventBus.publish(event);
  }

  private async confirmOrder(orderId: string, correlationId: string): Promise<void> {
    const event = this.eventFactory.createEvent(
      EventType.ORDER_CONFIRMED,
      orderId,
      'order',
      { orderId },
      { correlationId }
    );

    await this.eventBus.publish(event);
  }

  /**
   * Compensate saga - rollback all steps
   */
  private async compensateOrderSaga(
    orderId: string,
    correlationId: string
  ): Promise<void> {
    this.logger.log(`🔄 Compensating order saga: ${orderId}`);

    // Release inventory
    const releaseEvent = this.eventFactory.createEvent(
      EventType.INVENTORY_RELEASED,
      orderId,
      'inventory',
      { orderId },
      { correlationId }
    );
    await this.eventBus.publish(releaseEvent);

    // Refund payment (if processed)
    const refundEvent = this.eventFactory.createEvent(
      EventType.PAYMENT_REFUNDED,
      orderId,
      'payment',
      { orderId },
      { correlationId }
    );
    await this.eventBus.publish(refundEvent);

    // Cancel order
    const cancelEvent = this.eventFactory.createEvent(
      EventType.ORDER_CANCELLED,
      orderId,
      'order',
      { orderId, reason: 'Saga compensation' },
      { correlationId }
    );
    await this.eventBus.publish(cancelEvent);
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface OrderCreatedPayload {
  userId: string;
  items: OrderItem[];
  total: number;
}

interface OrderConfirmedPayload {
  orderId: string;
  confirmedAt: Date;
}

interface PaymentCompletedPayload {
  orderId: string;
  paymentId: string;
  amount: number;
}

interface PaymentFailedPayload {
  orderId: string;
  reason: string;
}

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

interface CreateOrderData {
  userId: string;
  items: OrderItem[];
  amount: number;
}
