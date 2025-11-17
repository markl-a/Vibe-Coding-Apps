# CLI Tools 使用示例

本目录包含了所有 CLI 工具的实际使用示例和测试文件。每个工具都有相应的示例场景，帮助您快速上手。

## 目录结构

```
examples/
├── README.md              # 本文件
├── sample.md              # Markdown 示例文件
├── test_files/            # File Organizer 测试文件
│   ├── image1.jpg
│   ├── photo.png
│   ├── document.pdf
│   ├── report.docx
│   ├── data.xlsx
│   ├── music.mp3
│   ├── video.mp4
│   ├── script.py
│   ├── app.js
│   ├── config.json
│   ├── archive.zip
│   ├── style.css
│   └── index.html
└── test_directory/        # File Tree 测试目录
    ├── README.md
    ├── .gitignore
    ├── src/
    │   ├── main.py
    │   ├── components/
    │   │   ├── header.py
    │   │   └── footer.py
    │   └── utils/
    │       └── helper.py
    ├── docs/
    │   └── guide.md
    ├── tests/
    │   └── test_main.py
    └── config/
        └── settings.json
```

---

## 1. filetree.py - 目录树生成器

### 功能描述
智能目录树生成器，可以以多种格式展示目录结构，支持彩色输出、深度限制、.gitignore 过滤等功能。

### 使用示例

#### 基本用法 - 显示测试目录树
```bash
cd /home/user/Vibe-Coding-Apps/tools-utilities/cli-tools
python filetree.py examples/test_directory
```

#### 限制显示深度
```bash
python filetree.py examples/test_directory --depth 2
```

#### 只显示目录
```bash
python filetree.py examples/test_directory --dirs-only
```

#### 显示文件大小
```bash
python filetree.py examples/test_directory --show-size
```

#### 显示隐藏文件
```bash
python filetree.py examples/test_directory --all
```

#### 输出为 JSON 格式
```bash
python filetree.py examples/test_directory --output json
```

#### 输出为 Markdown 格式
```bash
python filetree.py examples/test_directory --output markdown > tree.md
```

### 预期输出示例
```
test_directory/
├── .gitignore
├── README.md
├── config/
│   └── settings.json
├── docs/
│   └── guide.md
├── src/
│   ├── components/
│   │   ├── footer.py
│   │   └── header.py
│   ├── main.py
│   └── utils/
│       └── helper.py
└── tests/
    └── test_main.py
```

---

## 2. passgen.py - 密码生成器

### 功能描述
安全密码生成器，支持多种密码类型生成和密码强度评估。

### 使用示例

#### 生成默认密码（16字符随机密码）
```bash
cd /home/user/Vibe-Coding-Apps/tools-utilities/cli-tools
python passgen.py
```

#### 生成指定长度的密码
```bash
python passgen.py --length 32
```

#### 生成记忆短语（Passphrase）
```bash
python passgen.py --type passphrase
python passgen.py --type passphrase --words 5 --separator "_"
```

#### 生成 PIN 码
```bash
python passgen.py --type pin --length 6
python passgen.py --type pin --length 8
```

#### 生成字母数字密码（不含特殊符号）
```bash
python passgen.py --alphanumeric --length 20
```

#### 生成多个密码
```bash
python passgen.py --count 5
python passgen.py --type passphrase --count 3
```

#### 生成不含易混淆字符的密码
```bash
python passgen.py --exclude-ambiguous --length 16
```

#### 自定义密码规则
```bash
# 不使用大写字母
python passgen.py --no-uppercase

# 不使用数字
python passgen.py --no-digits

# 不使用特殊符号
python passgen.py --no-symbols
```

#### 检查密码强度
```bash
python passgen.py --check "MyPassword123"
python passgen.py --check "Tr0ub4dor&3"
```

#### 生成密码并显示强度
```bash
python passgen.py --show-strength
python passgen.py --length 20 --show-strength
```

### 预期输出示例

**默认随机密码：**
```
aB3#xK9$mP2&nQ5!
```

**记忆短语：**
```
Apple-Dragon-Mountain-Silver-42
```

**PIN 码：**
```
857392
```

**密码强度检查：**
```
密码: MyPassword123
长度: 13 字元
评级: 中等 (分数: 5/10)
熵值: 78.2 bits

特徵:
  ✓ 小寫字母
  ✓ 大寫字母
  ✓ 數字
  ✗ 特殊符號
```

---

## 3. markdown-preview - Markdown 预览工具

### 功能描述
在终端或浏览器中预览 Markdown 文件，支持生成 HTML 文件。

### 测试文件
- `examples/sample.md` - 包含各种 Markdown 语法的示例文档

### 使用示例

#### 在终端中预览
```bash
cd /home/user/Vibe-Coding-Apps/tools-utilities/cli-tools
python markdown-preview/markdown_preview.py examples/sample.md
```

#### 在浏览器中预览
```bash
python markdown-preview/markdown_preview.py examples/sample.md --browser
```

#### 指定端口预览
```bash
python markdown-preview/markdown_preview.py examples/sample.md --browser --port 8080
```

#### 导出为 HTML 文件
```bash
python markdown-preview/markdown_preview.py examples/sample.md --output preview.html
```

### 预期输出

**终端预览：**
```
============================================================
📝 预览: examples/sample.md
============================================================

============================================================
MARKDOWN PREVIEW 示例文档
============================================================

这是一个用于测试 markdown-preview 工具的示例文档。

------------------------------------------------------------
功能展示
------------------------------------------------------------
...
```

**浏览器预览：**
```
🌐 预览服务器已启动: http://localhost:8000
📝 在浏览器中打开...

按 Ctrl+C 停止服务器
```

---

## 4. file-organizer - 文件整理工具

### 功能描述
智能文件整理工具，可以根据文件类型或日期自动整理文件到对应的文件夹。

### 测试文件
`examples/test_files/` 目录包含了各种类型的测试文件：
- 图片文件：image1.jpg, photo.png
- 文档文件：document.pdf, report.docx
- 表格文件：data.xlsx
- 音频文件：music.mp3
- 视频文件：video.mp4
- 代码文件：script.py, app.js
- 配置文件：config.json
- 网页文件：index.html, style.css
- 压缩文件：archive.zip

### 使用示例

#### 模拟整理（不实际移动文件）
```bash
cd /home/user/Vibe-Coding-Apps/tools-utilities/cli-tools
python file-organizer/file_organizer.py examples/test_files --dry-run
```

#### 整理文件（按类型）
```bash
# 先备份 test_files 目录！
cp -r examples/test_files examples/test_files_backup

# 执行整理
python file-organizer/file_organizer.py examples/test_files --verbose
```

#### 按日期整理文件
```bash
python file-organizer/file_organizer.py examples/test_files --by-date --dry-run
```

#### 整理其他目录
```bash
python file-organizer/file_organizer.py ~/Downloads --dry-run
```

### 预期输出

**模拟模式输出：**
```
📁 开始整理目錄: examples/test_files
🔍 模擬模式 (不會實際移動文件)

找到 13 個文件

✅ [Images] image1.jpg -> Images/
✅ [Images] photo.png -> Images/
✅ [Documents] document.pdf -> Documents/
✅ [Documents] report.docx -> Documents/
✅ [Spreadsheets] data.xlsx -> Spreadsheets/
✅ [Audio] music.mp3 -> Audio/
✅ [Videos] video.mp4 -> Videos/
✅ [Code] script.py -> Code/
✅ [Code] app.js -> Code/
✅ [Data] config.json -> Data/
✅ [Web] index.html -> Web/
✅ [Web] style.css -> Web/
✅ [Archives] archive.zip -> Archives/

==================================================
📊 整理統計:
  ✅ 已移動: 13 個文件
  ⏭️  已跳過: 0 個文件
  ❌ 錯誤: 0 個文件
==================================================
```

**整理后的目录结构：**
```
test_files/
├── Archives/
│   └── archive.zip
├── Audio/
│   └── music.mp3
├── Code/
│   ├── app.js
│   └── script.py
├── Data/
│   └── config.json
├── Documents/
│   ├── document.pdf
│   └── report.docx
├── Images/
│   ├── image1.jpg
│   └── photo.png
├── Spreadsheets/
│   └── data.xlsx
├── Videos/
│   └── video.mp4
└── Web/
    ├── index.html
    └── style.css
```

---

## 5. todo-cli - 待办事项管理器

### 功能描述
命令行待办事项管理器，支持任务添加、完成、删除、标签、优先级等功能。

### 使用示例

#### 添加任务
```bash
cd /home/user/Vibe-Coding-Apps/tools-utilities/cli-tools
python todo-cli/todo.py add "完成项目文档"
python todo-cli/todo.py add "修复登录bug" --priority high --tags work,urgent
python todo-cli/todo.py add "学习Python" --priority medium --tags learning,personal
```

#### 列出所有待处理任务
```bash
python todo-cli/todo.py list
# 或者直接运行（默认命令）
python todo-cli/todo.py
```

#### 列出所有任务（包括已完成）
```bash
python todo-cli/todo.py list --all
```

#### 按标签过滤
```bash
python todo-cli/todo.py list --tag work
python todo-cli/todo.py list --tag urgent
```

#### 按优先级过滤
```bash
python todo-cli/todo.py list --priority high
python todo-cli/todo.py list --priority low
```

#### 完成任务
```bash
python todo-cli/todo.py done 1
python todo-cli/todo.py done 2
```

#### 取消完成状态
```bash
python todo-cli/todo.py undone 1
```

#### 编辑任务
```bash
python todo-cli/todo.py edit 1 --task "完成项目文档（更新版）"
python todo-cli/todo.py edit 2 --priority medium
python todo-cli/todo.py edit 3 --tags work,bug,critical
```

#### 删除任务
```bash
python todo-cli/todo.py delete 1
```

#### 清除所有已完成的任务
```bash
python todo-cli/todo.py clear
```

#### 使用自定义数据文件
```bash
python todo-cli/todo.py --file ./my-todos.json add "自定义任务"
python todo-cli/todo.py --file ./my-todos.json list
```

### 预期输出示例

**添加任务：**
```
✅ 已添加任務 #1: 完成项目文档
✅ 已添加任務 #2: 修复登录bug
✅ 已添加任務 #3: 学习Python
```

**列出任务：**
```
======================================================================
📋 待辦事項列表
======================================================================

⏳ #2 🔴 修复登录bug [#work, #urgent]
    (創建: 2025-01-15)

⏳ #3 🟡 学习Python [#learning, #personal]
    (創建: 2025-01-15)

⏳ #1 🟡 完成项目文档
    (創建: 2025-01-15)

======================================================================
📊 總計: 3 | ✅ 已完成: 0 | ⏳ 待處理: 3
======================================================================
```

**完成任务：**
```
✅ 任務 #1 已完成: 完成项目文档
```

**列出所有任务（包括已完成）：**
```
======================================================================
📋 待辦事項列表
======================================================================

⏳ #2 🔴 修复登录bug [#work, #urgent]
    (創建: 2025-01-15)

⏳ #3 🟡 学习Python [#learning, #personal]
    (創建: 2025-01-15)

✅ #1 🟡 完成项目文档
    (創建: 2025-01-15, 完成: 2025-01-15)

======================================================================
📊 總計: 3 | ✅ 已完成: 1 | ⏳ 待處理: 2
======================================================================
```

---

## 快速测试所有工具

您可以运行以下命令快速测试所有工具：

```bash
# 进入 CLI 工具目录
cd /home/user/Vibe-Coding-Apps/tools-utilities/cli-tools

# 1. 测试 filetree
echo "=== Testing filetree.py ==="
python filetree.py examples/test_directory --depth 2

# 2. 测试 passgen
echo -e "\n=== Testing passgen.py ==="
python passgen.py --count 3
python passgen.py --type passphrase

# 3. 测试 markdown-preview（终端模式）
echo -e "\n=== Testing markdown-preview ==="
python markdown-preview/markdown_preview.py examples/sample.md

# 4. 测试 file-organizer（模拟模式）
echo -e "\n=== Testing file-organizer ==="
python file-organizer/file_organizer.py examples/test_files --dry-run

# 5. 测试 todo-cli
echo -e "\n=== Testing todo-cli ==="
python todo-cli/todo.py add "测试任务" --priority high
python todo-cli/todo.py list
```

---

## 恢复测试文件

如果您在测试 file-organizer 后想要恢复原始的测试文件结构，可以执行：

```bash
# 删除整理后的目录
rm -rf examples/test_files

# 重新创建测试文件
# （需要重新运行创建脚本或从备份恢复）
```

---

## 提示与技巧

1. **filetree.py**
   - 使用 `--output json` 可以方便地与其他工具集成
   - 在大型项目中使用 `--depth` 限制深度避免输出过多

2. **passgen.py**
   - 使用 `--show-strength` 可以了解生成的密码强度
   - 记忆短语（passphrase）更容易记忆且安全性高

3. **markdown-preview**
   - 使用 `--browser` 模式可以获得最佳的预览效果
   - 导出的 HTML 文件可以直接在任何浏览器中打开

4. **file-organizer**
   - 始终先使用 `--dry-run` 模式查看将要进行的操作
   - 定期整理 Downloads 文件夹可以保持系统整洁

5. **todo-cli**
   - 使用标签和优先级可以更好地组织任务
   - 数据文件默认保存在 `~/.todo.json`

---

## 故障排除

### Python 版本
所有工具都需要 Python 3.6 或更高版本：
```bash
python --version  # 应该显示 Python 3.6+
```

### 依赖安装
某些工具可能需要额外的依赖：
```bash
# filetree.py 的彩色输出需要 colorama
pip install colorama

# markdown-preview 使用 CDN 加载 marked.js，无需本地安装
```

### 权限问题
如果遇到权限错误，确保：
```bash
chmod +x *.py
chmod +x markdown-preview/markdown_preview.py
chmod +x file-organizer/file_organizer.py
chmod +x todo-cli/todo.py
```

---

## 贡献

欢迎提交问题报告和改进建议！

---

**Happy Coding!** 🚀
