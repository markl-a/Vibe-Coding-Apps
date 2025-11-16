export interface BlockedSite {
  id: string;
  url: string;
  pattern: string; // Regex pattern for matching
  enabled: boolean;
  listId: string;
  addedAt: Date;
}

export interface BlockList {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  sites: string[];
  color: string;
}

export interface Schedule {
  id: string;
  name: string;
  enabled: boolean;
  days: number[]; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  listIds: string[]; // Block lists to activate
}

export interface BlockerSettings {
  enabled: boolean;
  strictMode: boolean;
  password?: string;
  redirectUrl: string;
  showMotivation: boolean;
  blockSubdomains: boolean;
  whitelistMode: boolean;
}

export interface BlockerStats {
  totalBlocks: number;
  blocksToday: number;
  timeSaved: number; // in minutes
  mostBlockedSites: { url: string; count: number }[];
  dailyStats: { [date: string]: number };
}

export const DEFAULT_SETTINGS: BlockerSettings = {
  enabled: true,
  strictMode: false,
  redirectUrl: 'blocked.html',
  showMotivation: true,
  blockSubdomains: true,
  whitelistMode: false,
};

export const DEFAULT_LISTS: BlockList[] = [
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Popular social networking sites',
    enabled: false,
    color: '#3b82f6',
    sites: [
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'linkedin.com',
      'reddit.com',
      'tiktok.com',
    ],
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    description: 'Video streaming and gaming sites',
    enabled: false,
    color: '#ef4444',
    sites: [
      'youtube.com',
      'netflix.com',
      'twitch.tv',
      'hulu.com',
      'disneyplus.com',
    ],
  },
  {
    id: 'news',
    name: 'News & Media',
    description: 'News websites',
    enabled: false,
    color: '#f59e0b',
    sites: [
      'cnn.com',
      'bbc.com',
      'news.google.com',
      'nytimes.com',
    ],
  },
];
