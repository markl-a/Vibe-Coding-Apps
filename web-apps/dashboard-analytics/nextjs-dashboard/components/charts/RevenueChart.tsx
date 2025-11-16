'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const data = [
  { month: '一月', revenue: 12000, expenses: 8400 },
  { month: '二月', revenue: 19000, expenses: 9800 },
  { month: '三月', revenue: 15000, expenses: 11800 },
  { month: '四月', revenue: 25000, expenses: 13908 },
  { month: '五月', revenue: 22000, expenses: 14800 },
  { month: '六月', revenue: 28000, expenses: 16800 },
]

export default function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis
          dataKey="month"
          className="text-sm"
          stroke="#888888"
        />
        <YAxis
          className="text-sm"
          stroke="#888888"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Bar
          dataKey="revenue"
          fill="#3b82f6"
          radius={[8, 8, 0, 0]}
          name="收入"
        />
        <Bar
          dataKey="expenses"
          fill="#ef4444"
          radius={[8, 8, 0, 0]}
          name="支出"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
