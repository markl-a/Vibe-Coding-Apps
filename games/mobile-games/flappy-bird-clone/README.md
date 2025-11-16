# 🐦 Flappy Bird Clone

一個使用 React Native 和 Game Engine 開發的 Flappy Bird 克隆遊戲。

## 📋 專案資訊

- **框架**: React Native + Expo
- **遊戲引擎**: React Native Game Engine
- **物理引擎**: Matter.js
- **類型**: 超休閒遊戲
- **難度**: ⭐⭐
- **開發時間**: 1-2 週

## 🎮 遊戲特點

- **簡單操作**: 點擊螢幕讓小鳥飛行
- **物理系統**: 真實的重力和碰撞檢測
- **無盡模式**: 隨機生成的管道障礙
- **計分系統**: 實時分數追蹤
- **遊戲結束**: 碰撞檢測和重新開始功能

## 🚀 安裝與運行

### 前置需求

- Node.js 14+
- npm 或 yarn
- Expo CLI
- iOS 模擬器 或 Android 模擬器

### 安裝步驟

```bash
# 安裝依賴
npm install

# 或使用 yarn
yarn install
```

### 運行遊戲

```bash
# 啟動 Expo 開發伺服器
npm start

# 在 iOS 上運行
npm run ios

# 在 Android 上運行
npm run android

# 在 Web 上運行
npm run web
```

## 📁 專案結構

```
flappy-bird-clone/
├── App.js                 # 主應用程式
├── Physics.js             # 物理系統和遊戲邏輯
├── components/
│   ├── Bird.js           # 小鳥組件
│   ├── Pipe.js           # 管道組件
│   └── Floor.js          # 地板組件
├── package.json          # 專案配置
└── README.md            # 說明文件
```

## 🎯 核心功能

### 1. 物理系統
- **重力**: 小鳥持續下落
- **跳躍**: 點擊螢幕給小鳥向上的速度
- **碰撞檢測**: 與管道、地板、天花板的碰撞

### 2. 遊戲機制
- **管道生成**: 每 2 秒生成一對管道
- **管道移動**: 管道從右向左移動
- **計分**: 通過管道時增加分數
- **遊戲結束**: 碰撞時停止遊戲

### 3. UI/UX
- **即時分數顯示**
- **遊戲結束畫面**
- **重新開始按鈕**
- **美觀的視覺設計**

## 🛠️ 技術細節

### Matter.js 物理引擎

```javascript
// 創建物理世界
let engine = Matter.Engine.create({ enableSleeping: false });
let world = engine.world;
world.gravity.y = 1.2;

// 創建小鳥
const bird = Matter.Bodies.rectangle(x, y, 50, 50, {
  isStatic: false,
  label: 'bird'
});
```

### 遊戲循環

```javascript
const Physics = (entities, { touches, time, dispatch }) => {
  // 處理觸控輸入
  touches.filter(t => t.type === 'press').forEach(t => {
    Matter.Body.setVelocity(entities.bird.body, {
      x: 0,
      y: -8  // 向上跳躍
    });
  });

  // 更新物理引擎
  Matter.Engine.update(engine, time.delta);
};
```

### 碰撞檢測

```javascript
Matter.Events.on(engine, 'collisionStart', (event) => {
  const pairs = event.pairs;

  pairs.forEach(pair => {
    if (isBirdCollision(pair)) {
      dispatch({ type: 'game-over' });
    }
  });
});
```

## 🎨 自訂設定

### 調整遊戲難度

**修改重力**:
```javascript
// 在 App.js 的 setupWorld() 中
world.gravity.y = 1.5;  // 增加重力，遊戲更難
```

**修改跳躍力度**:
```javascript
// 在 Physics.js 中
Matter.Body.setVelocity(entities.bird.body, {
  x: 0,
  y: -10  // 增加跳躍高度
});
```

**修改管道間隙**:
```javascript
// 在 Physics.js 中
const pipeGap = 250;  // 增加間隙，遊戲更容易
```

### 更改視覺樣式

**小鳥顏色**:
```javascript
// 在 setupWorld() 中
bird: {
  body: bird,
  size: [50, 50],
  color: '#FF5722',  // 更改為橘紅色
  renderer: Bird
}
```

**管道顏色**:
```javascript
// 在 Physics.js 中
entities[`${pipeId}_top`] = {
  body: topPipe,
  size: [60, pipeHeight],
  color: '#2196F3',  // 更改為藍色
  renderer: Pipe
};
```

## 💰 商業化建議

### 1. 廣告整合

```bash
# 安裝 AdMob
npx expo install expo-ads-admob
```

```javascript
// 添加橫幅廣告
import { AdMobBanner } from 'expo-ads-admob';

<AdMobBanner
  bannerSize="fullBanner"
  adUnitID="ca-app-pub-xxxxx"
  style={{ position: 'absolute', bottom: 0 }}
/>
```

### 2. 內購系統

```bash
# 安裝內購
npx expo install expo-in-app-purchases
```

可添加的內購項目：
- 去廣告 ($1.99)
- 解鎖新角色 ($0.99)
- 金幣包（用於復活）

### 3. 遊戲增強功能

可添加的功能：
- **角色系統**: 多種可解鎖的小鳥
- **道具系統**: 護盾、慢動作等
- **成就系統**: 達成特定目標獲得獎勵
- **排行榜**: Firebase 或 Game Center 整合
- **每日任務**: 增加玩家留存

## 📊 性能優化

### 1. 物件池

```javascript
// 重用管道物件而不是每次創建新的
const pipePool = [];

function getPipeFromPool() {
  return pipePool.pop() || createNewPipe();
}
```

### 2. 減少重渲染

```javascript
// 使用 React.memo 優化組件
export default React.memo(Bird);
```

### 3. 圖片資源優化

- 壓縮圖片資源
- 使用雪碧圖
- 懶加載非必要資源

## 🐛 已知問題和解決方案

### 問題 1: 性能在低端設備上較差

**解決方案**:
```javascript
// 降低物理引擎更新頻率
Matter.Engine.update(engine, time.delta * 0.8);
```

### 問題 2: 觸控延遲

**解決方案**:
```javascript
// 使用原生驅動
useNativeDriver: true
```

## 📱 發布檢查清單

- [ ] 測試所有設備尺寸
- [ ] 測試 iOS 和 Android 平台
- [ ] 添加應用圖標
- [ ] 添加啟動畫面
- [ ] 優化性能
- [ ] 整合分析工具
- [ ] 添加隱私政策
- [ ] 設定商業化（廣告/內購）
- [ ] App Store / Google Play 截圖準備
- [ ] 撰寫應用描述

## 🎓 學習資源

- [React Native 官方文檔](https://reactnative.dev/)
- [Expo 文檔](https://docs.expo.dev/)
- [React Native Game Engine](https://github.com/bberak/react-native-game-engine)
- [Matter.js 文檔](https://brm.io/matter-js/)

## 📝 授權

MIT License

## 🙋 常見問題

**Q: 為什麼選擇 React Native 而不是 Unity？**

A: React Native 更適合超休閒遊戲，開發速度快，學習曲線低，且 AI 輔助效果好。

**Q: 可以添加音效嗎？**

A: 可以！使用 `expo-av` 套件：
```bash
npx expo install expo-av
```

**Q: 如何保存最高分？**

A: 使用 AsyncStorage：
```bash
npx expo install @react-native-async-storage/async-storage
```

## 🎮 開始遊戲！

現在你有了一個完整的 Flappy Bird 克隆！可以：
1. 自訂遊戲難度和視覺效果
2. 添加新功能（角色、道具、成就）
3. 整合商業化功能
4. 發布到 App Store 和 Google Play

祝你遊戲開發順利！🚀
