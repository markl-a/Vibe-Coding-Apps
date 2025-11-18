/**
 * AI Insights Service for Pomodoro Timer
 * Provides intelligent productivity analysis and recommendations
 */

import { PomodoroStats } from '../types/timer';

export interface ProductivityInsight {
  type: 'success' | 'warning' | 'info' | 'tip';
  title: string;
  message: string;
  icon: string;
}

export interface SessionHistory {
  date: string;
  pomodoros: number;
  focusTime: number; // minutes
  completionRate: number; // 0-1
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number; // 0-6
}

export interface AIRecommendation {
  type: 'focus' | 'break' | 'schedule' | 'duration';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
}

class AIInsightsService {
  /**
   * Analyze productivity patterns and generate insights
   */
  analyzeProductivityPatterns(history: SessionHistory[]): ProductivityInsight[] {
    const insights: ProductivityInsight[] = [];

    if (history.length === 0) {
      insights.push({
        type: 'info',
        title: '開始您的生產力之旅',
        message: '完成更多番茄鐘以獲取個人化建議',
        icon: '🚀'
      });
      return insights;
    }

    // Check streak
    const streak = this.calculateStreak(history);
    if (streak >= 7) {
      insights.push({
        type: 'success',
        title: `連續 ${streak} 天完成任務!`,
        message: '保持這個出色的節奏!',
        icon: '🔥'
      });
    }

    // Check recent productivity drop
    const recentDrop = this.detectProductivityDrop(history);
    if (recentDrop) {
      insights.push({
        type: 'warning',
        title: '最近生產力下降',
        message: '考慮調整工作時間或增加休息頻率',
        icon: '⚠️'
      });
    }

    // Peak productivity time
    const peakTime = this.findPeakProductivityTime(history);
    if (peakTime) {
      insights.push({
        type: 'tip',
        title: `最佳專注時段: ${peakTime}`,
        message: '安排重要任務在這個時段',
        icon: '💡'
      });
    }

    // Completion rate
    const avgCompletionRate = this.calculateAverageCompletionRate(history);
    if (avgCompletionRate > 0.8) {
      insights.push({
        type: 'success',
        title: '優秀的完成率!',
        message: `平均完成率: ${(avgCompletionRate * 100).toFixed(0)}%`,
        icon: '⭐'
      });
    } else if (avgCompletionRate < 0.5) {
      insights.push({
        type: 'warning',
        title: '完成率需要提升',
        message: '考慮縮短單次專注時間或減少干擾',
        icon: '📊'
      });
    }

    // Weekly pattern
    const bestDay = this.findMostProductiveDay(history);
    if (bestDay) {
      insights.push({
        type: 'info',
        title: `最有生產力的日子: ${this.getDayName(bestDay)}`,
        message: '考慮在這天安排重要任務',
        icon: '📅'
      });
    }

    return insights;
  }

  /**
   * Generate personalized AI recommendations
   */
  async generateRecommendations(history: SessionHistory[], stats: PomodoroStats): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    // Analyze focus duration
    const avgSessionsPerDay = stats.totalPomodoros / 30; // assuming 30 day history
    if (avgSessionsPerDay < 4) {
      recommendations.push({
        type: 'focus',
        priority: 'high',
        title: '增加每日專注時間',
        description: '目標是每天完成至少 4-6 個番茄鐘',
        action: '設定每日目標'
      });
    }

    // Check break patterns
    if (this.needsMoreBreaks(history)) {
      recommendations.push({
        type: 'break',
        priority: 'high',
        title: '增加休息時間',
        description: '連續工作過長可能降低效率。建議增加休息頻率。',
        action: '啟用自動休息'
      });
    }

    // Suggest optimal schedule
    const optimalSchedule = this.suggestOptimalSchedule(history);
    if (optimalSchedule) {
      recommendations.push({
        type: 'schedule',
        priority: 'medium',
        title: '最佳工作時段建議',
        description: optimalSchedule.description,
        action: optimalSchedule.action
      });
    }

    // Suggest duration adjustments
    const durationSuggestion = this.suggestDurationAdjustment(history);
    if (durationSuggestion) {
      recommendations.push({
        type: 'duration',
        priority: 'medium',
        title: durationSuggestion.title,
        description: durationSuggestion.description,
        action: '調整設定'
      });
    }

    return recommendations;
  }

  /**
   * Suggest break activities based on session length and time of day
   */
  suggestBreakActivities(sessionType: 'short' | 'long', timeOfDay: string): string[] {
    const shortBreakActivities = [
      '🚶 短暫散步或伸展',
      '💧 喝水補充水分',
      '👁️ 眺望遠方放鬆眼睛',
      '🧘 簡單的呼吸練習',
      '🎵 聽一首放鬆的音樂',
      '☕ 準備一杯咖啡或茶'
    ];

    const longBreakActivities = [
      '🏃 戶外散步 15 分鐘',
      '🍎 準備健康的點心',
      '📚 閱讀幾頁書',
      '🧘‍♀️ 冥想或瑜伽',
      '💬 與朋友短暫聊天',
      '🎮 玩簡短的遊戲放鬆',
      '🌿 整理工作空間',
      '📝 回顧和規劃下一個任務'
    ];

    if (sessionType === 'short') {
      return this.shuffleArray(shortBreakActivities).slice(0, 3);
    } else {
      return this.shuffleArray(longBreakActivities).slice(0, 3);
    }
  }

  /**
   * Generate AI-powered productivity report
   */
  async generateProductivityReport(history: SessionHistory[], stats: PomodoroStats): Promise<string> {
    const totalHours = stats.totalFocusTime / 60;
    const avgPerDay = stats.totalPomodoros / 30;
    const completionRate = this.calculateAverageCompletionRate(history);
    const peakTime = this.findPeakProductivityTime(history);
    const streak = this.calculateStreak(history);

    const report = `
📊 **生產力報告**

📈 **總體表現**
• 總專注時間: ${totalHours.toFixed(1)} 小時
• 完成番茄鐘: ${stats.totalPomodoros} 個
• 平均每天: ${avgPerDay.toFixed(1)} 個
• 完成率: ${(completionRate * 100).toFixed(0)}%

🔥 **連續記錄**
• 當前連續: ${streak} 天

⏰ **最佳時段**
• 最高效時段: ${peakTime || '數據不足'}

💡 **建議**
${this.generateQuickTips(history, stats)}

繼續保持！🎯
    `.trim();

    return report;
  }

  /**
   * Predict optimal focus duration based on history
   */
  predictOptimalFocusDuration(history: SessionHistory[]): number {
    if (history.length < 5) {
      return 25; // default
    }

    // Analyze completion rates at different durations
    const completionRates = history.map(h => h.completionRate);
    const avgRate = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;

    if (avgRate > 0.9) {
      return 30; // Suggest longer sessions if completion rate is high
    } else if (avgRate < 0.6) {
      return 20; // Suggest shorter sessions if struggling to complete
    }

    return 25; // Keep default
  }

  // Helper methods

  private calculateStreak(history: SessionHistory[]): number {
    if (history.length === 0) return 0;

    const sortedHistory = [...history].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedHistory.length; i++) {
      const sessionDate = new Date(sortedHistory[i].date);
      sessionDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (sessionDate.getTime() === expectedDate.getTime()) {
        if (sortedHistory[i].pomodoros > 0) {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return streak;
  }

  private detectProductivityDrop(history: SessionHistory[]): boolean {
    if (history.length < 7) return false;

    const recent = history.slice(-3);
    const previous = history.slice(-7, -3);

    const recentAvg = recent.reduce((sum, h) => sum + h.pomodoros, 0) / recent.length;
    const previousAvg = previous.reduce((sum, h) => sum + h.pomodoros, 0) / previous.length;

    return recentAvg < previousAvg * 0.7; // 30% drop
  }

  private findPeakProductivityTime(history: SessionHistory[]): string | null {
    if (history.length < 7) return null;

    const timeStats: { [key: string]: number } = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0
    };

    history.forEach(h => {
      timeStats[h.timeOfDay] += h.pomodoros;
    });

    const maxTime = Object.entries(timeStats).reduce((a, b) => a[1] > b[1] ? a : b);

    const timeNames: { [key: string]: string } = {
      morning: '早上 (6:00-12:00)',
      afternoon: '下午 (12:00-18:00)',
      evening: '傍晚 (18:00-22:00)',
      night: '夜間 (22:00-6:00)'
    };

    return timeNames[maxTime[0]];
  }

  private calculateAverageCompletionRate(history: SessionHistory[]): number {
    if (history.length === 0) return 0;

    const sum = history.reduce((acc, h) => acc + h.completionRate, 0);
    return sum / history.length;
  }

  private findMostProductiveDay(history: SessionHistory[]): number | null {
    if (history.length < 7) return null;

    const dayStats: number[] = [0, 0, 0, 0, 0, 0, 0];

    history.forEach(h => {
      dayStats[h.dayOfWeek] += h.pomodoros;
    });

    return dayStats.indexOf(Math.max(...dayStats));
  }

  private getDayName(day: number): string {
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return days[day];
  }

  private needsMoreBreaks(history: SessionHistory[]): boolean {
    // Simple heuristic: if average consecutive pomodoros > 3, suggest more breaks
    const recentSessions = history.slice(-7);
    const avgPomodoros = recentSessions.reduce((sum, h) => sum + h.pomodoros, 0) / recentSessions.length;
    return avgPomodoros > 6; // More than 6 pomodoros per day without enough breaks
  }

  private suggestOptimalSchedule(history: SessionHistory[]): { description: string; action: string } | null {
    const peakTime = this.findPeakProductivityTime(history);
    if (!peakTime) return null;

    return {
      description: `根據您的記錄,${peakTime}是最佳工作時段`,
      action: '在此時段安排重要任務'
    };
  }

  private suggestDurationAdjustment(history: SessionHistory[]): { title: string; description: string } | null {
    const avgCompletionRate = this.calculateAverageCompletionRate(history);

    if (avgCompletionRate < 0.5) {
      return {
        title: '考慮縮短工作時長',
        description: '您的完成率較低,嘗試 20 分鐘的番茄鐘可能更適合'
      };
    } else if (avgCompletionRate > 0.9) {
      return {
        title: '可以嘗試更長的專注時間',
        description: '您的完成率很高,可以嘗試 30-35 分鐘的番茄鐘'
      };
    }

    return null;
  }

  private generateQuickTips(history: SessionHistory[], stats: PomodoroStats): string {
    const tips: string[] = [];

    const avgCompletionRate = this.calculateAverageCompletionRate(history);
    if (avgCompletionRate < 0.7) {
      tips.push('• 減少工作環境中的干擾源');
    }

    const avgPerDay = stats.totalPomodoros / 30;
    if (avgPerDay < 4) {
      tips.push('• 設定每日至少完成 4 個番茄鐘的目標');
    }

    if (tips.length === 0) {
      tips.push('• 保持當前的良好節奏');
      tips.push('• 記得在休息時間充分放鬆');
    }

    return tips.join('\n');
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Analyze work patterns and suggest improvements
   */
  analyzeWorkPatterns(history: SessionHistory[]): {
    patterns: string[];
    suggestions: string[];
  } {
    const patterns: string[] = [];
    const suggestions: string[] = [];

    // Check consistency
    const isConsistent = this.checkConsistency(history);
    if (isConsistent) {
      patterns.push('✅ 工作時間保持一致');
    } else {
      patterns.push('⚠️ 工作時間不太規律');
      suggestions.push('建立固定的工作時間表');
    }

    // Check weekend activity
    const weekendActivity = this.checkWeekendActivity(history);
    if (weekendActivity > 0.5) {
      patterns.push('📅 週末也保持活躍');
      suggestions.push('記得在週末給自己足夠的休息時間');
    }

    return { patterns, suggestions };
  }

  private checkConsistency(history: SessionHistory[]): boolean {
    if (history.length < 7) return false;

    const variance = this.calculateVariance(history.map(h => h.pomodoros));
    return variance < 2; // Low variance means consistent
  }

  private checkWeekendActivity(history: SessionHistory[]): number {
    const weekendSessions = history.filter(h => h.dayOfWeek === 0 || h.dayOfWeek === 6);
    const totalWeekendPomodoros = weekendSessions.reduce((sum, h) => sum + h.pomodoros, 0);
    const totalPomodoros = history.reduce((sum, h) => sum + h.pomodoros, 0);

    return totalPomodoros > 0 ? totalWeekendPomodoros / totalPomodoros : 0;
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squareDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squareDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  }
}

export const aiInsightsService = new AIInsightsService();
