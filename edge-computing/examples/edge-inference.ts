/**
 * Edge Inference Example
 *
 * Demonstrates ML inference at the edge for real-time predictions
 * without relying on cloud services. This pattern is crucial for:
 * - Low-latency applications
 * - Privacy-sensitive data
 * - Offline-capable systems
 * - Reduced bandwidth costs
 */

import * as tf from '@tensorflow/tfjs-node';
import { performance } from 'perf_hooks';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface InferenceResult {
  predictions: number[];
  confidence: number;
  inferenceTime: number;
  modelVersion: string;
}

interface ModelMetadata {
  version: string;
  inputShape: number[];
  outputShape: number[];
  framework: string;
  lastUpdated: Date;
}

interface EdgeDevice {
  id: string;
  capabilities: {
    cpuCores: number;
    memoryMB: number;
    hasGPU: boolean;
    hasTensorCore: boolean;
  };
}

// ============================================================================
// Edge Inference Engine
// ============================================================================

class EdgeInferenceEngine {
  private model: tf.LayersModel | tf.GraphModel | null = null;
  private metadata: ModelMetadata | null = null;
  private deviceInfo: EdgeDevice;
  private warmupComplete = false;

  constructor(deviceInfo: EdgeDevice) {
    this.deviceInfo = deviceInfo;
  }

  /**
   * Load model from local storage or edge cache
   */
  async loadModel(modelPath: string): Promise<void> {
    console.log(`[EdgeInference] Loading model from ${modelPath}`);

    try {
      const startTime = performance.now();

      // Load model from local file system
      this.model = await tf.loadLayersModel(`file://${modelPath}/model.json`);

      // Extract metadata
      this.metadata = {
        version: '1.0.0',
        inputShape: this.model.inputs[0].shape as number[],
        outputShape: this.model.outputs[0].shape as number[],
        framework: 'TensorFlow.js',
        lastUpdated: new Date(),
      };

      const loadTime = performance.now() - startTime;
      console.log(`[EdgeInference] Model loaded in ${loadTime.toFixed(2)}ms`);

      // Warm up the model
      await this.warmup();
    } catch (error) {
      console.error('[EdgeInference] Failed to load model:', error);
      throw new Error(`Model loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Warm up the model with dummy inference to optimize performance
   */
  private async warmup(): Promise<void> {
    if (!this.model || !this.metadata) {
      throw new Error('Model not loaded');
    }

    console.log('[EdgeInference] Warming up model...');

    // Create dummy input matching model input shape
    const dummyInput = tf.zeros(this.metadata.inputShape);

    // Run a few warmup inferences
    for (let i = 0; i < 3; i++) {
      const result = this.model.predict(dummyInput) as tf.Tensor;
      result.dispose();
    }

    dummyInput.dispose();
    this.warmupComplete = true;

    console.log('[EdgeInference] Warmup complete');
  }

  /**
   * Run inference on input data
   */
  async predict(inputData: number[]): Promise<InferenceResult> {
    if (!this.model || !this.metadata) {
      throw new Error('Model not loaded');
    }

    if (!this.warmupComplete) {
      await this.warmup();
    }

    const startTime = performance.now();

    return tf.tidy(() => {
      // Prepare input tensor
      const inputTensor = tf.tensor(inputData, this.metadata!.inputShape);

      // Run inference
      const outputTensor = this.model!.predict(inputTensor) as tf.Tensor;

      // Extract predictions
      const predictions = Array.from(outputTensor.dataSync());

      // Calculate confidence (max probability)
      const confidence = Math.max(...predictions);

      const inferenceTime = performance.now() - startTime;

      return {
        predictions,
        confidence,
        inferenceTime,
        modelVersion: this.metadata!.version,
      };
    });
  }

  /**
   * Batch inference for multiple inputs
   */
  async batchPredict(inputs: number[][]): Promise<InferenceResult[]> {
    if (!this.model || !this.metadata) {
      throw new Error('Model not loaded');
    }

    console.log(`[EdgeInference] Running batch inference for ${inputs.length} samples`);

    const startTime = performance.now();
    const results: InferenceResult[] = [];

    // Process in batches to manage memory
    const batchSize = this.calculateOptimalBatchSize();

    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(input => this.predict(input))
      );

      results.push(...batchResults);
    }

    const totalTime = performance.now() - startTime;
    console.log(`[EdgeInference] Batch inference completed in ${totalTime.toFixed(2)}ms`);
    console.log(`[EdgeInference] Average per sample: ${(totalTime / inputs.length).toFixed(2)}ms`);

    return results;
  }

  /**
   * Calculate optimal batch size based on device capabilities
   */
  private calculateOptimalBatchSize(): number {
    const { memoryMB, cpuCores, hasGPU } = this.deviceInfo.capabilities;

    if (hasGPU) {
      return Math.min(32, Math.floor(memoryMB / 100));
    }

    return Math.min(8, cpuCores);
  }

  /**
   * Get model performance metrics
   */
  getMetrics(): {
    modelSize: string;
    inputShape: number[];
    outputShape: number[];
    device: string;
  } {
    if (!this.metadata) {
      throw new Error('Model not loaded');
    }

    return {
      modelSize: `${(this.model!.countParams() / 1000000).toFixed(2)}M parameters`,
      inputShape: this.metadata.inputShape,
      outputShape: this.metadata.outputShape,
      device: this.deviceInfo.capabilities.hasGPU ? 'GPU' : 'CPU',
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.metadata = null;
      console.log('[EdgeInference] Resources cleaned up');
    }
  }
}

// ============================================================================
// Edge Model Update Manager
// ============================================================================

class EdgeModelUpdateManager {
  private currentVersion: string = '1.0.0';
  private updateCheckInterval: number = 3600000; // 1 hour
  private updateCheckTimer: NodeJS.Timeout | null = null;

  constructor(private edgeServer: string) {}

  /**
   * Check for model updates from edge server
   */
  async checkForUpdates(): Promise<{ available: boolean; version?: string }> {
    try {
      console.log('[ModelUpdate] Checking for updates...');

      // In production, this would make an actual HTTP request
      // For this example, we simulate the check
      const latestVersion = await this.fetchLatestVersion();

      if (this.compareVersions(latestVersion, this.currentVersion) > 0) {
        console.log(`[ModelUpdate] New version available: ${latestVersion}`);
        return { available: true, version: latestVersion };
      }

      console.log('[ModelUpdate] Model is up to date');
      return { available: false };
    } catch (error) {
      console.error('[ModelUpdate] Update check failed:', error);
      return { available: false };
    }
  }

  /**
   * Download and install model update
   */
  async downloadUpdate(version: string, targetPath: string): Promise<boolean> {
    try {
      console.log(`[ModelUpdate] Downloading version ${version}...`);

      // Simulate download with progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log(`[ModelUpdate] Download progress: ${progress}%`);
      }

      console.log(`[ModelUpdate] Model ${version} installed to ${targetPath}`);
      this.currentVersion = version;

      return true;
    } catch (error) {
      console.error('[ModelUpdate] Update failed:', error);
      return false;
    }
  }

  /**
   * Start automatic update checks
   */
  startAutoUpdate(onUpdateAvailable: (version: string) => void): void {
    console.log('[ModelUpdate] Starting auto-update checks');

    this.updateCheckTimer = setInterval(async () => {
      const update = await this.checkForUpdates();
      if (update.available && update.version) {
        onUpdateAvailable(update.version);
      }
    }, this.updateCheckInterval);
  }

  /**
   * Stop automatic update checks
   */
  stopAutoUpdate(): void {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
      this.updateCheckTimer = null;
      console.log('[ModelUpdate] Auto-update checks stopped');
    }
  }

  private async fetchLatestVersion(): Promise<string> {
    // Simulate fetching from edge server
    return '1.0.1';
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }

    return 0;
  }
}

// ============================================================================
// Usage Example
// ============================================================================

async function main() {
  console.log('=== Edge Inference Example ===\n');

  // Define edge device capabilities
  const device: EdgeDevice = {
    id: 'edge-device-001',
    capabilities: {
      cpuCores: 4,
      memoryMB: 2048,
      hasGPU: false,
      hasTensorCore: false,
    },
  };

  // Initialize inference engine
  const engine = new EdgeInferenceEngine(device);

  try {
    // Load model (in production, this would be a real path)
    console.log('1. Loading ML model...');
    // await engine.loadModel('/path/to/model');

    // For demo purposes, create a simple model
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 3, activation: 'softmax' }),
      ],
    });

    // Save and load the model
    const modelPath = '/tmp/edge-model';
    await model.save(`file://${modelPath}`);
    await engine.loadModel(modelPath);

    // Display model metrics
    console.log('\n2. Model Metrics:');
    console.log(JSON.stringify(engine.getMetrics(), null, 2));

    // Single inference
    console.log('\n3. Running single inference...');
    const sampleInput = Array(10).fill(0).map(() => Math.random());
    const result = await engine.predict(sampleInput);
    console.log('Result:', {
      predictedClass: result.predictions.indexOf(Math.max(...result.predictions)),
      confidence: `${(result.confidence * 100).toFixed(2)}%`,
      inferenceTime: `${result.inferenceTime.toFixed(2)}ms`,
    });

    // Batch inference
    console.log('\n4. Running batch inference...');
    const batchInputs = Array(10)
      .fill(0)
      .map(() => Array(10).fill(0).map(() => Math.random()));

    const batchResults = await engine.batchPredict(batchInputs);
    console.log(`Processed ${batchResults.length} samples`);
    console.log(`Average inference time: ${
      (batchResults.reduce((sum, r) => sum + r.inferenceTime, 0) / batchResults.length).toFixed(2)
    }ms`);

    // Model update management
    console.log('\n5. Checking for model updates...');
    const updateManager = new EdgeModelUpdateManager('http://edge-server.local');
    const updateInfo = await updateManager.checkForUpdates();

    if (updateInfo.available) {
      console.log(`New version available: ${updateInfo.version}`);
      await updateManager.downloadUpdate(updateInfo.version!, modelPath);
    }

    // Cleanup
    engine.dispose();

    console.log('\n=== Edge Inference Complete ===');

  } catch (error) {
    console.error('Error during edge inference:', error);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { EdgeInferenceEngine, EdgeModelUpdateManager, InferenceResult, ModelMetadata, EdgeDevice };
