import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ReportItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const reports: ReportItem[] = [
  {
    id: '1',
    title: '銷售報表',
    description: '查看詳細的銷售數據和趨勢',
    icon: 'bar-chart-outline',
    color: '#5B5FFF',
  },
  {
    id: '2',
    title: '客戶報表',
    description: '客戶分析和行為數據',
    icon: 'people-outline',
    color: '#34C759',
  },
  {
    id: '3',
    title: '產品報表',
    description: '產品銷售和庫存分析',
    icon: 'cube-outline',
    color: '#FF9500',
  },
  {
    id: '4',
    title: '財務報表',
    description: '收入、支出和利潤分析',
    icon: 'wallet-outline',
    color: '#FF3B30',
  },
  {
    id: '5',
    title: '行銷報表',
    description: '行銷活動效果分析',
    icon: 'megaphone-outline',
    color: '#007AFF',
  },
  {
    id: '6',
    title: '自訂報表',
    description: '建立自己的報表範本',
    icon: 'add-circle-outline',
    color: '#666',
  },
];

const ReportsScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>報表中心</Text>
        <Text style={styles.headerSubtitle}>選擇要查看的報表類型</Text>
      </View>

      {reports.map((report) => (
        <TouchableOpacity key={report.id} style={styles.reportCard}>
          <View style={[styles.iconContainer, { backgroundColor: `${report.color}20` }]}>
            <Ionicons name={report.icon as any} size={32} color={report.color} />
          </View>
          <View style={styles.reportContent}>
            <Text style={styles.reportTitle}>{report.title}</Text>
            <Text style={styles.reportDescription}>{report.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>最近查看</Text>

        <View style={styles.recentItem}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <Text style={styles.recentText}>銷售報表 - 2025/11/15</Text>
        </View>

        <View style={styles.recentItem}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <Text style={styles.recentText}>客戶報表 - 2025/11/14</Text>
        </View>

        <View style={styles.recentItem}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <Text style={styles.recentText}>產品報表 - 2025/11/13</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.exportButton}>
        <Ionicons name="download-outline" size={20} color="#fff" />
        <Text style={styles.exportButtonText}>匯出所有報表</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 13,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentText: {
    fontSize: 14,
    color: '#000',
    marginLeft: 12,
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: '#5B5FFF',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ReportsScreen;
