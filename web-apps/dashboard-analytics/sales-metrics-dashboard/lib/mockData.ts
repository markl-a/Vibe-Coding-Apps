import { format, subDays } from 'date-fns';
import { DashboardData, DateRange } from '@/types';

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

export function generateRevenueData(days: number = 30) {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      date: format(date, 'MM/dd'),
      revenue: randomBetween(50000, 200000),
      orders: randomBetween(50, 200),
    });
  }
  return data;
}

export function generateCategorySales() {
  const categories = [
    { category: '電子產品', baseValue: 350000 },
    { category: '服飾配件', baseValue: 280000 },
    { category: '家居生活', baseValue: 220000 },
    { category: '運動健身', baseValue: 180000 },
    { category: '美妝保養', baseValue: 150000 },
  ];

  const totalSales = categories.reduce((sum, cat) => sum + cat.baseValue, 0);

  return categories.map(cat => ({
    category: cat.category,
    sales: cat.baseValue + randomBetween(-20000, 30000),
    percentage: parseFloat(((cat.baseValue / totalSales) * 100).toFixed(1)),
  }));
}

export function generateRegionSales() {
  const regions = [
    { region: '台北市', baseValue: 400000 },
    { region: '新北市', baseValue: 280000 },
    { region: '台中市', baseValue: 220000 },
    { region: '台南市', baseValue: 150000 },
    { region: '高雄市', baseValue: 180000 },
    { region: '其他地區', baseValue: 120000 },
  ];

  const totalSales = regions.reduce((sum, region) => sum + region.baseValue, 0);

  return regions.map(region => ({
    region: region.region,
    sales: region.baseValue + randomBetween(-15000, 25000),
    percentage: parseFloat(((region.baseValue / totalSales) * 100).toFixed(1)),
  }));
}

export function generateTopProducts() {
  const productNames = [
    { name: 'iPhone 15 Pro', category: '電子產品' },
    { name: 'Sony WH-1000XM5 耳機', category: '電子產品' },
    { name: 'Nike Air Max 運動鞋', category: '運動健身' },
    { name: 'Dyson 吸塵器 V15', category: '家居生活' },
    { name: 'Lululemon 瑜珈褲', category: '服飾配件' },
    { name: 'SK-II 神仙水', category: '美妝保養' },
    { name: 'MacBook Pro 14"', category: '電子產品' },
    { name: 'Adidas 運動外套', category: '運動健身' },
    { name: 'MUJI 收納箱', category: '家居生活' },
    { name: 'Estée Lauder 精華液', category: '美妝保養' },
  ];

  return productNames.map((product, index) => ({
    id: `P${String(index + 1).padStart(3, '0')}`,
    name: product.name,
    category: product.category,
    sales: randomBetween(50, 500),
    revenue: randomBetween(100000, 800000),
    growth: randomFloat(-15, 45, 1),
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
}

export function generateDashboardData(dateRange: DateRange = 'month'): DashboardData {
  const revenueData = generateRevenueData(dateRange === 'today' ? 1 : dateRange === 'week' ? 7 : 30);

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = revenueData.reduce((sum, item) => sum + item.orders, 0);

  return {
    metrics: {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalRevenue / totalOrders,
      conversionRate: randomFloat(2.5, 4.5, 2),
    },
    revenueData,
    categorySales: generateCategorySales(),
    regionSales: generateRegionSales(),
    topProducts: generateTopProducts(),
    lastUpdated: new Date(),
  };
}

// 模擬即時更新
export function simulateRealtimeUpdate(currentData: DashboardData): DashboardData {
  const variation = 0.05; // 5% variation

  return {
    ...currentData,
    metrics: {
      totalRevenue: currentData.metrics.totalRevenue * (1 + randomFloat(-variation, variation, 4)),
      totalOrders: Math.floor(currentData.metrics.totalOrders * (1 + randomFloat(-variation, variation, 4))),
      averageOrderValue: currentData.metrics.averageOrderValue * (1 + randomFloat(-variation, variation, 4)),
      conversionRate: currentData.metrics.conversionRate * (1 + randomFloat(-variation, variation, 4)),
    },
    lastUpdated: new Date(),
  };
}
