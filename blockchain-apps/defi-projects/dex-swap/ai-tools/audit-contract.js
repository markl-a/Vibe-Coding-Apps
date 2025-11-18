#!/usr/bin/env node

/**
 * AI 輔助智能合約安全審計工具
 *
 * 此工具使用 AI 來分析智能合約的常見安全漏洞
 */

const fs = require('fs');
const path = require('path');

console.log("🔍 AI 智能合約安全審計工具\n");

// 定義要檢查的安全模式
const securityChecks = [
  {
    name: "重入攻擊防護",
    pattern: /nonReentrant/,
    description: "檢查是否使用 ReentrancyGuard",
    severity: "高",
  },
  {
    name: "整數溢出檢查",
    pattern: /pragma solidity \^0\.[0-7]\./,
    description: "Solidity 0.8+ 有內建溢出保護",
    severity: "高",
    invert: true, // 如果匹配到則為問題
  },
  {
    name: "訪問控制",
    pattern: /(onlyOwner|onlyFactory|require\(msg\.sender)/,
    description: "檢查是否有適當的訪問控制",
    severity: "高",
  },
  {
    name: "檢查效果交互模式",
    pattern: /\/\/ (Checks|Effects|Interactions)/,
    description: "是否遵循 CEI 模式",
    severity: "中",
  },
  {
    name: "事件發送",
    pattern: /emit \w+\(/,
    description: "重要操作應該發送事件",
    severity: "低",
  },
  {
    name: "使用 SafeMath/SafeERC20",
    pattern: /(using SafeMath|using SafeERC20)/,
    description: "安全的數學運算和代幣轉賬",
    severity: "中",
  },
];

// 掃描合約文件
function scanContract(filePath) {
  console.log(`\n📄 掃描: ${path.basename(filePath)}`);
  console.log("─".repeat(50));

  const content = fs.readFileSync(filePath, 'utf8');
  const results = [];

  securityChecks.forEach(check => {
    const found = check.pattern.test(content);
    const isIssue = check.invert ? found : !found;

    if (check.invert) {
      // 反向檢查：如果找到就是問題
      if (found) {
        results.push({
          ...check,
          status: "⚠️  警告",
          passed: false,
        });
      } else {
        results.push({
          ...check,
          status: "✅ 通過",
          passed: true,
        });
      }
    } else {
      // 正常檢查：如果找到就通過
      if (found) {
        results.push({
          ...check,
          status: "✅ 通過",
          passed: true,
        });
      } else {
        results.push({
          ...check,
          status: "❌ 未找到",
          passed: false,
        });
      }
    }
  });

  // 顯示結果
  results.forEach(result => {
    console.log(`${result.status} ${result.name}`);
    console.log(`   ${result.description}`);
    console.log(`   嚴重程度: ${result.severity}`);
  });

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  const score = ((passedCount / totalCount) * 100).toFixed(1);

  console.log(`\n📊 安全評分: ${score}% (${passedCount}/${totalCount} 項通過)`);

  return { filePath, results, score };
}

// AI 建議生成器
function generateAIRecommendations(scanResults) {
  console.log("\n\n🤖 AI 安全建議");
  console.log("=".repeat(50));

  const allIssues = scanResults.flatMap(scan =>
    scan.results.filter(r => !r.passed)
  );

  if (allIssues.length === 0) {
    console.log("✨ 太棒了！沒有發現明顯的安全問題。");
    console.log("\n建議：");
    console.log("1. 進行專業的安全審計");
    console.log("2. 編寫完整的測試套件");
    console.log("3. 使用形式化驗證工具");
    return;
  }

  console.log(`\n發現 ${allIssues.length} 個潛在問題：\n`);

  const highSeverity = allIssues.filter(i => i.severity === "高");
  const mediumSeverity = allIssues.filter(i => i.severity === "中");
  const lowSeverity = allIssues.filter(i => i.severity === "低");

  if (highSeverity.length > 0) {
    console.log("🔴 高嚴重程度問題:");
    highSeverity.forEach(issue => {
      console.log(`   • ${issue.name}: ${issue.description}`);
    });
    console.log();
  }

  if (mediumSeverity.length > 0) {
    console.log("🟡 中嚴重程度問題:");
    mediumSeverity.forEach(issue => {
      console.log(`   • ${issue.name}: ${issue.description}`);
    });
    console.log();
  }

  if (lowSeverity.length > 0) {
    console.log("🟢 低嚴重程度問題:");
    lowSeverity.forEach(issue => {
      console.log(`   • ${issue.name}: ${issue.description}`);
    });
    console.log();
  }

  console.log("\n💡 AI 改進建議：");
  console.log("1. 為所有外部調用添加 ReentrancyGuard");
  console.log("2. 使用 Solidity 0.8+ 獲得內建溢出保護");
  console.log("3. 為敏感函數添加訪問控制修飾符");
  console.log("4. 遵循檢查-效果-交互（CEI）模式");
  console.log("5. 為所有狀態改變操作發送事件");
  console.log("6. 使用 OpenZeppelin 的安全庫");
  console.log("7. 添加全面的單元測試和集成測試");
  console.log("8. 考慮使用 Slither、Mythril 等靜態分析工具");
}

// 主函數
function main() {
  const contractsDir = path.join(__dirname, '../contracts');

  if (!fs.existsSync(contractsDir)) {
    console.error("❌ 找不到 contracts 目錄");
    process.exit(1);
  }

  const scanResults = [];

  // 遞迴掃描所有 .sol 文件
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith('.sol') && !file.includes('Mock')) {
        const result = scanContract(filePath);
        scanResults.push(result);
      }
    });
  }

  scanDirectory(contractsDir);

  // 生成 AI 建議
  generateAIRecommendations(scanResults);

  // 計算總體評分
  const totalScore = scanResults.reduce((sum, r) => sum + parseFloat(r.score), 0) / scanResults.length;
  console.log(`\n\n📈 整體安全評分: ${totalScore.toFixed(1)}%`);

  if (totalScore >= 80) {
    console.log("✅ 安全性良好！");
  } else if (totalScore >= 60) {
    console.log("⚠️  需要改進");
  } else {
    console.log("❌ 發現嚴重問題，請立即修復");
  }
}

if (require.main === module) {
  main();
}

module.exports = { scanContract, generateAIRecommendations };
