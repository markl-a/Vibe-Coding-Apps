# 🔌 設備驅動程式開發
> 使用 AI 驅動的方法進行跨平台設備驅動開發

⚠️ **驗證階段專案** - 此領域目前處於研究與開發階段

## 📋 專案概述

設備驅動程式是作業系統與硬體設備之間的橋樑，負責管理和控制硬體設備。本專案展示如何使用 AI 輔助工具在不同平台上開發設備驅動程式。

## ⭐ AI 增強功能 (最新更新)

本專案現已整合強大的 AI 輔助診斷和配置工具！

### 🎯 核心特性

**GPIO Controller**
- ✅ **PWM 支援**: 軟體 PWM 實現，支援 LED 調光、馬達控制、伺服控制
- ✅ **中斷去抖動**: 智能去抖動機制，可配置時間和統計分析
- ✅ **AI 診斷工具**: 自動狀態分析、權限檢查、速度測試、配置建議

**I2C Device Driver**
- ✅ **完整感測器範例**: MPU6050 (IMU)、BH1750 (光感測器)、BME280
- ✅ **AI 診斷工具**: 設備自動識別、通訊測試、故障排除建議
- ✅ **豐富的設備資料庫**: 20+ 常見 I2C 設備即時識別

### 🚀 快速體驗

```bash
# GPIO AI 診斷
./gpio-controller/tools/gpio_ai_diagnostics.py -g 17 18
./gpio-controller/tools/gpio_ai_diagnostics.py --suggest led

# I2C AI 診斷
./i2c-device-driver/tools/i2c_ai_diagnostics.py
./i2c-device-driver/tools/i2c_ai_diagnostics.py --suggest IMU

# PWM LED 呼吸燈
./gpio-controller/examples/pwm_control 0 breathing 5

# MPU6050 姿態角測量
./i2c-device-driver/examples/mpu6050_example -c -r 50
```

📖 詳細說明請參閱 [AI_ENHANCEMENTS.md](./AI_ENHANCEMENTS.md)

## 🎯 支援平台

### 1. Windows 驅動開發
- **WDM (Windows Driver Model)**
  - 核心模式驅動
  - 濾鏡驅動
  - 匯流排驅動
  - 函數驅動

- **KMDF (Kernel-Mode Driver Framework)**
  - 物件導向框架
  - I/O 佇列管理
  - PnP 和電源管理
  - DMA 支援

- **UMDF (User-Mode Driver Framework)**
  - 使用者模式驅動
  - 安全性更高
  - 除錯更容易
  - 適用於 USB 等設備

### 2. macOS 驅動開發
- **IOKit 框架**
  - C++ 物件導向
  - 設備樹架構
  - 家族驅動 (Family Driver)
  - Nub 和 Driver 配對

- **DriverKit (現代方案)**
  - 使用者空間驅動
  - Swift/Objective-C 支援
  - 系統擴展
  - 更安全的架構

### 3. Linux 驅動開發
- **字元設備驅動**
- **塊設備驅動**
- **網路設備驅動**
- **USB 驅動**
- **PCI 驅動**
(已在 linux-kernel-drivers 詳述)

### 4. 跨平台驅動開發
- **libusb/libftdi**
  - 使用者空間 USB
  - 跨平台支援
  - 無需核心驅動

- **WinUSB/IOUSBLib**
  - 通用 USB 驅動
  - 簡化開發流程

## 🛠️ 技術棧

### 開發語言
- **C/C++** - 主要開發語言
- **Assembly** - 性能關鍵部分
- **Swift** - macOS DriverKit
- **Rust** - 現代安全驅動

### 開發工具

#### Windows
- **WDK (Windows Driver Kit)**
- **Visual Studio**
- **WinDbg** - 核心除錯
- **Driver Verifier** - 驅動驗證

#### macOS
- **Xcode**
- **IORegistryExplorer**
- **Instruments**
- **lldb** - 除錯器

#### Linux
- **GCC/Clang**
- **GDB/kgdb**
- **ftrace/perf**
- **sparse** - 靜態分析

## 🚀 快速開始

### 1. Windows KMDF 驅動範例

```c
// driver.c - Windows KMDF 驅動
#include <ntddk.h>
#include <wdf.h>

// 設備上下文
typedef struct _DEVICE_CONTEXT {
    WDFQUEUE DefaultQueue;
    ULONG PrivateData;
} DEVICE_CONTEXT, *PDEVICE_CONTEXT;

WDF_DECLARE_CONTEXT_TYPE_WITH_NAME(DEVICE_CONTEXT, DeviceGetContext)

// 驅動入口
NTSTATUS DriverEntry(
    _In_ PDRIVER_OBJECT  DriverObject,
    _In_ PUNICODE_STRING RegistryPath
)
{
    WDF_DRIVER_CONFIG config;
    NTSTATUS status;

    WDF_DRIVER_CONFIG_INIT(&config, DeviceAdd);

    status = WdfDriverCreate(
        DriverObject,
        RegistryPath,
        WDF_NO_OBJECT_ATTRIBUTES,
        &config,
        WDF_NO_HANDLE
    );

    return status;
}

// 設備添加
NTSTATUS DeviceAdd(
    _In_ WDFDRIVER       Driver,
    _In_ PWDFDEVICE_INIT DeviceInit
)
{
    NTSTATUS status;
    WDFDEVICE device;
    PDEVICE_CONTEXT deviceContext;
    WDF_OBJECT_ATTRIBUTES deviceAttributes;
    WDF_PNPPOWER_EVENT_CALLBACKS pnpPowerCallbacks;

    UNREFERENCED_PARAMETER(Driver);

    // 設置 PnP 回調
    WDF_PNPPOWER_EVENT_CALLBACKS_INIT(&pnpPowerCallbacks);
    pnpPowerCallbacks.EvtDevicePrepareHardware = EvtDevicePrepareHardware;
    pnpPowerCallbacks.EvtDeviceReleaseHardware = EvtDeviceReleaseHardware;
    WdfDeviceInitSetPnpPowerEventCallbacks(DeviceInit, &pnpPowerCallbacks);

    // 初始化設備屬性
    WDF_OBJECT_ATTRIBUTES_INIT_CONTEXT_TYPE(&deviceAttributes, DEVICE_CONTEXT);

    // 創建設備
    status = WdfDeviceCreate(&DeviceInit, &deviceAttributes, &device);
    if (!NT_SUCCESS(status)) {
        return status;
    }

    deviceContext = DeviceGetContext(device);

    // 創建 I/O 佇列
    status = QueueInitialize(device);

    return status;
}

// 硬體準備
NTSTATUS EvtDevicePrepareHardware(
    _In_ WDFDEVICE    Device,
    _In_ WDFCMRESLIST ResourcesRaw,
    _In_ WDFCMRESLIST ResourcesTranslated
)
{
    UNREFERENCED_PARAMETER(ResourcesRaw);
    UNREFERENCED_PARAMETER(ResourcesTranslated);

    KdPrint(("Device hardware prepared\n"));

    // 初始化硬體
    // ...

    return STATUS_SUCCESS;
}

// I/O 佇列初始化
NTSTATUS QueueInitialize(_In_ WDFDEVICE Device)
{
    WDFQUEUE queue;
    NTSTATUS status;
    WDF_IO_QUEUE_CONFIG queueConfig;
    PDEVICE_CONTEXT deviceContext;

    deviceContext = DeviceGetContext(Device);

    WDF_IO_QUEUE_CONFIG_INIT_DEFAULT_QUEUE(
        &queueConfig,
        WdfIoQueueDispatchSequential
    );

    queueConfig.EvtIoRead = EvtIoRead;
    queueConfig.EvtIoWrite = EvtIoWrite;
    queueConfig.EvtIoDeviceControl = EvtIoDeviceControl;

    status = WdfIoQueueCreate(
        Device,
        &queueConfig,
        WDF_NO_OBJECT_ATTRIBUTES,
        &queue
    );

    if (!NT_SUCCESS(status)) {
        return status;
    }

    deviceContext->DefaultQueue = queue;

    return status;
}

// 讀取處理
VOID EvtIoRead(
    _In_ WDFQUEUE Queue,
    _In_ WDFREQUEST Request,
    _In_ size_t Length
)
{
    UNREFERENCED_PARAMETER(Queue);
    UNREFERENCED_PARAMETER(Length);

    PVOID buffer;
    size_t bufferLength;
    NTSTATUS status;

    status = WdfRequestRetrieveOutputBuffer(
        Request,
        1,
        &buffer,
        &bufferLength
    );

    if (NT_SUCCESS(status)) {
        // 讀取數據
        // ...

        WdfRequestCompleteWithInformation(Request, STATUS_SUCCESS, bufferLength);
    } else {
        WdfRequestComplete(Request, status);
    }
}

// 寫入處理
VOID EvtIoWrite(
    _In_ WDFQUEUE Queue,
    _In_ WDFREQUEST Request,
    _In_ size_t Length
)
{
    UNREFERENCED_PARAMETER(Queue);

    PVOID buffer;
    size_t bufferLength;
    NTSTATUS status;

    status = WdfRequestRetrieveInputBuffer(
        Request,
        1,
        &buffer,
        &bufferLength
    );

    if (NT_SUCCESS(status)) {
        // 寫入數據
        // ...

        WdfRequestCompleteWithInformation(Request, STATUS_SUCCESS, Length);
    } else {
        WdfRequestComplete(Request, status);
    }
}

// IOCTL 處理
VOID EvtIoDeviceControl(
    _In_ WDFQUEUE Queue,
    _In_ WDFREQUEST Request,
    _In_ size_t OutputBufferLength,
    _In_ size_t InputBufferLength,
    _In_ ULONG IoControlCode
)
{
    UNREFERENCED_PARAMETER(Queue);
    UNREFERENCED_PARAMETER(OutputBufferLength);
    UNREFERENCED_PARAMETER(InputBufferLength);

    NTSTATUS status = STATUS_INVALID_DEVICE_REQUEST;

    switch (IoControlCode) {
        case IOCTL_CUSTOM_COMMAND:
            // 處理自定義命令
            status = STATUS_SUCCESS;
            break;

        default:
            break;
    }

    WdfRequestComplete(Request, status);
}
```

### 2. macOS IOKit 驅動範例

```cpp
// MyDriver.cpp - macOS IOKit 驅動
#include <IOKit/IOService.h>
#include <IOKit/IOLib.h>

class com_example_MyDriver : public IOService
{
    OSDeclareDefaultStructors(com_example_MyDriver)

public:
    virtual bool init(OSDictionary *dictionary = 0) override;
    virtual void free(void) override;
    virtual IOService *probe(IOService *provider, SInt32 *score) override;
    virtual bool start(IOService *provider) override;
    virtual void stop(IOService *provider) override;

private:
    IOService *m_provider;
};

// 註冊驅動類別
OSDefineMetaClassAndStructors(com_example_MyDriver, IOService)

bool com_example_MyDriver::init(OSDictionary *dict)
{
    bool result = super::init(dict);
    IOLog("MyDriver::init\n");
    return result;
}

void com_example_MyDriver::free(void)
{
    IOLog("MyDriver::free\n");
    super::free();
}

IOService *com_example_MyDriver::probe(IOService *provider, SInt32 *score)
{
    IOService *result = super::probe(provider, score);
    IOLog("MyDriver::probe\n");
    return result;
}

bool com_example_MyDriver::start(IOService *provider)
{
    bool result = super::start(provider);
    IOLog("MyDriver::start\n");

    if (!result) {
        return false;
    }

    m_provider = provider;

    // 註冊服務
    registerService();

    return true;
}

void com_example_MyDriver::stop(IOService *provider)
{
    IOLog("MyDriver::stop\n");
    super::stop(provider);
}
```

### 3. 跨平台 libusb 範例

```c
// usb_device.c - 跨平台 USB 設備訪問
#include <libusb-1.0/libusb.h>
#include <stdio.h>
#include <string.h>

#define VENDOR_ID  0x1234
#define PRODUCT_ID 0x5678

typedef struct {
    libusb_context *ctx;
    libusb_device_handle *handle;
} usb_device_t;

// 初始化 USB
int usb_init(usb_device_t *dev)
{
    int rc;

    // 初始化 libusb
    rc = libusb_init(&dev->ctx);
    if (rc < 0) {
        fprintf(stderr, "Failed to initialize libusb: %s\n",
                libusb_error_name(rc));
        return rc;
    }

    // 設置除錯級別
    libusb_set_option(dev->ctx, LIBUSB_OPTION_LOG_LEVEL, LIBUSB_LOG_LEVEL_INFO);

    // 打開設備
    dev->handle = libusb_open_device_with_vid_pid(dev->ctx, VENDOR_ID, PRODUCT_ID);
    if (!dev->handle) {
        fprintf(stderr, "Failed to open USB device\n");
        libusb_exit(dev->ctx);
        return -1;
    }

    // 聲明介面
    rc = libusb_claim_interface(dev->handle, 0);
    if (rc < 0) {
        fprintf(stderr, "Failed to claim interface: %s\n",
                libusb_error_name(rc));
        libusb_close(dev->handle);
        libusb_exit(dev->ctx);
        return rc;
    }

    return 0;
}

// USB 批量傳輸讀取
int usb_bulk_read(usb_device_t *dev, unsigned char *buffer, int size)
{
    int transferred;
    int rc;

    rc = libusb_bulk_transfer(
        dev->handle,
        0x81,  // IN 端點
        buffer,
        size,
        &transferred,
        1000   // 超時 1 秒
    );

    if (rc == 0) {
        return transferred;
    } else {
        fprintf(stderr, "Bulk read failed: %s\n", libusb_error_name(rc));
        return rc;
    }
}

// USB 批量傳輸寫入
int usb_bulk_write(usb_device_t *dev, unsigned char *buffer, int size)
{
    int transferred;
    int rc;

    rc = libusb_bulk_transfer(
        dev->handle,
        0x01,  // OUT 端點
        buffer,
        size,
        &transferred,
        1000
    );

    if (rc == 0) {
        return transferred;
    } else {
        fprintf(stderr, "Bulk write failed: %s\n", libusb_error_name(rc));
        return rc;
    }
}

// USB 控制傳輸
int usb_control_transfer(usb_device_t *dev, uint8_t request,
                        uint16_t value, uint16_t index,
                        unsigned char *data, uint16_t length)
{
    int rc;

    rc = libusb_control_transfer(
        dev->handle,
        0x40,  // bmRequestType (Vendor, Host-to-Device)
        request,
        value,
        index,
        data,
        length,
        1000
    );

    if (rc < 0) {
        fprintf(stderr, "Control transfer failed: %s\n",
                libusb_error_name(rc));
    }

    return rc;
}

// 清理
void usb_cleanup(usb_device_t *dev)
{
    if (dev->handle) {
        libusb_release_interface(dev->handle, 0);
        libusb_close(dev->handle);
    }
    if (dev->ctx) {
        libusb_exit(dev->ctx);
    }
}

// 使用範例
int main(void)
{
    usb_device_t dev = {0};
    unsigned char buffer[64];

    if (usb_init(&dev) < 0) {
        return 1;
    }

    // 寫入數據
    strcpy((char *)buffer, "Hello USB Device!");
    usb_bulk_write(&dev, buffer, strlen((char *)buffer));

    // 讀取數據
    int read_bytes = usb_bulk_read(&dev, buffer, sizeof(buffer));
    if (read_bytes > 0) {
        buffer[read_bytes] = '\0';
        printf("Received: %s\n", buffer);
    }

    usb_cleanup(&dev);
    return 0;
}
```

## 📚 開發範例

### 範例 1: Windows 過濾驅動

```c
// filter_driver.c
#include <ntddk.h>
#include <wdf.h>

NTSTATUS FilterEvtIoInternalDeviceControl(
    WDFQUEUE Queue,
    WDFREQUEST Request,
    size_t OutputBufferLength,
    size_t InputBufferLength,
    ULONG IoControlCode
)
{
    NTSTATUS status;
    WDFDEVICE device;

    device = WdfIoQueueGetDevice(Queue);

    // 預處理
    KdPrint(("Filter: IOCTL 0x%x\n", IoControlCode));

    // 轉發請求到下層驅動
    WdfRequestFormatRequestUsingCurrentType(Request);
    WdfRequestSetCompletionRoutine(Request, FilterRequestCompletionRoutine, NULL);

    if (!WdfRequestSend(Request, WdfDeviceGetIoTarget(device), WDF_NO_SEND_OPTIONS)) {
        status = WdfRequestGetStatus(Request);
        WdfRequestComplete(Request, status);
        return status;
    }

    return STATUS_SUCCESS;
}

VOID FilterRequestCompletionRoutine(
    WDFREQUEST Request,
    WDFIOTARGET Target,
    PWDF_REQUEST_COMPLETION_PARAMS Params,
    WDFCONTEXT Context
)
{
    UNREFERENCED_PARAMETER(Target);
    UNREFERENCED_PARAMETER(Context);

    // 後處理
    KdPrint(("Filter: Completion status 0x%x\n",
             Params->IoStatus.Status));

    WdfRequestComplete(Request, Params->IoStatus.Status);
}
```

### 範例 2: macOS User Client

```cpp
// MyUserClient.cpp
#include <IOKit/IOUserClient.h>

class MyUserClient : public IOUserClient
{
    OSDeclareDefaultStructors(MyUserClient)

public:
    virtual bool initWithTask(
        task_t owningTask,
        void *securityToken,
        UInt32 type) override;

    virtual IOReturn clientClose(void) override;
    virtual IOReturn clientDied(void) override;

    virtual IOReturn externalMethod(
        uint32_t selector,
        IOExternalMethodArguments *arguments,
        IOExternalMethodDispatch *dispatch,
        OSObject *target,
        void *reference) override;

private:
    task_t m_task;
    MyDriver *m_provider;

    // 方法分發表
    static const IOExternalMethodDispatch sMethods[kNumberOfMethods];
};

const IOExternalMethodDispatch MyUserClient::sMethods[kNumberOfMethods] = {
    {   // kMyUserClientOpen
        (IOExternalMethodAction)&MyUserClient::sOpen,
        0, 0,  // 無輸入標量
        0, 0   // 無輸出標量
    },
    {   // kMyUserClientClose
        (IOExternalMethodAction)&MyUserClient::sClose,
        0, 0,
        0, 0
    },
    {   // kMyUserClientRead
        (IOExternalMethodAction)&MyUserClient::sRead,
        1, 0,  // 1 個輸入標量 (address)
        0, 4096  // 最多 4K 輸出結構
    }
};

IOReturn MyUserClient::externalMethod(
    uint32_t selector,
    IOExternalMethodArguments *arguments,
    IOExternalMethodDispatch *dispatch,
    OSObject *target,
    void *reference)
{
    if (selector >= kNumberOfMethods) {
        return kIOReturnUnsupported;
    }

    dispatch = (IOExternalMethodDispatch *)&sMethods[selector];
    target = this;
    reference = NULL;

    return super::externalMethod(selector, arguments, dispatch, target, reference);
}
```

## 🤖 AI 輔助開發策略

### 1. 驅動架構設計
```
"Windows KMDF 和 WDM 該如何選擇?"
"如何設計過濾驅動的架構?"
"跨平台驅動的抽象層如何設計?"
```

### 2. 程式碼生成
```
"生成 Windows USB 驅動框架"
"創建 macOS IOKit 驅動模板"
"實作跨平台的設備抽象層"
```

### 3. 除錯協助
```
"Windows 藍屏如何分析?"
"macOS Kernel Panic 如何除錯?"
"記憶體洩漏如何檢測?"
```

### 4. 相容性問題
```
"如何處理不同 Windows 版本的相容性?"
"macOS 系統更新後驅動失效如何解決?"
"USB 設備在不同平台上的差異"
```

## 📊 專案結構

```
device-drivers/
├── README.md
├── windows/
│   ├── kmdf-examples/
│   ├── wdm-examples/
│   ├── umdf-examples/
│   └── filter-drivers/
├── macos/
│   ├── iokit-examples/
│   ├── driverkit-examples/
│   └── user-clients/
├── cross-platform/
│   ├── libusb/
│   ├── hidapi/
│   └── abstraction-layer/
└── docs/
    ├── windows-driver-dev.md
    ├── macos-driver-dev.md
    └── debugging-guide.md
```

## 🧪 開發路線圖

### Phase 1: 平台基礎 ✅
- [x] Windows WDM 基礎
- [x] Windows KMDF 框架
- [x] macOS IOKit 基礎
- [x] libusb 使用

### Phase 2: 進階功能
- [ ] DMA 傳輸
- [ ] 中斷處理
- [ ] 電源管理
- [ ] PnP 支援

### Phase 3: 跨平台
- [ ] 統一抽象層
- [ ] 平台差異處理
- [ ] 自動化測試
- [ ] 性能優化

### Phase 4: 產品化
- [ ] 驅動簽名
- [ ] 安裝程式
- [ ] 自動更新
- [ ] 監控系統

## 🔬 學習資源

### 書籍推薦
1. **Developing Drivers with the Windows Driver Foundation** - Penny Orwick
2. **OS X and iOS Kernel Programming** - Ole Henry Halvorsen
3. **Linux Device Drivers** - Jonathan Corbet

### 線上資源
- [Windows Driver Kit Documentation](https://docs.microsoft.com/en-us/windows-hardware/drivers/)
- [IOKit Fundamentals](https://developer.apple.com/library/archive/documentation/DeviceDrivers/Conceptual/IOKitFundamentals/)
- [libusb Documentation](https://libusb.info/)

## ⚙️ 開發最佳實踐

### 1. 安全編程
- 驗證所有輸入
- 正確的記憶體管理
- 避免整數溢位
- 使用 SAL 註解 (Windows)

### 2. 錯誤處理
- 完整的錯誤檢查
- 資源清理
- 日誌記錄
- 優雅降級

### 3. 性能考慮
- 減少記憶體複製
- 使用 DMA
- 優化 I/O 路徑
- 避免忙等待

## ⚠️ 注意事項

### 開發限制
- **核心模式**: 崩潰會導致系統重啟
- **除錯困難**: 需要雙機除錯
- **測試複雜**: 需要真實硬體
- **簽名要求**: 生產環境必須簽名

### 平台差異
- Windows: 嚴格的驅動驗證
- macOS: 系統完整性保護 (SIP)
- Linux: GPL 授權要求

## 📄 授權

範例代碼採用 MIT 授權

---

**最後更新**: 2025-11-16
**狀態**: 🚧 研究與開發中
**維護者**: AI-Assisted Development Team
