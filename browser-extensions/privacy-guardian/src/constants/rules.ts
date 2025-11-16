// DeclarativeNetRequest 規則
export const TRACKER_BLOCKING_RULES = [
  {
    id: 1,
    priority: 1,
    action: { type: 'block' as const },
    condition: {
      urlFilter: '*google-analytics.com/*',
      resourceTypes: ['script' as const, 'xmlhttprequest' as const]
    }
  },
  {
    id: 2,
    priority: 1,
    action: { type: 'block' as const },
    condition: {
      urlFilter: '*doubleclick.net/*',
      resourceTypes: ['script' as const, 'image' as const]
    }
  },
  {
    id: 3,
    priority: 1,
    action: { type: 'block' as const },
    condition: {
      urlFilter: '*facebook.com/tr*',
      resourceTypes: ['script' as const, 'xmlhttprequest' as const]
    }
  }
];

export const HTTPS_UPGRADE_RULES = [
  {
    id: 100,
    priority: 1,
    action: {
      type: 'redirect' as const,
      redirect: { regexSubstitution: 'https://\\1' }
    },
    condition: {
      regexFilter: '^http://(.*)$',
      resourceTypes: ['main_frame' as const]
    }
  }
];
