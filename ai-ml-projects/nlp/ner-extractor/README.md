# 命名實體識別器 NER Extractor

使用 Transformers 和 spaCy 進行命名實體識別，提取文本中的人名、地名、組織等實體。

## 功能特點

- 🎯 識別多種實體類型（人名、地名、組織、日期等）
- 🌐 支援多語言
- 🎨 可視化實體標註
- 📊 實體統計分析
- ⚡ 批量處理
- 🔌 CLI 和 API 介面

## 支援的實體類型

- PERSON - 人名
- ORG - 組織機構
- GPE - 地緣政治實體（國家、城市等）
- LOC - 地點
- DATE - 日期
- TIME - 時間
- MONEY - 金額
- PERCENT - 百分比
- PRODUCT - 產品
- EVENT - 事件

## 安裝

```bash
pip install -r requirements.txt

# 下載 spaCy 模型
python -m spacy download en_core_web_sm
```

## 快速開始

### 命令行使用

```bash
# 提取實體
python src/main.py --text "Apple Inc. was founded by Steve Jobs in Cupertino."

# 從文件讀取
python src/main.py --file document.txt

# 使用不同模型
python src/main.py --text "..." --model spacy

# 可視化輸出
python src/main.py --file doc.txt --visualize

# 保存結果
python src/main.py --file doc.txt --output entities.json
```

### Python API 使用

```python
from src.ner_extractor import NERExtractor

# 初始化
extractor = NERExtractor(model_type='transformers')

# 提取實體
text = "Barack Obama was born in Hawaii and became President in 2009."
entities = extractor.extract(text)

for entity in entities:
    print(f"{entity['text']} ({entity['label']})")

# 批量處理
texts = ["Text 1...", "Text 2..."]
results = extractor.extract_batch(texts)

# 可視化
html = extractor.visualize(text)
```

## 使用範例

查看 `examples/` 目錄：
- `basic_usage.py` - 基本使用
- `entity_analysis.py` - 實體分析
- `visualization.py` - 可視化展示
- `api_server.py` - REST API 服務

## 模型選擇

### spaCy (預設)
- 快速高效
- 支援多語言
- 模型較小

### Transformers
- 更高準確率
- 基於 BERT
- 模型較大

## API 服務

```bash
python examples/api_server.py
```

訪問 http://localhost:8000/docs

## 應用場景

- 資訊抽取
- 知識圖譜構建
- 文檔自動標註
- 搜索引擎優化
- 內容分類
- 資料探勘

## 統計分析

```python
# 獲取實體統計
stats = extractor.get_entity_stats(text)
print(stats)
# {'PERSON': 2, 'ORG': 1, 'GPE': 1}
```

## 可視化

生成帶有實體高亮的 HTML：

```python
html = extractor.visualize(text)
with open('entities.html', 'w') as f:
    f.write(html)
```

## 測試

```bash
pytest tests/
```

## 性能優化

- 使用 spaCy 處理大量文本
- 批量處理提高吞吐量
- GPU 加速（Transformers）

## 限制

- 準確率取決於模型訓練數據
- 某些專業領域可能需要自定義訓練
- 多語言混合文本可能影響準確率
