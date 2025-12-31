/**
 * File Processing Examples
 *
 * Demonstrates comprehensive file processing patterns including:
 * - Batch file operations
 * - Stream processing for large files
 * - File watching and monitoring
 * - Parallel processing
 * - Error handling and retries
 */

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import * as readline from 'readline';
import { promisify } from 'util';
import { glob } from 'glob';
import chokidar from 'chokidar';
import * as crypto from 'crypto';

// ============================================================================
// Example 1: Batch File Processing
// ============================================================================

interface ProcessResult {
  file: string;
  success: boolean;
  error?: Error;
  stats?: {
    size: number;
    lines?: number;
    processingTime: number;
  };
}

class BatchFileProcessor {
  private results: ProcessResult[] = [];

  /**
   * Process multiple files in parallel with concurrency control
   */
  async processFiles(
    files: string[],
    processor: (file: string) => Promise<void>,
    options: { concurrency?: number; continueOnError?: boolean } = {}
  ): Promise<ProcessResult[]> {
    const { concurrency = 5, continueOnError = true } = options;
    const results: ProcessResult[] = [];

    // Process files in batches
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);

      const batchResults = await Promise.allSettled(
        batch.map(async file => {
          const startTime = Date.now();
          try {
            await processor(file);
            const stats = await fs.stat(file);

            return {
              file,
              success: true,
              stats: {
                size: stats.size,
                processingTime: Date.now() - startTime,
              },
            };
          } catch (error) {
            if (!continueOnError) throw error;

            return {
              file,
              success: false,
              error: error as Error,
              stats: {
                size: 0,
                processingTime: Date.now() - startTime,
              },
            };
          }
        })
      );

      results.push(
        ...batchResults.map(r =>
          r.status === 'fulfilled' ? r.value : r.reason
        )
      );
    }

    this.results = results;
    return results;
  }

  /**
   * Get processing statistics
   */
  getStats() {
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalSize = this.results.reduce(
      (sum, r) => sum + (r.stats?.size || 0),
      0
    );
    const avgTime =
      this.results.reduce((sum, r) => sum + (r.stats?.processingTime || 0), 0) /
      this.results.length;

    return {
      total: this.results.length,
      successful,
      failed,
      totalSize,
      averageProcessingTime: avgTime,
    };
  }
}

// ============================================================================
// Example 2: Stream Processing for Large Files
// ============================================================================

class StreamFileProcessor {
  /**
   * Process large files line by line without loading entire file into memory
   */
  async processLargeFile(
    inputFile: string,
    outputFile: string,
    transformer: (line: string) => string
  ): Promise<void> {
    const fileStream = createReadStream(inputFile);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const writeStream = createWriteStream(outputFile);

    for await (const line of rl) {
      const transformed = transformer(line);
      writeStream.write(transformed + '\n');
    }

    writeStream.end();
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }

  /**
   * Process file with custom transform stream
   */
  async processWithTransform(
    inputFile: string,
    outputFile: string,
    transformFn: (chunk: Buffer) => Buffer
  ): Promise<void> {
    const transform = new Transform({
      transform(chunk, encoding, callback) {
        try {
          const transformed = transformFn(chunk);
          callback(null, transformed);
        } catch (error) {
          callback(error as Error);
        }
      },
    });

    await pipeline(
      createReadStream(inputFile),
      transform,
      createWriteStream(outputFile)
    );
  }

  /**
   * Split large file into smaller chunks
   */
  async splitFile(
    inputFile: string,
    outputDir: string,
    options: { chunkSize?: number; prefix?: string } = {}
  ): Promise<string[]> {
    const { chunkSize = 1024 * 1024, prefix = 'chunk' } = options;

    await fs.mkdir(outputDir, { recursive: true });

    const fileStream = createReadStream(inputFile, {
      highWaterMark: chunkSize,
    });

    const outputFiles: string[] = [];
    let chunkIndex = 0;
    let currentChunk: Buffer[] = [];
    let currentSize = 0;

    for await (const chunk of fileStream) {
      currentChunk.push(chunk);
      currentSize += chunk.length;

      if (currentSize >= chunkSize) {
        const outputFile = path.join(outputDir, `${prefix}-${chunkIndex}.txt`);
        await fs.writeFile(outputFile, Buffer.concat(currentChunk));
        outputFiles.push(outputFile);

        currentChunk = [];
        currentSize = 0;
        chunkIndex++;
      }
    }

    // Write remaining data
    if (currentChunk.length > 0) {
      const outputFile = path.join(outputDir, `${prefix}-${chunkIndex}.txt`);
      await fs.writeFile(outputFile, Buffer.concat(currentChunk));
      outputFiles.push(outputFile);
    }

    return outputFiles;
  }

  /**
   * Merge multiple files into one
   */
  async mergeFiles(inputFiles: string[], outputFile: string): Promise<void> {
    const writeStream = createWriteStream(outputFile);

    for (const file of inputFiles) {
      const readStream = createReadStream(file);
      await pipeline(readStream, writeStream, { end: false });
    }

    writeStream.end();
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }
}

// ============================================================================
// Example 3: File System Operations
// ============================================================================

class FileSystemHelper {
  /**
   * Recursively find files matching pattern
   */
  async findFiles(
    directory: string,
    pattern: string = '**/*',
    options: { ignore?: string[] } = {}
  ): Promise<string[]> {
    const files = await glob(pattern, {
      cwd: directory,
      absolute: true,
      ignore: options.ignore || ['**/node_modules/**', '**/.git/**'],
    });

    return files;
  }

  /**
   * Copy directory recursively
   */
  async copyDirectory(
    source: string,
    destination: string,
    options: { overwrite?: boolean; filter?: (file: string) => boolean } = {}
  ): Promise<void> {
    const { overwrite = true, filter } = options;

    await fs.mkdir(destination, { recursive: true });

    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);

      if (filter && !filter(sourcePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, destPath, options);
      } else {
        if (!overwrite) {
          try {
            await fs.access(destPath);
            continue; // Skip if file exists
          } catch {
            // File doesn't exist, proceed with copy
          }
        }
        await fs.copyFile(sourcePath, destPath);
      }
    }
  }

  /**
   * Delete files older than specified days
   */
  async cleanupOldFiles(
    directory: string,
    daysOld: number,
    options: { dryRun?: boolean; pattern?: string } = {}
  ): Promise<string[]> {
    const { dryRun = false, pattern = '**/*' } = options;
    const files = await this.findFiles(directory, pattern);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deletedFiles: string[] = [];

    for (const file of files) {
      const stats = await fs.stat(file);

      if (stats.mtime < cutoffDate) {
        if (!dryRun) {
          await fs.unlink(file);
        }
        deletedFiles.push(file);
      }
    }

    return deletedFiles;
  }

  /**
   * Calculate directory size
   */
  async getDirectorySize(directory: string): Promise<number> {
    let totalSize = 0;

    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        totalSize += await this.getDirectorySize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }

    return totalSize;
  }

  /**
   * Create file hash (checksum)
   */
  async calculateFileHash(
    filePath: string,
    algorithm: 'md5' | 'sha256' = 'sha256'
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(algorithm);
      const stream = createReadStream(filePath);

      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }
}

// ============================================================================
// Example 4: File Watching and Monitoring
// ============================================================================

class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null;

  /**
   * Watch directory for changes
   */
  watch(
    directory: string,
    callbacks: {
      onAdd?: (path: string) => void;
      onChange?: (path: string) => void;
      onDelete?: (path: string) => void;
    },
    options: {
      ignored?: RegExp | string;
      persistent?: boolean;
      ignoreInitial?: boolean;
    } = {}
  ): void {
    this.watcher = chokidar.watch(directory, {
      ignored: options.ignored || /(^|[\/\\])\../,
      persistent: options.persistent ?? true,
      ignoreInitial: options.ignoreInitial ?? true,
    });

    if (callbacks.onAdd) {
      this.watcher.on('add', callbacks.onAdd);
    }

    if (callbacks.onChange) {
      this.watcher.on('change', callbacks.onChange);
    }

    if (callbacks.onDelete) {
      this.watcher.on('unlink', callbacks.onDelete);
    }

    this.watcher.on('error', error => {
      console.error('Watcher error:', error);
    });
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }
}

// ============================================================================
// Example 5: Backup and Restore
// ============================================================================

interface BackupMetadata {
  timestamp: Date;
  files: string[];
  totalSize: number;
  checksum: string;
}

class BackupManager {
  private backupDir: string;

  constructor(backupDir: string) {
    this.backupDir = backupDir;
  }

  /**
   * Create backup of files/directories
   */
  async createBackup(
    sources: string[],
    backupName: string
  ): Promise<BackupMetadata> {
    const timestamp = new Date();
    const backupPath = path.join(
      this.backupDir,
      `${backupName}-${timestamp.getTime()}`
    );

    await fs.mkdir(backupPath, { recursive: true });

    const helper = new FileSystemHelper();
    const backedUpFiles: string[] = [];
    let totalSize = 0;

    for (const source of sources) {
      const stats = await fs.stat(source);
      const basename = path.basename(source);
      const destPath = path.join(backupPath, basename);

      if (stats.isDirectory()) {
        await helper.copyDirectory(source, destPath);
        totalSize += await helper.getDirectorySize(destPath);
      } else {
        await fs.copyFile(source, destPath);
        totalSize += stats.size;
      }

      backedUpFiles.push(destPath);
    }

    // Create metadata file
    const metadata: BackupMetadata = {
      timestamp,
      files: backedUpFiles,
      totalSize,
      checksum: await this.calculateBackupChecksum(backedUpFiles),
    };

    await fs.writeFile(
      path.join(backupPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    return metadata;
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupPath: string, destinationDir: string): Promise<void> {
    const metadataPath = path.join(backupPath, 'metadata.json');
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const metadata: BackupMetadata = JSON.parse(metadataContent);

    // Verify backup integrity
    const currentChecksum = await this.calculateBackupChecksum(metadata.files);
    if (currentChecksum !== metadata.checksum) {
      throw new Error('Backup integrity check failed');
    }

    const helper = new FileSystemHelper();
    await fs.mkdir(destinationDir, { recursive: true });

    for (const file of metadata.files) {
      const basename = path.basename(file);
      const destPath = path.join(destinationDir, basename);

      const stats = await fs.stat(file);
      if (stats.isDirectory()) {
        await helper.copyDirectory(file, destPath);
      } else {
        await fs.copyFile(file, destPath);
      }
    }
  }

  private async calculateBackupChecksum(files: string[]): Promise<string> {
    const helper = new FileSystemHelper();
    const hashes = await Promise.all(
      files.map(file => helper.calculateFileHash(file))
    );

    const combined = hashes.join('');
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    const entries = await fs.readdir(this.backupDir, { withFileTypes: true });
    const backups: BackupMetadata[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const metadataPath = path.join(
          this.backupDir,
          entry.name,
          'metadata.json'
        );

        try {
          const content = await fs.readFile(metadataPath, 'utf-8');
          backups.push(JSON.parse(content));
        } catch {
          // Skip if metadata doesn't exist
        }
      }
    }

    return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

// ============================================================================
// Example 6: File Transformation Pipeline
// ============================================================================

interface TransformStep {
  name: string;
  transform: (content: string) => string | Promise<string>;
}

class FileTransformPipeline {
  private steps: TransformStep[] = [];

  /**
   * Add transformation step
   */
  addStep(name: string, transform: (content: string) => string | Promise<string>) {
    this.steps.push({ name, transform });
    return this;
  }

  /**
   * Execute pipeline on a file
   */
  async execute(inputFile: string, outputFile: string): Promise<void> {
    let content = await fs.readFile(inputFile, 'utf-8');

    for (const step of this.steps) {
      console.log(`Executing step: ${step.name}`);
      content = await step.transform(content);
    }

    await fs.writeFile(outputFile, content);
  }

  /**
   * Execute pipeline on multiple files
   */
  async executeOnFiles(
    inputFiles: string[],
    outputDir: string
  ): Promise<void> {
    await fs.mkdir(outputDir, { recursive: true });

    const processor = new BatchFileProcessor();
    await processor.processFiles(
      inputFiles,
      async file => {
        const basename = path.basename(file);
        const outputFile = path.join(outputDir, basename);
        await this.execute(file, outputFile);
      },
      { concurrency: 3 }
    );
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function demonstrateFileProcessing() {
  // Example 1: Batch processing
  console.log('=== Batch File Processing ===');
  const batchProcessor = new BatchFileProcessor();
  const files = ['file1.txt', 'file2.txt', 'file3.txt'];

  await batchProcessor.processFiles(
    files,
    async file => {
      // Your processing logic
      const content = await fs.readFile(file, 'utf-8');
      const processed = content.toUpperCase();
      await fs.writeFile(file + '.processed', processed);
    },
    { concurrency: 2 }
  );

  console.log('Stats:', batchProcessor.getStats());

  // Example 2: Stream processing
  console.log('\n=== Stream Processing ===');
  const streamProcessor = new StreamFileProcessor();

  await streamProcessor.processLargeFile(
    'large-file.txt',
    'output.txt',
    line => line.trim().toUpperCase()
  );

  // Example 3: File system operations
  console.log('\n=== File System Operations ===');
  const fsHelper = new FileSystemHelper();

  const tsFiles = await fsHelper.findFiles('.', '**/*.ts', {
    ignore: ['**/node_modules/**'],
  });
  console.log(`Found ${tsFiles.length} TypeScript files`);

  const dirSize = await fsHelper.getDirectorySize('.');
  console.log(`Directory size: ${(dirSize / 1024 / 1024).toFixed(2)} MB`);

  // Example 4: File watching
  console.log('\n=== File Watching ===');
  const watcher = new FileWatcher();

  watcher.watch(
    './watched-dir',
    {
      onAdd: path => console.log(`File added: ${path}`),
      onChange: path => console.log(`File changed: ${path}`),
      onDelete: path => console.log(`File deleted: ${path}`),
    },
    { ignoreInitial: true }
  );

  // Example 5: Backup
  console.log('\n=== Backup Operations ===');
  const backupManager = new BackupManager('./backups');

  const metadata = await backupManager.createBackup(
    ['./src', './config'],
    'daily-backup'
  );
  console.log('Backup created:', metadata);

  const backups = await backupManager.listBackups();
  console.log(`Total backups: ${backups.length}`);

  // Example 6: Transformation pipeline
  console.log('\n=== Transformation Pipeline ===');
  const pipeline = new FileTransformPipeline();

  pipeline
    .addStep('trim', content => content.trim())
    .addStep('uppercase', content => content.toUpperCase())
    .addStep('add-header', content => `# PROCESSED FILE\n\n${content}`);

  // await pipeline.execute('input.txt', 'output.txt');
}

// Run if executed directly
if (require.main === module) {
  demonstrateFileProcessing().catch(console.error);
}

export {
  BatchFileProcessor,
  StreamFileProcessor,
  FileSystemHelper,
  FileWatcher,
  BackupManager,
  FileTransformPipeline,
};
