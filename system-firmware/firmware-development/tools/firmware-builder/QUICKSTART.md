# Firmware Builder 快速入門指南

## 5 分鐘快速開始

### 步驟 1: 安裝依賴

```bash
# 安裝 ARM 工具鏈（用於 STM32 和 nRF52）
sudo apt-get update
sudo apt-get install -y gcc-arm-none-eabi binutils-arm-none-eabi

# 安裝 Python 依賴
pip install pyyaml

# (可選) 安裝 AI 功能支援
pip install anthropic
```

### 步驟 2: 驗證安裝

```bash
# 運行測試腳本
./test_builder.sh
```

### 步驟 3: 第一次構建

```bash
# 使用示例配置構建
./build_firmware.py --config build_config.yaml
```

或使用命令行參數：

```bash
./build_firmware.py \
    --platform stm32 \
    --build-type release \
    --version 1.0.0 \
    --source-dir ./src \
    --output-dir ./output
```

## 常用命令

### 基本構建
```bash
./build_firmware.py --config build_config.yaml
```

### Debug 構建
```bash
./build_firmware.py --config build_config.yaml --build-type debug --verbose
```

### 帶簽名的 Release 構建
```bash
./build_firmware.py --config build_config.yaml --build-type release --sign
```

### CI/CD 模式
```bash
./build_firmware.py --config build_config.yaml --ci --clean
```

### 使用 AI 分析
```bash
export ANTHROPIC_API_KEY="your-api-key"
./build_firmware.py --config build_config.yaml --ai
```

## 配置文件模板

創建 `my_config.yaml`:

```yaml
project_name: "my_firmware"
version: "1.0.0"
platform: "stm32"          # 選擇: stm32, esp32, nrf52
build_type: "release"       # 選擇: debug, release, production
source_dir: "./src"
output_dir: "./output"
formats:
  - elf
  - bin
  - hex
optimization_level: "O2"    # 選擇: O0, O1, O2, O3, Os, Og
enable_signing: true
enable_encryption: false
```

## 輸出文件說明

構建完成後，您會在輸出目錄看到：

```
output/
├── my_firmware_v1.0.0_<build-id>.elf    # ELF 可執行文件
├── my_firmware_v1.0.0_<build-id>.bin    # 二進制文件（用於燒錄）
├── my_firmware_v1.0.0_<build-id>.hex    # HEX 文件
├── my_firmware_v1.0.0_<build-id>.map    # 記憶體映射文件
└── my_firmware_v1.0.0_<build-id>_manifest.json  # 構建信息
```

## 常見問題

### Q: 找不到編譯器
```bash
# 檢查 PATH
which arm-none-eabi-gcc

# 如果未安裝
sudo apt-get install gcc-arm-none-eabi
```

### Q: 構建失敗，提示缺少鏈接腳本
在配置文件中添加：
```yaml
linker_script: "./path/to/linker_script.ld"
```

### Q: 如何減小韌體大小
使用 Os 優化：
```yaml
optimization_level: "Os"
```

### Q: 如何啟用 AI 分析
```bash
# 設置 API 密鑰
export ANTHROPIC_API_KEY="sk-ant-..."

# 或在命令中直接指定
./build_firmware.py --config config.yaml --ai --api-key "sk-ant-..."
```

## 下一步

- 📖 閱讀 [README.md](README.md) 了解完整功能
- 📝 查看 [EXAMPLES.md](EXAMPLES.md) 學習高級用法
- 🧪 運行 [test_builder.sh](test_builder.sh) 驗證環境
- 🔧 編輯 [build_config.yaml](build_config.yaml) 自定義配置

## 獲取幫助

```bash
# 查看所有選項
./build_firmware.py --help

# 查看版本信息
./build_firmware.py --version
```

## 快速參考

| 任務 | 命令 |
|------|------|
| 基本構建 | `./build_firmware.py --config config.yaml` |
| Debug 構建 | `./build_firmware.py -c config.yaml -b debug` |
| Release 構建 | `./build_firmware.py -c config.yaml -b release --sign` |
| 清理構建 | `./build_firmware.py -c config.yaml --clean` |
| 詳細日誌 | `./build_firmware.py -c config.yaml --verbose` |
| CI 模式 | `./build_firmware.py -c config.yaml --ci` |
| AI 分析 | `./build_firmware.py -c config.yaml --ai` |

---

**提示**: 首次使用建議先運行 `./test_builder.sh` 檢查環境配置！
