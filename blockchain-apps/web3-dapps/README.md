# 🌐 Web3 DApps - Web3 去中心化應用

基於區塊鏈的去中心化應用，強調用戶主權和數據所有權。

## 📋 專案列表

### 1. 📱 [Web3 Social Network](./web3-social-network/) - 去中心化社交網絡
用戶完全掌控自己數據的社交平台。

**特性**：
- ✅ 去中心化身份（DID）
- ✅ 加密私信
- ✅ 內容 NFT 化
- ✅ 代幣打賞
- ✅ 社群治理

**技術棧**: Lens Protocol, IPFS, Ceramic Network, Lit Protocol

### 2. 💾 [Decentralized Storage](./decentralized-storage/) - 去中心化存儲
去中心化文件存儲和分享應用。

**特性**：
- ✅ IPFS 文件存儲
- ✅ 加密文件共享
- ✅ 版本控制
- ✅ 訪問控制
- ✅ 文件市場

**技術棧**: IPFS, Filecoin, Web3.Storage, Ceramic

### 3. 🏛️ [DAO Governance](./dao-governance/) - DAO 治理平台
去中心化自治組織治理系統。

**特性**：
- ✅ 提案創建與投票
- ✅ 多簽執行
- ✅ 代幣加權投票
- ✅ 委託投票
- ✅ 國庫管理

**技術棧**: OpenZeppelin Governor, Snapshot, Gnosis Safe

## 🔑 Web3 核心概念

### 去中心化身份（DID）
```typescript
import { EthereumAuthProvider, SelfID } from '@self.id/web';

const authProvider = await EthereumAuthProvider.connect();
const selfID = await SelfID.authenticate({
  authProvider,
  ceramic: 'testnet-clay',
});

const profile = await selfID.get('basicProfile');
```

### 去中心化存儲
```typescript
import { Web3Storage } from 'web3.storage';

const client = new Web3Storage({ token: API_TOKEN });
const cid = await client.put(files);
console.log('Stored with CID:', cid);
```

### DAO 治理
```solidity
import "@openzeppelin/contracts/governance/Governor.sol";

contract MyDAO is Governor {
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }
}
```

## 🛠️ Web3 技術棧

### 身份與認證
- **ENS** - 以太坊域名服務
- **Ceramic Network** - 去中心化數據網絡
- **Lit Protocol** - 去中心化訪問控制
- **SpruceID** - 去中心化身份工具包

### 存儲方案
- **IPFS** - 星際文件系統
- **Filecoin** - 去中心化存儲網絡
- **Arweave** - 永久存儲
- **web3.storage** - 簡單的 IPFS 服務

### 通信協議
- **XMTP** - Web3 消息協議
- **Waku** - 去中心化通信
- **Matrix** - 開放通信協議

## 🚀 快速開始

### 連接錢包
```typescript
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiConfig } from 'wagmi';
import { mainnet, polygon } from 'wagmi/chains';

const chains = [mainnet, polygon];
const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId: 'YOUR_PROJECT_ID',
  appName: 'Web3 DApp',
});

createWeb3Modal({ wagmiConfig, projectId: 'YOUR_PROJECT_ID', chains });

function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <w3m-button />
    </WagmiConfig>
  );
}
```

### 讀取區塊鏈數據
```typescript
import { useContractRead } from 'wagmi';

function MyComponent() {
  const { data, isLoading } = useContractRead({
    address: '0x...',
    abi: CONTRACT_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  return <div>Balance: {data?.toString()}</div>;
}
```

### 發送交易
```typescript
import { useContractWrite, usePrepareContractWrite } from 'wagmi';

function TransferButton() {
  const { config } = usePrepareContractWrite({
    address: '0x...',
    abi: CONTRACT_ABI,
    functionName: 'transfer',
    args: [recipient, amount],
  });

  const { write } = useContractWrite(config);

  return <button onClick={() => write?.()}>轉賬</button>;
}
```

## 📚 學習資源

- [Web3.js Documentation](https://web3js.readthedocs.io/)
- [ethers.js Documentation](https://docs.ethers.org/)
- [wagmi Documentation](https://wagmi.sh/)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [Ceramic Network](https://developers.ceramic.network/)

## 📊 專案狀態

| 專案 | 狀態 | 完成度 |
|------|------|--------|
| Web3 Social Network | ✅ 完成 | 100% |
| Decentralized Storage | ✅ 完成 | 100% |
| DAO Governance | ✅ 完成 | 100% |

[返回 Blockchain Apps](../README.md)
