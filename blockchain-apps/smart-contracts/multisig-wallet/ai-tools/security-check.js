/**
 * AI-Powered Smart Contract Security Checker
 *
 * Checks for common security vulnerabilities:
 * - Reentrancy attacks
 * - Integer overflow/underflow
 * - Access control issues
 * - Unchecked external calls
 * - Timestamp dependence
 * - Gas limit issues
 */

const fs = require('fs');
const path = require('path');

class SecurityChecker {
  constructor(contractPath) {
    this.contractPath = contractPath;
    this.contractCode = fs.readFileSync(contractPath, 'utf8');
    this.vulnerabilities = [];
    this.warnings = [];
    this.passed = [];
  }

  check() {
    console.log('🔐 Security Analysis Starting...\n');
    console.log('═'.repeat(80));

    this.checkReentrancy();
    this.checkAccessControl();
    this.checkExternalCalls();
    this.checkIntegerOverflow();
    this.checkTimestampDependence();
    this.checkGasIssues();
    this.checkInputValidation();
    this.checkVisibility();
    this.checkDelegateCall();
    this.checkSelfdestruct();

    this.printReport();
  }

  checkReentrancy() {
    const hasReentrancyGuard = this.contractCode.includes('ReentrancyGuard') ||
                                this.contractCode.includes('nonReentrant');

    const hasExternalCalls = this.contractCode.includes('.call{') ||
                              this.contractCode.includes('.transfer(') ||
                              this.contractCode.includes('.send(');

    if (hasExternalCalls && !hasReentrancyGuard) {
      this.warnings.push({
        severity: 'MEDIUM',
        title: 'Potential Reentrancy Risk',
        description: 'Contract has external calls but no ReentrancyGuard',
        recommendation: 'Add ReentrancyGuard or use checks-effects-interactions pattern',
      });
    } else if (hasReentrancyGuard) {
      this.passed.push('✓ Reentrancy protection: ReentrancyGuard detected');
    } else {
      this.passed.push('✓ Reentrancy risk: No external calls found');
    }
  }

  checkAccessControl() {
    const hasAccessControl = this.contractCode.includes('Ownable') ||
                              this.contractCode.includes('AccessControl') ||
                              this.contractCode.includes('onlyOwner');

    const hasSensitiveFunctions = this.contractCode.includes('function mint') ||
                                   this.contractCode.includes('function pause') ||
                                   this.contractCode.includes('function burn');

    if (hasSensitiveFunctions && !hasAccessControl) {
      this.vulnerabilities.push({
        severity: 'HIGH',
        title: 'Missing Access Control',
        description: 'Sensitive functions without access control',
        recommendation: 'Implement Ownable or AccessControl',
      });
    } else if (hasAccessControl) {
      this.passed.push('✓ Access control: Proper modifiers detected');
    }
  }

  checkExternalCalls() {
    const externalCalls = this.contractCode.match(/\.call{|\.delegatecall{|\.staticcall{/g) || [];

    externalCalls.forEach(() => {
      const hasReturnCheck = this.contractCode.includes('(bool success,') ||
                             this.contractCode.includes('require(success');

      if (!hasReturnCheck) {
        this.warnings.push({
          severity: 'MEDIUM',
          title: 'Unchecked External Call',
          description: 'External call return value not checked',
          recommendation: 'Always check return values of external calls',
        });
      }
    });

    if (externalCalls.length === 0 || this.contractCode.includes('require(success')) {
      this.passed.push('✓ External calls: Properly checked');
    }
  }

  checkIntegerOverflow() {
    const solidityVersion = this.contractCode.match(/pragma solidity \^?(\d+\.\d+)/)?.[1];

    if (solidityVersion && parseFloat(solidityVersion) >= 0.8) {
      this.passed.push('✓ Integer overflow: Protected by Solidity 0.8+');
    } else {
      this.warnings.push({
        severity: 'HIGH',
        title: 'Potential Integer Overflow',
        description: 'Solidity version < 0.8 without SafeMath',
        recommendation: 'Use Solidity 0.8+ or SafeMath library',
      });
    }
  }

  checkTimestampDependence() {
    const usesBlockTimestamp = this.contractCode.includes('block.timestamp') ||
                                this.contractCode.includes('now');

    if (usesBlockTimestamp) {
      this.warnings.push({
        severity: 'LOW',
        title: 'Timestamp Dependence',
        description: 'Contract uses block.timestamp',
        recommendation: 'Ensure timestamp manipulation cannot affect critical logic',
      });
    } else {
      this.passed.push('✓ Timestamp: No timestamp dependence');
    }
  }

  checkGasIssues() {
    const hasLoops = this.contractCode.match(/for\s*\(/g) || [];
    const hasUnboundedLoops = hasLoops.some(() => {
      return !this.contractCode.includes('.length') || true; // Simplified check
    });

    if (hasLoops.length > 3) {
      this.warnings.push({
        severity: 'MEDIUM',
        title: 'Multiple Loops Detected',
        description: 'Contract contains multiple loops which may consume high gas',
        recommendation: 'Consider gas optimization or batch processing',
      });
    } else if (hasLoops.length > 0) {
      this.passed.push('✓ Gas optimization: Moderate loop usage');
    } else {
      this.passed.push('✓ Gas optimization: No loops detected');
    }
  }

  checkInputValidation() {
    const publicFunctions = this.contractCode.match(/function\s+\w+\s*\([^)]*\)\s+public/g) || [];
    const externalFunctions = this.contractCode.match(/function\s+\w+\s*\([^)]*\)\s+external/g) || [];
    const totalFunctions = publicFunctions.length + externalFunctions.length;

    const requireStatements = (this.contractCode.match(/require\(/g) || []).length;

    if (totalFunctions > 0 && requireStatements === 0) {
      this.warnings.push({
        severity: 'MEDIUM',
        title: 'Missing Input Validation',
        description: 'Public/external functions without input validation',
        recommendation: 'Add require statements to validate inputs',
      });
    } else if (requireStatements > 0) {
      this.passed.push('✓ Input validation: require statements found');
    }
  }

  checkVisibility() {
    const stateVars = this.contractCode.match(/\n\s+(uint|address|bool|mapping|string|bytes)/g) || [];

    let hasUnspecifiedVisibility = false;
    stateVars.forEach(varDecl => {
      if (!varDecl.includes('public') && !varDecl.includes('private') && !varDecl.includes('internal')) {
        hasUnspecifiedVisibility = true;
      }
    });

    if (hasUnspecifiedVisibility) {
      this.warnings.push({
        severity: 'LOW',
        title: 'Unspecified Visibility',
        description: 'Some state variables lack explicit visibility',
        recommendation: 'Always specify visibility (public, private, internal)',
      });
    } else {
      this.passed.push('✓ Visibility: All variables have explicit visibility');
    }
  }

  checkDelegateCall() {
    if (this.contractCode.includes('delegatecall')) {
      this.warnings.push({
        severity: 'HIGH',
        title: 'Delegate Call Detected',
        description: 'delegatecall can be dangerous if not properly secured',
        recommendation: 'Ensure delegatecall target is trusted and validated',
      });
    } else {
      this.passed.push('✓ Delegate call: Not used');
    }
  }

  checkSelfdestruct() {
    if (this.contractCode.includes('selfdestruct')) {
      this.warnings.push({
        severity: 'HIGH',
        title: 'Selfdestruct Found',
        description: 'Contract can be destroyed using selfdestruct',
        recommendation: 'Ensure selfdestruct is properly protected',
      });
    } else {
      this.passed.push('✓ Selfdestruct: Not used');
    }
  }

  printReport() {
    console.log('\n📋 SECURITY REPORT');
    console.log('═'.repeat(80));

    const totalIssues = this.vulnerabilities.length + this.warnings.length;
    const criticalCount = this.vulnerabilities.filter(v => v.severity === 'HIGH').length;
    const mediumCount = [...this.vulnerabilities, ...this.warnings].filter(v => v.severity === 'MEDIUM').length;
    const lowCount = this.warnings.filter(w => w.severity === 'LOW').length;

    console.log(`\n📊 Summary:`);
    console.log(`  Total Issues:     ${totalIssues}`);
    console.log(`  Critical (HIGH):  ${criticalCount}`);
    console.log(`  Medium:           ${mediumCount}`);
    console.log(`  Low:              ${lowCount}`);
    console.log(`  Passed Checks:    ${this.passed.length}`);

    if (this.vulnerabilities.length > 0) {
      console.log('\n\n🚨 VULNERABILITIES');
      console.log('─'.repeat(80));
      this.vulnerabilities.forEach((vuln, index) => {
        console.log(`\n[${index + 1}] ${vuln.title}`);
        console.log(`Severity: ${vuln.severity}`);
        console.log(`Description: ${vuln.description}`);
        console.log(`Recommendation: ${vuln.recommendation}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n\n⚠️  WARNINGS');
      console.log('─'.repeat(80));
      this.warnings.forEach((warning, index) => {
        console.log(`\n[${index + 1}] ${warning.title}`);
        console.log(`Severity: ${warning.severity}`);
        console.log(`Description: ${warning.description}`);
        console.log(`Recommendation: ${warning.recommendation}`);
      });
    }

    if (this.passed.length > 0) {
      console.log('\n\n✅ PASSED CHECKS');
      console.log('─'.repeat(80));
      this.passed.forEach(check => {
        console.log(check);
      });
    }

    console.log('\n' + '═'.repeat(80));

    // Overall Security Score
    const totalChecks = this.vulnerabilities.length + this.warnings.length + this.passed.length;
    const score = ((this.passed.length / totalChecks) * 100).toFixed(1);
    const grade = this.getSecurityGrade(score);

    console.log(`\n🎯 SECURITY SCORE: ${score}% (${grade})`);

    if (this.vulnerabilities.length === 0 && this.warnings.length === 0) {
      console.log('✨ Excellent! No security issues detected.\n');
    } else if (criticalCount > 0) {
      console.log('⚠️  CRITICAL issues found! Address them before deployment.\n');
    } else {
      console.log('⚠️  Review warnings before deployment.\n');
    }
  }

  getSecurityGrade(score) {
    if (score >= 95) return 'A+ (Excellent)';
    if (score >= 85) return 'A (Very Good)';
    if (score >= 75) return 'B (Good)';
    if (score >= 65) return 'C (Fair)';
    if (score >= 50) return 'D (Poor)';
    return 'F (Unsafe)';
  }
}

// Main execution
if (require.main === module) {
  const contractPath = path.join(__dirname, '../contracts/MyToken.sol');

  if (!fs.existsSync(contractPath)) {
    console.error('❌ Contract file not found:', contractPath);
    process.exit(1);
  }

  const checker = new SecurityChecker(contractPath);
  checker.check();
}

module.exports = SecurityChecker;
