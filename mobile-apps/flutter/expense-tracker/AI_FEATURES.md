# AI 功能使用指南

本文檔詳細說明如何使用 expense-tracker 中的 AI 智能功能。

## 🎯 智能分類建議

### 功能說明
AI 會根據交易描述自動推薦合適的類別，基於：
- 關鍵字匹配（餐廳、加油站、藥局等）
- 歷史交易記錄學習
- 語義分析

### 使用方法

```dart
import 'package:expense_tracker/providers/transaction_provider.dart';

// 在 Provider 中使用
final provider = context.read<TransactionProvider>();

// 輸入描述，獲取建議類別
String description = "全家便利商店買早餐";
String suggestedCategory = provider.suggestCategoryForTransaction(description);
// 返回: "food"
```

### 實際應用場景
1. **添加交易時自動填充**：用戶輸入描述後，自動選擇類別
2. **批量導入優化**：導入銀行對帳單時自動分類
3. **減少手動操作**：提升記帳效率

## 💡 財務健康分析

### 功能說明
AI 分析您的收支狀況，提供個性化建議：
- 儲蓄率評估
- 超支警告
- 支出結構分析
- 財務管理建議

### 使用方法

```dart
// 獲取本月的財務建議
final now = DateTime.now();
final start = DateTime(now.year, now.month, 1);
final end = DateTime(now.year, now.month + 1, 0);

List<String> advice = provider.getAIFinancialAdvice(
  start: start,
  end: end,
);

// 顯示建議
for (var tip in advice) {
  print(tip);
}
```

### 建議類型

#### 1. 儲蓄率分析
```
✅ 良好（≥30%）: "🎉 太棒了！儲蓄率達 35%，財務狀況良好！"
⚠️ 偏低（10-20%）: "💡 儲蓄率偏低（15%），建議提高到至少 20%"
🚨 警告（<0%）: "⚠️ 警告：支出超過收入！建議立即檢視並削減非必要開支"
```

#### 2. 預算執行監控
```
⚡ 接近上限: "⚡ 餐飲預算即將用完（已使用 92%），請注意控制"
🚨 已超支: "🚨 娛樂預算已超支 15%！建議減少該類別支出"
```

#### 3. 支出結構分析
```
📊 "餐飲佔總支出 45%，比例較高，可以考慮優化"
```

#### 4. 智能儲蓄建議
```
💰 "建議每月增加 $3,000 的儲蓄，達到 20% 儲蓄率"
```

## 🔮 支出預測

### 功能說明
基於過去 3 個月的數據，AI 預測下個月的預期支出，幫助您提前規劃。

### 算法原理
1. 計算最近 3 個月的月均支出
2. 分析支出趨勢（上升/下降）
3. 應用線性趨勢修正
4. 生成預測結果

### 使用方法

```dart
double prediction = provider.predictNextMonthExpense();

print('預測下月支出：\$$prediction');
```

### 實際應用
```dart
// 在 UI 中顯示預測和當前支出的對比
final currentMonthExpense = provider.getTotalExpense(
  start: DateTime(now.year, now.month, 1),
  end: DateTime(now.year, now.month + 1, 0),
);

final difference = prediction - currentMonthExpense;
final trend = difference > 0 ? '上升' : '下降';

print('與本月相比：$trend \$${difference.abs()}');
```

## 📊 智能預算建議

### 功能說明
基於 50/30/20 預算法則和您的消費習慣，AI 為您定制預算分配方案。

### 50/30/20 法則
- **50%** 必需品（食物、交通、住房、醫療）
- **30%** 想要的（娛樂、購物）
- **20%** 儲蓄

### 使用方法

```dart
// 輸入月收入
double monthlyIncome = 50000;

// 獲取 AI 預算建議
Map<String, double> suggestions = provider.getAIBudgetSuggestions(monthlyIncome);

// 顯示建議
suggestions.forEach((category, amount) {
  print('$category: \$$amount');
});
```

### 示例輸出
```
月收入：$50,000

=== AI 推薦預算分配 ===
食物：      $8,000  (16%)
交通：      $5,000  (10%)
住房：      $10,000 (20%)
醫療：      $2,000  (4%)
娛樂：      $7,500  (15%)
購物：      $7,500  (15%)
儲蓄：      $10,000 (20%)
```

### 自適應調整
AI 會根據您的歷史支出模式調整分配比例：
```dart
// 如果您過去 3 個月在餐飲上花費較多
// AI 會適當提高餐飲預算，同時保持整體平衡
```

## 🔍 異常檢測

### 功能說明
AI 自動監控交易記錄，識別異常的消費模式。

### 檢測項目

#### 1. 異常大額支出
```dart
// 檢測標準：超過平均值 + 2 倍標準差
List<String> anomalies = provider.detectAnomalies();
// 結果示例：
// "🔍 檢測到異常支出：$5,800 - 購買筆記型電腦"
```

#### 2. 頻繁小額支出
```dart
// 檢測標準：小額支出數量 > 總交易的 50%
// 結果示例：
// "⚠️ 檢測到大量小額支出，累計 $2,340，建議合併管理"
```

### 使用方法

```dart
List<String> anomalies = provider.detectAnomalies();

if (anomalies.isEmpty) {
  print('✅ 未檢測到異常支出');
} else {
  print('發現 ${anomalies.length} 個異常：');
  anomalies.forEach(print);
}
```

### 實際應用
- **自動警示**：定期運行檢測，提醒用戶注意
- **防詐騙**：及時發現可疑交易
- **預算控制**：識別衝動消費模式

## 📸 OCR 發票掃描

### 功能說明
拍攝發票照片，AI 自動識別並提取資訊（當前為模擬實現）。

### 使用方法

```dart
import 'package:expense_tracker/services/ocr_service.dart';

final ocrService = OCRService();

// 掃描發票
String imagePath = "/path/to/receipt.jpg";
ReceiptScanResult result = await ocrService.scanReceipt(imagePath);

print('商家：${result.merchantName}');
print('金額：\$${result.totalAmount}');
print('日期：${result.date}');
print('準確度：${(result.confidence * 100).toStringAsFixed(1)}%');

// 顯示項目明細
for (var item in result.items) {
  print('${item.name}: \$${item.price}');
}
```

### 智能類別建議
```dart
// AI 根據商家名稱自動建議類別
String category = ocrService.suggestCategory(result);
print('建議類別：$category');

// 智能生成描述
String description = ocrService.suggestDescription(result);
print('描述：$description');
```

### 驗證掃描結果
```dart
ReceiptValidationResult validation = ocrService.validateScanResult(result);

if (validation.isValid) {
  print('✅ 掃描結果有效');
} else {
  print('⚠️ 發現問題：');
  validation.issues.forEach(print);
}

if (validation.needsManualReview) {
  print('💡 建議人工確認');
}
```

### 批量掃描
```dart
List<String> imagePaths = [
  '/path/to/receipt1.jpg',
  '/path/to/receipt2.jpg',
  '/path/to/receipt3.jpg',
];

List<ReceiptScanResult> results = await ocrService.batchScanReceipts(imagePaths);

print('成功掃描 ${results.length} 張發票');
```

### 實際整合範例

```dart
// 完整的發票掃描到記帳流程
Future<void> scanAndAddTransaction(String imagePath) async {
  // 1. 掃描發票
  final ocrService = OCRService();
  final scanResult = await ocrService.scanReceipt(imagePath);

  // 2. 驗證結果
  final validation = ocrService.validateScanResult(scanResult);

  if (!validation.isValid) {
    // 顯示警告但繼續
    showWarnings(validation.issues);
  }

  // 3. 生成建議
  final category = ocrService.suggestCategory(scanResult);
  final description = ocrService.suggestDescription(scanResult);

  // 4. 創建交易記錄
  final transaction = Transaction(
    id: uuid.v4(),
    categoryId: category,
    type: 'expense',
    amount: scanResult.totalAmount,
    description: description,
    date: scanResult.date,
    notes: '發票掃描自動記帳',
  );

  // 5. 保存到資料庫
  await provider.addTransaction(transaction);

  print('✅ 發票已自動記帳');
}
```

## 🏷️ 智能標籤

### 功能說明
AI 自動為交易生成相關標籤，方便分類和搜索。

### 使用方法

```dart
String description = "網購衣服";
double amount = 1200;

List<String> tags = provider.suggestTags(description, amount);
// 返回: ['大額消費', '線上購物']
```

### 標籤類型

#### 金額相關
- 大額消費（>$1,000）
- 小額支出（<$100）

#### 內容相關
- 線上購物
- 現金交易
- 信用卡

#### 時間相關
- 週末消費

## 📤 數據導出功能

### 導出為 CSV

```dart
import 'package:expense_tracker/services/export_service.dart';

final exportService = ExportService();

// 導出所有交易為 CSV
String csvContent = await exportService.exportToCSV(
  transactions,
  categories,
);

// 保存文件
final fileName = exportService.generateFileName('csv');
final file = await exportService.saveToFile(csvContent, fileName);

print('已保存到：${file.path}');
```

### 導出為 JSON

```dart
String jsonContent = await exportService.exportToJSON(
  transactions,
  categories,
);

final file = await exportService.saveToFile(
  jsonContent,
  exportService.generateFileName('json'),
);
```

### 生成 HTML 報表

```dart
String htmlReport = await exportService.generateFinancialReport(
  transactions,
  categories,
  startDate: DateTime(2025, 1, 1),
  endDate: DateTime(2025, 1, 31),
);

final file = await exportService.saveToFile(
  htmlReport,
  exportService.generateFileName('html', prefix: '財務報表'),
);

// 可以在瀏覽器中打開查看精美的報表
```

### 導出統計摘要

```dart
String summary = await exportService.exportSummary(
  transactions,
  categories,
);

print(summary);
```

輸出示例：
```
=== 財務統計摘要 ===

總收入：$55,000.00
總支出：$42,300.00
結餘：$12,700.00

=== 支出類別統計 ===

餐飲: $12,500.00 (29.6%)
交通: $8,200.00 (19.4%)
購物: $7,800.00 (18.4%)
娛樂: $5,300.00 (12.5%)
其他: $8,500.00 (20.1%)
```

## 最佳實踐

### 1. 定期查看 AI 建議
```dart
// 建議每週檢查一次財務健康分析
void weeklyFinancialCheckup() {
  final advice = provider.getAIFinancialAdvice();
  showDialog(
    context: context,
    builder: (context) => AdviceDialog(advice: advice),
  );
}
```

### 2. 結合預測調整預算
```dart
// 在月初根據預測調整預算
void adjustBudgetBasedOnPrediction() {
  final prediction = provider.predictNextMonthExpense();
  final income = getUserMonthlyIncome();

  if (prediction > income * 0.8) {
    showAlert('預測支出較高，建議調整預算');
  }
}
```

### 3. 自動化異常檢測
```dart
// 每日檢測異常
void dailyAnomalyCheck() {
  final anomalies = provider.detectAnomalies();

  if (anomalies.isNotEmpty) {
    sendNotification('發現 ${anomalies.length} 個異常支出');
  }
}
```

## 常見問題

### Q: AI 分類準確度如何？
A: 準確度取決於歷史數據量。使用越久，AI 學習越多，準確度越高。

### Q: 預測會考慮哪些因素？
A: 主要考慮：
- 最近 3 個月的支出模式
- 支出趨勢（上升/下降）
- 季節性因素（未來版本）

### Q: OCR 支持哪些語言？
A: 當前模擬實現主要展示工作流程。實際應用需整合 OCR API（如 Google Cloud Vision）。

### Q: 如何提高 AI 建議的相關性？
A:
1. 保持記帳習慣，提供充足數據
2. 準確填寫交易描述
3. 定期檢視和更新預算設定

## 技術細節

### AI 服務架構
```
AIService (Singleton)
├── 智能分類 (suggestCategory)
├── 預算建議 (suggestBudget)
├── 支出預測 (predictNextMonthExpense)
├── 財務建議 (getFinancialAdvice)
├── 異常檢測 (detectAnomalies)
└── 標籤建議 (suggestTags)
```

### 性能優化
- 使用 Singleton 模式避免重複實例化
- 緩存計算結果
- 異步處理避免阻塞 UI

---

**享受 AI 驅動的智能記帳體驗！** 🚀
