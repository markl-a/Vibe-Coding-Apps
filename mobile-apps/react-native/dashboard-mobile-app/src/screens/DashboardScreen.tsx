import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MetricCard from '../components/MetricCard';
import { MetricData, UserActivity } from '../types';
import { format } from 'date-fns';

// Mock data
const metrics: MetricData[] = [
  {
    label: '總營收',
    value: 1245000,
    change: 12.5,
    trend: 'up',
    icon: 'cash-outline',
  },
  {
    label: '訂單數',
    value: 3456,
    change: 8.3,
    trend: 'up',
    icon: 'receipt-outline',
  },
  {
    label: '活躍用戶',
    value: 12890,
    change: -3.2,
    trend: 'down',
    icon: 'people-outline',
  },
  {
    label: '轉換率',
    value: 3.8,
    change: 5.1,
    trend: 'up',
    icon: 'trending-up-outline',
  },
];

const recentActivities: UserActivity[] = [
  {
    id: '1',
    user: 'Alice',
    action: '完成了一筆訂單',
    timestamp: new Date(Date.now() - 300000),
    type: 'purchase',
  },
  {
    id: '2',
    user: 'Bob',
    action: '註冊新帳號',
    timestamp: new Date(Date.now() - 600000),
    type: 'signup',
  },
  {
    id: '3',
    user: 'Carol',
    action: '瀏覽了產品頁面',
    timestamp: new Date(Date.now() - 900000),
    type: 'view',
  },
  {
    id: '4',
    user: 'David',
    action: '登入系統',
    timestamp: new Date(Date.now() - 1200000),
    type: 'login',
  },
];

const DashboardScreen = () => {
  const getActivityIcon = (type: UserActivity['type']) => {
    switch (type) {
      case 'purchase':
        return { name: 'cart', color: '#34C759' };
      case 'signup':
        return { name: 'person-add', color: '#007AFF' };
      case 'login':
        return { name: 'log-in', color: '#5B5FFF' };
      case 'view':
        return { name: 'eye', color: '#FF9500' };
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>歡迎回來！</Text>
        <Text style={styles.date}>{format(new Date(), 'yyyy/MM/dd')}</Text>
      </View>

      <View style={styles.metricsGrid}>
        {metrics.map((metric, index) => (
          <View key={index} style={styles.metricItem}>
            <MetricCard data={metric} />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>最近活動</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>查看全部</Text>
          </TouchableOpacity>
        </View>

        {recentActivities.map((activity) => {
          const icon = getActivityIcon(activity.type);
          return (
            <View key={activity.id} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: `${icon.color}20` }]}>
                <Ionicons name={icon.name as any} size={20} color={icon.color} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityUser}>{activity.user}</Text>
                <Text style={styles.activityAction}>{activity.action}</Text>
                <Text style={styles.activityTime}>
                  {format(activity.timestamp, 'HH:mm')}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>快速操作</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-circle-outline" size={32} color="#5B5FFF" />
            <Text style={styles.actionText}>新增</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download-outline" size={32} color="#5B5FFF" />
            <Text style={styles.actionText}>匯出</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={32} color="#5B5FFF" />
            <Text style={styles.actionText}>分享</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings-outline" size={32} color="#5B5FFF" />
            <Text style={styles.actionText}>設定</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#5B5FFF',
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  metricsGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  viewAll: {
    fontSize: 14,
    color: '#5B5FFF',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  activityAction: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
});

export default DashboardScreen;
