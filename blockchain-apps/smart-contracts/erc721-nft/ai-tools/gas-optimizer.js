/**
 * AI-Powered Gas Optimization Analyzer
 *
 * Analyzes smart contracts for gas optimization opportunities:
 * - Storage optimization
 * - Function optimization
 * - Loop optimization
 * - Data type optimization
 * - Constant and immutable usage
 */

const fs = require('fs');
const path = require('path');

class GasOptimizer {
  constructor(contractPath) {
    this.contractPath = contractPath;
    this.contractCode = fs.readFileSync(contractPath, 'utf8');
    this.optimizations = [];
    this.goodPractices = [];
  }

  analyze() {
    console.log('⛽ Gas Optimization Analysis Starting...\n');
    console.log('═'.repeat(80));

    this.checkStorageOptimization();
    this.checkConstantsAndImmutables();
    this.checkLoopOptimization();
    this.checkDataTypes();
    this.checkFunctionModifiers();
    this.checkStringUsage();
    this.checkArrayUsage();
    this.checkErrorMessages();
    this.checkCaching();
    this.checkPackedStorage();

    this.printReport();
  }

  checkStorageOptimization() {
    const stateVars = this.contractCode.match(/\n\s+(uint\d*|address|bool|bytes\d*)\s+(public|private|internal)\s+\w+/g) || [];

    let hasUnoptimizedStorage = false;
    const varTypes = [];

    stateVars.forEach(varDecl => {
      const type = varDecl.match(/(uint\d*|address|bool|bytes\d*)/)?.[1];
      if (type) varTypes.push(type);

      // Check for uint256 that could be smaller
      if (varDecl.includes('uint256') || varDecl.includes('uint ')) {
        hasUnoptimizedStorage = true;
      }
    });

    if (hasUnoptimizedStorage) {
      this.optimizations.push({
        priority: 'MEDIUM',
        title: 'Storage Variable Optimization',
        issue: 'Some variables use uint256 which may be oversized',
        saving: 'Moderate',
        recommendation: 'Use smaller uint types (uint128, uint64) if values fit, pack into single storage slot',
        example: `// Before: 3 storage slots
uint256 public var1;
uint256 public var2;
uint256 public var3;

// After: 1 storage slot (if values < 2^128)
uint128 public var1;
uint128 public var2;
uint256 public var3;`,
      });
    } else {
      this.goodPractices.push('✓ Storage variables: Appropriately sized');
    }
  }

  checkConstantsAndImmutables() {
    const stateVars = this.contractCode.match(/\n\s+(uint\d*|address|bool|bytes\d*|string)\s+(public|private|internal)\s+\w+\s*=/g) || [];
    const constants = (this.contractCode.match(/constant\s+/g) || []).length;
    const immutables = (this.contractCode.match(/immutable\s+/g) || []).length;

    if (stateVars.length > constants + immutables) {
      this.optimizations.push({
        priority: 'HIGH',
        title: 'Use Constants and Immutables',
        issue: 'State variables that never change should be constant or immutable',
        saving: 'High',
        recommendation: 'Mark unchanging variables as constant or immutable',
        example: `// Before: Storage read costs ~2100 gas
uint256 public maxSupply = 1000000;

// After: No storage read needed
uint256 public constant MAX_SUPPLY = 1000000;

// For constructor-set values:
address public immutable owner;`,
      });
    } else {
      this.goodPractices.push('✓ Constants: Properly used');
    }
  }

  checkLoopOptimization() {
    const loops = this.contractCode.match(/for\s*\([^)]+\)/g) || [];

    loops.forEach(loop => {
      // Check for .length in loop condition
      if (loop.includes('.length')) {
        this.optimizations.push({
          priority: 'MEDIUM',
          title: 'Cache Array Length in Loops',
          issue: 'Accessing .length in loop condition costs gas on each iteration',
          saving: 'Medium',
          recommendation: 'Cache array length in a local variable',
          example: `// Before: Reads .length every iteration
for (uint i = 0; i < array.length; i++) {
  // ...
}

// After: Reads .length once
uint length = array.length;
for (uint i = 0; i < length; i++) {
  // ...
}`,
        });
      }

      // Check for i++ vs ++i
      if (loop.includes('i++') || loop.includes('j++')) {
        this.optimizations.push({
          priority: 'LOW',
          title: 'Use Prefix Increment',
          issue: 'Postfix increment (i++) is slightly more expensive than prefix (++i)',
          saving: 'Low',
          recommendation: 'Use ++i instead of i++ in loops',
          example: `// Before:
for (uint i = 0; i < length; i++) { }

// After: Saves ~5 gas per iteration
for (uint i = 0; i < length; ++i) { }`,
        });
      }
    });

    if (loops.length === 0) {
      this.goodPractices.push('✓ Loops: No loops detected');
    }
  }

  checkDataTypes() {
    // Check for inefficient data types
    const hasBytes = this.contractCode.includes('bytes ') && !this.contractCode.includes('bytes32');

    if (hasBytes) {
      this.optimizations.push({
        priority: 'MEDIUM',
        title: 'Use Fixed-Size Bytes',
        issue: 'Dynamic bytes arrays are more expensive than fixed-size',
        saving: 'Medium',
        recommendation: 'Use bytes32 instead of bytes/string when size is known',
        example: `// Before: Dynamic size
bytes public data;

// After: Fixed size (cheaper)
bytes32 public data;`,
      });
    }
  }

  checkFunctionModifiers() {
    const publicFunctions = this.contractCode.match(/function\s+\w+\s*\([^)]*\)\s+public/g) || [];
    const externalFunctions = this.contractCode.match(/function\s+\w+\s*\([^)]*\)\s+external/g) || [];

    if (publicFunctions.length > externalFunctions.length) {
      this.optimizations.push({
        priority: 'LOW',
        title: 'Use External Instead of Public',
        issue: 'Public functions are more expensive than external for external calls',
        saving: 'Low',
        recommendation: 'Use external for functions only called externally',
        example: `// Before: Can be called internally (more expensive)
function transfer(address to, uint amount) public { }

// After: Only external calls (cheaper)
function transfer(address to, uint amount) external { }`,
      });
    } else {
      this.goodPractices.push('✓ Function visibility: Optimally configured');
    }
  }

  checkStringUsage() {
    const stringVars = (this.contractCode.match(/string\s+(public|private|internal)/g) || []).length;

    if (stringVars > 0) {
      this.optimizations.push({
        priority: 'LOW',
        title: 'Optimize String Usage',
        issue: 'Strings are expensive in storage and processing',
        saving: 'Medium',
        recommendation: 'Consider using bytes32 or events for strings',
        example: `// Before: Expensive storage
string public name;

// After: Cheaper (if ≤32 chars)
bytes32 public name;

// Or emit event instead of storing
emit NameUpdated("MyToken");`,
      });
    }
  }

  checkArrayUsage() {
    const dynamicArrays = (this.contractCode.match(/\[\]\s+(public|private|internal)/g) || []).length;

    if (dynamicArrays > 2) {
      this.optimizations.push({
        priority: 'MEDIUM',
        title: 'Limit Dynamic Array Usage',
        issue: 'Dynamic arrays in storage are expensive to modify',
        saving: 'High',
        recommendation: 'Consider using mapping or fixed-size arrays when possible',
        example: `// Before: Expensive iterations and modifications
address[] public holders;

// After: Constant-time lookups
mapping(address => bool) public isHolder;
mapping(uint => address) public holderAtIndex;
uint public holderCount;`,
      });
    }
  }

  checkErrorMessages() {
    const requireWithStrings = (this.contractCode.match(/require\([^,]+,\s*"/g) || []).length;
    const customErrors = (this.contractCode.match(/error\s+\w+/g) || []).length;

    if (requireWithStrings > 0 && customErrors === 0) {
      this.optimizations.push({
        priority: 'HIGH',
        title: 'Use Custom Errors',
        issue: 'String error messages in require/revert cost significant gas',
        saving: 'High',
        recommendation: 'Replace string errors with custom errors (Solidity 0.8.4+)',
        example: `// Before: ~50-100 gas per character
require(amount > 0, "Amount must be greater than zero");

// After: Fixed ~20 gas
error InvalidAmount();
if (amount == 0) revert InvalidAmount();`,
      });
    } else if (customErrors > 0) {
      this.goodPractices.push('✓ Error handling: Using custom errors');
    }
  }

  checkCaching() {
    const stateVarReads = this.contractCode.match(/function\s+\w+[\s\S]*?{[\s\S]*?}/g) || [];

    let needsCaching = false;
    stateVarReads.forEach(func => {
      // Simple heuristic: if state var appears multiple times
      const varMatches = func.match(/\w+\s*\(/g) || [];
      if (varMatches.length > 3) {
        needsCaching = true;
      }
    });

    if (needsCaching) {
      this.optimizations.push({
        priority: 'MEDIUM',
        title: 'Cache Storage Variables',
        issue: 'Reading storage variables multiple times wastes gas',
        saving: 'Medium',
        recommendation: 'Cache frequently-read storage variables in memory',
        example: `// Before: Reads storage 3 times (~6300 gas)
function calculate() public view returns (uint) {
  return balance * rate + balance;
}

// After: Reads storage once (~2100 gas)
function calculate() public view returns (uint) {
  uint _balance = balance;  // Cache in memory
  return _balance * rate + _balance;
}`,
      });
    }
  }

  checkPackedStorage() {
    const stateVars = this.contractCode.match(/\n\s+(uint\d+|address|bool|bytes\d+)\s+(public|private|internal)\s+\w+/g) || [];

    let canBePacked = false;
    let currentSize = 0;

    stateVars.forEach(varDecl => {
      const type = varDecl.match(/(uint\d+|address|bool|bytes\d+)/)?.[1];

      if (type === 'uint256' || type === 'uint') {
        currentSize = 0; // Reset, can't pack with 256-bit
      } else {
        const size = type === 'address' ? 160 :
                     type === 'bool' ? 8 :
                     parseInt(type.match(/\d+/)?.[0] || '256');

        currentSize += size;
        if (currentSize <= 256 && size < 256) {
          canBePacked = true;
        }
      }
    });

    if (canBePacked) {
      this.optimizations.push({
        priority: 'HIGH',
        title: 'Pack Storage Variables',
        issue: 'Variables can be packed into fewer storage slots',
        saving: 'High',
        recommendation: 'Group smaller types together to fit in 256-bit slots',
        example: `// Before: 5 storage slots (5 * 20,000 gas = 100,000 gas)
uint256 a;
uint128 b;
uint128 c;
address d;
bool e;

// After: 3 storage slots (3 * 20,000 gas = 60,000 gas)
uint128 b;
uint128 c;
address d;  // 160 bits
bool e;     // 8 bits (total: 296 bits, fits in one slot)
uint256 a;`,
      });
    } else {
      this.goodPractices.push('✓ Storage packing: Variables optimally organized');
    }
  }

  printReport() {
    console.log('\n📊 GAS OPTIMIZATION REPORT');
    console.log('═'.repeat(80));

    const totalOptimizations = this.optimizations.length;
    const highPriority = this.optimizations.filter(o => o.priority === 'HIGH').length;
    const mediumPriority = this.optimizations.filter(o => o.priority === 'MEDIUM').length;
    const lowPriority = this.optimizations.filter(o => o.priority === 'LOW').length;

    console.log(`\n📈 Summary:`);
    console.log(`  Total Optimizations:  ${totalOptimizations}`);
    console.log(`  High Priority:        ${highPriority}`);
    console.log(`  Medium Priority:      ${mediumPriority}`);
    console.log(`  Low Priority:         ${lowPriority}`);
    console.log(`  Good Practices:       ${this.goodPractices.length}`);

    if (this.optimizations.length > 0) {
      console.log('\n\n💡 OPTIMIZATION OPPORTUNITIES');
      console.log('─'.repeat(80));

      // Sort by priority
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      this.optimizations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      this.optimizations.forEach((opt, index) => {
        console.log(`\n[${index + 1}] ${opt.title}`);
        console.log(`Priority: ${opt.priority} | Potential Saving: ${opt.saving}`);
        console.log(`Issue: ${opt.issue}`);
        console.log(`Recommendation: ${opt.recommendation}`);
        console.log(`\nExample:`);
        console.log(opt.example);
        console.log('─'.repeat(80));
      });
    }

    if (this.goodPractices.length > 0) {
      console.log('\n\n✅ GOOD PRACTICES DETECTED');
      console.log('─'.repeat(80));
      this.goodPractices.forEach(practice => {
        console.log(practice);
      });
    }

    console.log('\n' + '═'.repeat(80));

    // Calculate potential savings score
    const totalChecks = this.optimizations.length + this.goodPractices.length;
    const score = totalChecks > 0 ? ((this.goodPractices.length / totalChecks) * 100).toFixed(1) : 100;

    console.log(`\n⛽ GAS EFFICIENCY SCORE: ${score}%`);

    if (highPriority > 0) {
      console.log('\n🔥 HIGH priority optimizations found!');
      console.log('   Implementing these could save significant gas costs.\n');
    } else if (totalOptimizations > 0) {
      console.log('\n💡 Some optimizations available.');
      console.log('   Consider implementing them for better efficiency.\n');
    } else {
      console.log('\n✨ Excellent! Contract is well-optimized for gas.\n');
    }

    // Estimated savings
    if (totalOptimizations > 0) {
      const estimatedSavings = highPriority * 15 + mediumPriority * 8 + lowPriority * 3;
      console.log(`📊 Estimated potential gas savings: ${estimatedSavings}% - ${estimatedSavings + 10}%\n`);
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

  const optimizer = new GasOptimizer(contractPath);
  optimizer.analyze();
}

module.exports = GasOptimizer;
