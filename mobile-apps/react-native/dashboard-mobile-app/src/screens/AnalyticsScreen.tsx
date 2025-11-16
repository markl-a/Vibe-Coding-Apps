import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SalesData } from '../types';

const { width } = Dimensions.get('window');

// Mock data
const salesData: SalesData[] = [
  { date: '週一', amount: 12000 },
  { date: '週二', amount: 19000 },
  { date: '週三', amount: 15000 },
  { date: '週四', amount: 25000 },
  { date: '週五', amount: 22000 },
  { date: '週六', amount: 30000 },
  { date: '週日', amount: 28000 },
];

const AnalyticsScreen = () => {
  const maxValue = Math.max(...salesData.map((d) => d.amount));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>本週銷售趨勢</Text>
        <View style={styles.chartContainer}>
          {salesData.map((data, index) => {
            const barHeight = (data.amount / maxValue) * 200;
            return (
              <View key={index} style={styles.barContainer}>
                <Text style={styles.barValue}>
                  {(data.amount / 1000).toFixed(0)}K
                </Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{data.date}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>統計數據</Text>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>平均訂單金額</Text>
            <Text style={styles.statValue}>NT$ 1,234</Text>
            <Text style={styles.statChange}>+5.2%</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>客戶滿意度</Text>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statChange}>+0.3</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>回購率</Text>
            <Text style={styles.statValue}>68%</Text>
            <Text style={styles.statChange}>+12%</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>客單價成長</Text>
            <Text style={styles.statValue}>15.6%</Text>
            <Text style={styles.statChange}>+2.1%</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>分類占比</Text>

        <View style={styles.categoryItem}>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>電子產品</Text>
            <Text style={styles.categoryPercent}>42%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: '42%', backgroundColor: '#5B5FFF' }]} />
          </View>
        </View>

        <View style={styles.categoryItem}>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>服飾配件</Text>
            <Text style={styles.categoryPercent}>28%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: '28%', backgroundColor: '#34C759' }]} />
          </View>
        </View>

        <View style={styles.categoryItem}>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>家居生活</Text>
            <Text style={styles.categoryPercent}>18%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: '18%', backgroundColor: '#FF9500' }]} />
          </View>
        </View>

        <View style={styles.categoryItem}>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>其他</Text>
            <Text style={styles.categoryPercent}>12%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: '12%', backgroundColor: '#FF3B30' }]} />
          </View>
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
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 250,
    paddingTop: 20,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barValue: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  bar: {
    width: 24,
    backgroundColor: '#5B5FFF',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  categoryPercent: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 4,
  },
});

export default AnalyticsScreen;
