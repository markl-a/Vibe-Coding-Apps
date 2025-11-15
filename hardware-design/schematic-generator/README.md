# 📐 AI 原理圖生成器

> ⚠️ **驗證階段專案** - 此專案目前處於研究與開發階段

從自然語言描述自動生成電路原理圖的 AI 工具，整合大型語言模型 (LLM) 與 EDA 工具。

## 📋 專案目標

利用 AI 技術加速原理圖設計流程：
- 從需求描述生成電路
- 自動元件選擇和連接
- 輸出標準 EDA 格式
- 電路驗證和模擬

## 🎯 核心功能（規劃中）

### 1. 自然語言轉電路
```text
輸入: "設計一個 5V 轉 3.3V 的線性穩壓器，輸出電流 500mA"
輸出: 完整的 LDO 穩壓電路原理圖
```

### 2. 智能元件選擇
- 根據規格自動選擇元件
- 計算被動元件值
- 考慮成本和可用性

### 3. EDA 格式輸出
- KiCAD 原理圖 (.kicad_sch)
- SPICE 網表 (.cir)
- Altium Designer
- Eagle XML

### 4. 電路驗證
- 自動 SPICE 模擬
- 設計規則檢查
- 性能驗證

## 🛠️ 技術棧

- **語言**: Python 3.8+
- **LLM 整合**:
  - OpenAI API (GPT-4)
  - Anthropic Claude API
  - 本地模型 (Llama, Mistral)
- **EDA 工具**:
  - KiCAD Python API
  - SKiDL (電路描述語言)
  - PySpice (模擬)
- **框架**:
  - LangChain (LLM 工作流)
  - Pydantic (資料驗證)

## 🚀 快速開始（開發中）

### 安裝

```bash
pip install -r requirements.txt

# 設定 API Key
export OPENAI_API_KEY="your-api-key"
# 或
export ANTHROPIC_API_KEY="your-api-key"
```

### 基本使用

```python
from schematic_generator import SchematicAI

# 初始化生成器
gen = SchematicAI(model="gpt-4")

# 從描述生成電路
description = """
設計一個 Arduino 連接的溫度感測器電路:
- 使用 LM35 溫度感測器
- 輸出連接到 Arduino A0 (0-5V)
- 包含必要的濾波電路
- 指示 LED
"""

circuit = gen.generate(description)

# 查看生成的電路
print(circuit.netlist)
print(f"元件數量: {len(circuit.components)}")

# 輸出到 KiCAD
circuit.export_kicad("temp_sensor.kicad_sch")

# 模擬驗證
simulation = circuit.simulate()
print(f"輸出電壓範圍: {simulation.vout_min:.2f}V - {simulation.vout_max:.2f}V")
```

### 進階使用

```python
# 使用範本
gen.use_template("voltage_regulator")

# 客製化參數
circuit = gen.generate(
    description="5V to 3.3V regulator",
    constraints={
        "max_cost": 2.0,          # 最大成本 $2
        "output_current": 0.5,     # 500mA
        "efficiency": "> 0.8"      # 效率 > 80%
    }
)

# 多次生成並選擇最佳
candidates = gen.generate_multiple(description, n=5)
best = gen.select_best(candidates, criteria="lowest_cost")
```

## 🧠 AI 架構

### 工作流程

```
1. 需求解析 (LLM)
   ↓
2. 電路拓撲生成 (知識庫 + LLM)
   ↓
3. 元件選擇 (資料庫查詢 + ML)
   ↓
4. 參數計算 (物理公式 + 優化)
   ↓
5. 網表生成 (SKiDL)
   ↓
6. 驗證與模擬 (SPICE)
   ↓
7. EDA 格式輸出 (KiCAD API)
```

### Prompt Engineering

#### System Prompt 範例
```python
SYSTEM_PROMPT = """
你是一位專業的電子電路設計助手。你的任務是根據用戶描述生成電路設計。

輸出格式為 JSON:
{
  "circuit_type": "電路類型",
  "topology": "電路拓撲",
  "components": [
    {
      "type": "元件類型",
      "value": "元件值",
      "part_number": "料號",
      "connections": ["net1", "net2"]
    }
  ],
  "nets": ["net1", "net2", ...],
  "design_notes": "設計說明"
}

考慮因素:
1. 成本效益
2. 元件可用性
3. 性能指標
4. 設計穩健性
"""
```

#### Few-Shot Learning
```python
EXAMPLES = [
    {
        "input": "設計一個 LED 閃爍電路",
        "output": {
            "circuit_type": "astable_multivibrator",
            "components": [
                {"type": "resistor", "value": "1k", "ref": "R1"},
                {"type": "capacitor", "value": "10uF", "ref": "C1"},
                {"type": "led", "color": "red", "ref": "D1"}
            ]
        }
    }
]

# 使用範例增強提示
prompt = build_fewshot_prompt(EXAMPLES, user_request)
```

### 知識庫整合

```python
# 向量資料庫存儲電路範本
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings

# 載入電路範本知識庫
embeddings = OpenAIEmbeddings()
vectordb = Chroma.from_documents(
    documents=load_circuit_templates(),
    embedding=embeddings
)

# 檢索相關範本
def retrieve_templates(description):
    docs = vectordb.similarity_search(description, k=3)
    return [doc.metadata['circuit'] for doc in docs]
```

## 📁 專案結構（規劃）

```
schematic-generator/
├── README.md
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── generator.py          # 主生成器
│   ├── llm/
│   │   ├── openai_client.py  # OpenAI 整合
│   │   ├── claude_client.py  # Claude 整合
│   │   └── prompts.py        # Prompt 範本
│   ├── circuit/
│   │   ├── parser.py         # 需求解析
│   │   ├── builder.py        # 電路建構
│   │   └── validator.py      # 驗證器
│   ├── components/
│   │   ├── database.py       # 元件資料庫
│   │   └── selector.py       # 元件選擇器
│   ├── exporters/
│   │   ├── kicad.py          # KiCAD 輸出
│   │   ├── spice.py          # SPICE 輸出
│   │   └── altium.py         # Altium 輸出
│   └── simulator.py          # 模擬介面
├── templates/                # 電路範本庫
│   ├── power_supply/
│   ├── amplifiers/
│   ├── filters/
│   └── digital/
├── examples/
│   ├── basic_generation.py
│   ├── with_constraints.py
│   └── batch_processing.py
└── tests/
```

## 🔧 實作範例

### SKiDL 整合

```python
from skidl import *

def generate_ldo_circuit(vin, vout, iout):
    """使用 SKiDL 生成 LDO 電路"""

    # 選擇 LDO IC
    ldo = select_ldo(vin, vout, iout)

    # 建立電路
    vin_net = Net('VIN')
    vout_net = Net('VOUT')
    gnd = Net('GND')

    # LDO 連接
    u1 = Part('Regulator_Linear', ldo['part_number'], footprint=ldo['package'])
    u1['VIN'] += vin_net
    u1['VOUT'] += vout_net
    u1['GND'] += gnd

    # 輸入電容
    cin = Part('Device', 'C', value=ldo['cin_recommended'])
    cin[1] += vin_net
    cin[2] += gnd

    # 輸出電容
    cout = Part('Device', 'C', value=ldo['cout_recommended'])
    cout[1] += vout_net
    cout[2] += gnd

    # 生成網表
    generate_netlist()

    return {
        'schematic': default_circuit,
        'bom': get_bom(),
        'netlist': generate_netlist()
    }
```

### LLM 元件選擇

```python
def select_component_with_llm(requirements):
    """使用 LLM 選擇元件"""

    prompt = f"""
    根據以下需求選擇合適的電子元件:

    需求:
    {requirements}

    請從元件資料庫中選擇最合適的元件,並說明理由。

    元件資料庫:
    {load_component_database()}

    輸出 JSON 格式:
    {{
      "selected_part": "料號",
      "reason": "選擇理由",
      "alternatives": ["替代料號1", "替代料號2"]
    }}
    """

    response = llm.invoke(prompt)
    return json.loads(response.content)
```

## 🧪 開發路線圖

### Phase 1: MVP
- [ ] 基本 LLM 整合 (OpenAI/Claude)
- [ ] 簡單電路生成 (LED, 分壓器等)
- [ ] KiCAD 輸出
- [ ] 元件資料庫建立

### Phase 2: 進階功能
- [ ] 複雜電路範本 (電源、放大器)
- [ ] SPICE 模擬整合
- [ ] 元件參數優化
- [ ] 多種 EDA 格式支援

### Phase 3: 智能化
- [ ] 向量知識庫 (RAG)
- [ ] 多輪對話優化設計
- [ ] 自動除錯建議
- [ ] 學習用戶偏好

### Phase 4: 產品化
- [ ] Web 介面
- [ ] API 服務
- [ ] 協作功能
- [ ] 版本控制整合

## 📚 使用案例

### 案例 1: 電源設計

```python
gen = SchematicAI()

circuit = gen.generate("""
設計一個 USB-C PD 供電的筆記型電腦充電器:
- 輸入: USB-C PD 20V
- 輸出: 19V 3A 給筆電
- 需要過流、過溫保護
- LED 指示充電狀態
""")

circuit.export_kicad("usbc_charger.kicad_sch")
circuit.simulate()
```

### 案例 2: 感測器介面

```python
circuit = gen.generate("""
設計 I2C 溫濕度感測器電路:
- 使用 SHT31 感測器
- 連接到 Raspberry Pi
- 3.3V 供電
- 包含 I2C 上拉電阻
""")
```

### 案例 3: 批次生成

```python
# 生成多個變體
variants = gen.generate_variants(
    base_description="LED driver",
    parameters={
        'voltage': [5, 12, 24],
        'current': [20, 50, 100]  # mA
    }
)

for v in variants:
    v.export_kicad(f"led_driver_{v.voltage}v_{v.current}ma.kicad_sch")
```

## ⚠️ 限制與注意事項

1. **AI 局限性**:
   - LLM 可能產生不正確的電路
   - 需要人工審查和驗證
   - 複雜電路可能不準確

2. **元件資料**:
   - 需要維護最新元件庫
   - 料號可能過時或停產

3. **成本考量**:
   - API 調用會產生費用
   - 建議使用快取減少呼叫

4. **安全性**:
   - 不建議用於安全關鍵應用
   - 高壓電路需特別小心

## 📖 參考資源

### LLM 應用
- LangChain Documentation
- OpenAI API Guide
- Anthropic Claude API

### 電路設計
- SKiDL Documentation
- KiCAD Python API
- PySpice Tutorial

### 研究論文
- "Circuit Design with Large Language Models"
- "AI-Assisted Electronic Design Automation"

## 📄 授權

MIT License

---

**最後更新**: 2025-11-15
**狀態**: 🚧 概念階段
