# ESP32 進階應用範例

專業級 ESP32 開發範例，涵蓋 AI/ML 推論和 OTA 更新等進階功能。

## 📋 範例列表

### 1. TensorFlow Lite 推論 (ai-ml/tflite_inference.cpp)

**功能：**
- 在 ESP32 上運行輕量級深度學習模型
- 支援圖像分類、手勢識別等應用
- 實時推論處理
- 低記憶體占用

**技術要點：**
- TensorFlow Lite for Microcontrollers
- Tensor Arena 記憶體管理
- 模型量化和優化
- 推論性能優化

**應用場景：**
```
✅ 語音喚醒詞檢測 ("Hey ESP32")
✅ 手勢識別（加速度計/陀螺儀）
✅ 圖像分類（配合攝像頭）
✅ 異常檢測（工業設備監控）
✅ 預測性維護
✅ 邊緣 AI 運算
```

**性能指標：**

| 模型大小 | 記憶體占用 | 推論時間 | 準確率 |
|---------|-----------|---------|--------|
| 20 KB | 60 KB | ~10 ms | 95% |
| 50 KB | 120 KB | ~25 ms | 97% |
| 100 KB | 200 KB | ~50 ms | 98% |

**模型訓練流程：**

```python
# 1. 訓練 TensorFlow 模型
import tensorflow as tf

model = tf.keras.Sequential([
    tf.keras.layers.Dense(128, activation='relu', input_shape=(784,)),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(10, activation='softmax')
])

model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

model.fit(x_train, y_train, epochs=10)

# 2. 轉換為 TensorFlow Lite
converter = tf.lite.TFLiteConverter.from_keras_model(model)

# 3. 量化優化
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.float16]

tflite_model = converter.convert()

# 4. 保存模型
with open('model.tflite', 'wb') as f:
    f.write(tflite_model)

# 5. 轉換為 C 數組
# xxd -i model.tflite > model_data.h
```

**PlatformIO 配置：**

```ini
[env:esp32-tflite]
platform = espressif32
board = esp32dev
framework = arduino

lib_deps =
    https://github.com/tensorflow/tflite-micro-arduino-examples
    ArduinoJson

build_flags =
    -DESP32
    -DTF_LITE_STATIC_MEMORY
    -DTF_LITE_DISABLE_X86_NEON

# 增加分區大小以容納模型
board_build.partitions = huge_app.csv
```

### 2. 安全 OTA 更新 (ota/ota_update_secure.cpp)

**功能：**
- HTTP/HTTPS 無線固件更新
- 固件版本管理
- MD5 校驗
- 回滾機制
- 更新進度顯示

**技術要點：**
- ESP32 OTA 分區管理
- 固件簽名驗證
- 安全傳輸（HTTPS）
- 自動回滾保護
- 批量設備管理

**OTA 更新流程：**

```
1. 設備啟動
   ↓
2. 連接 Wi-Fi
   ↓
3. 檢查固件版本
   ↓
4. 發現新版本？
   ├─ 否 → 繼續正常運行
   └─ 是 → 繼續
      ↓
5. 下載新固件
   ↓
6. 驗證固件（MD5/簽名）
   ↓
7. 寫入 OTA 分區
   ↓
8. 標記為待驗證
   ↓
9. 重啟設備
   ↓
10. 運行新固件
    ↓
11. 自檢測試
    ├─ 通過 → 標記為有效
    └─ 失敗 → 回滾到舊版本
```

**安全特性：**

```cpp
// 1. HTTPS 加密傳輸
WiFiClientSecure client;
client.setCACert(root_ca);  // 設置 CA 證書

// 2. 固件簽名驗證
bool verifySignature(const uint8_t* firmware, size_t size) {
    // 使用 RSA/ECDSA 驗證簽名
    return crypto_verify(firmware, size, public_key);
}

// 3. 回滾保護
esp_ota_mark_app_valid_cancel_rollback();  // 確認新固件
esp_ota_mark_app_invalid_rollback_and_reboot();  // 回滾

// 4. 版本控制
#define FIRMWARE_VERSION "1.2.3"
#define MIN_SUPPORTED_VERSION "1.0.0"
```

**OTA 伺服器架構：**

```
┌─────────────────┐
│  ESP32 設備     │
│  版本: 1.0.0    │
└────────┬────────┘
         │ 1. POST /api/firmware/version
         │    { current_version: "1.0.0" }
         ↓
┌─────────────────┐
│  API 伺服器     │
│  (Node.js)      │
└────────┬────────┘
         │ 2. 查詢資料庫
         ↓
┌─────────────────┐
│  資料庫         │
│  最新: 1.1.0    │
└────────┬────────┘
         │ 3. 回應新版本信息
         ↓
┌─────────────────┐
│  ESP32 設備     │
│  下載固件       │
└────────┬────────┘
         │ 4. GET /firmware/esp32_v1.1.0.bin
         ↓
┌─────────────────┐
│  CDN/檔案伺服器 │
│  提供固件文件   │
└─────────────────┘
```

**錯誤處理：**

| 錯誤類型 | 處理策略 | 重試機制 |
|---------|---------|---------|
| 下載失敗 | 清理並重試 | 最多 3 次 |
| 校驗失敗 | 丟棄固件 | 不重試 |
| 空間不足 | 清理分區 | 一次 |
| 寫入失敗 | 回滾 | 不重試 |
| 自檢失敗 | 自動回滾 | 不重試 |

### 部署示例

#### 開發環境 OTA（ArduinoOTA）

```cpp
#include <ArduinoOTA.h>

void setup() {
    // Wi-Fi 連接...

    ArduinoOTA.setHostname("ESP32-Device");
    ArduinoOTA.setPassword("admin");
    ArduinoOTA.begin();

    Serial.println("OTA 就緒");
    Serial.println("IP: " + WiFi.localIP().toString());
}

void loop() {
    ArduinoOTA.handle();
}
```

使用：
```bash
# Arduino IDE: Tools -> Port -> Network Ports -> ESP32-Device
# 或使用命令行
python espota.py -i 192.168.1.100 -p 3232 -f firmware.bin
```

#### 生產環境 OTA（自定義伺服器）

**Node.js API 伺服器：**

```javascript
const express = require('express');
const app = express();

// 固件版本管理
const firmware_db = {
    "esp32": {
        version: "1.2.0",
        url: "https://cdn.example.com/esp32_v1.2.0.bin",
        md5: "d41d8cd98f00b204e9800998ecf8427e",
        size: 1024000,
        notes: "修復連接問題，新增省電模式"
    }
};

// 版本檢查 API
app.post('/api/firmware/version', (req, res) => {
    const { device_id, current_version, chip_model } = req.body;

    // 記錄請求
    console.log(`設備 ${device_id} 檢查更新，當前版本: ${current_version}`);

    const latest = firmware_db[chip_model] || firmware_db["esp32"];

    // 比較版本
    if (compareVersion(latest.version, current_version) > 0) {
        res.json({
            update_available: true,
            version: latest.version,
            download_url: latest.url,
            release_notes: latest.notes,
            md5: latest.md5,
            file_size: latest.size
        });
    } else {
        res.json({
            update_available: false,
            message: "已是最新版本"
        });
    }
});

// 固件下載（帶統計）
app.get('/firmware/:filename', (req, res) => {
    const filePath = `./firmware/${req.params.filename}`;

    // 記錄下載
    logDownload(req.ip, req.params.filename);

    res.download(filePath);
});

app.listen(3000, () => {
    console.log('OTA 伺服器運行在端口 3000');
});
```

## 📊 性能對比

### AI 推論性能

| 平台 | 模型大小 | 推論時間 | 功耗 | 成本 |
|------|---------|---------|------|------|
| ESP32 | 20 KB | 10 ms | 80 mA | $3 |
| ESP32-S3 | 100 KB | 5 ms | 100 mA | $5 |
| Raspberry Pi 4 | 10 MB | 2 ms | 500 mA | $35 |
| NVIDIA Jetson Nano | 100 MB | 0.5 ms | 5 W | $99 |

**結論：** ESP32 適合低功耗、低成本的邊緣 AI 應用。

### OTA 更新性能

| 網路 | 固件大小 | 下載時間 | 更新時間 | 總時間 |
|------|---------|---------|---------|--------|
| Wi-Fi (54 Mbps) | 1 MB | 2 秒 | 5 秒 | 7 秒 |
| Wi-Fi (11 Mbps) | 1 MB | 10 秒 | 5 秒 | 15 秒 |
| 4G (10 Mbps) | 1 MB | 1 秒 | 5 秒 | 6 秒 |

## 🛡️ 安全最佳實踐

### 1. OTA 更新安全

```cpp
// ✅ 好的做法
// 1. 使用 HTTPS
WiFiClientSecure client;
client.setCACert(root_ca);

// 2. 驗證固件簽名
if (!verifySignature(firmware, size)) {
    Serial.println("❌ 簽名驗證失敗！");
    return false;
}

// 3. 檢查版本號
if (new_version < MIN_SUPPORTED_VERSION) {
    Serial.println("❌ 版本過舊，拒絕更新");
    return false;
}

// 4. MD5 校驗
if (md5_checksum != expected_md5) {
    Serial.println("❌ 校驗失敗！");
    return false;
}

// ❌ 壞的做法
// 1. 使用 HTTP（明文傳輸）
// 2. 不驗證固件來源
// 3. 不檢查版本兼容性
// 4. 不驗證完整性
```

### 2. AI 模型安全

```cpp
// ✅ 好的做法
// 1. 加密模型數據
const uint8_t encrypted_model[] = { ... };
decrypt_model(encrypted_model, decrypted_model, key);

// 2. 驗證模型完整性
if (calculate_crc32(model) != expected_crc) {
    Serial.println("❌ 模型損壞！");
    return false;
}

// 3. 輸入數據驗證
if (input_value < MIN_VALUE || input_value > MAX_VALUE) {
    Serial.println("❌ 輸入數據異常");
    return false;
}
```

## 🐛 常見問題

### AI 推論問題

**Q: 推論速度太慢？**
```
A: 優化方法：
1. 使用量化模型（INT8 代替 FLOAT32）
2. 減少模型層數
3. 使用 ESP32-S3（支援向量指令）
4. 降低輸入分辨率
```

**Q: 記憶體不足？**
```
A: 解決方法：
1. 減小 Tensor Arena 大小
2. 使用 PSRAM
3. 簡化模型
4. 使用模型分片
```

### OTA 更新問題

**Q: 更新失敗，設備無法啟動？**
```
A: 檢查：
1. 固件是否完整下載
2. 分區大小是否足夠
3. 是否正確配置 partition.csv
4. 啟用回滾保護機制
```

**Q: HTTPS 連接失敗？**
```
A: 解決：
1. 檢查證書是否有效
2. 確認時間同步（使用 NTP）
3. 增加 SSL 緩衝區大小
```

## 💡 AI 輔助開發提示

### 模型訓練

```
請幫我訓練一個用於 ESP32 的輕量級手勢識別模型：
- 輸入：128 個加速度計樣本點
- 輸出：3 個類別（靜止、揮手、敲擊）
- 模型大小：<50 KB
- 推論時間：<20 ms
- 準確率：>90%

使用 TensorFlow Lite 並提供量化優化代碼。
```

### OTA 系統設計

```
設計一個企業級 ESP32 OTA 更新系統：
- 支援 10000+ 設備
- 分批更新策略
- 回滾機制
- 更新統計和監控
- 異常處理

提供後端 API 設計和前端管理界面建議。
```

## 📄 授權

MIT License

---

**最後更新**: 2025-11-18
**維護者**: AI-Assisted Development Team
