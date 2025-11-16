// 已知追蹤器域名列表
export const TRACKER_DOMAINS = [
  // Google Analytics & Tag Manager
  'google-analytics.com',
  'googletagmanager.com',
  'googleadservices.com',
  'doubleclick.net',
  'googlesyndication.com',

  // Facebook Tracking
  'facebook.com/tr',
  'facebook.net',
  'connect.facebook.net',

  // Advertising Networks
  'ads.yahoo.com',
  'advertising.com',
  'adnxs.com',
  'adsystem.com',
  'criteo.com',
  'taboola.com',
  'outbrain.com',

  // Analytics Services
  'scorecardresearch.com',
  'quantserve.com',
  'omniture.com',
  'chartbeat.com',
  'newrelic.com',
  'hotjar.com',
  'mouseflow.com',
  'crazyegg.com',

  // Social Media Trackers
  'twitter.com/i/adsct',
  'linkedin.com/px',
  'pinterest.com/ct',
  'snapchat.com/tr',

  // Third-party trackers
  'mixpanel.com',
  'segment.com',
  'amplitude.com',
  'heap.io',
  'fullstory.com'
];

export const TRACKER_CATEGORIES = {
  analytics: ['google-analytics.com', 'mixpanel.com', 'segment.com'],
  advertising: ['doubleclick.net', 'criteo.com', 'taboola.com'],
  social: ['facebook.net', 'twitter.com', 'linkedin.com'],
  performance: ['newrelic.com', 'chartbeat.com']
};
