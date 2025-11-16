export interface MetricData {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down';
  icon?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface SalesData {
  date: string;
  amount: number;
}

export interface UserActivity {
  id: string;
  user: string;
  action: string;
  timestamp: Date;
  type: 'purchase' | 'signup' | 'login' | 'view';
}

export interface Product {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  change: number;
}
