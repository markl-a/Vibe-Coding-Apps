/**
 * Local Processing Example
 *
 * Demonstrates data processing at the edge without cloud dependency:
 * - Real-time video/image processing
 * - Audio processing and analysis
 * - Time-series data analysis
 * - Event detection and alerting
 * - Data transformation and enrichment
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface ProcessingTask {
  id: string;
  type: 'video' | 'audio' | 'timeseries' | 'image';
  priority: number;
  data: any;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface ProcessingResult {
  taskId: string;
  success: boolean;
  output: any;
  processingTime: number;
  metadata: Record<string, any>;
}

interface VideoFrame {
  frameNumber: number;
  timestamp: number;
  width: number;
  height: number;
  data: Uint8Array;
}

interface DetectionEvent {
  type: 'motion' | 'face' | 'object' | 'anomaly';
  confidence: number;
  timestamp: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  metadata?: Record<string, any>;
}

interface TimeSeriesData {
  timestamp: number;
  values: Record<string, number>;
}

// ============================================================================
// Local Video Processor
// ============================================================================

class LocalVideoProcessor extends EventEmitter {
  private isProcessing = false;
  private frameBuffer: VideoFrame[] = [];
  private processingConfig = {
    motionThreshold: 0.15,
    skipFrames: 2, // Process every 3rd frame
    maxBufferSize: 30,
  };

  /**
   * Process video frame for motion detection
   */
  async processFrame(frame: VideoFrame): Promise<DetectionEvent[]> {
    // Skip frames to reduce processing load
    if (frame.frameNumber % (this.processingConfig.skipFrames + 1) !== 0) {
      return [];
    }

    const startTime = performance.now();
    const events: DetectionEvent[] = [];

    // Add to buffer
    this.frameBuffer.push(frame);
    if (this.frameBuffer.length > this.processingConfig.maxBufferSize) {
      this.frameBuffer.shift();
    }

    // Need at least 2 frames for motion detection
    if (this.frameBuffer.length < 2) {
      return events;
    }

    // Calculate motion between frames
    const previousFrame = this.frameBuffer[this.frameBuffer.length - 2];
    const motion = this.detectMotion(previousFrame, frame);

    if (motion.detected) {
      const event: DetectionEvent = {
        type: 'motion',
        confidence: motion.confidence,
        timestamp: frame.timestamp,
        boundingBox: motion.boundingBox,
        metadata: {
          frameNumber: frame.frameNumber,
          processingTime: performance.now() - startTime,
        },
      };

      events.push(event);
      this.emit('motion-detected', event);

      console.log(`[VideoProcessor] Motion detected at frame ${frame.frameNumber} (${motion.confidence.toFixed(2)})`);
    }

    return events;
  }

  /**
   * Detect motion between two frames
   */
  private detectMotion(
    frame1: VideoFrame,
    frame2: VideoFrame
  ): { detected: boolean; confidence: number; boundingBox?: any } {
    // Simplified motion detection - compare pixel differences
    let totalDiff = 0;
    let maxDiff = 0;
    let motionX = 0;
    let motionY = 0;

    const pixelCount = Math.min(frame1.data.length, frame2.data.length);

    for (let i = 0; i < pixelCount; i += 4) {
      // Process every 4th byte (RGBA)
      const diff = Math.abs(frame1.data[i] - frame2.data[i]);
      totalDiff += diff;

      if (diff > maxDiff) {
        maxDiff = diff;
        motionX = (i / 4) % frame1.width;
        motionY = Math.floor(i / 4 / frame1.width);
      }
    }

    const avgDiff = totalDiff / (pixelCount / 4);
    const normalized = avgDiff / 255;

    const detected = normalized > this.processingConfig.motionThreshold;

    return {
      detected,
      confidence: Math.min(normalized * 2, 1), // Scale to 0-1
      boundingBox: detected
        ? {
            x: Math.max(0, motionX - 50),
            y: Math.max(0, motionY - 50),
            width: 100,
            height: 100,
          }
        : undefined,
    };
  }

  /**
   * Analyze video stream statistics
   */
  getStreamStats(): {
    fps: number;
    bufferedFrames: number;
    avgFrameSize: number;
  } {
    if (this.frameBuffer.length < 2) {
      return { fps: 0, bufferedFrames: 0, avgFrameSize: 0 };
    }

    // Calculate FPS from buffer
    const timeSpan =
      this.frameBuffer[this.frameBuffer.length - 1].timestamp -
      this.frameBuffer[0].timestamp;
    const fps = (this.frameBuffer.length / timeSpan) * 1000;

    // Average frame size
    const totalSize = this.frameBuffer.reduce((sum, f) => sum + f.data.length, 0);
    const avgFrameSize = totalSize / this.frameBuffer.length;

    return {
      fps: Math.round(fps),
      bufferedFrames: this.frameBuffer.length,
      avgFrameSize: Math.round(avgFrameSize),
    };
  }
}

// ============================================================================
// Local Audio Processor
// ============================================================================

class LocalAudioProcessor extends EventEmitter {
  private sampleRate = 44100;
  private bufferSize = 4096;

  /**
   * Process audio buffer for voice activity detection
   */
  async processAudio(audioBuffer: Float32Array): Promise<{
    voiceDetected: boolean;
    energy: number;
    features: AudioFeatures;
  }> {
    const startTime = performance.now();

    // Calculate audio energy
    const energy = this.calculateEnergy(audioBuffer);

    // Extract features
    const features = this.extractFeatures(audioBuffer);

    // Voice activity detection (simple energy-based)
    const voiceDetected = energy > 0.02 && features.zeroCrossingRate < 0.3;

    if (voiceDetected) {
      this.emit('voice-detected', { energy, features, timestamp: Date.now() });
      console.log(`[AudioProcessor] Voice detected (energy: ${energy.toFixed(4)})`);
    }

    const processingTime = performance.now() - startTime;
    console.log(`[AudioProcessor] Processed ${audioBuffer.length} samples in ${processingTime.toFixed(2)}ms`);

    return { voiceDetected, energy, features };
  }

  /**
   * Calculate audio energy (RMS)
   */
  private calculateEnergy(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  /**
   * Extract audio features
   */
  private extractFeatures(buffer: Float32Array): AudioFeatures {
    // Zero crossing rate
    let zeroCrossings = 0;
    for (let i = 1; i < buffer.length; i++) {
      if ((buffer[i] >= 0 && buffer[i - 1] < 0) || (buffer[i] < 0 && buffer[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zeroCrossingRate = zeroCrossings / buffer.length;

    // Spectral centroid (simplified)
    const spectralCentroid = this.calculateSpectralCentroid(buffer);

    return {
      zeroCrossingRate,
      spectralCentroid,
      energy: this.calculateEnergy(buffer),
    };
  }

  /**
   * Calculate spectral centroid
   */
  private calculateSpectralCentroid(buffer: Float32Array): number {
    // Simplified calculation
    let weightedSum = 0;
    let magnitudeSum = 0;

    for (let i = 0; i < buffer.length; i++) {
      const magnitude = Math.abs(buffer[i]);
      weightedSum += i * magnitude;
      magnitudeSum += magnitude;
    }

    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }
}

interface AudioFeatures {
  zeroCrossingRate: number;
  spectralCentroid: number;
  energy: number;
}

// ============================================================================
// Time Series Analyzer
// ============================================================================

class TimeSeriesAnalyzer {
  private window: TimeSeriesData[] = [];
  private windowSize = 100;

  /**
   * Add data point and analyze
   */
  async addDataPoint(data: TimeSeriesData): Promise<{
    anomalies: string[];
    trends: Record<string, 'increasing' | 'decreasing' | 'stable'>;
    statistics: Record<string, any>;
  }> {
    this.window.push(data);

    // Maintain window size
    if (this.window.length > this.windowSize) {
      this.window.shift();
    }

    // Need minimum data points for analysis
    if (this.window.length < 10) {
      return { anomalies: [], trends: {}, statistics: {} };
    }

    // Detect anomalies
    const anomalies = this.detectAnomalies(data);

    // Calculate trends
    const trends = this.calculateTrends();

    // Calculate statistics
    const statistics = this.calculateStatistics();

    return { anomalies, trends, statistics };
  }

  /**
   * Detect anomalies using statistical methods
   */
  private detectAnomalies(currentData: TimeSeriesData): string[] {
    const anomalies: string[] = [];

    for (const [key, value] of Object.entries(currentData.values)) {
      // Calculate mean and std dev for this metric
      const values = this.window.map(d => d.values[key]).filter(v => v !== undefined);

      if (values.length < 5) continue;

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      // Z-score anomaly detection
      const zScore = Math.abs((value - mean) / stdDev);

      if (zScore > 3) {
        // More than 3 standard deviations
        anomalies.push(`${key}: ${value.toFixed(2)} (z-score: ${zScore.toFixed(2)})`);
      }
    }

    return anomalies;
  }

  /**
   * Calculate trends for each metric
   */
  private calculateTrends(): Record<string, 'increasing' | 'decreasing' | 'stable'> {
    const trends: Record<string, 'increasing' | 'decreasing' | 'stable'> = {};

    if (this.window.length < 2) return trends;

    // Get all metric keys
    const keys = Object.keys(this.window[this.window.length - 1].values);

    for (const key of keys) {
      const values = this.window.map(d => d.values[key]).filter(v => v !== undefined);

      if (values.length < 5) continue;

      // Simple linear regression
      const slope = this.calculateSlope(values);

      if (Math.abs(slope) < 0.01) {
        trends[key] = 'stable';
      } else if (slope > 0) {
        trends[key] = 'increasing';
      } else {
        trends[key] = 'decreasing';
      }
    }

    return trends;
  }

  /**
   * Calculate statistics for each metric
   */
  private calculateStatistics(): Record<string, any> {
    const stats: Record<string, any> = {};

    if (this.window.length === 0) return stats;

    const keys = Object.keys(this.window[this.window.length - 1].values);

    for (const key of keys) {
      const values = this.window.map(d => d.values[key]).filter(v => v !== undefined);

      if (values.length === 0) continue;

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      stats[key] = {
        mean: Math.round(mean * 100) / 100,
        min,
        max,
        range: max - min,
        samples: values.length,
      };
    }

    return stats;
  }

  /**
   * Calculate slope using least squares
   */
  private calculateSlope(values: number[]): number {
    const n = values.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }
}

// ============================================================================
// Local Processing Pipeline
// ============================================================================

class LocalProcessingPipeline extends EventEmitter {
  private videoProcessor = new LocalVideoProcessor();
  private audioProcessor = new LocalAudioProcessor();
  private timeSeriesAnalyzer = new TimeSeriesAnalyzer();
  private taskQueue: ProcessingTask[] = [];
  private isProcessing = false;

  constructor() {
    super();

    // Forward events from processors
    this.videoProcessor.on('motion-detected', (event) => {
      this.emit('event-detected', { ...event, source: 'video' });
    });

    this.audioProcessor.on('voice-detected', (event) => {
      this.emit('event-detected', { ...event, source: 'audio' });
    });
  }

  /**
   * Add processing task to queue
   */
  async addTask(task: ProcessingTask): Promise<void> {
    this.taskQueue.push(task);
    this.taskQueue.sort((a, b) => b.priority - a.priority);

    console.log(`[Pipeline] Task ${task.id} added (priority: ${task.priority})`);

    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  /**
   * Process task queue
   */
  private async processQueue(): Promise<void> {
    if (this.taskQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const task = this.taskQueue.shift()!;

    console.log(`[Pipeline] Processing task ${task.id} (${task.type})`);

    try {
      task.status = 'processing';
      const result = await this.processTask(task);
      task.status = 'completed';

      this.emit('task-completed', result);
    } catch (error) {
      task.status = 'failed';
      console.error(`[Pipeline] Task ${task.id} failed:`, error);
      this.emit('task-failed', { taskId: task.id, error });
    }

    // Process next task
    await this.processQueue();
  }

  /**
   * Process individual task
   */
  private async processTask(task: ProcessingTask): Promise<ProcessingResult> {
    const startTime = performance.now();

    let output: any;

    switch (task.type) {
      case 'video':
        output = await this.videoProcessor.processFrame(task.data);
        break;

      case 'audio':
        output = await this.audioProcessor.processAudio(task.data);
        break;

      case 'timeseries':
        output = await this.timeSeriesAnalyzer.addDataPoint(task.data);
        break;

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }

    const processingTime = performance.now() - startTime;

    return {
      taskId: task.id,
      success: true,
      output,
      processingTime,
      metadata: {
        taskType: task.type,
        priority: task.priority,
      },
    };
  }

  /**
   * Get pipeline statistics
   */
  getStats(): {
    queueLength: number;
    isProcessing: boolean;
    videoStats: any;
  } {
    return {
      queueLength: this.taskQueue.length,
      isProcessing: this.isProcessing,
      videoStats: this.videoProcessor.getStreamStats(),
    };
  }
}

// ============================================================================
// Usage Example
// ============================================================================

async function main() {
  console.log('=== Local Processing Example ===\n');

  const pipeline = new LocalProcessingPipeline();

  // Listen for detected events
  pipeline.on('event-detected', (event) => {
    console.log(`[EVENT] ${event.source} event:`, event);
  });

  pipeline.on('task-completed', (result) => {
    console.log(`[COMPLETE] Task ${result.taskId} in ${result.processingTime.toFixed(2)}ms`);
  });

  // 1. Video Processing
  console.log('1. Processing video frames...');
  for (let i = 0; i < 10; i++) {
    const frame: VideoFrame = {
      frameNumber: i,
      timestamp: Date.now() + i * 33,
      width: 640,
      height: 480,
      data: new Uint8Array(640 * 480 * 4).map(() => Math.random() * 255),
    };

    await pipeline.addTask({
      id: `video-${i}`,
      type: 'video',
      priority: 5,
      data: frame,
      timestamp: Date.now(),
      status: 'pending',
    });
  }

  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. Audio Processing
  console.log('\n2. Processing audio samples...');
  const audioBuffer = new Float32Array(4096);
  for (let i = 0; i < audioBuffer.length; i++) {
    audioBuffer[i] = Math.sin(2 * Math.PI * 440 * i / 44100) * 0.5; // 440 Hz tone
  }

  await pipeline.addTask({
    id: 'audio-1',
    type: 'audio',
    priority: 7,
    data: audioBuffer,
    timestamp: Date.now(),
    status: 'pending',
  });

  // 3. Time Series Analysis
  console.log('\n3. Analyzing time series data...');
  for (let i = 0; i < 20; i++) {
    const data: TimeSeriesData = {
      timestamp: Date.now() + i * 1000,
      values: {
        temperature: 20 + Math.random() * 5 + (i > 15 ? 20 : 0), // Anomaly at end
        humidity: 50 + Math.random() * 10,
        pressure: 1013 + Math.random() * 5,
      },
    };

    await pipeline.addTask({
      id: `timeseries-${i}`,
      type: 'timeseries',
      priority: 3,
      data,
      timestamp: Date.now(),
      status: 'pending',
    });
  }

  // Wait for all processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Show pipeline stats
  console.log('\n4. Pipeline Statistics:');
  console.log(JSON.stringify(pipeline.getStats(), null, 2));

  console.log('\n=== Local Processing Complete ===');
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export {
  LocalVideoProcessor,
  LocalAudioProcessor,
  TimeSeriesAnalyzer,
  LocalProcessingPipeline,
  ProcessingTask,
  ProcessingResult,
  DetectionEvent,
};
