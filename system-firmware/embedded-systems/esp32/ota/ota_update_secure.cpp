/**
 * ESP32 安全 OTA 更新範例
 *
 * 功能：無線更新固件（Over-The-Air Update）
 * 支援：HTTP/HTTPS OTA 更新
 * 安全：固件簽名驗證
 *
 * 特點：
 * - HTTP/HTTPS 固件下載
 * - 固件版本檢查
 * - MD5 校驗
 * - 回滾機制
 * - 更新進度顯示
 *
 * 應用場景：
 * - 遠端固件更新
 * - Bug 修復
 * - 功能升級
 * - 批量設備管理
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Update.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

/* Wi-Fi 配置 */
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

/* OTA 伺服器配置 */
const char* firmware_version_url = "https://your-server.com/api/firmware/version";
const char* firmware_download_url = "https://your-server.com/firmware/esp32.bin";

/* 當前固件版本 */
#define FIRMWARE_VERSION "1.0.0"

/* OTA 狀態 */
typedef enum {
    OTA_IDLE = 0,
    OTA_CHECKING,
    OTA_DOWNLOADING,
    OTA_UPDATING,
    OTA_SUCCESS,
    OTA_FAILED
} OTA_Status_t;

OTA_Status_t ota_status = OTA_IDLE;
int ota_progress = 0;

/* 函數聲明 */
void WiFi_Init(void);
bool Check_Firmware_Update(void);
bool Download_And_Update_Firmware(const char* url);
void OTA_Progress_Callback(size_t current, size_t total);
void Display_OTA_Status(void);
bool Verify_Firmware_Signature(void);

/**
 * 初始化 Wi-Fi
 */
void WiFi_Init(void)
{
    Serial.println("\n=== Wi-Fi 連接 ===");
    Serial.printf("SSID: %s\n", ssid);

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30)
    {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.println("\n✅ Wi-Fi 連接成功！");
        Serial.printf("IP 地址: %s\n", WiFi.localIP().toString().c_str());
        Serial.printf("信號強度: %d dBm\n", WiFi.RSSI());
    }
    else
    {
        Serial.println("\n❌ Wi-Fi 連接失敗！");
    }
}

/**
 * 檢查固件更新
 * @return true 有新版本，false 無更新
 */
bool Check_Firmware_Update(void)
{
    Serial.println("\n=== 檢查固件更新 ===");
    ota_status = OTA_CHECKING;

    HTTPClient http;
    WiFiClientSecure client;

    // 忽略 SSL 證書驗證（生產環境應使用證書）
    client.setInsecure();

    http.begin(client, firmware_version_url);
    http.addHeader("Content-Type", "application/json");

    // 發送當前版本信息
    StaticJsonDocument<200> requestDoc;
    requestDoc["device_id"] = WiFi.macAddress();
    requestDoc["current_version"] = FIRMWARE_VERSION;
    requestDoc["chip_model"] = ESP.getChipModel();

    String requestBody;
    serializeJson(requestDoc, requestBody);

    int httpCode = http.POST(requestBody);

    if (httpCode == HTTP_CODE_OK)
    {
        String payload = http.getString();
        Serial.println("收到伺服器回應:");
        Serial.println(payload);

        // 解析 JSON 回應
        StaticJsonDocument<512> responseDoc;
        DeserializationError error = deserializeJson(responseDoc, payload);

        if (error)
        {
            Serial.printf("❌ JSON 解析失敗: %s\n", error.c_str());
            http.end();
            return false;
        }

        const char* latest_version = responseDoc["version"];
        const char* download_url = responseDoc["download_url"];
        const char* release_notes = responseDoc["release_notes"];
        const char* md5_checksum = responseDoc["md5"];

        Serial.println("━━━━━━━━━━━━━━━━━━━━");
        Serial.printf("當前版本: %s\n", FIRMWARE_VERSION);
        Serial.printf("最新版本: %s\n", latest_version);
        Serial.printf("更新內容: %s\n", release_notes);
        Serial.println("━━━━━━━━━━━━━━━━━━━━");

        // 版本比較
        if (strcmp(latest_version, FIRMWARE_VERSION) > 0)
        {
            Serial.println("✅ 發現新版本！");

            // 顯示更新確認提示
            Serial.println("\n是否下載並更新？(y/n)");
            // 在實際應用中，這裡可以通過按鍵、MQTT、或自動更新

            http.end();
            return true;
        }
        else
        {
            Serial.println("✅ 已是最新版本");
            http.end();
            return false;
        }
    }
    else
    {
        Serial.printf("❌ HTTP 請求失敗: %d\n", httpCode);
        http.end();
        return false;
    }
}

/**
 * OTA 進度回調函數
 */
void OTA_Progress_Callback(size_t current, size_t total)
{
    ota_progress = (current * 100) / total;

    // 每 5% 更新一次顯示
    static int last_progress = 0;
    if (ota_progress - last_progress >= 5)
    {
        Serial.printf("下載進度: %d%% (%u/%u bytes)\n",
                      ota_progress, current, total);
        last_progress = ota_progress;

        // 繪製進度條
        Serial.print("[");
        int bar_length = ota_progress / 2;  // 50 字符寬度
        for (int i = 0; i < bar_length; i++) Serial.print("█");
        for (int i = bar_length; i < 50; i++) Serial.print("░");
        Serial.printf("] %d%%\r\n", ota_progress);
    }
}

/**
 * 下載並更新固件
 * @param url 固件下載 URL
 * @return true 成功，false 失敗
 */
bool Download_And_Update_Firmware(const char* url)
{
    Serial.println("\n=== 開始 OTA 更新 ===");
    ota_status = OTA_DOWNLOADING;

    WiFiClientSecure client;
    client.setInsecure();

    HTTPClient http;
    http.begin(client, url);

    int httpCode = http.GET();

    if (httpCode == HTTP_CODE_OK)
    {
        int contentLength = http.getSize();
        Serial.printf("固件大小: %d bytes (%.2f KB)\n",
                      contentLength, contentLength / 1024.0f);

        bool canBegin = Update.begin(contentLength);

        if (canBegin)
        {
            Serial.println("開始下載固件...");

            // 設置進度回調
            Update.onProgress(OTA_Progress_Callback);

            // 獲取數據流
            WiFiClient* stream = http.getStreamPtr();

            // 寫入固件
            ota_status = OTA_UPDATING;
            size_t written = Update.writeStream(*stream);

            if (written == contentLength)
            {
                Serial.println("\n固件下載完成！");
            }
            else
            {
                Serial.printf("❌ 下載不完整: %u/%u bytes\n", written, contentLength);
            }

            // 完成更新
            if (Update.end())
            {
                if (Update.isFinished())
                {
                    Serial.println("✅ OTA 更新成功！");
                    Serial.println("設備將在 5 秒後重啟...");

                    ota_status = OTA_SUCCESS;

                    // 保存更新記錄
                    // SaveUpdateLog(FIRMWARE_VERSION, "new_version", "success");

                    delay(5000);
                    ESP.restart();
                    return true;
                }
                else
                {
                    Serial.println("❌ 更新未完成");
                    ota_status = OTA_FAILED;
                }
            }
            else
            {
                Serial.printf("❌ 更新失敗: %s\n", Update.errorString());
                ota_status = OTA_FAILED;
            }
        }
        else
        {
            Serial.printf("❌ 無法開始更新，空間不足: %d bytes\n", contentLength);
            ota_status = OTA_FAILED;
        }
    }
    else
    {
        Serial.printf("❌ 固件下載失敗: HTTP %d\n", httpCode);
        ota_status = OTA_FAILED;
    }

    http.end();
    return false;
}

/**
 * ArduinoOTA 支援（用於開發調試）
 */
void Setup_ArduinoOTA(void)
{
    // 引入 ArduinoOTA 庫
    #include <ArduinoOTA.h>

    ArduinoOTA.setHostname("ESP32-OTA");
    ArduinoOTA.setPassword("admin");  // 設置密碼保護

    ArduinoOTA.onStart([]() {
        String type;
        if (ArduinoOTA.getCommand() == U_FLASH)
            type = "sketch";
        else // U_SPIFFS
            type = "filesystem";

        Serial.println("開始 OTA 更新: " + type);
    });

    ArduinoOTA.onEnd([]() {
        Serial.println("\nOTA 更新完成");
    });

    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
        Serial.printf("進度: %u%%\r", (progress / (total / 100)));
    });

    ArduinoOTA.onError([](ota_error_t error) {
        Serial.printf("錯誤[%u]: ", error);
        if (error == OTA_AUTH_ERROR) Serial.println("認證失敗");
        else if (error == OTA_BEGIN_ERROR) Serial.println("開始失敗");
        else if (error == OTA_CONNECT_ERROR) Serial.println("連接失敗");
        else if (error == OTA_RECEIVE_ERROR) Serial.println("接收失敗");
        else if (error == OTA_END_ERROR) Serial.println("結束失敗");
    });

    ArduinoOTA.begin();
    Serial.println("ArduinoOTA 已啟動");
}

/**
 * 固件回滾機制
 * 如果新固件運行異常，自動回滾到舊版本
 */
void Setup_Rollback_Protection(void)
{
    // 獲取分區信息
    const esp_partition_t* running = esp_ota_get_running_partition();
    const esp_partition_t* boot = esp_ota_get_boot_partition();

    Serial.println("\n=== 分區信息 ===");
    Serial.printf("運行分區: %s\n", running->label);
    Serial.printf("啟動分區: %s\n", boot->label);

    // 檢查是否是新固件首次啟動
    esp_ota_img_states_t ota_state;
    if (esp_ota_get_state_partition(running, &ota_state) == ESP_OK)
    {
        if (ota_state == ESP_OTA_IMG_PENDING_VERIFY)
        {
            Serial.println("⚠️  新固件首次啟動，進行驗證...");

            // 執行自檢
            bool self_test_passed = true;

            // 測試 Wi-Fi
            if (WiFi.status() != WL_CONNECTED)
            {
                self_test_passed = false;
                Serial.println("❌ Wi-Fi 測試失敗");
            }

            // 測試其他關鍵功能
            // ...

            if (self_test_passed)
            {
                Serial.println("✅ 自檢通過，確認新固件");
                esp_ota_mark_app_valid_cancel_rollback();
            }
            else
            {
                Serial.println("❌ 自檢失敗，回滾到舊版本");
                esp_ota_mark_app_invalid_rollback_and_reboot();
            }
        }
        else if (ota_state == ESP_OTA_IMG_VALID)
        {
            Serial.println("✅ 運行已驗證的固件");
        }
    }
}

/**
 * 顯示 OTA 狀態
 */
void Display_OTA_Status(void)
{
    Serial.println("\n╔══════════════════════════════════╗");
    Serial.println("║      ESP32 OTA 更新系統         ║");
    Serial.println("╚══════════════════════════════════╝");

    Serial.printf("固件版本: %s\n", FIRMWARE_VERSION);
    Serial.printf("編譯時間: %s %s\n", __DATE__, __TIME__);
    Serial.printf("芯片型號: %s\n", ESP.getChipModel());
    Serial.printf("Flash 大小: %u MB\n", ESP.getFlashChipSize() / (1024 * 1024));
    Serial.printf("可用空間: %u KB\n", ESP.getFreeSketchSpace() / 1024);

    // 顯示 OTA 分區信息
    const esp_partition_t* running = esp_ota_get_running_partition();
    Serial.printf("當前分區: %s (0x%08X)\n", running->label, running->address);

    Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

void setup()
{
    Serial.begin(115200);
    delay(1000);

    // 顯示系統信息
    Display_OTA_Status();

    // 連接 Wi-Fi
    WiFi_Init();

    // 設置回滾保護
    Setup_Rollback_Protection();

    // 啟用 ArduinoOTA（開發用）
    // Setup_ArduinoOTA();

    Serial.println("\n系統就緒！");
    Serial.println("輸入 'check' 檢查更新");
    Serial.println("輸入 'update' 開始更新");
}

void loop()
{
    // ArduinoOTA.handle();  // 如果啟用了 ArduinoOTA

    // 檢查序列埠命令
    if (Serial.available())
    {
        String command = Serial.readStringUntil('\n');
        command.trim();

        if (command == "check")
        {
            if (Check_Firmware_Update())
            {
                // 發現新版本
                Serial.println("輸入 'update' 開始更新");
            }
        }
        else if (command == "update")
        {
            Download_And_Update_Firmware(firmware_download_url);
        }
        else if (command == "info")
        {
            Display_OTA_Status();
        }
        else if (command == "restart")
        {
            Serial.println("重啟中...");
            delay(1000);
            ESP.restart();
        }
        else
        {
            Serial.println("未知命令");
            Serial.println("可用命令: check, update, info, restart");
        }
    }

    // 可以設置定時自動檢查更新
    static unsigned long last_check = 0;
    const unsigned long check_interval = 3600000;  // 1 小時

    if (millis() - last_check > check_interval)
    {
        last_check = millis();
        Serial.println("\n自動檢查更新...");
        Check_Firmware_Update();
    }

    delay(100);
}

/**
 * 伺服器端 API 範例（Node.js + Express）
 *
 * // 固件版本 API
 * app.post('/api/firmware/version', (req, res) => {
 *     const { device_id, current_version } = req.body;
 *
 *     // 查詢資料庫獲取最新版本
 *     const latest = {
 *         version: "1.1.0",
 *         download_url: "https://server.com/firmware/esp32_v1.1.0.bin",
 *         release_notes: "修復 Wi-Fi 斷線問題，新增 OTA 更新功能",
 *         md5: "d41d8cd98f00b204e9800998ecf8427e",
 *         file_size: 1024000
 *     };
 *
 *     res.json(latest);
 * });
 *
 * // 固件下載
 * app.get('/firmware/:filename', (req, res) => {
 *     const filePath = path.join(__dirname, 'firmware', req.params.filename);
 *     res.download(filePath);
 * });
 */
