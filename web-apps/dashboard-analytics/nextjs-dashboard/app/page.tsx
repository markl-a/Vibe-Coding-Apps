'use client'

import { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown, DollarSign, Users, ShoppingCart, Activity } from 'lucide-react'
import SalesChart from '@/components/charts/SalesChart'
import RevenueChart from '@/components/charts/RevenueChart'
import MetricCard from '@/components/widgets/MetricCard'

// 模擬數據
const generateRandomData = () => ({
  totalRevenue: Math.floor(Math.random() * 100000) + 45000,
  totalUsers: Math.floor(Math.random() * 5000) + 2000,
  totalOrders: Math.floor(Math.random() * 1000) + 350,
  activeUsers: Math.floor(Math.random() * 500) + 89,
})

export default function Dashboard() {
  const [metrics, setMetrics] = useState(generateRandomData())

  // 模擬即時數據更新
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(generateRandomData())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dashboard Analytics
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                歡迎回來！這是您的數據概覽
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                即時更新
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <MetricCard
            title="總收入"
            value={`$${metrics.totalRevenue.toLocaleString()}`}
            change={12.5}
            trend="up"
            icon={<DollarSign className="w-6 h-6 text-blue-600" />}
          />
          <MetricCard
            title="總用戶數"
            value={metrics.totalUsers.toLocaleString()}
            change={8.2}
            trend="up"
            icon={<Users className="w-6 h-6 text-green-600" />}
          />
          <MetricCard
            title="總訂單"
            value={metrics.totalOrders.toLocaleString()}
            change={-3.1}
            trend="down"
            icon={<ShoppingCart className="w-6 h-6 text-orange-600" />}
          />
          <MetricCard
            title="活躍用戶"
            value={metrics.activeUsers.toLocaleString()}
            change={15.3}
            trend="up"
            icon={<Activity className="w-6 h-6 text-purple-600" />}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              銷售趨勢
            </h2>
            <SalesChart />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              月收入統計
            </h2>
            <RevenueChart />
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            最近活動
          </h2>
          <div className="space-y-3">
            {[
              { action: '新訂單', user: '用戶 #1234', time: '2 分鐘前' },
              { action: '用戶註冊', user: 'john@example.com', time: '15 分鐘前' },
              { action: '付款完成', user: '用戶 #5678', time: '1 小時前' },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b dark:border-gray-700 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.user}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
