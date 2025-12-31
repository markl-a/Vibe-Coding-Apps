/**
 * Download Manager Example
 *
 * Demonstrates how to download files, track progress, and handle batch downloads
 * using Chrome Extension Download API.
 */

// ============================================================================
// Example 1: Basic File Download
// ============================================================================

/**
 * Download options interface
 */
interface DownloadOptions {
  url: string;
  filename?: string;
  saveAs?: boolean;
  conflictAction?: 'uniquify' | 'overwrite' | 'prompt';
}

/**
 * Download a file
 */
async function downloadFile(options: DownloadOptions): Promise<number> {
  const downloadId = await chrome.downloads.download({
    url: options.url,
    filename: options.filename,
    saveAs: options.saveAs || false,
    conflictAction: options.conflictAction || 'uniquify'
  });

  console.log(`Download started with ID: ${downloadId}`);
  return downloadId;
}

/**
 * Download from URL with custom filename
 */
async function downloadWithName(url: string, filename: string): Promise<number> {
  return downloadFile({ url, filename });
}

/**
 * Download and show save dialog
 */
async function downloadWithDialog(url: string): Promise<number> {
  return downloadFile({ url, saveAs: true });
}

// ============================================================================
// Example 2: Download Progress Tracking
// ============================================================================

/**
 * Download progress callback type
 */
type ProgressCallback = (progress: number, downloadId: number) => void;

/**
 * Download with progress tracking
 */
class DownloadTracker {
  private downloads: Map<number, ProgressCallback> = new Map();

  constructor() {
    this.setupListeners();
  }

  /**
   * Setup download event listeners
   */
  private setupListeners(): void {
    chrome.downloads.onChanged.addListener((delta) => {
      this.handleDownloadChanged(delta);
    });
  }

  /**
   * Handle download state changes
   */
  private handleDownloadChanged(delta: chrome.downloads.DownloadDelta): void {
    const downloadId = delta.id;
    const callback = this.downloads.get(downloadId);

    if (!callback) return;

    // Handle progress changes
    if (delta.state) {
      if (delta.state.current === 'complete') {
        callback(100, downloadId);
        this.downloads.delete(downloadId);
        console.log(`Download ${downloadId} completed`);
      } else if (delta.state.current === 'interrupted') {
        console.error(`Download ${downloadId} interrupted`);
        this.downloads.delete(downloadId);
      }
    }

    // Calculate progress from bytesReceived
    if (delta.bytesReceived) {
      this.updateProgress(downloadId);
    }
  }

  /**
   * Update download progress
   */
  private async updateProgress(downloadId: number): Promise<void> {
    const callback = this.downloads.get(downloadId);
    if (!callback) return;

    const [download] = await chrome.downloads.search({ id: downloadId });

    if (download && download.totalBytes > 0) {
      const progress = (download.bytesReceived / download.totalBytes) * 100;
      callback(progress, downloadId);
    }
  }

  /**
   * Start tracking download
   */
  async download(url: string, filename: string, onProgress: ProgressCallback): Promise<number> {
    const downloadId = await downloadFile({ url, filename });
    this.downloads.set(downloadId, onProgress);

    // Initial progress update
    setTimeout(() => this.updateProgress(downloadId), 100);

    return downloadId;
  }

  /**
   * Stop tracking download
   */
  stopTracking(downloadId: number): void {
    this.downloads.delete(downloadId);
  }
}

// ============================================================================
// Example 3: Batch Download Manager
// ============================================================================

/**
 * Batch download item
 */
interface BatchDownloadItem {
  url: string;
  filename: string;
  status: 'pending' | 'downloading' | 'complete' | 'error';
  progress: number;
  downloadId?: number;
  error?: string;
}

/**
 * Batch download manager
 */
class BatchDownloadManager {
  private items: BatchDownloadItem[] = [];
  private concurrent: number = 3;
  private activeDownloads: number = 0;
  private tracker: DownloadTracker;

  constructor(concurrent: number = 3) {
    this.concurrent = concurrent;
    this.tracker = new DownloadTracker();
  }

  /**
   * Add item to batch
   */
  addItem(url: string, filename: string): void {
    this.items.push({
      url,
      filename,
      status: 'pending',
      progress: 0
    });
  }

  /**
   * Add multiple items
   */
  addItems(items: Array<{ url: string; filename: string }>): void {
    items.forEach(item => this.addItem(item.url, item.filename));
  }

  /**
   * Start batch download
   */
  async start(): Promise<void> {
    console.log(`Starting batch download of ${this.items.length} items`);
    await this.processQueue();
  }

  /**
   * Process download queue
   */
  private async processQueue(): Promise<void> {
    while (this.hasItemsToDownload()) {
      if (this.activeDownloads < this.concurrent) {
        const item = this.getNextPendingItem();
        if (item) {
          await this.downloadItem(item);
        }
      } else {
        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Wait for all active downloads to complete
    while (this.activeDownloads > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('Batch download complete');
  }

  /**
   * Download single item
   */
  private async downloadItem(item: BatchDownloadItem): Promise<void> {
    this.activeDownloads++;
    item.status = 'downloading';

    try {
      item.downloadId = await this.tracker.download(
        item.url,
        item.filename,
        (progress, downloadId) => {
          item.progress = progress;

          if (progress === 100) {
            item.status = 'complete';
            this.activeDownloads--;
          }

          this.onProgress();
        }
      );
    } catch (error) {
      item.status = 'error';
      item.error = error instanceof Error ? error.message : 'Unknown error';
      this.activeDownloads--;
      console.error(`Download failed for ${item.filename}:`, error);
    }
  }

  /**
   * Check if there are items to download
   */
  private hasItemsToDownload(): boolean {
    return this.items.some(item => item.status === 'pending');
  }

  /**
   * Get next pending item
   */
  private getNextPendingItem(): BatchDownloadItem | undefined {
    return this.items.find(item => item.status === 'pending');
  }

  /**
   * Get overall progress
   */
  getProgress(): number {
    if (this.items.length === 0) return 0;

    const totalProgress = this.items.reduce((sum, item) => sum + item.progress, 0);
    return totalProgress / this.items.length;
  }

  /**
   * Get download statistics
   */
  getStats(): {
    total: number;
    pending: number;
    downloading: number;
    complete: number;
    error: number;
  } {
    return {
      total: this.items.length,
      pending: this.items.filter(i => i.status === 'pending').length,
      downloading: this.items.filter(i => i.status === 'downloading').length,
      complete: this.items.filter(i => i.status === 'complete').length,
      error: this.items.filter(i => i.status === 'error').length
    };
  }

  /**
   * Progress callback
   */
  private onProgress(): void {
    const stats = this.getStats();
    console.log(`Progress: ${this.getProgress().toFixed(1)}%`, stats);
  }

  /**
   * Get all items
   */
  getItems(): BatchDownloadItem[] {
    return this.items;
  }

  /**
   * Clear completed items
   */
  clearCompleted(): void {
    this.items = this.items.filter(item => item.status !== 'complete');
  }

  /**
   * Retry failed downloads
   */
  async retryFailed(): Promise<void> {
    this.items.forEach(item => {
      if (item.status === 'error') {
        item.status = 'pending';
        item.progress = 0;
        item.error = undefined;
      }
    });

    await this.processQueue();
  }
}

// ============================================================================
// Example 4: Download Manager with UI
// ============================================================================

/**
 * Download manager with UI notifications
 */
class DownloadManagerUI {
  private batchManager: BatchDownloadManager;
  private notificationId: string = 'download-manager';

  constructor() {
    this.batchManager = new BatchDownloadManager(3);
  }

  /**
   * Download files with UI feedback
   */
  async downloadFiles(items: Array<{ url: string; filename: string }>): Promise<void> {
    this.batchManager.addItems(items);

    // Show start notification
    await this.showNotification('Download Started', `Downloading ${items.length} files...`);

    // Start downloads
    await this.batchManager.start();

    // Show completion notification
    const stats = this.batchManager.getStats();
    await this.showNotification(
      'Download Complete',
      `${stats.complete} files downloaded successfully. ${stats.error} errors.`
    );
  }

  /**
   * Show notification
   */
  private async showNotification(title: string, message: string): Promise<void> {
    await chrome.notifications.create(this.notificationId, {
      type: 'basic',
      iconUrl: 'icon.png',
      title,
      message
    });
  }

  /**
   * Get batch manager
   */
  getBatchManager(): BatchDownloadManager {
    return this.batchManager;
  }
}

// ============================================================================
// Example 5: Download Utilities
// ============================================================================

/**
 * Search for downloads
 */
async function searchDownloads(query: chrome.downloads.DownloadQuery): Promise<chrome.downloads.DownloadItem[]> {
  return await chrome.downloads.search(query);
}

/**
 * Get download by ID
 */
async function getDownload(downloadId: number): Promise<chrome.downloads.DownloadItem | undefined> {
  const results = await chrome.downloads.search({ id: downloadId });
  return results[0];
}

/**
 * Pause download
 */
async function pauseDownload(downloadId: number): Promise<void> {
  await chrome.downloads.pause(downloadId);
  console.log(`Download ${downloadId} paused`);
}

/**
 * Resume download
 */
async function resumeDownload(downloadId: number): Promise<void> {
  await chrome.downloads.resume(downloadId);
  console.log(`Download ${downloadId} resumed`);
}

/**
 * Cancel download
 */
async function cancelDownload(downloadId: number): Promise<void> {
  await chrome.downloads.cancel(downloadId);
  console.log(`Download ${downloadId} cancelled`);
}

/**
 * Remove download from history
 */
async function removeDownload(downloadId: number): Promise<void> {
  await chrome.downloads.erase({ id: downloadId });
  console.log(`Download ${downloadId} removed from history`);
}

/**
 * Open downloaded file
 */
async function openDownload(downloadId: number): Promise<void> {
  await chrome.downloads.open(downloadId);
}

/**
 * Show download in folder
 */
async function showDownloadInFolder(downloadId: number): Promise<void> {
  await chrome.downloads.show(downloadId);
}

/**
 * Get recent downloads
 */
async function getRecentDownloads(limit: number = 10): Promise<chrome.downloads.DownloadItem[]> {
  return await chrome.downloads.search({
    orderBy: ['-startTime'],
    limit
  });
}

/**
 * Get downloads by state
 */
async function getDownloadsByState(state: chrome.downloads.State): Promise<chrome.downloads.DownloadItem[]> {
  return await chrome.downloads.search({ state });
}

// ============================================================================
// Example 6: Download from Data URL
// ============================================================================

/**
 * Download from data URL or blob
 */
async function downloadFromData(data: string, filename: string, mimeType: string): Promise<number> {
  // Create blob URL if data is not already a URL
  let url: string;

  if (data.startsWith('data:')) {
    url = data;
  } else {
    const blob = new Blob([data], { type: mimeType });
    url = URL.createObjectURL(blob);
  }

  const downloadId = await chrome.downloads.download({
    url,
    filename,
    saveAs: false
  });

  // Revoke blob URL after download starts
  if (!data.startsWith('data:')) {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return downloadId;
}

/**
 * Download JSON data
 */
async function downloadJSON(data: object, filename: string): Promise<number> {
  const json = JSON.stringify(data, null, 2);
  return downloadFromData(json, filename, 'application/json');
}

/**
 * Download text file
 */
async function downloadText(text: string, filename: string): Promise<number> {
  return downloadFromData(text, filename, 'text/plain');
}

/**
 * Download CSV data
 */
async function downloadCSV(data: string[][], filename: string): Promise<number> {
  const csv = data.map(row => row.join(',')).join('\n');
  return downloadFromData(csv, filename, 'text/csv');
}

// ============================================================================
// Example 7: Image Download Helper
// ============================================================================

/**
 * Download image from URL
 */
async function downloadImage(imageUrl: string, customFilename?: string): Promise<number> {
  // Extract filename from URL if not provided
  let filename = customFilename;

  if (!filename) {
    const url = new URL(imageUrl);
    filename = url.pathname.split('/').pop() || 'image.jpg';
  }

  return downloadFile({ url: imageUrl, filename });
}

/**
 * Download all images from page
 */
async function downloadAllImages(minWidth: number = 200, minHeight: number = 200): Promise<number[]> {
  const images = Array.from(document.querySelectorAll('img'));
  const downloadIds: number[] = [];

  for (const img of images) {
    if (img.naturalWidth >= minWidth && img.naturalHeight >= minHeight) {
      try {
        const downloadId = await downloadImage(img.src);
        downloadIds.push(downloadId);
      } catch (error) {
        console.error('Failed to download image:', img.src, error);
      }
    }
  }

  return downloadIds;
}

/**
 * Download image from canvas
 */
async function downloadCanvas(canvas: HTMLCanvasElement, filename: string = 'image.png'): Promise<number> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Failed to create blob from canvas'));
        return;
      }

      const url = URL.createObjectURL(blob);

      try {
        const downloadId = await chrome.downloads.download({
          url,
          filename
        });

        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve(downloadId);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    });
  });
}

// ============================================================================
// Example 8: Usage Examples
// ============================================================================

// Example 1: Simple download
async function example1(): Promise<void> {
  const downloadId = await downloadFile({
    url: 'https://example.com/file.pdf',
    filename: 'document.pdf'
  });
  console.log('Download ID:', downloadId);
}

// Example 2: Download with progress
async function example2(): Promise<void> {
  const tracker = new DownloadTracker();

  await tracker.download(
    'https://example.com/large-file.zip',
    'download.zip',
    (progress, downloadId) => {
      console.log(`Download ${downloadId}: ${progress.toFixed(1)}%`);
    }
  );
}

// Example 3: Batch download
async function example3(): Promise<void> {
  const manager = new BatchDownloadManager(5);

  manager.addItems([
    { url: 'https://example.com/file1.jpg', filename: 'image1.jpg' },
    { url: 'https://example.com/file2.jpg', filename: 'image2.jpg' },
    { url: 'https://example.com/file3.jpg', filename: 'image3.jpg' }
  ]);

  await manager.start();

  const stats = manager.getStats();
  console.log('Download complete:', stats);
}

// Example 4: Download JSON data
async function example4(): Promise<void> {
  const data = {
    name: 'John Doe',
    email: 'john@example.com',
    items: [1, 2, 3, 4, 5]
  };

  await downloadJSON(data, 'data.json');
}

// Example 5: Download images from content script
async function example5(): Promise<void> {
  // Send message to background script to download
  const images = Array.from(document.querySelectorAll('img'))
    .slice(0, 10)
    .map(img => ({
      url: (img as HTMLImageElement).src,
      filename: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
    }));

  chrome.runtime.sendMessage({
    type: 'BATCH_DOWNLOAD',
    items: images
  });
}

// Listen for download requests in background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BATCH_DOWNLOAD') {
    const manager = new BatchDownloadManager();
    manager.addItems(message.items);
    manager.start().then(() => {
      sendResponse({ success: true, stats: manager.getStats() });
    });
    return true; // Keep channel open for async response
  }
});

export {
  downloadFile,
  downloadWithName,
  downloadWithDialog,
  DownloadTracker,
  BatchDownloadManager,
  DownloadManagerUI,
  BatchDownloadItem,
  DownloadOptions,
  searchDownloads,
  getDownload,
  pauseDownload,
  resumeDownload,
  cancelDownload,
  removeDownload,
  openDownload,
  showDownloadInFolder,
  getRecentDownloads,
  getDownloadsByState,
  downloadFromData,
  downloadJSON,
  downloadText,
  downloadCSV,
  downloadImage,
  downloadAllImages,
  downloadCanvas
};
