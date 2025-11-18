#!/usr/bin/env node

/**
 * AI 輔助 Gas 優化分析工具
 *
 * 分析智能合約並提供 Gas 優化建議
 */

const fs = require('fs');
const path = require('path');

console.log("⛽ AI Gas 優化分析工具\n");

// Gas 優化檢查模式
const gasOptimizations = [
  {
    name: "使用 calldata 而非 memory",
    pattern: /function\s+\w+\([^)]*memory\s+\w+\[\]/,
    suggestion: "對於外部函數的數組參數，使用 calldata 而非 memory 可節省 gas",
    savings: "中等",
    example: "function foo(uint[] calldata data) external { }",
  },
  {
    name: "變量打包",
    pattern: /uint256.*uint128/s,
    suggestion: "將小於 256 位的變量打包在一起可以節省存儲槽",
    savings: "高",
    example: "uint128 a; uint128 b; // 打包在一個槽中",
  },
  {
    name: "使用 ++i 而非 i++",
    pattern: /\bi\+\+/,
    suggestion: "在循環中使用 ++i 而非 i++ 可節省少量 gas",
    savings: "低",
    example: "for (uint i = 0; i < length; ++i) { }",
  },
  {
    name: "緩存數組長度",
    pattern: /for.*\.length/,
    suggestion: "在循環中緩存數組長度可以節省重複的 SLOAD",
    savings: "中等",
    example: "uint len = arr.length; for (uint i = 0; i < len; ++i) { }",
  },
  {
    name: "使用 immutable/constant",
    pattern: /address public \w+(?!.*immutable)/,
    suggestion: "如果變量不會改變，使用 immutable 或 constant",
    savings: "高",
    example: "address public immutable factory;",
  },
  {
    name: "短路操作符優化",
    pattern: /require\(.*&&/,
    suggestion: "在 require 中，將更可能失敗的條件放在前面",
    savings: "低",
    example: "require(cheapCheck && expensiveCheck);",
  },
  {
    name: "使用自定義錯誤",
    pattern: /revert\s*\(\s*["']/,
    suggestion: "Solidity 0.8.4+ 使用自定義錯誤而非字符串可節省大量 gas",
    savings: "高",
    example: "error InsufficientBalance(); revert InsufficientBalance();",
  },
  {
    name: "避免不必要的存儲寫入",
    pattern: /=\s*0;/,
    suggestion: "避免將變量顯式設為默認值",
    savings: "低",
    example: "// uint i; 而非 uint i = 0;",
  },
  {
    name: "使用 unchecked",
    pattern: /for\s*\([^)]*\+\+/,
    suggestion: "在不會溢出的循環中使用 unchecked { ++i }",
    savings: "中等",
    example: "for (uint i; i < len;) { unchecked { ++i; } }",
  },
];

// 分析合約
function analyzeContract(filePath) {
  console.log(`\n📄 分析: ${path.basename(filePath)}`);
  console.log("─".repeat(60));

  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];
  let totalSavings = 0;

  gasOptimizations.forEach(opt => {
    const matches = content.match(opt.pattern);
    if (matches) {
      findings.push({
        ...opt,
        count: matches.length,
      });

      // 計算潛在節省
      const savingsMap = { "低": 1, "中等": 3, "高": 5 };
      totalSavings += savingsMap[opt.savings] * matches.length;
    }
  });

  if (findings.length === 0) {
    console.log("✅ 未發現明顯的 Gas 優化機會");
    return { filePath, findings, totalSavings: 0 };
  }

  console.log(`\n發現 ${findings.length} 個優化機會:\n`);

  findings.forEach((finding, index) => {
    console.log(`${index + 1}. ${finding.name} (出現 ${finding.count} 次)`);
    console.log(`   節省程度: ${finding.savings}`);
    console.log(`   建議: ${finding.suggestion}`);
    console.log(`   示例: ${finding.example}\n`);
  });

  return { filePath, findings, totalSavings };
}

// 生成優化報告
function generateOptimizationReport(results) {
  console.log("\n\n📊 Gas 優化報告");
  console.log("=".repeat(60));

  const totalFindings = results.reduce((sum, r) => sum + r.findings.length, 0);
  const totalSavings = results.reduce((sum, r) => sum + r.totalSavings, 0);

  console.log(`\n總計發現 ${totalFindings} 個優化機會`);
  console.log(`估計潛在節省: ${totalSavings} 分 (相對評分)\n`);

  // 按優先級排序的建議
  console.log("🎯 優先優化建議:\n");

  const allFindings = results.flatMap(r =>
    r.findings.map(f => ({ ...f, file: path.basename(r.filePath) }))
  );

  const highPriority = allFindings.filter(f => f.savings === "高");
  const mediumPriority = allFindings.filter(f => f.savings === "中等");

  if (highPriority.length > 0) {
    console.log("🔴 高優先級 (建議優先處理):");
    highPriority.forEach(f => {
      console.log(`   • ${f.name} (${f.file}, ${f.count} 處)`);
    });
    console.log();
  }

  if (mediumPriority.length > 0) {
    console.log("🟡 中優先級:");
    mediumPriority.forEach(f => {
      console.log(`   • ${f.name} (${f.file}, ${f.count} 處)`);
    });
    console.log();
  }

  // AI 建議
  console.log("\n🤖 AI 優化策略:\n");
  console.log("1. **存儲優化**:");
  console.log("   - 將狀態變量打包以減少存儲槽");
  console.log("   - 使用 immutable/constant 標記不變的變量");
  console.log("   - 考慮使用事件而非存儲來記錄歷史數據\n");

  console.log("2. **計算優化**:");
  console.log("   - 在循環中緩存重複計算的值");
  console.log("   - 使用 unchecked 塊處理不會溢出的操作");
  console.log("   - 避免不必要的類型轉換\n");

  console.log("3. **函數優化**:");
  console.log("   - 外部函數使用 calldata 參數");
  console.log("   - 使用自定義錯誤替代 revert 字符串");
  console.log("   - 考慮函數可見性（external vs public）\n");

  console.log("4. **高級技巧**:");
  console.log("   - 使用位運算代替乘除（如果適用）");
  console.log("   - 批處理操作以減少交易數量");
  console.log("   - 考慮使用 EIP-2929 熱/冷存儲訪問優化\n");

  // Gas 效率評級
  const efficiency = calculateEfficiency(totalSavings, totalFindings);
  console.log(`\n⚡ Gas 效率評級: ${efficiency.grade} (${efficiency.score}/100)`);
  console.log(`   ${efficiency.comment}\n`);
}

// 計算效率評級
function calculateEfficiency(savings, findings) {
  let score;
  if (findings === 0) {
    score = 95;
  } else {
    score = Math.max(0, 100 - savings * 2);
  }

  let grade, comment;
  if (score >= 90) {
    grade = "A+";
    comment = "優秀！Gas 優化做得很好。";
  } else if (score >= 80) {
    grade = "A";
    comment = "良好，有一些小的改進空間。";
  } else if (score >= 70) {
    grade = "B";
    comment = "中等，建議進行優化。";
  } else if (score >= 60) {
    grade = "C";
    comment = "需要改進，有明顯的優化機會。";
  } else {
    grade = "D";
    comment = "需要大幅優化以降低 Gas 成本。";
  }

  return { score, grade, comment };
}

// 主函數
function main() {
  const contractsDir = path.join(__dirname, '../contracts');

  if (!fs.existsSync(contractsDir)) {
    console.error("❌ 找不到 contracts 目錄");
    process.exit(1);
  }

  const results = [];

  function analyzeDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        analyzeDirectory(filePath);
      } else if (file.endsWith('.sol') && !file.includes('Mock') && !file.includes('interface')) {
        const result = analyzeContract(filePath);
        results.push(result);
      }
    });
  }

  analyzeDirectory(contractsDir);
  generateOptimizationReport(results);
}

if (require.main === module) {
  main();
}

module.exports = { analyzeContract, generateOptimizationReport };
