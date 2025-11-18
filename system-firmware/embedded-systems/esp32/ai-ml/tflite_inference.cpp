/**
 * ESP32 TensorFlow Lite 推論範例
 *
 * 功能：在 ESP32 上運行輕量級深度學習模型
 * 框架：TensorFlow Lite for Microcontrollers
 * 模型：簡單的數字識別模型（MNIST）
 *
 * 特點：
 * - 邊緣 AI 推論
 * - 低記憶體占用
 * - 實時處理
 * - 感測器數據分類
 *
 * 應用場景：
 * - 語音喚醒詞檢測
 * - 手勢識別
 * - 異常檢測
 * - 預測性維護
 */

#include <Arduino.h>
#include "tensorflow/lite/micro/all_ops_resolver.h"
#include "tensorflow/lite/micro/micro_error_reporter.h"
#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/schema/schema_generated.h"
#include "tensorflow/lite/version.h"

// 包含轉換後的模型（C 數組）
#include "model_data.h"

/* TensorFlow Lite 相關 */
namespace {
    tflite::ErrorReporter* error_reporter = nullptr;
    const tflite::Model* model = nullptr;
    tflite::MicroInterpreter* interpreter = nullptr;
    TfLiteTensor* input = nullptr;
    TfLiteTensor* output = nullptr;

    // Tensor Arena - 為模型分配記憶體
    constexpr int kTensorArenaSize = 60 * 1024;  // 60 KB
    uint8_t tensor_arena[kTensorArenaSize];
}

/* 測試數據 - 手寫數字 "2" 的 28x28 圖像 */
const float test_image[784] = {
    // ... 28x28 = 784 個像素值 (0.0 ~ 1.0)
    0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, // ...
    // 此處省略完整數據，實際使用時需要完整的圖像數據
};

/**
 * TensorFlow Lite 初始化
 */
bool TFLite_Init(void)
{
    Serial.println("\n=== TensorFlow Lite 初始化 ===");

    // 設置錯誤報告器
    static tflite::MicroErrorReporter micro_error_reporter;
    error_reporter = &micro_error_reporter;

    // 載入模型
    model = tflite::GetModel(g_model);  // g_model 來自 model_data.h
    if (model->version() != TFLITE_SCHEMA_VERSION)
    {
        Serial.printf("❌ 模型版本不匹配！\n");
        Serial.printf("   模型版本: %d\n", model->version());
        Serial.printf("   支援版本: %d\n", TFLITE_SCHEMA_VERSION);
        return false;
    }
    Serial.println("✅ 模型載入成功");

    // 載入所有操作
    static tflite::AllOpsResolver resolver;

    // 建立解釋器
    static tflite::MicroInterpreter static_interpreter(
        model, resolver, tensor_arena, kTensorArenaSize, error_reporter);
    interpreter = &static_interpreter;

    // 分配張量記憶體
    TfLiteStatus allocate_status = interpreter->AllocateTensors();
    if (allocate_status != kTfLiteOk)
    {
        Serial.println("❌ 張量記憶體分配失敗！");
        return false;
    }
    Serial.println("✅ 張量記憶體分配成功");

    // 獲取輸入張量指標
    input = interpreter->input(0);
    Serial.printf("輸入張量維度: %d\n", input->dims->size);
    for (int i = 0; i < input->dims->size; i++)
    {
        Serial.printf("  dim[%d] = %d\n", i, input->dims->data[i]);
    }

    // 獲取輸出張量指標
    output = interpreter->output(0);
    Serial.printf("輸出張量維度: %d\n", output->dims->size);
    for (int i = 0; i < output->dims->size; i++)
    {
        Serial.printf("  dim[%d] = %d\n", i, output->dims->data[i]);
    }

    // 顯示記憶體使用
    Serial.printf("\n記憶體使用:\n");
    Serial.printf("  Tensor Arena: %d bytes\n", kTensorArenaSize);
    Serial.printf("  已使用: %d bytes\n", interpreter->arena_used_bytes());
    Serial.printf("  剩餘: %d bytes\n", kTensorArenaSize - interpreter->arena_used_bytes());

    return true;
}

/**
 * 執行推論
 * @param input_data 輸入數據（28x28 圖像）
 * @return 預測的數字 (0-9)
 */
int TFLite_Inference(const float* input_data)
{
    // 複製輸入數據到輸入張量
    for (int i = 0; i < 784; i++)
    {
        input->data.f[i] = input_data[i];
    }

    // 執行推論
    unsigned long start_time = micros();
    TfLiteStatus invoke_status = interpreter->Invoke();
    unsigned long inference_time = micros() - start_time;

    if (invoke_status != kTfLiteOk)
    {
        Serial.println("❌ 推論失敗！");
        return -1;
    }

    // 解析輸出（找出最大概率的類別）
    int predicted_digit = 0;
    float max_probability = output->data.f[0];

    Serial.println("\n預測結果:");
    Serial.println("━━━━━━━━━━━━━━━━━━━━");
    for (int i = 0; i < 10; i++)
    {
        float probability = output->data.f[i];
        Serial.printf("數字 %d: %.2f%%", i, probability * 100.0f);

        if (probability > max_probability)
        {
            max_probability = probability;
            predicted_digit = i;
        }

        // 繪製條形圖
        int bar_length = (int)(probability * 50);
        Serial.print("  [");
        for (int j = 0; j < bar_length; j++) Serial.print("█");
        for (int j = bar_length; j < 50; j++) Serial.print(" ");
        Serial.println("]");
    }
    Serial.println("━━━━━━━━━━━━━━━━━━━━");

    Serial.printf("\n✅ 預測數字: %d\n", predicted_digit);
    Serial.printf("信心度: %.2f%%\n", max_probability * 100.0f);
    Serial.printf("推論時間: %lu µs (%.2f ms)\n",
                  inference_time, inference_time / 1000.0f);

    return predicted_digit;
}

/**
 * 從感測器讀取數據並進行推論
 * 範例：加速度計數據用於手勢識別
 */
void Sensor_Based_Inference(void)
{
    Serial.println("\n=== 感測器數據推論 ===");

    // 模擬從加速度計讀取數據
    // 實際應用中，這裡會是真實的感測器數據
    float sensor_data[128];  // 假設模型需要 128 個樣本

    // 填充模擬數據（實際使用時應從感測器讀取）
    for (int i = 0; i < 128; i++)
    {
        // 模擬一個簡單的波形
        sensor_data[i] = sin(i * 0.1) * 0.5 + 0.5;
    }

    // 數據預處理
    // 1. 歸一化
    float min_val = sensor_data[0];
    float max_val = sensor_data[0];
    for (int i = 1; i < 128; i++)
    {
        if (sensor_data[i] < min_val) min_val = sensor_data[i];
        if (sensor_data[i] > max_val) max_val = sensor_data[i];
    }

    for (int i = 0; i < 128; i++)
    {
        sensor_data[i] = (sensor_data[i] - min_val) / (max_val - min_val);
    }

    // 2. 複製到模型輸入
    for (int i = 0; i < 128; i++)
    {
        input->data.f[i] = sensor_data[i];
    }

    // 執行推論
    TfLiteStatus invoke_status = interpreter->Invoke();
    if (invoke_status != kTfLiteOk)
    {
        Serial.println("❌ 推論失敗！");
        return;
    }

    // 解析結果（假設是手勢分類：0=靜止, 1=揮手, 2=敲擊）
    const char* gestures[] = {"靜止", "揮手", "敲擊"};
    int predicted_gesture = 0;
    float max_prob = output->data.f[0];

    for (int i = 1; i < 3; i++)
    {
        if (output->data.f[i] > max_prob)
        {
            max_prob = output->data.f[i];
            predicted_gesture = i;
        }
    }

    Serial.printf("✅ 偵測到手勢: %s (%.2f%%)\n",
                  gestures[predicted_gesture], max_prob * 100.0f);
}

/**
 * 音頻喚醒詞檢測範例
 */
void Wake_Word_Detection(void)
{
    Serial.println("\n=== 語音喚醒詞檢測 ===");
    Serial.println("說出喚醒詞: 'Hey ESP32'");

    // 這裡需要配合 I2S 音頻輸入
    // 1. 從麥克風讀取音頻數據
    // 2. 特徵提取（MFCC）
    // 3. 餵入模型
    // 4. 檢測是否為喚醒詞

    // 模擬音頻特徵數據
    float audio_features[40];  // MFCC 特徵
    for (int i = 0; i < 40; i++)
    {
        audio_features[i] = random(0, 100) / 100.0f;
    }

    // ... 推論代碼 ...

    Serial.println("💡 提示: 完整實現需要 I2S 音頻輸入和 MFCC 特徵提取");
}

/**
 * 性能基準測試
 */
void Performance_Benchmark(void)
{
    Serial.println("\n=== 性能基準測試 ===");

    const int num_runs = 100;
    unsigned long total_time = 0;

    for (int i = 0; i < num_runs; i++)
    {
        // 填充隨機輸入
        for (int j = 0; j < 784; j++)
        {
            input->data.f[j] = random(0, 100) / 100.0f;
        }

        // 測量推論時間
        unsigned long start = micros();
        interpreter->Invoke();
        unsigned long duration = micros() - start;

        total_time += duration;
    }

    float avg_time = total_time / (float)num_runs;
    float fps = 1000000.0f / avg_time;

    Serial.println("━━━━━━━━━━━━━━━━━━━━");
    Serial.printf("測試次數: %d\n", num_runs);
    Serial.printf("平均推論時間: %.2f ms\n", avg_time / 1000.0f);
    Serial.printf("推論速度: %.2f FPS\n", fps);
    Serial.println("━━━━━━━━━━━━━━━━━━━━");
}

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n╔════════════════════════════════════╗");
    Serial.println("║  ESP32 TensorFlow Lite 推論範例  ║");
    Serial.println("╚════════════════════════════════════╝");

    // 顯示系統信息
    Serial.printf("\nESP32 信息:\n");
    Serial.printf("  芯片型號: %s\n", ESP.getChipModel());
    Serial.printf("  CPU 頻率: %d MHz\n", ESP.getCpuFreqMHz());
    Serial.printf("  Flash 大小: %d MB\n", ESP.getFlashChipSize() / (1024 * 1024));
    Serial.printf("  可用 RAM: %d KB\n", ESP.getFreeHeap() / 1024);
    Serial.printf("  PSRAM: %d KB\n", ESP.getPsramSize() / 1024);

    // 初始化 TensorFlow Lite
    if (!TFLite_Init())
    {
        Serial.println("❌ TensorFlow Lite 初始化失敗！");
        while (1) delay(1000);
    }

    Serial.println("\n系統就緒！");
}

void loop()
{
    Serial.println("\n\n按任意鍵開始推論...");
    while (!Serial.available()) delay(100);
    while (Serial.available()) Serial.read();  // 清空緩衝區

    // 執行數字識別推論
    int result = TFLite_Inference(test_image);

    // 執行性能測試
    Performance_Benchmark();

    // 等待下一次測試
    delay(3000);
}

/**
 * model_data.h 範例（需要單獨創建）
 *
 * 使用以下步驟生成：
 * 1. 訓練 TensorFlow 模型
 * 2. 轉換為 TensorFlow Lite: converter = tf.lite.TFLiteConverter.from_keras_model(model)
 * 3. 優化模型: converter.optimizations = [tf.lite.Optimize.DEFAULT]
 * 4. 轉換為 C 數組: xxd -i model.tflite > model_data.h
 *
 * model_data.h 內容範例:
 *
 * const unsigned char g_model[] = {
 *     0x1c, 0x00, 0x00, 0x00, 0x54, 0x46, 0x4c, 0x33, ...
 * };
 * const unsigned int g_model_len = 2352;
 */
