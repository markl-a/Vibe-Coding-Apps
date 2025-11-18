# Analytics Dashboard - AI 增强功能

## 🤖 AI 功能概述

本项目已集成多项 AI 驱动的分析功能，提供智能数据洞察、趋势预测和异常检测。

## ✨ 新增 AI 功能

### 1. AI 智能洞察 (AIInsights)

**位置**: `src/components/AIInsights.tsx`

**功能**:
- 📊 **趋势分析**: 使用线性回归分析数据趋势，计算R²决定系数
- 🔍 **异常检测**: 自动识别异常数据点
- 📈 **预测生成**: 基于历史数据预测未来趋势
- 💡 **智能建议**: 根据数据模式提供可行的业务建议

**技术实现**:
```typescript
// 线性回归趋势分析
export const analyzeTrend = (data: number[]): TrendAnalysis

// 生成智能洞察
export const generateInsights = (
  revenueData: number[],
  usersData: number[],
  ordersData: number[]
): AIInsight[]
```

**UI 特性**:
- 渐变背景设计，提升视觉效果
- 可信度徽章，显示分析置信度
- 正面/负面/中性影响标识
- 响应式网格布局

### 2. AI 趋势预测图表 (PredictionChart)

**位置**: `src/components/PredictionChart.tsx`

**功能**:
- 📉 **历史数据可视化**: 显示历史趋势线
- 🔮 **未来预测**: 预测未来 5 期数据
- 📊 **双线对比**: 历史数据(实线) vs AI 预测(虚线)
- 🎨 **交互式图表**: 悬停查看详细数值

**技术实现**:
```typescript
// 生成预测数据（使用移动平均和趋势衰减）
export const generateForecast = (
  data: number[],
  periods: number = 5
): number[]
```

**Chart.js 配置**:
- 使用 Line 图表类型
- 填充区域显示趋势范围
- 虚线样式标识预测数据
- 自定义工具提示显示货币格式

### 3. 异常检测系统 (AnomalyDetection)

**位置**: `src/components/AnomalyDetection.tsx`

**功能**:
- 🎯 **Z-score 检测**: 使用统计学方法检测异常值
- 📍 **严重度分级**: 高/中/低三级警报
- 📊 **偏差分析**: 计算实际值与预期值的偏差百分比
- 💬 **智能解释**: 为每个异常提供可能的原因

**技术实现**:
```typescript
// Z-score 异常检测
export const detectAnomalies = (
  data: number[],
  threshold: number = 2  // ±2σ 标准差
): Anomaly[]
```

**异常分级**:
- `high`: Z-score > 3 (红色警报)
- `medium`: Z-score > 2.5 (橙色警报)
- `low`: Z-score > 2 (蓝色提示)

### 4. AI 服务层 (aiService.ts)

**位置**: `src/services/aiService.ts`

**核心算法**:

#### 线性回归分析
```typescript
// 计算斜率和截距
slope = Σ[(xi - x̄)(yi - ȳ)] / Σ[(xi - x̄)²]
intercept = ȳ - slope * x̄

// 计算 R² (决定系数)
R² = 1 - (残差平方和 / 总平方和)
```

#### Z-score 异常检测
```typescript
Z-score = (x - μ) / σ

其中:
x = 数据点值
μ = 平均值
σ = 标准差
```

#### 皮尔逊相关系数
```typescript
r = Σ[(xi - x̄)(yi - ȳ)] / √[Σ(xi - x̄)² * Σ(yi - ȳ)²]
```

## 📊 使用示例

### 集成到 Dashboard

```typescript
import AIInsights from '../components/AIInsights';
import PredictionChart from '../components/PredictionChart';
import AnomalyDetection from '../components/AnomalyDetection';

const Dashboard = () => {
  const revenueData = [4000, 3000, 5000, 4500, 6000, 5500, 7000];
  const usersData = [200, 250, 300, 280, 350, 400, 450];
  const ordersData = [120, 100, 150, 140, 180, 170, 210];
  const labels = ['一月', '二月', '三月', '四月', '五月', '六月', '七月'];

  return (
    <>
      {/* AI 洞察 */}
      <AIInsights
        revenueData={revenueData}
        usersData={usersData}
        ordersData={ordersData}
      />

      {/* 预测图表 */}
      <PredictionChart
        historicalData={revenueData}
        labels={labels}
        title="收入趋势与 AI 预测"
      />

      {/* 异常检测 */}
      <AnomalyDetection
        data={revenueData}
        labels={labels}
        metricName="收入"
      />
    </>
  );
};
```

## 🎯 AI 功能特点

### 准确性
- ✅ 使用经典统计学算法，结果可靠
- ✅ R² 系数评估趋势强度
- ✅ 置信度评分透明显示

### 实用性
- ✅ 自动生成业务建议
- ✅ 识别数据异常并解释原因
- ✅ 预测未来趋势辅助决策

### 用户体验
- ✅ 视觉化呈现分析结果
- ✅ 加载动画提升体验
- ✅ 响应式设计支持移动端

## 🔧 技术栈

- **React 18**: 组件化开发
- **TypeScript**: 类型安全
- **Chart.js**: 图表可视化
- **CSS3**: 渐变、动画、响应式

## 📈 性能优化

1. **懒加载**: AI 分析延迟 600-800ms 模拟真实 API
2. **React Hooks**: 使用 useEffect 优化重新计算
3. **CSS 动画**: GPU 加速的过渡效果
4. **数据缓存**: 避免重复计算

## 🚀 未来增强

- [ ] 集成真实的机器学习 API
- [ ] 支持更多图表类型的预测
- [ ] 多变量回归分析
- [ ] 季节性分解预测
- [ ] 导出 AI 分析报告(PDF)
- [ ] 自定义异常检测阈值
- [ ] 实时数据流分析

## 📝 注意事项

1. **数据质量**: AI 分析质量依赖于输入数据的质量
2. **样本大小**: 至少需要 3-5 个数据点才能进行有效分析
3. **异常阈值**: 默认使用 ±2σ，可根据业务需求调整
4. **预测范围**: 短期预测（3-5期）较为准确，长期预测误差增大

## 🎓 算法说明

### 为什么选择线性回归？
- 简单高效，易于理解
- 适合短期趋势预测
- 计算成本低，实时性好
- R² 提供趋势强度评估

### 为什么使用 Z-score？
- 标准化方法，适用于各种数据规模
- 清晰的异常判定标准（±2σ, ±3σ）
- 统计学基础扎实
- 容易向业务人员解释

## 📚 参考资料

- [线性回归 - Wikipedia](https://en.wikipedia.org/wiki/Linear_regression)
- [Z-score - Wikipedia](https://en.wikipedia.org/wiki/Standard_score)
- [Pearson correlation coefficient](https://en.wikipedia.org/wiki/Pearson_correlation_coefficient)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)

---

**创建时间**: 2025-11-18
**版本**: 1.0.0
**作者**: AI-Enhanced Development
