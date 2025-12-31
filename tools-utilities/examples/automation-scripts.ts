/**
 * Automation Scripts Examples
 *
 * Demonstrates comprehensive automation patterns including:
 * - Task scheduling and cron jobs
 * - Workflow automation
 * - System maintenance automation
 * - CI/CD automation
 * - Deployment automation
 * - Monitoring and alerting
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import cron from 'node-cron';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import * as nodemailer from 'nodemailer';

const execAsync = promisify(exec);

// ============================================================================
// Example 1: Task Scheduler
// ============================================================================

interface ScheduledTask {
  id: string;
  name: string;
  schedule: string; // cron expression
  task: () => Promise<void>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount?: number;
}

class TaskScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Add a scheduled task
   */
  addTask(task: ScheduledTask): void {
    this.tasks.set(task.id, {
      ...task,
      runCount: 0,
    });

    if (task.enabled) {
      this.startTask(task.id);
    }
  }

  /**
   * Start a task
   */
  startTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (this.scheduledJobs.has(taskId)) {
      console.log(`Task ${taskId} is already running`);
      return;
    }

    const job = cron.schedule(task.schedule, async () => {
      console.log(`Running task: ${task.name}`);

      try {
        const startTime = Date.now();
        await task.task();

        const updatedTask = this.tasks.get(taskId)!;
        updatedTask.lastRun = new Date();
        updatedTask.runCount = (updatedTask.runCount || 0) + 1;

        console.log(
          `Task ${task.name} completed in ${Date.now() - startTime}ms`
        );
      } catch (error) {
        console.error(`Task ${task.name} failed:`, error);
      }
    });

    this.scheduledJobs.set(taskId, job);
    console.log(`Task ${task.name} scheduled with pattern: ${task.schedule}`);
  }

  /**
   * Stop a task
   */
  stopTask(taskId: string): void {
    const job = this.scheduledJobs.get(taskId);
    if (job) {
      job.stop();
      this.scheduledJobs.delete(taskId);
      console.log(`Task ${taskId} stopped`);
    }
  }

  /**
   * Stop all tasks
   */
  stopAll(): void {
    for (const [taskId, job] of this.scheduledJobs) {
      job.stop();
      console.log(`Task ${taskId} stopped`);
    }
    this.scheduledJobs.clear();
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): ScheduledTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * List all tasks
   */
  listTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }
}

// ============================================================================
// Example 2: Workflow Automation
// ============================================================================

interface WorkflowStep {
  name: string;
  execute: () => Promise<void>;
  onError?: (error: Error) => Promise<void>;
  retries?: number;
  timeout?: number;
}

interface WorkflowConfig {
  name: string;
  steps: WorkflowStep[];
  parallel?: boolean;
  continueOnError?: boolean;
}

class WorkflowAutomation {
  /**
   * Execute a workflow
   */
  async executeWorkflow(config: WorkflowConfig): Promise<{
    success: boolean;
    results: { step: string; success: boolean; error?: Error }[];
  }> {
    console.log(`Starting workflow: ${config.name}`);
    const results: { step: string; success: boolean; error?: Error }[] = [];

    if (config.parallel) {
      // Execute steps in parallel
      const stepResults = await Promise.allSettled(
        config.steps.map(step => this.executeStep(step))
      );

      stepResults.forEach((result, index) => {
        const step = config.steps[index];
        if (result.status === 'fulfilled') {
          results.push({ step: step.name, success: true });
        } else {
          results.push({
            step: step.name,
            success: false,
            error: result.reason,
          });
        }
      });
    } else {
      // Execute steps sequentially
      for (const step of config.steps) {
        try {
          await this.executeStep(step);
          results.push({ step: step.name, success: true });
        } catch (error) {
          results.push({
            step: step.name,
            success: false,
            error: error as Error,
          });

          if (!config.continueOnError) {
            break;
          }
        }
      }
    }

    const success = results.every(r => r.success);
    console.log(
      `Workflow ${config.name} ${success ? 'completed' : 'failed'}`
    );

    return { success, results };
  }

  /**
   * Execute a single workflow step with retries
   */
  private async executeStep(step: WorkflowStep): Promise<void> {
    const maxRetries = step.retries || 0;
    const timeout = step.timeout || 300000; // 5 minutes default

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Executing step: ${step.name} (attempt ${attempt + 1})`);

        await this.executeWithTimeout(step.execute, timeout);

        console.log(`Step ${step.name} completed`);
        return;
      } catch (error) {
        console.error(`Step ${step.name} failed (attempt ${attempt + 1}):`, error);

        if (attempt === maxRetries) {
          if (step.onError) {
            await step.onError(error as Error);
          }
          throw error;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      ),
    ]);
  }
}

// ============================================================================
// Example 3: File System Automation
// ============================================================================

class FileSystemAutomation {
  /**
   * Clean up old files
   */
  async cleanupOldFiles(
    directory: string,
    daysOld: number,
    options: {
      pattern?: RegExp;
      dryRun?: boolean;
      recursive?: boolean;
    } = {}
  ): Promise<{ deleted: string[]; size: number }> {
    const { pattern, dryRun = false, recursive = false } = options;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deleted: string[] = [];
    let totalSize = 0;

    const processDirectory = async (dir: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && recursive) {
          await processDirectory(fullPath);
        } else if (entry.isFile()) {
          if (pattern && !pattern.test(entry.name)) {
            continue;
          }

          const stats = await fs.stat(fullPath);

          if (stats.mtime < cutoffDate) {
            totalSize += stats.size;
            deleted.push(fullPath);

            if (!dryRun) {
              await fs.unlink(fullPath);
            }
          }
        }
      }
    };

    await processDirectory(directory);

    console.log(
      `${dryRun ? 'Would delete' : 'Deleted'} ${deleted.length} files (${(totalSize / 1024 / 1024).toFixed(2)} MB)`
    );

    return { deleted, size: totalSize };
  }

  /**
   * Organize files by extension
   */
  async organizeFilesByExtension(
    sourceDir: string,
    targetDir: string
  ): Promise<void> {
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase().slice(1) || 'no-extension';
        const targetFolder = path.join(targetDir, ext);

        await fs.mkdir(targetFolder, { recursive: true });

        const sourcePath = path.join(sourceDir, entry.name);
        const targetPath = path.join(targetFolder, entry.name);

        await fs.rename(sourcePath, targetPath);
        console.log(`Moved ${entry.name} to ${ext}/`);
      }
    }
  }

  /**
   * Batch rename files
   */
  async batchRename(
    directory: string,
    pattern: RegExp,
    replacement: string
  ): Promise<string[]> {
    const entries = await fs.readdir(directory);
    const renamed: string[] = [];

    for (const filename of entries) {
      if (pattern.test(filename)) {
        const newName = filename.replace(pattern, replacement);
        const oldPath = path.join(directory, filename);
        const newPath = path.join(directory, newName);

        await fs.rename(oldPath, newPath);
        renamed.push(`${filename} -> ${newName}`);
      }
    }

    return renamed;
  }
}

// ============================================================================
// Example 4: Git Automation
// ============================================================================

class GitAutomation {
  /**
   * Auto-commit and push changes
   */
  async autoCommitAndPush(
    repoPath: string,
    message: string = 'Auto-commit',
    branch: string = 'main'
  ): Promise<void> {
    try {
      // Check if there are changes
      const { stdout: status } = await execAsync('git status --porcelain', {
        cwd: repoPath,
      });

      if (!status.trim()) {
        console.log('No changes to commit');
        return;
      }

      // Add all changes
      await execAsync('git add .', { cwd: repoPath });

      // Commit
      await execAsync(`git commit -m "${message}"`, { cwd: repoPath });

      // Push
      await execAsync(`git push origin ${branch}`, { cwd: repoPath });

      console.log('Changes committed and pushed successfully');
    } catch (error) {
      console.error('Git automation failed:', error);
      throw error;
    }
  }

  /**
   * Create and push a new branch
   */
  async createBranch(
    repoPath: string,
    branchName: string,
    push: boolean = true
  ): Promise<void> {
    await execAsync(`git checkout -b ${branchName}`, { cwd: repoPath });

    if (push) {
      await execAsync(`git push -u origin ${branchName}`, { cwd: repoPath });
    }

    console.log(`Branch ${branchName} created${push ? ' and pushed' : ''}`);
  }

  /**
   * Sync fork with upstream
   */
  async syncFork(repoPath: string, upstream: string = 'upstream'): Promise<void> {
    await execAsync(`git fetch ${upstream}`, { cwd: repoPath });
    await execAsync(`git checkout main`, { cwd: repoPath });
    await execAsync(`git merge ${upstream}/main`, { cwd: repoPath });
    await execAsync('git push origin main', { cwd: repoPath });

    console.log('Fork synced with upstream');
  }
}

// ============================================================================
// Example 5: Deployment Automation
// ============================================================================

interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  buildCommand?: string;
  preDeployScript?: string;
  postDeployScript?: string;
  healthCheckUrl?: string;
  notifyOnComplete?: boolean;
}

class DeploymentAutomation {
  /**
   * Deploy application
   */
  async deploy(config: DeploymentConfig): Promise<void> {
    console.log(`Starting deployment to ${config.environment}...`);

    try {
      // Run pre-deployment script
      if (config.preDeployScript) {
        console.log('Running pre-deployment script...');
        await execAsync(config.preDeployScript);
      }

      // Build application
      if (config.buildCommand) {
        console.log('Building application...');
        await execAsync(config.buildCommand);
      }

      // Deploy (example: using rsync, docker, or cloud provider CLI)
      console.log('Deploying...');
      await this.performDeployment(config);

      // Run post-deployment script
      if (config.postDeployScript) {
        console.log('Running post-deployment script...');
        await execAsync(config.postDeployScript);
      }

      // Health check
      if (config.healthCheckUrl) {
        console.log('Performing health check...');
        await this.healthCheck(config.healthCheckUrl);
      }

      console.log(`Deployment to ${config.environment} completed successfully!`);

      // Notification
      if (config.notifyOnComplete) {
        await this.sendNotification(
          `Deployment to ${config.environment} completed successfully`
        );
      }
    } catch (error) {
      console.error('Deployment failed:', error);

      if (config.notifyOnComplete) {
        await this.sendNotification(
          `Deployment to ${config.environment} failed: ${error.message}`
        );
      }

      throw error;
    }
  }

  private async performDeployment(config: DeploymentConfig): Promise<void> {
    // Example deployment implementations
    switch (config.environment) {
      case 'production':
        // await execAsync('docker-compose -f docker-compose.prod.yml up -d');
        break;
      case 'staging':
        // await execAsync('docker-compose -f docker-compose.staging.yml up -d');
        break;
      case 'development':
        // await execAsync('docker-compose up -d');
        break;
    }

    // Simulate deployment
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private async healthCheck(url: string, maxRetries: number = 5): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios.get(url, { timeout: 5000 });

        if (response.status === 200) {
          console.log('Health check passed');
          return;
        }
      } catch (error) {
        console.log(`Health check attempt ${i + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    throw new Error('Health check failed after max retries');
  }

  private async sendNotification(message: string): Promise<void> {
    // Example: Send email, Slack notification, etc.
    console.log(`Notification: ${message}`);
  }
}

// ============================================================================
// Example 6: Database Backup Automation
// ============================================================================

interface BackupConfig {
  type: 'mysql' | 'postgres' | 'mongodb';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  backupDir: string;
  retention?: number; // days
}

class DatabaseBackupAutomation {
  /**
   * Create database backup
   */
  async createBackup(config: BackupConfig): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(
      config.backupDir,
      `${config.database}-${timestamp}.sql`
    );

    await fs.mkdir(config.backupDir, { recursive: true });

    console.log(`Creating backup: ${backupFile}`);

    let command: string;

    switch (config.type) {
      case 'mysql':
        command = `mysqldump -h ${config.host} -P ${config.port} -u ${config.username} -p${config.password} ${config.database} > ${backupFile}`;
        break;

      case 'postgres':
        command = `PGPASSWORD=${config.password} pg_dump -h ${config.host} -p ${config.port} -U ${config.username} ${config.database} > ${backupFile}`;
        break;

      case 'mongodb':
        command = `mongodump --host ${config.host}:${config.port} --db ${config.database} --username ${config.username} --password ${config.password} --out ${backupFile}`;
        break;

      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }

    await execAsync(command);

    // Compress backup
    await execAsync(`gzip ${backupFile}`);
    const compressedFile = `${backupFile}.gz`;

    console.log(`Backup created: ${compressedFile}`);

    // Clean up old backups
    if (config.retention) {
      await this.cleanupOldBackups(config.backupDir, config.retention);
    }

    return compressedFile;
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(config: BackupConfig, backupFile: string): Promise<void> {
    console.log(`Restoring from backup: ${backupFile}`);

    // Decompress if needed
    if (backupFile.endsWith('.gz')) {
      await execAsync(`gunzip ${backupFile}`);
      backupFile = backupFile.replace(/\.gz$/, '');
    }

    let command: string;

    switch (config.type) {
      case 'mysql':
        command = `mysql -h ${config.host} -P ${config.port} -u ${config.username} -p${config.password} ${config.database} < ${backupFile}`;
        break;

      case 'postgres':
        command = `PGPASSWORD=${config.password} psql -h ${config.host} -p ${config.port} -U ${config.username} ${config.database} < ${backupFile}`;
        break;

      case 'mongodb':
        command = `mongorestore --host ${config.host}:${config.port} --db ${config.database} --username ${config.username} --password ${config.password} ${backupFile}`;
        break;

      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }

    await execAsync(command);
    console.log('Database restored successfully');
  }

  private async cleanupOldBackups(
    backupDir: string,
    retentionDays: number
  ): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const files = await fs.readdir(backupDir);

    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = await fs.stat(filePath);

      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
        console.log(`Deleted old backup: ${file}`);
      }
    }
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function demonstrateAutomation() {
  console.log('=== Automation Examples ===\n');

  // Example 1: Task Scheduler
  const scheduler = new TaskScheduler();

  scheduler.addTask({
    id: 'daily-backup',
    name: 'Daily Backup',
    schedule: '0 2 * * *', // Every day at 2 AM
    enabled: true,
    task: async () => {
      console.log('Performing daily backup...');
      // Backup logic here
    },
  });

  scheduler.addTask({
    id: 'hourly-cleanup',
    name: 'Hourly Cleanup',
    schedule: '0 * * * *', // Every hour
    enabled: true,
    task: async () => {
      console.log('Cleaning up temporary files...');
      // Cleanup logic here
    },
  });

  // Example 2: Workflow
  const workflow = new WorkflowAutomation();

  await workflow.executeWorkflow({
    name: 'Build and Deploy',
    steps: [
      {
        name: 'Install Dependencies',
        execute: async () => {
          console.log('Installing dependencies...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        },
        retries: 2,
      },
      {
        name: 'Run Tests',
        execute: async () => {
          console.log('Running tests...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        },
        retries: 1,
      },
      {
        name: 'Build Application',
        execute: async () => {
          console.log('Building application...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        },
      },
      {
        name: 'Deploy',
        execute: async () => {
          console.log('Deploying...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        },
        onError: async (error) => {
          console.error('Deployment failed, rolling back...');
        },
      },
    ],
    parallel: false,
    continueOnError: false,
  });

  // Example 3: File System Automation
  const fsAutomation = new FileSystemAutomation();

  // Clean up old files (dry run)
  // await fsAutomation.cleanupOldFiles('./logs', 30, {
  //   pattern: /\.log$/,
  //   dryRun: true,
  //   recursive: true,
  // });

  // Example 4: Deployment
  const deployment = new DeploymentAutomation();

  // await deployment.deploy({
  //   environment: 'staging',
  //   buildCommand: 'npm run build',
  //   preDeployScript: 'npm run test',
  //   postDeployScript: 'npm run migrate',
  //   healthCheckUrl: 'https://staging.example.com/health',
  //   notifyOnComplete: true,
  // });

  console.log('\n=== Automation demonstrations completed ===');
}

// Run if executed directly
if (require.main === module) {
  demonstrateAutomation().catch(console.error);
}

export {
  TaskScheduler,
  WorkflowAutomation,
  FileSystemAutomation,
  GitAutomation,
  DeploymentAutomation,
  DatabaseBackupAutomation,
};
