# 🔨 打地鼠 (Whack-a-Mole)
🤖 **AI-Native | React Native** 🚀

經典的打地鼠遊戲，加入 AI 提示功能，適合訓練反應速度和手眼協調。

## 📋 遊戲特色

- ✅ 經典的打地鼠玩法
- ✅ **AI 提示系統**（標記可打擊的地鼠）
- ✅ 三種難度級別（簡單、中等、困難）
- ✅ 流暢的動畫效果
- ✅ 計分和計時系統
- ✅ 最高分記錄
- ✅ 響應式 3x3 網格設計
- ✅ 支援 iOS 和 Android

## 🎮 遊戲玩法

### 遊戲規則
1. 地鼠會隨機從 9 個洞中冒出來
2. 快速點擊地鼠得分（每隻 10 分）
3. 地鼠會自動消失，需要快速反應
4. 遊戲時間為 30 秒
5. 盡可能在時間內獲得最高分

### 難度等級
- **簡單**: 地鼠出現慢（1.5秒間隔），停留時間長（2秒）
- **中等**: 中等速度（1秒間隔），中等停留時間（1.2秒）
- **困難**: 快速出現（0.6秒間隔），短暫停留（0.8秒）

### AI 提示功能
- 開啟 AI 提示後，會有 💡 標記顯示可以打擊的地鼠
- 幫助初學者熟悉遊戲節奏
- 訓練反應速度的好工具

## 🚀 快速開始

### 環境需求

- **Node.js** 14.x 或更新版本
- **npm** 或 **yarn**
- **Expo CLI**
- **iOS**: Xcode（macOS）或 Expo Go app
- **Android**: Android Studio 或 Expo Go app

### 安裝步驟

```bash
# 進入專案目錄
cd whack-a-mole

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
whack-a-mole/
├── App.js              # 主應用程式（包含 AI 功能）
├── package.json        # 專案設定
└── README.md          # 說明文件
```

## 🎯 核心功能

### 1. 動態地鼠生成

```javascript
const spawnMole = () => {
  const availableHoles = [];
  moles.forEach((mole, index) => {
    if (!mole) availableHoles.push(index);
  });

  if (availableHoles.length > 0) {
    const randomIndex = availableHoles[
      Math.floor(Math.random() * availableHoles.length)
    ];
    showMole(randomIndex);
  }
};
```

### 2. AI 提示系統

```javascript
// 在地鼠出現時自動標記
if (aiHintEnabled && hintIndex === null) {
  setHintIndex(randomIndex); // 標記第一隻出現的地鼠
}

// 視覺提示
{isHinted && (
  <View style={styles.hintIndicator}>
    <Text style={styles.hintText}>💡</Text>
  </View>
)}
```

### 3. 難度系統

不同難度影響：
- **生成間隔**: 地鼠出現的頻率
- **可見時間**: 地鼠停留的時間

```javascript
const getSpawnInterval = () => {
  switch (difficulty) {
    case 'easy': return 1500;
    case 'medium': return 1000;
    case 'hard': return 600;
  }
};
```

### 4. 平滑動畫

```javascript
// 地鼠彈出動畫
Animated.spring(moleAnimations[index], {
  toValue: 1,
  tension: 100,
  friction: 5,
  useNativeDriver: true,
}).start();
```

## 🎨 自訂設定

### 修改遊戲時間

```javascript
const GAME_DURATION = 30; // 改為 60 秒
```

### 修改網格大小

```javascript
const GRID_SIZE = 3; // 改為 4x4 或 5x5
```

### 修改得分

```javascript
setScore(prev => prev + 10); // 改為 20 分
```

### 更換地鼠圖案

```javascript
<Text style={styles.moleText}>🐹</Text> // 改為其他 emoji
// 例如: 🐭 🦫 🐰 🐻
```

## 💡 AI 功能說明

### 提示系統工作原理

1. **檢測地鼠出現**: 當新地鼠出現時，系統標記位置
2. **視覺提示**: 在洞口顯示 💡 圖標
3. **邊框高亮**: 使用黃色邊框突出顯示
4. **自動清除**: 地鼠被打中或消失後清除提示

### 使用場景

- **學習模式**: 幫助新手熟悉遊戲
- **訓練模式**: 提升反應速度
- **測試模式**: 驗證最高可能得分

## 🎯 遊戲策略

### 高分技巧

1. **專注中心**: 優先關注中間的洞
2. **預判位置**: 觀察地鼠出現的模式
3. **快速點擊**: 提升手指反應速度
4. **避免亂點**: 只點擊有地鼠的洞
5. **時間管理**: 最後 5 秒更專注

### 進階技巧

1. **雙手模式**: 使用兩隻手指增加覆蓋範圍
2. **節奏掌握**: 了解不同難度的節奏
3. **視野訓練**: 擴大周邊視覺範圍
4. **放鬆心態**: 緊張會降低反應速度

## 📊 性能優化

### 已實現的優化

1. **useNativeDriver**: 使用原生驅動的動畫
2. **Spring動畫**: 更自然的彈出效果
3. **及時清理**: 清理定時器和間隔
4. **狀態管理**: 高效的狀態更新

### 可能的優化

```javascript
// 1. 添加物件池
const molePool = [];

// 2. 減少重渲染
const MemoizedHole = React.memo(Hole);

// 3. 批量更新
// 使用 setTimeout 批量處理狀態更新
```

## 🎓 學習要點

這個專案展示了以下 React Native 開發概念：

1. **動畫系統**: Animated API 的使用
2. **定時器管理**: setInterval 和 clearInterval
3. **遊戲循環**: 計時和生成邏輯
4. **狀態管理**: useState 和 useRef
5. **觸控處理**: TouchableOpacity 的使用
6. **響應式佈局**: Dimensions API 的使用
7. **條件渲染**: 根據遊戲狀態渲染不同 UI

## 🔧 擴展功能建議

### 初級擴展
- [ ] 添加音效（打中、錯過、遊戲結束）
- [ ] 添加震動反饋
- [ ] 記錄歷史最高分
- [ ] 添加連擊系統（連續打中加分）

### 中級擴展
- [ ] 多種地鼠類型（不同分數）
- [ ] 道具系統（冰凍時間、雙倍分數）
- [ ] 關卡系統（漸進難度）
- [ ] 成就系統

### 高級擴展
- [ ] 多人對戰模式
- [ ] 排行榜（使用 Firebase）
- [ ] 每日挑戰
- [ ] 自訂外觀主題
- [ ] AI 難度自適應（根據玩家水平調整）

## 💰 商業化建議

### 1. 廣告整合

```bash
# 安裝 AdMob
npx expo install expo-ads-admob
```

- **橫幅廣告**: 遊戲底部
- **插頁廣告**: 遊戲結束時
- **激勵視頻**: 復活或道具

### 2. 內購項目

可添加的內購項目：
- **去廣告**: $1.99
- **道具包**: $0.99
  - 時間延長 +10秒
  - 雙倍分數
  - 冰凍地鼠
- **外觀包**: $1.99
  - 不同地鼠皮膚
  - 背景主題
- **VIP 通行證**: $2.99/月

### 3. 遊戲分析

```bash
# 安裝 Firebase
npx expo install firebase
```

追蹤指標：
- 平均遊戲時長
- 難度選擇分布
- 平均得分
- 留存率

## 🐛 常見問題

**Q: 地鼠出現太快/太慢？**

A: 調整 `getSpawnInterval()` 函數中的數值：
```javascript
case 'medium': return 1000; // 降低數值 = 更快
```

**Q: 如何增加遊戲時間？**

A: 修改 `GAME_DURATION` 常量：
```javascript
const GAME_DURATION = 60; // 60 秒
```

**Q: 想要更大的網格？**

A: 修改 `GRID_SIZE` 常量：
```javascript
const GRID_SIZE = 4; // 4x4 = 16 個洞
```

**Q: AI 提示無法關閉？**

A: 在遊戲開始前切換 AI 提示開關。

## 📱 發布檢查清單

- [ ] 測試所有難度級別
- [ ] 測試 AI 提示功能
- [ ] 測試不同設備尺寸
- [ ] 優化性能（60 FPS）
- [ ] 添加應用圖標
- [ ] 添加啟動畫面
- [ ] 整合分析工具
- [ ] 準備商店截圖
- [ ] 撰寫應用描述
- [ ] 設定隱私政策

## 🎓 學習資源

- [React Native 動畫](https://reactnative.dev/docs/animations)
- [Expo 文檔](https://docs.expo.dev/)
- [遊戲循環設計](https://developer.mozilla.org/en-US/docs/Games/Anatomy)
- [觸控事件處理](https://reactnative.dev/docs/handling-touches)

## 📝 更新日誌

### v1.0.0 (2025-11-18)
- ✅ 初始版本發布
- ✅ 基本打地鼠遊戲功能
- ✅ AI 提示系統
- ✅ 三種難度等級
- ✅ 計分和計時系統
- ✅ 最高分記錄

## 📄 授權

MIT License

## 🎮 開始遊戲！

現在你有了一個完整的打地鼠遊戲！你可以：
1. 自訂難度和遊戲參數
2. 添加音效和特效
3. 整合商業化功能
4. 發布到應用商店

祝你玩得開心！🔨🐹
