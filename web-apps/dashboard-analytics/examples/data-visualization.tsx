/**
 * Data Visualization Component Example
 *
 * This example demonstrates:
 * - Multiple chart types (Line, Bar, Pie, Area)
 * - Responsive chart layout
 * - Interactive tooltips and legends
 * - Data transformation and formatting
 * - Loading states and error handling
 * - Chart customization options
 *
 * Usage in dashboard apps: admin-panel, analytics-dashboard, nextjs-dashboard, sales-metrics-dashboard
 *
 * Libraries used: Recharts (can be adapted for Chart.js, D3, etc.)
 */

'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Type definitions
interface SalesData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface TimeSeriesData {
  time: string;
  users: number;
  sessions: number;
}

export default function DataVisualization() {
  // State management
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState<'line' | 'bar' | 'area' | 'pie'>('line');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call
        // const response = await fetch(`/api/analytics?range=${dateRange}`);
        // const data = await response.json();

        // Mock sales data
        const mockSalesData: SalesData[] = [
          { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
          { month: 'Feb', revenue: 52000, expenses: 35000, profit: 17000 },
          { month: 'Mar', revenue: 48000, expenses: 33000, profit: 15000 },
          { month: 'Apr', revenue: 61000, expenses: 38000, profit: 23000 },
          { month: 'May', revenue: 55000, expenses: 36000, profit: 19000 },
          { month: 'Jun', revenue: 67000, expenses: 40000, profit: 27000 },
          { month: 'Jul', revenue: 72000, expenses: 42000, profit: 30000 },
          { month: 'Aug', revenue: 68000, expenses: 41000, profit: 27000 },
          { month: 'Sep', revenue: 74000, expenses: 43000, profit: 31000 },
          { month: 'Oct', revenue: 79000, expenses: 45000, profit: 34000 },
          { month: 'Nov', revenue: 83000, expenses: 47000, profit: 36000 },
          { month: 'Dec', revenue: 91000, expenses: 50000, profit: 41000 },
        ];

        // Mock category data
        const mockCategoryData: CategoryData[] = [
          { name: 'Electronics', value: 35, color: '#3b82f6' },
          { name: 'Clothing', value: 25, color: '#10b981' },
          { name: 'Home & Garden', value: 20, color: '#f59e0b' },
          { name: 'Sports', value: 12, color: '#ef4444' },
          { name: 'Other', value: 8, color: '#8b5cf6' },
        ];

        // Mock time series data
        const mockTimeSeriesData: TimeSeriesData[] = Array.from({ length: 24 }, (_, i) => ({
          time: `${i}:00`,
          users: Math.floor(Math.random() * 1000) + 500,
          sessions: Math.floor(Math.random() * 1500) + 800,
        }));

        setSalesData(mockSalesData);
        setCategoryData(mockCategoryData);
        setTimeSeriesData(mockTimeSeriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  // Calculate metrics
  const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
  const totalProfit = salesData.reduce((sum, item) => sum + item.profit, 0);
  const averageRevenue = totalRevenue / salesData.length;
  const profitMargin = ((totalProfit / totalRevenue) * 100).toFixed(1);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: ${entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Visualize your business metrics and trends</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-wrap items-center gap-4">
          {/* Chart Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
            <div className="flex gap-2">
              {(['line', 'bar', 'area', 'pie'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedChart(type)}
                  className={`px-4 py-2 rounded-lg capitalize font-medium transition-colors ${
                    selectedChart === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-green-600 mt-2">↑ 12.5% from last period</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600 mb-1">Total Profit</p>
          <p className="text-2xl font-bold text-gray-900">${totalProfit.toLocaleString()}</p>
          <p className="text-sm text-green-600 mt-2">↑ 8.3% from last period</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600 mb-1">Avg Revenue</p>
          <p className="text-2xl font-bold text-gray-900">${averageRevenue.toLocaleString()}</p>
          <p className="text-sm text-green-600 mt-2">↑ 5.7% from last period</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
          <p className="text-2xl font-bold text-gray-900">{profitMargin}%</p>
          <p className="text-sm text-red-600 mt-2">↓ 1.2% from last period</p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {selectedChart === 'pie' ? 'Sales by Category' : 'Revenue Trends'}
        </h2>

        <ResponsiveContainer width="100%" height={400}>
          {selectedChart === 'line' && (
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          )}

          {selectedChart === 'bar' && (
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" />
              <Bar dataKey="expenses" fill="#ef4444" />
              <Bar dataKey="profit" fill="#10b981" />
            </BarChart>
          )}

          {selectedChart === 'area' && (
            <AreaChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stackId="2"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
              />
            </AreaChart>
          )}

          {selectedChart === 'pie' && (
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Time Series Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Real-Time User Activity</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="users"
              stackId="1"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="sessions"
              stackId="2"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Data Export */}
      <div className="mt-8 flex justify-center gap-4">
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          Export as PDF
        </button>
        <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
          Export as CSV
        </button>
        <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
          Share Dashboard
        </button>
      </div>
    </div>
  );
}
