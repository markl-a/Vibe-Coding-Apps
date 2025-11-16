'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const data = [
  { name: '一月', sales: 4000, orders: 2400 },
  { name: '二月', sales: 3000, orders: 1398 },
  { name: '三月', sales: 2000, orders: 9800 },
  { name: '四月', sales: 2780, orders: 3908 },
  { name: '五月', sales: 1890, orders: 4800 },
  { name: '六月', sales: 2390, orders: 3800 },
  { name: '七月', sales: 3490, orders: 4300 },
]

export default function SalesChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis
          dataKey="name"
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
        <Line
          type="monotone"
          dataKey="sales"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          name="銷售額"
        />
        <Line
          type="monotone"
          dataKey="orders"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          name="訂單數"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
