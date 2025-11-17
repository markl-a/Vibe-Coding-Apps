import { BarChart3, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardHeaderProps {
  lastUpdated: Date;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export default function DashboardHeader({ lastUpdated, onRefresh, isRefreshing = false }: DashboardHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary-500 p-3 rounded-lg">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">銷售指標儀表板</h1>
            <p className="text-gray-600 mt-1">
              最後更新: {format(lastUpdated, 'yyyy/MM/dd HH:mm:ss')}
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? '更新中...' : '重新整理'}</span>
        </button>
      </div>
    </div>
  );
}
