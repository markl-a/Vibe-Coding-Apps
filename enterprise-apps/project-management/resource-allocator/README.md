# 資源分配系統 (Resource Allocator)

智能資源分配系統，優化人力資源配置，提高團隊效率。

## 功能特點

- 👥 人力資源管理
- 📅 資源日曆和可用性
- 🎯 智能資源分配建議
- ⚖️ 工作負載平衡
- 📊 資源利用率分析
- 🔍 技能匹配
- ⏱️ 時間追蹤
- 📈 容量規劃

## 快速開始

```bash
pip install -r requirements.txt
python src/main.py
```

## 主要功能

### 1. 資源池管理
- 人員信息管理
- 技能標籤
- 可用性設置

### 2. 智能分配
- 基於技能匹配
- 工作負載優化
- 衝突檢測

### 3. 分析報表
- 利用率統計
- 容量預測
- 瓶頸分析

## 使用示例

```python
from resource_allocator import ResourceAllocator, Resource, Project

allocator = ResourceAllocator()

# 添加資源
allocator.add_resource("張三", skills=["Python", "Django"], capacity=40)
allocator.add_resource("李四", skills=["React", "TypeScript"], capacity=40)

# 創建專案需求
project = Project("電商平台", required_skills=["Python", "React"])

# 智能分配
allocation = allocator.allocate_resources(project)
```

## 技術棧

- Python 3.8+
- Pandas
- NumPy
- Streamlit

## 授權

MIT License
