'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { DateRange } from '@/types';
import { generateDashboardData, simulateRealtimeUpdate } from '@/lib/mockData';
import DashboardHeader from '@/components/DashboardHeader';
import DateRangeSelector from '@/components/DateRangeSelector';
import MetricCard from '@/components/MetricCard';
import RevenueChart from '@/components/RevenueChart';
import CategoryChart from '@/components/CategoryChart';
import RegionChart from '@/components/RegionChart';
import TopProductsTable from '@/components/TopProductsTable';

export default function Home() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [dashboardData, setDashboardData] = useState(() => generateDashboardData('month'));
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 模擬即時更新
  useEffect(() => {
    const interval = setInterval(() => {
      setDashboardData((currentData) => simulateRealtimeUpdate(currentData));
    }, 5000); // 每 5 秒更新一次

    return () => clearInterval(interval);
  }, []);

  // 處理日期範圍變更
  const handleDateRangeChange = useCallback((newRange: DateRange) => {
    setDateRange(newRange);
    setDashboardData(generateDashboardData(newRange));
  }, []);

  // 手動重新整理
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setDashboardData(generateDashboardData(dateRange));
      setIsRefreshing(false);
    }, 1000);
  }, [dateRange]);

  // 計算變化百分比（模擬）
  const getRandomChange = () => Math.random() * 20 - 5; // -5% to +15%

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1600px] mx-auto">
        <DashboardHeader
          lastUpdated={dashboardData.lastUpdated}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <div className="mb-6">
          <DateRangeSelector selected={dateRange} onChange={handleDateRangeChange} />
        </div>

        {/* 關鍵指標卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard
            title="總收入"
            value={dashboardData.metrics.totalRevenue}
            change={getRandomChange()}
            icon={<DollarSign className="w-6 h-6" />}
            format="currency"
          />
          <MetricCard
            title="訂單數"
            value={dashboardData.metrics.totalOrders}
            change={getRandomChange()}
            icon={<ShoppingCart className="w-6 h-6" />}
            format="number"
          />
          <MetricCard
            title="平均訂單價值"
            value={dashboardData.metrics.averageOrderValue}
            change={getRandomChange()}
            icon={<TrendingUp className="w-6 h-6" />}
            format="currency"
          />
          <MetricCard
            title="轉換率"
            value={dashboardData.metrics.conversionRate}
            change={getRandomChange()}
            icon={<Users className="w-6 h-6" />}
            format="percentage"
          />
        </div>

        {/* 收入趨勢圖表 */}
        <div className="mb-6">
          <RevenueChart data={dashboardData.revenueData} />
        </div>

        {/* 產品類別和地區分佈 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CategoryChart data={dashboardData.categorySales} />
          <RegionChart data={dashboardData.regionSales} />
        </div>

        {/* 熱銷產品表格 */}
        <TopProductsTable products={dashboardData.topProducts} />
      </div>
    </main>
  );
}
