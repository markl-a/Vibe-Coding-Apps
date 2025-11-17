# USB 串口驅動範例程式

本目錄包含 USB 串口驅動的使用範例。

## 編譯

```bash
make
```

## 範例程式

### 1. 串口回顯 (serial_echo)
發送數據並讀取回顯。

```bash
sudo ./serial_echo [/dev/ttyUSB0]
```

### 2. 串口迴路測試 (serial_loopback)
測試串口迴路（TX連接到RX）。

```bash
sudo ./serial_loopback
```

## 使用前準備

1. 插入 USB 轉串口設備
2. 檢查設備節點：
```bash
ls -l /dev/ttyUSB*
```

3. 添加用戶權限：
```bash
sudo usermod -a -G dialout $USER
```

## 注意事項

- 預設鮑率: 115200
- 預設設備: /dev/ttyUSB0
- 需要 root 權限或 dialout 組成員

---

**最後更新**: 2025-11-17
