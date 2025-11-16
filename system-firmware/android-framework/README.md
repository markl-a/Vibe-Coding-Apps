# 🤖 Android Framework 開發
> 使用 AI 驅動的方法進行 Android 框架開發

⚠️ **驗證階段專案** - 此領域目前處於研究與開發階段

## 📋 專案概述

Android Framework 是 Android 作業系統的核心層，介於應用層和 Linux 核心之間。本專案展示如何使用 AI 輔助工具來開發和優化 Android 系統服務、Framework API 和系統組件。

## 🎯 開發領域

### 1. AOSP (Android Open Source Project) 開發
- **系統編譯與建構**
  - 完整 AOSP 源碼編譯
  - 自定義 ROM 開發
  - 編譯優化與加速
  - 模組化編譯

- **源碼修改與定製**
  - Framework 層代碼修改
  - 系統行為定製
  - 預載應用配置
  - 系統資源客製化

### 2. 系統服務 (System Services)
- **核心系統服務**
  - ActivityManagerService (AMS)
  - PackageManagerService (PMS)
  - WindowManagerService (WMS)
  - PowerManagerService
  - LocationManagerService

- **服務開發實踐**
  - 自定義系統服務創建
  - 服務生命週期管理
  - 權限控制實作
  - 跨進程通訊 (IPC)

### 3. Framework API 設計
- **公開 API 開發**
  - SDK API 設計原則
  - API 版本管理
  - 向後相容性保證
  - API 文檔生成

- **隱藏 API (@hide)**
  - 內部 API 設計
  - SystemApi 開發
  - TestApi 實作

### 4. HAL (Hardware Abstraction Layer)
- **HAL 層開發**
  - Camera HAL
  - Audio HAL
  - Sensor HAL
  - Graphics HAL (Gralloc, HWComposer)
  - Display HAL

- **HIDL/AIDL 介面**
  - HIDL 介面定義
  - AIDL 服務實作
  - HAL 客戶端開發
  - Passthrough vs Binderized

### 5. System UI 開發
- **系統界面組件**
  - StatusBar (狀態欄)
  - NavigationBar (導航欄)
  - Notification 系統
  - Quick Settings (快速設定)
  - Lock Screen (鎖屏)

- **Launcher 開發**
  - 自定義 Launcher
  - 桌面小工具
  - App 抽屜
  - 手勢操作

### 6. Binder IPC 機制
- **Binder 通訊**
  - Binder 驅動理解
  - AIDL 介面定義
  - Binder 線程池
  - 死亡通知 (DeathRecipient)

- **性能優化**
  - 減少 IPC 調用
  - 批次處理優化
  - 異步 Binder
  - Binder 追蹤分析

### 7. Android Runtime (ART)
- **ART 優化**
  - AOT 編譯優化
  - JIT 編譯器調校
  - 垃圾回收 (GC) 優化
  - 類載入優化

- **性能分析**
  - Method tracing
  - Heap dump 分析
  - GC 日誌分析
  - Profile-guided optimization

### 8. 系統安全
- **SELinux 策略**
  - SELinux 規則編寫
  - 上下文配置
  - 權限拒絕除錯
  - 策略編譯與載入

- **應用權限管理**
  - 運行時權限實作
  - 特殊權限處理
  - 權限檢查機制
  - AppOps 系統

## 🛠️ 技術棧

### 開發語言
- **Java** - Framework 主要語言
- **Kotlin** - 現代 Framework 開發
- **C++** - Native 服務和 HAL
- **C** - 底層接口和驅動
- **Python** - 建構腳本和工具

### 開發工具
- **Android Studio** - IDE 和除錯
- **repo** - AOSP 源碼管理
- **adb** - Android Debug Bridge
- **fastboot** - 刷機工具
- **logcat** - 日誌查看
- **systrace** - 性能追蹤
- **perfetto** - 新一代追蹤工具

### 建構系統
- **Soong** - Android.bp 建構系統
- **Make** - Android.mk (傳統)
- **Bazel** - 實驗性支援
- **Ninja** - 底層建構引擎

## 🚀 快速開始

### 1. 設置 AOSP 開發環境

```bash
# 安裝依賴 (Ubuntu/Debian)
sudo apt-get install git-core gnupg flex bison build-essential \
    zip curl zlib1g-dev libc6-dev-i386 libncurses5 \
    x11proto-core-dev libx11-dev lib32z1-dev libgl1-mesa-dev \
    libxml2-utils xsltproc unzip fontconfig

# 安裝 repo 工具
mkdir ~/bin
curl https://storage.googleapis.com/git-repo-downloads/repo > ~/bin/repo
chmod a+x ~/bin/repo
export PATH=~/bin:$PATH

# 初始化 AOSP 源碼
mkdir aosp
cd aosp
repo init -u https://android.googlesource.com/platform/manifest -b android-14.0.0_r1
repo sync -c -j8
```

### 2. 編譯 AOSP

```bash
# 設置建構環境
source build/envsetup.sh

# 選擇目標設備
lunch aosp_x86_64-eng  # 模擬器
# 或
lunch aosp_arm64-eng

# 開始編譯
m -j$(nproc)

# 編譯特定模組
m framework
m services
```

### 3. 創建自定義系統服務

```java
// frameworks/base/services/core/java/com/android/server/CustomService.java
package com.android.server;

import android.content.Context;
import android.os.ICustomService;

public class CustomService extends ICustomService.Stub {
    private final Context mContext;

    public CustomService(Context context) {
        mContext = context;
    }

    @Override
    public String getData() {
        // 服務邏輯
        return "Custom data";
    }

    public void systemReady() {
        // 系統啟動完成後的初始化
    }
}
```

```java
// frameworks/base/services/java/com/android/server/SystemServer.java
// 在 startOtherServices() 中註冊服務

private void startOtherServices() {
    // ... 其他服務

    try {
        CustomService customService = new CustomService(mSystemContext);
        ServiceManager.addService("custom", customService);
    } catch (Throwable e) {
        reportWtf("starting CustomService", e);
    }
}
```

### 4. 定義 AIDL 介面

```aidl
// frameworks/base/core/java/android/os/ICustomService.aidl
package android.os;

interface ICustomService {
    String getData();
}
```

## 📚 開發範例

### 範例 1: 系統屬性監聽

```java
import android.os.SystemProperties;

public class PropertyWatcher {
    private static final String PROP_KEY = "persist.custom.property";

    public void watchProperty() {
        // 讀取系統屬性
        String value = SystemProperties.get(PROP_KEY, "default");

        // 監聽屬性變化
        SystemProperties.addChangeCallback(() -> {
            String newValue = SystemProperties.get(PROP_KEY);
            onPropertyChanged(newValue);
        });
    }

    private void onPropertyChanged(String value) {
        // 處理屬性變化
    }
}
```

### 範例 2: 廣播接收器 (Framework 層)

```java
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;

public class SystemBroadcastHandler {
    private final Context mContext;

    private final BroadcastReceiver mReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (Intent.ACTION_BOOT_COMPLETED.equals(action)) {
                onBootCompleted();
            }
        }
    };

    public void registerReceiver() {
        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_BOOT_COMPLETED);
        mContext.registerReceiver(mReceiver, filter);
    }

    private void onBootCompleted() {
        // 開機完成處理
    }
}
```

### 範例 3: HAL 層調用

```java
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.CameraCharacteristics;

public class CameraHalExample {
    private final CameraManager mCameraManager;

    public void queryCameraCapabilities(String cameraId) throws Exception {
        CameraCharacteristics characteristics =
            mCameraManager.getCameraCharacteristics(cameraId);

        // 獲取 HAL 層信息
        int facing = characteristics.get(
            CameraCharacteristics.LENS_FACING);
        int[] capabilities = characteristics.get(
            CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES);

        // 處理能力信息
        processCameraCapabilities(capabilities);
    }
}
```

## 🤖 AI 輔助開發策略

### 1. 程式碼理解與學習
- **使用 Claude/ChatGPT 理解複雜代碼**
  ```
  "請解釋 ActivityManagerService.startActivity() 的執行流程"
  "AMS 中的 Activity 堆疊管理機制是如何實作的？"
  ```

- **API 使用諮詢**
  ```
  "如何使用 PackageManager 查詢已安裝應用的權限？"
  "Binder 通訊中如何實作死亡通知？"
  ```

### 2. 程式碼生成
- **生成服務骨架**
  ```
  "生成一個自定義系統服務的完整代碼，包含 AIDL 定義和服務註冊"
  ```

- **生成 HAL 介面實作**
  ```
  "生成一個簡單的 Audio HAL 實作範例"
  ```

### 3. 除錯輔助
- **分析崩潰日誌**
  ```
  "分析這個 system_server 崩潰的堆疊追蹤，找出可能原因"
  ```

- **SELinux 拒絕分析**
  ```
  "這個 SELinux avc denied 日誌表示什麼？應該如何修改策略？"
  ```

### 4. 程式碼審查
- **性能分析**
  ```
  "這段 Binder 通訊代碼有性能問題嗎？如何優化？"
  ```

- **安全性檢查**
  ```
  "這個系統服務的權限檢查是否足夠？有無安全漏洞？"
  ```

## 📊 專案結構

```
android-framework/
├── README.md
├── examples/
│   ├── custom-service/          # 自定義服務範例
│   │   ├── aidl/
│   │   ├── service/
│   │   └── client/
│   ├── hal-implementation/      # HAL 實作範例
│   ├── system-ui-mod/          # System UI 修改
│   └── selinux-policies/       # SELinux 策略範例
├── docs/
│   ├── aosp-build-guide.md     # AOSP 編譯指南
│   ├── service-development.md  # 服務開發文檔
│   ├── hal-guide.md            # HAL 開發指南
│   └── debugging-tips.md       # 除錯技巧
├── scripts/
│   ├── build-aosp.sh           # 編譯腳本
│   ├── flash-device.sh         # 刷機腳本
│   └── logcat-filter.sh        # 日誌過濾
└── tools/
    ├── selinux-analyzer/       # SELinux 分析工具
    ├── binder-tracer/          # Binder 追蹤工具
    └── framework-patcher/      # Framework 補丁工具
```

## 🧪 開發路線圖

### Phase 1: 環境建置 ✅
- [x] AOSP 源碼下載
- [x] 編譯環境配置
- [x] 模擬器測試
- [x] 基本工具安裝

### Phase 2: 基礎開發 (進行中)
- [ ] 自定義系統服務
- [ ] AIDL 介面設計
- [ ] 簡單 HAL 實作
- [ ] System UI 修改

### Phase 3: 進階功能
- [ ] 複雜服務開發
- [ ] Binder 性能優化
- [ ] SELinux 策略開發
- [ ] Framework API 擴展

### Phase 4: 系統整合
- [ ] 完整 ROM 定製
- [ ] OTA 更新機制
- [ ] 系統性能調優
- [ ] 穩定性測試

## 🔬 學習資源

### 官方文檔
- [Android Source](https://source.android.com/) - AOSP 官方文檔
- [Android Developers](https://developer.android.com/) - 開發者文檔
- [Android Security](https://source.android.com/security) - 安全性文檔

### 書籍推薦
1. **Android Internals** by Jonathan Levin
   - 深入 Android 系統內部
   - Framework 層詳細分析

2. **Embedded Android** by Karim Yaghmour
   - AOSP 移植與定製
   - 系統級開發實踐

3. **Android Security Internals** by Nikolay Elenkov
   - Android 安全機制
   - SELinux 深入解析

### 線上課程
- [XDA University](https://www.xda-developers.com/) - ROM 開發教程
- [Android Platform Development](https://www.udacity.com/) - 平台開發課程

### 社群資源
- [XDA Developers](https://forum.xda-developers.com/) - 開發者論壇
- [Android AOSP Group](https://groups.google.com/g/android-platform) - 官方討論組
- [Stack Overflow - Android](https://stackoverflow.com/questions/tagged/android) - 技術問答

## ⚙️ 開發最佳實踐

### 1. 代碼品質
- **遵循 AOSP 編碼規範**
  - Java Code Style
  - C++ Code Style
  - Commit Message 格式

- **使用靜態分析**
  ```bash
  # 運行 lint 檢查
  ./prebuilts/misc/linux-x86/lint/lint --check "MyService"

  # C++ 代碼檢查
  ./prebuilts/clang-tools/linux-x86/clang-tidy/clang-tidy
  ```

### 2. 測試策略
- **單元測試**
  ```java
  @RunWith(AndroidJUnit4.class)
  public class CustomServiceTest {
      @Test
      public void testGetData() {
          CustomService service = new CustomService(context);
          String data = service.getData();
          assertNotNull(data);
      }
  }
  ```

- **集成測試**
  ```bash
  # 運行 CTS (Compatibility Test Suite)
  cts-tradefed run cts -m CtsSystemIntentTestCases
  ```

### 3. 性能優化
- **減少記憶體使用**
  - 避免記憶體洩漏
  - 使用物件池
  - 及時釋放資源

- **優化啟動時間**
  - 延遲初始化
  - 異步載入
  - 並行處理

### 4. 除錯技巧
```bash
# 查看系統服務
adb shell dumpsys

# 特定服務資訊
adb shell dumpsys activity
adb shell dumpsys package

# 追蹤 Binder 調用
adb shell atrace --async_start -b 8192 -c binder

# 查看 SELinux 拒絕
adb shell dmesg | grep avc
```

## ⚠️ 注意事項

### 硬體需求
- **磁碟空間**: 至少 250GB (完整 AOSP 編譯)
- **記憶體**: 建議 16GB+ RAM
- **CPU**: 多核心處理器 (編譯時間)

### 開發限制
1. **版權問題**: 注意 AOSP 和第三方代碼授權
2. **設備相容性**: 不同設備需要不同的 HAL 實作
3. **CTS 測試**: 自定義 ROM 需通過相容性測試
4. **安全性**: Framework 修改需考慮安全影響

### SELinux 策略
```
# 範例策略
# device/custom/sepolicy/custom_service.te
type custom_service, system_api_service, system_server_service, service_manager_type;

# 允許 system_server 添加服務
allow system_server custom_service:service_manager add;

# 允許應用查找服務
allow appdomain custom_service:service_manager find;
```

## 🎯 實用範例

### 系統屬性設置
```bash
# 臨時設置
adb shell setprop persist.custom.value 123

# 永久設置 (需要在 build.prop 或 default.prop 中)
echo "persist.custom.value=123" >> system/build.prop
```

### 系統服務調用
```java
// 獲取自定義服務
ICustomService service = ICustomService.Stub.asInterface(
    ServiceManager.getService("custom"));

if (service != null) {
    String data = service.getData();
}
```

## 📄 授權

本專案中的範例代碼遵循 Apache 2.0 授權 (與 AOSP 一致)

## 📞 貢獻與討論

- **問題回報**: GitHub Issues
- **功能建議**: GitHub Discussions
- **程式碼貢獻**: Pull Requests

---

**最後更新**: 2025-11-16
**狀態**: 🚧 研究與開發中
**維護者**: AI-Assisted Development Team
