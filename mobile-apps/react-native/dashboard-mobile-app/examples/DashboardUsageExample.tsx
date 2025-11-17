import React from 'react';
import { View, Text } from 'react-native';

/**
 * React Native Dashboard App 使用範例
 *
 * 展示如何:
 * 1. 創建儀表板數據
 * 2. 使用圖表組件
 * 3. 顯示統計卡片
 * 4. 實時數據更新
 */

// MARK: - 測試數據

export const DashboardTestData = {
  // 銷售數據
  salesData: [
    { month: '1月', revenue: 45000, orders: 120 },
    { month: '2月', revenue: 52000, orders: 145 },
    { month: '3月', revenue: 48000, orders: 130 },
    { month: '4月', revenue: 61000, orders: 170 },
    { month: '5月', revenue: 58000, orders: 160 },
    { month: '6月', revenue: 69000, orders: 195 },
  ],

  // 統計卡片數據
  stats: {
    totalRevenue: 333000,
    totalOrders: 920,
    activeUsers: 1250,
    growthRate: 23.5,
  },

  // 最近活動
  recentActivities: [
    { id: '1', type: 'order', message: '新訂單 #1234', time: '5分鐘前' },
    { id: '2', type: 'user', message: '新用戶註冊', time: '12分鐘前' },
    { id: '3', type: 'payment', message: '收到付款 $500', time: '25分鐘前' },
    { id: '4', type: 'order', message: '訂單 #1233 已完成', time: '1小時前' },
    { id: '5', type: 'review', message: '收到新評論', time: '2小時前' },
  ],

  // 產品績效
  topProducts: [
    { id: '1', name: 'iPhone 15 Pro', sales: 156, revenue: 180000 },
    { id: '2', name: 'MacBook Air M3', sales: 89, revenue: 120000 },
    { id: '3', name: 'AirPods Pro', sales: 234, revenue: 58500 },
    { id: '4', name: 'iPad Pro', sales: 67, revenue: 70000 },
    { id: '5', name: 'Apple Watch', sales: 143, revenue: 57200 },
  ],
};

// MARK: - 統計卡片組件

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: string;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
}) => {
  return (
    <View
      style={{
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
      <Text style={{ fontSize: 14, color: '#666' }}>{title}</Text>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginVertical: 8 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 12, color: change.startsWith('+') ? '#22c55e' : '#ef4444' }}>
        {change}
      </Text>
    </View>
  );
};

// MARK: - 範例用法

export const DashboardExample = () => {
  const { stats } = DashboardTestData;

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        儀表板
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <StatCard
          title="總收入"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          change={`+${stats.growthRate}%`}
          icon="💰"
          color="#22c55e"
        />

        <StatCard
          title="訂單數量"
          value={stats.totalOrders.toString()}
          change="+12.5%"
          icon="📦"
          color="#3b82f6"
        />

        <StatCard
          title="活躍用戶"
          value={stats.activeUsers.toString()}
          change="+8.3%"
          icon="👥"
          color="#f59e0b"
        />
      </View>
    </View>
  );
};

/*
 💡 使用方式:

 1. 在組件中使用測試數據:
 ```tsx
 import { DashboardTestData } from './examples/DashboardUsageExample';

 const MyDashboard = () => {
   const { salesData, stats } = DashboardTestData;
   // 使用數據渲染圖表和統計
 };
 ```

 2. 顯示統計卡片:
 ```tsx
 <StatCard
   title="總收入"
   value="$333,000"
   change="+23.5%"
   icon="💰"
   color="#22c55e"
 />
 ```

 3. 使用圖表庫 (如 react-native-chart-kit):
 ```tsx
 import { LineChart } from 'react-native-chart-kit';

 <LineChart
   data={{
     labels: salesData.map(d => d.month),
     datasets: [{ data: salesData.map(d => d.revenue) }],
   }}
   width={Dimensions.get('window').width - 32}
   height={220}
 />
 ```

 4. 實時數據更新:
 ```tsx
 useEffect(() => {
   const interval = setInterval(() => {
     // 更新數據
   }, 5000);
   return () => clearInterval(interval);
 }, []);
 ```
 */

export default DashboardExample;
