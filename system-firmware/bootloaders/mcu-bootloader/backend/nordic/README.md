# Nordic nRF52 BLE DFU Bootloader

Bluetooth Low Energy Device Firmware Update (DFU) bootloader for Nordic nRF52 series.

## Features

- ✅ BLE wireless firmware updates
- ✅ Nordic DFU protocol
- ✅ Automatic rollback on failure
- ✅ Buttonless DFU support
- ✅ Secure firmware validation
- ✅ Low power consumption

## Prerequisites

- nRF5 SDK v17.0 or later
- Nordic nRF52 development board
- ARM GCC toolchain
- nRF Command Line Tools
- nRF Connect mobile app (for testing)

## Building

```bash
# Set SDK path
export NRF5_SDK_PATH=/path/to/nRF5_SDK

# Build bootloader
make -j4

# Flash to device
make flash

# Erase and flash
make erase
make flash_all
```

## Configuration

### 1. Hardware Configuration

Configure GPIO for DFU button in `custom_board.h`:

```c
#define BUTTON_DFU      11  // GPIO pin for DFU button
#define BUTTON_PULL     NRF_GPIO_PIN_PULLUP
```

### 2. BLE Configuration

Modify BLE parameters in the source:

```c
#define DEVICE_NAME             "DFU_Bootloader"
#define MIN_CONN_INTERVAL       MSEC_TO_UNITS(100, UNIT_1_25_MS)
#define MAX_CONN_INTERVAL       MSEC_TO_UNITS(200, UNIT_1_25_MS)
```

## Usage

### 1. Enter DFU Mode

**Method A: Button Press**
- Hold DFU button during power-on
- LED will blink to indicate DFU mode

**Method B: Buttonless DFU**
- Trigger from application code
- Bootloader automatically enters DFU mode

**Method C: No Valid Application**
- Bootloader enters DFU mode automatically

### 2. Update Firmware

**Using nRF Connect App:**

1. Open nRF Connect app
2. Scan for "DFU_Bootloader"
3. Connect to device
4. Select DFU tab
5. Choose firmware file (.zip)
6. Start update

**Using nrfutil:**

```bash
# Package firmware
nrfutil pkg generate \
  --hw-version 52 \
  --sd-req 0x00B6 \
  --application app.hex \
  --application-version 1 \
  firmware.zip

# Upload via BLE
nrfutil dfu ble \
  -pkg firmware.zip \
  -p /dev/ttyACM0 \
  -n "DFU_Bootloader"
```

### 3. Verify Update

After successful update, device will:
1. Automatically reboot
2. Start new application
3. Validate firmware
4. Rollback if validation fails

## DFU Package Creation

### Application Only

```bash
nrfutil pkg generate \
  --hw-version 52 \
  --sd-req 0x00B6 \
  --application app.hex \
  --application-version 1 \
  app_dfu.zip
```

### Application + SoftDevice

```bash
nrfutil pkg generate \
  --hw-version 52 \
  --sd-req 0x00B6 \
  --application app.hex \
  --application-version 1 \
  --softdevice s132_nrf52_7.0.1_softdevice.hex \
  --sd-id 0x00CB \
  app_sd_dfu.zip
```

### With Private Key (Secure DFU)

```bash
# Generate keys
nrfutil keys generate private.key
nrfutil keys display --key pk --format code private.key public_key.c

# Create signed package
nrfutil pkg generate \
  --hw-version 52 \
  --sd-req 0x00B6 \
  --application app.hex \
  --application-version 1 \
  --key-file private.key \
  signed_app_dfu.zip
```

## Memory Layout

```
+------------------+ 0x00000000
|   MBR (4KB)      |
+------------------+ 0x00001000
| SoftDevice       |
|   (152KB)        |
+------------------+ 0x00027000
| Bootloader       |
|   (24KB)         |
+------------------+ 0x0002D000
| Bootloader       |
| Settings (4KB)   |
+------------------+ 0x0002E000
| MBR Params       |
| (4KB)            |
+------------------+ 0x0002F000
| Application      |
|   (452KB)        |
+------------------+ 0x000A0000
```

## LED Indicators

- **Slow Blink**: DFU mode, waiting for connection
- **Fast Blink**: DFU in progress
- **Solid ON**: DFU completed successfully
- **OFF**: Normal application running

## Security Features

### 1. Signature Verification

```c
// Public key is embedded in bootloader
// All firmware must be signed with corresponding private key
```

### 2. Version Control

```c
// Prevents downgrade attacks
// Only allows firmware with version >= current version
```

### 3. CRC Validation

```c
// All firmware packages include CRC
// Validated before flashing
```

## Troubleshooting

### Cannot Enter DFU Mode

- Check button connection
- Verify GPIO configuration
- Try power cycle

### Connection Fails

- Check BLE is enabled on phone
- Verify device is in range
- Try resetting device

### Update Fails

- Check DFU package is valid
- Verify sufficient flash space
- Check SoftDevice compatibility

### Rollback Occurring

- Check application is valid
- Verify interrupts are properly configured
- Check for watchdog resets

## API Reference

### Boot Check Functions

```c
bool dfu_enter_check(void);           // Check if should enter DFU
void jump_to_app(void);                // Jump to application
bool nrf_dfu_app_is_valid(void);      // Validate application
```

### DFU Functions

```c
uint32_t nrf_dfu_init(nrf_dfu_observer_t observer);
void nrf_dfu_observer_register(nrf_dfu_observer_t observer);
```

### Settings Functions

```c
uint32_t nrf_dfu_settings_init(bool sd_irq_initialized);
void nrf_dfu_settings_write(void *p_context);
```

## Development Tips

1. **Test with Emulator**: Use nRF52 DK for development
2. **Use Logging**: Enable RTT logging for debugging
3. **Monitor Power**: Use Power Profiler Kit
4. **Secure First**: Always use signed packages in production
5. **Test Rollback**: Verify rollback mechanism works

## Example Application Integration

```c
// In your application, trigger buttonless DFU:

#include "nrf_dfu_svci.h"

void enter_dfu_mode(void)
{
    // Set DFU flag
    s_dfu_settings.enter_buttonless_dfu = true;
    nrf_dfu_settings_write(NULL);

    // Reboot
    NVIC_SystemReset();
}
```

## Resources

- [Nordic DFU Documentation](https://infocenter.nordicsemi.com/topic/sdk_nrf5_v17.0.0/lib_bootloader.html)
- [nrfutil Documentation](https://github.com/NordicSemiconductor/pc-nrfutil)
- [nRF Connect App](https://www.nordicsemi.com/Products/Development-tools/nrf-connect-for-mobile)

## License

MIT License
