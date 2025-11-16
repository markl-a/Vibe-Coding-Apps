/**
 * 媒體提取器
 * 從 Instagram 頁面中提取圖片和影片 URL
 */

export interface MediaInfo {
  type: 'image' | 'video';
  url: string;
  filename: string;
  thumbnail?: string;
}

export class MediaExtractor {
  /**
   * 從 Instagram 貼文中提取媒體 URL
   */
  extractMediaFromPost(postElement: HTMLElement): MediaInfo[] {
    const mediaList: MediaInfo[] = [];

    // 方法 1: 提取圖片
    const images = postElement.querySelectorAll('img[src*="instagram"]');
    images.forEach(img => {
      const src = (img as HTMLImageElement).src;
      if (src && !this.isProfileImage(src) && !this.isDuplicate(mediaList, src)) {
        mediaList.push({
          type: 'image',
          url: this.getHighQualityUrl(src),
          filename: this.generateFilename('image', 'jpg')
        });
      }
    });

    // 方法 2: 提取影片
    const videos = postElement.querySelectorAll('video');
    videos.forEach(video => {
      const src = (video as HTMLVideoElement).src ||
                  video.querySelector('source')?.getAttribute('src');
      if (src && !this.isDuplicate(mediaList, src)) {
        mediaList.push({
          type: 'video',
          url: src,
          filename: this.generateFilename('video', 'mp4'),
          thumbnail: this.extractVideoThumbnail(video as HTMLVideoElement)
        });
      }
    });

    // 方法 3: 從 JSON 資料中提取（備用方法）
    if (mediaList.length === 0) {
      const jsonMedia = this.extractFromJSON(postElement);
      if (jsonMedia.length > 0) {
        mediaList.push(...jsonMedia);
      }
    }

    return mediaList;
  }

  /**
   * 從 Story 中提取媒體
   */
  extractMediaFromStory(): MediaInfo | null {
    // Story 影片
    const storyVideo = document.querySelector('video[class*="Story"]') as HTMLVideoElement;
    if (storyVideo) {
      return {
        type: 'video',
        url: storyVideo.src,
        filename: this.generateFilename('story', 'mp4')
      };
    }

    // Story 圖片
    const storyImage = document.querySelector('img[class*="Story"]') as HTMLImageElement;
    if (storyImage) {
      return {
        type: 'image',
        url: this.getHighQualityUrl(storyImage.src),
        filename: this.generateFilename('story', 'jpg')
      };
    }

    return null;
  }

  /**
   * 從 Reel 中提取媒體
   */
  extractMediaFromReel(reelElement: HTMLElement): MediaInfo | null {
    const video = reelElement.querySelector('video') as HTMLVideoElement;
    if (video) {
      return {
        type: 'video',
        url: video.src,
        filename: this.generateFilename('reel', 'mp4')
      };
    }
    return null;
  }

  /**
   * 從 JSON 資料中提取媒體（進階方法）
   */
  private extractFromJSON(element: HTMLElement): MediaInfo[] {
    const mediaList: MediaInfo[] = [];

    try {
      // 嘗試從頁面腳本中找到 JSON 資料
      const scripts = document.querySelectorAll('script[type="application/json"]');

      scripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent || '');
          // 遞迴搜尋 display_url 和 video_url
          this.searchForMediaUrls(data, mediaList);
        } catch (e) {
          // 忽略解析錯誤
        }
      });
    } catch (error) {
      console.error('JSON 提取失敗:', error);
    }

    return mediaList;
  }

  /**
   * 遞迴搜尋媒體 URL
   */
  private searchForMediaUrls(obj: any, mediaList: MediaInfo[]): void {
    if (!obj || typeof obj !== 'object') return;

    // 檢查是否有 display_url（圖片）
    if (obj.display_url && typeof obj.display_url === 'string') {
      if (!this.isDuplicate(mediaList, obj.display_url)) {
        mediaList.push({
          type: 'image',
          url: obj.display_url,
          filename: this.generateFilename('image', 'jpg')
        });
      }
    }

    // 檢查是否有 video_url（影片）
    if (obj.video_url && typeof obj.video_url === 'string') {
      if (!this.isDuplicate(mediaList, obj.video_url)) {
        mediaList.push({
          type: 'video',
          url: obj.video_url,
          filename: this.generateFilename('video', 'mp4')
        });
      }
    }

    // 遞迴搜尋子物件
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        this.searchForMediaUrls(obj[key], mediaList);
      }
    }
  }

  /**
   * 獲取高畫質 URL
   */
  private getHighQualityUrl(url: string): string {
    // Instagram 圖片 URL 通常包含尺寸參數
    // 移除尺寸限制以獲取最高畫質
    return url.replace(/\/([a-z])([0-9]+)x([0-9]+)\//g, '/s0x0/');
  }

  /**
   * 提取影片縮圖
   */
  private extractVideoThumbnail(video: HTMLVideoElement): string | undefined {
    return video.poster || undefined;
  }

  /**
   * 檢查是否為個人頭像
   */
  private isProfileImage(url: string): boolean {
    return url.includes('/profile/') || url.includes('profile_pic');
  }

  /**
   * 檢查是否重複
   */
  private isDuplicate(mediaList: MediaInfo[], url: string): boolean {
    return mediaList.some(media => media.url === url);
  }

  /**
   * 生成檔案名稱
   */
  private generateFilename(type: string, extension: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `instagram_${type}_${timestamp}_${random}.${extension}`;
  }
}
