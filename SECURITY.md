# Security Policy

## 🔒 安全政策

我們非常重視 Vibe-Coding-Apps 的安全性。如果你發現了安全漏洞，請負責任地披露。

## 🛡️ 支持的版本

| 版本 | 支持狀態 |
| --- | --- |
| main (最新) | ✅ 支持 |
| develop | ✅ 支持 |
| < 1.0 | ❌ 不支持 |

## 🚨 報告安全漏洞

**請勿在公開 Issue 中報告安全漏洞！**

### 報告渠道

1. **GitHub Security Advisories** (推薦)
   - 訪問: https://github.com/markl-a/Vibe-Coding-Apps/security/advisories
   - 點擊 "Report a vulnerability"
   - 填寫詳細信息

2. **私人郵件**
   - 發送至: [安全團隊郵箱]
   - 主題: `[SECURITY] 簡要描述`

### 報告應包含的信息

請提供以下信息以幫助我們更快地理解和解決問題：

- **漏洞類型**: (如 XSS、SQL 注入、認證繞過等)
- **受影響的組件**: 哪個項目/文件受到影響
- **漏洞描述**: 詳細描述漏洞
- **重現步驟**:
  1. 步驟 1
  2. 步驟 2
  3. ...
- **影響評估**: 這個漏洞可能造成什麼影響
- **建議修復方案**: (如果有)
- **概念驗證**: (PoC 代碼或截圖)

### 報告模板

```markdown
### 漏洞概述
[簡要描述漏洞]

### 受影響範圍
- 項目: [項目名稱]
- 文件: [文件路徑]
- 版本: [受影響的版本]

### 嚴重程度
- [ ] Critical (嚴重)
- [ ] High (高)
- [ ] Medium (中)
- [ ] Low (低)

### 漏洞詳情
[詳細描述漏洞的技術細節]

### 重現步驟
1.
2.
3.

### 影響
[描述漏洞可能造成的影響]

### 建議修復
[你的修復建議]

### 附加信息
[任何其他相關信息]
```

## ⏱️ 響應時間

我們承諾：

- **24 小時內**: 確認收到報告
- **72 小時內**: 提供初步評估
- **7 天內**: 提供詳細的修復計劃
- **30 天內**: 發布修復（視嚴重程度而定）

## 🏆 安全研究者獎勵

我們非常感謝安全研究者的貢獻：

- **致謝**: 在 SECURITY.md 中公開致謝（如果你願意）
- **優先訪問**: 優先訪問新功能和測試版本
- **貢獻者徽章**: 特殊的貢獻者身份

### 致謝名單

感謝以下研究者幫助我們改進安全性：

<!--
將會在這裡列出貢獻者
- [研究者姓名] - [發現的漏洞類型] - [日期]
-->

## 🔐 安全最佳實踐

### 對於貢獻者

1. **永不提交敏感信息**
   - API 密鑰
   - 密碼
   - 私鑰
   - 個人身份信息

2. **使用環境變量**
   ```bash
   # ✅ Good
   const apiKey = process.env.API_KEY;

   # ❌ Bad
   const apiKey = "sk-1234567890abcdef";
   ```

3. **依賴安全**
   - 定期更新依賴
   - 使用 `npm audit` 或 `pnpm audit`
   - 審查 Dependabot 警告

4. **代碼審查**
   - 所有 PR 需要至少 1 次審查
   - 關注安全問題
   - 使用 CodeQL 分析

### 對於用戶

1. **保持更新**
   - 使用最新版本
   - 訂閱安全公告

2. **安全配置**
   - 使用強密碼
   - 啟用雙因素認證
   - 定期審查訪問權限

3. **監控**
   - 檢查異常活動
   - 審查日誌文件

## 🛠️ 安全工具

我們使用以下工具來確保代碼安全：

### 自動化掃描

- **Dependabot**: 依賴漏洞掃描
- **CodeQL**: 靜態代碼分析
- **ESLint Security Plugin**: JavaScript 安全規則
- **Ruff**: Python 安全檢查
- **npm audit / pnpm audit**: NPM 包安全審計

### CI/CD 集成

所有 Pull Request 都會自動運行：

- 依賴安全掃描
- 靜態代碼分析
- 安全測試
- 許可證合規檢查

## 🔍 已知安全問題

### 當前問題

目前沒有已知的安全問題。

### 已修復問題

<!--
將會在這裡列出已修復的問題
- [CVE-XXXX-XXXXX] - [描述] - 修復於 [版本]
-->

## 📚 安全資源

### 參考文檔

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Python Security](https://python.readthedocs.io/en/stable/library/security_warnings.html)

### 安全檢查清單

#### Web 應用安全

- [ ] 輸入驗證和消毒
- [ ] 輸出編碼
- [ ] 認證和會話管理
- [ ] 訪問控制
- [ ] 加密配置
- [ ] 錯誤處理和日誌
- [ ] 數據保護
- [ ] 通信安全
- [ ] 系統配置
- [ ] 數據庫安全

#### API 安全

- [ ] 認證（OAuth 2.0 / JWT）
- [ ] 授權（RBAC / ABAC）
- [ ] 速率限制
- [ ] 輸入驗證
- [ ] 加密傳輸（HTTPS）
- [ ] API 版本控制
- [ ] 日誌和監控
- [ ] 錯誤處理

#### 韌體安全

- [ ] 安全啟動
- [ ] 固件簽名驗證
- [ ] 加密通信
- [ ] 安全 OTA 更新
- [ ] 密鑰管理
- [ ] 調試接口保護
- [ ] 內存保護
- [ ] 回滾保護

## 📞 聯繫信息

- **安全郵箱**: [security@example.com]
- **PGP 密鑰**: [PGP Key ID]
- **Security Advisory**: https://github.com/markl-a/Vibe-Coding-Apps/security/advisories

## 🔄 政策更新

此安全政策可能會不時更新。請定期查看。

**最後更新**: 2025-11-19

---

感謝你幫助我們保持 Vibe-Coding-Apps 的安全！🔒
