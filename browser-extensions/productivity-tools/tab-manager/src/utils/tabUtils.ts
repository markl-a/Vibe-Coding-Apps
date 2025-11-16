export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return 'Unknown';
  }
}

export function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
  } catch {
    return '';
  }
}

export async function getAllTabs(scope: 'current' | 'all' = 'current'): Promise<chrome.tabs.Tab[]> {
  if (scope === 'current') {
    const currentWindow = await chrome.windows.getCurrent();
    return await chrome.tabs.query({ windowId: currentWindow.id });
  } else {
    return await chrome.tabs.query({});
  }
}

export async function closeTab(tabId: number): Promise<void> {
  await chrome.tabs.remove(tabId);
}

export async function switchToTab(tabId: number): Promise<void> {
  await chrome.tabs.update(tabId, { active: true });
  const tab = await chrome.tabs.get(tabId);
  if (tab.windowId) {
    await chrome.windows.update(tab.windowId, { focused: true });
  }
}

export async function findDuplicateTabs(): Promise<Map<string, chrome.tabs.Tab[]>> {
  const tabs = await chrome.tabs.query({});
  const urlMap = new Map<string, chrome.tabs.Tab[]>();

  tabs.forEach(tab => {
    if (tab.url) {
      const existing = urlMap.get(tab.url) || [];
      existing.push(tab);
      urlMap.set(tab.url, existing);
    }
  });

  // Filter to only duplicates
  const duplicates = new Map<string, chrome.tabs.Tab[]>();
  urlMap.forEach((tabList, url) => {
    if (tabList.length > 1) {
      duplicates.set(url, tabList);
    }
  });

  return duplicates;
}

export async function closeDuplicates(keepFirst: boolean = true): Promise<number> {
  const duplicates = await findDuplicateTabs();
  let closedCount = 0;

  for (const [url, tabs] of duplicates) {
    const tabsToClose = keepFirst ? tabs.slice(1) : tabs.slice(0, -1);
    for (const tab of tabsToClose) {
      if (tab.id) {
        await closeTab(tab.id);
        closedCount++;
      }
    }
  }

  return closedCount;
}
