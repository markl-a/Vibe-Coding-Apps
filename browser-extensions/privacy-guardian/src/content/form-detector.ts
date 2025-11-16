/**
 * 表單偵測 Content Script
 * 偵測登入表單並提供密碼自動填寫功能
 */

interface FormData {
  usernameField: HTMLInputElement | null;
  passwordField: HTMLInputElement | null;
  form: HTMLFormElement | null;
}

class FormDetector {
  private formData: FormData | null = null;
  private fillButton: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    // 頁面載入完成後偵測表單
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.detectForms());
    } else {
      this.detectForms();
    }

    // 監聽來自背景腳本的訊息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'fillPasswordData') {
        this.fillPassword(request.data);
        sendResponse({ success: true });
      }
    });

    // 監聽動態載入的表單
    const observer = new MutationObserver(() => {
      this.detectForms();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private detectForms(): void {
    const forms = document.querySelectorAll('form');

    forms.forEach((form) => {
      const passwordField = form.querySelector<HTMLInputElement>(
        'input[type="password"]'
      );

      if (passwordField && !passwordField.dataset.pgDetected) {
        passwordField.dataset.pgDetected = 'true';

        // 尋找使用者名稱欄位
        const usernameField = this.findUsernameField(form, passwordField);

        if (usernameField) {
          this.formData = {
            usernameField,
            passwordField,
            form
          };

          // 在密碼欄位旁邊顯示填寫按鈕
          this.showFillButton(passwordField);
        }
      }
    });
  }

  private findUsernameField(
    form: HTMLFormElement,
    passwordField: HTMLInputElement
  ): HTMLInputElement | null {
    // 常見的使用者名稱欄位類型
    const usernameTypes = ['text', 'email', 'tel'];
    const usernameNames = ['username', 'user', 'email', 'login', 'account'];

    // 尋找在密碼欄位之前的輸入欄位
    const inputs = Array.from(form.querySelectorAll<HTMLInputElement>('input'));
    const passwordIndex = inputs.indexOf(passwordField);

    for (let i = passwordIndex - 1; i >= 0; i--) {
      const input = inputs[i];
      if (usernameTypes.includes(input.type)) {
        return input;
      }
    }

    // 根據名稱尋找
    for (const name of usernameNames) {
      const input = form.querySelector<HTMLInputElement>(
        `input[name*="${name}" i], input[id*="${name}" i]`
      );
      if (input) return input;
    }

    return null;
  }

  private showFillButton(passwordField: HTMLInputElement): void {
    // 檢查是否已經有按鈕
    if (passwordField.parentElement?.querySelector('.pg-fill-button')) {
      return;
    }

    const button = document.createElement('button');
    button.className = 'pg-fill-button';
    button.type = 'button';
    button.textContent = '🔑';
    button.title = '使用 Privacy Guardian 填寫密碼';
    button.style.cssText = `
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: #4CAF50;
      border: none;
      border-radius: 4px;
      width: 32px;
      height: 32px;
      cursor: pointer;
      font-size: 16px;
      z-index: 10000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;

    button.addEventListener('click', () => {
      this.requestPassword();
    });

    // 設定密碼欄位的相對定位
    const parent = passwordField.parentElement;
    if (parent) {
      const position = window.getComputedStyle(parent).position;
      if (position === 'static') {
        parent.style.position = 'relative';
      }
      parent.appendChild(button);
    }

    this.fillButton = button;
  }

  private async requestPassword(): Promise<void> {
    const domain = window.location.hostname;
    const url = window.location.href;

    // 向背景腳本請求此網站的密碼
    chrome.runtime.sendMessage(
      {
        action: 'getPasswordsForDomain',
        domain,
        url
      },
      (response) => {
        if (response && response.passwords && response.passwords.length > 0) {
          // 如果有多個密碼，顯示選擇列表
          if (response.passwords.length > 1) {
            this.showPasswordSelector(response.passwords);
          } else {
            this.fillPassword(response.passwords[0]);
          }
        } else {
          this.showNotification('此網站沒有儲存的密碼');
        }
      }
    );
  }

  private fillPassword(data: { username: string; password: string }): void {
    if (!this.formData) return;

    if (this.formData.usernameField && data.username) {
      this.formData.usernameField.value = data.username;
      this.formData.usernameField.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (this.formData.passwordField && data.password) {
      this.formData.passwordField.value = data.password;
      this.formData.passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    }

    this.showNotification('密碼已填寫');
  }

  private showPasswordSelector(passwords: Array<{ username: string; password: string }>): void {
    // 創建選擇器 UI（簡化版）
    const selector = document.createElement('div');
    selector.className = 'pg-password-selector';
    selector.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10001;
      min-width: 300px;
    `;

    const title = document.createElement('h3');
    title.textContent = '選擇帳號';
    title.style.marginTop = '0';
    selector.appendChild(title);

    passwords.forEach((pwd) => {
      const button = document.createElement('button');
      button.textContent = pwd.username;
      button.style.cssText = `
        display: block;
        width: 100%;
        padding: 10px;
        margin: 8px 0;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
      `;
      button.addEventListener('click', () => {
        this.fillPassword(pwd);
        document.body.removeChild(selector);
      });
      selector.appendChild(button);
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.style.cssText = `
      display: block;
      width: 100%;
      padding: 10px;
      margin-top: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #f5f5f5;
      cursor: pointer;
    `;
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(selector);
    });
    selector.appendChild(cancelBtn);

    document.body.appendChild(selector);
  }

  private showNotification(message: string): void {
    const notification = document.createElement('div');
    notification.className = 'pg-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10002;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}

// 初始化表單偵測器
new FormDetector();

console.log('Privacy Guardian 表單偵測已啟動');
