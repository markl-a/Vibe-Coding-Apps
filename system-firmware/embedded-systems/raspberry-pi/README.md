# Raspberry Pi 開發專案

Raspberry Pi 單板電腦應用範例專案。

## 📋 支援型號

- Raspberry Pi 4 Model B
- Raspberry Pi 3 Model B/B+
- Raspberry Pi Zero/Zero W
- Raspberry Pi 400

## 🛠️ 開發語言

- **Python** - 推薦，最簡單
- **C/C++** - 高性能應用
- **Node.js** - Web 應用
- **Bash** - 系統腳本

## 🚀 快速開始

### GPIO 控制 (Python)

```python
import RPi.GPIO as GPIO
import time

# 設定模式
GPIO.setmode(GPIO.BCM)

# 設定 GPIO17 為輸出
GPIO.setup(17, GPIO.OUT)

# LED 閃爍
try:
    while True:
        GPIO.output(17, GPIO.HIGH)
        time.sleep(1)
        GPIO.output(17, GPIO.LOW)
        time.sleep(1)
except KeyboardInterrupt:
    GPIO.cleanup()
```

### 安裝必要套件

```bash
# 更新系統
sudo apt-get update
sudo apt-get upgrade

# 安裝 Python GPIO 函式庫
sudo apt-get install python3-rpi.gpio

# 安裝 picamera（相機控制）
sudo apt-get install python3-picamera
```

## 📚 常見應用

- 家庭自動化控制器
- 媒體中心（Kodi）
- 網路伺服器
- 監控攝影機
- IoT 閘道器
- 復古遊戲機（RetroPie）

## 🔗 資源

- [官方文檔](https://www.raspberrypi.org/documentation/)
- [GPIO 接腳圖](https://pinout.xyz/)

## 📄 授權

MIT License
