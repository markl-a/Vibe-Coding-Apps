# 平台設備驅動 (Platform Device Driver)

Linux 平台設備驅動範例，展示平台驅動開發模式。

## 📋 專案簡介

平台設備驅動用於不在傳統總線（如 PCI、USB）上的設備，主要用於 SoC 內部外設。

### 特性

- 平台設備驅動註冊
- 設備樹綁定
- 資源管理（記憶體、中斷等）
- GPIO 控制示例
- sysfs 用戶接口

## 🛠️ 編譯與使用

```bash
make                # 編譯
make install        # 載入
make uninstall      # 卸載
```

## 🔍 核心概念

### 平台驅動結構

```c
static struct platform_driver my_driver = {
    .driver = {
        .name = "my_device",
        .of_match_table = my_of_match,
    },
    .probe = my_probe,
    .remove = my_remove,
};
```

### 資源獲取

```c
res = platform_get_resource(pdev, IORESOURCE_MEM, 0);
irq = platform_get_irq(pdev, 0);
```

### 設備樹綁定

```dts
my_device {
    compatible = "vendor,my-device";
    reg = <0x10000000 0x1000>;
    interrupts = <0 42 4>;
};
```

## 📚 延伸閱讀

- [Platform Devices and Drivers](https://www.kernel.org/doc/html/latest/driver-api/driver-model/platform.html)
- [Device Tree Usage](https://www.devicetree.org/)

## 📝 授權

GPL v2
