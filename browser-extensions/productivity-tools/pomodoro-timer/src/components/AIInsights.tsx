import React, { useState, useEffect } from 'react';
import { aiInsightsService, ProductivityInsight, AIRecommendation } from '../services/aiInsights';
import { useTimerStore } from '../store/timerStore';

export const AIInsights: React.FC = () => {
  const [insights, setInsights] = useState<ProductivityInsight[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [breakActivities, setBreakActivities] = useState<string[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const { sessionType, completedPomodoros } = useTimerStore();

  useEffect(() => {
    loadInsights();
  }, [completedPomodoros]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      // Load session history from storage
      const result = await chrome.storage.local.get(['sessionHistory', 'pomodoroStats']);
      const history = result.sessionHistory || [];
      const stats = result.pomodoroStats || {
        totalPomodoros: completedPomodoros,
        totalFocusTime: completedPomodoros * 25,
        dailyPomodoros: {},
        weeklyPomodoros: 0,
        monthlyPomodoros: 0
      };

      // Generate insights
      const productivityInsights = aiInsightsService.analyzeProductivityPatterns(history);
      setInsights(productivityInsights);

      // Generate recommendations
      const aiRecommendations = await aiInsightsService.generateRecommendations(history, stats);
      setRecommendations(aiRecommendations);

      // Get break activity suggestions
      const currentHour = new Date().getHours();
      const timeOfDay =
        currentHour < 12 ? 'morning' :
        currentHour < 18 ? 'afternoon' :
        currentHour < 22 ? 'evening' : 'night';

      const breakType = sessionType === 'longBreak' ? 'long' : 'short';
      const activities = aiInsightsService.suggestBreakActivities(breakType, timeOfDay);
      setBreakActivities(activities);
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    const result = await chrome.storage.local.get(['sessionHistory', 'pomodoroStats']);
    const history = result.sessionHistory || [];
    const stats = result.pomodoroStats || {
      totalPomodoros: completedPomodoros,
      totalFocusTime: completedPomodoros * 25,
      dailyPomodoros: {},
      weeklyPomodoros: 0,
      monthlyPomodoros: 0
    };

    const generatedReport = await aiInsightsService.generateProductivityReport(history, stats);
    setReport(generatedReport);
    setShowReport(true);
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300';
      case 'tip':
        return 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">載入 AI 洞察...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <span>🤖</span>
          <span>AI 生產力洞察</span>
        </h2>
        <button
          onClick={generateReport}
          className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          生成報告
        </button>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            📊 分析結果
          </h3>
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-xl">{insight.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{insight.title}</div>
                  <div className="text-xs mt-1 opacity-90">{insight.message}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            💡 個人化建議
          </h3>
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-800 dark:text-white">
                      {rec.title}
                    </span>
                    <span className={`text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                      {rec.priority === 'high' ? '⚠️ 重要' : rec.priority === 'medium' ? '📌 建議' : '💡 提示'}
                    </span>
                  </div>
                  <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                    {rec.description}
                  </div>
                  {rec.action && (
                    <div className="mt-2">
                      <button className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
                        {rec.action}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Break Activities */}
      {(sessionType === 'shortBreak' || sessionType === 'longBreak') && breakActivities.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            ☕ 休息時可以做的事
          </h3>
          <div className="space-y-2">
            {breakActivities.map((activity, index) => (
              <div
                key={index}
                className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-sm text-blue-800 dark:text-blue-300"
              >
                {activity}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                生產力報告
              </h3>
              <button
                onClick={() => setShowReport(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              {report}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(report);
                  alert('報告已複製到剪貼簿!');
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                複製報告
              </button>
              <button
                onClick={() => setShowReport(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
