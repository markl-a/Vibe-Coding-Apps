#!/usr/bin/env node

/**
 * AI 輔助測試生成工具
 *
 * 分析智能合約並生成測試用例建議
 */

const fs = require('fs');
const path = require('path');

console.log("🧪 AI 測試用例生成器\n");

// 測試場景模板
const testScenarios = {
  addLiquidity: {
    title: "添加流動性測試",
    cases: [
      "應該成功添加初始流動性",
      "應該成功添加後續流動性",
      "應該在不同比例下正確計算流動性",
      "應該拒絕低於最小數量的流動性",
      "應該正確發送 LP 代幣",
      "應該在期限過後拒絕添加流動性",
    ],
  },
  removeLiquidity: {
    title: "移除流動性測試",
    cases: [
      "應該成功移除全部流動性",
      "應該成功移除部分流動性",
      "應該正確返回代幣",
      "應該拒絕超過餘額的移除請求",
      "應該在移除後燒毀 LP 代幣",
    ],
  },
  swap: {
    title: "代幣交換測試",
    cases: [
      "應該成功交換代幣",
      "應該遵守恆定乘積公式",
      "應該正確計算交換數量",
      "應該在滑點過大時拒絕交易",
      "應該支持多跳交換",
      "應該正確收取手續費",
      "應該在流動性不足時拒絕交易",
    ],
  },
  priceImpact: {
    title: "價格影響測試",
    cases: [
      "小額交易應該有較小的價格影響",
      "大額交易應該有更大的價格影響",
      "應該正確計算價格影響",
    ],
  },
  security: {
    title: "安全性測試",
    cases: [
      "應該防止重入攻擊",
      "應該正確處理代幣轉賬失敗",
      "應該拒絕未授權的操作",
      "應該在整數溢出時回滾",
      "應該正確處理零地址",
    ],
  },
  edge: {
    title: "邊界條件測試",
    cases: [
      "應該處理最小流動性鎖定",
      "應該處理極大數值",
      "應該處理極小數值",
      "應該處理完全相同的代幣對",
      "應該處理餘額為零的情況",
    ],
  },
};

// 分析合約函數
function analyzeContractFunctions(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // 提取公開/外部函數
  const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s+(public|external)/g;
  const functions = [];
  let match;

  while ((match = functionRegex.exec(content)) !== null) {
    functions.push({
      name: match[1],
      visibility: match[2],
    });
  }

  return functions;
}

// 生成測試建議
function generateTestSuggestions(contractName, functions) {
  console.log(`\n📋 ${contractName} 測試建議`);
  console.log("=".repeat(60));

  const suggestions = [];

  // 為每個函數生成基本測試
  functions.forEach(func => {
    console.log(`\n🔹 ${func.name}() 函數測試:`);

    // 基本測試用例
    console.log("   ✓ 應該在正常條件下成功執行");
    console.log("   ✓ 應該正確處理邊界值");
    console.log("   ✓ 應該在無效輸入時回滾");
    console.log("   ✓ 應該發送正確的事件");

    if (func.name.includes("add") || func.name.includes("deposit")) {
      console.log("   ✓ 應該正確更新餘額");
      console.log("   ✓ 應該正確轉移代幣");
    }

    if (func.name.includes("remove") || func.name.includes("withdraw")) {
      console.log("   ✓ 應該檢查足夠的餘額");
      console.log("   ✓ 應該正確返還資產");
    }

    if (func.name.includes("swap")) {
      console.log("   ✓ 應該遵守定價公式");
      console.log("   ✓ 應該檢查滑點保護");
    }

    suggestions.push({
      function: func.name,
      tests: ["success", "boundary", "invalid", "events"],
    });
  });

  return suggestions;
}

// 生成測試代碼模板
function generateTestTemplate(contractName, scenarios) {
  const template = `
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("${contractName}", function () {
  async function deployFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    // TODO: 部署合約和依賴項

    return { /* 返回部署的合約和賬戶 */ };
  }

${scenarios.map(scenario => `
  describe("${scenario.title}", function () {
${scenario.cases.map(testCase => `
    it("${testCase}", async function () {
      const {} = await loadFixture(deployFixture);

      // TODO: 實現測試邏輯

    });
`).join('')}
  });
`).join('')}

  describe("事件測試", function () {
    it("應該發送正確的事件", async function () {
      // TODO: 測試事件發送
    });
  });

  describe("Gas 優化測試", function () {
    it("應該優化 gas 使用", async function () {
      // TODO: 測試 gas 消耗
    });
  });
});
`;

  return template;
}

// AI 測試策略建議
function generateTestingStrategy() {
  console.log("\n\n🤖 AI 測試策略建議");
  console.log("=".repeat(60));

  console.log(`
📚 測試金字塔:

  ┌─────────────┐
  │   E2E 測試  │  10%  - 完整流程測試
  ├─────────────┤
  │  集成測試   │  20%  - 合約間交互測試
  ├─────────────┤
  │  單元測試   │  70%  - 單個函數測試
  └─────────────┘

🎯 測試重點:

1. **功能測試** (必須)
   • 正常路徑測試
   • 邊界條件測試
   • 錯誤處理測試

2. **安全測試** (關鍵)
   • 重入攻擊測試
   • 整數溢出測試
   • 訪問控制測試
   • 前端運行測試

3. **整合測試**
   • 與其他合約的交互
   • 代幣轉賬流程
   • 複雜場景測試

4. **Gas 測試**
   • Gas 消耗檢查
   • 優化驗證

5. **模糊測試**
   • 隨機輸入測試
   • 極端值測試

💡 測試最佳實踐:

✅ 使用 fixture 提高測試速度
✅ 測試應該獨立且可重複
✅ 使用有意義的測試名稱
✅ 測試邊界條件和錯誤情況
✅ 保持測試簡潔和聚焦
✅ 使用輔助函數減少重複代碼
✅ 測試事件發送
✅ 檢查狀態變化
✅ 使用 coverage 工具確保覆蓋率 > 90%

🔧 推薦工具:

• Hardhat - 開發環境
• Chai - 斷言庫
• hardhat-network-helpers - 測試輔助
• solidity-coverage - 覆蓋率報告
• Foundry - 快速測試（可選）
• Echidna/Foundry Fuzz - 模糊測試

📊 目標指標:

• 測試覆蓋率: > 90%
• 關鍵路徑覆蓋率: 100%
• 測試執行時間: < 30 秒
• 所有測試通過率: 100%
  `);
}

// 主函數
function main() {
  const contractsDir = path.join(__dirname, '../contracts/core');

  if (!fs.existsSync(contractsDir)) {
    console.error("❌ 找不到 contracts 目錄");
    process.exit(1);
  }

  const files = fs.readdirSync(contractsDir);
  const allSuggestions = [];

  files.forEach(file => {
    if (file.endsWith('.sol') && !file.includes('Mock')) {
      const filePath = path.join(contractsDir, file);
      const contractName = path.basename(file, '.sol');
      const functions = analyzeContractFunctions(filePath);
      const suggestions = generateTestSuggestions(contractName, functions);
      allSuggestions.push({ contractName, suggestions });
    }
  });

  // 生成測試模板示例
  console.log("\n\n📝 測試模板示例");
  console.log("=".repeat(60));

  const scenarioList = Object.values(testScenarios);
  const template = generateTestTemplate("DEXPair", scenarioList);

  const templatePath = path.join(__dirname, '../test-templates');
  if (!fs.existsSync(templatePath)) {
    fs.mkdirSync(templatePath, { recursive: true });
  }

  fs.writeFileSync(
    path.join(templatePath, 'DEXPair.test.template.js'),
    template
  );

  console.log("\n✅ 測試模板已生成至: test-templates/DEXPair.test.template.js");

  // 顯示測試策略
  generateTestingStrategy();

  console.log("\n\n✨ 建議完成！開始編寫測試吧！\n");
}

if (require.main === module) {
  main();
}

module.exports = { generateTestSuggestions, generateTestTemplate };
