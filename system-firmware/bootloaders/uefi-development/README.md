# UEFI Bootloader 開發
> AI 驅動的 UEFI/EDK II 應用程式開發專案

## 📋 專案簡介

UEFI (Unified Extensible Firmware Interface) 是現代電腦系統的標準韌體介面，取代了傳統的 BIOS。本專案展示如何使用 AI 輔助工具開發 UEFI Bootloader、驅動程式和應用程式，基於 EDK II (EFI Development Kit) 框架。

## 🎯 專案目標

- 開發自定義 UEFI Bootloader
- 實作 UEFI 驅動程式和協議
- 創建 UEFI Shell 應用程式
- 實作 Secure Boot 功能
- 開發 UEFI 圖形介面應用
- GOP (Graphics Output Protocol) 應用

## 🛠️ 技術棧

### 後端開發
- **語言**: C
- **框架**: EDK II (TianoCore)
- **工具**:
  - GCC / Visual Studio
  - NASM (組譯器)
  - QEMU (測試)
  - OVMF (QEMU UEFI 韌體)

### 前端開發
- **框架**: React + TypeScript
- **功能**: UEFI 配置編輯器、變數管理器

## 📁 專案結構

```
uefi-development/
├── backend/
│   ├── bootloader/                 # UEFI Bootloader
│   │   ├── CustomBootManager/
│   │   ├── SecureBoot/
│   │   └── NetworkBoot/
│   ├── drivers/                    # UEFI 驅動
│   │   ├── BlockIo/
│   │   ├── SimpleFileSystem/
│   │   └── GraphicsOutput/
│   ├── applications/              # UEFI 應用
│   │   ├── ShellApp/
│   │   ├── DiagnosticTool/
│   │   └── FirmwareUpdater/
│   └── Build/                     # 建構輸出
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── UEFIConfigEditor/
│       │   └── VariableManager/
│       └── package.json
└── README.md
```

## 🚀 核心功能

### 1. UEFI Boot Manager
- 自定義開機選單
- 多系統啟動管理
- 啟動順序配置
- 網路開機支援

### 2. Secure Boot 實作
- 金鑰管理 (PK, KEK, DB, DBX)
- 簽名驗證
- 啟動鏈信任
- 撤銷清單管理

### 3. UEFI 驅動開發
- Block I/O Protocol
- Simple File System Protocol
- Network Protocol
- Graphics Output Protocol

### 4. UEFI Shell 應用
- 系統資訊工具
- 診斷工具
- 韌體更新工具
- 分區管理工具

## 💻 開發範例

### 簡單 UEFI Application

```c
// HelloWorld.c - Simple UEFI Application
#include <Uefi.h>
#include <Library/UefiLib.h>
#include <Library/UefiBootServicesTableLib.h>
#include <Library/UefiRuntimeServicesTableLib.h>

/**
 * UEFI Application Entry Point
 */
EFI_STATUS
EFIAPI
UefiMain(
    IN EFI_HANDLE        ImageHandle,
    IN EFI_SYSTEM_TABLE  *SystemTable
)
{
    EFI_STATUS Status;

    // Print message
    Print(L"Hello, UEFI World!\n");
    Print(L"UEFI Version: %d.%d\n",
          SystemTable->Hdr.Revision >> 16,
          SystemTable->Hdr.Revision & 0xFFFF);

    // Get firmware vendor
    Print(L"Firmware Vendor: %s\n", SystemTable->FirmwareVendor);
    Print(L"Firmware Revision: 0x%X\n", SystemTable->FirmwareRevision);

    // Wait for key press
    Print(L"\nPress any key to continue...\n");
    WaitForKey();

    return EFI_SUCCESS;
}

/**
 * Wait for keyboard input
 */
VOID
WaitForKey(VOID)
{
    EFI_STATUS Status;
    EFI_INPUT_KEY Key;
    UINTN Index;

    Status = gBS->WaitForEvent(1, &gST->ConIn->WaitForKey, &Index);
    if (!EFI_ERROR(Status)) {
        gST->ConIn->ReadKeyStroke(gST->ConIn, &Key);
    }
}
```

### UEFI Boot Manager

```c
// CustomBootManager.c
#include <Uefi.h>
#include <Library/UefiLib.h>
#include <Library/UefiBootServicesTableLib.h>
#include <Library/UefiRuntimeServicesTableLib.h>
#include <Library/MemoryAllocationLib.h>
#include <Library/DevicePathLib.h>
#include <Protocol/LoadedImage.h>
#include <Protocol/SimpleFileSystem.h>
#include <Guid/FileInfo.h>

#define BOOT_OPTION_MAX 16

typedef struct {
    CHAR16          Description[64];
    EFI_DEVICE_PATH *DevicePath;
    VOID            *LoadOptions;
    UINT32          LoadOptionsSize;
} BOOT_OPTION;

/**
 * Enumerate boot options
 */
EFI_STATUS
EnumerateBootOptions(
    OUT BOOT_OPTION  **BootOptions,
    OUT UINTN        *BootOptionCount
)
{
    EFI_STATUS Status;
    CHAR16 BootOptionName[16];
    UINT16 *BootOrder;
    UINTN BootOrderSize;
    UINTN Index;

    // Get BootOrder variable
    BootOrder = NULL;
    BootOrderSize = 0;

    Status = gRT->GetVariable(
                    L"BootOrder",
                    &gEfiGlobalVariableGuid,
                    NULL,
                    &BootOrderSize,
                    BootOrder
                    );

    if (Status == EFI_BUFFER_TOO_SMALL) {
        BootOrder = AllocatePool(BootOrderSize);
        Status = gRT->GetVariable(
                        L"BootOrder",
                        &gEfiGlobalVariableGuid,
                        NULL,
                        &BootOrderSize,
                        BootOrder
                        );
    }

    if (EFI_ERROR(Status)) {
        return Status;
    }

    *BootOptionCount = BootOrderSize / sizeof(UINT16);
    *BootOptions = AllocateZeroPool(*BootOptionCount * sizeof(BOOT_OPTION));

    // Load each boot option
    for (Index = 0; Index < *BootOptionCount; Index++) {
        UnicodeSPrint(BootOptionName, sizeof(BootOptionName),
                     L"Boot%04x", BootOrder[Index]);

        UINT8 *OptionData;
        UINTN OptionSize;

        Status = gRT->GetVariable(
                        BootOptionName,
                        &gEfiGlobalVariableGuid,
                        NULL,
                        &OptionSize,
                        NULL
                        );

        if (Status == EFI_BUFFER_TOO_SMALL) {
            OptionData = AllocatePool(OptionSize);
            Status = gRT->GetVariable(
                            BootOptionName,
                            &gEfiGlobalVariableGuid,
                            NULL,
                            &OptionSize,
                            OptionData
                            );

            if (!EFI_ERROR(Status)) {
                // Parse boot option
                // Format: Attributes(4) + FilePathListLength(2) +
                //         Description(null-terminated) + FilePathList + OptionalData

                UINT16 FilePathListLength = *(UINT16 *)(OptionData + 4);
                CHAR16 *Description = (CHAR16 *)(OptionData + 6);

                StrnCpyS((*BootOptions)[Index].Description, 64,
                        Description, StrLen(Description));

                // Device path starts after null-terminated description
                UINTN DescSize = (StrLen(Description) + 1) * sizeof(CHAR16);
                (*BootOptions)[Index].DevicePath =
                    (EFI_DEVICE_PATH *)(OptionData + 6 + DescSize);
            }

            FreePool(OptionData);
        }
    }

    FreePool(BootOrder);
    return EFI_SUCCESS;
}

/**
 * Display boot menu
 */
EFI_STATUS
DisplayBootMenu(
    IN BOOT_OPTION  *BootOptions,
    IN UINTN        BootOptionCount,
    OUT UINTN       *SelectedOption
)
{
    EFI_STATUS Status;
    EFI_INPUT_KEY Key;
    UINTN CurrentSelection = 0;
    UINTN Index;

    while (TRUE) {
        // Clear screen
        gST->ConOut->ClearScreen(gST->ConOut);

        // Print header
        Print(L"\n");
        Print(L"╔══════════════════════════════════════════════╗\n");
        Print(L"║          UEFI Boot Manager v1.0              ║\n");
        Print(L"╚══════════════════════════════════════════════╝\n");
        Print(L"\n");

        // Print boot options
        for (Index = 0; Index < BootOptionCount; Index++) {
            if (Index == CurrentSelection) {
                gST->ConOut->SetAttribute(gST->ConOut,
                    EFI_TEXT_ATTR(EFI_BLACK, EFI_LIGHTGRAY));
                Print(L" ► ");
            } else {
                gST->ConOut->SetAttribute(gST->ConOut,
                    EFI_TEXT_ATTR(EFI_LIGHTGRAY, EFI_BLACK));
                Print(L"   ");
            }

            Print(L"%s\n", BootOptions[Index].Description);
            gST->ConOut->SetAttribute(gST->ConOut,
                EFI_TEXT_ATTR(EFI_LIGHTGRAY, EFI_BLACK));
        }

        Print(L"\n");
        Print(L"Use ↑/↓ to select, Enter to boot\n");

        // Wait for key input
        UINTN EventIndex;
        gBS->WaitForEvent(1, &gST->ConIn->WaitForKey, &EventIndex);
        Status = gST->ConIn->ReadKeyStroke(gST->ConIn, &Key);

        if (EFI_ERROR(Status)) {
            continue;
        }

        // Handle key input
        switch (Key.ScanCode) {
            case SCAN_UP:
                if (CurrentSelection > 0) {
                    CurrentSelection--;
                }
                break;

            case SCAN_DOWN:
                if (CurrentSelection < BootOptionCount - 1) {
                    CurrentSelection++;
                }
                break;

            case SCAN_NULL:
                if (Key.UnicodeChar == CHAR_CARRIAGE_RETURN) {
                    *SelectedOption = CurrentSelection;
                    return EFI_SUCCESS;
                }
                break;
        }
    }

    return EFI_SUCCESS;
}

/**
 * Boot from selected option
 */
EFI_STATUS
BootFromOption(
    IN BOOT_OPTION *Option
)
{
    EFI_STATUS Status;
    EFI_HANDLE ImageHandle;
    EFI_LOADED_IMAGE_PROTOCOL *LoadedImage;

    Print(L"Booting: %s\n", Option->Description);

    // Load image
    Status = gBS->LoadImage(
                    FALSE,
                    gImageHandle,
                    Option->DevicePath,
                    NULL,
                    0,
                    &ImageHandle
                    );

    if (EFI_ERROR(Status)) {
        Print(L"Failed to load image: %r\n", Status);
        return Status;
    }

    // Set load options if present
    if (Option->LoadOptionsSize > 0) {
        Status = gBS->HandleProtocol(
                        ImageHandle,
                        &gEfiLoadedImageProtocolGuid,
                        (VOID **)&LoadedImage
                        );

        if (!EFI_ERROR(Status)) {
            LoadedImage->LoadOptions = Option->LoadOptions;
            LoadedImage->LoadOptionsSize = Option->LoadOptionsSize;
        }
    }

    // Start image
    Status = gBS->StartImage(ImageHandle, NULL, NULL);

    if (EFI_ERROR(Status)) {
        Print(L"Failed to start image: %r\n", Status);
        gBS->UnloadImage(ImageHandle);
    }

    return Status;
}

/**
 * Main entry point
 */
EFI_STATUS
EFIAPI
UefiMain(
    IN EFI_HANDLE        ImageHandle,
    IN EFI_SYSTEM_TABLE  *SystemTable
)
{
    EFI_STATUS Status;
    BOOT_OPTION *BootOptions;
    UINTN BootOptionCount;
    UINTN SelectedOption;

    // Enumerate boot options
    Status = EnumerateBootOptions(&BootOptions, &BootOptionCount);
    if (EFI_ERROR(Status)) {
        Print(L"Failed to enumerate boot options: %r\n", Status);
        return Status;
    }

    // Display boot menu
    Status = DisplayBootMenu(BootOptions, BootOptionCount, &SelectedOption);
    if (EFI_ERROR(Status)) {
        Print(L"Failed to display boot menu: %r\n", Status);
        return Status;
    }

    // Boot from selected option
    Status = BootFromOption(&BootOptions[SelectedOption]);

    // Cleanup
    FreePool(BootOptions);

    return Status;
}
```

### EDK II Package 配置

```inf
# CustomBootManager.inf
[Defines]
  INF_VERSION                    = 0x00010005
  BASE_NAME                      = CustomBootManager
  FILE_GUID                      = 12345678-1234-1234-1234-123456789ABC
  MODULE_TYPE                    = UEFI_APPLICATION
  VERSION_STRING                 = 1.0
  ENTRY_POINT                    = UefiMain

[Sources]
  CustomBootManager.c

[Packages]
  MdePkg/MdePkg.dec
  MdeModulePkg/MdeModulePkg.dec
  ShellPkg/ShellPkg.dec

[LibraryClasses]
  UefiApplicationEntryPoint
  UefiLib
  UefiBootServicesTableLib
  UefiRuntimeServicesTableLib
  MemoryAllocationLib
  DevicePathLib
  PrintLib

[Protocols]
  gEfiLoadedImageProtocolGuid
  gEfiSimpleFileSystemProtocolGuid
  gEfiBlockIoProtocolGuid

[Guids]
  gEfiGlobalVariableGuid
  gEfiFileInfoGuid
```

## 🤖 AI 輔助開發

### 使用場景

1. **協議實作**
   - "實作 EFI_SIMPLE_FILE_SYSTEM_PROTOCOL"
   - "創建自定義 Block I/O 驅動"

2. **應用開發**
   - "開發 UEFI Shell 診斷工具"
   - "實作圖形化開機選單"

3. **除錯協助**
   - "UEFI 應用程式無法啟動的原因"
   - "如何在 QEMU 中測試 UEFI 應用"

4. **Secure Boot**
   - "如何生成和管理 UEFI Secure Boot 金鑰"
   - "實作啟動映像簽名驗證"

## 📚 學習資源

### 官方文檔
- [UEFI Specification](https://uefi.org/specifications)
- [EDK II Documentation](https://github.com/tianocore/tianocore.github.io/wiki/EDK-II)
- [TianoCore Training](https://github.com/tianocore-training)

### 推薦書籍
- Beyond BIOS: Developing with the Unified Extensible Firmware Interface
- Harnessing the UEFI Shell

## 🧪 測試與開發

### QEMU 測試環境

```bash
# 安裝 OVMF (QEMU UEFI 固件)
sudo apt-get install ovmf

# 運行 UEFI 應用
qemu-system-x86_64 \
    -bios /usr/share/ovmf/OVMF.fd \
    -drive file=fat:rw:./image,format=raw \
    -net none \
    -nographic
```

### 建構 UEFI 應用

```bash
# 設置 EDK II 環境
cd ~/edk2
. edksetup.sh

# 建構應用
build -a X64 -t GCC5 -p CustomBootManager/CustomBootManager.dsc
```

## ⚠️ 注意事項

- UEFI 應用必須遵循 UEFI 規範
- 注意記憶體管理和資源釋放
- Secure Boot 金鑰管理需格外小心
- 測試時建議使用虛擬機
- 保留恢復方式以防止系統無法啟動

## 📄 授權

MIT License

---

**最後更新**: 2025-11-16
**狀態**: ✅ 活躍開發中
**維護者**: AI-Assisted Development Team
