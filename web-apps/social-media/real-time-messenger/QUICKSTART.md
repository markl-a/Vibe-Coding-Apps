# 快速開始指南

這份指南將幫助您在 5 分鐘內啟動並運行 Real-Time Messenger。

## 步驟 1: 安裝客戶端依賴

```bash
# 在專案根目錄
npm install
```

## 步驟 2: 安裝伺服器依賴

```bash
cd server
npm install
cd ..
```

## 步驟 3: 設置環境變數

```bash
# 複製環境變數範例文件
cp .env.example .env
```

如果需要，您可以編輯 `.env` 文件來修改 Socket.io 伺服器地址。

## 步驟 4: 啟動伺服器

打開一個新的終端窗口：

```bash
cd server
npm run dev
```

您應該會看到：
```
🚀 Socket.io Server Started
📡 Listening on port: 3001
```

## 步驟 5: 啟動客戶端

打開另一個終端窗口，在專案根目錄運行：

```bash
npm run dev
```

## 步驟 6: 開始使用

1. 打開瀏覽器訪問 [http://localhost:3000](http://localhost:3000)
2. 輸入您的暱稱
3. 點擊「進入聊天室」
4. 選擇一個聊天室或創建新的聊天室
5. 開始聊天！

## 測試多用戶功能

要測試多用戶功能，請：

1. 在不同的瀏覽器或隱私模式窗口中打開應用
2. 使用不同的暱稱登入
3. 加入相同的聊天室
4. 嘗試即時聊天、打字指示器等功能

## 常見問題

### 無法連接到伺服器

確保：
- Socket.io 伺服器正在運行（在 `http://localhost:3001`）
- `.env` 文件中的 `NEXT_PUBLIC_SOCKET_URL` 設置正確
- 沒有其他應用佔用 3001 端口

### 端口被占用

如果 3000 或 3001 端口已被使用：

**更改客戶端端口**：
```bash
npm run dev -- -p 3002
```

**更改伺服器端口**：
```bash
cd server
PORT=3002 npm run dev
```

並更新 `.env` 文件中的 `NEXT_PUBLIC_SOCKET_URL`。

## 下一步

- 閱讀完整的 [README.md](./README.md) 了解更多功能
- 查看 [server/README.md](./server/README.md) 了解伺服器 API
- 自定義樣式和功能

## 需要幫助？

如果遇到問題，請檢查：
1. Node.js 版本是否 >= 18.0.0
2. 所有依賴是否正確安裝
3. 瀏覽器控制台是否有錯誤訊息
4. 伺服器終端是否有錯誤訊息

祝您使用愉快！
