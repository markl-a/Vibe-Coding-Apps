import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  format?: 'currency' | 'number' | 'percentage';
}

export default function MetricCard({ title, value, change, icon, format = 'currency' }: MetricCardProps) {
  const formatValue = () => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'number':
        return formatNumber(value);
      case 'percentage':
        return `${value.toFixed(2)}%`;
      default:
        return value;
    }
  };

  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        <div className="text-primary-500">{icon}</div>
      </div>
      <div className="mb-2">
        <p className="text-3xl font-bold text-gray-900">{formatValue()}</p>
      </div>
      <div className="flex items-center">
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
        )}
        <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {formatPercentage(change)}
        </span>
        <span className="text-gray-500 text-sm ml-2">vs 上期</span>
      </div>
    </div>
  );
}
