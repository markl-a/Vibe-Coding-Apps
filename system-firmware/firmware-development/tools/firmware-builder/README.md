# Firmware Builder Tool

一個功能完整的多平台韌體構建工具，支援 STM32、ESP32 和 nRF52 平台。

## 功能特性

### 核心功能
- 多平台支援（STM32、ESP32、nRF52）
- 自動化編譯流程
- 版本管理和構建 ID 生成
- 多種構建配置（Debug/Release/Production）
- 多種輸出格式（.elf, .bin, .hex）

### 高級功能
- 韌體簽名和加密
- 詳細的大小和記憶體分析
- 構建報告生成（JSON、HTML）
- CI/CD 整合支援
- AI 輔助代碼分析和優化建議

## 安裝要求

### 基本工具鏈

**STM32:**
```bash
sudo apt-get install gcc-arm-none-eabi binutils-arm-none-eabi
```

**ESP32:**
```bash
# 安裝 ESP-IDF
git clone --recursive https://github.com/espressif/esp-idf.git
cd esp-idf
./install.sh
```

**nRF52:**
```bash
# 與 STM32 使用相同的 ARM GCC 工具鏈
sudo apt-get install gcc-arm-none-eabi binutils-arm-none-eabi
```

### Python 依賴

```bash
pip install pyyaml anthropic
```

## 使用方法

### 1. 使用配置文件構建

```bash
./build_firmware.py --config build_config.yaml
```

### 2. 命令行參數構建

```bash
./build_firmware.py \
    --platform stm32 \
    --build-type release \
    --version 1.2.3 \
    --source-dir ./src \
    --output-dir ./output \
    --formats elf bin hex
```

### 3. 帶簽名和加密

```bash
./build_firmware.py \
    --config build_config.yaml \
    --sign \
    --encrypt
```

### 4. CI/CD 模式

```bash
./build_firmware.py \
    --config build_config.yaml \
    --ci \
    --output-dir ./artifacts \
    --clean
```

### 5. 啟用 AI 分析

```bash
export ANTHROPIC_API_KEY="your-api-key"

./build_firmware.py \
    --config build_config.yaml \
    --ai
```

或直接指定 API 密鑰：

```bash
./build_firmware.py \
    --config build_config.yaml \
    --ai \
    --api-key your-api-key
```

## 配置文件格式

### YAML 格式示例

```yaml
# 項目信息
project_name: "my_firmware"
version: "1.0.0"
platform: "stm32"
build_type: "release"

# 路徑
source_dir: "./src"
output_dir: "./output"

# 輸出格式
formats:
  - elf
  - bin
  - hex

# 優化
optimization_level: "O2"

# 安全
enable_signing: true
enable_encryption: false

# 編譯選項
include_paths:
  - "./include"
  - "./drivers/include"

defines:
  USE_HAL_DRIVER: ""
  STM32F407xx: ""

custom_flags:
  - "-ffunction-sections"
  - "-fdata-sections"

linker_script: "./STM32F407VGTx_FLASH.ld"
```

### JSON 格式示例

```json
{
  "project_name": "my_firmware",
  "version": "1.0.0",
  "platform": "stm32",
  "build_type": "release",
  "source_dir": "./src",
  "output_dir": "./output",
  "formats": ["elf", "bin", "hex"],
  "optimization_level": "O2",
  "enable_signing": true,
  "enable_encryption": false
}
```

## 命令行參數

### 基本選項

| 參數 | 簡寫 | 描述 |
|------|------|------|
| `--config` | `-c` | 配置文件路徑 |
| `--platform` | `-p` | 目標平台 (stm32/esp32/nrf52) |
| `--build-type` | `-b` | 構建類型 (debug/release/production) |
| `--version` | `-v` | 韌體版本 |
| `--project` | | 項目名稱 |

### 路徑選項

| 參數 | 簡寫 | 描述 |
|------|------|------|
| `--source-dir` | `-s` | 源代碼目錄 |
| `--output-dir` | `-o` | 輸出目錄 |

### 輸出選項

| 參數 | 簡寫 | 描述 |
|------|------|------|
| `--formats` | `-f` | 輸出格式 (elf/bin/hex) |
| `--optimization` | | 優化級別 (O0/O1/O2/O3/Os/Og) |

### 安全選項

| 參數 | 描述 |
|------|------|
| `--sign` | 對韌體進行簽名 |
| `--encrypt` | 加密韌體 |

### 其他選項

| 參數 | 描述 |
|------|------|
| `--ci` | CI/CD 模式（生成詳細報告） |
| `--ai` | 啟用 AI 輔助分析 |
| `--api-key` | Anthropic API 密鑰 |
| `--verbose` | 詳細輸出 |
| `--log-file` | 日誌文件路徑 |
| `--clean` | 構建前清理輸出目錄 |

## 輸出文件

構建完成後，輸出目錄將包含：

```
output/
├── my_firmware_v1.0.0_20231118120000-abc12345.elf
├── my_firmware_v1.0.0_20231118120000-abc12345.bin
├── my_firmware_v1.0.0_20231118120000-abc12345.hex
├── my_firmware_v1.0.0_20231118120000-abc12345.map
├── my_firmware_v1.0.0_20231118120000-abc12345_manifest.json
└── 20231118120000-abc12345_report.html  (CI 模式)
```

### Manifest 文件格式

```json
{
  "build_id": "20231118120000-abc12345",
  "version": "1.0.0",
  "platform": "stm32",
  "build_type": "release",
  "timestamp": "2023-11-18T12:00:00",
  "duration_seconds": 15.3,
  "output_files": {
    "elf": "/path/to/firmware.elf",
    "bin": "/path/to/firmware.bin",
    "hex": "/path/to/firmware.hex"
  },
  "size_info": {
    "text": 65536,
    "data": 4096,
    "bss": 8192,
    "total": 69632,
    "ram": 12288
  },
  "signature": "abc123...",
  "success": true,
  "error_count": 0,
  "warning_count": 2
}
```

## AI 輔助功能

使用 Claude AI 進行代碼分析和優化建議：

```bash
./build_firmware.py --config config.yaml --ai --api-key YOUR_KEY
```

AI 分析功能包括：

1. **構建結果分析**
   - 記憶體使用優化建議
   - 編譯警告和錯誤分析
   - 構建性能改進建議

2. **代碼質量分析**
   - 項目結構優化
   - 嵌入式代碼最佳實踐
   - 性能優化建議

## CI/CD 整合

### GitHub Actions 示例

```yaml
name: Build Firmware

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install ARM Toolchain
        run: sudo apt-get install -y gcc-arm-none-eabi

      - name: Install Python Dependencies
        run: pip install pyyaml

      - name: Build Firmware
        run: |
          chmod +x tools/firmware-builder/build_firmware.py
          ./tools/firmware-builder/build_firmware.py \
            --config build_config.yaml \
            --ci \
            --clean

      - name: Upload Artifacts
        uses: actions/upload-artifact@v2
        with:
          name: firmware
          path: output/
```

### GitLab CI 示例

```yaml
build_firmware:
  image: ubuntu:latest
  before_script:
    - apt-get update
    - apt-get install -y gcc-arm-none-eabi python3 python3-pip
    - pip3 install pyyaml
  script:
    - chmod +x tools/firmware-builder/build_firmware.py
    - ./tools/firmware-builder/build_firmware.py --config build_config.yaml --ci
  artifacts:
    paths:
      - output/
    expire_in: 1 week
```

## 故障排除

### 找不到編譯器

```bash
# 檢查工具鏈是否安裝
arm-none-eabi-gcc --version

# 檢查 PATH
echo $PATH

# 添加到 PATH（如果需要）
export PATH="/usr/bin:$PATH"
```

### 記憶體不足

對於大型項目，增加優化級別：

```bash
./build_firmware.py --config config.yaml --optimization Os
```

### 警告太多

使用更嚴格的警告設置：

```yaml
custom_flags:
  - "-Wall"
  - "-Wextra"
  - "-Werror"
```

## 性能優化建議

### 減少 Flash 使用
- 使用 `-Os` 優化（優化大小）
- 啟用 `-ffunction-sections` 和 `-fdata-sections`
- 使用 `--gc-sections` 鏈接器選項（已默認啟用）

### 減少 RAM 使用
- 使用 `const` 將數據放入 Flash
- 優化數據結構對齊
- 減少全局變量

### 加快構建速度
- 使用增量構建
- 啟用並行編譯（如果工具鏈支援）
- 使用 ccache

## 示例項目結構

```
my_firmware_project/
├── src/
│   ├── main.c
│   ├── drivers/
│   │   ├── gpio.c
│   │   └── uart.c
│   └── middleware/
│       └── protocol.c
├── include/
│   ├── main.h
│   └── config.h
├── STM32F407VGTx_FLASH.ld
├── build_config.yaml
└── tools/
    └── firmware-builder/
        └── build_firmware.py
```

## 許可證

MIT License

## 貢獻

歡迎提交 Issue 和 Pull Request！

## 更多資源

- [ARM GCC 文檔](https://gcc.gnu.org/onlinedocs/)
- [ESP-IDF 文檔](https://docs.espressif.com/projects/esp-idf/)
- [nRF SDK 文檔](https://infocenter.nordicsemi.com/)
- [嵌入式系統最佳實踐](https://embedded-systems.dev/)

**狀態**: ✅ 可用 - 全功能實現
