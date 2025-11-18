/**
 * 瀏覽器指紋識別防護
 * 透過修改或偽裝瀏覽器特徵來防止指紋追蹤
 */

export class FingerprintProtection {
  private static isEnabled = false;
  private static protectionLevel: 'low' | 'medium' | 'high' = 'medium';

  /**
   * 初始化指紋防護
   */
  static async init(): Promise<void> {
    const settings = await this.getSettings();
    this.isEnabled = settings.enabled;
    this.protectionLevel = settings.level;

    if (this.isEnabled) {
      this.applyProtections();
    }
  }

  /**
   * 啟用指紋防護
   */
  static enable(level: 'low' | 'medium' | 'high' = 'medium'): void {
    this.isEnabled = true;
    this.protectionLevel = level;
    this.applyProtections();
    this.saveSettings({ enabled: true, level });
  }

  /**
   * 停用指紋防護
   */
  static disable(): void {
    this.isEnabled = false;
    this.saveSettings({ enabled: false, level: this.protectionLevel });
  }

  /**
   * 套用所有防護措施
   */
  private static applyProtections(): void {
    // 防護 Canvas 指紋
    this.protectCanvas();

    // 防護 WebGL 指紋
    this.protectWebGL();

    // 防護 AudioContext 指紋
    this.protectAudioContext();

    // 防護字體指紋
    this.protectFonts();

    // 防護 Navigator 屬性
    this.protectNavigator();

    // 防護 Screen 屬性
    this.protectScreen();

    // 防護 WebRTC IP 洩漏
    this.protectWebRTC();

    // 防護電池狀態 API
    this.protectBattery();
  }

  /**
   * 防護 Canvas 指紋
   */
  private static protectCanvas(): void {
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

    // 在轉換為資料 URL 時添加隨機噪點
    HTMLCanvasElement.prototype.toDataURL = function(...args: any[]) {
      if (FingerprintProtection.protectionLevel !== 'low') {
        const context = this.getContext('2d');
        if (context) {
          FingerprintProtection.addCanvasNoise(context, this.width, this.height);
        }
      }
      return originalToDataURL.apply(this, args as any);
    };

    // 在取得圖像資料時添加噪點
    CanvasRenderingContext2D.prototype.getImageData = function(...args: any[]) {
      const imageData = originalGetImageData.apply(this, args as any);

      if (FingerprintProtection.protectionLevel === 'high') {
        FingerprintProtection.addImageDataNoise(imageData);
      }

      return imageData;
    };
  }

  /**
   * 添加 Canvas 噪點
   */
  private static addCanvasNoise(
    context: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const imageData = context.getImageData(0, 0, width, height);
    this.addImageDataNoise(imageData);
    context.putImageData(imageData, 0, 0);
  }

  /**
   * 添加圖像資料噪點
   */
  private static addImageDataNoise(imageData: ImageData): void {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // 隨機修改少量像素（約 0.1%）
      if (Math.random() < 0.001) {
        data[i] = (data[i] + Math.floor(Math.random() * 10) - 5) % 256;     // R
        data[i + 1] = (data[i + 1] + Math.floor(Math.random() * 10) - 5) % 256; // G
        data[i + 2] = (data[i + 2] + Math.floor(Math.random() * 10) - 5) % 256; // B
      }
    }
  }

  /**
   * 防護 WebGL 指紋
   */
  private static protectWebGL(): void {
    const getParameter = WebGLRenderingContext.prototype.getParameter;

    WebGLRenderingContext.prototype.getParameter = function(parameter: any) {
      // 偽裝 WebGL 渲染器和供應商資訊
      if (parameter === 37445) {  // UNMASKED_VENDOR_WEBGL
        return 'Intel Inc.';
      }
      if (parameter === 37446) {  // UNMASKED_RENDERER_WEBGL
        return 'Intel Iris OpenGL Engine';
      }

      return getParameter.apply(this, [parameter]);
    };

    // 對 WebGL2 進行相同處理
    if (typeof WebGL2RenderingContext !== 'undefined') {
      const getParameter2 = WebGL2RenderingContext.prototype.getParameter;

      WebGL2RenderingContext.prototype.getParameter = function(parameter: any) {
        if (parameter === 37445) return 'Intel Inc.';
        if (parameter === 37446) return 'Intel Iris OpenGL Engine';

        return getParameter2.apply(this, [parameter]);
      };
    }
  }

  /**
   * 防護 AudioContext 指紋
   */
  private static protectAudioContext(): void {
    if (this.protectionLevel === 'high') {
      const audioContext = (window as any).AudioContext || (window as any).webkitAudioContext;

      if (audioContext) {
        const originalCreateOscillator = audioContext.prototype.createOscillator;

        audioContext.prototype.createOscillator = function() {
          const oscillator = originalCreateOscillator.apply(this);

          // 添加輕微的頻率偏移
          const originalStart = oscillator.start;
          oscillator.start = function(...args: any[]) {
            if (oscillator.frequency) {
              const noise = (Math.random() - 0.5) * 0.0001;
              oscillator.frequency.value += noise;
            }
            return originalStart.apply(this, args);
          };

          return oscillator;
        };
      }
    }
  }

  /**
   * 防護字體指紋
   */
  private static protectFonts(): void {
    // 限制可用字體的列舉
    // 注意：這可能影響某些網站的正常功能
    if (this.protectionLevel === 'high') {
      const style = document.createElement('style');
      style.textContent = `
        @font-face {
          font-family: 'protected';
          src: local('Arial');
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * 防護 Navigator 屬性
   */
  private static protectNavigator(): void {
    const navigatorProps = {
      // 標準化 User-Agent
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',

      // 標準化語言
      language: this.protectionLevel === 'high' ? 'en-US' : navigator.language,
      languages: this.protectionLevel === 'high' ? ['en-US', 'en'] : navigator.languages,

      // 隱藏硬體並發數
      hardwareConcurrency: this.protectionLevel === 'high' ? 4 : navigator.hardwareConcurrency,

      // 標準化平台
      platform: this.protectionLevel === 'high' ? 'Win32' : navigator.platform,

      // 移除插件資訊
      plugins: this.protectionLevel === 'high' ? [] : navigator.plugins,

      // 裝置記憶體
      deviceMemory: this.protectionLevel === 'high' ? 8 : (navigator as any).deviceMemory,
    };

    // 使用 Object.defineProperty 覆蓋屬性
    for (const [key, value] of Object.entries(navigatorProps)) {
      try {
        Object.defineProperty(navigator, key, {
          get: () => value,
          configurable: true,
          enumerable: true
        });
      } catch (e) {
        // 某些屬性可能無法覆蓋
        console.warn(`無法覆蓋 navigator.${key}`);
      }
    }
  }

  /**
   * 防護 Screen 屬性
   */
  private static protectScreen(): void {
    if (this.protectionLevel === 'high') {
      const screenProps = {
        width: 1920,
        height: 1080,
        availWidth: 1920,
        availHeight: 1040,
        colorDepth: 24,
        pixelDepth: 24
      };

      for (const [key, value] of Object.entries(screenProps)) {
        try {
          Object.defineProperty(screen, key, {
            get: () => value,
            configurable: true,
            enumerable: true
          });
        } catch (e) {
          console.warn(`無法覆蓋 screen.${key}`);
        }
      }
    }
  }

  /**
   * 防護 WebRTC IP 洩漏
   */
  private static protectWebRTC(): void {
    if (this.protectionLevel !== 'low') {
      const originalRTCPeerConnection = (window as any).RTCPeerConnection;

      if (originalRTCPeerConnection) {
        (window as any).RTCPeerConnection = function(config?: RTCConfiguration, ...args: any[]) {
          // 強制使用代理，防止 IP 洩漏
          if (!config) config = {};
          if (!config.iceServers) config.iceServers = [];

          // 限制 ICE 候選類型
          if (config.iceTransportPolicy !== 'relay') {
            config.iceTransportPolicy = 'all';
          }

          return new originalRTCPeerConnection(config, ...args);
        };
      }
    }
  }

  /**
   * 防護電池狀態 API
   */
  private static protectBattery(): void {
    if (this.protectionLevel === 'high') {
      if ('getBattery' in navigator) {
        Object.defineProperty(navigator, 'getBattery', {
          get: () => undefined,
          configurable: true,
          enumerable: false
        });
      }
    }
  }

  /**
   * 取得當前設定
   */
  private static async getSettings(): Promise<{
    enabled: boolean;
    level: 'low' | 'medium' | 'high';
  }> {
    const result = await chrome.storage.local.get('fingerprintProtection');
    return result.fingerprintProtection || {
      enabled: false,
      level: 'medium'
    };
  }

  /**
   * 儲存設定
   */
  private static async saveSettings(settings: {
    enabled: boolean;
    level: 'low' | 'medium' | 'high';
  }): Promise<void> {
    await chrome.storage.local.set({ fingerprintProtection: settings });
  }

  /**
   * 取得防護狀態報告
   */
  static async getProtectionReport(): Promise<ProtectionReport> {
    return {
      enabled: this.isEnabled,
      level: this.protectionLevel,
      protections: {
        canvas: this.isEnabled,
        webgl: this.isEnabled,
        audio: this.isEnabled && this.protectionLevel === 'high',
        fonts: this.isEnabled && this.protectionLevel === 'high',
        navigator: this.isEnabled,
        screen: this.isEnabled && this.protectionLevel === 'high',
        webrtc: this.isEnabled && this.protectionLevel !== 'low',
        battery: this.isEnabled && this.protectionLevel === 'high'
      },
      effectiveness: this.calculateEffectiveness()
    };
  }

  /**
   * 計算防護有效性
   */
  private static calculateEffectiveness(): number {
    if (!this.isEnabled) return 0;

    switch (this.protectionLevel) {
      case 'low':
        return 30;
      case 'medium':
        return 65;
      case 'high':
        return 90;
      default:
        return 0;
    }
  }

  /**
   * 測試當前指紋唯一性
   */
  static async testFingerprint(): Promise<FingerprintTestResult> {
    const fingerprint: any = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      plugins: Array.from(navigator.plugins).map(p => p.name),
      canvas: await this.testCanvas(),
      webgl: this.testWebGL()
    };

    // 計算指紋的熵值（唯一性）
    const entropy = this.calculateEntropy(fingerprint);

    return {
      fingerprint,
      entropy,
      uniqueness: Math.min(100, (entropy / 20) * 100), // 假設最大熵值為 20
      protected: this.isEnabled,
      recommendation: this.getRecommendation(entropy)
    };
  }

  /**
   * 測試 Canvas 指紋
   */
  private static async testCanvas(): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Test', 2, 2);

    return canvas.toDataURL().substring(0, 50);
  }

  /**
   * 測試 WebGL 指紋
   */
  private static testWebGL(): string {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';

    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return '';

    return (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  }

  /**
   * 計算指紋熵值
   */
  private static calculateEntropy(fingerprint: any): number {
    let entropy = 0;

    // 基於各種屬性計算熵值
    if (fingerprint.userAgent) entropy += 2;
    if (fingerprint.language) entropy += 1;
    if (fingerprint.platform) entropy += 1;
    if (fingerprint.screenResolution) entropy += 2;
    if (fingerprint.timezone) entropy += 2;
    if (fingerprint.plugins && fingerprint.plugins.length > 0) entropy += 3;
    if (fingerprint.canvas) entropy += 5;
    if (fingerprint.webgl) entropy += 4;

    return entropy;
  }

  /**
   * 取得建議
   */
  private static getRecommendation(entropy: number): string {
    if (entropy > 15) {
      return '您的瀏覽器指紋非常獨特，強烈建議啟用高級防護';
    } else if (entropy > 10) {
      return '您的瀏覽器指紋較為獨特，建議啟用中級防護';
    } else if (entropy > 5) {
      return '您的瀏覽器指紋有一定獨特性，建議啟用基本防護';
    } else {
      return '您的瀏覽器指紋相對常見，追蹤風險較低';
    }
  }
}

// ========== 類型定義 ==========

interface ProtectionReport {
  enabled: boolean;
  level: 'low' | 'medium' | 'high';
  protections: {
    canvas: boolean;
    webgl: boolean;
    audio: boolean;
    fonts: boolean;
    navigator: boolean;
    screen: boolean;
    webrtc: boolean;
    battery: boolean;
  };
  effectiveness: number;
}

interface FingerprintTestResult {
  fingerprint: any;
  entropy: number;
  uniqueness: number;
  protected: boolean;
  recommendation: string;
}

// 自動初始化
if (typeof window !== 'undefined') {
  FingerprintProtection.init();
}
