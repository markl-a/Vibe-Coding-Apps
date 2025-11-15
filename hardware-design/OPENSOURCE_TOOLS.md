# 🛠️ 開源工具清單

> ⚠️ **重要聲明**
>
> 本文檔整理的工具和資訊均來自公開資源、官方網站、GitHub 儲存庫和學術論文。所有工具目前處於**驗證階段**，實際使用效果需要進一步測試和確認。
>
> **使用前請注意**：
> - ✅ 所有開源專案連結均已確認來自官方來源
> - ⚠️ 工具的實際效能和穩定性仍需用戶自行驗證
> - ⚠️ 商業工具僅供參考，本專案與這些廠商無關聯
> - ⚠️ AI 模型的準確性和可靠性需要在實際場景中測試
> - 📝 建議在非關鍵專案中先行測試
> - 🔒 請遵守各工具的授權條款和使用限制

這個文檔整理了可用於 AI 驅動硬體設計的開源工具和資源。

## 📋 目錄

- [EDA 設計工具](#eda-設計工具)
- [AI/ML PCB 專案](#aiml-pcb-專案)
- [自動化工具](#自動化工具)
- [模擬與分析](#模擬與分析)
- [實用程式庫](#實用程式庫)
- [商業工具參考](#商業工具參考)

---

## 🔧 EDA 設計工具

### KiCAD
- **描述**：功能完整的開源 PCB 設計套件
- **授權**：GPL v3+
- **語言**：C++, Python
- **官網**：https://www.kicad.org/
- **GitHub**：https://github.com/KiCad
- **特色**：
  - 完整的原理圖和 PCB 設計
  - Python 腳本 API (pcbnew)
  - 3D 視覺化
  - 活躍的社群和豐富的元件庫
  - 支援插件開發

**AI 整合可能性**：⭐⭐⭐⭐⭐
- Python API 可輕鬆整合 ML 模型
- 支援自動化腳本
- 可讀取/寫入標準格式

**安裝**：
```bash
# Ubuntu/Debian
sudo apt install kicad

# macOS
brew install kicad

# Windows
# 下載安裝器：https://www.kicad.org/download/
```

---

### FreeRouting
- **描述**：AI 輔助的自動走線工具
- **授權**：GPL v3
- **語言**：Java
- **GitHub**：https://github.com/freerouting/freerouting
- **特色**：
  - 自動走線演算法
  - 可獨立使用或整合 KiCAD/Eagle
  - 優化訊號路徑
  - 支援多層板

**AI 整合可能性**：⭐⭐⭐⭐
- 演算法優化訊號路徑
- 可整合到設計流程

**安裝**：
```bash
# 下載最新版本
wget https://github.com/freerouting/freerouting/releases/latest/download/freerouting.jar

# 執行
java -jar freerouting.jar
```

---

### OpenROAD
- **描述**：開源數位 IC 設計工具鏈
- **授權**：BSD 3-Clause
- **語言**：C++, Python
- **官網**：https://theopenroadproject.org/
- **GitHub**：https://github.com/The-OpenROAD-Project/OpenROAD
- **特色**：
  - 完整的 RTL-to-GDSII 流程
  - 包含模擬退火演算法的擺放器
  - 機器學習優化
  - 適用於 ASIC 設計

**AI 整合可能性**：⭐⭐⭐⭐
- 已內建 ML 優化
- 適合研究 IC 設計自動化

---

### EDA Playground
- **描述**：雲端 EDA 平台，支援多種開源工具
- **官網**：https://www.edaplayground.com/
- **特色**：
  - 線上開發環境
  - 支援 Verilog, VHDL, SystemVerilog
  - 整合模擬器
  - 適合學習和原型開發

**AI 整合可能性**：⭐⭐⭐
- 適合測試 AI 生成的 HDL 程式碼
- 雲端運行，無需本地安裝

---

## 🤖 AI/ML PCB 專案

### RL_PCB
- **描述**：使用強化學習優化 PCB 元件擺放
- **授權**：開源
- **語言**：Python
- **GitHub**：https://github.com/LukeVassallo/RL_PCB
- **論文**：RL_PCB: A Learning-based Method for PCB Component Placement
- **特色**：
  - 端到端強化學習方法
  - 靈感來自細胞自動機
  - 自動優化元件佈局
  - 減少設計時間

**技術棧**：
- Python
- Reinforcement Learning
- Gymnasium (OpenAI Gym)
- 深度學習框架

**使用方式**：
```bash
git clone https://github.com/LukeVassallo/RL_PCB.git
cd RL_PCB
pip install -r requirements.txt
python train.py
```

**AI 應用**：⭐⭐⭐⭐⭐
- 完整的 RL 實現
- 可作為研究基礎
- 適合擴展和客製化

---

### AnoPCB
- **描述**：基於機器學習的 PCB 佈局異常檢測
- **授權**：開源
- **語言**：Python
- **平台**：KiCAD 插件
- **論文**：Trash or Treasure? Machine-learning based PCB layout anomaly detection
- **特色**：
  - 自動識別設計異常
  - 訓練於正常佈局
  - KiCAD 整合
  - 提高設計品質

**技術棧**：
- Python
- scikit-learn
- 異常檢測演算法
- KiCAD Python API

**應用場景**：
- 設計審查自動化
- 品質控制
- 新手設計輔助
- 減少設計錯誤

**AI 應用**：⭐⭐⭐⭐⭐
- 實用的 ML 應用
- 易於整合到工作流程

---

### Cypress
- **描述**：VLSI 啟發的 GPU 加速 PCB 擺放工具
- **授權**：學術研究
- **語言**：C++, CUDA
- **論文**：Cypress: VLSI-Inspired PCB Placement with GPU Acceleration (ISPD 2025)
- **特色**：
  - GPU 加速計算
  - VLSI 技術應用於 PCB
  - 高效能優化
  - 開源基準測試套件

**技術棧**：
- C++
- CUDA
- GPU 計算
- 優化演算法

**基準測試**：
- 10 個合成設計
- 包含非關鍵元件
- 適合演算法比較

**AI 應用**：⭐⭐⭐⭐
- 高性能計算
- 適合大型設計

---

## 🔄 自動化工具

### ChatGPT/Claude 腳本生成
- **描述**：使用 LLM 生成 EDA 自動化腳本
- **支援平台**：
  - KiCAD (Python/Lua)
  - Altium Designer (Delphi/JavaScript)
  - Eagle (User Language Program)
- **應用**：
  - 元件擺放腳本
  - 走線策略
  - 批次處理
  - 輸出檔案生成

**範例提示詞**：
```
請生成一個 KiCAD Python 腳本，自動將所有 0603 電阻排列成一列，
間距 2mm，放置在 PCB 的左上角。
```

**使用方式**：
```python
# ChatGPT 生成的 KiCAD 腳本範例
import pcbnew

board = pcbnew.GetBoard()
resistors = [m for m in board.GetFootprints()
             if m.GetValue() == "0603" and "R" in m.GetReference()]

x, y = 10, 10  # 起始位置 (mm)
for r in resistors:
    r.SetPosition(pcbnew.wxPointMM(x, y))
    x += 2  # 間距 2mm

pcbnew.Refresh()
```

**AI 應用**：⭐⭐⭐⭐⭐
- 快速生成自動化腳本
- 減少重複性工作
- 適合各種 EDA 工具

---

### Python-based PCB Tools

#### pcbflow
- **GitHub**：https://github.com/michaelgale/pcbflow
- **描述**：使用 Python 程式化生成 PCB
- **特色**：
  - 程式碼生成 PCB 佈局
  - 參數化設計
  - 支援 KiCAD 輸出

**範例**：
```python
from pcbflow import *

pcb = PCB()
pcb.add_line(start=(0,0), end=(10,10), width=0.2)
pcb.save("output.kicad_pcb")
```

#### KiUtils
- **GitHub**：https://github.com/mvnmgrx/kiutils
- **描述**：KiCAD 檔案格式的 Python 解析器
- **特色**：
  - 讀取/寫入 KiCAD 檔案
  - 程式化修改設計
  - 批次處理

**AI 應用**：⭐⭐⭐⭐
- 便於 AI 模型操作 PCB 設計
- 支援自動化流程

---

## 🔬 模擬與分析

### ngspice
- **描述**：開源電路模擬器
- **授權**：BSD
- **語言**：C
- **官網**：http://ngspice.sourceforge.net/
- **特色**：
  - SPICE 相容
  - 類比/混合訊號模擬
  - 豐富的模型庫
  - Python 介面 (PySpice)

**AI 整合**：
- 可用於驗證 AI 生成的電路
- 自動化測試
- 性能預測

**安裝**：
```bash
# Ubuntu/Debian
sudo apt install ngspice

# macOS
brew install ngspice

# Python 介面
pip install PySpice
```

---

### Xyce
- **描述**：高性能 SPICE 模擬器
- **授權**：GPL
- **開發**：Sandia National Laboratories
- **官網**：https://xyce.sandia.gov/
- **特色**：
  - 平行計算支援
  - 大規模電路模擬
  - 豐富的設備模型

**AI 應用**：⭐⭐⭐
- 驗證複雜電路
- 性能優化

---

### PySpice
- **描述**：ngspice 的 Python 介面
- **授權**：GPL v3
- **GitHub**：https://github.com/FabriceSalvaire/PySpice
- **特色**：
  - Pythonic API
  - Jupyter Notebook 支援
  - 波形分析

**範例**：
```python
from PySpice.Spice.Netlist import Circuit
from PySpice.Unit import *

circuit = Circuit('RC Circuit')
circuit.V('input', 1, circuit.gnd, 5@u_V)
circuit.R(1, 1, 2, 1@u_kΩ)
circuit.C(1, 2, circuit.gnd, 1@u_µF)

simulator = circuit.simulator()
analysis = simulator.transient(step_time=1@u_µs, end_time=10@u_ms)
```

**AI 應用**：⭐⭐⭐⭐⭐
- 完美整合 AI 工作流程
- 自動化模擬和分析
- 支援機器學習模型訓練

---

## 📚 實用程式庫

### scikit-rf
- **描述**：RF 和微波工程工具
- **授權**：BSD
- **GitHub**：https://github.com/scikit-rf/scikit-rf
- **特色**：
  - S 參數分析
  - 傳輸線計算
  - 網路分析

**AI 應用**：⭐⭐⭐⭐
- RF 電路優化
- 阻抗匹配自動化

---

### lcapy
- **描述**：符號電路分析
- **授權**：LGPL
- **GitHub**：https://github.com/mph-/lcapy
- **特色**：
  - 符號數學
  - 電路方程求解
  - 拉普拉斯轉換

**AI 應用**：⭐⭐⭐
- 電路理論驗證
- 自動化分析

---

## 💼 商業工具參考

這些是領先的商業 AI PCB 工具，可作為開源專案的參考方向：

### Quilter
- **官網**：https://www.quilter.ai/
- **特色**：
  - 物理驅動的 AI
  - 數小時完成佈局
  - 支援主流 EDA 格式
- **技術**：強化學習、物理模擬

### Cadence Allegro X AI
- **官網**：https://www.cadence.com/
- **特色**：
  - 生成式 AI
  - 自動佈局和走線
  - 數天縮短至數分鐘
- **技術**：蒙特卡羅樹搜索、深度學習

### SnapMagic
- **官網**：https://www.snapmagic.com/
- **特色**：
  - AI Copilot 對話介面
  - 自動化原理圖生成
  - 元件搜尋和建議
- **技術**：LLM、知識圖譜

### Circuit Mind (ACE)
- **特色**：
  - 從需求生成完整電路
  - 自動元件選擇
  - BOM 優化
- **技術**：知識圖譜、優化演算法

### InstaDeep DeepPCB™
- **特色**：
  - 完全自動化
  - 雲端原生
  - 無需人工介入
- **技術**：深度學習、雲端計算

---

## 🎯 選擇工具指南

### 初學者
推薦工具：
1. **KiCAD** - 學習 PCB 設計
2. **FreeRouting** - 了解自動走線
3. **ChatGPT** - 生成簡單腳本
4. **ngspice/PySpice** - 電路模擬

### 中級開發者
推薦工具：
1. **KiCAD + Python API** - 自動化設計
2. **RL_PCB** - 學習 ML 應用
3. **AnoPCB** - 設計檢查
4. **pcbflow/KiUtils** - 程式化設計

### 進階研究
推薦工具：
1. **OpenROAD** - IC 設計自動化
2. **Cypress** - GPU 加速優化
3. **自訂 RL 模型** - 研究新演算法
4. **商業工具 API** - 產業級應用

---

## 📥 快速安裝腳本

### 基礎環境 (Ubuntu/Debian)
```bash
#!/bin/bash

# 更新套件列表
sudo apt update

# 安裝 KiCAD
sudo apt install -y kicad kicad-libraries

# 安裝 ngspice
sudo apt install -y ngspice

# 安裝 Python 開發工具
sudo apt install -y python3 python3-pip python3-venv

# 建立虛擬環境
python3 -m venv ~/pcb-ai-env
source ~/pcb-ai-env/bin/activate

# 安裝 Python 套件
pip install --upgrade pip
pip install numpy pandas matplotlib
pip install tensorflow torch
pip install PySpice
pip install scikit-learn stable-baselines3

echo "✅ 基礎環境安裝完成！"
```

### AI/ML 環境
```bash
#!/bin/bash

# 啟動虛擬環境
source ~/pcb-ai-env/bin/activate

# 深度學習框架
pip install tensorflow-gpu  # 如有 NVIDIA GPU
# 或
pip install tensorflow

pip install torch torchvision torchaudio

# 強化學習
pip install stable-baselines3[extra]
pip install gymnasium

# 資料處理與視覺化
pip install numpy pandas matplotlib seaborn plotly
pip install jupyter notebook

# PCB 工具
git clone https://github.com/LukeVassallo/RL_PCB.git
git clone https://github.com/michaelgale/pcbflow.git

echo "✅ AI/ML 環境安裝完成！"
```

---

## 🔗 更多資源

### 官方文檔
- [KiCAD Python Scripting](https://docs.kicad.org/doxygen-python/namespacepcbnew.html)
- [ngspice Manual](http://ngspice.sourceforge.net/docs/ngspice-manual.pdf)
- [OpenROAD Docs](https://openroad.readthedocs.io/)

### 社群
- [KiCAD Forums](https://forum.kicad.info/)
- [r/PrintedCircuitBoard](https://www.reddit.com/r/PrintedCircuitBoard/)
- [EEVblog Forums](https://www.eevblog.com/forum/)

### 論文與研究
- [arXiv - Electronics Design](https://arxiv.org/list/cs.AR/recent)
- [IEEE Xplore - EDA](https://ieeexplore.ieee.org/)
- [ACM Digital Library - Design Automation](https://dl.acm.org/)

---

**最後更新**：2025-11-15

**貢獻**：歡迎提交 PR 新增更多開源工具！
