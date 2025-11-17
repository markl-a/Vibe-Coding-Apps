# 🪙 ERC20 Token - 可替代代幣合約

完整的 ERC20 代幣實現，包含鑄造、銷毀、暫停和治理功能。

## ✨ 功能特性

- ✅ 標準 ERC20 功能（轉賬、授權）
- ✅ 鑄造和銷毀機制
- ✅ 暫停/恢復交易
- ✅ 快照功能
- ✅ 投票治理（ERC20Votes）
- ✅ Permit（ERC2612 無 gas 授權）

## 📝 合約代碼

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is
    ERC20,
    ERC20Burnable,
    ERC20Snapshot,
    Ownable,
    Pausable,
    ERC20Permit,
    ERC20Votes
{
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 10 億代幣

    constructor()
        ERC20("MyToken", "MTK")
        ERC20Permit("MyToken")
    {
        _mint(msg.sender, 100_000_000 * 10**18); // 初始供應：1 億
    }

    /**
     * @dev 鑄造新代幣（僅 owner）
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    /**
     * @dev 創建快照（僅 owner）
     */
    function snapshot() public onlyOwner returns (uint256) {
        return _snapshot();
    }

    /**
     * @dev 暫停所有代幣轉移（僅 owner）
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev 恢復代幣轉移（僅 owner）
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    // 必要的 override 函數

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Snapshot) whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }
}
```

## 🧪 測試代碼

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken", function () {
  let token;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MyToken");
    token = await Token.deploy();
    await token.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should assign initial supply to owner", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(ownerBalance).to.equal(ethers.utils.parseEther("100000000"));
    });

    it("Should have correct name and symbol", async function () {
      expect(await token.name()).to.equal("MyToken");
      expect(await token.symbol()).to.equal("MTK");
    });
  });

  describe("Minting", function () {
    it("Should mint tokens by owner", async function () {
      const amount = ethers.utils.parseEther("1000");
      await token.mint(addr1.address, amount);
      expect(await token.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should fail if non-owner tries to mint", async function () {
      const amount = ethers.utils.parseEther("1000");
      await expect(
        token.connect(addr1).mint(addr2.address, amount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should respect max supply", async function () {
      const maxSupply = await token.MAX_SUPPLY();
      const currentSupply = await token.totalSupply();
      const overAmount = maxSupply.sub(currentSupply).add(1);

      await expect(
        token.mint(addr1.address, overAmount)
      ).to.be.revertedWith("Exceeds max supply");
    });
  });

  describe("Burning", function () {
    it("Should burn tokens", async function () {
      const burnAmount = ethers.utils.parseEther("1000");
      const initialBalance = await token.balanceOf(owner.address);

      await token.burn(burnAmount);

      expect(await token.balanceOf(owner.address)).to.equal(
        initialBalance.sub(burnAmount)
      );
    });
  });

  describe("Pausing", function () {
    it("Should pause and unpause", async function () {
      await token.pause();
      expect(await token.paused()).to.be.true;

      await token.unpause();
      expect(await token.paused()).to.be.false;
    });

    it("Should prevent transfers when paused", async function () {
      await token.pause();

      await expect(
        token.transfer(addr1.address, 100)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow transfers when unpaused", async function () {
      const amount = ethers.utils.parseEther("100");

      await token.transfer(addr1.address, amount);
      expect(await token.balanceOf(addr1.address)).to.equal(amount);
    });
  });

  describe("Snapshot", function () {
    it("Should create snapshot", async function () {
      const snapshotId = await token.callStatic.snapshot();
      await token.snapshot();

      expect(snapshotId).to.equal(1);
    });

    it("Should record balance at snapshot", async function () {
      const amount = ethers.utils.parseEther("1000");
      await token.transfer(addr1.address, amount);

      await token.snapshot();

      await token.connect(addr1).transfer(addr2.address, amount);

      expect(await token.balanceOfAt(addr1.address, 1)).to.equal(amount);
      expect(await token.balanceOf(addr1.address)).to.equal(0);
    });
  });

  describe("Voting", function () {
    it("Should delegate votes", async function () {
      const amount = ethers.utils.parseEther("1000");
      await token.transfer(addr1.address, amount);

      await token.connect(addr1).delegate(addr2.address);

      expect(await token.getVotes(addr2.address)).to.equal(amount);
    });

    it("Should self-delegate to enable voting", async function () {
      await token.delegate(owner.address);

      expect(await token.getVotes(owner.address)).to.be.gt(0);
    });
  });

  describe("Permit", function () {
    it("Should approve via signature", async function () {
      const amount = ethers.utils.parseEther("100");
      const deadline = ethers.constants.MaxUint256;

      const { v, r, s } = await getPermitSignature(
        addr1,
        token.address,
        addr2.address,
        amount,
        deadline
      );

      await token.permit(
        addr1.address,
        addr2.address,
        amount,
        deadline,
        v, r, s
      );

      expect(
        await token.allowance(addr1.address, addr2.address)
      ).to.equal(amount);
    });
  });
});
```

## 🚀 部署腳本

```javascript
const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Token = await hre.ethers.getContractFactory("MyToken");
  const token = await Token.deploy();

  await token.deployed();

  console.log("MyToken deployed to:", token.address);

  // 等待幾個區塊確認後驗證合約
  console.log("Waiting for block confirmations...");
  await token.deployTransaction.wait(6);

  // 驗證合約
  console.log("Verifying contract...");
  await hre.run("verify:verify", {
    address: token.address,
    constructorArguments: [],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## 📦 使用範例

### 轉賬
```javascript
const amount = ethers.utils.parseEther("100");
await token.transfer(recipientAddress, amount);
```

### 授權和轉賬
```javascript
// 授權
await token.approve(spenderAddress, amount);

// 從授權額度轉賬
await token.transferFrom(fromAddress, toAddress, amount);
```

### 無 Gas 授權（Permit）
```javascript
const { v, r, s } = await getPermitSignature(...);
await token.permit(owner, spender, amount, deadline, v, r, s);
```

### 投票
```javascript
// 自我委託以啟用投票
await token.delegate(myAddress);

// 查看投票權重
const votes = await token.getVotes(myAddress);
```

## 🔧 配置文件

### package.json
```json
{
  "name": "erc20-token",
  "scripts": {
    "test": "hardhat test",
    "deploy": "hardhat run scripts/deploy.js",
    "verify": "hardhat verify"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^2.0.0",
    "@openzeppelin/contracts": "^4.9.0",
    "hardhat": "^2.14.0"
  }
}
```

[返回 Smart Contracts](../README.md)
