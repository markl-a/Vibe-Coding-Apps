/**
 * Content Extraction Example
 *
 * Demonstrates how to extract content from web pages, parse media URLs,
 * and handle dynamic content in social media platforms.
 */

// ============================================================================
// Example 1: Basic Content Extraction
// ============================================================================

/**
 * Extract all text content from a page
 */
function extractTextContent(): string {
  return document.body.innerText;
}

/**
 * Extract all links from a page
 */
function extractLinks(): string[] {
  const links = Array.from(document.querySelectorAll('a[href]'));
  return links.map(link => (link as HTMLAnchorElement).href);
}

/**
 * Extract metadata from page
 */
function extractMetadata(): {
  title: string;
  description: string;
  keywords: string;
  author: string;
  ogImage: string;
} {
  const getMetaContent = (name: string): string => {
    const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    return meta?.getAttribute('content') || '';
  };

  return {
    title: document.title,
    description: getMetaContent('description') || getMetaContent('og:description'),
    keywords: getMetaContent('keywords'),
    author: getMetaContent('author'),
    ogImage: getMetaContent('og:image')
  };
}

// ============================================================================
// Example 2: Image Extraction
// ============================================================================

/**
 * Image data interface
 */
interface ImageData {
  src: string;
  alt: string;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
}

/**
 * Extract all images from page
 */
function extractImages(minWidth: number = 0, minHeight: number = 0): ImageData[] {
  const images = Array.from(document.querySelectorAll('img'));

  return images
    .filter(img => img.naturalWidth >= minWidth && img.naturalHeight >= minHeight)
    .map(img => ({
      src: img.src,
      alt: img.alt,
      width: img.width,
      height: img.height,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    }));
}

/**
 * Extract background images from CSS
 */
function extractBackgroundImages(): string[] {
  const elements = Array.from(document.querySelectorAll('*'));
  const bgImages: string[] = [];

  elements.forEach(element => {
    const style = window.getComputedStyle(element);
    const bgImage = style.backgroundImage;

    if (bgImage && bgImage !== 'none') {
      const urls = bgImage.match(/url\(['"]?([^'"()]+)['"]?\)/g);
      if (urls) {
        urls.forEach(url => {
          const match = url.match(/url\(['"]?([^'"()]+)['"]?\)/);
          if (match && match[1]) {
            bgImages.push(match[1]);
          }
        });
      }
    }
  });

  return Array.from(new Set(bgImages));
}

// ============================================================================
// Example 3: Video Extraction
// ============================================================================

/**
 * Video data interface
 */
interface VideoData {
  src: string;
  poster: string;
  width: number;
  height: number;
  duration: number;
  type: string;
}

/**
 * Extract video elements
 */
function extractVideos(): VideoData[] {
  const videos = Array.from(document.querySelectorAll('video'));

  return videos.map(video => ({
    src: video.src || (video.querySelector('source')?.src || ''),
    poster: video.poster,
    width: video.videoWidth,
    height: video.videoHeight,
    duration: video.duration,
    type: video.querySelector('source')?.type || ''
  }));
}

/**
 * Extract YouTube video URLs
 */
function extractYouTubeVideos(): string[] {
  const videoIds: string[] = [];

  // From iframe embeds
  const iframes = Array.from(document.querySelectorAll('iframe[src*="youtube.com"]'));
  iframes.forEach(iframe => {
    const src = iframe.getAttribute('src');
    const match = src?.match(/(?:embed\/|v=)([a-zA-Z0-9_-]{11})/);
    if (match) {
      videoIds.push(match[1]);
    }
  });

  // From links
  const links = Array.from(document.querySelectorAll('a[href*="youtube.com"], a[href*="youtu.be"]'));
  links.forEach(link => {
    const href = link.getAttribute('href');
    const match = href?.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) {
      videoIds.push(match[1]);
    }
  });

  return Array.from(new Set(videoIds));
}

// ============================================================================
// Example 4: Social Media Post Extraction
// ============================================================================

/**
 * Social media post interface
 */
interface SocialPost {
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  images: string[];
  videos: string[];
  url: string;
}

/**
 * Extract Twitter/X posts
 */
function extractTwitterPosts(): SocialPost[] {
  const posts: SocialPost[] = [];
  const articles = document.querySelectorAll('article[data-testid="tweet"]');

  articles.forEach(article => {
    try {
      const author = article.querySelector('[data-testid="User-Name"]')?.textContent || '';
      const content = article.querySelector('[data-testid="tweetText"]')?.textContent || '';
      const timestamp = article.querySelector('time')?.getAttribute('datetime') || '';

      const images = Array.from(article.querySelectorAll('img[src*="media"]'))
        .map(img => (img as HTMLImageElement).src);

      const videos = Array.from(article.querySelectorAll('video'))
        .map(video => video.src);

      const link = article.querySelector('a[href*="/status/"]');
      const url = link ? (link as HTMLAnchorElement).href : '';

      posts.push({
        author,
        content,
        timestamp,
        likes: 0, // Would need to parse from UI
        comments: 0,
        shares: 0,
        images,
        videos,
        url
      });
    } catch (error) {
      console.error('Error extracting post:', error);
    }
  });

  return posts;
}

/**
 * Extract Instagram posts
 */
function extractInstagramPosts(): SocialPost[] {
  const posts: SocialPost[] = [];
  const articles = document.querySelectorAll('article');

  articles.forEach(article => {
    try {
      const author = article.querySelector('header a')?.textContent || '';
      const content = article.querySelector('ul li span')?.textContent || '';
      const timestamp = article.querySelector('time')?.getAttribute('datetime') || '';

      const images = Array.from(article.querySelectorAll('img[src*="cdninstagram"]'))
        .map(img => (img as HTMLImageElement).src);

      const videos = Array.from(article.querySelectorAll('video'))
        .map(video => video.src);

      const link = article.querySelector('a[href*="/p/"]');
      const url = link ? (link as HTMLAnchorElement).href : '';

      posts.push({
        author,
        content,
        timestamp,
        likes: 0,
        comments: 0,
        shares: 0,
        images,
        videos,
        url
      });
    } catch (error) {
      console.error('Error extracting post:', error);
    }
  });

  return posts;
}

// ============================================================================
// Example 5: Handle Dynamic Content
// ============================================================================

/**
 * Content observer for dynamic content
 */
class ContentObserver {
  private observer: MutationObserver;
  private callbacks: Map<string, (element: Element) => void> = new Map();

  constructor() {
    this.observer = new MutationObserver(this.handleMutations.bind(this));
  }

  /**
   * Start observing for new content
   */
  start(selector: string, callback: (element: Element) => void): void {
    this.callbacks.set(selector, callback);

    // Process existing elements
    document.querySelectorAll(selector).forEach(callback);

    // Observe future additions
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Stop observing
   */
  stop(): void {
    this.observer.disconnect();
    this.callbacks.clear();
  }

  /**
   * Handle mutations
   */
  private handleMutations(mutations: MutationRecord[]): void {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;

          this.callbacks.forEach((callback, selector) => {
            if (element.matches(selector)) {
              callback(element);
            }
            element.querySelectorAll(selector).forEach(callback);
          });
        }
      });
    });
  }
}

// Usage example
const observer = new ContentObserver();
observer.start('img[src]', (img) => {
  console.log('New image detected:', (img as HTMLImageElement).src);
});

// ============================================================================
// Example 6: Infinite Scroll Handler
// ============================================================================

/**
 * Infinite scroll detector
 */
class InfiniteScrollHandler {
  private callback: () => void;
  private isLoading: boolean = false;
  private threshold: number;

  constructor(callback: () => void, threshold: number = 500) {
    this.callback = callback;
    this.threshold = threshold;
    this.setupScrollListener();
  }

  /**
   * Setup scroll event listener
   */
  private setupScrollListener(): void {
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
  }

  /**
   * Handle scroll event
   */
  private handleScroll(): void {
    if (this.isLoading) return;

    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollHeight - scrollTop - clientHeight < this.threshold) {
      this.isLoading = true;
      this.callback();

      // Reset after delay
      setTimeout(() => {
        this.isLoading = false;
      }, 1000);
    }
  }

  /**
   * Destroy handler
   */
  destroy(): void {
    window.removeEventListener('scroll', this.handleScroll.bind(this));
  }
}

// ============================================================================
// Example 7: Parse Media URLs
// ============================================================================

/**
 * Media URL parser
 */
class MediaURLParser {
  /**
   * Parse Instagram media URL
   */
  static parseInstagramURL(url: string): {
    type: 'image' | 'video';
    quality: string;
    cdnUrl: string;
  } | null {
    const match = url.match(/cdninstagram\.com\/([^?]+)/);
    if (!match) return null;

    return {
      type: url.includes('/v/') ? 'video' : 'image',
      quality: url.includes('_n.') ? 'normal' : 'high',
      cdnUrl: url
    };
  }

  /**
   * Parse YouTube thumbnail URL
   */
  static getYouTubeThumbnail(videoId: string, quality: 'default' | 'hq' | 'mq' | 'sd' | 'maxres' = 'maxres'): string {
    return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
  }

  /**
   * Parse Twitter media URL to get highest quality
   */
  static getTwitterHighQualityURL(url: string): string {
    // Remove format and name parameters for highest quality
    return url.split('?')[0] + '?format=jpg&name=large';
  }

  /**
   * Extract video ID from various platforms
   */
  static extractVideoId(url: string): { platform: string; id: string } | null {
    // YouTube
    let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) return { platform: 'youtube', id: match[1] };

    // Vimeo
    match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return { platform: 'vimeo', id: match[1] };

    // TikTok
    match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    if (match) return { platform: 'tiktok', id: match[1] };

    return null;
  }

  /**
   * Convert relative URL to absolute
   */
  static toAbsoluteURL(relativeUrl: string, baseUrl: string = window.location.href): string {
    try {
      return new URL(relativeUrl, baseUrl).href;
    } catch {
      return relativeUrl;
    }
  }
}

// ============================================================================
// Example 8: Complete Content Extractor
// ============================================================================

/**
 * Complete page content
 */
interface PageContent {
  metadata: ReturnType<typeof extractMetadata>;
  text: string;
  links: string[];
  images: ImageData[];
  videos: VideoData[];
  socialPosts: SocialPost[];
}

/**
 * Extract all content from page
 */
async function extractAllContent(): Promise<PageContent> {
  // Wait for dynamic content to load
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    metadata: extractMetadata(),
    text: extractTextContent(),
    links: extractLinks(),
    images: extractImages(100, 100), // Min 100x100
    videos: extractVideos(),
    socialPosts: []
  };
}

/**
 * Send extracted content to background script
 */
async function sendToBackground(content: PageContent): Promise<void> {
  await chrome.runtime.sendMessage({
    type: 'CONTENT_EXTRACTED',
    content
  });
}

// ============================================================================
// Example 9: Usage in Content Script
// ============================================================================

// Extract content when page loads
window.addEventListener('load', async () => {
  const content = await extractAllContent();
  console.log('Extracted content:', content);
  await sendToBackground(content);
});

// Watch for new images
const imageObserver = new ContentObserver();
imageObserver.start('img[src]', (img) => {
  const imageData = {
    src: (img as HTMLImageElement).src,
    alt: (img as HTMLImageElement).alt
  };
  console.log('New image:', imageData);
});

// Handle infinite scroll
const scrollHandler = new InfiniteScrollHandler(() => {
  console.log('Near bottom of page, loading more content...');
});

export {
  extractTextContent,
  extractLinks,
  extractMetadata,
  extractImages,
  extractBackgroundImages,
  extractVideos,
  extractYouTubeVideos,
  extractTwitterPosts,
  extractInstagramPosts,
  ContentObserver,
  InfiniteScrollHandler,
  MediaURLParser,
  extractAllContent,
  ImageData,
  VideoData,
  SocialPost,
  PageContent
};
