/**
 * Twitter 主題管理器
 */

export interface Theme {
  name: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  accentColor?: string;
}

export class ThemeManager {
  private currentTheme: Theme | null = null;

  /**
   * 載入並應用主題
   */
  async loadAndApplyTheme(themeName: string): Promise<void> {
    const themes = this.getDefaultThemes();
    const theme = themes[themeName];

    if (theme) {
      this.applyTheme(theme);
    }
  }

  /**
   * 應用主題
   */
  applyTheme(theme: Theme): void {
    this.currentTheme = theme;

    // 創建或更新樣式標籤
    let styleElement = document.getElementById('twitter-enhancer-theme') as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'twitter-enhancer-theme';
      document.head.appendChild(styleElement);
    }

    // 生成 CSS
    styleElement.textContent = this.generateThemeCSS(theme);

    // 儲存當前主題
    chrome.storage.local.set({ currentTheme: theme.name });
  }

  /**
   * 移除主題
   */
  removeTheme(): void {
    const styleElement = document.getElementById('twitter-enhancer-theme');
    if (styleElement) {
      styleElement.remove();
    }
    this.currentTheme = null;
  }

  /**
   * 生成主題 CSS
   */
  private generateThemeCSS(theme: Theme): string {
    return `
      /* Twitter Enhancer Custom Theme */
      :root {
        --twitter-enhancer-primary: ${theme.primaryColor} !important;
        --twitter-enhancer-bg: ${theme.backgroundColor} !important;
        --twitter-enhancer-text: ${theme.textColor} !important;
        --twitter-enhancer-border: ${theme.borderColor} !important;
        --twitter-enhancer-accent: ${theme.accentColor || theme.primaryColor} !important;
      }

      /* 應用到 Twitter 元素 */
      [data-testid="primaryColumn"],
      [data-testid="sidebarColumn"] {
        background-color: var(--twitter-enhancer-bg) !important;
      }

      article[data-testid="tweet"] {
        background-color: var(--twitter-enhancer-bg) !important;
        border-color: var(--twitter-enhancer-border) !important;
        color: var(--twitter-enhancer-text) !important;
      }

      /* 按鈕顏色 */
      [role="button"][data-testid*="like"],
      [role="button"][data-testid*="retweet"],
      [role="button"][data-testid*="reply"] {
        color: var(--twitter-enhancer-text) !important;
      }

      /* 連結顏色 */
      a {
        color: var(--twitter-enhancer-primary) !important;
      }

      /* 主要按鈕 */
      [data-testid="tweetButton"],
      [data-testid="tweetButtonInline"] {
        background-color: var(--twitter-enhancer-primary) !important;
      }
    `;
  }

  /**
   * 取得預設主題
   */
  getDefaultThemes(): Record<string, Theme> {
    return {
      dark: {
        name: 'dark',
        primaryColor: '#1d9bf0',
        backgroundColor: '#000000',
        textColor: '#e7e9ea',
        borderColor: '#2f3336',
        accentColor: '#1d9bf0'
      },
      light: {
        name: 'light',
        primaryColor: '#1d9bf0',
        backgroundColor: '#ffffff',
        textColor: '#0f1419',
        borderColor: '#eff3f4',
        accentColor: '#1d9bf0'
      },
      dim: {
        name: 'dim',
        primaryColor: '#1d9bf0',
        backgroundColor: '#15202b',
        textColor: '#ffffff',
        borderColor: '#38444d',
        accentColor: '#1d9bf0'
      },
      blue: {
        name: 'blue',
        primaryColor: '#4a9eff',
        backgroundColor: '#0a1929',
        textColor: '#e3f2fd',
        borderColor: '#1e3a5f',
        accentColor: '#64b5f6'
      },
      purple: {
        name: 'purple',
        primaryColor: '#9c27b0',
        backgroundColor: '#1a0a1f',
        textColor: '#f3e5f5',
        borderColor: '#4a1f5c',
        accentColor: '#ba68c8'
      },
      green: {
        name: 'green',
        primaryColor: '#00c853',
        backgroundColor: '#0a1f14',
        textColor: '#e8f5e9',
        borderColor: '#1f5c3a',
        accentColor: '#69f0ae'
      }
    };
  }

  /**
   * 取得當前主題
   */
  getCurrentTheme(): Theme | null {
    return this.currentTheme;
  }
}
