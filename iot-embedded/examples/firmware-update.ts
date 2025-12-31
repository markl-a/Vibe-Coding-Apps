/**
 * Firmware Update Example
 * Demonstrates checking for updates, downloading firmware, and OTA (Over-The-Air) update process
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ===== Type Definitions =====

/**
 * Firmware metadata
 */
export interface FirmwareMetadata {
  version: string;
  buildNumber: number;
  releaseDate: string;
  size: number; // bytes
  url: string;
  checksum: string;
  checksumAlgorithm: 'md5' | 'sha256' | 'sha512';
  releaseNotes: string;
  mandatory: boolean;
  compatibility: {
    minHardwareRevision: string;
    maxHardwareRevision?: string;
    requiredModules?: string[];
  };
  rollback: {
    enabled: boolean;
    previousVersion?: string;
  };
}

/**
 * Update check result
 */
export interface UpdateCheckResult {
  available: boolean;
  currentVersion: string;
  latestVersion?: string;
  firmware?: FirmwareMetadata;
  message?: string;
}

/**
 * Download progress
 */
export interface DownloadProgress {
  downloadedBytes: number;
  totalBytes: number;
  percentage: number;
  speed: number; // bytes/second
  estimatedTimeRemaining: number; // seconds
}

/**
 * Update status
 */
export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'verifying'
  | 'installing'
  | 'rebooting'
  | 'completed'
  | 'failed'
  | 'rolled-back';

/**
 * Update event
 */
export interface UpdateEvent {
  status: UpdateStatus;
  progress?: number; // 0-100
  message?: string;
  error?: string;
  timestamp: number;
}

/**
 * Device information
 */
export interface DeviceInfo {
  deviceId: string;
  currentFirmwareVersion: string;
  hardwareRevision: string;
  model: string;
  manufacturer: string;
}

// ===== Firmware Update Service =====

/**
 * Service for managing firmware updates (OTA)
 */
export class FirmwareUpdateService extends EventEmitter {
  private deviceInfo: DeviceInfo;
  private updateServerUrl: string;
  private currentStatus: UpdateStatus = 'idle';
  private downloadedFirmware?: Buffer;
  private updateHistory: UpdateEvent[] = [];
  private maxRetries: number = 3;
  private retryDelay: number = 5000; // milliseconds

  constructor(deviceInfo: DeviceInfo, updateServerUrl: string) {
    super();
    this.deviceInfo = deviceInfo;
    this.updateServerUrl = updateServerUrl;
  }

  /**
   * Check for firmware updates
   */
  public async checkForUpdates(): Promise<UpdateCheckResult> {
    console.log('\n=== Checking for Firmware Updates ===');
    console.log(`Current Version: ${this.deviceInfo.currentFirmwareVersion}`);
    console.log(`Hardware Revision: ${this.deviceInfo.hardwareRevision}`);

    this.updateStatus('checking', 'Checking for updates...');

    try {
      // Simulate API call to update server
      const response = await this.httpGet(`${this.updateServerUrl}/api/v1/firmware/latest`, {
        deviceId: this.deviceInfo.deviceId,
        currentVersion: this.deviceInfo.currentFirmwareVersion,
        hardwareRevision: this.deviceInfo.hardwareRevision,
        model: this.deviceInfo.model,
      });

      if (response.available) {
        console.log(`\nNew firmware available: v${response.firmware.version}`);
        console.log(`Release Date: ${response.firmware.releaseDate}`);
        console.log(`Size: ${(response.firmware.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Mandatory: ${response.firmware.mandatory ? 'Yes' : 'No'}`);
        console.log(`Release Notes: ${response.firmware.releaseNotes}`);

        this.updateStatus('idle', 'Update available');
      } else {
        console.log('\nNo updates available. Firmware is up to date.');
        this.updateStatus('idle', 'No updates available');
      }

      return response;
    } catch (error) {
      const errorMessage = `Failed to check for updates: ${(error as Error).message}`;
      console.error(errorMessage);
      this.updateStatus('failed', undefined, errorMessage);

      return {
        available: false,
        currentVersion: this.deviceInfo.currentFirmwareVersion,
        message: errorMessage,
      };
    }
  }

  /**
   * Download firmware
   */
  public async downloadFirmware(firmware: FirmwareMetadata): Promise<boolean> {
    console.log(`\n=== Downloading Firmware v${firmware.version} ===`);
    console.log(`URL: ${firmware.url}`);
    console.log(`Size: ${(firmware.size / 1024 / 1024).toFixed(2)} MB`);

    this.updateStatus('downloading', 'Starting download...');

    try {
      // Download firmware in chunks with progress reporting
      const buffer = await this.downloadWithProgress(firmware.url, firmware.size);

      this.downloadedFirmware = buffer;

      console.log('\nDownload completed successfully');
      return true;
    } catch (error) {
      const errorMessage = `Download failed: ${(error as Error).message}`;
      console.error(errorMessage);
      this.updateStatus('failed', undefined, errorMessage);
      return false;
    }
  }

  /**
   * Verify downloaded firmware
   */
  public async verifyFirmware(firmware: FirmwareMetadata): Promise<boolean> {
    console.log('\n=== Verifying Firmware ===');

    if (!this.downloadedFirmware) {
      console.error('No firmware downloaded');
      return false;
    }

    this.updateStatus('verifying', 'Verifying firmware integrity...');

    // Check size
    if (this.downloadedFirmware.length !== firmware.size) {
      const errorMessage = `Size mismatch: expected ${firmware.size}, got ${this.downloadedFirmware.length}`;
      console.error(errorMessage);
      this.updateStatus('failed', undefined, errorMessage);
      return false;
    }

    console.log(`Size verification: OK (${firmware.size} bytes)`);

    // Verify checksum
    const calculatedChecksum = this.calculateChecksum(
      this.downloadedFirmware,
      firmware.checksumAlgorithm
    );

    if (calculatedChecksum !== firmware.checksum) {
      const errorMessage = `Checksum mismatch: expected ${firmware.checksum}, got ${calculatedChecksum}`;
      console.error(errorMessage);
      this.updateStatus('failed', undefined, errorMessage);
      return false;
    }

    console.log(`Checksum verification: OK (${firmware.checksumAlgorithm})`);
    console.log(`Checksum: ${calculatedChecksum}`);

    // Verify compatibility
    const compatible = this.checkCompatibility(firmware);
    if (!compatible) {
      const errorMessage = 'Firmware not compatible with device hardware';
      console.error(errorMessage);
      this.updateStatus('failed', undefined, errorMessage);
      return false;
    }

    console.log('Compatibility verification: OK');

    console.log('\nFirmware verification completed successfully');
    return true;
  }

  /**
   * Install firmware (OTA update)
   */
  public async installFirmware(firmware: FirmwareMetadata): Promise<boolean> {
    console.log(`\n=== Installing Firmware v${firmware.version} ===`);

    if (!this.downloadedFirmware) {
      console.error('No firmware available for installation');
      return false;
    }

    this.updateStatus('installing', 'Preparing for installation...');

    try {
      // Backup current firmware (for rollback)
      if (firmware.rollback.enabled) {
        console.log('Creating backup of current firmware...');
        await this.sleep(1000);
        console.log('Backup created successfully');
      }

      // Write firmware to flash memory
      console.log('Writing firmware to flash memory...');
      this.updateStatus('installing', 'Writing firmware...', 0);

      // Simulate writing in chunks
      const chunkSize = firmware.size / 10;
      for (let i = 0; i < 10; i++) {
        await this.sleep(500);
        const progress = ((i + 1) / 10) * 100;
        this.updateStatus('installing', `Writing firmware... ${progress.toFixed(0)}%`, progress);
      }

      console.log('Firmware written successfully');

      // Verify written firmware
      console.log('Verifying written firmware...');
      await this.sleep(500);
      console.log('Verification successful');

      // Update device info
      this.deviceInfo.currentFirmwareVersion = firmware.version;

      // Prepare for reboot
      this.updateStatus('rebooting', 'Rebooting device...');
      console.log('\nDevice will reboot in 3 seconds...');
      await this.sleep(3000);

      // Simulate reboot
      console.log('Rebooting...');
      await this.sleep(2000);

      // Boot with new firmware
      console.log('\n=== Device Rebooted ===');
      console.log(`Running firmware v${this.deviceInfo.currentFirmwareVersion}`);

      this.updateStatus('completed', 'Firmware update completed successfully');

      // Clean up
      this.downloadedFirmware = undefined;

      return true;
    } catch (error) {
      const errorMessage = `Installation failed: ${(error as Error).message}`;
      console.error(errorMessage);
      this.updateStatus('failed', undefined, errorMessage);

      // Attempt rollback if enabled
      if (firmware.rollback.enabled && firmware.rollback.previousVersion) {
        await this.rollbackFirmware(firmware.rollback.previousVersion);
      }

      return false;
    }
  }

  /**
   * Perform complete OTA update process
   */
  public async performOTAUpdate(): Promise<boolean> {
    console.log('\n========================================');
    console.log('    OTA Firmware Update Process');
    console.log('========================================');

    // Step 1: Check for updates
    const updateCheck = await this.checkForUpdates();

    if (!updateCheck.available || !updateCheck.firmware) {
      return false;
    }

    const firmware = updateCheck.firmware;

    // Step 2: Download firmware
    const downloaded = await this.downloadFirmware(firmware);
    if (!downloaded) {
      return false;
    }

    // Step 3: Verify firmware
    const verified = await this.verifyFirmware(firmware);
    if (!verified) {
      return false;
    }

    // Step 4: Install firmware
    const installed = await this.installFirmware(firmware);

    return installed;
  }

  /**
   * Rollback to previous firmware version
   */
  public async rollbackFirmware(previousVersion: string): Promise<boolean> {
    console.log(`\n=== Rolling Back to v${previousVersion} ===`);
    this.updateStatus('rolling-back', 'Rolling back firmware...');

    try {
      // Restore backup
      console.log('Restoring firmware backup...');
      await this.sleep(2000);

      // Update device info
      this.deviceInfo.currentFirmwareVersion = previousVersion;

      // Reboot
      console.log('Rebooting device...');
      await this.sleep(2000);

      console.log(`\nRollback completed. Running v${previousVersion}`);
      this.updateStatus('rolled-back', 'Firmware rolled back successfully');

      return true;
    } catch (error) {
      const errorMessage = `Rollback failed: ${(error as Error).message}`;
      console.error(errorMessage);
      this.updateStatus('failed', undefined, errorMessage);
      return false;
    }
  }

  /**
   * Get current update status
   */
  public getStatus(): UpdateStatus {
    return this.currentStatus;
  }

  /**
   * Get update history
   */
  public getUpdateHistory(): UpdateEvent[] {
    return [...this.updateHistory];
  }

  // ===== Private Helper Methods =====

  /**
   * Download firmware with progress reporting
   */
  private async downloadWithProgress(url: string, totalSize: number): Promise<Buffer> {
    const chunks: Buffer[] = [];
    let downloadedBytes = 0;
    const startTime = Date.now();

    // Simulate downloading in chunks
    const chunkSize = 1024 * 1024; // 1 MB chunks
    const numChunks = Math.ceil(totalSize / chunkSize);

    for (let i = 0; i < numChunks; i++) {
      // Simulate network delay
      await this.sleep(200 + Math.random() * 300);

      const currentChunkSize = Math.min(chunkSize, totalSize - downloadedBytes);
      const chunk = Buffer.alloc(currentChunkSize);
      chunks.push(chunk);

      downloadedBytes += currentChunkSize;

      // Calculate progress
      const progress: DownloadProgress = {
        downloadedBytes,
        totalBytes: totalSize,
        percentage: (downloadedBytes / totalSize) * 100,
        speed: downloadedBytes / ((Date.now() - startTime) / 1000),
        estimatedTimeRemaining:
          ((totalSize - downloadedBytes) /
            (downloadedBytes / ((Date.now() - startTime) / 1000))) ||
          0,
      };

      console.log(
        `Download progress: ${progress.percentage.toFixed(1)}% ` +
          `(${(downloadedBytes / 1024 / 1024).toFixed(2)} MB / ${(totalSize / 1024 / 1024).toFixed(2)} MB) ` +
          `- ${(progress.speed / 1024 / 1024).toFixed(2)} MB/s`
      );

      this.emit('download-progress', progress);
    }

    return Buffer.concat(chunks);
  }

  /**
   * Calculate checksum
   */
  private calculateChecksum(data: Buffer, algorithm: 'md5' | 'sha256' | 'sha512'): string {
    const hash = crypto.createHash(algorithm);
    hash.update(data);
    return hash.digest('hex');
  }

  /**
   * Check firmware compatibility
   */
  private checkCompatibility(firmware: FirmwareMetadata): boolean {
    const deviceRevision = this.deviceInfo.hardwareRevision;
    const minRevision = firmware.compatibility.minHardwareRevision;
    const maxRevision = firmware.compatibility.maxHardwareRevision;

    // Simple version comparison (in real implementation, use semver)
    if (deviceRevision < minRevision) {
      return false;
    }

    if (maxRevision && deviceRevision > maxRevision) {
      return false;
    }

    return true;
  }

  /**
   * Update status and emit event
   */
  private updateStatus(
    status: UpdateStatus,
    message?: string,
    progress?: number,
    error?: string
  ): void {
    this.currentStatus = status;

    const event: UpdateEvent = {
      status,
      progress,
      message,
      error,
      timestamp: Date.now(),
    };

    this.updateHistory.push(event);
    this.emit('status-changed', event);
  }

  /**
   * Simulate HTTP GET request
   */
  private async httpGet(url: string, params?: Record<string, any>): Promise<any> {
    await this.sleep(500);

    // Simulate response
    return {
      available: true,
      currentVersion: this.deviceInfo.currentFirmwareVersion,
      latestVersion: '3.0.0',
      firmware: {
        version: '3.0.0',
        buildNumber: 3000,
        releaseDate: '2025-12-30',
        size: 5242880, // 5 MB
        url: `${this.updateServerUrl}/firmware/v3.0.0/firmware.bin`,
        checksum:
          'a3b2c1d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
        checksumAlgorithm: 'sha256' as const,
        releaseNotes:
          'Major update with new features: improved power management, enhanced security, bug fixes',
        mandatory: false,
        compatibility: {
          minHardwareRevision: '1.0',
          maxHardwareRevision: '3.0',
        },
        rollback: {
          enabled: true,
          previousVersion: this.deviceInfo.currentFirmwareVersion,
        },
      },
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ===== Example Usage =====

async function main() {
  // Device information
  const deviceInfo: DeviceInfo = {
    deviceId: 'iot-device-12345',
    currentFirmwareVersion: '2.5.1',
    hardwareRevision: '2.0',
    model: 'IoT-Gateway-Pro',
    manufacturer: 'Acme IoT',
  };

  // Create firmware update service
  const updateService = new FirmwareUpdateService(
    deviceInfo,
    'https://updates.iot.example.com'
  );

  // Listen to update events
  updateService.on('status-changed', (event: UpdateEvent) => {
    console.log(`\n[Event] Status: ${event.status}`);
    if (event.message) {
      console.log(`[Event] Message: ${event.message}`);
    }
    if (event.progress !== undefined) {
      console.log(`[Event] Progress: ${event.progress.toFixed(1)}%`);
    }
  });

  updateService.on('download-progress', (progress: DownloadProgress) => {
    // Progress updates are already logged in the download function
  });

  // Perform OTA update
  const success = await updateService.performOTAUpdate();

  if (success) {
    console.log('\n✓ OTA Update completed successfully!');
  } else {
    console.log('\n✗ OTA Update failed');
  }

  // Display update history
  console.log('\n=== Update History ===');
  const history = updateService.getUpdateHistory();
  history.forEach((event, index) => {
    console.log(
      `${index + 1}. ${new Date(event.timestamp).toISOString()} - ${event.status} ${event.message ? `- ${event.message}` : ''}`
    );
  });

  console.log(`\nCurrent Firmware Version: ${deviceInfo.currentFirmwareVersion}`);
}

// Run example if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
