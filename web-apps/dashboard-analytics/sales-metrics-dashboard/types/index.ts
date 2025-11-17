export type DateRange = 'today' | 'week' | 'month' | 'custom';

export interface MetricCard {
  title: string;
  value: string;
  change: number;
  icon: string;
}

export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface CategorySales {
  category: string;
  sales: number;
  percentage: number;
}

export interface RegionSales {
  region: string;
  sales: number;
  percentage: number;
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  sales: number;
  revenue: number;
  growth: number;
}

export interface DashboardData {
  metrics: SalesMetrics;
  revenueData: RevenueData[];
  categorySales: CategorySales[];
  regionSales: RegionSales[];
  topProducts: TopProduct[];
  lastUpdated: Date;
}
