/**
 * Device Provisioning Example
 * Demonstrates device registration, configuration, and firmware information
 */

// ===== Type Definitions =====

/**
 * Device registration information
 */
export interface DeviceRegistration {
  deviceId: string;
  deviceType: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  macAddress: string;
  firmwareVersion: string;
  hardwareRevision: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Device configuration
 */
export interface DeviceConfiguration {
  samplingInterval: number; // milliseconds
  reportingInterval: number; // milliseconds
  dataRetention: number; // days
  sensors: {
    enabled: string[];
    disabled: string[];
  };
  connectivity: {
    protocol: 'mqtt' | 'http' | 'coap';
    endpoint: string;
    port: number;
    secure: boolean;
  };
  power: {
    mode: 'normal' | 'low-power' | 'deep-sleep';
    sleepDuration?: number; // milliseconds
  };
  alerts: {
    enabled: boolean;
    thresholds: Record<string, number>;
  };
}

/**
 * Firmware information
 */
export interface FirmwareInfo {
  version: string;
  buildDate: string;
  buildNumber: number;
  sha256: string;
  size: number; // bytes
  releaseNotes: string;
  compatibility: {
    minHardwareRevision: string;
    maxHardwareRevision?: string;
  };
  features: string[];
  bugFixes: string[];
}

/**
 * Provisioning response
 */
export interface ProvisioningResponse {
  success: boolean;
  deviceId: string;
  credentials: {
    apiKey?: string;
    certificate?: string;
    privateKey?: string;
  };
  endpoints: {
    mqtt?: string;
    http?: string;
    websocket?: string;
  };
  configuration: DeviceConfiguration;
  message?: string;
  error?: string;
}

// ===== Device Provisioning Service =====

/**
 * Service for device provisioning operations
 */
export class DeviceProvisioningService {
  private apiEndpoint: string;
  private apiKey: string;

  constructor(apiEndpoint: string, apiKey: string) {
    this.apiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
  }

  /**
   * Register a new device with the platform
   */
  public async registerDevice(registration: DeviceRegistration): Promise<ProvisioningResponse> {
    console.log(`Registering device: ${registration.deviceId}`);
    console.log(`  Type: ${registration.deviceType}`);
    console.log(`  Model: ${registration.manufacturer} ${registration.model}`);
    console.log(`  Firmware: v${registration.firmwareVersion}`);

    // Simulate HTTP POST to provisioning endpoint
    const response = await this.httpPost('/api/v1/devices/provision', {
      ...registration,
      timestamp: Date.now(),
    });

    if (response.success) {
      console.log('Device registered successfully');
      console.log(`  Device ID: ${response.deviceId}`);
      console.log(`  API Key: ${response.credentials.apiKey?.substring(0, 10)}...`);

      // Store credentials securely (in real implementation, use secure storage)
      this.storeCredentials(response.credentials);
    } else {
      console.error(`Registration failed: ${response.error}`);
    }

    return response;
  }

  /**
   * Configure device settings
   */
  public async configureDevice(
    deviceId: string,
    configuration: Partial<DeviceConfiguration>
  ): Promise<boolean> {
    console.log(`Configuring device: ${deviceId}`);
    console.log('Configuration:', JSON.stringify(configuration, null, 2));

    // Simulate HTTP PUT to configuration endpoint
    const response = await this.httpPut(`/api/v1/devices/${deviceId}/config`, configuration);

    if (response.success) {
      console.log('Device configured successfully');

      // Apply configuration locally
      await this.applyConfiguration(configuration);
    } else {
      console.error(`Configuration failed: ${response.error}`);
    }

    return response.success;
  }

  /**
   * Get current firmware information
   */
  public async getFirmwareInfo(deviceId: string): Promise<FirmwareInfo> {
    console.log(`Fetching firmware info for device: ${deviceId}`);

    // Simulate HTTP GET to firmware info endpoint
    const response = await this.httpGet(`/api/v1/devices/${deviceId}/firmware`);

    const firmwareInfo: FirmwareInfo = response.firmware;

    console.log('Current Firmware:');
    console.log(`  Version: ${firmwareInfo.version}`);
    console.log(`  Build Date: ${firmwareInfo.buildDate}`);
    console.log(`  Build Number: ${firmwareInfo.buildNumber}`);
    console.log(`  Size: ${(firmwareInfo.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  SHA-256: ${firmwareInfo.sha256.substring(0, 16)}...`);
    console.log(`  Features: ${firmwareInfo.features.join(', ')}`);

    return firmwareInfo;
  }

  /**
   * Get device configuration
   */
  public async getDeviceConfiguration(deviceId: string): Promise<DeviceConfiguration> {
    console.log(`Fetching configuration for device: ${deviceId}`);

    // Simulate HTTP GET to configuration endpoint
    const response = await this.httpGet(`/api/v1/devices/${deviceId}/config`);

    return response.configuration;
  }

  /**
   * Deregister device
   */
  public async deregisterDevice(deviceId: string, reason?: string): Promise<boolean> {
    console.log(`Deregistering device: ${deviceId}`);
    if (reason) {
      console.log(`  Reason: ${reason}`);
    }

    // Simulate HTTP DELETE to deregistration endpoint
    const response = await this.httpDelete(`/api/v1/devices/${deviceId}`, {
      reason,
      timestamp: Date.now(),
    });

    if (response.success) {
      console.log('Device deregistered successfully');

      // Clear stored credentials
      this.clearCredentials();
    } else {
      console.error(`Deregistration failed: ${response.error}`);
    }

    return response.success;
  }

  /**
   * Update device metadata
   */
  public async updateMetadata(
    deviceId: string,
    metadata: Record<string, any>
  ): Promise<boolean> {
    console.log(`Updating metadata for device: ${deviceId}`);
    console.log('Metadata:', metadata);

    // Simulate HTTP PATCH to metadata endpoint
    const response = await this.httpPatch(`/api/v1/devices/${deviceId}/metadata`, metadata);

    if (response.success) {
      console.log('Metadata updated successfully');
    } else {
      console.error(`Metadata update failed: ${response.error}`);
    }

    return response.success;
  }

  /**
   * Verify device identity
   */
  public async verifyDevice(deviceId: string, challenge: string): Promise<boolean> {
    console.log(`Verifying device identity: ${deviceId}`);

    // In real implementation, sign challenge with private key
    const signature = this.signChallenge(challenge);

    // Simulate HTTP POST to verification endpoint
    const response = await this.httpPost(`/api/v1/devices/${deviceId}/verify`, {
      challenge,
      signature,
    });

    if (response.success) {
      console.log('Device verified successfully');
    } else {
      console.error(`Verification failed: ${response.error}`);
    }

    return response.success;
  }

  // ===== Private Helper Methods =====

  /**
   * Simulate HTTP GET request
   */
  private async httpGet(path: string): Promise<any> {
    await this.sleep(100);

    // Simulate response based on path
    if (path.includes('/firmware')) {
      return {
        success: true,
        firmware: {
          version: '2.4.1',
          buildDate: '2025-12-15',
          buildNumber: 2041,
          sha256: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
          size: 2457600, // ~2.4 MB
          releaseNotes: 'Bug fixes and performance improvements',
          compatibility: {
            minHardwareRevision: '1.0',
            maxHardwareRevision: '3.0',
          },
          features: ['OTA Updates', 'Edge Processing', 'Multi-Sensor Support'],
          bugFixes: ['Fixed memory leak in MQTT client', 'Improved battery life'],
        },
      };
    } else if (path.includes('/config')) {
      return {
        success: true,
        configuration: {
          samplingInterval: 1000,
          reportingInterval: 60000,
          dataRetention: 7,
          sensors: {
            enabled: ['temperature', 'humidity', 'pressure'],
            disabled: ['light', 'motion'],
          },
          connectivity: {
            protocol: 'mqtt',
            endpoint: 'mqtt.iot.example.com',
            port: 8883,
            secure: true,
          },
          power: {
            mode: 'normal',
          },
          alerts: {
            enabled: true,
            thresholds: {
              temperature: 30,
              humidity: 80,
            },
          },
        },
      };
    }

    return { success: true };
  }

  /**
   * Simulate HTTP POST request
   */
  private async httpPost(path: string, data: any): Promise<any> {
    await this.sleep(200);

    if (path.includes('/provision')) {
      return {
        success: true,
        deviceId: data.deviceId,
        credentials: {
          apiKey: 'sk_live_' + Math.random().toString(36).substring(2, 15),
          certificate: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
          privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
        },
        endpoints: {
          mqtt: 'mqtt.iot.example.com:8883',
          http: 'https://api.iot.example.com',
          websocket: 'wss://ws.iot.example.com',
        },
        configuration: {
          samplingInterval: 1000,
          reportingInterval: 60000,
          dataRetention: 7,
          sensors: {
            enabled: ['temperature', 'humidity'],
            disabled: [],
          },
          connectivity: {
            protocol: 'mqtt',
            endpoint: 'mqtt.iot.example.com',
            port: 8883,
            secure: true,
          },
          power: {
            mode: 'normal',
          },
          alerts: {
            enabled: true,
            thresholds: {},
          },
        },
      };
    } else if (path.includes('/verify')) {
      return {
        success: true,
        message: 'Device verified successfully',
      };
    }

    return { success: true };
  }

  /**
   * Simulate HTTP PUT request
   */
  private async httpPut(path: string, data: any): Promise<any> {
    await this.sleep(150);

    return {
      success: true,
      message: 'Configuration updated',
    };
  }

  /**
   * Simulate HTTP PATCH request
   */
  private async httpPatch(path: string, data: any): Promise<any> {
    await this.sleep(100);

    return {
      success: true,
      message: 'Metadata updated',
    };
  }

  /**
   * Simulate HTTP DELETE request
   */
  private async httpDelete(path: string, data: any): Promise<any> {
    await this.sleep(150);

    return {
      success: true,
      message: 'Device deregistered',
    };
  }

  /**
   * Store credentials securely
   */
  private storeCredentials(credentials: any): void {
    // In real implementation, use secure storage (e.g., TPM, secure element)
    console.log('Storing credentials securely...');
  }

  /**
   * Clear stored credentials
   */
  private clearCredentials(): void {
    // In real implementation, clear from secure storage
    console.log('Clearing stored credentials...');
  }

  /**
   * Sign challenge for device verification
   */
  private signChallenge(challenge: string): string {
    // In real implementation, use device's private key
    return 'signature_' + Buffer.from(challenge).toString('base64');
  }

  /**
   * Apply configuration to device
   */
  private async applyConfiguration(config: Partial<DeviceConfiguration>): Promise<void> {
    // In real implementation, apply settings to hardware/firmware
    console.log('Applying configuration to device...');
    await this.sleep(500);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ===== Example Usage =====

async function main() {
  // Initialize provisioning service
  const provisioningService = new DeviceProvisioningService(
    'https://api.iot.example.com',
    'provisioning-api-key-12345'
  );

  // Prepare device registration
  const registration: DeviceRegistration = {
    deviceId: 'env-sensor-12345',
    deviceType: 'environmental-sensor',
    manufacturer: 'Acme IoT',
    model: 'ENV-100',
    serialNumber: 'SN123456789',
    macAddress: '00:1B:44:11:3A:B7',
    firmwareVersion: '2.4.1',
    hardwareRevision: '1.2',
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Market St, San Francisco, CA',
    },
    metadata: {
      deploymentDate: '2025-12-31',
      owner: 'Building Management',
      zone: 'Zone-A',
    },
  };

  // Register device
  const provisioningResponse = await provisioningService.registerDevice(registration);

  if (provisioningResponse.success) {
    const deviceId = provisioningResponse.deviceId;

    // Get and display firmware info
    await provisioningService.getFirmwareInfo(deviceId);

    // Configure device settings
    const configuration: Partial<DeviceConfiguration> = {
      samplingInterval: 5000, // 5 seconds
      reportingInterval: 300000, // 5 minutes
      sensors: {
        enabled: ['temperature', 'humidity', 'pressure', 'air_quality'],
        disabled: ['light'],
      },
      power: {
        mode: 'low-power',
        sleepDuration: 30000, // 30 seconds
      },
      alerts: {
        enabled: true,
        thresholds: {
          temperature: 35,
          humidity: 85,
          air_quality: 150,
        },
      },
    };

    await provisioningService.configureDevice(deviceId, configuration);

    // Get current configuration
    const currentConfig = await provisioningService.getDeviceConfiguration(deviceId);
    console.log('\nCurrent Configuration:', JSON.stringify(currentConfig, null, 2));

    // Update device metadata
    await provisioningService.updateMetadata(deviceId, {
      lastMaintenance: '2025-12-30',
      calibrationDate: '2025-12-29',
      notes: 'Installed in HVAC room',
    });

    // Verify device identity
    const challenge = 'challenge-' + Date.now();
    await provisioningService.verifyDevice(deviceId, challenge);

    // Simulate device operation for 10 seconds
    console.log('\nDevice is now operational...');
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Deregister device (optional)
    // await provisioningService.deregisterDevice(deviceId, 'End of testing');
  }
}

// Run example if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
