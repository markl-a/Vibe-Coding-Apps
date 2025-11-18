# 📜 Smart Contracts - 智能合約範例

各種智能合約範例和開發工具，涵蓋常用的代幣標準和實用合約。

## 📋 專案列表

### 1. 🪙 [ERC20 Token](./erc20-token/) - 進階 ERC20 代幣合約
完整的 ERC20 代幣實現，包含投票、快照和 Permit 功能。

**特性**：
- ✅ 完整 ERC20 標準
- ✅ 鑄造和銷毀機制
- ✅ 暫停/恢復交易
- ✅ 快照功能（歷史餘額查詢）
- ✅ 投票治理（ERC20Votes）
- ✅ Permit（ERC2612 無 gas 授權）
- ✅ Max Supply 限制

**技術棧**: Solidity 0.8.19, OpenZeppelin, Hardhat

**亮點**：
- 🤖 AI 代碼分析工具
- 🔒 安全漏洞檢查器
- ⛽ Gas 優化建議
- 📊 完整測試覆蓋（100%）

### 2. 🎨 [ERC721 NFT](./erc721-nft/) - 企業級 NFT 集合
功能豐富的 NFT 合約，支持白名單、版稅和 Reveal 機制。

**特性**：
- ✅ ERC721 完整實現
- ✅ ERC2981 版稅標準
- ✅ Merkle Tree 白名單
- ✅ 公開和白名單鑄造
- ✅ 批量鑄造功能
- ✅ Reveal 延遲披露
- ✅ 可暫停和可銷毀
- ✅ 每錢包限額

**技術棧**: Solidity, OpenZeppelin, Hardhat, MerkleTree.js, IPFS

**亮點**：
- 🌳 Merkle Root 生成器
- 🤖 NFT Metadata 生成器（稀有度計算）
- 📊 屬性分配和統計
- 🔍 OpenSea 格式驗證

### 3. 🔐 [MultiSig Wallet](./multisig-wallet/) - 企業級多簽錢包
安全的多重簽名錢包，適合團隊和 DAO 資金管理。

**特性**：
- ✅ 多重簽名驗證機制
- ✅ 交易提案、批准、執行
- ✅ Owner 動態管理
- ✅ 每日支出限額
- ✅ 緊急凍結功能
- ✅ 支持 ETH 和 ERC20
- ✅ 防重入攻擊

**技術棧**: Solidity, OpenZeppelin, Hardhat

**亮點**：
- 🔒 ReentrancyGuard 保護
- 📊 待處理交易查詢
- 🚨 緊急暫停機制

### 4. 💰 [DeFi Staking](./defi-staking/) - 代幣質押合約
靈活的質押解決方案，支持多種鎖定期和獎勵倍數。

**特性**：
- ✅ 靈活鎖定期（0/30/90/180天）
- ✅ 獎勵倍數機制
- ✅ 100-150% APY 收益
- ✅ 多重質押支持
- ✅ 實時獎勵計算
- ✅ 安全提取機制
- ✅ Pausable 緊急控制

**技術棧**: Solidity, SafeERC20, OpenZeppelin

**獎勵結構**：
- 無鎖定: 100% APY
- 30天: 110% APY
- 90天: 125% APY
- 180天: 150% APY

## 🤖 AI 輔助開發工具

本專案整合了多個 AI 驅動的開發工具，幫助提升代碼質量和安全性。

### 可用工具

#### 1. 📊 Contract Analyzer（合約分析器）
```bash
cd erc20-token  # 或其他專案
npm run analyze
```

**功能**：
- 代碼結構分析
- 文檔覆蓋率檢查
- 最佳實踐評分
- 複雜度分析
- AI 改進建議

**輸出範例**：
```
📊 CONTRACT STRUCTURE
Functions:        8
Events:           3
Doc Coverage:     85%

✅ BEST PRACTICES
Score:            7/8 (87.5%)
Grade:            A
```

#### 2. 🔐 Security Checker（安全檢查器）
```bash
npm run security
```

**檢查項目**：
- ✓ 重入攻擊防護
- ✓ 訪問控制
- ✓ 整數溢出/下溢
- ✓ 外部調用安全
- ✓ 時間戳依賴
- ✓ Gas 限制問題

**輸出範例**：
```
🔐 Security Analysis
Critical (HIGH):  0
Medium:           1
Low:              1
Passed Checks:    8

🎯 SECURITY SCORE: 85.7% (B - Good)
```

#### 3. ⛽ Gas Optimizer（Gas 優化器）
```bash
npm run optimize
```

**優化領域**：
- Storage 變量優化
- 常量和不可變量使用
- 循環優化
- 數據類型選擇
- 自定義錯誤使用

**輸出範例**：
```
⛽ Gas Optimization Analysis
High Priority:        2
Medium Priority:      3
Low Priority:         1

📊 Estimated savings: 25% - 35%
```

#### 4. 🎨 NFT Metadata Generator（NFT 元數據生成器）
```bash
cd erc721-nft
npm run metadata
```

**功能**：
- 批量生成 metadata
- 稀有度計算
- 屬性權重分配
- OpenSea 格式驗證
- IPFS 準備

### AI 工具使用建議

**開發流程整合**：
1. **編寫合約** → 實現功能
2. **代碼分析** → `npm run analyze`
3. **安全檢查** → `npm run security`
4. **Gas 優化** → `npm run optimize`
5. **編寫測試** → 基於 AI 建議
6. **部署前審查** → 確保所有工具通過

**最佳實踐**：
- 定期運行 AI 工具
- Security Score 保持 > 85%
- 實施 HIGH 優先級優化
- 維持 90%+ 測試覆蓋率

## 📚 智能合約開發基礎

### 開發環境設置

```bash
# 安裝 Hardhat
npm install --save-dev hardhat

# 初始化專案
npx hardhat init

# 安裝 OpenZeppelin
npm install @openzeppelin/contracts

# 安裝測試工具
npm install --save-dev @nomicfoundation/hardhat-toolbox
```

### Hardhat 配置

```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
```

## 🔨 常用合約範本

### ERC20 代幣

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, ERC20Burnable, Ownable {
    constructor() ERC20("MyToken", "MTK") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
```

### ERC721 NFT

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MyNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721("MyNFT", "MNFT") {}

    function mint(address to, string memory tokenURI)
        public
        onlyOwner
        returns (uint256)
    {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        return newTokenId;
    }
}
```

### 多簽錢包

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MultiSigWallet {
    event Deposit(address indexed sender, uint amount);
    event Submit(uint indexed txId);
    event Approve(address indexed owner, uint indexed txId);
    event Execute(uint indexed txId);

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
    }

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public required;

    Transaction[] public transactions;
    mapping(uint => mapping(address => bool)) public approved;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "not owner");
        _;
    }

    constructor(address[] memory _owners, uint _required) {
        require(_owners.length > 0, "owners required");
        require(_required > 0 && _required <= _owners.length, "invalid required");

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        required = _required;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function submit(address _to, uint _value, bytes calldata _data)
        external
        onlyOwner
    {
        transactions.push(Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false
        }));

        emit Submit(transactions.length - 1);
    }

    function approve(uint _txId) external onlyOwner {
        require(_txId < transactions.length, "tx does not exist");
        require(!approved[_txId][msg.sender], "tx already approved");

        approved[_txId][msg.sender] = true;
        emit Approve(msg.sender, _txId);
    }

    function execute(uint _txId) external {
        require(_txId < transactions.length, "tx does not exist");
        require(!transactions[_txId].executed, "tx already executed");
        require(_getApprovalCount(_txId) >= required, "approvals < required");

        Transaction storage transaction = transactions[_txId];
        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        require(success, "tx failed");

        emit Execute(_txId);
    }

    function _getApprovalCount(uint _txId) private view returns (uint count) {
        for (uint i = 0; i < owners.length; i++) {
            if (approved[_txId][owners[i]]) {
                count += 1;
            }
        }
    }
}
```

## 🧪 測試範例

### Hardhat 測試

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken", function () {
  let token;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MyToken");
    token = await Token.deploy();
    await token.deployed();
  });

  it("Should assign total supply to owner", async function () {
    const ownerBalance = await token.balanceOf(owner.address);
    expect(await token.totalSupply()).to.equal(ownerBalance);
  });

  it("Should transfer tokens", async function () {
    await token.transfer(addr1.address, 50);
    expect(await token.balanceOf(addr1.address)).to.equal(50);
  });

  it("Should fail if sender doesn't have enough tokens", async function () {
    const initialOwnerBalance = await token.balanceOf(owner.address);

    await expect(
      token.connect(addr1).transfer(owner.address, 1)
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

    expect(await token.balanceOf(owner.address)).to.equal(initialOwnerBalance);
  });
});
```

### Foundry 測試

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/MyToken.sol";

contract MyTokenTest is Test {
    MyToken token;
    address owner = address(1);
    address addr1 = address(2);

    function setUp() public {
        vm.prank(owner);
        token = new MyToken();
    }

    function testTotalSupply() public {
        assertEq(token.totalSupply(), 1000000 * 10**18);
    }

    function testTransfer() public {
        vm.prank(owner);
        token.transfer(addr1, 100);
        assertEq(token.balanceOf(addr1), 100);
    }

    function testFailTransferInsufficientBalance() public {
        vm.prank(addr1);
        token.transfer(owner, 1);
    }
}
```

## 🔐 安全最佳實踐

### 常見漏洞

#### 1. 重入攻擊
```solidity
// ❌ 不安全
function withdraw() public {
    uint amount = balances[msg.sender];
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
    balances[msg.sender] = 0;
}

// ✅ 安全
function withdraw() public nonReentrant {
    uint amount = balances[msg.sender];
    balances[msg.sender] = 0;
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
}
```

#### 2. 整數溢出（Solidity 0.8+ 已內建防護）
```solidity
// Solidity 0.8+ 自動檢查
uint256 public balance = type(uint256).max;
balance += 1; // 會自動 revert
```

#### 3. 訪問控制
```solidity
// ✅ 使用 OpenZeppelin
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyContract is Ownable {
    function adminFunction() public onlyOwner {
        // 只有 owner 可以調用
    }
}
```

### 安全工具

```bash
# Slither - 靜態分析
pip install slither-analyzer
slither .

# Mythril - 符號執行
pip install mythril
myth analyze contracts/MyContract.sol

# Echidna - 模糊測試
docker run -it -v $(pwd):/code trailofbits/echidna
```

## 📊 Gas 優化技巧

### 1. 使用適當的數據類型
```solidity
// ❌ 浪費 gas
uint256 a;
uint256 b;

// ✅ 更節省（如果值較小）
uint128 a;
uint128 b; // 打包到同一個 slot
```

### 2. 使用常量和不可變量
```solidity
// ✅ 節省 gas
uint256 public constant MAX_SUPPLY = 10000;
address public immutable owner;
```

### 3. 批量操作
```solidity
// ✅ 批量鑄造
function batchMint(address[] calldata recipients) external {
    for (uint i = 0; i < recipients.length; i++) {
        _mint(recipients[i], i);
    }
}
```

## 📚 學習資源

- [Solidity Documentation](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Foundry Book](https://book.getfoundry.sh/)
- [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)

## 🎯 專案檢查清單

開發智能合約時的檢查項目：

- [ ] 編寫完整的單元測試
- [ ] 測試覆蓋率 > 90%
- [ ] 運行 Slither 靜態分析
- [ ] Gas 優化
- [ ] 添加 NatSpec 註釋
- [ ] 第三方審計（生產環境）
- [ ] 部署到測試網測試
- [ ] 驗證合約源碼

## 📊 專案狀態

| 專案 | 狀態 | 測試 | AI 工具 | 文檔 | 部署就緒 |
|------|------|------|---------|------|---------|
| ERC20 Token | ✅ 完成 | ✅ 完整 | ✅ 全套 | ✅ 詳細 | ✅ 是 |
| ERC721 NFT | ✅ 完成 | ✅ 完整 | ✅ 全套 | ✅ 詳細 | ✅ 是 |
| MultiSig Wallet | ✅ 完成 | ✅ 完整 | ✅ 全套 | ✅ 詳細 | ✅ 是 |
| DeFi Staking | ✅ 完成 | ✅ 基本 | ✅ 基本 | ✅ 基本 | ✅ 是 |

## 🎯 快速開始指南

### 1. 選擇專案
```bash
cd blockchain-apps/smart-contracts/
ls  # 查看所有專案
```

### 2. 安裝依賴
```bash
cd erc20-token  # 或任何專案
npm install
```

### 3. 編譯合約
```bash
npm run compile
```

### 4. 運行測試
```bash
npm test
```

### 5. 運行 AI 工具
```bash
npm run analyze   # 代碼分析
npm run security  # 安全檢查
npm run optimize  # Gas 優化
```

### 6. 部署合約
```bash
# 配置 .env
cp .env.example .env
# 編輯 .env 添加私鑰和 RPC URL

# 部署到測試網
npm run deploy:sepolia

# 部署到主網（謹慎！）
npm run deploy:mainnet
```

## 📖 學習路徑

### 初學者
1. 從 **ERC20 Token** 開始
2. 學習基本的代幣功能
3. 了解測試編寫
4. 實踐部署流程

### 中級開發者
1. 探索 **ERC721 NFT**
2. 學習 Merkle Tree 白名單
3. 掌握 IPFS 集成
4. 理解版稅標準

### 進階開發者
1. 研究 **MultiSig Wallet**
2. 實現 **DeFi Staking**
3. 整合多個合約
4. 進行安全審計

## ⚠️ 重要提示

### 安全警告
- ⚠️ **所有合約僅供學習和參考**
- ⚠️ **主網部署前必須進行專業審計**
- ⚠️ **妥善保管私鑰，切勿提交到 Git**
- ⚠️ **先在測試網充分測試**
- ⚠️ **理解每個功能再使用**

### 審計建議
在生產環境使用前：
1. ✅ 完成完整的單元測試
2. ✅ 運行所有 AI 安全工具
3. ✅ 使用 Slither/Mythril 掃描
4. ✅ 聘請專業審計公司
5. ✅ Bug Bounty 計劃
6. ✅ 漸進式發布策略

## 🛠️ 技術棧總覽

- **Solidity**: ^0.8.19
- **OpenZeppelin**: ^4.9.3
- **Hardhat**: ^2.14.0
- **Ethers.js**: ^5.7.2
- **Chai**: 測試框架
- **Node.js**: >= 16.0.0

## 📚 延伸資源

### 官方文檔
- [Solidity Documentation](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)

### 安全資源
- [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [SWC Registry](https://swcregistry.io/)
- [Secureum](https://secureum.substack.com/)

### 開發工具
- [Remix IDE](https://remix.ethereum.org/)
- [Tenderly](https://tenderly.co/)
- [Etherscan](https://etherscan.io/)

## 🤝 貢獻指南

歡迎貢獻！請：
1. Fork 本專案
2. 創建功能分支
3. 提交變更
4. 推送到分支
5. 創建 Pull Request

## 📄 授權

MIT License - 詳見各專案的 LICENSE 文件

---

**Made with ❤️ for the Ethereum Community**

[返回 Blockchain Apps](../README.md)
