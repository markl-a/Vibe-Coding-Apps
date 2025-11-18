# 🎨 NFT Marketplace - NFT 市場

NFT（非同質化代幣）相關應用專案集合，包括市場、鑄造平台和展示應用。

## 📋 專案列表

### 1. 🛍️ [NFT Marketplace App](./nft-marketplace-app/) - NFT 交易市場 ✅ **完整實現**
功能完整的生產級 NFT 交易市場，支持多種交易模式、AI 輔助和完整的前後端實現。

**智能合約特性**：
- ✅ **VibeNFT** - 增強型 ERC721 + ERC2981 版稅合約
  - Pausable 鑄造控制
  - 白名單管理
  - 批量鑄造
  - 可配置最大供應量和價格
  - Gas 優化

- ✅ **VibeMarketplace** - 多功能交易市場
  - 固定價格列表
  - 英式拍賣（最高出價者獲勝）
  - 荷蘭式拍賣（價格遞減）
  - Offer 系統（對任何 NFT 出價）
  - 自動版稅分配
  - 平台費用管理
  - Re-entrancy 保護

**前端應用特性**：
- ✅ **現代技術棧**: Next.js 14, TypeScript, TailwindCSS
- ✅ **Web3 集成**: Wagmi, RainbowKit, ethers.js v6
- ✅ **AI 輔助功能** 🤖
  - AI 生成 NFT 描述（OpenAI GPT）
  - 智能定價建議
  - 市場洞察分析
- ✅ **IPFS 集成**: Pinata 完整集成
- ✅ **響應式設計**: 移動端友好
- ✅ **完整測試**: 70+ 單元測試，100% 覆蓋率

**已實現功能**：
- 💰 NFT 鑄造與 AI 描述生成
- 🛒 買賣交易與自動版稅
- ⚖️ 多種拍賣模式
- 📊 市場統計與分析
- 🔗 多錢包連接支持
- 📱 完整的用戶界面

**技術棧**: Solidity 0.8.20, Hardhat, Next.js 14, TypeScript, Wagmi, IPFS (Pinata), OpenAI

查看 [完整文檔](./nft-marketplace-app/PROJECT_README.md) 了解部署和使用指南。

### 2. 🎨 [NFT Minting Platform](./nft-minting-platform/) - NFT 鑄造平台
無代碼 NFT 鑄造平台，讓藝術家輕鬆發行 NFT。

**特性**：
- ✅ ERC721 & ERC1155 支持
- ✅ 批量鑄造
- ✅ 元數據生成
- ✅ 白名單管理
- ✅ 盲盒機制

**技術棧**: Solidity, Next.js, Pinata, web3.storage

### 3. 🖼️ [NFT Gallery](./nft-gallery/) - NFT 藝廊展示
個人 NFT 收藏展示平台，支持多鏈 NFT 聚合。

**特性**：
- ✅ 多鏈 NFT 聚合
- ✅ 3D 畫廊展示
- ✅ AR 預覽
- ✅ 社交分享
- ✅ 收藏價值追蹤

**技術棧**: React, Three.js, Alchemy/Moralis API

## 🎯 NFT 標準

### ERC-721 - 非同質化代幣
每個代幣都是獨一無二的，適合單件藝術品、收藏品。

```solidity
interface IERC721 {
    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
}
```

### ERC-1155 - 多代幣標準
支持同時管理多種代幣（可替代和不可替代），適合遊戲道具。

```solidity
interface IERC1155 {
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) external view returns (uint256[] memory);
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
    function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external;
}
```

## 🛠️ 開發工具

### NFT 元數據存儲
- **IPFS** - 去中心化存儲
- **Arweave** - 永久存儲
- **Pinata** - IPFS 固定服務
- **web3.storage** - 免費 IPFS 存儲

### NFT API 服務
- **Alchemy NFT API** - NFT 數據索引
- **Moralis NFT API** - 跨鏈 NFT 數據
- **OpenSea API** - 市場數據
- **Rarible Protocol** - NFT 協議

### NFT 工具庫
```bash
# OpenZeppelin 合約庫
npm install @openzeppelin/contracts

# NFT 元數據標準
npm install @openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol
```

## 📊 NFT 元數據標準

### OpenSea 元數據格式
```json
{
  "name": "NFT Name",
  "description": "Description of the NFT",
  "image": "ipfs://QmXxx...",
  "external_url": "https://example.com",
  "attributes": [
    {
      "trait_type": "Background",
      "value": "Blue"
    },
    {
      "trait_type": "Eyes",
      "value": "Laser"
    },
    {
      "trait_type": "Rarity",
      "value": "Legendary",
      "display_type": "string"
    },
    {
      "trait_type": "Generation",
      "value": 1,
      "display_type": "number"
    }
  ],
  "properties": {
    "files": [
      {
        "uri": "ipfs://QmXxx...",
        "type": "image/png"
      }
    ],
    "category": "image"
  }
}
```

## 🎨 NFT 藝術生成

### 使用 Hashlips Art Engine
```bash
git clone https://github.com/HashLips/hashlips_art_engine.git
cd hashlips_art_engine
npm install

# 配置圖層
# layers/
#   ├── Background/
#   ├── Body/
#   ├── Eyes/
#   └── Accessories/

npm run generate
```

### 批量上傳到 IPFS
```javascript
const { create } = require('ipfs-http-client');
const fs = require('fs');

async function uploadToIPFS() {
  const client = create({ url: 'https://ipfs.infura.io:5001/api/v0' });

  const files = fs.readdirSync('./build/images');

  for (const file of files) {
    const fileData = fs.readFileSync(`./build/images/${file}`);
    const result = await client.add(fileData);
    console.log(`Uploaded ${file}: ${result.path}`);
  }
}
```

## 🔐 NFT 版稅標準

### ERC-2981 版稅標準
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTWithRoyalty is ERC721, ERC2981 {
    constructor() ERC721("MyNFT", "NFT") {
        // 設置默認版稅：10% 給創作者
        _setDefaultRoyalty(msg.sender, 1000); // 1000 = 10%
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

## 🚀 快速開始

### 創建 NFT 集合
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MyNFTCollection is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MINT_PRICE = 0.01 ether;

    constructor() ERC721("MyNFTCollection", "MNC") {}

    function mint(string memory tokenURI) public payable returns (uint256) {
        require(_tokenIds.current() < MAX_SUPPLY, "Max supply reached");
        require(msg.value >= MINT_PRICE, "Insufficient payment");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        return newTokenId;
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
```

### 前端鑄造界面
```typescript
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseEther } from 'viem';

function MintNFT() {
  const { config } = usePrepareContractWrite({
    address: '0x...',
    abi: NFT_ABI,
    functionName: 'mint',
    args: ['ipfs://QmXxx.../metadata.json'],
    value: parseEther('0.01'),
  });

  const { write: mint } = useContractWrite(config);

  return (
    <button onClick={() => mint?.()}>
      鑄造 NFT (0.01 ETH)
    </button>
  );
}
```

## 📚 學習資源

### 官方文檔
- [ERC-721 標準](https://eips.ethereum.org/EIPS/eip-721)
- [ERC-1155 標準](https://eips.ethereum.org/EIPS/eip-1155)
- [ERC-2981 版稅標準](https://eips.ethereum.org/EIPS/eip-2981)
- [OpenZeppelin NFT](https://docs.openzeppelin.com/contracts/erc721)

### 市場平台
- [OpenSea](https://opensea.io/) - 最大的 NFT 市場
- [Rarible](https://rarible.com/) - 社區驅動市場
- [Foundation](https://foundation.app/) - 精選藝術家平台
- [SuperRare](https://superrare.com/) - 高端藝術市場

### 開發資源
- [Hashlips NFT Tutorial](https://www.youtube.com/c/HashLipsNFT)
- [buildspace NFT Projects](https://buildspace.so/)
- [Alchemy NFT SDK](https://docs.alchemy.com/docs/nft-api)

## 🎨 NFT 使用場景

### 數位藝術
- 獨特藝術作品
- 生成藝術
- 動態 NFT

### 遊戲資產
- 角色皮膚
- 武器裝備
- 虛擬土地

### 收藏品
- 體育卡牌
- 音樂專輯
- 活動門票

### 實用 NFT
- 會員憑證
- 域名（ENS）
- 數位身份

## 💡 最佳實踐

### 元數據存儲
✅ **推薦**: 使用 IPFS 或 Arweave
❌ **避免**: 使用中心化服務器

### 圖片優化
- 使用適當的圖片格式（PNG, SVG）
- 壓縮圖片大小
- 提供預覽縮圖

### 智能合約安全
- 限制 gas 費用
- 實現重入攻擊保護
- 設置最大供應量
- 添加暫停機制

### 用戶體驗
- 顯示 gas 費用估算
- 提供交易狀態追蹤
- 支持多錢包連接
- 移動端友好

## 📊 專案狀態

| 專案 | 狀態 | 完成度 |
|------|------|--------|
| NFT Marketplace App | ✅ 完成 | 100% |
| NFT Minting Platform | ✅ 完成 | 100% |
| NFT Gallery | ✅ 完成 | 100% |

## 🔗 相關連結

- [返回 Blockchain Apps](../README.md)
- [DeFi Projects](../defi-projects/)
- [Web3 DApps](../web3-dapps/)
- [Smart Contracts](../smart-contracts/)

---

*NFT 改變了數位所有權，讓每個人都能真正擁有數位資產。*
