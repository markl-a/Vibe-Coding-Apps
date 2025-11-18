# ESP32 OTA Bootloader

Over-The-Air (OTA) firmware update implementation for ESP32.

## Features

- ✅ HTTPS OTA updates
- ✅ Dual partition support (A/B updates)
- ✅ Automatic rollback on failure
- ✅ Firmware version validation
- ✅ WiFi connectivity
- ✅ Progress reporting

## Prerequisites

- ESP-IDF v4.4 or later
- ESP32 development board
- WiFi network

## Building

```bash
# Set up ESP-IDF environment
. $IDF_PATH/export.sh

# Configure project
idf.py menuconfig

# Build firmware
idf.py build

# Flash to device
idf.py -p /dev/ttyUSB0 flash monitor
```

## Configuration

Edit the following defines in `ota-bootloader.c`:

```c
#define FIRMWARE_URL "https://example.com/firmware.bin"
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
```

## Usage

### 1. Initial Flash

Flash the bootloader and partition table:

```bash
idf.py flash
```

### 2. Trigger OTA Update

The bootloader checks for updates periodically. You can also trigger manually:

```c
perform_https_ota(FIRMWARE_URL);
```

### 3. Rollback

If new firmware fails to boot, automatic rollback occurs:

```c
ota_rollback();
```

### 4. Mark Firmware Valid

After successful boot, mark firmware as valid:

```c
ota_mark_valid();
```

## Partition Table

Use this partition table (`partitions.csv`):

```csv
# Name,   Type, SubType, Offset,  Size
nvs,      data, nvs,     0x9000,  0x4000
otadata,  data, ota,     0xd000,  0x2000
phy_init, data, phy,     0xf000,  0x1000
factory,  app,  factory, 0x10000, 1M
ota_0,    app,  ota_0,   ,        1M
ota_1,    app,  ota_1,   ,        1M
```

## Security Best Practices

1. **Use HTTPS**: Always use HTTPS for OTA updates
2. **Verify Certificates**: Implement certificate pinning
3. **Sign Firmware**: Use digital signatures to verify firmware
4. **Encrypt Firmware**: Encrypt firmware during transit
5. **Version Control**: Implement version checking

## Troubleshooting

### WiFi Connection Fails

- Check SSID and password
- Verify WiFi network is available
- Check signal strength

### OTA Update Fails

- Verify firmware URL is accessible
- Check partition table configuration
- Ensure sufficient flash space

### Rollback Not Working

- Check if previous firmware exists
- Verify OTA data partition is valid
- Check bootloader version

## Example Update Server

Simple Python HTTP server for testing:

```python
from http.server import HTTPServer, SimpleHTTPRequestHandler
import ssl

httpd = HTTPServer(('0.0.0.0', 8443), SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket(httpd.socket, certfile='cert.pem', server_side=True)
httpd.serve_forever()
```

## API Reference

### `ota_init()`
Initialize OTA update process

### `ota_write(data, len)`
Write firmware data to OTA partition

### `ota_finish()`
Finalize OTA update and set boot partition

### `ota_rollback()`
Rollback to previous firmware

### `ota_mark_valid()`
Mark current firmware as valid

### `perform_https_ota(url)`
Perform complete HTTPS OTA update

## License

MIT License
