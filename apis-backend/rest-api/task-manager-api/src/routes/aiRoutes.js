/**
 * AI 輔助路由
 * 提供任務智能分析和建議
 */

const express = require('express');
const router = express.Router();
const aiAssistant = require('../services/aiAssistant');
const Task = require('../models/Task');
const auth = require('../middleware/authMiddleware');

// @desc    分析任務並獲取 AI 建議
// @route   POST /api/ai/analyze-task
// @access  Private
router.post('/analyze-task', auth, async (req, res, next) => {
  try {
    const taskData = req.body;

    // 獲取 AI 分析
    const analysis = aiAssistant.analyzeTask(taskData);

    res.status(200).json({
      success: true,
      data: {
        analysis,
        powered_by: 'AI 助手'
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    獲取任務統計和洞察
// @route   GET /api/ai/stats
// @access  Private
router.get('/stats', auth, async (req, res, next) => {
  try {
    // 獲取用戶所有任務
    const tasks = await Task.find({ userId: req.user._id });

    // 獲取統計分析
    const stats = aiAssistant.getTaskStats(tasks);

    res.status(200).json({
      success: true,
      data: {
        stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    獲取每日任務建議
// @route   GET /api/ai/daily-recommendations
// @access  Private
router.get('/daily-recommendations', auth, async (req, res, next) => {
  try {
    // 獲取用戶所有未完成的任務
    const tasks = await Task.find({ userId: req.user._id });

    // 獲取每日建議
    const recommendations = aiAssistant.getDailyRecommendations(tasks);

    res.status(200).json({
      success: true,
      data: {
        recommendations,
        date: new Date().toISOString().split('T')[0],
        message: '根據您的任務情況，這是今天的建議'
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    批量分析任務
// @route   GET /api/ai/analyze-all
// @access  Private
router.get('/analyze-all', auth, async (req, res, next) => {
  try {
    // 獲取用戶所有未完成的任務
    const tasks = await Task.find({
      userId: req.user._id,
      status: { $ne: 'completed' }
    });

    // 分析每個任務
    const analyzedTasks = tasks.map(task => ({
      task: {
        id: task._id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        category: task.category,
        dueDate: task.dueDate
      },
      analysis: aiAssistant.analyzeTask(task)
    }));

    res.status(200).json({
      success: true,
      data: {
        total: analyzedTasks.length,
        tasks: analyzedTasks
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    建議任務優先級
// @route   POST /api/ai/suggest-priority
// @access  Private
router.post('/suggest-priority', auth, (req, res, next) => {
  try {
    const taskData = req.body;

    const suggestedPriority = aiAssistant.suggestPriority(taskData);
    const reason = aiAssistant.getPriorityReason(taskData);

    res.status(200).json({
      success: true,
      data: {
        suggested: suggestedPriority,
        current: taskData.priority || 'medium',
        reason,
        shouldUpdate: suggestedPriority !== (taskData.priority || 'medium')
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    建議任務分類
// @route   POST /api/ai/suggest-category
// @access  Private
router.post('/suggest-category', auth, (req, res, next) => {
  try {
    const taskData = req.body;

    const suggestedCategory = aiAssistant.suggestCategory(taskData);

    res.status(200).json({
      success: true,
      data: {
        suggested: suggestedCategory,
        current: taskData.category || '未分類'
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    獲取任務提示
// @route   POST /api/ai/tips
// @access  Private
router.post('/tips', auth, (req, res, next) => {
  try {
    const taskData = req.body;

    const tips = aiAssistant.getTaskTips(taskData);
    const estimatedTime = aiAssistant.estimateTime(taskData);
    const bestTime = aiAssistant.suggestBestTime(taskData);

    res.status(200).json({
      success: true,
      data: {
        tips,
        estimatedTime,
        bestTime
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
