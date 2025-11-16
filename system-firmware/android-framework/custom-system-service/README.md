# 自定義系統服務範例 (Custom System Service)

> Android Framework 層自定義系統服務的完整實作範例

## 專案概述

本專案展示如何在 Android Framework 層創建一個完整的自定義系統服務，包含 AIDL 介面定義、服務實作、客戶端調用和系統整合。

## 功能特性

- ✅ AIDL 介面定義與實作
- ✅ 系統服務註冊與生命週期管理
- ✅ Binder IPC 跨進程通訊
- ✅ 權限檢查與安全控制
- ✅ 系統屬性監聽
- ✅ 廣播事件處理
- ✅ 客戶端 SDK 封裝

## 架構設計

```
自定義系統服務架構
┌─────────────────────────────────────────┐
│         Application Layer               │
│  ┌──────────────────────────────────┐  │
│  │   CustomServiceClient (SDK)       │  │
│  └──────────────┬───────────────────┘  │
└─────────────────┼──────────────────────┘
                  │ Binder IPC
┌─────────────────┼──────────────────────┐
│   Framework Layer (system_server)       │
│  ┌──────────────▼───────────────────┐  │
│  │   CustomService Implementation    │  │
│  ├────────────────────────────────────┤  │
│  │  • Service Lifecycle               │  │
│  │  • Permission Checking             │  │
│  │  • Event Broadcasting              │  │
│  │  • System Property Monitoring      │  │
│  └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 目錄結構

```
custom-system-service/
├── README.md                          # 專案說明文檔
├── aidl/                              # AIDL 介面定義
│   ├── ICustomService.aidl           # 服務主介面
│   ├── ICustomServiceCallback.aidl   # 回調介面
│   └── CustomData.aidl               # 資料類型定義
├── service/                           # 服務端實作
│   ├── CustomService.java            # 服務主實作
│   ├── CustomServiceManager.java     # 服務管理器
│   ├── SystemServerIntegration.java  # SystemServer 整合
│   └── Android.bp                    # 編譯配置
├── client/                            # 客戶端範例
│   ├── CustomServiceClient.java      # 客戶端封裝
│   ├── CustomServiceExample.java     # 使用範例
│   └── Android.bp                    # 編譯配置
└── docs/                              # 文檔
    ├── integration-guide.md          # 整合指南
    ├── api-reference.md              # API 參考
    └── troubleshooting.md            # 問題排查
```

## AIDL 介面設計

### 主介面 (ICustomService.aidl)

```aidl
package com.android.server.custom;

import com.android.server.custom.ICustomServiceCallback;
import com.android.server.custom.CustomData;

interface ICustomService {
    // 資料操作
    String getData(String key);
    void setData(String key, String value);
    CustomData getCustomData(int id);

    // 狀態查詢
    int getServiceStatus();
    boolean isReady();

    // 事件監聽
    void registerCallback(ICustomServiceCallback callback);
    void unregisterCallback(ICustomServiceCallback callback);

    // 系統控制
    void performAction(String action, in Bundle params);
    void resetService();
}
```

### 回調介面 (ICustomServiceCallback.aidl)

```aidl
package com.android.server.custom;

oneway interface ICustomServiceCallback {
    void onStatusChanged(int status);
    void onDataUpdated(String key, String value);
    void onError(int errorCode, String message);
}
```

## 服務實作範例

### CustomService.java

```java
package com.android.server.custom;

import android.content.Context;
import android.os.Binder;
import android.os.Bundle;
import android.os.RemoteCallbackList;
import android.os.SystemProperties;
import android.util.Log;
import android.util.Slog;

import java.util.HashMap;
import java.util.Map;

public class CustomService extends ICustomService.Stub {
    private static final String TAG = "CustomService";
    private static final String PERMISSION = "android.permission.ACCESS_CUSTOM_SERVICE";

    private final Context mContext;
    private final Object mLock = new Object();
    private final Map<String, String> mDataStore = new HashMap<>();
    private final RemoteCallbackList<ICustomServiceCallback> mCallbacks =
        new RemoteCallbackList<>();

    private int mServiceStatus = STATUS_IDLE;
    private boolean mIsReady = false;

    // 狀態常量
    private static final int STATUS_IDLE = 0;
    private static final int STATUS_RUNNING = 1;
    private static final int STATUS_ERROR = 2;

    public CustomService(Context context) {
        mContext = context;
        Slog.i(TAG, "CustomService initialized");
    }

    /**
     * 系統啟動完成回調
     */
    public void systemReady() {
        Slog.i(TAG, "System ready, initializing CustomService");
        synchronized (mLock) {
            mIsReady = true;
            updateStatus(STATUS_RUNNING);
        }

        // 監聽系統屬性變化
        watchSystemProperties();

        // 註冊廣播接收器
        registerBroadcastReceivers();
    }

    @Override
    public String getData(String key) {
        enforcePermission();
        synchronized (mLock) {
            return mDataStore.get(key);
        }
    }

    @Override
    public void setData(String key, String value) {
        enforcePermission();
        synchronized (mLock) {
            mDataStore.put(key, value);
        }

        // 通知所有監聽者
        notifyDataUpdated(key, value);
    }

    @Override
    public CustomData getCustomData(int id) {
        enforcePermission();
        // 實作資料獲取邏輯
        return new CustomData(id, "Sample Data");
    }

    @Override
    public int getServiceStatus() {
        return mServiceStatus;
    }

    @Override
    public boolean isReady() {
        return mIsReady;
    }

    @Override
    public void registerCallback(ICustomServiceCallback callback) {
        enforcePermission();
        synchronized (mLock) {
            mCallbacks.register(callback);
            Slog.i(TAG, "Callback registered, total: " + mCallbacks.getRegisteredCallbackCount());
        }
    }

    @Override
    public void unregisterCallback(ICustomServiceCallback callback) {
        synchronized (mLock) {
            mCallbacks.unregister(callback);
            Slog.i(TAG, "Callback unregistered");
        }
    }

    @Override
    public void performAction(String action, Bundle params) {
        enforcePermission();
        Slog.i(TAG, "Performing action: " + action);

        // 根據不同的 action 執行不同操作
        switch (action) {
            case "reset":
                resetService();
                break;
            case "update":
                handleUpdate(params);
                break;
            default:
                Slog.w(TAG, "Unknown action: " + action);
        }
    }

    @Override
    public void resetService() {
        enforcePermission();
        synchronized (mLock) {
            mDataStore.clear();
            updateStatus(STATUS_IDLE);
            Slog.i(TAG, "Service reset");
        }
    }

    /**
     * 權限檢查
     */
    private void enforcePermission() {
        mContext.enforceCallingOrSelfPermission(
            PERMISSION,
            "Access to CustomService requires " + PERMISSION
        );
    }

    /**
     * 更新服務狀態
     */
    private void updateStatus(int status) {
        synchronized (mLock) {
            if (mServiceStatus != status) {
                mServiceStatus = status;
                notifyStatusChanged(status);
            }
        }
    }

    /**
     * 通知狀態變化
     */
    private void notifyStatusChanged(int status) {
        int count = mCallbacks.beginBroadcast();
        try {
            for (int i = 0; i < count; i++) {
                try {
                    mCallbacks.getBroadcastItem(i).onStatusChanged(status);
                } catch (Exception e) {
                    Slog.e(TAG, "Error notifying callback", e);
                }
            }
        } finally {
            mCallbacks.finishBroadcast();
        }
    }

    /**
     * 通知資料更新
     */
    private void notifyDataUpdated(String key, String value) {
        int count = mCallbacks.beginBroadcast();
        try {
            for (int i = 0; i < count; i++) {
                try {
                    mCallbacks.getBroadcastItem(i).onDataUpdated(key, value);
                } catch (Exception e) {
                    Slog.e(TAG, "Error notifying data update", e);
                }
            }
        } finally {
            mCallbacks.finishBroadcast();
        }
    }

    /**
     * 監聽系統屬性
     */
    private void watchSystemProperties() {
        SystemProperties.addChangeCallback(() -> {
            String value = SystemProperties.get("persist.custom.property", "");
            if (!value.isEmpty()) {
                Slog.i(TAG, "System property changed: " + value);
                handlePropertyChange(value);
            }
        });
    }

    /**
     * 註冊廣播接收器
     */
    private void registerBroadcastReceivers() {
        // 實作廣播監聽
    }

    /**
     * 處理系統屬性變化
     */
    private void handlePropertyChange(String value) {
        // 處理邏輯
    }

    /**
     * 處理更新操作
     */
    private void handleUpdate(Bundle params) {
        // 處理邏輯
    }
}
```

## SystemServer 整合

### SystemServerIntegration.java

```java
// 在 SystemServer.java 中的 startOtherServices() 方法中添加：

private void startOtherServices() {
    // ... 其他服務初始化 ...

    // 初始化 CustomService
    try {
        Slog.i(TAG, "Starting CustomService");
        CustomService customService = new CustomService(mSystemContext);
        ServiceManager.addService("custom", customService);
        mCustomService = customService;
    } catch (Throwable e) {
        reportWtf("starting CustomService", e);
    }

    // ... 其他服務 ...
}

// 在 systemReady() 階段調用
private void systemReady() {
    // ... 其他服務 ready ...

    if (mCustomService != null) {
        try {
            mCustomService.systemReady();
        } catch (Throwable e) {
            reportWtf("making CustomService ready", e);
        }
    }
}
```

## 客戶端使用範例

### CustomServiceClient.java

```java
package com.android.custom.client;

import android.content.Context;
import android.os.Bundle;
import android.os.IBinder;
import android.os.RemoteException;
import android.os.ServiceManager;
import android.util.Log;

import com.android.server.custom.ICustomService;
import com.android.server.custom.ICustomServiceCallback;

public class CustomServiceClient {
    private static final String TAG = "CustomServiceClient";
    private static final String SERVICE_NAME = "custom";

    private ICustomService mService;
    private Context mContext;

    public CustomServiceClient(Context context) {
        mContext = context;
        bindService();
    }

    private void bindService() {
        IBinder binder = ServiceManager.getService(SERVICE_NAME);
        if (binder != null) {
            mService = ICustomService.Stub.asInterface(binder);
            Log.i(TAG, "Service bound successfully");
        } else {
            Log.e(TAG, "Failed to get service");
        }
    }

    public String getData(String key) {
        if (mService == null) {
            Log.e(TAG, "Service not available");
            return null;
        }

        try {
            return mService.getData(key);
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to get data", e);
            return null;
        }
    }

    public void setData(String key, String value) {
        if (mService == null) {
            Log.e(TAG, "Service not available");
            return;
        }

        try {
            mService.setData(key, value);
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to set data", e);
        }
    }

    public void registerCallback(ICustomServiceCallback callback) {
        if (mService == null) {
            Log.e(TAG, "Service not available");
            return;
        }

        try {
            mService.registerCallback(callback);
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to register callback", e);
        }
    }

    public void performAction(String action, Bundle params) {
        if (mService == null) {
            Log.e(TAG, "Service not available");
            return;
        }

        try {
            mService.performAction(action, params);
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to perform action", e);
        }
    }
}
```

## 編譯配置

### service/Android.bp

```blueprint
java_library {
    name: "custom-service",
    srcs: [
        "**/*.java",
        ":custom-service-aidl",
    ],
    static_libs: [
        "services.core",
    ],
    sdk_version: "system_current",
    installable: false,
}

filegroup {
    name: "custom-service-aidl",
    srcs: [
        "../aidl/**/*.aidl",
    ],
    path: "../aidl",
}
```

## 權限定義

在 `frameworks/base/core/res/AndroidManifest.xml` 中添加：

```xml
<!-- Custom Service Access Permission -->
<permission android:name="android.permission.ACCESS_CUSTOM_SERVICE"
    android:protectionLevel="signature|privileged"
    android:label="@string/permlab_accessCustomService"
    android:description="@string/permdesc_accessCustomService" />
```

## SELinux 策略

### custom_service.te

```
# 定義服務類型
type custom_service, system_api_service, system_server_service, service_manager_type;

# 允許 system_server 添加服務
allow system_server custom_service:service_manager add;

# 允許應用查找服務
allow appdomain custom_service:service_manager find;

# 允許系統應用訪問
allow system_app custom_service:service_manager find;
allow platform_app custom_service:service_manager find;
```

### service_contexts

```
custom                                    u:object_r:custom_service:s0
```

## 測試範例

### 單元測試

```java
@RunWith(AndroidJUnit4.class)
public class CustomServiceTest {
    private CustomService mService;
    private Context mContext;

    @Before
    public void setUp() {
        mContext = InstrumentationRegistry.getInstrumentation().getContext();
        mService = new CustomService(mContext);
        mService.systemReady();
    }

    @Test
    public void testServiceReady() {
        assertTrue(mService.isReady());
    }

    @Test
    public void testDataStorage() {
        String key = "test_key";
        String value = "test_value";

        mService.setData(key, value);
        String result = mService.getData(key);

        assertEquals(value, result);
    }

    @Test
    public void testCallbackRegistration() {
        ICustomServiceCallback callback = new ICustomServiceCallback.Stub() {
            @Override
            public void onStatusChanged(int status) {}
            @Override
            public void onDataUpdated(String key, String value) {}
            @Override
            public void onError(int errorCode, String message) {}
        };

        mService.registerCallback(callback);
        // 驗證註冊成功
    }
}
```

## 使用流程

### 1. 整合到 AOSP

```bash
# 複製服務代碼到 AOSP
cp -r custom-system-service/service/* \
    frameworks/base/services/core/java/com/android/server/custom/

cp -r custom-system-service/aidl/* \
    frameworks/base/core/java/com/android/server/custom/
```

### 2. 修改 SystemServer

編輯 `frameworks/base/services/java/com/android/server/SystemServer.java`

### 3. 編譯 Framework

```bash
source build/envsetup.sh
lunch aosp_x86_64-eng
m framework
m services
```

### 4. 刷入系統

```bash
adb root
adb remount
adb push out/target/product/generic_x86_64/system/framework/services.jar \
    /system/framework/
adb reboot
```

## 除錯指南

### 查看服務狀態

```bash
# 檢查服務是否註冊
adb shell service list | grep custom

# 查看服務資訊
adb shell dumpsys custom

# 查看日誌
adb logcat -s CustomService:*
```

### 常見問題

1. **服務未註冊**: 檢查 SystemServer 是否正確調用
2. **權限拒絕**: 確認 SELinux 策略和 AndroidManifest 權限
3. **Binder 崩潰**: 檢查 AIDL 介面版本一致性
4. **記憶體洩漏**: 確保正確反註冊 callback

## 性能優化

- 使用 `oneway` 關鍵字進行異步調用
- 批次處理 Binder 通訊
- 使用 `RemoteCallbackList` 管理回調
- 避免在 Binder 調用中執行耗時操作

## 安全建議

- 始終進行權限檢查
- 驗證調用者身份
- 限制敏感操作的訪問
- 記錄重要操作日誌

## 參考資源

- [Android Binder IPC](https://source.android.com/docs/core/architecture/aidl)
- [System Services](https://source.android.com/docs/core/architecture/services)
- [SELinux for Android](https://source.android.com/docs/security/features/selinux)

---

**版本**: 1.0.0
**最後更新**: 2025-11-16
**相容性**: Android 10+
