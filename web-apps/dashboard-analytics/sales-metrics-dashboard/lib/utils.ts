import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { DateRange } from '@/types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('zh-TW').format(num);
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function getDateRangeLabel(range: DateRange): string {
  switch (range) {
    case 'today':
      return '今天';
    case 'week':
      return '本週';
    case 'month':
      return '本月';
    case 'custom':
      return '自定義';
    default:
      return '';
  }
}

export function getDateRange(range: DateRange): { start: Date; end: Date } {
  const now = new Date();

  switch (range) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    default:
      return {
        start: startOfMonth(now),
        end: endOfDay(now),
      };
  }
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
