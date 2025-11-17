// Cookie Cleaner Background Script

// Set up alarms for automatic cookie cleaning
chrome.runtime.onInstalled.addListener(() => {
  console.log('Cookie Cleaner Pro installed');

  // Set default settings
  chrome.storage.sync.get(['cookieCleanerSettings'], (data) => {
    if (!data.cookieCleanerSettings) {
      chrome.storage.sync.set({
        cookieCleanerSettings: {
          autoClean: false,
          cleanInterval: 60, // minutes
          whitelist: [],
          cleanOnStartup: false,
          cleanOnClose: false
        }
      });
    }
  });

  // Create context menu
  chrome.contextMenus.create({
    id: 'cleanCurrentSite',
    title: '清除當前網站的 Cookies',
    contexts: ['page']
  });

  chrome.contextMenus.create({
    id: 'cleanAllCookies',
    title: '清除所有 Cookies',
    contexts: ['page']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'cleanCurrentSite') {
    cleanCurrentSiteCookies(tab.url);
  } else if (info.menuItemId === 'cleanAllCookies') {
    cleanAllCookies();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getAllCookies':
      getAllCookies().then(sendResponse);
      return true;

    case 'getCookiesForDomain':
      getCookiesForDomain(request.domain).then(sendResponse);
      return true;

    case 'deleteCookie':
      deleteCookie(request.cookie).then(sendResponse);
      return true;

    case 'deleteAllCookies':
      cleanAllCookies().then(sendResponse);
      return true;

    case 'deleteDomainCookies':
      cleanDomainCookies(request.domain).then(sendResponse);
      return true;
  }
});

// Auto-clean setup
chrome.storage.sync.get(['cookieCleanerSettings'], (data) => {
  const settings = data.cookieCleanerSettings;

  if (settings && settings.autoClean) {
    setupAutoClean(settings.cleanInterval);
  }

  if (settings && settings.cleanOnStartup) {
    cleanAllCookies();
  }
});

// Functions
async function getAllCookies() {
  try {
    const cookies = await chrome.cookies.getAll({});
    return { success: true, cookies };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getCookiesForDomain(domain) {
  try {
    const cookies = await chrome.cookies.getAll({ domain });
    return { success: true, cookies };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function deleteCookie(cookie) {
  try {
    const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
    await chrome.cookies.remove({
      url: url,
      name: cookie.name,
      storeId: cookie.storeId
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function cleanAllCookies() {
  try {
    const settings = await chrome.storage.sync.get(['cookieCleanerSettings']);
    const whitelist = settings.cookieCleanerSettings?.whitelist || [];

    const cookies = await chrome.cookies.getAll({});
    let cleanedCount = 0;

    for (const cookie of cookies) {
      // Check if domain is in whitelist
      const isWhitelisted = whitelist.some(domain =>
        cookie.domain.includes(domain) || domain.includes(cookie.domain)
      );

      if (!isWhitelisted) {
        const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
        await chrome.cookies.remove({
          url: url,
          name: cookie.name,
          storeId: cookie.storeId
        });
        cleanedCount++;
      }
    }

    console.log(`Cleaned ${cleanedCount} cookies`);
    return { success: true, count: cleanedCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function cleanCurrentSiteCookies(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    await cleanDomainCookies(domain);

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Cookie Cleaner Pro',
      message: `已清除 ${domain} 的 Cookies`
    });
  } catch (error) {
    console.error('Error cleaning site cookies:', error);
  }
}

async function cleanDomainCookies(domain) {
  try {
    const cookies = await chrome.cookies.getAll({ domain });

    for (const cookie of cookies) {
      const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
      await chrome.cookies.remove({
        url: url,
        name: cookie.name,
        storeId: cookie.storeId
      });
    }

    return { success: true, count: cookies.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function setupAutoClean(intervalMinutes) {
  // Clear existing alarms
  chrome.alarms.clear('autoCookieClean');

  // Create new alarm
  chrome.alarms.create('autoCookieClean', {
    periodInMinutes: intervalMinutes
  });

  // Listen for alarm
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'autoCookieClean') {
      cleanAllCookies();
    }
  });
}
