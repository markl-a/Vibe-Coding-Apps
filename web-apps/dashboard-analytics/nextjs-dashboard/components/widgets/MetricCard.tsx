'use client'

import { ArrowUp, ArrowDown } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change: number
  trend: 'up' | 'down'
  icon?: React.ReactNode
}

export default function MetricCard({ title, value, change, trend, icon }: MetricCardProps) {
  const isPositive = trend === 'up'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {value}
          </h3>
          <div className={`flex items-center mt-2 text-sm font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? (
              <ArrowUp className="w-4 h-4 mr-1" />
            ) : (
              <ArrowDown className="w-4 h-4 mr-1" />
            )}
            <span>{Math.abs(change)}%</span>
            <span className="text-gray-500 dark:text-gray-400 ml-2">vs 上月</span>
          </div>
        </div>
        {icon && (
          <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-full">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
