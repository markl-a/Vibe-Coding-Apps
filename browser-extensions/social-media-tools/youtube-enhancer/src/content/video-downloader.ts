/**
 * YouTube 影片下載器
 */

export interface VideoInfo {
  videoId: string;
  title: string;
  author: string;
  duration: number;
  formats: any[];
}

export class VideoDownloader {
  /**
   * 添加下載按鈕
   */
  addDownloadButton(): void {
    const observer = new MutationObserver(() => {
      const controls = document.querySelector('#top-level-buttons-computed');
      if (controls && !document.getElementById('youtube-download-btn')) {
        const button = this.createDownloadButton();
        controls.appendChild(button);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * 創建下載按鈕
   */
  private createDownloadButton(): HTMLElement {
    const button = document.createElement('button');
    button.id = 'youtube-download-btn';
    button.className = 'yt-spec-button-shape-next';
    button.innerHTML = `
      <svg height="24" width="24" viewBox="0 0 24 24">
        <path d="M12 16L7 11L8.4 9.6L11 12.2V4H13V12.2L15.6 9.6L17 11L12 16Z" fill="currentColor"/>
        <path d="M20 18H4V20H20V18Z" fill="currentColor"/>
      </svg>
      <span style="margin-left: 8px;">下載</span>
    `;

    button.addEventListener('click', () => {
      this.showDownloadOptions();
    });

    return button;
  }

  /**
   * 顯示下載選項
   */
  private showDownloadOptions(): void {
    // 創建下載選項彈窗
    const modal = document.createElement('div');
    modal.id = 'youtube-download-modal';
    modal.innerHTML = `
      <div class="download-modal-content">
        <h3>選擇畫質</h3>
        <div class="quality-options">
          <button data-quality="1080p">1080p</button>
          <button data-quality="720p">720p</button>
          <button data-quality="480p">480p</button>
          <button data-quality="360p">360p</button>
          <button data-quality="audio">僅音訊 (MP3)</button>
        </div>
        <button id="close-modal">關閉</button>
      </div>
    `;

    document.body.appendChild(modal);

    // 綁定事件
    modal.querySelectorAll('[data-quality]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const quality = (e.target as HTMLElement).dataset.quality!;
        this.downloadVideo(quality);
        modal.remove();
      });
    });

    modal.querySelector('#close-modal')?.addEventListener('click', () => {
      modal.remove();
    });
  }

  /**
   * 下載影片
   */
  private async downloadVideo(quality: string): Promise<void> {
    try {
      const videoInfo = this.getVideoInfo();

      chrome.runtime.sendMessage({
        type: 'DOWNLOAD_VIDEO',
        videoId: videoInfo.videoId,
        quality: quality,
        title: videoInfo.title
      });
    } catch (error) {
      console.error('下載失敗:', error);
      alert('下載失敗，請稍後再試');
    }
  }

  /**
   * 獲取影片資訊
   */
  private getVideoInfo(): VideoInfo {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v') || '';

    const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer');
    const title = titleElement?.textContent?.trim() || 'video';

    const authorElement = document.querySelector('ytd-channel-name a');
    const author = authorElement?.textContent?.trim() || 'unknown';

    return {
      videoId,
      title,
      author,
      duration: 0,
      formats: []
    };
  }

  /**
   * 提取影片 ID
   */
  private extractVideoId(): string {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v') || '';
  }
}
