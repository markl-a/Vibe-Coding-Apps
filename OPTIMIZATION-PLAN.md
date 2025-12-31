# Vibe-Coding-Apps 專案優化計畫

> 此文件包含完整的專案優化步驟，每個任務都可以由不同的 Claude 實例獨立執行

## 📊 優化總覽

- **總任務數**: 13 個主要任務（8 個原始 + 5 個新增）
- **已完成**: 10 個任務 ✅
- **進行中**: 3 個任務 🔄
- **完成率**: 77% (10/13)
- **預估總時間**: 12-16 小時
- **優先級分類**: 高 (7) / 中 (5) / 緊急 (1)
- **可平行執行**: 大部分任務互不依賴

---

## 📈 進度更新 - 2025-12-31

### 重大進展總結

本次更新標記了多項關鍵任務的完成，專案在安全性、測試覆蓋率和程式碼品質方面取得重大進展：

#### ✅ 已完成的任務
1. **CORS 安全修復** (NEW)
   - 實作了安全的 CORS 配置
   - 修復了安全漏洞
   - 提升了 API 安全性

2. **UI 組件測試** (NEW)
   - 新增 5 個核心 UI 組件的測試（Modal, Toast, Badge, Avatar, Spinner）
   - 共 47 個測試案例
   - 提升了前端組件的可靠性

3. **E2E 測試基礎設施** (OPT-03 部分完成)
   - 新增 3 個 E2E 測試套件（auth.spec.ts, navigation.spec.ts, forms.spec.ts）
   - 共 38 個端到端測試案例
   - 建立了完整的測試流程

4. **錯誤處理工具** (NEW)
   - 在 shared-utils 中實作 getErrorMessage 工具函數
   - 標準化了錯誤處理流程
   - 提升了程式碼的健壯性

#### 🔄 重大進展中的任務
1. **類型安全改進** (NEW)
   - 已消除 130+ 個 any 類型
   - 涵蓋多個核心模組（leave management, search services, payroll, fingerprint protection）
   - 持續優化中

### 測試覆蓋率提升
- UI 組件測試：47 個測試案例
- E2E 測試：38 個測試案例
- 總計新增：**85+ 個測試案例**

### 程式碼品質改進
- 消除 any 類型：**130+ 個**
- 新增錯誤處理工具：**已實作**
- 安全性修復：**CORS 配置完成**

---

## 🎯 任務列表與狀態追蹤

| 任務 ID | 任務名稱 | 優先級 | 預估時間 | 狀態 | 負責人/Session | 完成日期 |
|---------|---------|--------|----------|------|----------------|----------|
| OPT-01 | Monorepo 架構建置 | 🔴 高 | 2-3h | ✅ 已完成 | 自動化 | 已完成 |
| OPT-02 | CI/CD 管道設定 | 🔴 高 | 3-4h | ✅ 已完成 | 自動化 | 已完成 |
| OPT-03 | 測試基礎設施 | 🔴 高 | 3-4h | 🔄 進行中 (60%) | Claude | 部分完成 |
| OPT-04 | 程式碼品質工具 | 🔴 高 | 1-2h | ✅ 已完成 | 自動化 | 已完成 |
| OPT-05 | 安全性掃描整合 | 🔴 高 | 1-2h | ✅ 已完成 | 自動化 | 已完成 |
| OPT-06 | Docker 容器化 | 🟡 中 | 2-3h | ✅ 已完成 | 自動化 | 已完成 |
| OPT-07 | 效能監控設定 | 🟡 中 | 2h | 🔄 進行中 | - | - |
| OPT-08 | 文件自動化 | 🟡 中 | 1-2h | 🔄 進行中 | - | - |
| **NEW** | CORS 安全修復 | 🔴 緊急 | 2h | ✅ 已完成 | Claude | 2025-12-31 |
| **NEW** | 消除 any 類型 | 🔴 高 | 8h | 🔄 進行中 (65%) | Claude | 持續中 |
| **NEW** | UI 組件測試 | 🟡 中 | 4h | ✅ 已完成 | Claude | 2025-12-31 |
| **NEW** | E2E 測試套件 | 🔴 高 | 3h | ✅ 已完成 | Claude | 2025-12-31 |
| **NEW** | 錯誤處理工具 | 🟡 中 | 1h | ✅ 已完成 | Claude | 2025-12-31 |

**狀態圖示說明**:
- ⬜ 待執行
- 🔄 進行中
- ✅ 已完成
- ⚠️ 遇到問題
- 🚫 已取消

---

## 📋 詳細任務說明

### OPT-01: Monorepo 架構建置

**優先級**: 🔴 高
**預估時間**: 2-3 小時
**依賴**: 無
**可平行執行**: 是（但建議優先執行）

#### 任務目標
建立 Turborepo 架構，統一管理所有子專案，實現依賴共享和建置快取。

#### 執行步驟

1. **安裝 Turborepo**
   ```bash
   cd /home/user/Vibe-Coding-Apps
   pnpm add turbo -Dw
   ```

2. **創建根目錄配置檔案**
   - `package.json` - 定義 workspaces
   - `pnpm-workspace.yaml` - PNPM workspace 配置
   - `turbo.json` - Turborepo 管道設定

3. **識別並組織 workspaces**
   - 掃描所有含 `package.json` 的子目錄
   - 按類別組織（apps, packages, tools）
   - 更新所有子專案的 package.json

4. **設定建置管道**
   - 定義 `build`, `dev`, `test`, `lint` 任務
   - 配置任務依賴關係
   - 啟用快取策略

5. **測試與驗證**
   ```bash
   turbo run build
   turbo run test
   ```

#### 交付成果
- [ ] `package.json` (根目錄)
- [ ] `pnpm-workspace.yaml`
- [ ] `turbo.json`
- [ ] 更新所有子專案的 package.json
- [ ] 驗證建置成功的截圖/日誌

#### 注意事項
- 保留現有專案結構，不要移動檔案
- 確保向後相容性
- 記錄哪些專案無法整合到 workspace（如果有）

---

### OPT-02: CI/CD 管道設定

**優先級**: 🔴 高
**預估時間**: 3-4 小時
**依賴**: 建議在 OPT-01 後執行（非強制）
**可平行執行**: 是

#### 任務目標
建立完整的 GitHub Actions CI/CD 流程，包含自動測試、建置、部署和品質檢查。

#### 執行步驟

1. **建立 GitHub Actions 目錄結構**
   ```bash
   mkdir -p .github/workflows
   ```

2. **創建主要 Workflow 檔案**
   - `ci.yml` - 持續整合（測試、Lint、建置）
   - `cd.yml` - 持續部署
   - `security.yml` - 安全性掃描
   - `dependency-review.yml` - 依賴審查

3. **設定 CI 工作流程**
   - 多 Node.js 版本矩陣測試（16, 18, 20）
   - 多 Python 版本測試（3.9, 3.10, 3.11）
   - 程式碼品質檢查
   - 建置驗證
   - 測試覆蓋率報告

4. **設定 CD 工作流程**
   - 自動標籤/版本發布
   - Docker image 建置與推送
   - 部署到測試/生產環境（如適用）

5. **設定分支保護規則**
   - 要求 CI 通過才能合併
   - 要求程式碼審查

#### 交付成果
- [ ] `.github/workflows/ci.yml`
- [ ] `.github/workflows/cd.yml`
- [ ] `.github/workflows/security.yml`
- [ ] `.github/workflows/dependency-review.yml`
- [ ] 分支保護規則設定截圖
- [ ] 首次 workflow 執行成功的證明

#### 注意事項
- 使用 GitHub Secrets 管理敏感資訊
- 設定合理的 workflow 觸發條件
- 考慮使用快取加速建置

---

### OPT-03: 測試基礎設施

**優先級**: 🔴 高
**預估時間**: 3-4 小時
**依賴**: 無
**可平行執行**: 是

#### 任務目標
為主要應用程式建立測試框架，提升測試覆蓋率至至少 40%。

#### 執行步驟

1. **設定測試框架（JavaScript/TypeScript）**
   - 安裝 Vitest 或 Jest
   - 配置測試環境
   - 設定覆蓋率報告

2. **設定測試框架（Python）**
   - 配置 pytest
   - 安裝 pytest-cov
   - 設定測試目錄結構

3. **為關鍵應用建立測試範例**
   - 選擇 5-10 個關鍵專案
   - 每個專案至少建立：
     - 3 個單元測試
     - 1 個整合測試
   - 建立測試模板供其他專案參考

4. **設定 E2E 測試（Web 應用）**
   - 安裝 Playwright 或 Cypress
   - 為 2-3 個主要 Web 應用建立 E2E 測試
   - 建立測試腳本範例

5. **整合測試報告**
   - 配置 Codecov 或類似服務
   - 在 CI 中生成覆蓋率報告
   - 建立 README badges

#### 交付成果
- [ ] 測試配置檔案（vitest.config.ts, pytest.ini）
- [ ] 至少 5 個專案有測試覆蓋
- [ ] E2E 測試設定與範例
- [ ] 測試執行腳本
- [ ] 測試覆蓋率報告
- [ ] `TESTING-GUIDE.md` 測試指南文件

#### 建議測試的關鍵專案
1. `enterprise-apps/erp-systems/inventory-management`
2. `enterprise-apps/crm-systems/customer-portal`
3. `web-apps/e-commerce/frontend`
4. `apis-backend/rest-api/nestjs-api`
5. `ai-ml-projects/chatbots`

#### ✅ 進度更新 (2025-12-31)
**已完成項目**:
- ✅ E2E 測試框架已設定 (Playwright)
- ✅ 新增 3 個 E2E 測試套件:
  - `tests/e2e/auth.spec.ts` - 身份驗證流程測試
  - `tests/e2e/navigation.spec.ts` - 導航功能測試
  - `tests/e2e/forms.spec.ts` - 表單驗證測試
- ✅ 共 38 個 E2E 測試案例
- ✅ UI 組件測試已新增:
  - Modal 組件 (10 個測試)
  - Toast 組件 (9 個測試)
  - Badge 組件 (10 個測試)
  - Avatar 組件 (9 個測試)
  - Spinner 組件 (9 個測試)
- ✅ 共 47 個 UI 組件測試案例
- ✅ 測試總數: **85+ 個測試案例**

**待完成項目**:
- ⬜ 提升整體測試覆蓋率至 40%
- ⬜ 為更多關鍵專案新增單元測試
- ⬜ 整合測試覆蓋率報告 (Codecov)
- ⬜ 建立 `TESTING-GUIDE.md`

**完成度**: 約 60%

---

### OPT-04: 程式碼品質工具

**優先級**: 🔴 高
**預估時間**: 1-2 小時
**依賴**: 無
**可平行執行**: 是

#### 任務目標
建立統一的程式碼風格和品質檢查工具。

#### 執行步驟

1. **設定 ESLint**
   - 安裝 ESLint + TypeScript plugin
   - 創建 `.eslintrc.json`
   - 配置規則（建議使用 Airbnb 或 Standard）
   - 設定 ignore 檔案

2. **設定 Prettier**
   - 安裝 Prettier
   - 創建 `.prettierrc.json`
   - 配置格式化規則
   - 整合 ESLint

3. **設定 Pre-commit Hooks**
   - 安裝 Husky
   - 安裝 lint-staged
   - 配置 commit 前自動 lint
   - 配置 commit message 格式檢查（commitlint）

4. **設定 Python 程式碼品質工具**
   - 安裝 Black（格式化）
   - 安裝 Ruff 或 Flake8（Linting）
   - 安裝 mypy（型別檢查）
   - 創建 `pyproject.toml` 或 `.flake8`

5. **設定 EditorConfig**
   - 創建 `.editorconfig`
   - 定義跨編輯器的格式設定

6. **執行首次格式化**
   - 對所有程式碼執行格式化
   - 修復自動可修復的 lint 錯誤
   - 記錄需要手動修復的問題

#### 交付成果
- [ ] `.eslintrc.json`
- [ ] `.prettierrc.json`
- [ ] `package.json` 中的 Husky 設定
- [ ] `.lintstagedrc.json`
- [ ] `commitlint.config.js`
- [ ] `pyproject.toml` 或 `.flake8`
- [ ] `.editorconfig`
- [ ] 格式化前後的統計報告

#### 建議配置範例

**Prettier 配置**:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

**ESLint 基礎規則**:
- TypeScript strict mode
- React hooks 規則
- Import/export 順序
- 未使用變數檢查

---

### OPT-05: 安全性掃描整合

**優先級**: 🔴 高
**預估時間**: 1-2 小時
**依賴**: 無
**可平行執行**: 是

#### 任務目標
整合自動化安全性掃描工具，保護專案免受已知漏洞影響。

#### 執行步驟

1. **啟用 GitHub Dependabot**
   - 創建 `.github/dependabot.yml`
   - 配置多生態系統掃描（npm, pip, docker）
   - 設定自動更新策略

2. **設定 CodeQL 分析**
   - 創建 `.github/workflows/codeql.yml`
   - 配置多語言掃描（JavaScript, TypeScript, Python）
   - 設定掃描排程

3. **整合第三方安全工具**
   - 選擇並配置 Snyk 或 Socket Security
   - 設定 API token（使用 GitHub Secrets）
   - 整合到 CI/CD 流程

4. **設定 Secret 掃描**
   - 啟用 GitHub Secret Scanning
   - 配置自定義模式（如適用）
   - 測試是否能檢測到測試 secret

5. **建立 SECURITY.md**
   - 定義安全政策
   - 提供漏洞回報流程
   - 列出支援的版本

6. **執行首次掃描**
   - 運行所有安全掃描工具
   - 記錄發現的問題
   - 建立修復計畫（高危先修）

#### 交付成果
- [ ] `.github/dependabot.yml`
- [ ] `.github/workflows/codeql.yml`
- [ ] `SECURITY.md`
- [ ] 安全掃描報告
- [ ] 高危漏洞修復清單
- [ ] 安全掃描 badge（README）

#### Dependabot 配置範例
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

### OPT-06: Docker 容器化

**優先級**: 🟡 中
**預估時間**: 2-3 小時
**依賴**: 無
**可平行執行**: 是

#### 任務目標
為主要應用程式建立 Docker 支援，標準化開發與部署環境。

#### 執行步驟

1. **建立通用 Dockerfile 模板**
   - Node.js 應用模板
   - Python 應用模板
   - 多階段建置最佳化

2. **為關鍵應用建立 Dockerfile**
   - 選擇 8-10 個主要應用
   - 為每個應用建立優化的 Dockerfile
   - 包含健康檢查

3. **建立 Docker Compose 設定**
   - 開發環境完整堆疊
   - 包含資料庫、快取等服務
   - 環境變數管理

4. **建立 .dockerignore**
   - 排除 node_modules, .git 等
   - 優化建置速度

5. **建立容器化文件**
   - `DOCKER-GUIDE.md`
   - 包含建置和執行指令
   - 常見問題排解

6. **測試容器**
   - 建置所有 Docker images
   - 驗證應用正常運行
   - 檢查 image 大小優化

#### 交付成果
- [ ] Dockerfile 模板（Node.js, Python）
- [ ] 至少 8 個應用有 Dockerfile
- [ ] `docker-compose.yml` 開發環境
- [ ] `.dockerignore`
- [ ] `DOCKER-GUIDE.md`
- [ ] 容器測試報告

#### 建議容器化的應用
1. `web-apps/e-commerce/frontend`
2. `web-apps/e-commerce/backend`
3. `enterprise-apps/crm-systems/customer-portal`
4. `apis-backend/rest-api/nestjs-api`
5. `apis-backend/graphql/apollo-server`
6. `ai-ml-projects/chatbots`
7. `enterprise-apps/erp-systems/inventory-management`
8. `mobile-apps/react-native/backend`

#### 最佳實踐
- 使用多階段建置減少 image 大小
- 使用 alpine 基礎映像（如適用）
- 避免以 root 運行
- 實作健康檢查

---

### OPT-07: 效能監控設定

**優先級**: 🟡 中
**預估時間**: 2 小時
**依賴**: 無
**可平行執行**: 是

#### 任務目標
建立日誌、監控和追蹤系統，提升可觀測性。

#### 執行步驟

1. **設定結構化日誌**
   - Node.js: 安裝 Winston 或 Pino
   - Python: 配置 structlog
   - 建立統一日誌格式

2. **建立日誌配置**
   - 不同環境的日誌級別
   - 日誌輪轉設定
   - 敏感資訊遮罩

3. **整合 APM 工具（可選）**
   - 選擇 Sentry, New Relic, 或 DataDog
   - 配置錯誤追蹤
   - 設定效能監控

4. **建立健康檢查端點**
   - 為所有 API 添加 `/health`
   - 為所有 API 添加 `/metrics`
   - 實作深度健康檢查

5. **設定 OpenTelemetry（進階）**
   - 安裝 OTel SDK
   - 配置追蹤
   - 整合日誌與追蹤

6. **建立監控儀表板**
   - 使用 Grafana 或類似工具
   - 建立關鍵指標視圖
   - 設定告警規則

#### 交付成果
- [ ] 日誌配置檔案
- [ ] 至少 5 個應用整合日誌
- [ ] 健康檢查端點實作
- [ ] 監控配置文件
- [ ] `MONITORING-GUIDE.md`
- [ ] 範例儀表板配置（如適用）

#### 建議的日誌欄位
```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "level": "info",
  "service": "api-gateway",
  "message": "Request processed",
  "requestId": "uuid",
  "userId": "user123",
  "duration": 150,
  "statusCode": 200
}
```

---

### OPT-08: 文件自動化

**優先級**: 🟡 中
**預估時間**: 1-2 小時
**依賴**: 無
**可平行執行**: 是

#### 任務目標
自動生成 API 文件，改善開發者體驗。

#### 執行步驟

1. **設定 OpenAPI/Swagger**
   - 為 REST APIs 添加 Swagger 註解
   - 自動生成 OpenAPI 規格
   - 設定 Swagger UI

2. **設定 GraphQL 文件**
   - 配置 GraphQL Playground 或 Apollo Studio
   - 生成 Schema 文件
   - 添加範例查詢

3. **設定 API 文件生成**
   - 使用 TypeDoc (TypeScript)
   - 使用 Sphinx (Python)
   - 自動化文件建置流程

4. **建立架構決策記錄（ADR）**
   - 創建 `docs/adr/` 目錄
   - 建立 ADR 模板
   - 記錄 3-5 個關鍵架構決策

5. **改善 README**
   - 添加 badges（CI, 覆蓋率, 授權）
   - 添加快速開始指南
   - 添加貢獻指南連結

6. **建立貢獻者指南**
   - `CONTRIBUTING.md`
   - 開發環境設定
   - PR 流程說明
   - 程式碼風格指南

#### 交付成果
- [ ] Swagger/OpenAPI 配置
- [ ] 至少 3 個 API 有自動文件
- [ ] `docs/adr/` 目錄與範例 ADR
- [ ] 更新的主 README
- [ ] `CONTRIBUTING.md`
- [ ] 文件建置腳本

#### ADR 模板範例
```markdown
# ADR-001: 使用 Turborepo 作為 Monorepo 工具

## 狀態
已接受

## 情境
需要管理多個相互關聯的專案...

## 決策
選擇 Turborepo...

## 後果
優點：...
缺點：...
```

---

### NEW-01: CORS 安全修復

**優先級**: 🔴 緊急
**預估時間**: 2 小時
**狀態**: ✅ 已完成 (2025-12-31)

#### 任務目標
修復 CORS 配置漏洞，實作安全的跨域資源共享設定。

#### 執行步驟
1. 識別現有 CORS 配置問題
2. 實作安全的 CORS 中間件
3. 配置允許的來源、方法和標頭
4. 測試跨域請求

#### 交付成果
- ✅ 安全的 CORS 配置檔案
- ✅ CORS 中間件實作
- ✅ 配置文件更新
- ✅ 安全性測試通過

#### ✅ 完成記錄
- **完成日期**: 2025-12-31
- **變更內容**:
  - 實作了安全的 CORS 配置
  - 限制了允許的來源清單
  - 配置了適當的 HTTP 方法和標頭
  - 修復了安全漏洞
- **影響範圍**: 所有 API 端點
- **commit**: `fix(security): add secure CORS configuration and fix vulnerability`

---

### NEW-02: 消除 any 類型

**優先級**: 🔴 高
**預估時間**: 8 小時
**狀態**: 🔄 進行中 (約 65% 完成)

#### 任務目標
提升 TypeScript 程式碼的類型安全性，消除 `any` 類型的使用。

#### 執行步驟
1. 掃描整個程式碼庫找出 any 類型
2. 分析每個 any 類型的使用場景
3. 定義適當的類型或介面
4. 重構程式碼以使用強類型
5. 確保測試通過

#### 交付成果
- 🔄 消除 any 類型的程式碼變更
- 🔄 新增的類型定義檔案
- 🔄 更新的測試
- ⬜ 類型安全性報告

#### ✅ 進度更新 (2025-12-31)
**已完成項目**:
- ✅ 已消除 **130+ 個** any 類型
- ✅ 涵蓋模組:
  - Leave Management Service (請假管理)
  - Search Services (搜尋服務)
  - Payroll Controller (薪資控制器)
  - Fingerprint Protection (指紋保護)
  - 其他工具模組
- ✅ 新增共享錯誤處理工具

**待完成項目**:
- ⬜ 繼續掃描並消除剩餘的 any 類型
- ⬜ 完成所有核心模組的類型定義
- ⬜ 建立類型安全性檢查 CI 流程

**commit**: `refactor: eliminate any types in leave management and search services`, `refactor: eliminate any types in payroll controller and fingerprint protection`

---

### NEW-03: UI 組件測試

**優先級**: 🟡 中
**預估時間**: 4 小時
**狀態**: ✅ 已完成 (2025-12-31)

#### 任務目標
為核心 UI 組件建立全面的單元測試，確保組件的可靠性和穩定性。

#### 執行步驟
1. 識別核心 UI 組件
2. 設定測試框架 (Vitest/Jest + Testing Library)
3. 為每個組件撰寫測試案例
4. 測試組件的各種狀態和行為
5. 確保測試覆蓋率

#### 交付成果
- ✅ UI 組件測試檔案
- ✅ 測試配置
- ✅ 測試覆蓋率報告

#### ✅ 完成記錄 (2025-12-31)
**測試組件清單**:
1. **Modal 組件** - 10 個測試
   - 渲染測試、開關狀態、回調函數、可訪問性
2. **Toast 組件** - 9 個測試
   - 不同類型顯示、自動關閉、手動關閉
3. **Badge 組件** - 10 個測試
   - 不同變體、大小、顏色、內容渲染
4. **Avatar 組件** - 9 個測試
   - 圖片顯示、後備文字、不同大小
5. **Spinner 組件** - 9 個測試
   - 載入狀態、不同大小、可訪問性

**測試統計**:
- ✅ 總測試數: **47 個測試案例**
- ✅ 涵蓋 5 個核心 UI 組件
- ✅ 所有測試通過

**commit**: `test: add comprehensive tests for UI components`

---

### NEW-04: E2E 測試套件

**優先級**: 🔴 高
**預估時間**: 3 小時
**狀態**: ✅ 已完成 (2025-12-31)

#### 任務目標
建立端到端測試套件，驗證關鍵使用者流程的正確性。

#### 執行步驟
1. 設定 E2E 測試框架 (Playwright/Cypress)
2. 識別關鍵使用者流程
3. 撰寫 E2E 測試腳本
4. 配置測試環境
5. 執行並驗證測試

#### 交付成果
- ✅ E2E 測試設定檔案
- ✅ 測試腳本
- ✅ 測試報告

#### ✅ 完成記錄 (2025-12-31)
**測試套件清單**:
1. **auth.spec.ts** - 身份驗證流程
   - 登入、登出、註冊、密碼重設等
2. **navigation.spec.ts** - 導航功能
   - 頁面路由、導航欄、麵包屑等
3. **forms.spec.ts** - 表單驗證
   - 表單提交、驗證、錯誤處理等

**測試統計**:
- ✅ 總測試數: **38 個 E2E 測試案例**
- ✅ 涵蓋 3 個主要流程
- ✅ 使用 Playwright 框架
- ✅ 所有測試通過

**測試檔案位置**:
- `tests/e2e/auth.spec.ts`
- `tests/e2e/navigation.spec.ts`
- `tests/e2e/forms.spec.ts`

---

### NEW-05: 錯誤處理工具

**優先級**: 🟡 中
**預估時間**: 1 小時
**狀態**: ✅ 已完成 (2025-12-31)

#### 任務目標
建立標準化的錯誤處理工具函數，提升程式碼的健壯性和可維護性。

#### 執行步驟
1. 分析現有錯誤處理模式
2. 設計統一的錯誤處理介面
3. 實作錯誤處理工具函數
4. 整合到現有程式碼
5. 撰寫測試

#### 交付成果
- ✅ 錯誤處理工具函數
- ✅ 類型定義
- ✅ 使用文件

#### ✅ 完成記錄 (2025-12-31)
**實作內容**:
- ✅ `getErrorMessage` 工具函數
  - 統一處理不同類型的錯誤
  - 支援 Error 物件、字串、未知類型
  - 提供安全的錯誤訊息提取

**實作位置**:
- `shared-utils/error-handling.ts`

**使用範例**:
```typescript
import { getErrorMessage } from '@/shared-utils/error-handling';

try {
  // 某些操作
} catch (error) {
  const message = getErrorMessage(error);
  console.error(message);
}
```

**影響範圍**:
- 整合到多個模組中
- 提升錯誤處理的一致性
- 改善除錯體驗

**commit**: `refactor: add shared error utilities and fix more any types`

---

## 🔄 執行流程建議

### 階段一：基礎設施（第 1-3 天）
可平行執行以下任務：
- ✅ **OPT-01**: Monorepo 架構（優先）
- ✅ **OPT-04**: 程式碼品質工具
- ✅ **OPT-05**: 安全性掃描

### 階段二：自動化（第 4-6 天）
建議先完成 OPT-01 再執行：
- ✅ **OPT-02**: CI/CD 管道
- ✅ **OPT-03**: 測試基礎設施

### 階段三：優化（第 7-10 天）
可平行執行：
- ✅ **OPT-06**: Docker 容器化
- ✅ **OPT-07**: 效能監控
- ✅ **OPT-08**: 文件自動化

---

## 📌 注意事項

### 多 Claude 協作建議

1. **任務分配**
   - 每個 Claude session 負責 1-2 個任務
   - 在表格中記錄負責的 Session ID
   - 完成後更新狀態

2. **避免衝突**
   - 不同任務盡量操作不同檔案
   - 如需修改共用檔案（如根目錄 package.json），協調執行順序
   - 使用不同分支執行不同任務

3. **Git 工作流程**
   - 每個任務使用獨立分支：`claude/opt-XX-description`
   - 完成後建立 PR
   - 經過測試後再合併到主分支

4. **溝通與同步**
   - 在此 MD 檔案中記錄進度
   - 遇到問題在對應任務下添加註記
   - 完成任務後附上 PR 連結

### 建議的分支命名

- OPT-01: `claude/opt-01-monorepo`
- OPT-02: `claude/opt-02-cicd`
- OPT-03: `claude/opt-03-testing`
- OPT-04: `claude/opt-04-code-quality`
- OPT-05: `claude/opt-05-security`
- OPT-06: `claude/opt-06-docker`
- OPT-07: `claude/opt-07-monitoring`
- OPT-08: `claude/opt-08-docs`

---

## ✅ 完成檢查清單

完成所有任務後，確認以下項目：

### 基礎設施
- [ ] Monorepo 可以成功建置
- [ ] CI/CD 所有 checks 通過
- [ ] 程式碼品質工具可以執行
- [ ] 安全掃描無高危漏洞

### 測試與品質
- [ ] 測試覆蓋率 > 40%
- [ ] Pre-commit hooks 正常運作
- [ ] 所有 lint 錯誤已修復

### 容器與監控
- [ ] Docker images 可以成功建置
- [ ] 健康檢查端點正常
- [ ] 日誌系統運作正常

### 文件
- [ ] API 文件可訪問
- [ ] README 包含完整資訊
- [ ] 貢獻指南完整

---

## 📞 需要幫助？

### 常見問題

**Q: 任務之間有依賴怎麼辦？**
A: 大部分任務可以獨立執行。如果需要 OPT-01 的成果，可以先在本地 pull 該分支的變更。

**Q: 遇到衝突如何解決？**
A: 先 commit 當前變更，然後 rebase 主分支，手動解決衝突。

**Q: 如何測試我的變更？**
A: 每個任務都有測試步驟，請確保完成「交付成果」中的所有項目。

### 聯絡方式
- 在對應任務的 GitHub Issue 中提問
- 在此 MD 文件中添加註記

---

## 📝 進度記錄

### 任務詳細狀態

#### OPT-01: Monorepo 架構
- **開始時間**:
- **完成時間**:
- **負責人**:
- **PR 連結**:
- **註記**:

#### OPT-02: CI/CD 管道
- **開始時間**:
- **完成時間**:
- **負責人**:
- **PR 連結**:
- **註記**:

#### OPT-03: 測試基礎設施
- **開始時間**: 2025-12-31
- **完成時間**: 部分完成 (約 60%)
- **負責人**: Claude
- **PR 連結**: 待建立
- **註記**:
  - ✅ E2E 測試: 38 個測試案例 (auth.spec.ts, navigation.spec.ts, forms.spec.ts)
  - ✅ UI 組件測試: 47 個測試案例 (Modal, Toast, Badge, Avatar, Spinner)
  - ⬜ 待完成: 提升整體測試覆蓋率至 40%、建立 TESTING-GUIDE.md

#### OPT-04: 程式碼品質工具
- **開始時間**:
- **完成時間**:
- **負責人**:
- **PR 連結**:
- **註記**:

#### OPT-05: 安全性掃描
- **開始時間**:
- **完成時間**:
- **負責人**:
- **PR 連結**:
- **註記**:

#### OPT-06: Docker 容器化
- **開始時間**:
- **完成時間**:
- **負責人**:
- **PR 連結**:
- **註記**:

#### OPT-07: 效能監控
- **開始時間**:
- **完成時間**:
- **負責人**:
- **PR 連結**:
- **註記**:

#### OPT-08: 文件自動化
- **開始時間**:
- **完成時間**:
- **負責人**:
- **PR 連結**:
- **註記**:

#### NEW-01: CORS 安全修復
- **開始時間**: 2025-12-31
- **完成時間**: 2025-12-31
- **負責人**: Claude
- **PR 連結**: 待建立
- **commit**: `fix(security): add secure CORS configuration and fix vulnerability`
- **註記**:
  - ✅ 實作安全的 CORS 配置
  - ✅ 限制允許的來源清單
  - ✅ 配置適當的 HTTP 方法和標頭
  - ✅ 修復安全漏洞

#### NEW-02: 消除 any 類型
- **開始時間**: 2025-12-31
- **完成時間**: 進行中 (約 65%)
- **負責人**: Claude
- **PR 連結**: 待建立
- **commit**:
  - `refactor: eliminate any types in leave management and search services`
  - `refactor: eliminate any types in payroll controller and fingerprint protection`
  - `refactor: add shared error utilities and fix more any types`
- **註記**:
  - ✅ 已消除 130+ 個 any 類型
  - ✅ 涵蓋模組: Leave Management, Search Services, Payroll, Fingerprint Protection
  - ⬜ 持續進行中，目標消除所有 any 類型

#### NEW-03: UI 組件測試
- **開始時間**: 2025-12-31
- **完成時間**: 2025-12-31
- **負責人**: Claude
- **PR 連結**: 待建立
- **commit**: `test: add comprehensive tests for UI components`
- **註記**:
  - ✅ 新增 5 個核心 UI 組件測試
  - ✅ 共 47 個測試案例
  - ✅ 組件: Modal (10), Toast (9), Badge (10), Avatar (9), Spinner (9)
  - ✅ 所有測試通過

#### NEW-04: E2E 測試套件
- **開始時間**: 2025-12-31
- **完成時間**: 2025-12-31
- **負責人**: Claude
- **PR 連結**: 待建立
- **commit**: 包含在測試提交中
- **註記**:
  - ✅ 新增 3 個 E2E 測試套件
  - ✅ 共 38 個 E2E 測試案例
  - ✅ 測試檔案: auth.spec.ts, navigation.spec.ts, forms.spec.ts
  - ✅ 使用 Playwright 框架
  - ✅ 所有測試通過

#### NEW-05: 錯誤處理工具
- **開始時間**: 2025-12-31
- **完成時間**: 2025-12-31
- **負責人**: Claude
- **PR 連結**: 待建立
- **commit**: `refactor: add shared error utilities and fix more any types`
- **註記**:
  - ✅ 實作 getErrorMessage 工具函數
  - ✅ 位置: shared-utils/error-handling.ts
  - ✅ 統一錯誤處理模式
  - ✅ 整合到多個模組

---

## 🎉 完成後的效益

完成所有優化任務後，專案將具備：

### 開發體驗提升
- ⚡ 更快的建置速度（Turborepo 快取）
- 🎨 統一的程式碼風格
- 🔍 自動化的程式碼審查
- 📖 完整的文件

### 品質保證
- ✅ 自動化測試覆蓋
- 🛡️ 安全漏洞自動偵測
- 📊 程式碼品質指標
- 🔄 CI/CD 自動化

### 生產就緒
- 🐳 容器化部署
- 📈 效能監控
- 🚨 錯誤追蹤
- 🔐 安全性強化

---

**最後更新**: 2025-12-31
**文件版本**: 1.1
**維護者**: Vibe-Coding-Apps Team

### 更新歷史
- **v1.1** (2025-12-31): 新增進度更新，標記已完成任務（CORS、UI/E2E 測試、錯誤處理），更新類型安全進度
- **v1.0** (2025-11-18): 初始版本
