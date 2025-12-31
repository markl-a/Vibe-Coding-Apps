/**
 * Stream Pipeline Examples
 *
 * Demonstrates real-time stream processing patterns:
 * 1. Basic stream processing
 * 2. Windowed aggregations (tumbling, sliding, session)
 * 3. Stream joins and enrichment
 * 4. Stream filtering and transformation
 * 5. Event time vs processing time handling
 * 6. Late data handling and watermarks
 */

import { EventEmitter } from 'events';

// ============================================================================
// Type Definitions
// ============================================================================

interface StreamEvent<T = unknown> {
  key: string;
  value: T;
  timestamp: number;
  eventTime?: number;
}

interface Window {
  start: number;
  end: number;
  count: number;
  data: StreamEvent[];
}

interface WindowConfig {
  type: 'tumbling' | 'sliding' | 'session';
  size: number; // milliseconds
  slide?: number; // for sliding windows
  gap?: number; // for session windows
}

interface StreamStats {
  totalEvents: number;
  processedEvents: number;
  droppedEvents: number;
  latencyMs: number;
  throughput: number;
}

type StreamProcessor<I, O> = (event: StreamEvent<I>) => Promise<StreamEvent<O> | null>;

// ============================================================================
// Example 1: Basic Stream Processing Pipeline
// ============================================================================

class StreamPipeline<T> extends EventEmitter {
  private processors: Array<StreamProcessor<unknown, unknown>> = [];
  private running = false;
  private stats: StreamStats = {
    totalEvents: 0,
    processedEvents: 0,
    droppedEvents: 0,
    latencyMs: 0,
    throughput: 0,
  };

  addProcessor<I, O>(processor: StreamProcessor<I, O>): this {
    this.processors.push(processor as StreamProcessor<unknown, unknown>);
    return this;
  }

  start(): void {
    this.running = true;
    console.log('Stream pipeline started');
  }

  stop(): void {
    this.running = false;
    console.log('Stream pipeline stopped');
    this.printStats();
  }

  async processEvent(event: StreamEvent<T>): Promise<void> {
    if (!this.running) {
      console.warn('Pipeline not running, event dropped');
      return;
    }

    const startTime = Date.now();
    this.stats.totalEvents++;

    let currentEvent: StreamEvent<unknown> | null = event as StreamEvent<unknown>;

    try {
      // Pass through all processors
      for (const processor of this.processors) {
        if (currentEvent === null) {
          this.stats.droppedEvents++;
          return;
        }

        currentEvent = await processor(currentEvent);
      }

      if (currentEvent !== null) {
        this.stats.processedEvents++;
        this.emit('output', currentEvent);
      } else {
        this.stats.droppedEvents++;
      }

      // Update latency
      const latency = Date.now() - startTime;
      this.stats.latencyMs = (this.stats.latencyMs * (this.stats.processedEvents - 1) + latency) / this.stats.processedEvents;

    } catch (error) {
      console.error('Error processing event:', error);
      this.stats.droppedEvents++;
      this.emit('error', error);
    }
  }

  getStats(): StreamStats {
    const now = Date.now();
    return {
      ...this.stats,
      throughput: this.stats.processedEvents, // events per second would need time tracking
    };
  }

  private printStats(): void {
    console.log('\n📊 Stream Pipeline Statistics:');
    console.log(`  Total events: ${this.stats.totalEvents}`);
    console.log(`  Processed: ${this.stats.processedEvents}`);
    console.log(`  Dropped: ${this.stats.droppedEvents}`);
    console.log(`  Avg latency: ${this.stats.latencyMs.toFixed(2)}ms`);
  }
}

// ============================================================================
// Example 2: Windowed Aggregation Stream
// ============================================================================

class WindowedAggregationStream<T> extends EventEmitter {
  private windows = new Map<string, Window>();
  private watermark = 0;

  constructor(
    private windowConfig: WindowConfig,
    private aggregator: (events: StreamEvent<T>[]) => unknown
  ) {
    super();
    this.startWindowCloser();
  }

  processEvent(event: StreamEvent<T>): void {
    const eventTime = event.eventTime || event.timestamp;

    // Update watermark (simplified - use min of event times in production)
    this.watermark = Math.max(this.watermark, eventTime);

    // Assign event to window(s)
    const windowKeys = this.assignToWindows(eventTime);

    windowKeys.forEach(key => {
      if (!this.windows.has(key)) {
        const [start, end] = key.split('-').map(Number);
        this.windows.set(key, {
          start,
          end,
          count: 0,
          data: [],
        });
      }

      const window = this.windows.get(key)!;
      window.data.push(event);
      window.count++;
    });
  }

  private assignToWindows(eventTime: number): string[] {
    const keys: string[] = [];

    switch (this.windowConfig.type) {
      case 'tumbling': {
        const windowStart = Math.floor(eventTime / this.windowConfig.size) * this.windowConfig.size;
        const windowEnd = windowStart + this.windowConfig.size;
        keys.push(`${windowStart}-${windowEnd}`);
        break;
      }

      case 'sliding': {
        const slide = this.windowConfig.slide || this.windowConfig.size;
        const numWindows = Math.ceil(this.windowConfig.size / slide);

        for (let i = 0; i < numWindows; i++) {
          const windowStart = Math.floor((eventTime - i * slide) / slide) * slide;
          const windowEnd = windowStart + this.windowConfig.size;

          if (eventTime >= windowStart && eventTime < windowEnd) {
            keys.push(`${windowStart}-${windowEnd}`);
          }
        }
        break;
      }

      case 'session': {
        // Session windows are more complex - simplified implementation
        const gap = this.windowConfig.gap || 5000;
        const sessionStart = eventTime;
        const sessionEnd = eventTime + gap;
        keys.push(`${sessionStart}-${sessionEnd}`);
        break;
      }
    }

    return keys;
  }

  private startWindowCloser(): void {
    // Check for windows to close every second
    setInterval(() => {
      this.closeExpiredWindows();
    }, 1000);
  }

  private closeExpiredWindows(): void {
    const now = Date.now();

    this.windows.forEach((window, key) => {
      // Close window if past watermark + allowed lateness
      if (window.end < this.watermark - 5000) { // 5 second lateness
        console.log(`\n🪟 Closing window ${key}`);
        console.log(`  Events: ${window.count}`);
        console.log(`  Time range: ${new Date(window.start).toISOString()} - ${new Date(window.end).toISOString()}`);

        const result = this.aggregator(window.data);
        this.emit('window-result', {
          window: { start: window.start, end: window.end },
          result,
        });

        this.windows.delete(key);
      }
    });
  }
}

// ============================================================================
// Example 3: Stream Join
// ============================================================================

class StreamJoin<L, R> extends EventEmitter {
  private leftBuffer = new Map<string, StreamEvent<L>[]>();
  private rightBuffer = new Map<string, StreamEvent<R>[]>();
  private bufferTTL: number;

  constructor(
    bufferTTL: number = 60000, // 1 minute
    private joinCondition: (left: L, right: R) => boolean = () => true
  ) {
    super();
    this.bufferTTL = bufferTTL;
    this.startBufferCleaner();
  }

  processLeft(event: StreamEvent<L>): void {
    // Add to left buffer
    if (!this.leftBuffer.has(event.key)) {
      this.leftBuffer.set(event.key, []);
    }
    this.leftBuffer.get(event.key)!.push(event);

    // Try to join with right side
    this.tryJoin(event.key);
  }

  processRight(event: StreamEvent<R>): void {
    // Add to right buffer
    if (!this.rightBuffer.has(event.key)) {
      this.rightBuffer.set(event.key, []);
    }
    this.rightBuffer.get(event.key)!.push(event);

    // Try to join with left side
    this.tryJoin(event.key);
  }

  private tryJoin(key: string): void {
    const leftEvents = this.leftBuffer.get(key) || [];
    const rightEvents = this.rightBuffer.get(key) || [];

    if (leftEvents.length === 0 || rightEvents.length === 0) {
      return;
    }

    // Perform join
    leftEvents.forEach(leftEvent => {
      rightEvents.forEach(rightEvent => {
        if (this.joinCondition(leftEvent.value, rightEvent.value)) {
          const joinedEvent: StreamEvent<{ left: L; right: R }> = {
            key,
            value: {
              left: leftEvent.value,
              right: rightEvent.value,
            },
            timestamp: Math.max(leftEvent.timestamp, rightEvent.timestamp),
            eventTime: Math.max(leftEvent.eventTime || leftEvent.timestamp, rightEvent.eventTime || rightEvent.timestamp),
          };

          console.log(`✓ Join match found for key: ${key}`);
          this.emit('joined', joinedEvent);
        }
      });
    });
  }

  private startBufferCleaner(): void {
    setInterval(() => {
      const now = Date.now();

      // Clean left buffer
      this.leftBuffer.forEach((events, key) => {
        const filtered = events.filter(e => now - e.timestamp < this.bufferTTL);
        if (filtered.length === 0) {
          this.leftBuffer.delete(key);
        } else {
          this.leftBuffer.set(key, filtered);
        }
      });

      // Clean right buffer
      this.rightBuffer.forEach((events, key) => {
        const filtered = events.filter(e => now - e.timestamp < this.bufferTTL);
        if (filtered.length === 0) {
          this.rightBuffer.delete(key);
        } else {
          this.rightBuffer.set(key, filtered);
        }
      });
    }, 10000); // Clean every 10 seconds
  }
}

// ============================================================================
// Example 4: Stream Processor with State
// ============================================================================

class StatefulStreamProcessor<T, S> extends EventEmitter {
  private state = new Map<string, S>();

  constructor(
    private initialState: S,
    private stateUpdater: (currentState: S, event: StreamEvent<T>) => S,
    private outputProducer?: (key: string, state: S) => unknown
  ) {
    super();
  }

  processEvent(event: StreamEvent<T>): void {
    // Get or initialize state
    const currentState = this.state.get(event.key) || this.initialState;

    // Update state
    const newState = this.stateUpdater(currentState, event);
    this.state.set(event.key, newState);

    // Produce output if configured
    if (this.outputProducer) {
      const output = this.outputProducer(event.key, newState);
      this.emit('output', {
        key: event.key,
        value: output,
        timestamp: Date.now(),
      });
    }
  }

  getState(key: string): S | undefined {
    return this.state.get(key);
  }

  getAllStates(): Map<string, S> {
    return new Map(this.state);
  }
}

// ============================================================================
// Example 5: Event Time Processing with Watermarks
// ============================================================================

class EventTimeProcessor<T> extends EventEmitter {
  private watermark = 0;
  private buffer: StreamEvent<T>[] = [];
  private maxOutOfOrderness: number;

  constructor(maxOutOfOrderness: number = 5000) { // 5 seconds
    super();
    this.maxOutOfOrderness = maxOutOfOrderness;
    this.startWatermarkUpdater();
  }

  processEvent(event: StreamEvent<T>): void {
    const eventTime = event.eventTime || event.timestamp;

    // Check if event is too late
    if (eventTime < this.watermark - this.maxOutOfOrderness) {
      console.warn(`⚠️  Late event dropped: event time ${eventTime}, watermark ${this.watermark}`);
      this.emit('late-event', event);
      return;
    }

    // Add to buffer
    this.buffer.push(event);

    // Update watermark
    this.updateWatermark();

    // Process events up to watermark
    this.processBufferedEvents();
  }

  private updateWatermark(): void {
    if (this.buffer.length === 0) return;

    // Calculate watermark as max event time - max out of orderness
    const maxEventTime = Math.max(...this.buffer.map(e => e.eventTime || e.timestamp));
    const newWatermark = maxEventTime - this.maxOutOfOrderness;

    if (newWatermark > this.watermark) {
      this.watermark = newWatermark;
      this.emit('watermark', this.watermark);
    }
  }

  private processBufferedEvents(): void {
    // Process and remove events that are before watermark
    const toProcess: StreamEvent<T>[] = [];
    const remaining: StreamEvent<T>[] = [];

    this.buffer.forEach(event => {
      const eventTime = event.eventTime || event.timestamp;
      if (eventTime <= this.watermark) {
        toProcess.push(event);
      } else {
        remaining.push(event);
      }
    });

    // Sort by event time
    toProcess.sort((a, b) => {
      const aTime = a.eventTime || a.timestamp;
      const bTime = b.eventTime || b.timestamp;
      return aTime - bTime;
    });

    // Emit processed events
    toProcess.forEach(event => {
      this.emit('processed', event);
    });

    this.buffer = remaining;
  }

  private startWatermarkUpdater(): void {
    // Periodically update watermark even without new events
    setInterval(() => {
      this.updateWatermark();
      this.processBufferedEvents();
    }, 1000);
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

async function demonstrateStreamPipelines() {
  console.log('='.repeat(80));
  console.log('STREAM PIPELINE EXAMPLES');
  console.log('='.repeat(80));

  // Example 1: Basic Stream Processing
  console.log('\n1. Basic Stream Processing Pipeline:');
  console.log('-'.repeat(80));

  const basicPipeline = new StreamPipeline<{ value: number }>()
    .addProcessor(async (event) => {
      // Filter
      if ((event.value as { value: number }).value > 50) {
        return event;
      }
      return null;
    })
    .addProcessor(async (event) => {
      // Transform
      return {
        ...event,
        value: {
          ...event.value as { value: number },
          value: (event.value as { value: number }).value * 2,
        },
      };
    });

  basicPipeline.on('output', (event) => {
    console.log(`  Output: ${JSON.stringify(event.value)}`);
  });

  basicPipeline.start();

  // Process some events
  for (let i = 0; i < 10; i++) {
    await basicPipeline.processEvent({
      key: `event-${i}`,
      value: { value: Math.random() * 100 },
      timestamp: Date.now(),
    });
  }

  await new Promise(resolve => setTimeout(resolve, 100));
  basicPipeline.stop();

  // Example 2: Windowed Aggregation
  console.log('\n2. Windowed Aggregation (Tumbling Window):');
  console.log('-'.repeat(80));

  const windowStream = new WindowedAggregationStream<{ value: number }>(
    {
      type: 'tumbling',
      size: 5000, // 5 second windows
    },
    (events) => {
      const sum = events.reduce((acc, e) => acc + e.value.value, 0);
      const avg = sum / events.length;
      return { count: events.length, sum, avg };
    }
  );

  windowStream.on('window-result', ({ window, result }) => {
    console.log(`  Window result: ${JSON.stringify(result)}`);
  });

  // Send events
  for (let i = 0; i < 5; i++) {
    windowStream.processEvent({
      key: `event-${i}`,
      value: { value: Math.random() * 100 },
      timestamp: Date.now(),
      eventTime: Date.now(),
    });
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Example 3: Stream Join
  console.log('\n3. Stream Join:');
  console.log('-'.repeat(80));

  interface Order { orderId: string; amount: number; }
  interface Payment { paymentId: string; amount: number; }

  const streamJoin = new StreamJoin<Order, Payment>(60000);

  streamJoin.on('joined', (event) => {
    console.log(`  Joined: Order ${event.value.left.orderId} with Payment ${event.value.right.paymentId}`);
  });

  // Send events
  streamJoin.processLeft({
    key: 'user-123',
    value: { orderId: 'ORD-1', amount: 100 },
    timestamp: Date.now(),
  });

  streamJoin.processRight({
    key: 'user-123',
    value: { paymentId: 'PAY-1', amount: 100 },
    timestamp: Date.now(),
  });

  // Example 4: Stateful Processing
  console.log('\n4. Stateful Stream Processing (Running Sum):');
  console.log('-'.repeat(80));

  interface SumState { total: number; count: number; }

  const statefulProcessor = new StatefulStreamProcessor<{ value: number }, SumState>(
    { total: 0, count: 0 },
    (state, event) => ({
      total: state.total + event.value.value,
      count: state.count + 1,
    }),
    (key, state) => ({
      key,
      runningSum: state.total,
      runningAvg: state.total / state.count,
    })
  );

  statefulProcessor.on('output', (event) => {
    console.log(`  ${event.key}: Running avg = ${(event.value as { runningAvg: number }).runningAvg.toFixed(2)}`);
  });

  for (let i = 0; i < 5; i++) {
    statefulProcessor.processEvent({
      key: 'sensor-1',
      value: { value: Math.random() * 100 },
      timestamp: Date.now(),
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('STREAM PROCESSING COMPLETE');
  console.log('='.repeat(80));
}

// Run examples
if (require.main === module) {
  demonstrateStreamPipelines().catch(console.error);
}

export {
  StreamPipeline,
  WindowedAggregationStream,
  StreamJoin,
  StatefulStreamProcessor,
  EventTimeProcessor,
  type StreamEvent,
  type Window,
  type WindowConfig,
  type StreamStats,
  type StreamProcessor,
};
