/**
 * YouTube 播放器增強
 */

export class PlayerEnhancements {
  private currentSpeed: number = 1.0;

  /**
   * 添加速度控制
   */
  addSpeedControl(): void {
    const observer = new MutationObserver(() => {
      const controls = document.querySelector('.ytp-right-controls');
      if (controls && !document.getElementById('custom-speed-control')) {
        const speedControl = this.createSpeedControl();
        controls.insertBefore(speedControl, controls.firstChild);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * 創建速度控制
   */
  private createSpeedControl(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'custom-speed-control';
    container.className = 'ytp-button';
    container.style.cssText = 'display: inline-block; padding: 0 12px; color: white; cursor: pointer;';
    container.textContent = '1.0x';

    container.addEventListener('click', () => {
      this.showSpeedMenu(container);
    });

    return container;
  }

  /**
   * 顯示速度選單
   */
  private showSpeedMenu(button: HTMLElement): void {
    const menu = document.createElement('div');
    menu.className = 'custom-speed-menu';
    menu.style.cssText = `
      position: absolute;
      bottom: 50px;
      right: 10px;
      background: rgba(28, 28, 28, 0.95);
      border-radius: 8px;
      padding: 8px;
      z-index: 9999;
    `;

    const speeds = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];

    speeds.forEach(speed => {
      const option = document.createElement('div');
      option.textContent = `${speed}x`;
      option.style.cssText = `
        padding: 8px 16px;
        color: white;
        cursor: pointer;
        border-radius: 4px;
      `;

      if (speed === this.currentSpeed) {
        option.style.background = 'rgba(255, 255, 255, 0.2)';
      }

      option.addEventListener('mouseenter', () => {
        option.style.background = 'rgba(255, 255, 255, 0.1)';
      });

      option.addEventListener('mouseleave', () => {
        option.style.background = speed === this.currentSpeed ? 'rgba(255, 255, 255, 0.2)' : '';
      });

      option.addEventListener('click', () => {
        this.setPlaybackSpeed(speed);
        button.textContent = `${speed}x`;
        menu.remove();
      });

      menu.appendChild(option);
    });

    document.body.appendChild(menu);

    // 點擊其他地方關閉選單
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target as Node)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 0);
  }

  /**
   * 設定播放速度
   */
  setPlaybackSpeed(speed: number): void {
    const video = document.querySelector('video');
    if (video) {
      (video as HTMLVideoElement).playbackRate = speed;
      this.currentSpeed = speed;
    }
  }

  /**
   * 增加速度
   */
  increaseSpeed(): void {
    const newSpeed = Math.min(this.currentSpeed + 0.25, 3.0);
    this.setPlaybackSpeed(newSpeed);
    this.showSpeedNotification(newSpeed);
  }

  /**
   * 減少速度
   */
  decreaseSpeed(): void {
    const newSpeed = Math.max(this.currentSpeed - 0.25, 0.25);
    this.setPlaybackSpeed(newSpeed);
    this.showSpeedNotification(newSpeed);
  }

  /**
   * 顯示速度通知
   */
  private showSpeedNotification(speed: number): void {
    let notification = document.getElementById('speed-notification');

    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'speed-notification';
      notification.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 9999;
        font-size: 18px;
        font-weight: bold;
      `;
      document.body.appendChild(notification);
    }

    notification.textContent = `速度: ${speed}x`;
    notification.style.display = 'block';

    // 3 秒後隱藏
    setTimeout(() => {
      notification!.style.display = 'none';
    }, 1000);
  }
}
