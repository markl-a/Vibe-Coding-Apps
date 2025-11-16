# 文本摘要工具 Text Summarizer

使用 Hugging Face Transformers 自動生成文本摘要，支援抽取式和生成式摘要。

## 功能特點

- 📝 支援抽取式和生成式摘要
- 🌐 多語言支援（英文、中文等）
- 📊 可調整摘要長度和比例
- 🎯 使用 BART/T5 等先進模型
- ⚡ 批量處理支援
- 🔌 提供 CLI 和 API 介面

## 安裝

```bash
pip install -r requirements.txt
```

## 快速開始

### 命令行使用

```bash
# 摘要單個文本
python src/main.py --text "Your long text here..."

# 從文件讀取
python src/main.py --file article.txt

# 指定摘要長度
python src/main.py --file article.txt --max-length 150 --min-length 50

# 使用不同模型
python src/main.py --file article.txt --model "facebook/bart-large-cnn"

# 保存結果
python src/main.py --file article.txt --output summary.txt
```

### Python API 使用

```python
from src.text_summarizer import TextSummarizer

# 初始化摘要器
summarizer = TextSummarizer()

# 生成摘要
text = """
Your long article or document text here...
This can be multiple paragraphs...
"""

summary = summarizer.summarize(text)
print(summary)

# 自定義參數
summary = summarizer.summarize(
    text,
    max_length=150,
    min_length=50,
    do_sample=False
)
print(summary)

# 批量摘要
texts = ["Article 1...", "Article 2...", "Article 3..."]
summaries = summarizer.summarize_batch(texts)
```

## 使用範例

查看 `examples/` 目錄：
- `basic_usage.py` - 基本使用
- `news_summarizer.py` - 新聞摘要
- `document_summarizer.py` - 長文檔摘要
- `api_server.py` - REST API 服務

## 支援的模型

### 英文摘要
- `facebook/bart-large-cnn` (預設，高品質)
- `t5-base`
- `google/pegasus-xsum`

### 多語言
- `facebook/mbart-large-50`
- `csebuetnlp/mT5_multilingual_XLSum`

## API 服務

啟動服務：

```bash
python examples/api_server.py
```

訪問 http://localhost:8000/docs

## 摘要類型

### 抽取式摘要
從原文中選擇重要句子組成摘要

### 生成式摘要
使用 AI 生成新的摘要文本（本工具使用此方法）

## 應用場景

- 新聞文章摘要
- 研究論文摘要
- 會議記錄總結
- 長文檔快速閱讀
- 郵件內容摘要
- 客戶反饋總結

## 參數說明

- `max_length`: 摘要最大長度（token 數）
- `min_length`: 摘要最小長度
- `length_penalty`: 長度懲罰係數
- `num_beams`: Beam search 數量
- `do_sample`: 是否使用採樣

## 性能優化

- 使用 GPU 加速
- 批量處理多個文本
- 選擇適合的模型大小
- 調整生成參數

## 測試

```bash
pytest tests/
```

## 限制

- 極長文本可能需要分段處理
- 摘要品質取決於原文品質
- 某些專業領域可能需要微調模型
