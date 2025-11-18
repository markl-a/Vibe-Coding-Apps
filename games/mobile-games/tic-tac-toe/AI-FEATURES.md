# 🤖 AI 功能說明

## AI 對手功能

井字遊戲現在包含了強大的 AI 對手功能，使用 **Minimax 演算法**實現不可戰勝的 AI。

### 使用 AI 版本

要使用 AI 功能，請使用 `App-with-AI.js` 而不是標準的 `App.js`：

```javascript
// 在 package.json 中修改 main 入口
{
  "main": "App-with-AI.js"
}
```

或者直接重命名文件。

## AI 功能特色

### 1. 三種難度等級

- **簡單 (Easy)**: AI 隨機下棋，適合初學者
- **中等 (Medium)**: 50% 機率使用最佳策略，50% 隨機，具有一定挑戰性
- **困難 (Hard)**: 使用完整的 Minimax 演算法，幾乎不可戰勝

### 2. 靈活的遊戲模式

- 可以選擇 AI 扮演 X 或 O
- 支持人機對戰和純人類對戰（關閉 AI）
- AI 思考時有視覺反饋（"AI 思考中..."）

### 3. AI 提示系統

- 點擊 "💡 提示" 按鈕獲取最佳走法建議
- AI 會告訴你應該下在哪個位置
- 這是學習遊戲策略的好方法

## Minimax 演算法說明

### 什麼是 Minimax？

Minimax 是一種決策算法，常用於兩人零和遊戲（如井字遊戲、西洋棋等）。它的核心思想是：

1. **最大化**自己的收益
2. **最小化**對手的收益

### 演算法工作原理

```javascript
minimax(board, depth, isMaximizing) {
  // 1. 檢查遊戲是否結束
  if (gameOver) {
    return score;
  }

  if (isMaximizing) {
    // AI 的回合：選擇分數最高的移動
    return max(all possible moves);
  } else {
    // 對手的回合：假設對手選擇對我們最不利的移動
    return min(all possible moves);
  }
}
```

### 評分系統

- **AI 獲勝**: +10 分（深度越淺分數越高）
- **玩家獲勝**: -10 分（深度越淺分數越低）
- **平局**: 0 分

深度因素確保 AI 選擇最快獲勝或最慢失敗的路徑。

## 代碼示例

### 基本使用

```javascript
import AIOpponent from './AIOpponent';

// 創建 AI 實例
const ai = new AIOpponent('hard');

// 獲取最佳移動
const board = ['X', 'O', null, 'X', null, null, null, null, null];
const bestMove = ai.getBestMove(board, 'O');
console.log('AI 建議走在位置:', bestMove);

// 更改難度
ai.setDifficulty('medium');

// 獲取提示
const hint = ai.getHint(board, 'X');
```

### AI 對手類 API

#### 構造函數

```javascript
new AIOpponent(difficulty = 'hard')
```

- `difficulty`: 'easy' | 'medium' | 'hard'

#### 方法

##### `getBestMove(board, aiPlayer)`

獲取 AI 的最佳移動。

- **參數**:
  - `board`: 長度為 9 的數組，表示當前棋盤狀態
  - `aiPlayer`: 'X' 或 'O'
- **返回**: 最佳移動的索引 (0-8)

##### `setDifficulty(difficulty)`

設置 AI 難度。

- **參數**:
  - `difficulty`: 'easy' | 'medium' | 'hard'

##### `getHint(board, player)`

為玩家提供最佳走法提示。

- **參數**:
  - `board`: 當前棋盤狀態
  - `player`: 'X' 或 'O'
- **返回**: 建議的移動索引

## 性能優化

### 優化技巧

1. **深度限制**: 井字遊戲棋盤小（9 格），Minimax 可以搜索所有可能性
2. **剪枝優化**: 可以添加 Alpha-Beta 剪枝進一步優化（未來改進）
3. **緩存**: 可以緩存已計算的棋盤狀態（未來改進）

### 時間複雜度

- 最壞情況: O(9!) ≈ 362,880 種可能性
- 實際情況: 由於遊戲樹較小，通常在毫秒級完成

## 學習資源

### 理解 Minimax

1. **視覺化工具**: 可以在紙上畫出遊戲樹來理解 AI 的決策過程
2. **調試模式**: 可以添加 console.log 查看 AI 的思考過程
3. **難度實驗**: 試試不同難度，理解隨機性的影響

### 擴展想法

1. **Alpha-Beta 剪枝**: 減少搜索空間
2. **開局庫**: 預存常見開局的最佳走法
3. **學習功能**: 記錄玩家的常見走法並適應
4. **多人遊戲**: 支持在線對戰

## 常見問題

### Q: 為什麼 AI 在困難模式下幾乎不可戰勝？

A: Minimax 演算法可以搜索所有可能的遊戲狀態，並選擇最優解。在井字遊戲這種簡單遊戲中，完美玩法總是能導致平局或獲勝。

### Q: 如何讓 AI 更人性化？

A: 使用 'easy' 或 'medium' 難度，或者添加隨機延遲模擬思考時間。

### Q: 可以用於其他遊戲嗎？

A: 是的！Minimax 可以用於任何兩人零和遊戲。只需修改勝利條件檢查和評分函數。

## 示例場景

### 場景 1: 學習模式

```javascript
// 使用簡單難度練習
ai.setDifficulty('easy');

// 每次移動後獲取提示
const hint = ai.getHint(board, currentPlayer);
console.log('提示: 最佳走法在', hint);
```

### 場景 2: 挑戰模式

```javascript
// 使用困難難度挑戰自己
ai.setDifficulty('hard');
ai.getBestMove(board, 'O');
```

### 場景 3: 訓練工具

```javascript
// 分析不同走法的分數
const moves = ai.getAvailableMoves(board);
moves.forEach(move => {
  const newBoard = [...board];
  newBoard[move] = 'X';
  const score = ai.minimax(newBoard, 0, false, 'O', 'X');
  console.log(`位置 ${move} 的分數: ${score}`);
});
```

## 總結

AI 功能讓井字遊戲從簡單的雙人遊戲變成了一個學習工具和挑戰平台。通過研究 AI 的決策過程，你可以：

1. 學習遊戲理論
2. 理解演算法設計
3. 提高遊戲技巧
4. 為其他遊戲添加 AI 功能打下基礎

祝你玩得開心！🎮
