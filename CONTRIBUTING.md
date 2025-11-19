# Contributing to Vibe-Coding-Apps

感謝您考慮為 Vibe-Coding-Apps 做出貢獻！我們歡迎所有形式的貢獻，包括但不限於：

- 🐛 Bug 報告
- 💡 新功能建議
- 📖 文檔改進
- 🔧 代碼貢獻
- ✨ 新項目添加

## 📋 目錄

- [開發環境設置](#開發環境設置)
- [項目結構](#項目結構)
- [開發工作流程](#開發工作流程)
- [提交規範](#提交規範)
- [Pull Request 流程](#pull-request-流程)
- [代碼規範](#代碼規範)
- [測試要求](#測試要求)

## 🚀 開發環境設置

### 前置要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **Python**: >= 3.8 (for Python projects)
- **Git**: >= 2.30

### 安裝步驟

1. **Fork 並 Clone 倉庫**

```bash
git clone https://github.com/YOUR_USERNAME/Vibe-Coding-Apps.git
cd Vibe-Coding-Apps
```

2. **安裝依賴**

```bash
# 安裝 pnpm (如果還沒安裝)
npm install -g pnpm

# 安裝項目依賴
pnpm install

# 安裝 Python 依賴 (如果需要)
pip install -r requirements.txt
```

3. **設置 Git Hooks**

```bash
pnpm prepare
```

4. **驗證安裝**

```bash
# 運行測試
pnpm test

# 運行 linter
pnpm lint

# 檢查格式
pnpm format:check
```

## 📁 項目結構

```
Vibe-Coding-Apps/
├── ai-ml-projects/          # AI/ML 相關項目
├── apis-backend/            # API 和後端服務
├── blockchain-apps/         # 區塊鏈應用
├── browser-extensions/      # 瀏覽器擴展
├── desktop-apps/           # 桌面應用
├── enterprise-apps/        # 企業級應用
├── games/                  # 遊戲項目
├── mobile-apps/            # 移動應用
├── multimedia-apps/        # 多媒體應用
├── system-firmware/        # 系統韌體
├── tools-utilities/        # 工具和實用程序
├── web-apps/               # Web 應用
├── packages/               # 共享包
├── .github/                # GitHub 配置
└── docs/                   # 文檔
```

## 🔄 開發工作流程

### 1. 創建功能分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/bug-description
```

### 2. 開發並測試

```bash
# 運行開發服務器
pnpm dev

# 運行測試
pnpm test

# 運行 linter
pnpm lint
```

### 3. 提交更改

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 規範：

```bash
git add .
git commit -m "feat(scope): add new feature"
```

### 4. 推送並創建 Pull Request

```bash
git push origin feature/your-feature-name
```

然後在 GitHub 上創建 Pull Request。

## 📝 提交規範

我們使用 **Conventional Commits** 規範：

### 提交類型

- `feat`: 新功能
- `fix`: Bug 修復
- `docs`: 文檔更新
- `style`: 代碼格式（不影響代碼運行）
- `refactor`: 重構（既不是新功能也不是 Bug 修復）
- `perf`: 性能優化
- `test`: 測試相關
- `build`: 構建系統或外部依賴
- `ci`: CI/CD 配置
- `chore`: 其他不修改 src 或測試文件的更改
- `revert`: 回退之前的提交

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 示例

```bash
feat(auth): add OAuth2 login support

- Implement OAuth2 authentication flow
- Add Google and GitHub providers
- Update login UI

Closes #123
```

## 🔍 Pull Request 流程

### 創建 PR 前的檢查清單

- [ ] 代碼遵循項目的代碼規範
- [ ] 已運行並通過所有測試
- [ ] 已添加新功能的測試
- [ ] 已更新相關文檔
- [ ] 提交消息遵循規範
- [ ] 已解決所有 merge conflicts
- [ ] CI 檢查全部通過

### PR 標題格式

```
<type>(<scope>): <description>
```

### PR 描述模板

```markdown
## 📋 變更摘要

簡要描述這個 PR 的目的...

## 🎯 相關 Issue

Closes #issue_number

## 🧪 測試計劃

- [ ] 單元測試
- [ ] 集成測試
- [ ] 手動測試

## 📸 截圖/演示

(如果適用)

## ✅ 檢查清單

- [ ] 代碼遵循項目規範
- [ ] 測試已通過
- [ ] 文檔已更新
- [ ] 無 breaking changes
```

## 💻 代碼規範

### JavaScript/TypeScript

- 使用 **ESLint** 和 **Prettier** 進行代碼格式化
- 遵循 **Airbnb JavaScript Style Guide**
- 使用 **TypeScript** 進行類型安全

```typescript
// ✅ Good
const getUserName = (user: User): string => {
  return user.name;
};

// ❌ Bad
function getUserName(user) {
  return user.name;
}
```

### Python

- 使用 **Black** 進行代碼格式化
- 使用 **Ruff** 進行 linting
- 遵循 **PEP 8** 規範
- 使用類型提示

```python
# ✅ Good
def get_user_name(user: User) -> str:
    """Get the user's name."""
    return user.name

# ❌ Bad
def getUserName(user):
    return user.name
```

### 命名規範

- **變量和函數**: `camelCase` (JS/TS) / `snake_case` (Python)
- **類**: `PascalCase`
- **常量**: `UPPER_SNAKE_CASE`
- **私有成員**: 前綴 `_`

## 🧪 測試要求

### 測試覆蓋率目標

- **最低要求**: 60%
- **推薦目標**: 80%+
- **關鍵功能**: 90%+

### 測試類型

1. **單元測試**: 測試單個函數/組件
2. **集成測試**: 測試模塊間交互
3. **E2E 測試**: 測試完整用戶流程

### 運行測試

```bash
# 運行所有測試
pnpm test

# 運行特定項目的測試
pnpm test --filter=project-name

# 運行測試並生成覆蓋率報告
pnpm test -- --coverage

# 監視模式
pnpm test:watch
```

## 🐛 Bug 報告

使用 GitHub Issues 報告 Bug，請包含：

- **描述**: 清楚簡潔的 Bug 描述
- **重現步驟**: 如何重現這個問題
- **預期行為**: 應該發生什麼
- **實際行為**: 實際發生了什麼
- **環境**: OS、瀏覽器、Node 版本等
- **截圖**: 如果適用

## 💡 功能建議

使用 GitHub Issues 提出新功能建議，請包含：

- **問題**: 這個功能解決什麼問題？
- **解決方案**: 你建議的解決方案
- **替代方案**: 你考慮過的其他方案
- **額外上下文**: 任何其他相關信息

## 🌟 添加新項目

如果你想添加一個全新的項目到 Vibe-Coding-Apps：

1. 選擇合適的類別目錄
2. 遵循該類別的結構模式
3. 包含完整的 README.md
4. 添加測試
5. 更新根目錄的文檔

### 新項目檢查清單

- [ ] 項目符合 Vibe-Coding-Apps 的定位（AI-Driven/AI-Native）
- [ ] 包含完整的 README.md
- [ ] 包含 package.json 或等效配置文件
- [ ] 包含測試
- [ ] 包含必要的文檔
- [ ] 遵循代碼規範
- [ ] 通過 CI 檢查

## 📞 聯繫方式

如有任何問題，請：

- 創建 GitHub Issue
- 發送郵件至項目維護者
- 參與 GitHub Discussions

## 📄 許可證

通過貢獻，你同意你的貢獻將在與項目相同的許可證下授權。

---

再次感謝你的貢獻！🎉

**Happy Coding!** 💻✨
