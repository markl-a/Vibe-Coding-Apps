/**
 * Task Manager API AI 功能測試腳本
 * 演示 AI 輔助功能：智能建議、任務統計、每日推薦
 *
 * 使用方式: node examples/test-ai-features.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// 測試用戶
const testUser = {
  name: 'AI Test User',
  email: `aitest${Date.now()}@example.com`,
  password: 'Test123456'
};

class TaskAITester {
  async register() {
    console.log('\n==== 1. 註冊測試用戶 ====');
    try {
      const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
      authToken = response.data.token;
      console.log('✅ 註冊成功');
      console.log(`Token: ${authToken.substring(0, 20)}...`);
      return true;
    } catch (error) {
      console.log('❌ 註冊失敗:', error.response?.data?.error || error.message);
      return false;
    }
  }

  async createSampleTasks() {
    console.log('\n==== 2. 創建示例任務 ====');

    const sampleTasks = [
      {
        title: '緊急：完成季度報告',
        description: '需要在本週內完成 Q4 季度財務報告，包含所有部門數據分析',
        priority: 'medium',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: '學習 JavaScript 進階課程',
        description: '完成 Udemy 的 JavaScript 進階教程，包含閉包、原型鏈等內容',
        category: '學習',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: '健身房鍛煉',
        description: '每週三次有氧運動和力量訓練',
        category: '健康',
        priority: 'low'
      },
      {
        title: '購買辦公用品',
        description: '需要買筆記本、筆、文件夾等辦公用品',
        category: '購物',
        priority: 'low',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: '會議：客戶專案討論',
        description: '與客戶討論新專案的需求和時間表',
        category: '工作',
        priority: 'high',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const headers = { Authorization: `Bearer ${authToken}` };

    for (const task of sampleTasks) {
      try {
        await axios.post(`${BASE_URL}/tasks`, task, { headers });
        console.log(`✅ 創建任務: ${task.title}`);
      } catch (error) {
        console.log(`❌ 創建失敗: ${task.title}`);
      }
    }
  }

  async testTaskAnalysis() {
    console.log('\n==== 3. AI 任務分析 ====');

    const testTask = {
      title: '緊急修復生產環境bug',
      description: '用戶報告無法登入系統，需要立即修復這個bug',
      category: '工作',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
    };

    try {
      const headers = { Authorization: `Bearer ${authToken}` };
      const response = await axios.post(`${BASE_URL}/ai/analyze-task`, testTask, { headers });

      console.log('✅ 任務分析成功\n');
      const { analysis } = response.data.data;

      console.log('📊 優先級建議:');
      console.log(`  建議: ${analysis.priority.suggested}`);
      console.log(`  原因: ${analysis.priority.reason}\n`);

      console.log('🏷️  分類建議:');
      console.log(`  建議: ${analysis.category.suggested}\n`);

      console.log('💡 任務提示:');
      analysis.tips.forEach(tip => console.log(`  ${tip}`));

      console.log(`\n⏱️  預估時間: ${analysis.estimatedTime}`);
      console.log(`🕐 最佳時間: ${analysis.bestTimeToWork}`);

    } catch (error) {
      console.log('❌ 分析失敗:', error.response?.data?.error || error.message);
    }
  }

  async testTaskStats() {
    console.log('\n==== 4. 任務統計分析 ====');

    try {
      const headers = { Authorization: `Bearer ${authToken}` };
      const response = await axios.get(`${BASE_URL}/ai/stats`, { headers });

      const { stats } = response.data.data;

      console.log('✅ 統計分析成功\n');
      console.log(`📈 總任務數: ${stats.total}`);
      console.log('\n狀態分布:');
      console.log(`  待辦: ${stats.byStatus.pending}`);
      console.log(`  進行中: ${stats.byStatus.in_progress}`);
      console.log(`  已完成: ${stats.byStatus.completed}`);

      console.log('\n優先級分布:');
      console.log(`  高: ${stats.byPriority.high}`);
      console.log(`  中: ${stats.byPriority.medium}`);
      console.log(`  低: ${stats.byPriority.low}`);

      console.log('\n分類分布:');
      Object.entries(stats.byCategory).forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
      });

      console.log(`\n✨ 完成率: ${stats.productivity.completionRate}%`);
      console.log(`⏰ 過期任務: ${stats.productivity.overdueTasks}`);

      console.log('\n🤖 AI 洞察:');
      stats.insights.forEach(insight => console.log(`  ${insight}`));

    } catch (error) {
      console.log('❌ 統計失敗:', error.response?.data?.error || error.message);
    }
  }

  async testDailyRecommendations() {
    console.log('\n==== 5. 每日任務推薦 ====');

    try {
      const headers = { Authorization: `Bearer ${authToken}` };
      const response = await axios.get(`${BASE_URL}/ai/daily-recommendations`, { headers });

      const { recommendations } = response.data.data;

      console.log('✅ 獲取每日推薦成功\n');

      console.log('🔥 必須完成 (Must Do):');
      if (recommendations.mustDo.length === 0) {
        console.log('  無');
      } else {
        recommendations.mustDo.forEach((task, i) => {
          console.log(`  ${i + 1}. ${task.title} - ${task.reason}`);
        });
      }

      console.log('\n💪 應該完成 (Should Do):');
      if (recommendations.shouldDo.length === 0) {
        console.log('  無');
      } else {
        recommendations.shouldDo.forEach((task, i) => {
          console.log(`  ${i + 1}. ${task.title} - ${task.reason}`);
        });
      }

      console.log('\n✨ 可以完成 (Can Do):');
      if (recommendations.canDo.length === 0) {
        console.log('  無');
      } else {
        recommendations.canDo.slice(0, 3).forEach((task, i) => {
          console.log(`  ${i + 1}. ${task.title} - ${task.reason}`);
        });
      }

    } catch (error) {
      console.log('❌ 推薦失敗:', error.response?.data?.error || error.message);
    }
  }

  async testPrioritySuggestion() {
    console.log('\n==== 6. 優先級建議 ====');

    const testCases = [
      {
        title: '緊急：系統崩潰',
        description: '生產環境系統崩潰，需要立即處理',
        dueDate: new Date().toISOString()
      },
      {
        title: '閱讀技術文章',
        description: '閱讀關於 React 18 的新特性文章',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const headers = { Authorization: `Bearer ${authToken}` };

    for (const task of testCases) {
      try {
        const response = await axios.post(`${BASE_URL}/ai/suggest-priority`, task, { headers });
        const { suggested, reason } = response.data.data;

        console.log(`\n任務: ${task.title}`);
        console.log(`  建議優先級: ${suggested}`);
        console.log(`  原因: ${reason}`);
      } catch (error) {
        console.log(`❌ 建議失敗: ${task.title}`);
      }
    }
  }

  async runAllTests() {
    console.log('🤖 開始測試 Task Manager API AI 功能');
    console.log(`Base URL: ${BASE_URL}\n`);

    try {
      const registered = await this.register();
      if (!registered) {
        console.log('\n❌ 無法繼續測試，註冊失敗');
        return;
      }

      await this.createSampleTasks();
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒

      await this.testTaskAnalysis();
      await this.testTaskStats();
      await this.testDailyRecommendations();
      await this.testPrioritySuggestion();

      console.log('\n' + '='.repeat(70));
      console.log('✅ 所有 AI 功能測試完成！');
      console.log('\n💡 新功能亮點:');
      console.log('  🤖 AI 任務分析（優先級、分類、時間建議）');
      console.log('  📊 任務統計和洞察');
      console.log('  📅 每日任務推薦');
      console.log('  💡 智能提示和建議');
      console.log('  ✨ 基於規則引擎的智能分析');

    } catch (error) {
      console.log('\n❌ 測試過程出錯:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.log('\n請確保 API 服務器正在運行:');
        console.log('  npm run dev');
      }
    }
  }
}

// 運行測試
const tester = new TaskAITester();
tester.runAllTests();
