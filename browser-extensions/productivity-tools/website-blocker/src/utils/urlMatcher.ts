export function urlMatchesPattern(url: string, pattern: string, blockSubdomains: boolean = true): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Remove www. prefix
    const cleanHostname = hostname.replace(/^www\./, '');
    const cleanPattern = pattern.replace(/^www\./, '');

    // Exact match
    if (cleanHostname === cleanPattern) {
      return true;
    }

    // Subdomain match
    if (blockSubdomains && cleanHostname.endsWith('.' + cleanPattern)) {
      return true;
    }

    // Pattern includes wildcard
    if (cleanPattern.includes('*')) {
      const regex = new RegExp('^' + cleanPattern.replace(/\*/g, '.*') + '$');
      return regex.test(cleanHostname);
    }

    return false;
  } catch (error) {
    console.error('URL parsing error:', error);
    return false;
  }
}

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (error) {
    return url;
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
}

export function normalizeUrl(url: string): string {
  // Remove protocol
  url = url.replace(/^https?:\/\//, '');

  // Remove www
  url = url.replace(/^www\./, '');

  // Remove trailing slash
  url = url.replace(/\/$/, '');

  // Remove path (keep only domain)
  const slashIndex = url.indexOf('/');
  if (slashIndex !== -1) {
    url = url.substring(0, slashIndex);
  }

  return url;
}
