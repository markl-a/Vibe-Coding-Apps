/**
 * Date utility functions
 */

/**
 * Format date to ISO string
 */
export const formatISO = (date: Date): string => {
  return date.toISOString();
};

/**
 * Format date to human-readable string
 */
export const formatDate = (date: Date, locale: string = 'zh-TW'): string => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

/**
 * Get time ago string
 */
export const timeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  const intervals: Record<string, number> = {
    年: 31536000,
    月: 2592000,
    週: 604800,
    天: 86400,
    小時: 3600,
    分鐘: 60,
    秒: 1,
  };

  for (const [name, secondsInInterval] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInInterval);
    if (interval >= 1) {
      return `${interval} ${name}前`;
    }
  }

  return '剛剛';
};

/**
 * Add days to date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Check if date is valid
 */
export const isValidDate = (date: unknown): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};
