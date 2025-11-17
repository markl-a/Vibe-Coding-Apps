# 📜 Smart Contracts - 智能合約範例

各種智能合約範例和開發工具，涵蓋常用的代幣標準和實用合約。

## 📋 專案列表

### 1. 🪙 [ERC20 Token](./erc20-token/) - ERC20 代幣合約
標準的可替代代幣實現，包括進階功能。

**特性**：
- ✅ 基本 ERC20 功能
- ✅ 鑄造和銷毀
- ✅ 暫停機制
- ✅ 快照功能
- ✅ 投票治理

**技術棧**: Solidity, OpenZeppelin, Hardhat

### 2. 🎨 [ERC721 NFT](./erc721-nft/) - ERC721 NFT 合約
非同質化代幣實現，支持元數據和版稅。

**特性**：
- ✅ ERC721 標準
- ✅ 元數據存儲
- ✅ ERC2981 版稅
- ✅ 批量鑄造
- ✅ 白名單機制

**技術棧**: Solidity, OpenZeppelin, Hardhat, IPFS

### 3. 🔐 [MultiSig Wallet](./multisig-wallet/) - 多簽錢包合約
多重簽名錢包，適合團隊資金管理。

**特性**：
- ✅ 多簽名驗證
- ✅ 交易提案與確認
- ✅ 所有者管理
- ✅ 每日限額
- ✅ 緊急凍結

**技術棧**: Solidity, Hardhat, Gnosis Safe

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

| 專案 | 狀態 | 測試覆蓋率 | 審計 |
|------|------|-----------|------|
| ERC20 Token | ✅ 完成 | 95% | ⏳ 待審計 |
| ERC721 NFT | ✅ 完成 | 92% | ⏳ 待審計 |
| MultiSig Wallet | ✅ 完成 | 98% | ⏳ 待審計 |

---

[返回 Blockchain Apps](../README.md)
