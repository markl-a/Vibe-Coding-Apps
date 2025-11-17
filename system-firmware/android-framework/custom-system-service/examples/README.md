# CustomService 使用範例

本目錄包含多個實際應用場景的範例程式碼，展示如何使用 CustomServiceClient 和 CustomData 類別。

## 範例列表

### 1. DeviceMonitorExample.java
**設備監控範例**

展示如何使用 CustomServiceClient 監控設備狀態，包括：
- 電池電量監控
- 溫度監控
- CPU 使用率監控
- 記憶體使用情況監控
- 定期輪詢機制
- 事件回調處理

**適用場景：**
- 系統監控應用
- 性能分析工具
- 設備健康檢查
- 即時狀態顯示

**主要功能：**
```java
DeviceMonitorExample monitor = new DeviceMonitorExample(context, new DeviceStatusListener() {
    @Override
    public void onBatteryLevelChanged(int level) {
        // 處理電池電量變化
    }

    @Override
    public void onTemperatureChanged(float temperature) {
        // 處理溫度變化
    }

    @Override
    public void onCpuUsageChanged(float usage) {
        // 處理 CPU 使用率變化
    }

    @Override
    public void onMemoryUsageChanged(long used, long total) {
        // 處理記憶體使用變化
    }
});

monitor.startMonitoring();  // 開始監控
// ...
monitor.stopMonitoring();   // 停止監控
```

---

### 2. DataSyncExample.java
**資料同步範例**

展示如何使用 CustomServiceClient 進行批次資料同步，包括：
- 用戶設置同步
- 應用資料同步
- 批次資料上傳/下載
- 增量同步
- 強制完整同步
- 同步進度追蹤

**適用場景：**
- 雲端資料同步
- 應用設置備份
- 離線資料上傳
- 跨設備資料同步

**主要功能：**
```java
DataSyncExample syncManager = new DataSyncExample(context, new SyncCallback() {
    @Override
    public void onSyncStarted() {
        // 同步開始
    }

    @Override
    public void onSyncProgress(int current, int total) {
        // 同步進度更新
    }

    @Override
    public void onSyncCompleted(boolean success, String message) {
        // 同步完成
    }
});

// 同步用戶設置
Map<String, String> settings = new HashMap<>();
settings.put("theme", "dark");
settings.put("language", "zh_TW");
syncManager.syncUserSettings(settings);

// 增量同步
long lastSyncTime = sharedPreferences.getLong("last_sync", 0);
syncManager.incrementalSync(lastSyncTime);

// 獲取同步統計
SyncStatistics stats = syncManager.getSyncStatistics();
```

---

### 3. CustomDataExample.java
**CustomData 使用範例**

展示 CustomData 類別的各種使用方法，包含 8 個實例：

#### 範例 1: 基本使用
基本的 CustomData 物件創建和屬性設置

#### 範例 2: 不同資料類型
演示四種資料類型的使用：
- TYPE_STRING: 字串類型
- TYPE_INTEGER: 整數類型
- TYPE_FLOAT: 浮點數類型
- TYPE_BOOLEAN: 布林類型

#### 範例 3: Parcelable 序列化/反序列化
展示跨進程資料傳輸的序列化機制

#### 範例 4: 感測器資料封裝
實際應用：封裝多個感測器的讀數
- 溫度
- 濕度
- 氣壓
- 光照強度

#### 範例 5: 系統配置管理
使用 CustomData 管理系統配置：
- 螢幕亮度
- 系統音量
- Wi-Fi/藍牙狀態
- 語言設置

#### 範例 6: 資料驗證和轉換
根據資料類型進行正確的解析和轉換

#### 範例 7: 批次資料處理
批次創建、過濾、計算資料

#### 範例 8: 時間戳記應用
利用時間戳進行資料有效期管理

**使用方法：**
```java
// 運行所有範例
CustomDataExample.runAllExamples();

// 或運行單個範例
CustomDataExample.example4_SensorDataEncapsulation();
```

---

## 如何使用這些範例

### 1. 導入到你的專案
將需要的範例文件複製到你的專案中，並根據需要修改 package 名稱。

### 2. 添加依賴
確保你的專案已經包含 CustomServiceClient 和相關 AIDL 文件。

### 3. 修改和擴展
這些範例是模板，可以根據實際需求進行修改：
- 調整監控間隔
- 自定義回調處理
- 添加錯誤處理邏輯
- 整合到實際業務邏輯中

### 4. 測試
在實際設備或模擬器上測試這些範例，確保功能正常。

---

## 注意事項

1. **權限要求**
   - 某些功能可能需要系統權限
   - 確保在 AndroidManifest.xml 中聲明必要的權限

2. **執行緒安全**
   - UI 更新必須在主執行緒進行
   - 範例中已使用 `runOnUiThread()` 處理

3. **資源管理**
   - 使用完畢後記得調用 `release()` 釋放資源
   - 避免記憶體洩漏

4. **錯誤處理**
   - 範例包含基本的錯誤處理
   - 實際應用中應加強錯誤處理和日誌記錄

5. **性能考慮**
   - 監控間隔不宜過短，避免影響性能
   - 批次操作優於單個操作
   - 考慮使用增量同步而非完整同步

---

## 進階主題

### 自定義監控項目
擴展 DeviceMonitorExample 添加更多監控項目：
```java
// 監控網路狀態
String networkStatus = mClient.getData("network_status");

// 監控存儲空間
String storageInfo = mClient.getData("storage_info");
```

### 實現衝突解決
在資料同步中處理衝突：
```java
// 基於時間戳的衝突解決
if (localData.getTimestamp() > remoteData.getTimestamp()) {
    // 使用本地資料
} else {
    // 使用遠端資料
}
```

### 離線支持
實現離線資料快取和延遲同步：
```java
// 儲存到本地快取
saveToLocalCache(data);

// 網路恢復後同步
if (isNetworkAvailable()) {
    syncManager.syncFromCache();
}
```

---

## 相關文件

- [CustomServiceClient API 文檔](../client/CustomServiceClient.java)
- [CustomData API 文檔](../service/CustomData.java)
- [AIDL 介面定義](../aidl/)
- [主專案 README](../../README.md)

---

## 授權

與主專案相同的授權條款。
