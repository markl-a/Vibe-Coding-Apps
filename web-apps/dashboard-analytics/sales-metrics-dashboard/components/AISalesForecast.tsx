'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Calendar, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { forecastSales, SalesForecast } from '@/lib/aiSalesService';

interface AISalesForecastProps {
  historicalData: { date: string; revenue: number }[];
}

const AISalesForecast = ({ historicalData }: AISalesForecastProps) => {
  const [forecasts, setForecasts] = useState<SalesForecast[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      const predictions = forecastSales(historicalData, 7);
      setForecasts(predictions);
      setIsAnalyzing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [historicalData]);

  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            AI 销售预测
          </h2>
          <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
            分析中...
          </span>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600">AI 正在分析历史数据并生成预测...</p>
          </div>
        </div>
      </div>
    );
  }

  // 合并历史数据和预测数据用于图表
  const chartData = [
    ...historicalData.slice(-14).map(d => ({
      date: d.date,
      actual: d.revenue,
      predicted: null,
      low: null,
      high: null,
    })),
    ...forecasts.map(f => ({
      date: f.date.slice(5),
      actual: null,
      predicted: f.predictedRevenue,
      low: f.range.low,
      high: f.range.high,
    })),
  ];

  const totalForecastRevenue = forecasts.reduce((sum, f) => sum + f.predictedRevenue, 0);
  const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-indigo-600" />
          AI 销售预测
        </h2>
        <div className="flex items-center gap-2">
          <span className="bg-indigo-100 text-indigo-800 px-4 py-1 rounded-full text-sm font-semibold">
            未来 7 天预测
          </span>
        </div>
      </div>

      {/* 预测摘要 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-medium text-gray-600">预测总收入</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${totalForecastRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">未来 7 天预期</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">日均预测</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${(totalForecastRevenue / forecasts.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">每日平均收入</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">预测可信度</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(avgConfidence * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">基于 R² 系数</p>
        </div>
      </div>

      {/* 预测图表 */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: unknown) => [`$${(value as number)?.toLocaleString()}`, '']}
            />
            <Legend />

            {/* 置信区间 */}
            <Area
              type="monotone"
              dataKey="high"
              fill="#c7d2fe"
              stroke="none"
              fillOpacity={0.3}
              name="预测上限"
            />
            <Area
              type="monotone"
              dataKey="low"
              fill="#c7d2fe"
              stroke="none"
              fillOpacity={0.3}
              name="预测下限"
            />

            {/* 历史数据 */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ r: 4 }}
              name="历史收入"
            />

            {/* 预测数据 */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#f59e0b"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ r: 5, fill: '#f59e0b' }}
              name="AI 预测"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 预测详情表格 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">每日预测详情</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">日期</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700">预测收入</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700">最低</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700">最高</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-700">可信度</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.map((forecast, index) => (
                <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 text-gray-900">{forecast.date}</td>
                  <td className="py-2 px-3 text-right font-medium text-gray-900">
                    ${forecast.predictedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-600">
                    ${forecast.range.low.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-600">
                    ${forecast.range.high.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      forecast.confidence > 0.8
                        ? 'bg-green-100 text-green-800'
                        : forecast.confidence > 0.6
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {(forecast.confidence * 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 说明 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">💡 预测说明：</span>
          使用线性回归和时间序列分析生成预测。置信区间显示预测的可能范围（95% 置信度）。
          预测准确性取决于历史数据的质量和市场稳定性。
        </p>
      </div>
    </div>
  );
};

export default AISalesForecast;
