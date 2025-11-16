# 情感分析器 Sentiment Analyzer

使用 Hugging Face Transformers 進行情感分析的工具，支援多語言文本情感分類。

## 功能特點

- 🌍 支援多語言情感分析（英文、中文等）
- 🎯 使用 BERT 等預訓練模型
- 📊 輸出情感極性和置信度分數
- 🔌 提供 CLI 和 Python API 介面
- ⚡ 支援批量處理
- 📈 可視化分析結果

## 安裝

```bash
pip install -r requirements.txt
```

## 快速開始

### 命令行使用

```bash
# 分析單個文本
python src/main.py --text "This movie is amazing!"

# 從文件讀取並分析
python src/main.py --file data/reviews.txt

# 指定模型
python src/main.py --text "我很喜歡這個產品" --model "bert-base-chinese"

# 批量分析並保存結果
python src/main.py --file data/reviews.txt --output results.json
```

### Python API 使用

```python
from src.sentiment_analyzer import SentimentAnalyzer

# 初始化分析器
analyzer = SentimentAnalyzer()

# 分析單個文本
result = analyzer.analyze("This product is excellent!")
print(f"Sentiment: {result['label']}, Score: {result['score']:.4f}")

# 批量分析
texts = [
    "I love this!",
    "This is terrible.",
    "It's okay, nothing special."
]
results = analyzer.analyze_batch(texts)
for text, result in zip(texts, results):
    print(f"{text} -> {result['label']} ({result['score']:.2f})")
```

## 使用範例

查看 `examples/` 目錄獲取更多範例：
- `basic_usage.py` - 基本使用方法
- `batch_processing.py` - 批量處理文本
- `multilingual.py` - 多語言分析
- `api_server.py` - REST API 服務

## 支援的模型

- `distilbert-base-uncased-finetuned-sst-2-english` (預設，英文)
- `bert-base-chinese` (中文)
- `nlptown/bert-base-multilingual-uncased-sentiment` (多語言)
- 自定義模型路徑

## API 服務

啟動 FastAPI 服務：

```bash
python examples/api_server.py
```

訪問 http://localhost:8000/docs 查看 API 文檔

## 測試

```bash
pytest tests/
```

## 技術細節

- 使用 Hugging Face Transformers 庫
- 支援 PyTorch 和 TensorFlow 後端
- 自動處理文本預處理和 tokenization
- 支援 GPU 加速（如果可用）

## 應用場景

- 社交媒體情緒監測
- 產品評論分析
- 客戶反饋分類
- 市場情緒分析
- 品牌聲譽監控

## 性能優化

- 使用批量處理提高吞吐量
- 啟用 GPU 加速
- 使用 distilbert 等輕量級模型
- 實現模型緩存機制

## 限制

- 模型性能取決於訓練數據
- 可能對特定領域術語理解有限
- 諷刺和反語可能影響準確性
