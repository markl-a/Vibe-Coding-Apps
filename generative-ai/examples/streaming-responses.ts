/**
 * Streaming Responses Examples
 *
 * This file demonstrates:
 * - Stream chat responses
 * - Handle chunks
 * - Progress tracking
 */

import OpenAI from 'openai';
import { Stream } from 'openai/streaming';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// 1. BASIC STREAMING
// ============================================================================

/**
 * Basic streaming example with real-time output
 */
async function basicStreaming(): Promise<void> {
  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: 'Write a short story about a robot learning to paint.',
        },
      ],
      stream: true,
      max_tokens: 500,
    });

    console.log('Streaming response:');
    console.log('-------------------');

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      process.stdout.write(content);
    }

    console.log('\n-------------------');
  } catch (error) {
    console.error('Error in basic streaming:', error);
    throw error;
  }
}

/**
 * Streaming with complete message reconstruction
 */
async function streamingWithReconstruction(): Promise<string> {
  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: 'Explain how neural networks work in 3 paragraphs.',
        },
      ],
      stream: true,
    });

    let fullResponse = '';
    let chunkCount = 0;

    for await (const chunk of stream) {
      chunkCount++;
      const content = chunk.choices[0]?.delta?.content || '';
      fullResponse += content;

      // Display real-time progress
      if (chunkCount % 10 === 0) {
        process.stdout.write('.');
      }
    }

    console.log(`\n\nReceived ${chunkCount} chunks`);
    console.log('Complete response:');
    console.log(fullResponse);

    return fullResponse;
  } catch (error) {
    console.error('Error in streaming with reconstruction:', error);
    throw error;
  }
}

// ============================================================================
// 2. ADVANCED CHUNK HANDLING
// ============================================================================

interface StreamMetrics {
  totalChunks: number;
  totalTokens: number;
  totalCharacters: number;
  startTime: number;
  endTime?: number;
  firstChunkTime?: number;
  averageChunkSize: number;
}

/**
 * Stream with detailed metrics tracking
 */
async function streamingWithMetrics(): Promise<StreamMetrics> {
  try {
    const metrics: StreamMetrics = {
      totalChunks: 0,
      totalTokens: 0,
      totalCharacters: 0,
      startTime: Date.now(),
      averageChunkSize: 0,
    };

    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: 'Write a comprehensive guide on TypeScript generics with code examples.',
        },
      ],
      stream: true,
    });

    console.log('Streaming with metrics...\n');

    for await (const chunk of stream) {
      if (!metrics.firstChunkTime) {
        metrics.firstChunkTime = Date.now();
        console.log(`Time to first chunk: ${metrics.firstChunkTime - metrics.startTime}ms`);
      }

      metrics.totalChunks++;
      const content = chunk.choices[0]?.delta?.content || '';
      metrics.totalCharacters += content.length;

      // Track token usage if available
      if (chunk.usage) {
        metrics.totalTokens = chunk.usage.total_tokens;
      }

      process.stdout.write(content);
    }

    metrics.endTime = Date.now();
    metrics.averageChunkSize = metrics.totalCharacters / metrics.totalChunks;

    console.log('\n\n--- Streaming Metrics ---');
    console.log(`Total chunks: ${metrics.totalChunks}`);
    console.log(`Total characters: ${metrics.totalCharacters}`);
    console.log(`Average chunk size: ${metrics.averageChunkSize.toFixed(2)} chars`);
    console.log(`Total time: ${metrics.endTime - metrics.startTime}ms`);
    console.log(`Time to first chunk: ${(metrics.firstChunkTime! - metrics.startTime)}ms`);

    return metrics;
  } catch (error) {
    console.error('Error in streaming with metrics:', error);
    throw error;
  }
}

/**
 * Stream with custom chunk processing
 */
async function streamingWithCustomProcessing(): Promise<void> {
  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: 'Generate a JSON object with 10 random products including name, price, and category.',
        },
      ],
      stream: true,
    });

    let buffer = '';
    const sentences: string[] = [];

    console.log('Processing chunks and extracting sentences...\n');

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      buffer += content;

      // Extract complete sentences
      const sentenceEndings = /[.!?]\s/g;
      let match;

      while ((match = sentenceEndings.exec(buffer)) !== null) {
        const sentence = buffer.substring(0, match.index + 1).trim();
        if (sentence) {
          sentences.push(sentence);
          console.log(`[Sentence ${sentences.length}]: ${sentence}`);
        }
        buffer = buffer.substring(match.index + 2);
        sentenceEndings.lastIndex = 0; // Reset regex
      }

      process.stdout.write(content);
    }

    // Process remaining buffer
    if (buffer.trim()) {
      sentences.push(buffer.trim());
      console.log(`\n[Final]: ${buffer.trim()}`);
    }

    console.log(`\n\nExtracted ${sentences.length} sentences/segments`);
  } catch (error) {
    console.error('Error in streaming with custom processing:', error);
    throw error;
  }
}

// ============================================================================
// 3. PROGRESS TRACKING
// ============================================================================

/**
 * Progress bar for streaming
 */
class StreamProgressBar {
  private current: number = 0;
  private total: number;
  private barLength: number = 50;
  private startTime: number;

  constructor(estimatedLength: number = 1000) {
    this.total = estimatedLength;
    this.startTime = Date.now();
  }

  update(increment: number): void {
    this.current += increment;
    this.render();
  }

  private render(): void {
    const percentage = Math.min((this.current / this.total) * 100, 100);
    const filledLength = Math.round((this.barLength * this.current) / this.total);
    const bar = '█'.repeat(filledLength) + '░'.repeat(this.barLength - filledLength);
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);

    process.stdout.write(`\r[${bar}] ${percentage.toFixed(1)}% | ${this.current}/${this.total} chars | ${elapsed}s`);
  }

  complete(): void {
    this.current = this.total;
    this.render();
    console.log('\n');
  }
}

/**
 * Streaming with progress bar
 */
async function streamingWithProgressBar(): Promise<void> {
  try {
    const estimatedLength = 2000; // Estimate based on max_tokens
    const progressBar = new StreamProgressBar(estimatedLength);

    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: 'Write a detailed article about the future of artificial intelligence.',
        },
      ],
      stream: true,
      max_tokens: 500,
    });

    let fullText = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullText += content;
      progressBar.update(content.length);
    }

    progressBar.complete();

    console.log('\nGenerated Article:');
    console.log('------------------');
    console.log(fullText);
  } catch (error) {
    console.error('Error in streaming with progress bar:', error);
    throw error;
  }
}

/**
 * Multi-stage progress tracking
 */
async function streamingWithStages(): Promise<void> {
  interface Stage {
    name: string;
    status: 'pending' | 'in-progress' | 'complete';
    progress: number;
  }

  const stages: Stage[] = [
    { name: 'Initializing', status: 'pending', progress: 0 },
    { name: 'Connecting to API', status: 'pending', progress: 0 },
    { name: 'Streaming response', status: 'pending', progress: 0 },
    { name: 'Processing complete', status: 'pending', progress: 0 },
  ];

  const updateStage = (index: number, status: Stage['status'], progress: number = 100) => {
    stages[index].status = status;
    stages[index].progress = progress;
    displayStages();
  };

  const displayStages = () => {
    console.clear();
    console.log('=== Streaming Progress ===\n');
    stages.forEach((stage, index) => {
      const icon = stage.status === 'complete' ? '✓' :
                   stage.status === 'in-progress' ? '⟳' : '○';
      const bar = '▓'.repeat(Math.floor(stage.progress / 5)) +
                  '░'.repeat(20 - Math.floor(stage.progress / 5));
      console.log(`${icon} ${stage.name}: [${bar}] ${stage.progress}%`);
    });
  };

  try {
    // Stage 1: Initialize
    updateStage(0, 'in-progress', 50);
    await new Promise(resolve => setTimeout(resolve, 500));
    updateStage(0, 'complete');

    // Stage 2: Connect
    updateStage(1, 'in-progress', 50);
    await new Promise(resolve => setTimeout(resolve, 300));
    updateStage(1, 'complete');

    // Stage 3: Stream
    updateStage(2, 'in-progress', 0);

    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: 'Explain quantum computing in simple terms.',
        },
      ],
      stream: true,
      max_tokens: 300,
    });

    let totalChars = 0;
    const estimatedTotal = 1000;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      totalChars += content.length;
      const progress = Math.min((totalChars / estimatedTotal) * 100, 99);
      updateStage(2, 'in-progress', Math.floor(progress));
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate processing
    }

    updateStage(2, 'complete');

    // Stage 4: Complete
    updateStage(3, 'in-progress', 50);
    await new Promise(resolve => setTimeout(resolve, 300));
    updateStage(3, 'complete');

    console.log('\n✓ All stages completed successfully!');
  } catch (error) {
    console.error('\n✗ Error during streaming:', error);
    throw error;
  }
}

// ============================================================================
// 4. ERROR HANDLING AND RECOVERY
// ============================================================================

/**
 * Streaming with error handling and retry logic
 */
async function streamingWithRetry(maxRetries: number = 3): Promise<void> {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      attempts++;
      console.log(`Attempt ${attempts}/${maxRetries}...`);

      const stream = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: 'Write a haiku about programming.',
          },
        ],
        stream: true,
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        process.stdout.write(content);
      }

      console.log('\n\nStreaming completed successfully!');
      return; // Success, exit function

    } catch (error) {
      console.error(`\nError on attempt ${attempts}:`, error);

      if (attempts < maxRetries) {
        const delay = Math.pow(2, attempts) * 1000; // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('Max retries reached. Giving up.');
        throw error;
      }
    }
  }
}

/**
 * Streaming with timeout
 */
async function streamingWithTimeout(timeoutMs: number = 30000): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Streaming timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: 'Write a brief summary of machine learning.',
          },
        ],
        stream: true,
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        process.stdout.write(content);
      }

      clearTimeout(timeout);
      console.log('\n');
      resolve(fullResponse);

    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  try {
    console.log('=== Streaming Responses Examples ===\n');

    console.log('\n1. Basic Streaming');
    console.log('-------------------');
    await basicStreaming();

    console.log('\n\n2. Streaming with Reconstruction');
    console.log('---------------------------------');
    await streamingWithReconstruction();

    console.log('\n\n3. Streaming with Metrics');
    console.log('--------------------------');
    await streamingWithMetrics();

    console.log('\n\n4. Streaming with Custom Processing');
    console.log('------------------------------------');
    await streamingWithCustomProcessing();

    console.log('\n\n5. Streaming with Progress Bar');
    console.log('-------------------------------');
    await streamingWithProgressBar();

    console.log('\n\n6. Streaming with Multi-Stage Progress');
    console.log('---------------------------------------');
    await streamingWithStages();

    console.log('\n\n7. Streaming with Retry Logic');
    console.log('------------------------------');
    await streamingWithRetry();

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  main();
}

export {
  basicStreaming,
  streamingWithReconstruction,
  streamingWithMetrics,
  streamingWithCustomProcessing,
  streamingWithProgressBar,
  streamingWithStages,
  streamingWithRetry,
  streamingWithTimeout,
  StreamProgressBar,
};
