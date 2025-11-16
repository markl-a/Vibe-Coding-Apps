# 垃圾郵件分類器 Spam Classifier

使用機器學習技術進行垃圾郵件檢測和分類。

## 功能特點

- 🎯 高準確率垃圾郵件檢測
- 📊 支援多種機器學習算法
- 🔧 可訓練自定義數據集
- 📈 提供詳細的性能評估
- 💾 模型保存和載入
- 🔌 CLI 和 API 介面

## 支援的算法

- Naive Bayes (預設，快速且準確)
- Logistic Regression
- Random Forest
- Support Vector Machine (SVM)

## 安裝

```bash
pip install -r requirements.txt
```

## 快速開始

### 訓練模型

```bash
# 使用內建數據集訓練
python src/train.py

# 使用自定義數據集訓練
python src/train.py --data your_data.csv --model nb

# 指定模型保存路徑
python src/train.py --output models/my_model.pkl
```

### 預測

```bash
# 預測單個郵件
python src/main.py --text "Congratulations! You won $1000000!"

# 從文件讀取並預測
python src/main.py --file emails.txt

# 使用自定義模型
python src/main.py --text "Hello, this is a test" --model models/my_model.pkl
```

### Python API 使用

```python
from src.spam_classifier import SpamClassifier

# 載入或訓練模型
classifier = SpamClassifier()
classifier.train(X_train, y_train)

# 預測
text = "Get rich quick! Click here now!"
result = classifier.predict(text)
print(f"Is spam: {result['is_spam']}")
print(f"Confidence: {result['confidence']:.2%}")

# 批量預測
texts = ["Hello friend", "Win money now!", "Meeting at 3pm"]
results = classifier.predict_batch(texts)
```

## 資料格式

訓練數據應為 CSV 格式，包含兩列：
- `text`: 郵件內容
- `label`: 標籤 (spam/ham 或 1/0)

範例：
```csv
text,label
"Get rich quick!",spam
"Meeting tomorrow at 10am",ham
"You won a prize",spam
```

## 特徵工程

本專案使用以下特徵：
- TF-IDF 向量化
- N-gram (1-2)
- 文本長度
- 特殊字符統計
- 大寫字母比例

## 性能評估

訓練後會自動生成評估報告：
- 準確率 (Accuracy)
- 精確率 (Precision)
- 召回率 (Recall)
- F1 分數
- 混淆矩陣

## API 服務

啟動服務：

```bash
python examples/api_server.py
```

訪問 http://localhost:8000/docs

## 測試

```bash
pytest tests/
```

## 應用場景

- 電子郵件過濾
- 簡訊垃圾訊息檢測
- 評論區內容審核
- 社交媒體垃圾內容過濾

## 優化建議

- 使用更大的訓練數據集
- 調整特徵提取參數
- 嘗試不同的算法組合
- 實現集成學習

## 限制

- 需要足夠的訓練數據
- 對於新型垃圾郵件可能需要重新訓練
- 語言特定（需要為不同語言分別訓練）
