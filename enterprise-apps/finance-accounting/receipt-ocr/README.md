# 發票 OCR 識別器 (Receipt OCR)

智能發票識別系統，使用 OCR 技術自動提取發票資訊。

## 功能特色

### 🔍 OCR 識別
- **自動識別**：上傳發票自動提取資訊
- **多語言支援**：支援繁體中文、英文等
- **高準確度**：使用 Tesseract OCR 引擎
- **批次處理**：一次處理多張發票

### 📝 資訊提取
自動提取以下資訊：
- 商家名稱
- 交易日期
- 總金額
- 稅額
- 項目明細

### 💾 資料管理
- **自動保存**：識別結果自動保存
- **手動編輯**：支援修正識別結果
- **歷史記錄**：查看所有已識別發票
- **圖片儲存**：保存原始發票圖片

### 📊 統計分析
- 發票總數統計
- 總金額計算
- 分類統計
- 匯出功能

## 安裝

### 系統需求

1. 安裝 Tesseract OCR

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr
sudo apt-get install tesseract-ocr-chi-tra  # 繁體中文
sudo apt-get install tesseract-ocr-eng      # 英文
```

**macOS:**
```bash
brew install tesseract
brew install tesseract-lang  # 所有語言包
```

**Windows:**
下載並安裝 [Tesseract Windows Installer](https://github.com/UB-Mannheim/tesseract/wiki)

2. 安裝 Python 依賴

```bash
pip install -r requirements.txt
```

## 使用方法

```bash
streamlit run app.py
```

## 核心功能

### 1. 單張識別

1. 上傳發票圖片（JPG、PNG、PDF）
2. 點擊「開始識別」
3. 系統自動提取資訊
4. 檢視並編輯結果
5. 保存到資料庫

### 2. 批次識別

1. 選擇多張發票圖片
2. 點擊「開始批次識別」
3. 系統逐一處理
4. 自動保存所有結果
5. 下載批次結果 CSV

### 3. 歷史記錄

- 查看所有已識別發票
- 按分類篩選
- 按日期篩選
- 統計總金額

## 使用案例

### 個人記帳
```
1. 消費後拍攝發票
2. 上傳到系統識別
3. 自動記錄支出
4. 月底統計分析
```

### 企業報銷
```
1. 員工上傳差旅發票
2. 系統自動提取資訊
3. 人工確認後歸檔
4. 匯出報銷單據
```

### 會計處理
```
1. 批次上傳發票
2. 自動分類歸檔
3. 生成會計憑證
4. 整合到財務系統
```

## 提高識別準確度的技巧

### 拍攝建議
- 使用高解析度相機
- 確保光線充足
- 發票平整無摺痕
- 對焦清晰
- 避免反光

### 圖片處理
- 裁剪掉多餘部分
- 調整對比度
- 轉換為灰度圖
- 適當放大

## OCR 引擎選項

### Tesseract (預設)
- 開源免費
- 支援多語言
- 準確度高
- 需要安裝

### 其他選項
- **EasyOCR**: 深度學習，更高準確度
- **PaddleOCR**: 中文識別優化
- **Google Cloud Vision**: 雲端 API，最高準確度

## 數據結構

### 發票記錄
```json
{
  "id": 1,
  "vendor": "商家名稱",
  "date": "2023-11-16",
  "total": 150.50,
  "tax": 7.50,
  "items": ["項目1", "項目2"],
  "category": "餐飲",
  "payment_method": "信用卡",
  "image_path": "database/receipt_images/...",
  "ocr_confidence": 0.85
}
```

## 技術架構

- **OCR 引擎**：Tesseract
- **圖片處理**：PIL, OpenCV
- **前端**：Streamlit
- **資料處理**：Pandas
- **資料儲存**：JSON

## 文件結構

```
receipt-ocr/
├── app.py                    # Streamlit 主應用
├── ocr_processor.py          # OCR 處理核心
├── database/
│   ├── db_handler.py        # 資料庫處理
│   ├── receipts.json        # 發票資料
│   └── receipt_images/      # 發票圖片
├── requirements.txt
└── README.md
```

## 擴展功能建議

- [ ] 支援更多 OCR 引擎
- [ ] AI 智能分類
- [ ] 自動匯入會計系統
- [ ] 雲端存儲整合
- [ ] 移動端 App
- [ ] 條碼/QR Code 掃描
- [ ] 發票驗證（政府 API）
- [ ] 多幣別識別
- [ ] 匯出格式自訂
- [ ] 發票去重

## 常見問題

**Q: 為什麼識別不準確？**
A: 確保圖片清晰、光線充足、文字清楚。可以嘗試預處理圖片。

**Q: 支援 PDF 發票嗎？**
A: 支援，系統會自動轉換 PDF 為圖片進行識別。

**Q: 如何提高識別速度？**
A: 可以降低圖片解析度，或使用批次處理模式。

**Q: 資料安全嗎？**
A: 資料儲存在本地，不會上傳到雲端。建議定期備份。

## 授權

MIT License

---

**開始智能識別發票！** 🧾🔍
