import { SecurityScore } from '../types';
import { TrackerService } from './tracker-service';
import { PasswordService } from './password-service';
import { CookieService } from './cookie-service';

/**
 * 安全評分系統
 * 基於多個因素計算用戶的整體安全分數
 */
export class SecurityScoreService {
  private static readonly MAX_SCORE = 100;
  private static readonly WEIGHTS = {
    passwordSecurity: 0.35,    // 35%
    trackersBlocked: 0.25,     // 25%
    httpsUsage: 0.20,          // 20%
    cookieSecurity: 0.15,      // 15%
    privacySettings: 0.05      // 5%
  };

  /**
   * 計算整體安全分數
   */
  static async calculateSecurityScore(): Promise<SecurityScore> {
    const factors = {
      passwordSecurity: await this.calculatePasswordScore(),
      trackersBlocked: await this.calculateTrackerScore(),
      httpsUsage: await this.calculateHttpsScore(),
      cookieSecurity: await this.calculateCookieScore()
    };

    const score = Math.round(
      factors.passwordSecurity * this.WEIGHTS.passwordSecurity +
      factors.trackersBlocked * this.WEIGHTS.trackersBlocked +
      factors.httpsUsage * this.WEIGHTS.httpsUsage +
      factors.cookieSecurity * this.WEIGHTS.cookieSecurity
    );

    const recommendations = this.generateRecommendations(factors, score);

    return {
      score,
      maxScore: this.MAX_SCORE,
      factors,
      recommendations
    };
  }

  /**
   * 計算密碼安全分數
   */
  private static async calculatePasswordScore(): Promise<number> {
    try {
      const metadata = await PasswordService.getAllPasswordMetadata();
      const passwordCount = metadata.length;

      // 基礎分數
      let score = 0;

      // 有使用密碼管理器
      if (passwordCount > 0) {
        score += 30;
      }

      // 密碼數量獎勵（最多30分）
      score += Math.min(30, passwordCount * 3);

      // 檢查主密碼設置
      const hasMasterPassword = await PasswordService.hasMasterPassword();
      if (hasMasterPassword) {
        score += 20;
      }

      // 檢查密碼年齡（扣分項）
      const oldPasswords = metadata.filter(p => {
        const age = Date.now() - new Date(p.updatedAt).getTime();
        const days = age / (1000 * 60 * 60 * 24);
        return days > 180; // 超過6個月
      });

      score -= oldPasswords.length * 2;

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('計算密碼分數失敗:', error);
      return 0;
    }
  }

  /**
   * 計算追蹤器攔截分數
   */
  private static async calculateTrackerScore(): Promise<number> {
    try {
      const stats = await TrackerService.getStats();
      const isEnabled = await TrackerService.isEnabled();

      let score = 0;

      // 啟用追蹤器攔截
      if (isEnabled) {
        score += 40;
      }

      // 攔截數量獎勵
      if (stats.totalBlocked > 0) {
        score += 20;
      }
      if (stats.totalBlocked > 100) {
        score += 20;
      }
      if (stats.totalBlocked > 1000) {
        score += 20;
      }

      return Math.min(100, score);
    } catch (error) {
      console.error('計算追蹤器分數失敗:', error);
      return 0;
    }
  }

  /**
   * 計算 HTTPS 使用分數
   */
  private static async calculateHttpsScore(): Promise<number> {
    try {
      const settings = await chrome.storage.local.get('enableHttpsUpgrade');
      let score = 0;

      // 啟用 HTTPS 強制升級
      if (settings.enableHttpsUpgrade !== false) {
        score += 50;
      }

      // 檢查最近訪問的網站
      const history = await chrome.history.search({
        text: '',
        maxResults: 100,
        startTime: Date.now() - 7 * 24 * 60 * 60 * 1000 // 最近7天
      });

      const httpsCount = history.filter(item => item.url?.startsWith('https://')).length;
      const totalCount = history.length;

      if (totalCount > 0) {
        const httpsRatio = httpsCount / totalCount;
        score += Math.round(httpsRatio * 50);
      }

      return Math.min(100, score);
    } catch (error) {
      console.error('計算 HTTPS 分數失敗:', error);
      // 沒有歷史記錄權限時給予基礎分數
      return 50;
    }
  }

  /**
   * 計算 Cookie 安全分數
   */
  private static async calculateCookieScore(): Promise<number> {
    try {
      const analysis = await CookieService.analyzeCookies();
      let score = 100; // 從滿分開始扣分

      // Cookie 總數過多扣分
      if (analysis.total > 500) {
        score -= 20;
      } else if (analysis.total > 200) {
        score -= 10;
      }

      // 安全 Cookie 比例
      const secureRatio = analysis.total > 0 ? analysis.secure / analysis.total : 1;
      const httpOnlyRatio = analysis.total > 0 ? analysis.httpOnly / analysis.total : 1;

      if (secureRatio < 0.5) score -= 15;
      if (httpOnlyRatio < 0.3) score -= 15;

      // SameSite 設定
      const sameSiteRatio = analysis.total > 0
        ? (analysis.sameSite.strict + analysis.sameSite.lax) / analysis.total
        : 1;

      if (sameSiteRatio < 0.5) score -= 10;

      // 檢查是否啟用 Cookie 保護
      const settings = await chrome.storage.local.get('enableCookieProtection');
      if (settings.enableCookieProtection) {
        score += 10;
      }

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('計算 Cookie 分數失敗:', error);
      return 50;
    }
  }

  /**
   * 生成個性化建議
   */
  private static generateRecommendations(
    factors: Record<string, number>,
    overallScore: number
  ): string[] {
    const recommendations: string[] = [];

    // 整體建議
    if (overallScore >= 80) {
      recommendations.push('✅ 您的安全防護做得很好！繼續保持。');
    } else if (overallScore >= 60) {
      recommendations.push('⚠️ 您的安全防護還不錯，但仍有改進空間。');
    } else {
      recommendations.push('🚨 您的安全防護需要加強，請盡快採取行動。');
    }

    // 密碼安全建議
    if (factors.passwordSecurity < 50) {
      recommendations.push('💡 建議使用密碼管理器儲存並生成強密碼');
      recommendations.push('🔑 設定主密碼以保護您的密碼庫');
    } else if (factors.passwordSecurity < 80) {
      recommendations.push('🔄 定期更新重要帳號的密碼');
      recommendations.push('🎲 為每個網站使用不同的密碼');
    }

    // 追蹤器攔截建議
    if (factors.trackersBlocked < 40) {
      recommendations.push('🚫 啟用追蹤器攔截功能以保護隱私');
    } else if (factors.trackersBlocked < 70) {
      recommendations.push('📊 調整追蹤器攔截等級以獲得更好的保護');
    }

    // HTTPS 建議
    if (factors.httpsUsage < 50) {
      recommendations.push('🔒 啟用自動 HTTPS 升級功能');
      recommendations.push('⚠️ 避免訪問使用 HTTP 的不安全網站');
    }

    // Cookie 建議
    if (factors.cookieSecurity < 50) {
      recommendations.push('🍪 定期清理 Cookie 以保護隱私');
      recommendations.push('📝 配置 Cookie 白名單以保留重要網站登入狀態');
    }

    return recommendations;
  }

  /**
   * 取得安全等級
   */
  static getSecurityLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  /**
   * 取得安全等級描述
   */
  static getSecurityLevelDescription(level: string): string {
    const descriptions: Record<string, string> = {
      excellent: '優秀 - 您的隱私和安全防護非常完善',
      good: '良好 - 您的防護措施相當不錯',
      fair: '普通 - 建議加強部分防護措施',
      poor: '需改進 - 您的帳號和隱私面臨風險'
    };

    return descriptions[level] || '未知';
  }

  /**
   * 取得安全趨勢（與上次比較）
   */
  static async getSecurityTrend(): Promise<{
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    const current = await this.calculateSecurityScore();
    const history = await this.getScoreHistory();

    if (history.length < 2) {
      return {
        current: current.score,
        previous: current.score,
        change: 0,
        trend: 'stable'
      };
    }

    const previous = history[history.length - 2].score;
    const change = current.score - previous;

    return {
      current: current.score,
      previous,
      change,
      trend: change > 2 ? 'up' : change < -2 ? 'down' : 'stable'
    };
  }

  /**
   * 儲存分數歷史
   */
  static async saveScoreHistory(): Promise<void> {
    const score = await this.calculateSecurityScore();
    const history = await this.getScoreHistory();

    history.push({
      score: score.score,
      timestamp: new Date().toISOString(),
      factors: score.factors
    });

    // 只保留最近30天的記錄
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const filtered = history.filter(item =>
      new Date(item.timestamp).getTime() > thirtyDaysAgo
    );

    await chrome.storage.local.set({ securityScoreHistory: filtered });
  }

  /**
   * 取得分數歷史
   */
  static async getScoreHistory(): Promise<Array<{
    score: number;
    timestamp: string;
    factors: Record<string, number>;
  }>> {
    const result = await chrome.storage.local.get('securityScoreHistory');
    return result.securityScoreHistory || [];
  }

  /**
   * 匯出安全報告
   */
  static async exportSecurityReport(): Promise<string> {
    const score = await this.calculateSecurityScore();
    const trend = await this.getSecurityTrend();
    const level = this.getSecurityLevel(score.score);

    const report = {
      generatedAt: new Date().toISOString(),
      overallScore: score.score,
      maxScore: score.maxScore,
      level,
      levelDescription: this.getSecurityLevelDescription(level),
      factors: score.factors,
      recommendations: score.recommendations,
      trend
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * 取得安全徽章
   */
  static async getSecurityBadges(): Promise<string[]> {
    const score = await this.calculateSecurityScore();
    const badges: string[] = [];

    if (score.factors.passwordSecurity >= 80) {
      badges.push('🔐 密碼大師');
    }
    if (score.factors.trackersBlocked >= 80) {
      badges.push('🛡️ 隱私守衛');
    }
    if (score.factors.httpsUsage >= 90) {
      badges.push('🔒 安全瀏覽');
    }
    if (score.factors.cookieSecurity >= 80) {
      badges.push('🍪 Cookie 專家');
    }
    if (score.score >= 90) {
      badges.push('⭐ 安全專家');
    }

    return badges;
  }
}
