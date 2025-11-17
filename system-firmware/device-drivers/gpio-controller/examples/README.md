# GPIO 控制器驅動範例程式

本目錄包含 GPIO 控制器驅動的完整使用範例，涵蓋從基本操作到實際應用的各種場景。

## 目錄結構

```
examples/
├── README.md              # 本文件
├── Makefile               # 編譯配置
├── basic_usage.c          # 基本使用範例
├── led_control.c          # LED 控制範例
├── button_interrupt.c     # 按鈕中斷範例
├── error_handling.c       # 錯誤處理範例
└── test_suite.c           # 自動化測試套件
```

## 編譯範例

### 編譯所有範例

```bash
cd examples/
make
```

### 編譯單個範例

```bash
make basic_usage        # 基本使用範例
make led_control        # LED 控制範例
make button_interrupt   # 按鈕中斷範例
make error_handling     # 錯誤處理範例
make test_suite         # 測試套件
```

### 清理編譯產物

```bash
make clean
```

## 範例說明

### 1. 基本使用範例 (basic_usage.c)

展示 GPIO 驅動的基本操作，包括：
- GPIO 導出和取消導出
- 設置 GPIO 方向（輸入/輸出）
- 讀取和寫入 GPIO 值
- 動態切換 GPIO 方向

**運行方式：**
```bash
sudo ./basic_usage
```

**範例輸出：**
```
GPIO 基本使用範例程式
========================

=== GPIO 輸出範例 ===
使用 GPIO 17 進行輸出控制

設置 GPIO 17 為高電平
設置 GPIO 17 為低電平
GPIO 17 輸出範例完成

=== GPIO 輸入範例 ===
使用 GPIO 18 進行輸入讀取

GPIO 18 當前值: 0
GPIO 18 當前值: 1
...
```

**適用場景：**
- 學習 GPIO sysfs 介面
- 理解 GPIO 的基本概念
- 快速測試 GPIO 功能

---

### 2. LED 控制範例 (led_control.c)

展示如何使用 GPIO 控制 LED，包括：
- 簡單閃爍
- PWM 軟體模擬（亮度控制）
- 多 LED 流水燈
- 呼吸燈效果
- SOS 莫爾斯電碼

**運行方式：**
```bash
# 執行所有範例
sudo ./led_control

# 執行特定範例
sudo ./led_control -b    # 閃爍範例
sudo ./led_control -p    # PWM 範例
sudo ./led_control -m    # 多 LED 流水燈
sudo ./led_control -r    # 呼吸燈
sudo ./led_control -s    # SOS 信號
```

**硬體連接：**
```
GPIO 17 ---[330Ω]--- LED ---[GND]
GPIO 18 ---[330Ω]--- LED ---[GND]
GPIO 19 ---[330Ω]--- LED ---[GND]
GPIO 20 ---[330Ω]--- LED ---[GND]
```

**範例輸出：**
```
=== LED 閃爍範例 ===
LED 將閃爍 10 次
閃爍 1/10
閃爍 2/10
...

=== LED PWM 亮度控制範例 ===
使用軟體 PWM 控制 LED 亮度
從暗到亮...
從亮到暗...
PWM 範例完成
```

**適用場景：**
- LED 指示燈控制
- 狀態顯示
- 裝飾燈效果
- PWM 原理學習

---

### 3. 按鈕中斷範例 (button_interrupt.c)

展示如何使用 GPIO 中斷處理按鈕輸入，包括：
- 基本中斷處理（上升沿）
- 雙邊緣觸發（按下和釋放）
- 防抖處理
- 長按檢測

**運行方式：**
```bash
# 查看可用選項
sudo ./button_interrupt -h

# 執行特定範例
sudo ./button_interrupt -b    # 基本中斷
sudo ./button_interrupt -e    # 雙邊緣觸發
sudo ./button_interrupt -d    # 防抖處理
sudo ./button_interrupt -l    # 長按檢測
```

**硬體連接：**
```
     3.3V
       |
    [10kΩ]  (上拉電阻)
       |
       +-------- GPIO 18
       |
    [按鈕]
       |
      GND
```

**範例輸出：**
```
=== 基本中斷處理範例 ===
使用 GPIO 18 檢測按鈕按下
按下按鈕觸發中斷...

等待按鈕按下事件...
按 Ctrl+C 退出

按鈕按下! (第 1 次)
按鈕按下! (第 2 次)
...

=== 防抖處理範例 ===
使用 50 ms 防抖時間
快速按下按鈕測試防抖效果

[有效] 按鈕按下 (有效: 1, 忽略: 0)
[忽略] 抖動信號 (間隔: 15 ms)
[忽略] 抖動信號 (間隔: 8 ms)
...
```

**適用場景：**
- 按鈕輸入檢測
- 開關控制
- 用戶交互
- 中斷處理學習

---

### 4. 錯誤處理範例 (error_handling.c)

展示如何正確處理各種錯誤情況，包括：
- GPIO 不存在或無效
- 權限不足
- GPIO 已被占用
- 操作超時
- 資源清理和錯誤恢復

**運行方式：**
```bash
# 需要 root 權限測試完整功能
sudo ./error_handling

# 測試權限錯誤（不使用 sudo）
./error_handling
```

**範例輸出：**
```
=== 範例 1: 處理無效的 GPIO ===
嘗試導出 GPIO 9999...
錯誤: Failed to export GPIO (Invalid argument - Invalid argument)
正確處理了無效 GPIO 的錯誤

=== 範例 4: 資源清理 ===
導出 4 個 GPIO...
嘗試導出 GPIO 17...
  GPIO 17 導出成功
...
所有 GPIO 導出成功
執行 GPIO 操作...

清理所有 GPIO...
嘗試取消導出 GPIO 17...
  GPIO 17 取消導出成功
...
資源清理完成
```

**學習重點：**
- 錯誤檢測和處理
- 資源管理最佳實踐
- 重試機制
- 錯誤恢復策略

---

### 5. 測試套件 (test_suite.c)

自動化測試程序，驗證 GPIO 驅動的各項功能：
- GPIO 導出/取消導出
- 方向設置和讀取
- 值設置和讀取
- 快速切換性能
- 中斷邊緣設置
- 並發導出測試
- 無效操作處理
- 資源泄漏測試

**運行方式：**
```bash
# 執行完整測試套件
sudo ./test_suite

# 或使用 make
make test
```

**範例輸出：**
```
==========================================
GPIO 驅動測試套件
==========================================

[TEST] GPIO 導出和取消導出
[PASS]

[TEST] 設置和讀取方向
[PASS]

[TEST] 設置和讀取值
[PASS]

[TEST] 快速切換性能測試
  完成 2000 次切換，耗時 0.523 秒
  平均切換速度: 3825 Hz
[PASS]

...

==========================================
測試報告
==========================================
總計: 8
通過: 8
失敗: 0
跳過: 0
------------------------------------------
所有測試通過！
通過率: 100.0%
==========================================
```

**用途：**
- 驗證驅動功能
- 回歸測試
- 性能基準測試
- CI/CD 集成

---

## 使用前準備

### 1. 確認驅動已載入

```bash
# 檢查驅動模組
lsmod | grep gpio

# 載入驅動（如果需要）
cd ../driver/
make
sudo insmod gpio_driver.ko
```

### 2. 檢查 GPIO 系統

```bash
# 確認 GPIO sysfs 介面存在
ls -l /sys/class/gpio/

# 應該看到：
# export
# unexport
# gpiochipX
```

### 3. 權限設置

大多數範例需要 root 權限：

```bash
# 方法 1: 使用 sudo
sudo ./basic_usage

# 方法 2: 添加用戶到 gpio 組（如果存在）
sudo usermod -a -G gpio $USER
# 登出後重新登入

# 方法 3: 修改 udev 規則
sudo nano /etc/udev/rules.d/99-gpio.rules
# 添加：
# SUBSYSTEM=="gpio", KERNEL=="gpiochip*", GROUP="gpio", MODE="0660"
sudo udevadm control --reload-rules
```

## 硬體需求

### 最小配置
- 任何支援 GPIO 的 Linux 設備
- 至少 2 個可用的 GPIO 引腳

### 推薦配置（用於所有範例）
- Raspberry Pi 或類似開發板
- 4 個 GPIO 引腳（GPIO 17-20）
- LED x4 + 330Ω 電阻 x4
- 按鈕 x1 + 10kΩ 電阻 x1（上拉）
- 麵包板和跳線

### GPIO 引腳分配
```
GPIO 17: LED 控制（輸出）
GPIO 18: 按鈕輸入（輸入，帶中斷）
GPIO 19: LED 控制（輸出）
GPIO 20: LED 控制（輸出）
```

## 常見問題

### Q1: 編譯錯誤 "未找到標頭檔"

**解決方法：**
```bash
# 安裝編譯工具
sudo apt-get install build-essential

# 檢查 GCC 版本
gcc --version
```

### Q2: 運行時錯誤 "Permission denied"

**解決方法：**
```bash
# 使用 sudo 運行
sudo ./basic_usage

# 或修改權限
sudo chmod 666 /sys/class/gpio/export
sudo chmod 666 /sys/class/gpio/unexport
```

### Q3: GPIO 已被占用

**解決方法：**
```bash
# 檢查哪個程序占用了 GPIO
lsof | grep gpio

# 取消導出 GPIO
echo 17 > /sys/class/gpio/unexport
```

### Q4: LED 不亮

**檢查清單：**
1. 確認 GPIO 編號正確
2. 檢查 LED 極性（長腳接正極）
3. 確認電阻阻值（推薦 330Ω）
4. 使用萬用表測試 GPIO 輸出電壓
5. 確認 GPIO 設置為輸出模式

### Q5: 按鈕中斷無響應

**檢查清單：**
1. 確認上拉電阻連接正確
2. 檢查按鈕接線
3. 測試按鈕是否正常工作
4. 確認 edge 設置正確
5. 檢查內核日誌：`dmesg | grep gpio`

## 最佳實踐

### 1. 資源管理
```c
// 總是在使用後清理資源
gpio_export(gpio);
// ... 使用 GPIO ...
gpio_unexport(gpio);  // 清理

// 使用 goto 處理錯誤
int fd = -1;
if (gpio_export(gpio) < 0)
    goto cleanup;
fd = open(...);
if (fd < 0)
    goto cleanup;
// ... 操作 ...
cleanup:
    if (fd >= 0) close(fd);
    gpio_unexport(gpio);
```

### 2. 錯誤處理
```c
// 總是檢查返回值
if (gpio_export(gpio) < 0) {
    fprintf(stderr, "Failed to export GPIO: %s\n", strerror(errno));
    return -1;
}

// 使用 errno 獲取詳細錯誤
if (write(fd, buf, len) < 0) {
    if (errno == EBUSY) {
        // 處理忙碌狀態
    } else if (errno == EACCES) {
        // 處理權限問題
    }
}
```

### 3. 防抖處理
```c
// 對於按鈕輸入，始終實現防抖
#define DEBOUNCE_TIME_MS 50
unsigned long long last_time = get_time_ms();
unsigned long long current_time;

// 在中斷處理中
current_time = get_time_ms();
if (current_time - last_time < DEBOUNCE_TIME_MS) {
    return;  // 忽略抖動
}
last_time = current_time;
```

### 4. 信號處理
```c
// 優雅地處理 Ctrl+C
static volatile int running = 1;

void signal_handler(int sig) {
    running = 0;
}

signal(SIGINT, signal_handler);

while (running) {
    // 主循環
}
// 清理資源
```

## 進階主題

### 使用 libgpiod

現代 Linux 系統推薦使用 libgpiod 替代 sysfs：

```bash
# 安裝 libgpiod
sudo apt-get install gpiod libgpiod-dev

# 使用命令行工具
gpiodetect
gpioinfo gpiochip0
gpioget gpiochip0 17
gpioset gpiochip0 17=1
```

### 性能優化

對於高頻率 GPIO 操作：
1. 使用內核空間驅動而非 sysfs
2. 考慮使用 mmap 直接訪問 GPIO 寄存器
3. 使用 DMA 進行批量操作
4. 減少系統調用次數

### 實時性考慮

對於實時應用：
1. 使用 PREEMPT_RT 補丁
2. 設置進程優先級
3. 鎖定記憶體頁面
4. 使用專用 CPU 核心

## 參考資源

- [Linux GPIO Subsystem](https://www.kernel.org/doc/html/latest/driver-api/gpio/)
- [GPIO Sysfs Interface](https://www.kernel.org/doc/Documentation/gpio/sysfs.txt)
- [libgpiod Documentation](https://git.kernel.org/pub/scm/libs/libgpiod/libgpiod.git/)
- [Raspberry Pi GPIO](https://www.raspberrypi.org/documentation/hardware/raspberrypi/)

## 貢獻

歡迎提交問題和改進建議！

## 授權

MIT License

---

**最後更新**: 2025-11-17
**維護者**: AI-Assisted Development Team
