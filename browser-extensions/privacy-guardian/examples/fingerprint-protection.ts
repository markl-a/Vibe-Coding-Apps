/**
 * Fingerprint Protection Example
 * Demonstrates browser fingerprinting protection techniques
 *
 * Key Features:
 * - Canvas fingerprinting protection
 * - WebGL fingerprinting protection
 * - Audio fingerprinting protection
 * - Font enumeration blocking
 * - User-Agent randomization
 * - Screen resolution spoofing
 * - Timezone masking
 * - Battery API blocking
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Fingerprint protection configuration
 */
interface FingerprintProtectionConfig {
  enabled: boolean;
  protections: {
    canvas: boolean;
    webgl: boolean;
    audio: boolean;
    fonts: boolean;
    userAgent: boolean;
    screen: boolean;
    timezone: boolean;
    battery: boolean;
    webrtc: boolean;
    hardware: boolean;
  };
  spoofingLevel: 'minimal' | 'moderate' | 'maximum';
  randomizationSeed?: string;  // For consistent spoofing across page loads
}

/**
 * Fingerprint detection event
 */
interface FingerprintDetection {
  type: 'canvas' | 'webgl' | 'audio' | 'fonts' | 'other';
  url: string;
  timestamp: string;
  blocked: boolean;
  details: string;
}

/**
 * Protection statistics
 */
interface ProtectionStats {
  totalAttemptsBlocked: number;
  attemptsByType: Map<string, number>;
  attemptsByDomain: Map<string, number>;
  lastDetection: string;
}

// ============================================================================
// Fingerprint Protection Service
// ============================================================================

export class FingerprintProtector {
  private static config: FingerprintProtectionConfig = {
    enabled: true,
    protections: {
      canvas: true,
      webgl: true,
      audio: true,
      fonts: true,
      userAgent: false,
      screen: false,
      timezone: false,
      battery: true,
      webrtc: true,
      hardware: true
    },
    spoofingLevel: 'moderate'
  };

  private static stats: ProtectionStats = {
    totalAttemptsBlocked: 0,
    attemptsByType: new Map(),
    attemptsByDomain: new Map(),
    lastDetection: ''
  };

  /**
   * Initialize fingerprint protection
   */
  static async initialize(): Promise<void> {
    console.log('Initializing fingerprint protection...');

    // Load configuration
    await this.loadConfig();

    // Inject protection scripts into all pages
    this.injectProtectionScripts();

    // Set up message listener
    this.setupMessageListener();

    console.log('Fingerprint protection initialized');
  }

  /**
   * Inject protection scripts into web pages
   */
  private static injectProtectionScripts(): void {
    // Register content script to inject protection code
    chrome.scripting.registerContentScripts([
      {
        id: 'fingerprint-protection',
        matches: ['<all_urls>'],
        js: ['content-scripts/fingerprint-blocker.js'],
        runAt: 'document_start',  // Run before page scripts
        world: 'MAIN'  // Inject into main world to override native APIs
      }
    ]).catch(error => {
      console.error('Error registering content script:', error);
    });
  }

  /**
   * Setup message listener for detection events
   */
  private static setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'FINGERPRINT_DETECTED') {
        this.recordDetection(message.detection);
        sendResponse({ success: true });
      }
      return true;
    });
  }

  /**
   * Record a fingerprint detection
   */
  private static recordDetection(detection: FingerprintDetection): void {
    this.stats.totalAttemptsBlocked++;
    this.stats.lastDetection = detection.timestamp;

    // Update type statistics
    const typeCount = this.stats.attemptsByType.get(detection.type) || 0;
    this.stats.attemptsByType.set(detection.type, typeCount + 1);

    // Update domain statistics
    try {
      const domain = new URL(detection.url).hostname;
      const domainCount = this.stats.attemptsByDomain.get(domain) || 0;
      this.stats.attemptsByDomain.set(domain, domainCount + 1);
    } catch (error) {
      console.error('Error parsing URL:', error);
    }

    console.log(`Fingerprint attempt blocked: ${detection.type} on ${detection.url}`);
    this.saveStats();
  }

  /**
   * Get protection statistics
   */
  static getStats(): ProtectionStats {
    return { ...this.stats };
  }

  /**
   * Update configuration
   */
  static async updateConfig(
    config: Partial<FingerprintProtectionConfig>
  ): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.saveConfig();

    // Re-inject scripts with new configuration
    this.injectProtectionScripts();
  }

  // ============================================================================
  // Storage Methods
  // ============================================================================

  private static async loadConfig(): Promise<void> {
    const result = await chrome.storage.local.get('fingerprintConfig');
    if (result.fingerprintConfig) {
      this.config = result.fingerprintConfig;
    }
  }

  private static async saveConfig(): Promise<void> {
    await chrome.storage.local.set({ fingerprintConfig: this.config });
  }

  private static async saveStats(): Promise<void> {
    const statsData = {
      totalAttemptsBlocked: this.stats.totalAttemptsBlocked,
      attemptsByType: Array.from(this.stats.attemptsByType.entries()),
      attemptsByDomain: Array.from(this.stats.attemptsByDomain.entries()),
      lastDetection: this.stats.lastDetection
    };
    await chrome.storage.local.set({ fingerprintStats: statsData });
  }
}

// ============================================================================
// Content Script: Fingerprint Blocker
// This code should be in a separate file: content-scripts/fingerprint-blocker.ts
// ============================================================================

/**
 * This script is injected into the page's main world to override native APIs
 * and protect against fingerprinting techniques
 */
export const FINGERPRINT_BLOCKER_CONTENT_SCRIPT = `
(function() {
  'use strict';

  console.log('Fingerprint protection active');

  // ============================================================================
  // Canvas Fingerprinting Protection
  // ============================================================================

  /**
   * Canvas fingerprinting works by drawing text/images and reading pixel data
   * to create a unique identifier. We add noise to the canvas output.
   */
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  const originalToBlob = HTMLCanvasElement.prototype.toBlob;
  const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

  // Add noise to canvas data
  function addCanvasNoise(canvas, imageData) {
    const data = imageData.data;
    const noise = 0.1; // 10% noise

    for (let i = 0; i < data.length; i += 4) {
      // Add small random variations to RGB values
      const rand = Math.random() * noise * 2 - noise;
      data[i] = Math.min(255, Math.max(0, data[i] + rand * 255));     // R
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + rand * 255)); // G
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + rand * 255)); // B
      // Don't modify alpha channel
    }

    // Report detection
    reportFingerprint('canvas', 'Canvas data extraction detected');
  }

  HTMLCanvasElement.prototype.toDataURL = function(...args) {
    const context = this.getContext('2d');
    if (context) {
      const imageData = context.getImageData(0, 0, this.width, this.height);
      addCanvasNoise(this, imageData);
      context.putImageData(imageData, 0, 0);
    }
    return originalToDataURL.apply(this, args);
  };

  HTMLCanvasElement.prototype.toBlob = function(...args) {
    const context = this.getContext('2d');
    if (context) {
      const imageData = context.getImageData(0, 0, this.width, this.height);
      addCanvasNoise(this, imageData);
      context.putImageData(imageData, 0, 0);
    }
    return originalToBlob.apply(this, args);
  };

  CanvasRenderingContext2D.prototype.getImageData = function(...args) {
    const imageData = originalGetImageData.apply(this, args);
    addCanvasNoise(this.canvas, imageData);
    return imageData;
  };

  // ============================================================================
  // WebGL Fingerprinting Protection
  // ============================================================================

  /**
   * WebGL fingerprinting reads GPU information and rendering characteristics
   */
  const originalGetParameter = WebGLRenderingContext.prototype.getParameter;

  WebGLRenderingContext.prototype.getParameter = function(parameter) {
    // Block access to vendor and renderer information
    if (parameter === this.VENDOR || parameter === 37445) {
      reportFingerprint('webgl', 'WebGL vendor query blocked');
      return 'Generic Vendor';
    }
    if (parameter === this.RENDERER || parameter === 37446) {
      reportFingerprint('webgl', 'WebGL renderer query blocked');
      return 'Generic Renderer';
    }

    return originalGetParameter.apply(this, arguments);
  };

  // Also protect WebGL2
  if (window.WebGL2RenderingContext) {
    WebGL2RenderingContext.prototype.getParameter = WebGLRenderingContext.prototype.getParameter;
  }

  // ============================================================================
  // Audio Fingerprinting Protection
  // ============================================================================

  /**
   * Audio fingerprinting analyzes audio processing characteristics
   */
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (AudioContext) {
    const originalCreateDynamicsCompressor = AudioContext.prototype.createDynamicsCompressor;

    AudioContext.prototype.createDynamicsCompressor = function() {
      reportFingerprint('audio', 'Audio fingerprinting attempt detected');
      const compressor = originalCreateDynamicsCompressor.apply(this, arguments);

      // Add noise to compressor parameters
      const noise = 0.0001;
      if (compressor.threshold) {
        compressor.threshold.value += (Math.random() - 0.5) * noise;
      }

      return compressor;
    };
  }

  // ============================================================================
  // Font Enumeration Protection
  // ============================================================================

  /**
   * Font enumeration can identify installed fonts to create fingerprints
   * We can't fully block this, but we can detect attempts
   */
  const originalOffsetWidth = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetWidth'
  );
  const originalOffsetHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetHeight'
  );

  let fontCheckCount = 0;
  const FONT_CHECK_THRESHOLD = 50;

  function wrapSizeGetter(original, property) {
    return {
      get: function() {
        const element = this;

        // Detect rapid font checks (common in fingerprinting)
        if (element.style && element.style.fontFamily) {
          fontCheckCount++;
          if (fontCheckCount > FONT_CHECK_THRESHOLD) {
            reportFingerprint('fonts', 'Font enumeration detected');
            fontCheckCount = 0; // Reset counter
          }
        }

        return original.get.call(this);
      }
    };
  }

  Object.defineProperty(
    HTMLElement.prototype,
    'offsetWidth',
    wrapSizeGetter(originalOffsetWidth, 'offsetWidth')
  );

  Object.defineProperty(
    HTMLElement.prototype,
    'offsetHeight',
    wrapSizeGetter(originalOffsetHeight, 'offsetHeight')
  );

  // ============================================================================
  // Screen Resolution Spoofing
  // ============================================================================

  /**
   * Spoof screen dimensions to prevent fingerprinting
   */
  const commonResolutions = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1536, height: 864 }
  ];

  const spoofedResolution = commonResolutions[
    Math.floor(Math.random() * commonResolutions.length)
  ];

  Object.defineProperty(window.screen, 'width', {
    get: () => spoofedResolution.width
  });

  Object.defineProperty(window.screen, 'height', {
    get: () => spoofedResolution.height
  });

  Object.defineProperty(window.screen, 'availWidth', {
    get: () => spoofedResolution.width
  });

  Object.defineProperty(window.screen, 'availHeight', {
    get: () => spoofedResolution.height - 40  // Account for taskbar
  });

  // ============================================================================
  // Battery API Blocking
  // ============================================================================

  /**
   * Battery status can be used for fingerprinting
   */
  if (navigator.getBattery) {
    navigator.getBattery = async function() {
      reportFingerprint('other', 'Battery API access blocked');
      throw new Error('Battery API disabled for privacy');
    };
  }

  // ============================================================================
  // Hardware Concurrency Spoofing
  // ============================================================================

  /**
   * CPU core count can be used for fingerprinting
   */
  const commonCoreCounts = [4, 8, 16];
  const spoofedCores = commonCoreCounts[
    Math.floor(Math.random() * commonCoreCounts.length)
  ];

  Object.defineProperty(navigator, 'hardwareConcurrency', {
    get: () => spoofedCores
  });

  // ============================================================================
  // Device Memory Spoofing
  // ============================================================================

  /**
   * Available memory can be used for fingerprinting
   */
  if (navigator.deviceMemory) {
    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => 8  // Report 8GB as a common value
    });
  }

  // ============================================================================
  // Timezone Protection
  // ============================================================================

  /**
   * Timezone can reveal user location
   */
  const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;

  Date.prototype.getTimezoneOffset = function() {
    // Return UTC offset (0) to mask real timezone
    reportFingerprint('other', 'Timezone query detected');
    return 0;  // UTC
  };

  // ============================================================================
  // WebRTC IP Leak Protection
  // ============================================================================

  /**
   * WebRTC can leak local IP addresses
   */
  const originalRTCPeerConnection = window.RTCPeerConnection;

  window.RTCPeerConnection = function(...args) {
    reportFingerprint('webrtc', 'WebRTC connection attempt detected');

    const pc = new originalRTCPeerConnection(...args);

    // Intercept ICE candidate gathering to prevent IP leaks
    const originalAddIceCandidate = pc.addIceCandidate;
    pc.addIceCandidate = function(candidate) {
      if (candidate && candidate.candidate) {
        // Filter out local IP candidates
        if (candidate.candidate.includes('192.168.') ||
            candidate.candidate.includes('10.') ||
            candidate.candidate.includes('172.')) {
          console.log('Blocked local IP leak via WebRTC');
          return Promise.resolve();
        }
      }
      return originalAddIceCandidate.apply(this, arguments);
    };

    return pc;
  };

  // ============================================================================
  // Reporting Function
  // ============================================================================

  /**
   * Report fingerprinting attempts to the extension
   */
  function reportFingerprint(type, details) {
    try {
      chrome.runtime.sendMessage({
        type: 'FINGERPRINT_DETECTED',
        detection: {
          type: type,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          blocked: true,
          details: details
        }
      });
    } catch (error) {
      // chrome.runtime might not be available in all contexts
      console.log('Fingerprint detection:', type, details);
    }
  }

  console.log('Fingerprint protection injected successfully');
})();
`;

// ============================================================================
// Usage Example
// ============================================================================

/**
 * Initialize in background script
 */
export async function initializeFingerprintProtection(): Promise<void> {
  await FingerprintProtector.initialize();

  // Handle messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_PROTECTION_STATS') {
      const stats = FingerprintProtector.getStats();
      sendResponse({ success: true, stats });
    }

    if (message.type === 'UPDATE_PROTECTION_CONFIG') {
      FingerprintProtector.updateConfig(message.config)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
  });
}

// Auto-initialize
initializeFingerprintProtection();

// ============================================================================
// Manifest Requirements
// ============================================================================

/*
{
  "manifest_version": 3,
  "permissions": [
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content-scripts/fingerprint-blocker.js"],
      "run_at": "document_start",
      "all_frames": true
    }
  ]
}
*/
