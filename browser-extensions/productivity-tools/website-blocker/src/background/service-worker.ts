import { BlockList, BlockerSettings, DEFAULT_SETTINGS } from '../types/blocker';
import { urlMatchesPattern } from '../utils/urlMatcher';

// Load settings and block lists
async function loadSettings(): Promise<BlockerSettings> {
  const result = await chrome.storage.local.get(['blockerSettings']);
  return result.blockerSettings || DEFAULT_SETTINGS;
}

async function loadBlockLists(): Promise<BlockList[]> {
  const result = await chrome.storage.local.get(['blockLists']);
  return result.blockLists || [];
}

async function updateStats(url: string) {
  const result = await chrome.storage.local.get(['blockerStats']);
  const stats = result.blockerStats || {
    totalBlocks: 0,
    blocksToday: 0,
    timeSaved: 0,
    mostBlockedSites: [],
    dailyStats: {},
  };

  const today = new Date().toISOString().split('T')[0];

  stats.totalBlocks += 1;
  stats.blocksToday = (stats.dailyStats[today] || 0) + 1;
  stats.dailyStats[today] = stats.blocksToday;
  stats.timeSaved += 5; // Estimate 5 minutes saved per block

  // Update most blocked sites
  const siteEntry = stats.mostBlockedSites.find((s: any) => s.url === url);
  if (siteEntry) {
    siteEntry.count += 1;
  } else {
    stats.mostBlockedSites.push({ url, count: 1 });
  }

  // Sort and keep top 10
  stats.mostBlockedSites.sort((a: any, b: any) => b.count - a.count);
  stats.mostBlockedSites = stats.mostBlockedSites.slice(0, 10);

  await chrome.storage.local.set({ blockerStats: stats });
}

function shouldBlockUrl(url: string, blockLists: BlockList[], settings: BlockerSettings): boolean {
  if (!settings.enabled) {
    return false;
  }

  // Check if URL matches any enabled block list
  for (const list of blockLists) {
    if (!list.enabled) continue;

    for (const site of list.sites) {
      if (urlMatchesPattern(url, site, settings.blockSubdomains)) {
        return true;
      }
    }
  }

  return false;
}

// Listen for web navigation
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return; // Only check main frame

  const settings = await loadSettings();
  const blockLists = await loadBlockLists();

  if (shouldBlockUrl(details.url, blockLists, settings)) {
    // Block the navigation by redirecting
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL('blocked.html') + '?url=' + encodeURIComponent(details.url),
    });

    // Update statistics
    await updateStats(details.url);
  }
});

// Listen for tab updates (for already loaded tabs)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.url) {
    const settings = await loadSettings();
    const blockLists = await loadBlockLists();

    if (shouldBlockUrl(tab.url, blockLists, settings)) {
      chrome.tabs.update(tabId, {
        url: chrome.runtime.getURL('blocked.html') + '?url=' + encodeURIComponent(tab.url),
      });

      await updateStats(tab.url);
    }
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_URL') {
    loadSettings().then(async (settings) => {
      const blockLists = await loadBlockLists();
      const blocked = shouldBlockUrl(message.url, blockLists, settings);
      sendResponse({ blocked });
    });
    return true; // Keep channel open for async response
  }
});

// Initialize default block lists on install
chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.local.get(['blockLists']);

  if (!result.blockLists) {
    const { DEFAULT_LISTS } = await import('../types/blocker');
    await chrome.storage.local.set({ blockLists: DEFAULT_LISTS });
  }

  console.log('Website Blocker Extension installed');
});
