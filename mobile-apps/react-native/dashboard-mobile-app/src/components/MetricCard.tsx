import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MetricData } from '../types';

interface MetricCardProps {
  data: MetricData;
}

const MetricCard: React.FC<MetricCardProps> = ({ data }) => {
  const isPositive = data.trend === 'up';
  const trendColor = isPositive ? '#34C759' : '#FF3B30';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>{data.label}</Text>
        {data.icon && (
          <Ionicons name={data.icon as any} size={24} color="#5B5FFF" />
        )}
      </View>

      <Text style={styles.value}>{data.value.toLocaleString()}</Text>

      <View style={styles.footer}>
        <Ionicons
          name={isPositive ? 'trending-up' : 'trending-down'}
          size={16}
          color={trendColor}
        />
        <Text style={[styles.change, { color: trendColor }]}>
          {Math.abs(data.change)}%
        </Text>
        <Text style={styles.period}>vs 上月</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  change: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  period: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
});

export default MetricCard;
