# ESPHome Smart Home Sensors

A collection of ESPHome configurations for various smart home sensors and devices.

## What is ESPHome?

ESPHome is an open-source firmware framework that simplifies creating custom firmware for ESP8266/ESP32 devices using simple YAML configuration files. It integrates seamlessly with Home Assistant.

## Projects Included

### 1. Temperature & Humidity Sensor
- BME280 sensor on ESP32
- MQTT publishing
- Deep sleep for battery operation

### 2. Motion Sensor with Light Control
- PIR motion detection
- Automatic light control via relay
- Configurable timeout

### 3. Smart Power Monitor
- Energy monitoring with PZEM-004T
- Real-time power, voltage, current
- Daily energy consumption

### 4. Air Quality Monitor
- PM2.5/PM10 with PMS5003
- CO2 with MH-Z19
- Temperature & humidity

## Requirements

- ESP32 or ESP8266 board
- ESPHome CLI or Home Assistant ESPHome addon
- Sensors (BME280, PIR, etc.)
- USB cable for initial flash

## Installation

### Using ESPHome CLI

```bash
# Install ESPHome
pip install esphome

# Validate configuration
esphome config temperature-sensor.yaml

# Compile and upload
esphome run temperature-sensor.yaml
```

### Using Home Assistant

1. Install ESPHome addon
2. Add new device
3. Copy YAML configuration
4. Install

## Configuration Files

```
esphome-sensors/
├── temperature-sensor.yaml      # BME280 temp/humidity
├── motion-sensor.yaml           # PIR with relay
├── power-monitor.yaml           # PZEM energy monitor
├── air-quality-monitor.yaml     # PM2.5 + CO2
├── secrets.yaml.example         # WiFi/API secrets template
└── common/
    ├── base.yaml                # Common configuration
    └── sensors.yaml             # Reusable sensor configs
```

## Quick Start

1. Copy `secrets.yaml.example` to `secrets.yaml`
2. Edit `secrets.yaml` with your WiFi credentials
3. Choose a device configuration
4. Flash to your ESP32/ESP8266

```bash
cp secrets.yaml.example secrets.yaml
# Edit secrets.yaml
esphome run temperature-sensor.yaml
```

## Home Assistant Integration

ESPHome devices are automatically discovered by Home Assistant:

1. Go to Settings → Devices & Services
2. Look for discovered ESPHome devices
3. Click Configure and enter API password

## Resources

- [ESPHome Documentation](https://esphome.io/)
- [Home Assistant ESPHome](https://www.home-assistant.io/integrations/esphome/)
- [ESP32 Pinout Reference](https://randomnerdtutorials.com/esp32-pinout-reference-gpios/)

## License

MIT
