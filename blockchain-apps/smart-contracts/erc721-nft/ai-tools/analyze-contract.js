/**
 * AI-Powered Smart Contract Analyzer
 *
 * This tool analyzes the smart contract and provides insights on:
 * - Code structure and organization
 * - Best practices compliance
 * - Potential improvements
 * - Documentation quality
 */

const fs = require('fs');
const path = require('path');

class ContractAnalyzer {
  constructor(contractPath) {
    this.contractPath = contractPath;
    this.contractCode = fs.readFileSync(contractPath, 'utf8');
  }

  analyze() {
    console.log('🔍 Analyzing Smart Contract...\n');
    console.log('═'.repeat(80));

    const results = {
      structure: this.analyzeStructure(),
      documentation: this.analyzeDocumentation(),
      bestPractices: this.analyzeBestPractices(),
      complexity: this.analyzeComplexity(),
    };

    this.printReport(results);
    return results;
  }

  analyzeStructure() {
    const lines = this.contractCode.split('\n');
    const contracts = (this.contractCode.match(/contract\s+\w+/g) || []).length;
    const functions = (this.contractCode.match(/function\s+\w+/g) || []).length;
    const modifiers = (this.contractCode.match(/modifier\s+\w+/g) || []).length;
    const events = (this.contractCode.match(/event\s+\w+/g) || []).length;
    const imports = (this.contractCode.match(/import\s+/g) || []).length;

    return {
      totalLines: lines.length,
      codeLines: lines.filter(l => l.trim() && !l.trim().startsWith('//')).length,
      contracts,
      functions,
      modifiers,
      events,
      imports,
    };
  }

  analyzeDocumentation() {
    const natspecComments = (this.contractCode.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
    const inlineComments = (this.contractCode.match(/\/\/.+/g) || []).length;
    const functions = (this.contractCode.match(/function\s+\w+/g) || []).length;

    const docCoverage = functions > 0 ? (natspecComments / functions * 100).toFixed(1) : 0;

    return {
      natspecComments,
      inlineComments,
      docCoverage,
      quality: docCoverage >= 80 ? 'Excellent' : docCoverage >= 50 ? 'Good' : 'Needs Improvement',
    };
  }

  analyzeBestPractices() {
    const checks = {
      usesOpenZeppelin: this.contractCode.includes('@openzeppelin'),
      hasSPDXLicense: this.contractCode.includes('SPDX-License-Identifier'),
      usesPragma: this.contractCode.includes('pragma solidity'),
      hasReentrancyGuard: this.contractCode.includes('ReentrancyGuard') ||
                          this.contractCode.includes('nonReentrant'),
      hasAccessControl: this.contractCode.includes('Ownable') ||
                        this.contractCode.includes('AccessControl'),
      hasEvents: (this.contractCode.match(/emit\s+\w+/g) || []).length > 0,
      usesRequire: (this.contractCode.match(/require\(/g) || []).length > 0,
      hasCustomErrors: this.contractCode.includes('error '),
    };

    const score = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;

    return {
      checks,
      score,
      total,
      percentage: ((score / total) * 100).toFixed(1),
      grade: this.getGrade(score, total),
    };
  }

  analyzeComplexity() {
    const functions = this.contractCode.match(/function\s+\w+[\s\S]*?(?=\n\s*function|\n\s*})/g) || [];

    let totalComplexity = 0;
    const complexFunctions = [];

    functions.forEach(func => {
      const complexity = this.calculateCyclomaticComplexity(func);
      totalComplexity += complexity;

      if (complexity > 10) {
        const name = func.match(/function\s+(\w+)/)?.[1] || 'unknown';
        complexFunctions.push({ name, complexity });
      }
    });

    const avgComplexity = functions.length > 0 ? (totalComplexity / functions.length).toFixed(2) : 0;

    return {
      totalFunctions: functions.length,
      averageComplexity: avgComplexity,
      complexFunctions,
      recommendation: complexFunctions.length > 0
        ? 'Consider refactoring complex functions'
        : 'Good complexity levels',
    };
  }

  calculateCyclomaticComplexity(code) {
    let complexity = 1; // Base complexity

    // Count decision points
    const patterns = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /case\s+/g,
      /&&/g,
      /\|\|/g,
      /\?/g, // Ternary operator
    ];

    patterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) complexity += matches.length;
    });

    return complexity;
  }

  getGrade(score, total) {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    return 'D';
  }

  printReport(results) {
    console.log('\n📊 CONTRACT STRUCTURE');
    console.log('─'.repeat(80));
    console.log(`Total Lines:      ${results.structure.totalLines}`);
    console.log(`Code Lines:       ${results.structure.codeLines}`);
    console.log(`Contracts:        ${results.structure.contracts}`);
    console.log(`Functions:        ${results.structure.functions}`);
    console.log(`Modifiers:        ${results.structure.modifiers}`);
    console.log(`Events:           ${results.structure.events}`);
    console.log(`Imports:          ${results.structure.imports}`);

    console.log('\n📝 DOCUMENTATION');
    console.log('─'.repeat(80));
    console.log(`NatSpec Comments: ${results.documentation.natspecComments}`);
    console.log(`Inline Comments:  ${results.documentation.inlineComments}`);
    console.log(`Doc Coverage:     ${results.documentation.docCoverage}%`);
    console.log(`Quality:          ${results.documentation.quality}`);

    console.log('\n✅ BEST PRACTICES');
    console.log('─'.repeat(80));
    console.log(`Score:            ${results.bestPractices.score}/${results.bestPractices.total}`);
    console.log(`Percentage:       ${results.bestPractices.percentage}%`);
    console.log(`Grade:            ${results.bestPractices.grade}`);
    console.log('\nChecks:');
    Object.entries(results.bestPractices.checks).forEach(([check, passed]) => {
      const icon = passed ? '✓' : '✗';
      const status = passed ? 'PASS' : 'FAIL';
      console.log(`  ${icon} ${check.padEnd(25)} ${status}`);
    });

    console.log('\n🧮 COMPLEXITY ANALYSIS');
    console.log('─'.repeat(80));
    console.log(`Total Functions:  ${results.complexity.totalFunctions}`);
    console.log(`Avg Complexity:   ${results.complexity.averageComplexity}`);
    console.log(`Recommendation:   ${results.complexity.recommendation}`);

    if (results.complexity.complexFunctions.length > 0) {
      console.log('\n⚠️  Complex Functions (Complexity > 10):');
      results.complexity.complexFunctions.forEach(({ name, complexity }) => {
        console.log(`  • ${name}: ${complexity}`);
      });
    }

    console.log('\n' + '═'.repeat(80));
    console.log('✨ Analysis Complete!\n');

    // AI Suggestions
    console.log('🤖 AI SUGGESTIONS:');
    console.log('─'.repeat(80));
    this.generateSuggestions(results);
  }

  generateSuggestions(results) {
    const suggestions = [];

    if (results.documentation.docCoverage < 50) {
      suggestions.push('• Add NatSpec documentation to all public functions');
    }

    if (!results.bestPractices.checks.hasReentrancyGuard) {
      suggestions.push('• Consider adding ReentrancyGuard for functions handling ETH');
    }

    if (!results.bestPractices.checks.hasCustomErrors) {
      suggestions.push('• Use custom errors instead of revert strings to save gas');
    }

    if (results.complexity.complexFunctions.length > 0) {
      suggestions.push('• Refactor complex functions to improve maintainability');
    }

    if (results.structure.functions > 20) {
      suggestions.push('• Consider splitting contract into multiple contracts');
    }

    if (suggestions.length === 0) {
      console.log('✓ No major issues found! Contract follows best practices.\n');
    } else {
      suggestions.forEach(s => console.log(s));
      console.log('');
    }
  }
}

// Main execution
if (require.main === module) {
  const contractPath = path.join(__dirname, '../contracts/MyToken.sol');

  if (!fs.existsSync(contractPath)) {
    console.error('❌ Contract file not found:', contractPath);
    process.exit(1);
  }

  const analyzer = new ContractAnalyzer(contractPath);
  analyzer.analyze();
}

module.exports = ContractAnalyzer;
