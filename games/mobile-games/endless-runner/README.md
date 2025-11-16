# 🏃 Endless Runner

一個使用 React Native 開發的無盡跑酷遊戲。

## 📋 專案資訊

- **框架**: React Native + Expo
- **遊戲引擎**: React Native Game Engine
- **類型**: 跑酷動作遊戲
- **難度**: ⭐⭐⭐
- **開發時間**: 1-2 個月

## 🎮 遊戲特點

- **無盡跑酷**: 持續奔跑，躲避障礙
- **跳躍機制**: 點擊按鈕跳過障礙物
- **金幣收集**: 收集金幣獲得額外分數
- **難度遞增**: 速度隨著分數增加
- **多種障礙**: 仙人掌、岩石、樹木
- **最高分記錄**: 本地存儲最佳成績

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
endless-runner/
├── App.js                    # 主應用程式
├── entities/
│   ├── Player.js            # 玩家角色
│   ├── Obstacle.js          # 障礙物
│   ├── Coin.js             # 金幣
│   └── Ground.js           # 地面
├── systems/
│   └── GameLoop.js         # 遊戲循環邏輯
├── package.json            # 專案配置
└── README.md              # 說明文件
```

## 🎯 核心功能

### 1. 遊戲機制

**玩家控制**:
- 點擊 JUMP 按鈕跳躍
- 重力系統自動拉回地面
- 精確的碰撞檢測

**障礙物系統**:
- 隨機生成不同類型障礙
- 三種障礙物：仙人掌 🌵、岩石 🪨、樹木 🌲
- 障礙間距隨難度調整

**金幣系統**:
- 隨機高度出現金幣
- 收集金幣增加分數
- 金幣位置需要跳躍技巧

### 2. 遊戲循環

```javascript
const GameLoop = (entities, { events, dispatch, time }) => {
  // 處理跳躍
  events.forEach((event) => {
    if (event.type === 'jump' && !player.isJumping) {
      player.velocity.y = JUMP_FORCE;
      player.isJumping = true;
    }
  });

  // 應用重力
  player.velocity.y += GRAVITY;
  player.position.y += player.velocity.y;

  // 碰撞檢測
  // 障礙物移動
  // 分數更新
};
```

### 3. 難度系統

```javascript
// 遊戲速度隨分數增加
gameState.speed = Math.min(5 + gameState.score / 100, 12);

// 障礙物生成頻率加快
const spawnInterval = 1500 - gameState.score / 10;
```

### 4. 分數系統

- **距離分數**: 跑得越遠分數越高
- **金幣獎勵**: 每個金幣額外加分
- **最高分記錄**: 使用 AsyncStorage 保存

## 🎨 自訂設定

### 調整遊戲難度

**修改重力**:
```javascript
// 在 GameLoop.js 中
const GRAVITY = 1.5;  // 增加重力，跳躍更快下落
```

**修改跳躍力度**:
```javascript
const JUMP_FORCE = -25;  // 更大的負值 = 跳得更高
```

**修改遊戲速度**:
```javascript
// 起始速度和最大速度
gameState.speed = Math.min(8 + gameState.score / 100, 15);
```

**調整障礙物生成頻率**:
```javascript
// 更低的值 = 更頻繁的障礙
if (gameState.obstacleTimer > 1200) {
  // 生成障礙物
}
```

### 更改視覺樣式

**更換玩家角色**:
```javascript
// 在 Player.js 中
<Text style={{ fontSize: 40 }}>🦸</Text>  // 改為超人
```

**添加更多障礙物類型**:
```javascript
// 在 GameLoop.js 中
const obstacleTypes = ['cactus', 'rock', 'tree', 'fire', 'spike'];
```

**修改背景顏色**:
```javascript
// 在 App.js 的 styles 中
container: {
  backgroundColor: '#FFA500',  // 橘色背景
}
```

### 添加新功能

**雙跳系統**:
```javascript
let jumpCount = 0;

if (event.type === 'jump' && jumpCount < 2) {
  player.velocity.y = JUMP_FORCE;
  jumpCount++;
}

if (!player.isJumping) {
  jumpCount = 0;
}
```

**道具系統**:
```javascript
// 護盾道具
entities.shield = {
  position: { x: width, y: GROUND_Y - 50 },
  size: { width: 40, height: 40 },
  renderer: Shield,
  duration: 5000,
};
```

## 💰 商業化建議

### 1. 廣告整合

```bash
# 安裝 AdMob
npx expo install expo-ads-admob
```

**橫幅廣告**:
```javascript
import { AdMobBanner } from 'expo-ads-admob';

<AdMobBanner
  bannerSize="fullBanner"
  adUnitID="ca-app-pub-xxxxx"
  style={{ position: 'absolute', bottom: 0 }}
/>
```

**插頁廣告（遊戲結束時）**:
```javascript
import { AdMobInterstitial } from 'expo-ads-admob';

async showGameOverAd() {
  await AdMobInterstitial.setAdUnitID('ca-app-pub-xxxxx');
  await AdMobInterstitial.requestAdAsync();
  await AdMobInterstitial.showAdAsync();
}
```

**激勵視頻（復活系統）**:
```javascript
import { AdMobRewarded } from 'expo-ads-admob';

async watchAdToContinue() {
  await AdMobRewarded.setAdUnitID('ca-app-pub-xxxxx');
  await AdMobRewarded.requestAdAsync();
  await AdMobRewarded.showAdAsync();
  // 給予玩家復活機會
  this.continueGame();
}
```

### 2. 內購系統

```bash
# 安裝內購
npx expo install expo-in-app-purchases
```

可添加的內購項目：
- **去廣告**: $2.99
- **角色包**: $0.99 - $4.99（解鎖新角色）
- **道具包**: $1.99（護盾、磁鐵、加速）
- **金幣包**: $0.99 - $9.99
- **VIP 通行證**: $4.99/月（雙倍金幣、獨家角色）

### 3. 遊戲增強功能

**角色系統**:
```javascript
const characters = {
  runner: '🏃',
  ninja: '🥷',
  superhero: '🦸',
  robot: '🤖',
};

// 使用金幣解鎖角色
function unlockCharacter(characterId, coinCost) {
  if (totalCoins >= coinCost) {
    totalCoins -= coinCost;
    unlockedCharacters.push(characterId);
  }
}
```

**道具系統**:
- **護盾**: 保護一次碰撞
- **磁鐵**: 自動吸收金幣
- **加速**: 雙倍分數
- **慢動作**: 暫時降低速度

**成就系統**:
```javascript
const achievements = [
  { id: 'first_run', name: '首次奔跑', condition: score > 0 },
  { id: 'runner_100', name: '百米衝刺', condition: score > 100 },
  { id: 'coin_master', name: '金幣大師', condition: coins > 50 },
  { id: 'marathon', name: '馬拉松', condition: score > 1000 },
];
```

## 📊 進階功能

### 1. 多人競技模式

```bash
# 安裝 Firebase
npx expo install firebase
```

**即時排行榜**:
```javascript
import firebase from 'firebase/app';
import 'firebase/database';

// 上傳分數
async function uploadScore(playerName, score) {
  const ref = firebase.database().ref('leaderboard');
  await ref.push({
    name: playerName,
    score: score,
    timestamp: Date.now(),
  });
}

// 獲取排行榜
async function getLeaderboard() {
  const snapshot = await firebase.database()
    .ref('leaderboard')
    .orderByChild('score')
    .limitToLast(10)
    .once('value');
  return snapshot.val();
}
```

### 2. 每日挑戰

```javascript
const dailyChallenges = [
  { id: 'monday', goal: '收集 30 個金幣', reward: 100 },
  { id: 'tuesday', goal: '跑到 500 分', reward: 150 },
  { id: 'wednesday', goal: '不跳躍跑到 100 分', reward: 200 },
];

function checkDailyChallenge() {
  const today = new Date().getDay();
  const challenge = dailyChallenges[today];
  // 檢查完成條件
}
```

### 3. 關卡系統

```javascript
const levels = [
  {
    id: 1,
    name: '新手村',
    speed: 5,
    obstacleFrequency: 2000,
    background: '#87CEEB',
  },
  {
    id: 2,
    name: '沙漠',
    speed: 7,
    obstacleFrequency: 1500,
    background: '#FFD700',
  },
  {
    id: 3,
    name: '雪山',
    speed: 9,
    obstacleFrequency: 1000,
    background: '#E0F2F7',
  },
];
```

### 4. 音效和音樂

```bash
# 安裝音效庫
npx expo install expo-av
```

```javascript
import { Audio } from 'expo-av';

// 載入音效
const [jumpSound, setJumpSound] = useState();
const [coinSound, setCoinSound] = useState();

async function loadSounds() {
  const { sound: jump } = await Audio.Sound.createAsync(
    require('./assets/sounds/jump.mp3')
  );
  const { sound: coin } = await Audio.Sound.createAsync(
    require('./assets/sounds/coin.mp3')
  );
  setJumpSound(jump);
  setCoinSound(coin);
}

// 播放音效
async function playJumpSound() {
  await jumpSound.replayAsync();
}
```

## 🎯 遊戲策略

### 玩家技巧

1. **節奏感**: 掌握跳躍時機
2. **預判**: 提前看到下一個障礙
3. **金幣優先**: 在安全時收集金幣
4. **保持冷靜**: 速度加快時不要慌張

### 關卡設計

1. **漸進難度**: 逐步增加速度和障礙密度
2. **公平性**: 確保所有障礙組合都可通過
3. **獎勵平衡**: 金幣位置應該有挑戰但可達成
4. **視覺反饋**: 清晰的碰撞和收集效果

## 📊 性能優化

### 1. 物件池

```javascript
// 重用障礙物而不是每次創建新的
const obstaclePool = [];

function getObstacleFromPool() {
  if (obstaclePool.length > 0) {
    return obstaclePool.pop();
  }
  return createNewObstacle();
}

function returnObstacleToPool(obstacle) {
  obstaclePool.push(obstacle);
}
```

### 2. 減少渲染

```javascript
// 只渲染可見範圍內的物體
if (obstacle.position.x > -100 && obstacle.position.x < width + 100) {
  renderObstacle(obstacle);
}
```

### 3. 優化碰撞檢測

```javascript
// 使用更簡單的碰撞檢測
function simpleCollision(rect1, rect2) {
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}
```

## 🐛 常見問題

**Q: 遊戲在某些設備上卡頓？**

A: 降低障礙物數量和生成頻率，簡化渲染邏輯。

**Q: 跳躍感覺不夠靈敏？**

A: 調整 JUMP_FORCE 和 GRAVITY 常數，增加跳躍力度。

**Q: 如何添加暫停功能？**

A:
```javascript
const [paused, setPaused] = useState(false);

function togglePause() {
  setPaused(!paused);
  gameEngine.stop();  // 或 gameEngine.start()
}
```

## 📱 發布檢查清單

- [ ] 測試所有設備尺寸
- [ ] 測試 iOS 和 Android
- [ ] 添加應用圖標
- [ ] 添加啟動畫面
- [ ] 整合分析工具（Firebase）
- [ ] 添加音效和音樂
- [ ] 實現商業化（廣告/內購）
- [ ] 準備商店資源
- [ ] Beta 測試
- [ ] 優化性能

## 🎓 學習資源

- [React Native 官方文檔](https://reactnative.dev/)
- [Expo 文檔](https://docs.expo.dev/)
- [React Native Game Engine](https://github.com/bberak/react-native-game-engine)
- [遊戲設計原則](https://www.gamedeveloper.com/)

## 📝 未來改進

- [ ] 添加更多角色和皮膚
- [ ] 實現多種遊戲模式
- [ ] 添加關卡系統
- [ ] 開發社交功能（好友對戰）
- [ ] 實現雲端存檔
- [ ] 添加季節性活動
- [ ] 開發道具商店
- [ ] 實現成就系統

## 📄 授權

MIT License

## 🎮 開始遊戲！

現在你有了一個完整的無盡跑酷遊戲！你可以：
1. 自訂角色和障礙物
2. 添加道具和能力系統
3. 整合排行榜和社交功能
4. 發布到應用商店

祝你遊戲開發愉快！🚀
