export interface TabInfo extends chrome.tabs.Tab {
  domain?: string;
  favicon?: string;
}

export interface TabGroup {
  id: string;
  name: string;
  color: string;
  tabIds: number[];
  createdAt: Date;
}

export interface SavedSession {
  id: string;
  name: string;
  tabs: Array<{
    url: string;
    title: string;
    favicon?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TabManagerSettings {
  autoGroup: boolean;
  autoSuspendEnabled: boolean;
  suspendTimeout: number; // minutes
  searchScope: 'current' | 'all';
  theme: 'light' | 'dark' | 'auto';
}

export const DEFAULT_SETTINGS: TabManagerSettings = {
  autoGroup: false,
  autoSuspendEnabled: false,
  suspendTimeout: 30,
  searchScope: 'current',
  theme: 'auto',
};
