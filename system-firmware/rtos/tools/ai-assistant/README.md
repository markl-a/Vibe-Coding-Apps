# RTOS AI 輔助工具

## 📋 概述

這是一套強大的 AI 輔助工具集，用於簡化 RTOS 應用程式的開發、配置和優化。

## 🛠️ 工具列表

### 1. RTOS 代碼生成器 (`rtos_code_generator.py`)

自動生成 RTOS 應用程式框架代碼。

**功能特性：**
- 支持 FreeRTOS、Zephyr、RT-Thread
- AI 智能建議堆疊大小和優先級
- 交互式和配置文件兩種模式
- 自動生成任務、佇列、信號量代碼
- 生成完整可編譯的框架

**使用方法：**

```bash
# 交互式模式
python3 rtos_code_generator.py --interactive

# 從配置文件生成
python3 rtos_code_generator.py --config example_config.json --output my_app.c
```

**配置文件示例：**

```json
{
  "project_name": "my_project",
  "rtos_type": "freertos",
  "tasks": [
    {
      "name": "SensorTask",
      "description": "Read sensors via I2C",
      "priority": 3,
      "stack_size": 512
    }
  ]
}
```

**AI 功能：**
- 根據任務描述自動建議堆疊大小
- 根據任務類型自動建議優先級
- 生成項目結構建議

### 2. 配置優化器 (`config_optimizer.py`)

分析和優化 FreeRTOS 配置文件。

**功能特性：**
- 自動檢測配置問題
- 提供優化建議
- 生成優化後的配置文件
- 電源優化分析
- 安全性檢查

**使用方法：**

```bash
# 分析配置文件
python3 config_optimizer.py FreeRTOSConfig.h

# 生成優化配置
python3 config_optimizer.py FreeRTOSConfig.h --output FreeRTOSConfig_optimized.h

# 包含電源優化建議
python3 config_optimizer.py FreeRTOSConfig.h --power
```

**檢查項目：**

1. **記憶體配置**
   - 堆大小是否合理
   - 是否足夠支持所有任務
   - 記憶體分配失敗處理

2. **性能配置**
   - 滴答率設置
   - 任務優先級數量
   - 運行時統計

3. **安全性配置**
   - 堆疊溢位檢測
   - 斷言啟用
   - 錯誤處理鉤子

4. **中斷優先級**
   - 優先級設置正確性
   - 內核優先級配置

5. **可選功能**
   - 未啟用的有用功能
   - 功能建議

**輸出示例：**

```
╔═══════════════════════════════════════════╗
║      Configuration Analysis Report       ║
╚═══════════════════════════════════════════╝

Summary: 1 errors, 3 warnings, 2 info

❌ ERRORS:
──────────────────────────────────────────
  [Memory] Line 52: Heap size too small: 512 bytes
    💡 Increase configTOTAL_HEAP_SIZE to at least 1024 bytes

⚠️  WARNINGS:
──────────────────────────────────────────
  [Safety] Line 68: Stack overflow detection disabled
    💡 Enable with value 1 or 2 for better debugging
```

## 🎯 使用場景

### 場景 1: 快速原型開發

使用代碼生成器快速創建項目框架：

```bash
python3 rtos_code_generator.py --interactive
```

回答幾個問題後，立即獲得可編譯的代碼！

### 場景 2: 配置審查

在提交代碼前，檢查配置是否最佳：

```bash
python3 config_optimizer.py src/FreeRTOSConfig.h --power
```

### 場景 3: 團隊協作

使用配置文件管理項目：

```json
{
  "project_name": "team_project",
  "tasks": [...],
  "config_overrides": {...}
}
```

團隊成員可以使用相同的配置生成一致的代碼。

## 🤖 AI 功能詳解

### 智能堆疊大小建議

AI 根據任務描述關鍵詞建議堆疊大小：

| 關鍵詞 | 建議大小 | 說明 |
|--------|---------|------|
| simple, led, button | 256 字節 | 簡單任務 |
| sensor, i2c, spi, uart | 512 字節 | 外設訪問 |
| file, display | 1024 字節 | 文件/顯示操作 |
| network, tcp, http | 2048 字節 | 網絡通信 |
| gui | 2048 字節 | 圖形界面 |

### 智能優先級建議

| 關鍵詞 | 優先級 | 說明 |
|--------|-------|------|
| critical, isr, interrupt | 5 (最高) | 關鍵實時任務 |
| high | 4 | 高優先級 |
| sensor, data | 3 | 數據處理 |
| network, display | 2 | 非關鍵任務 |
| logging, monitor, idle | 1 (最低) | 後台任務 |

## 📊 代碼生成示例

**輸入配置：**

```json
{
  "project_name": "sensor_logger",
  "rtos_type": "freertos",
  "tasks": [
    {
      "name": "Sensor",
      "description": "Read sensor data via I2C"
    },
    {
      "name": "Logger",
      "description": "Log data to file system"
    }
  ]
}
```

**生成的代碼：**

```c
/**
 * @file sensor_logger.c
 * @brief Auto-generated FREERTOS application
 * @author RTOS AI Code Generator
 * @date 2025-11-18
 */

#include "FreeRTOS.h"
#include "task.h"
// ... more includes ...

/**
 * @brief Read sensor data via I2C
 */
void vSensorTask(void *pvParameters)
{
    TickType_t xLastWakeTime;
    const TickType_t xFrequency = pdMS_TO_TICKS(1000);

    xLastWakeTime = xTaskGetTickCount();

    printf("[Sensor] Task started\n");

    while (1) {
        /* Task implementation goes here */
        printf("[Sensor] Running\n");

        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}

// ... more code ...

int main(void)
{
    HAL_Init();
    SystemClock_Config();

    /* Create task: Sensor */
    xTaskCreate(vSensorTask,
                "Sensor",
                512,           // AI suggested
                NULL,
                3,             // AI suggested
                NULL);

    vTaskStartScheduler();
    while (1);
    return 0;
}
```

## 🔍 配置優化示例

**優化前：**

```c
#define configTOTAL_HEAP_SIZE           ( 512 )
#define configTICK_RATE_HZ              ( 100 )
#define configCHECK_FOR_STACK_OVERFLOW  0
#define configUSE_MALLOC_FAILED_HOOK    0
```

**優化後：**

```c
/* 20KB heap for typical applications */
#define configTOTAL_HEAP_SIZE           ( 20 * 1024 )

/* 1ms tick period */
#define configTICK_RATE_HZ              1000

/* Maximum stack overflow detection */
#define configCHECK_FOR_STACK_OVERFLOW  2

/* Catch memory allocation failures */
#define configUSE_MALLOC_FAILED_HOOK    1
```

## 🚀 最佳實踐

### 1. 開發流程

```bash
# 1. 生成項目框架
python3 rtos_code_generator.py --config my_project.json -o src/main.c

# 2. 實現業務邏輯
# (編輯 src/main.c)

# 3. 優化配置
python3 config_optimizer.py include/FreeRTOSConfig.h --output include/FreeRTOSConfig_opt.h

# 4. 構建和測試
make clean && make
```

### 2. 持續集成

在 CI/CD 中使用配置優化器：

```yaml
# .github/workflows/check.yml
- name: Check RTOS Config
  run: |
    python3 tools/config_optimizer.py include/FreeRTOSConfig.h
    if [ $? -ne 0 ]; then
      echo "Configuration has errors!"
      exit 1
    fi
```

### 3. 團隊協作

1. 維護統一的配置文件 (`project_config.json`)
2. 使用版本控制管理配置
3. 自動生成更新代碼框架
4. 定期運行配置優化檢查

## 📚 擴展功能

### 添加自定義規則

在 `config_optimizer.py` 中添加自定義檢查：

```python
def check_custom_rule(self):
    """自定義檢查規則"""
    if 'MY_CUSTOM_CONFIG' in self.config_values:
        value, line = self.config_values['MY_CUSTOM_CONFIG']
        if value != expected_value:
            self.issues.append(ConfigIssue(
                severity='warning',
                category='Custom',
                message='Custom configuration issue',
                line=line,
                suggestion='Set to expected value'
            ))
```

### 支持新的 RTOS

在 `rtos_code_generator.py` 中添加新的生成器：

```python
class MyRTOSGenerator(RTOSCodeGenerator):
    def __init__(self):
        super().__init__(RTOSType.MY_RTOS)

    def generate_task(self, config: TaskConfig) -> str:
        # 實現任務生成邏輯
        pass
```

## 🔧 故障排除

### Q: 生成的代碼無法編譯
**A**: 檢查生成的包含路徑和庫文件是否正確。可能需要手動調整。

### Q: AI 建議的堆疊大小不夠
**A**: AI 建議是基於關鍵詞的估算。根據實際需求調整，並考慮使用堆疊監控工具測量。

### Q: 配置優化器報告誤報
**A**: 配置優化器提供建議，不是強制要求。根據項目實際情況決定是否採納。

## 📖 參考資料

- [FreeRTOS 官方文檔](https://www.freertos.org/)
- [Zephyr 文檔](https://docs.zephyrproject.org/)
- [RT-Thread 文檔](https://www.rt-thread.io/document/site/)

## 🎓 教程

### 教程 1: 從零開始創建項目

1. 創建配置文件 `my_project.json`
2. 運行代碼生成器
3. 編譯和測試
4. 優化配置

### 教程 2: 優化現有項目

1. 運行配置優化器
2. 審查建議
3. 應用優化
4. 性能測試

---

**作者**: AI-Assisted Development Team
**版本**: 1.0.0
**授權**: MIT License
