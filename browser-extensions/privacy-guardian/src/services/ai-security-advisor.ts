import { PasswordEntry } from '../types';

/**
 * AI 輔助安全建議服務
 * 使用機器學習和模式識別提供個性化的安全建議
 */
export class AISecurityAdvisor {
  /**
   * 分析密碼模式並提供安全建議
   */
  static async analyzePasswordPatterns(passwords: PasswordEntry[]): Promise<SecurityAdvice> {
    const analysis = {
      totalPasswords: passwords.length,
      reuseDetected: this.detectPasswordReuse(passwords),
      weakPasswords: this.identifyWeakPatterns(passwords),
      domainClusters: this.clusterByDomain(passwords),
      recommendations: [] as string[]
    };

    // 生成建議
    if (analysis.reuseDetected.length > 0) {
      analysis.recommendations.push(
        `偵測到 ${analysis.reuseDetected.length} 個重複使用的密碼。強烈建議為每個網站使用唯一密碼。`
      );
    }

    if (analysis.weakPasswords.length > 0) {
      analysis.recommendations.push(
        `發現 ${analysis.weakPasswords.length} 個弱密碼。建議使用至少 12 個字元，包含大小寫字母、數字和符號。`
      );
    }

    if (passwords.length < 5) {
      analysis.recommendations.push(
        '建議將更多重要帳號的密碼儲存在密碼管理器中，以提高安全性。'
      );
    }

    const avgAge = this.calculateAveragePasswordAge(passwords);
    if (avgAge > 180) {
      analysis.recommendations.push(
        '部分密碼已超過 6 個月未更新，建議定期更換重要帳號密碼。'
      );
    }

    return {
      score: this.calculateSecurityScore(analysis),
      analysis,
      recommendations: analysis.recommendations,
      riskLevel: this.assessRiskLevel(analysis)
    };
  }

  /**
   * 偵測釣魚網站
   */
  static async detectPhishingSite(url: string, pageContent: string): Promise<PhishingAnalysis> {
    try {
      const urlObj = new URL(url);
      const suspiciousIndicators: string[] = [];
      let riskScore = 0;

      // 檢查 URL 異常
      if (this.hasSuspiciousDomain(urlObj.hostname)) {
        suspiciousIndicators.push('域名包含可疑字元或模仿知名品牌');
        riskScore += 30;
      }

      if (urlObj.protocol === 'http:') {
        suspiciousIndicators.push('使用不安全的 HTTP 連線');
        riskScore += 20;
      }

      // 檢查異常的 TLD
      if (this.hasUnusualTLD(urlObj.hostname)) {
        suspiciousIndicators.push('使用不常見的頂級域名');
        riskScore += 15;
      }

      // 分析頁面內容
      const contentRisks = this.analyzePageContent(pageContent);
      suspiciousIndicators.push(...contentRisks.indicators);
      riskScore += contentRisks.score;

      return {
        isPhishing: riskScore >= 50,
        riskScore,
        indicators: suspiciousIndicators,
        recommendation: this.getPhishingRecommendation(riskScore)
      };
    } catch (error) {
      console.error('分析釣魚網站時發生錯誤:', error);
      return {
        isPhishing: false,
        riskScore: 0,
        indicators: [],
        recommendation: '無法分析此網站'
      };
    }
  }

  /**
   * 分析瀏覽器指紋風險
   */
  static analyzeFingerprintRisk(): FingerprintRiskAnalysis {
    const fingerprint = this.collectBrowserFingerprint();
    const uniqueness = this.calculateFingerprintUniqueness(fingerprint);

    return {
      uniquenessScore: uniqueness,
      exposedAttributes: this.getExposedAttributes(fingerprint),
      recommendations: this.getFingerprintRecommendations(uniqueness),
      riskLevel: uniqueness > 0.8 ? 'high' : uniqueness > 0.5 ? 'medium' : 'low'
    };
  }

  /**
   * 智能檢測異常登入行為
   */
  static async detectAnomalousLogin(
    domain: string,
    metadata: LoginMetadata
  ): Promise<AnomalyDetection> {
    // 獲取該域名的歷史登入模式
    const history = await this.getLoginHistory(domain);

    const anomalies: string[] = [];
    let riskScore = 0;

    // 檢查登入時間異常
    if (this.isUnusualTime(metadata.timestamp, history)) {
      anomalies.push('非常規登入時間');
      riskScore += 20;
    }

    // 檢查地理位置異常（如果可用）
    if (metadata.location && this.isUnusualLocation(metadata.location, history)) {
      anomalies.push('異常的地理位置');
      riskScore += 40;
    }

    // 檢查瀏覽器指紋變化
    if (metadata.fingerprint && this.hasFingerprintChanged(metadata.fingerprint, history)) {
      anomalies.push('瀏覽器指紋發生變化');
      riskScore += 30;
    }

    return {
      isAnomalous: riskScore >= 50,
      riskScore,
      anomalies,
      recommendation: riskScore >= 50
        ? '建議啟用雙因素驗證並檢查帳號安全性'
        : '登入行為正常'
    };
  }

  /**
   * 生成個性化安全報告
   */
  static async generateSecurityReport(): Promise<SecurityReport> {
    const trackerStats = await chrome.storage.local.get('trackerStats');
    const passwordCount = (await chrome.storage.local.get('passwords')).passwords?.length || 0;
    const cookieCount = (await chrome.cookies.getAll({})).length;

    const report = {
      generatedAt: new Date().toISOString(),
      overallScore: 0,
      metrics: {
        trackersBlocked: trackerStats.trackerStats?.totalBlocked || 0,
        passwordsManaged: passwordCount,
        cookiesTracked: cookieCount,
        privacyLevel: 'medium' as 'low' | 'medium' | 'high'
      },
      insights: [] as string[],
      actionItems: [] as string[]
    };

    // 計算總分
    let score = 50; // 基礎分

    if (report.metrics.trackersBlocked > 100) score += 15;
    if (report.metrics.passwordsManaged > 5) score += 15;
    if (passwordCount > 0) score += 10;

    report.overallScore = Math.min(100, score);

    // 生成洞察
    if (report.metrics.trackersBlocked > 1000) {
      report.insights.push('您已成功攔截大量追蹤器，隱私保護效果良好！');
    }

    if (passwordCount < 3) {
      report.insights.push('建議將更多密碼儲存在密碼管理器中以提高安全性。');
      report.actionItems.push('新增更多密碼到密碼管理器');
    }

    if (cookieCount > 500) {
      report.insights.push('Cookie 數量較多，建議定期清理。');
      report.actionItems.push('執行 Cookie 清理');
    }

    return report;
  }

  // ========== 私有輔助方法 ==========

  private static detectPasswordReuse(passwords: PasswordEntry[]): string[] {
    // 簡化實作：檢測相同的密碼（實際應該用雜湊）
    const passwordMap = new Map<string, string[]>();
    const reused: string[] = [];

    passwords.forEach(entry => {
      const domains = passwordMap.get(entry.password) || [];
      domains.push(entry.domain);
      passwordMap.set(entry.password, domains);
    });

    passwordMap.forEach((domains, password) => {
      if (domains.length > 1) {
        reused.push(...domains);
      }
    });

    return [...new Set(reused)];
  }

  private static identifyWeakPatterns(passwords: PasswordEntry[]): string[] {
    const weak: string[] = [];
    const commonPatterns = /^(123456|password|qwerty|abc123|111111|12345678)/i;

    passwords.forEach(entry => {
      if (
        entry.password.length < 8 ||
        commonPatterns.test(entry.password) ||
        !/[A-Z]/.test(entry.password) ||
        !/[0-9]/.test(entry.password)
      ) {
        weak.push(entry.domain);
      }
    });

    return weak;
  }

  private static clusterByDomain(passwords: PasswordEntry[]): Map<string, number> {
    const clusters = new Map<string, number>();

    passwords.forEach(entry => {
      const rootDomain = this.extractRootDomain(entry.domain);
      clusters.set(rootDomain, (clusters.get(rootDomain) || 0) + 1);
    });

    return clusters;
  }

  private static extractRootDomain(domain: string): string {
    const parts = domain.split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return domain;
  }

  private static calculateAveragePasswordAge(passwords: PasswordEntry[]): number {
    if (passwords.length === 0) return 0;

    const now = new Date().getTime();
    const totalAge = passwords.reduce((sum, entry) => {
      const created = new Date(entry.createdAt).getTime();
      return sum + (now - created) / (1000 * 60 * 60 * 24); // 轉換為天數
    }, 0);

    return totalAge / passwords.length;
  }

  private static calculateSecurityScore(analysis: {
    totalPasswords: number;
    reuseDetected: string[];
    weakPasswords: string[];
  }): number {
    let score = 100;

    // 扣分項目
    score -= analysis.reuseDetected.length * 10;
    score -= analysis.weakPasswords.length * 5;

    if (analysis.totalPasswords < 3) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private static assessRiskLevel(analysis: {
    totalPasswords: number;
    reuseDetected: string[];
    weakPasswords: string[];
  }): 'low' | 'medium' | 'high' {
    const score = this.calculateSecurityScore(analysis);
    if (score >= 80) return 'low';
    if (score >= 50) return 'medium';
    return 'high';
  }

  private static hasSuspiciousDomain(hostname: string): boolean {
    const suspiciousPatterns = [
      /paypal.*verify/i,
      /.*-login\.com/i,
      /secure.*account/i,
      /.*-secure\./i,
      /verify.*account/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(hostname));
  }

  private static hasUnusualTLD(hostname: string): boolean {
    const unusualTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top'];
    return unusualTLDs.some(tld => hostname.endsWith(tld));
  }

  private static analyzePageContent(content: string): { indicators: string[]; score: number } {
    const indicators: string[] = [];
    let score = 0;

    // 檢查緊急詞彙
    if (/urgent|verify|suspended|locked|expire/i.test(content)) {
      indicators.push('包含製造緊迫感的詞彙');
      score += 20;
    }

    // 檢查過多的表單輸入
    const inputMatches = content.match(/<input/gi);
    if (inputMatches && inputMatches.length > 10) {
      indicators.push('包含異常多的輸入欄位');
      score += 15;
    }

    return { indicators, score };
  }

  private static getPhishingRecommendation(riskScore: number): string {
    if (riskScore >= 70) return '⚠️ 高度可疑！強烈建議不要輸入任何個人資訊';
    if (riskScore >= 50) return '⚠️ 此網站可能不安全，請謹慎操作';
    if (riskScore >= 30) return '⚡ 發現一些可疑跡象，建議提高警覺';
    return '✓ 目前未發現明顯風險';
  }

  private static collectBrowserFingerprint(): BrowserFingerprint {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      plugins: Array.from(navigator.plugins).map(p => p.name),
      canvas: this.getCanvasFingerprint()
    };
  }

  private static getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Privacy Guardian 🔒', 2, 2);

      return canvas.toDataURL();
    } catch {
      return '';
    }
  }

  private static calculateFingerprintUniqueness(fingerprint: BrowserFingerprint): number {
    // 簡化計算：基於各種屬性的組合
    let uniqueness = 0.3; // 基礎值

    if (fingerprint.plugins.length > 5) uniqueness += 0.2;
    if (fingerprint.canvas) uniqueness += 0.3;
    if (fingerprint.timezone) uniqueness += 0.2;

    return Math.min(1, uniqueness);
  }

  private static getExposedAttributes(fingerprint: BrowserFingerprint): string[] {
    const exposed: string[] = [];

    if (fingerprint.userAgent) exposed.push('User-Agent');
    if (fingerprint.language) exposed.push('語言設定');
    if (fingerprint.screenResolution) exposed.push('螢幕解析度');
    if (fingerprint.timezone) exposed.push('時區');
    if (fingerprint.plugins.length > 0) exposed.push(`瀏覽器插件 (${fingerprint.plugins.length})`);
    if (fingerprint.canvas) exposed.push('Canvas 指紋');

    return exposed;
  }

  private static getFingerprintRecommendations(uniqueness: number): string[] {
    const recommendations: string[] = [];

    if (uniqueness > 0.7) {
      recommendations.push('您的瀏覽器指紋相當獨特，容易被追蹤');
      recommendations.push('建議啟用指紋防護功能');
      recommendations.push('考慮使用隱私瀏覽模式或 Tor 瀏覽器');
    } else if (uniqueness > 0.4) {
      recommendations.push('您的瀏覽器指紋具有一定獨特性');
      recommendations.push('建議定期清理 Cookie 和瀏覽資料');
    } else {
      recommendations.push('您的瀏覽器指紋相對常見，追蹤風險較低');
    }

    return recommendations;
  }

  private static async getLoginHistory(domain: string): Promise<LoginHistory[]> {
    const result = await chrome.storage.local.get('loginHistory');
    const history = result.loginHistory || {};
    return history[domain] || [];
  }

  private static isUnusualTime(timestamp: number, history: LoginHistory[]): boolean {
    if (history.length < 5) return false;

    const hour = new Date(timestamp).getHours();
    const commonHours = history.map(h => new Date(h.timestamp).getHours());
    const avgHour = commonHours.reduce((a, b) => a + b, 0) / commonHours.length;

    return Math.abs(hour - avgHour) > 6;
  }

  private static isUnusualLocation(location: string, history: LoginHistory[]): boolean {
    if (history.length < 3) return false;

    const commonLocations = history.map(h => h.location).filter(Boolean);
    return !commonLocations.includes(location);
  }

  private static hasFingerprintChanged(fingerprint: string, history: LoginHistory[]): boolean {
    if (history.length === 0) return false;

    const lastFingerprint = history[history.length - 1].fingerprint;
    return lastFingerprint !== fingerprint;
  }
}

// ========== 類型定義 ==========

interface SecurityAdvice {
  score: number;
  analysis: {
    totalPasswords: number;
    reuseDetected: string[];
    weakPasswords: string[];
    domainClusters: Map<string, number>;
    recommendations: string[];
  };
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

interface PhishingAnalysis {
  isPhishing: boolean;
  riskScore: number;
  indicators: string[];
  recommendation: string;
}

interface FingerprintRiskAnalysis {
  uniquenessScore: number;
  exposedAttributes: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

interface LoginMetadata {
  timestamp: number;
  location?: string;
  fingerprint?: string;
}

interface AnomalyDetection {
  isAnomalous: boolean;
  riskScore: number;
  anomalies: string[];
  recommendation: string;
}

interface SecurityReport {
  generatedAt: string;
  overallScore: number;
  metrics: {
    trackersBlocked: number;
    passwordsManaged: number;
    cookiesTracked: number;
    privacyLevel: 'low' | 'medium' | 'high';
  };
  insights: string[];
  actionItems: string[];
}

interface BrowserFingerprint {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  plugins: string[];
  canvas: string;
}

interface LoginHistory {
  timestamp: number;
  location?: string;
  fingerprint?: string;
}
