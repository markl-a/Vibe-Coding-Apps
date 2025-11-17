'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RegionSales } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface RegionChartProps {
  data: RegionSales[];
}

const COLORS = ['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16'];

export default function RegionChart({ data }: RegionChartProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">銷售地區分佈</h3>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ region, percentage }) => `${region} ${percentage}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="sales"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
