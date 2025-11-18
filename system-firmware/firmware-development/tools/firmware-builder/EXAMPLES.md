# Firmware Builder 使用示例

本文檔提供 firmware-builder 工具的實際使用示例。

## 基本使用

### 示例 1: 使用配置文件構建 STM32 韌體

```bash
# 1. 創建配置文件 stm32_config.yaml
cat > stm32_config.yaml << 'EOF'
project_name: "stm32_demo"
version: "1.0.0"
platform: "stm32"
build_type: "release"
source_dir: "./src"
output_dir: "./output"
formats:
  - elf
  - bin
  - hex
optimization_level: "O2"
enable_signing: true
EOF

# 2. 構建韌體
./build_firmware.py --config stm32_config.yaml
```

### 示例 2: 命令行參數構建

```bash
./build_firmware.py \
    --platform stm32 \
    --build-type release \
    --version 2.0.1 \
    --project my_device \
    --source-dir ./firmware/src \
    --output-dir ./build/output \
    --formats elf bin hex \
    --optimization O2 \
    --verbose
```

### 示例 3: Debug 構建

```bash
./build_firmware.py \
    --platform stm32 \
    --build-type debug \
    --version 1.0.0-dev \
    --source-dir ./src \
    --output-dir ./debug_build \
    --optimization Og \
    --verbose \
    --log-file debug_build.log
```

## 多平台構建

### 示例 4: ESP32 韌體構建

```bash
# ESP32 配置文件
cat > esp32_config.yaml << 'EOF'
project_name: "esp32_iot"
version: "1.2.0"
platform: "esp32"
build_type: "release"
source_dir: "./esp32_project/main"
output_dir: "./esp32_output"
formats:
  - elf
  - bin
optimization_level: "O2"
defines:
  CONFIG_IDF_TARGET_ESP32: ""
  CONFIG_FREERTOS_HZ: "1000"
EOF

./build_firmware.py --config esp32_config.yaml
```

### 示例 5: nRF52 韌體構建

```bash
cat > nrf52_config.yaml << 'EOF'
project_name: "nrf52_ble"
version: "1.1.0"
platform: "nrf52"
build_type: "release"
source_dir: "./nrf52_src"
output_dir: "./nrf52_output"
formats:
  - elf
  - hex
optimization_level: "Os"
defines:
  NRF52832_XXAA: ""
  CONFIG_GPIO_AS_PINRESET: ""
include_paths:
  - "./nrf_sdk/components"
  - "./nrf_sdk/modules"
EOF

./build_firmware.py --config nrf52_config.yaml
```

## 安全功能

### 示例 6: 帶簽名的構建

```bash
./build_firmware.py \
    --config build_config.yaml \
    --sign \
    --verbose
```

### 示例 7: 簽名 + 加密

```bash
./build_firmware.py \
    --config build_config.yaml \
    --sign \
    --encrypt \
    --ci \
    --output-dir ./secure_build
```

## CI/CD 整合

### 示例 8: GitHub Actions 完整工作流

```yaml
# .github/workflows/build-firmware.yml
name: Build Firmware

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  release:
    types: [ created ]

jobs:
  build-stm32:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        build_type: [debug, release]

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y gcc-arm-none-eabi binutils-arm-none-eabi
          pip install pyyaml

      - name: Build firmware
        run: |
          chmod +x ./tools/firmware-builder/build_firmware.py
          ./tools/firmware-builder/build_firmware.py \
            --platform stm32 \
            --build-type ${{ matrix.build_type }} \
            --version ${{ github.ref_name }} \
            --source-dir ./src \
            --output-dir ./artifacts/${{ matrix.build_type }} \
            --ci \
            --clean \
            --verbose

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: firmware-${{ matrix.build_type }}
          path: ./artifacts/${{ matrix.build_type }}
          retention-days: 30

      - name: Upload to release
        if: github.event_name == 'release'
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ github.event.release.upload_url }}
          asset_path: ./artifacts/${{ matrix.build_type }}/*.bin
          asset_name: firmware-${{ matrix.build_type }}.bin
          asset_content_type: application/octet-stream
```

### 示例 9: GitLab CI 多階段構建

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - deploy

variables:
  FIRMWARE_VERSION: "1.0.0"

.build_template: &build_template
  image: ubuntu:22.04
  before_script:
    - apt-get update
    - apt-get install -y gcc-arm-none-eabi python3 python3-pip
    - pip3 install pyyaml
    - chmod +x tools/firmware-builder/build_firmware.py

build:stm32:debug:
  <<: *build_template
  stage: build
  script:
    - |
      ./tools/firmware-builder/build_firmware.py \
        --platform stm32 \
        --build-type debug \
        --version ${FIRMWARE_VERSION}-debug \
        --source-dir ./src \
        --output-dir ./build/stm32/debug \
        --ci --clean
  artifacts:
    paths:
      - build/stm32/debug/
    expire_in: 1 week

build:stm32:release:
  <<: *build_template
  stage: build
  script:
    - |
      ./tools/firmware-builder/build_firmware.py \
        --platform stm32 \
        --build-type release \
        --version ${FIRMWARE_VERSION} \
        --source-dir ./src \
        --output-dir ./build/stm32/release \
        --sign --ci --clean
  artifacts:
    paths:
      - build/stm32/release/
    expire_in: 1 month
  only:
    - main
    - tags

build:esp32:release:
  <<: *build_template
  stage: build
  script:
    - |
      ./tools/firmware-builder/build_firmware.py \
        --platform esp32 \
        --build-type release \
        --version ${FIRMWARE_VERSION} \
        --source-dir ./esp32/main \
        --output-dir ./build/esp32/release \
        --ci --clean
  artifacts:
    paths:
      - build/esp32/release/
    expire_in: 1 month
```

## AI 輔助分析

### 示例 10: 使用 AI 分析構建結果

```bash
# 設置 API 密鑰
export ANTHROPIC_API_KEY="sk-ant-..."

# 構建並分析
./build_firmware.py \
    --config build_config.yaml \
    --ai \
    --ci \
    --verbose
```

### 示例 11: 只使用 AI 功能（不依賴環境變量）

```bash
./build_firmware.py \
    --config build_config.yaml \
    --ai \
    --api-key "sk-ant-your-key-here" \
    --ci
```

## 高級配置

### 示例 12: 自定義編譯標誌

```yaml
# advanced_config.yaml
project_name: "advanced_firmware"
version: "2.0.0"
platform: "stm32"
build_type: "release"
source_dir: "./src"
output_dir: "./output"

optimization_level: "O3"

# 自定義編譯標誌
custom_flags:
  - "-ffunction-sections"
  - "-fdata-sections"
  - "-fno-common"
  - "-fstack-usage"
  - "-flto"  # Link Time Optimization

# 預處理器定義
defines:
  USE_HAL_DRIVER: ""
  STM32F407xx: ""
  DEBUG_LEVEL: "2"
  MAX_BUFFER_SIZE: "1024"

# 包含路徑
include_paths:
  - "./include"
  - "./drivers/STM32F4xx_HAL_Driver/Inc"
  - "./middleware/FreeRTOS/include"
  - "./lib/CMSIS/Include"

# 鏈接腳本
linker_script: "./STM32F407VGTx_FLASH.ld"
```

```bash
./build_firmware.py --config advanced_config.yaml --verbose
```

### 示例 13: 多版本構建腳本

```bash
#!/bin/bash
# build_all_versions.sh

PLATFORMS=("stm32" "esp32" "nrf52")
VERSIONS=("1.0.0" "1.0.1" "1.1.0")

for platform in "${PLATFORMS[@]}"; do
    for version in "${VERSIONS[@]}"; do
        echo "Building ${platform} version ${version}..."

        ./build_firmware.py \
            --platform ${platform} \
            --build-type release \
            --version ${version} \
            --source-dir ./src \
            --output-dir ./releases/${platform}/${version} \
            --sign \
            --ci \
            --clean

        if [ $? -eq 0 ]; then
            echo "✓ ${platform} ${version} build successful"
        else
            echo "✗ ${platform} ${version} build failed"
            exit 1
        fi
    done
done

echo "All builds completed successfully!"
```

### 示例 14: 使用 Make 整合

```makefile
# Makefile
BUILDER := ./tools/firmware-builder/build_firmware.py
CONFIG := build_config.yaml

.PHONY: all clean debug release flash

all: release

debug:
	$(BUILDER) --config $(CONFIG) --build-type debug --verbose

release:
	$(BUILDER) --config $(CONFIG) --build-type release --sign

production:
	$(BUILDER) --config $(CONFIG) --build-type production --sign --encrypt --ci

clean:
	rm -rf ./output/*
	rm -rf ./build/*

flash: release
	# 根據您的燒錄工具調整
	st-flash write ./output/*.bin 0x8000000

size: release
	arm-none-eabi-size ./output/*.elf

ci: clean production
	@echo "CI build completed"

help:
	@echo "Available targets:"
	@echo "  debug      - Build debug version"
	@echo "  release    - Build release version"
	@echo "  production - Build production version with signing"
	@echo "  clean      - Clean build directories"
	@echo "  flash      - Flash firmware to device"
	@echo "  size       - Show firmware size"
	@echo "  ci         - CI/CD build"
```

## 批量處理

### 示例 15: 批量構建不同配置

```bash
#!/bin/bash
# batch_build.sh

# 配置數組
declare -A configs=(
    ["stm32_debug"]="stm32 debug O0"
    ["stm32_release"]="stm32 release O2"
    ["stm32_production"]="stm32 production Os"
    ["esp32_release"]="esp32 release O2"
    ["nrf52_release"]="nrf52 release Os"
)

# 遍歷並構建
for name in "${!configs[@]}"; do
    IFS=' ' read -r platform build_type optimization <<< "${configs[$name]}"

    echo "=========================="
    echo "Building: $name"
    echo "Platform: $platform"
    echo "Type: $build_type"
    echo "Opt: $optimization"
    echo "=========================="

    ./build_firmware.py \
        --platform $platform \
        --build-type $build_type \
        --version "1.0.0" \
        --project $name \
        --source-dir ./src \
        --output-dir ./multi_build/$name \
        --optimization $optimization \
        --formats elf bin hex \
        --sign \
        --verbose \
        --log-file ./logs/${name}.log

    result=$?
    if [ $result -eq 0 ]; then
        echo "✓ $name: SUCCESS"
    else
        echo "✗ $name: FAILED (exit code: $result)"
    fi
    echo ""
done
```

## 故障排除示例

### 示例 16: 詳細日誌和調試

```bash
# 啟用最詳細的輸出
./build_firmware.py \
    --config debug_config.yaml \
    --verbose \
    --log-file debug_$(date +%Y%m%d_%H%M%S).log \
    --optimization Og
```

### 示例 17: 測試工具鏈

```bash
#!/bin/bash
# test_toolchain.sh

echo "Testing ARM GCC toolchain..."
arm-none-eabi-gcc --version

echo -e "\nTesting objcopy..."
arm-none-eabi-objcopy --version

echo -e "\nTesting size..."
arm-none-eabi-size --version

echo -e "\nTesting builder..."
./build_firmware.py --help | head -n 5

echo -e "\nAll checks completed!"
```

## JSON 配置示例

### 示例 18: 使用 JSON 配置文件

```json
{
  "project_name": "json_configured_firmware",
  "version": "1.5.0",
  "platform": "stm32",
  "build_type": "release",
  "source_dir": "./firmware/src",
  "output_dir": "./firmware/build",
  "formats": ["elf", "bin", "hex"],
  "optimization_level": "O2",
  "enable_signing": true,
  "enable_encryption": false,
  "defines": {
    "USE_HAL_DRIVER": "",
    "STM32F407xx": "",
    "HSE_VALUE": "8000000",
    "VERSION_MAJOR": "1",
    "VERSION_MINOR": "5",
    "VERSION_PATCH": "0"
  },
  "include_paths": [
    "./firmware/include",
    "./firmware/drivers",
    "./firmware/middleware"
  ],
  "custom_flags": [
    "-ffunction-sections",
    "-fdata-sections",
    "-Wall",
    "-Wextra"
  ],
  "linker_script": "./firmware/linker/STM32F407VGTx_FLASH.ld"
}
```

```bash
./build_firmware.py --config config.json --ci
```

## 完整項目示例

### 示例 19: 完整的 STM32 項目構建

```bash
# 項目結構:
# my_stm32_project/
# ├── src/
# │   ├── main.c
# │   ├── system_stm32f4xx.c
# │   └── drivers/
# ├── include/
# ├── startup/
# │   └── startup_stm32f407xx.s
# ├── linker/
# │   └── STM32F407VGTx_FLASH.ld
# ├── tools/
# │   └── firmware-builder/
# └── build_config.yaml

cd my_stm32_project

# 創建配置
cat > build_config.yaml << 'EOF'
project_name: "my_stm32_app"
version: "1.0.0"
platform: "stm32"
build_type: "release"
source_dir: "./src"
output_dir: "./build/output"

formats:
  - elf
  - bin
  - hex

optimization_level: "O2"
enable_signing: true

include_paths:
  - "./include"
  - "./drivers/CMSIS/Include"
  - "./drivers/STM32F4xx_HAL_Driver/Inc"

defines:
  USE_HAL_DRIVER: ""
  STM32F407xx: ""
  HSE_VALUE: "8000000"

custom_flags:
  - "-mcpu=cortex-m4"
  - "-mthumb"
  - "-mfpu=fpv4-sp-d16"
  - "-mfloat-abi=hard"
  - "-ffunction-sections"
  - "-fdata-sections"

linker_script: "./linker/STM32F407VGTx_FLASH.ld"
EOF

# 構建
./tools/firmware-builder/build_firmware.py \
    --config build_config.yaml \
    --ci \
    --clean \
    --verbose
```

## 性能測試

### 示例 20: 比較不同優化級別

```bash
#!/bin/bash
# compare_optimizations.sh

OPTIMIZATIONS=("O0" "O1" "O2" "O3" "Os" "Og")

echo "Optimization,Build Time (s),Flash Size (bytes),RAM Size (bytes)" > results.csv

for opt in "${OPTIMIZATIONS[@]}"; do
    echo "Testing optimization level: $opt"

    start=$(date +%s)
    ./build_firmware.py \
        --platform stm32 \
        --build-type release \
        --version 1.0.0 \
        --source-dir ./src \
        --output-dir ./opt_test/$opt \
        --optimization $opt \
        --clean \
        2>&1 | tee ./opt_test/${opt}_log.txt

    end=$(date +%s)
    duration=$((end - start))

    # 解析結果（需要根據實際輸出調整）
    flash_size=$(grep "Flash:" ./opt_test/${opt}_log.txt | awk '{print $2}')
    ram_size=$(grep "RAM:" ./opt_test/${opt}_log.txt | awk '{print $2}')

    echo "$opt,$duration,$flash_size,$ram_size" >> results.csv
done

echo "Results saved to results.csv"
cat results.csv
```

這些示例涵蓋了 firmware-builder 工具的各種使用場景，從基本構建到高級 CI/CD 整合。根據您的具體需求選擇合適的示例進行參考。
