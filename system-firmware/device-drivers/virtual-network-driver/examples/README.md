# 虛擬網卡驅動範例程式

本目錄包含虛擬網卡驅動的使用範例。

## 編譯

```bash
make
```

## 使用前準備

1. 載入虛擬網卡驅動
2. 配置網卡：

```bash
sudo ip link set vnet0 up
sudo ip addr add 192.168.100.1/24 dev vnet0
sudo ip link set vnet1 up
sudo ip addr add 192.168.100.2/24 dev vnet1
```

## 範例程式

### 1. 數據包發送 (packet_send)
發送 UDP 數據包到虛擬網卡。

```bash
./packet_send
```

### 2. 數據包接收 (packet_capture)
監聽並接收數據包。

```bash
./packet_capture
```

### 3. 連通性測試 (network_test)
測試虛擬網卡之間的連通性。

```bash
./network_test
```

## 測試場景

### 場景 1: 簡單通信測試

終端 1:
```bash
./packet_capture
```

終端 2:
```bash
./packet_send
```

### 場景 2: 使用 ping 測試

```bash
ping -I vnet0 192.168.100.2
```

### 場景 3: TCP 連接測試

終端 1:
```bash
nc -l -p 8888
```

終端 2:
```bash
echo "Hello" | nc 192.168.100.2 8888
```

## 注意事項

- 確保虛擬網卡驅動已載入
- 檢查網卡配置和路由
- 可能需要 root 權限

---

**最後更新**: 2025-11-17
