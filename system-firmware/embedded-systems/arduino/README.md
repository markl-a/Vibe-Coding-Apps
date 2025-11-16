# Arduino 開發專案

Arduino 平台快速原型開發範例。

## 📋 支援開發板

- Arduino Uno
- Arduino Mega
- Arduino Nano
- Arduino Pro Mini
- Arduino MKR 系列

## 🚀 快速開始

### 基礎 LED 閃爍

```cpp
// LED 閃爍 - Arduino 入門範例
void setup() {
    pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
    digitalWrite(LED_BUILTIN, HIGH);
    delay(1000);
    digitalWrite(LED_BUILTIN, LOW);
    delay(1000);
}
```

### 序列埠通訊

```cpp
void setup() {
    Serial.begin(9600);
}

void loop() {
    Serial.println("Hello Arduino!");
    delay(1000);
}
```

### 類比輸入讀取

```cpp
int sensorPin = A0;
int sensorValue = 0;

void setup() {
    Serial.begin(9600);
}

void loop() {
    sensorValue = analogRead(sensorPin);
    Serial.print("Sensor Value: ");
    Serial.println(sensorValue);
    delay(100);
}
```

## 📦 常用函式庫

- **Servo** - 伺服馬達控制
- **LiquidCrystal** - LCD 顯示器
- **Wire** - I2C 通訊
- **SPI** - SPI 通訊
- **Ethernet** - 網路連接

## 🛠️ 開發工具

- Arduino IDE（官方）
- PlatformIO（VS Code）
- Arduino CLI

## 📚 學習資源

- [Arduino 官網](https://www.arduino.cc/)
- [Arduino 教學](https://www.arduino.cc/en/Tutorial/HomePage)
- [Arduino 參考手冊](https://www.arduino.cc/reference/en/)

## 📄 授權

MIT License
