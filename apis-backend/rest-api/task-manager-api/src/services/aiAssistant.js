/**
 * AI 輔助服務
 * 提供智能任務建議和分析
 */

class AIAssistant {
  constructor() {
    this.enabled = process.env.ENABLE_AI_FEATURES === 'true';
  }

  /**
   * 建議任務優先級
   * @param {Object} task - 任務對象
   * @returns {string} 建議的優先級
   */
  suggestPriority(task) {
    const { title, description, dueDate, category } = task;

    // 基於規則的優先級建議
    const titleLower = (title || '').toLowerCase();
    const descLower = (description || '').toLowerCase();

    // 緊急關鍵詞
    const urgentKeywords = ['緊急', 'urgent', '立即', 'asap', '馬上', 'immediately', '重要'];
    const hasUrgent = urgentKeywords.some(keyword =>
      titleLower.includes(keyword) || descLower.includes(keyword)
    );

    if (hasUrgent) {
      return 'high';
    }

    // 檢查截止日期
    if (dueDate) {
      const daysUntilDue = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));

      if (daysUntilDue < 0) {
        return 'high'; // 已過期
      } else if (daysUntilDue <= 3) {
        return 'high'; // 3天內
      } else if (daysUntilDue <= 7) {
        return 'medium'; // 一週內
      }
    }

    // 根據分類建議
    const highPriorityCategories = ['工作', 'work', '客戶', 'client'];
    if (category && highPriorityCategories.includes(category.toLowerCase())) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * 建議任務分類
   * @param {Object} task - 任務對象
   * @returns {string} 建議的分類
   */
  suggestCategory(task) {
    const { title, description } = task;
    const text = `${title} ${description}`.toLowerCase();

    const categories = {
      '工作': ['會議', 'meeting', '報告', 'report', '專案', 'project', '客戶', 'client'],
      '學習': ['學習', 'learn', '課程', 'course', '教程', 'tutorial', '閱讀', 'read'],
      '健康': ['運動', 'exercise', '健身', 'workout', '醫生', 'doctor', '健康', 'health'],
      '購物': ['購買', 'buy', '購物', 'shop', '訂購', 'order'],
      '家務': ['清潔', 'clean', '洗衣', 'laundry', '修理', 'fix', '整理', 'organize'],
      '個人': ['生日', 'birthday', '家人', 'family', '朋友', 'friend'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }

    return '其他';
  }

  /**
   * 分析任務並提供建議
   * @param {Object} task - 任務對象
   * @returns {Object} AI 建議
   */
  analyzeTask(task) {
    const suggestions = {
      priority: {
        suggested: this.suggestPriority(task),
        current: task.priority || 'medium',
        reason: this.getPriorityReason(task)
      },
      category: {
        suggested: this.suggestCategory(task),
        current: task.category || '未分類',
      },
      tips: this.getTaskTips(task),
      estimatedTime: this.estimateTime(task),
      bestTimeToWork: this.suggestBestTime(task)
    };

    return suggestions;
  }

  /**
   * 獲取優先級建議的原因
   */
  getPriorityReason(task) {
    const priority = this.suggestPriority(task);

    if (priority === 'high') {
      if (task.dueDate) {
        const daysUntilDue = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue < 0) {
          return '任務已過期，建議立即處理';
        } else if (daysUntilDue <= 3) {
          return `距離截止日期僅剩 ${daysUntilDue} 天`;
        }
      }
      return '任務標題包含緊急關鍵詞';
    } else if (priority === 'medium') {
      return '任務需要在一週內完成';
    } else {
      return '任務優先級較低，可以靈活安排';
    }
  }

  /**
   * 獲取任務小提示
   */
  getTaskTips(task) {
    const tips = [];

    // 檢查截止日期
    if (!task.dueDate) {
      tips.push('💡 建議設置截止日期，有助於更好地管理時間');
    } else {
      const daysUntilDue = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 1 && daysUntilDue >= 0) {
        tips.push('⏰ 任務即將到期，請優先處理');
      }
    }

    // 檢查描述
    if (!task.description || task.description.length < 10) {
      tips.push('📝 添加更詳細的描述可以幫助你更好地完成任務');
    }

    // 檢查分類
    if (!task.category) {
      tips.push('🏷️  為任務添加分類，方便日後查找和管理');
    }

    // 任務複雜度建議
    if (task.description && task.description.length > 200) {
      tips.push('🔨 任務較為複雜，考慮將其分解為多個小任務');
    }

    return tips.length > 0 ? tips : ['✅ 任務信息完整，保持這個習慣！'];
  }

  /**
   * 估算任務所需時間
   */
  estimateTime(task) {
    const { title, description } = task;
    const text = `${title} ${description}`.toLowerCase();

    // 基於關鍵詞的時間估算
    if (text.includes('快速') || text.includes('quick')) {
      return '15-30 分鐘';
    } else if (text.includes('簡單') || text.includes('simple')) {
      return '30 分鐘 - 1 小時';
    } else if (text.includes('複雜') || text.includes('complex') || text.includes('專案') || text.includes('project')) {
      return '4+ 小時';
    } else if (description && description.length > 200) {
      return '2-4 小時';
    }

    return '1-2 小時';
  }

  /**
   * 建議最佳工作時間
   */
  suggestBestTime(task) {
    const { category, priority } = task;

    if (priority === 'high') {
      return '建議在一天中精力最充沛的時候（通常是上午）處理';
    }

    const timeMap = {
      '工作': '上午 9:00-12:00（專注時段）',
      '學習': '上午或下午（避免晚上）',
      '健康': '早晨或傍晚',
      '購物': '午休時間或下班後',
      '家務': '週末或晚上',
      '個人': '靈活安排'
    };

    return timeMap[category] || '根據個人習慣靈活安排';
  }

  /**
   * 獲取任務統計分析
   * @param {Array} tasks - 任務列表
   * @returns {Object} 統計數據
   */
  getTaskStats(tasks) {
    const stats = {
      total: tasks.length,
      byStatus: {
        pending: 0,
        in_progress: 0,
        completed: 0
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0
      },
      byCategory: {},
      productivity: {
        completionRate: 0,
        averageCompletionTime: 0,
        overdueTasks: 0
      },
      insights: []
    };

    if (tasks.length === 0) {
      stats.insights.push('🎯 開始添加任務，讓我們一起提升效率！');
      return stats;
    }

    // 統計狀態和優先級
    tasks.forEach(task => {
      stats.byStatus[task.status]++;
      stats.byPriority[task.priority || 'medium']++;

      const category = task.category || '未分類';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

      // 檢查過期任務
      if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed') {
        stats.productivity.overdueTasks++;
      }
    });

    // 計算完成率
    stats.productivity.completionRate = Math.round(
      (stats.byStatus.completed / tasks.length) * 100
    );

    // 生成洞察
    this.generateInsights(stats);

    return stats;
  }

  /**
   * 生成統計洞察
   */
  generateInsights(stats) {
    const { byStatus, byPriority, productivity, total } = stats;

    // 完成率洞察
    if (productivity.completionRate > 80) {
      stats.insights.push('🎉 完成率超過 80%，做得很好！');
    } else if (productivity.completionRate < 30) {
      stats.insights.push('💪 完成率較低，加油！試著每天完成1-2個任務');
    }

    // 過期任務洞察
    if (productivity.overdueTasks > 0) {
      stats.insights.push(`⏰ 有 ${productivity.overdueTasks} 個任務已過期，建議優先處理`);
    }

    // 進行中任務洞察
    if (byStatus.in_progress > 5) {
      stats.insights.push('🔄 同時進行的任務較多，建議專注完成1-2個再開始新任務');
    }

    // 高優先級任務洞察
    if (byPriority.high > 0) {
      stats.insights.push(`🔥 有 ${byPriority.high} 個高優先級任務需要關注`);
    }

    // 待辦任務洞察
    if (byStatus.pending > 10) {
      stats.insights.push('📋 待辦任務較多，建議每天選擇 2-3 個重點任務執行');
    }

    // 如果沒有特別的洞察
    if (stats.insights.length === 0) {
      stats.insights.push('✅ 任務管理良好，繼續保持！');
    }
  }

  /**
   * 獲取每日任務建議
   * @param {Array} tasks - 任務列表
   * @returns {Object} 每日建議
   */
  getDailyRecommendations(tasks) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recommendations = {
      mustDo: [], // 必須完成
      shouldDo: [], // 應該完成
      canDo: [], // 可以完成
      totalEstimatedTime: 0
    };

    // 過濾未完成的任務
    const pendingTasks = tasks.filter(t => t.status !== 'completed');

    // 分類任務
    pendingTasks.forEach(task => {
      const item = {
        ...task,
        reason: ''
      };

      // 過期或今天到期的任務
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilDue <= 0) {
          item.reason = '已過期或今天到期';
          recommendations.mustDo.push(item);
          return;
        } else if (daysUntilDue <= 1) {
          item.reason = '明天到期';
          recommendations.shouldDo.push(item);
          return;
        }
      }

      // 高優先級任務
      if (task.priority === 'high') {
        item.reason = '高優先級';
        recommendations.shouldDo.push(item);
      } else if (task.priority === 'medium') {
        item.reason = '中等優先級';
        recommendations.canDo.push(item);
      } else {
        item.reason = '低優先級';
        recommendations.canDo.push(item);
      }
    });

    // 限制數量
    recommendations.mustDo = recommendations.mustDo.slice(0, 3);
    recommendations.shouldDo = recommendations.shouldDo.slice(0, 3);
    recommendations.canDo = recommendations.canDo.slice(0, 5);

    return recommendations;
  }
}

module.exports = new AIAssistant();
