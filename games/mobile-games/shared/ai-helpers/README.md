# 🤖 Game AI Helper Library

遊戲 AI 輔助庫 - 為移動遊戲提供通用的 AI 演算法實現。

## 📋 包含的演算法

### 1. **Minimax** - 雙人零和遊戲
最適合：井字遊戲、西洋棋、圍棋等回合制對戰遊戲

```javascript
import GameAI from './shared/ai-helpers/GameAI';

const result = GameAI.minimax(
  gameState,
  depth,
  isMaximizing,
  evaluate,
  getNextStates,
  isTerminal
);
```

### 2. **Alpha-Beta 剪枝** - 優化的 Minimax
減少搜索空間，提升性能

```javascript
const result = GameAI.alphabeta(
  gameState,
  depth,
  -Infinity,
  Infinity,
  isMaximizing,
  evaluate,
  getNextStates,
  isTerminal
);
```

### 3. **BFS（廣度優先搜索）** - 最短路徑
最適合：貪吃蛇、迷宮遊戲、路徑規劃

```javascript
const path = GameAI.bfs(start, goal, getNeighbors);
```

### 4. **A* 尋路** - 啟發式路徑搜索
最適合：需要高效尋路的遊戲

```javascript
const path = GameAI.astar(
  start,
  goal,
  getNeighbors,
  GameAI.manhattanDistance
);
```

### 5. **MCTS（蒙特卡洛樹搜索）** - 複雜遊戲
最適合：圍棋、複雜策略遊戲

```javascript
const bestMove = GameAI.mcts(
  rootState,
  getNextStates,
  isTerminal,
  evaluate,
  1000 // 迭代次數
);
```

### 6. **模擬退火** - 優化問題
最適合：關卡生成、參數優化

```javascript
const best = GameAI.simulatedAnnealing(
  initialState,
  getNeighbor,
  energy
);
```

### 7. **遺傳演算法** - 進化式優化
最適合：AI 行為進化、參數調優

```javascript
const best = GameAI.geneticAlgorithm(
  populationSize,
  generateIndividual,
  fitness,
  crossover,
  mutate,
  generations
);
```

## 🎯 實際應用範例

### 井字遊戲 - Minimax

```javascript
const evaluate = (board) => {
  const winner = calculateWinner(board);
  if (winner === 'AI') return 10;
  if (winner === 'Player') return -10;
  return 0;
};

const getNextStates = (board) => {
  const states = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      const newBoard = [...board];
      newBoard[i] = currentPlayer;
      states.push({ state: newBoard, move: i });
    }
  }
  return states;
};

const isTerminal = (board) => {
  return calculateWinner(board) !== null ||
         board.every(cell => cell !== null);
};

const result = GameAI.minimax(
  board,
  9,
  true,
  evaluate,
  getNextStates,
  isTerminal
);
console.log('最佳移動:', result.move);
```

### 貪吃蛇 - BFS

```javascript
const getNeighbors = (pos) => {
  const neighbors = [];
  const directions = [
    { x: 0, y: -1 }, // 上
    { x: 0, y: 1 },  // 下
    { x: -1, y: 0 }, // 左
    { x: 1, y: 0 },  // 右
  ];

  for (const dir of directions) {
    const next = {
      x: pos.x + dir.x,
      y: pos.y + dir.y,
    };

    // 檢查邊界和蛇身
    if (isValidCell(next)) {
      neighbors.push(next);
    }
  }

  return neighbors;
};

const path = GameAI.bfs(snakeHead, food, getNeighbors);
console.log('到食物的路徑:', path);
```

### 塔防遊戲 - A*

```javascript
const path = GameAI.astar(
  enemyPosition,
  basePosition,
  getNeighbors,
  GameAI.manhattanDistance,
  (from, to) => terrainCost[to.type] // 考慮地形成本
);
```

## 🔧 輔助函數

### 距離計算

```javascript
// 曼哈頓距離（適合網格移動）
const distance = GameAI.manhattanDistance(
  { x: 0, y: 0 },
  { x: 3, y: 4 }
); // 結果: 7

// 歐幾里得距離（適合自由移動）
const distance = GameAI.euclideanDistance(
  { x: 0, y: 0 },
  { x: 3, y: 4 }
); // 結果: 5
```

## 📊 性能考慮

| 演算法 | 時間複雜度 | 空間複雜度 | 適用場景 |
|--------|-----------|-----------|---------|
| Minimax | O(b^d) | O(d) | 小型遊戲樹 |
| Alpha-Beta | O(b^(d/2)) | O(d) | 中型遊戲樹 |
| BFS | O(V + E) | O(V) | 最短路徑 |
| A* | O(b^d) | O(b^d) | 啟發式路徑 |
| MCTS | O(n) | O(n) | 複雜遊戲 |

## 🎓 何時使用哪種演算法？

### Minimax / Alpha-Beta
- ✅ 回合制雙人遊戲
- ✅ 遊戲狀態有限
- ✅ 需要最優解
- ❌ 實時遊戲
- ❌ 狀態空間巨大

### BFS
- ✅ 需要最短路徑
- ✅ 無權重圖
- ✅ 狀態空間適中
- ❌ 需要考慮路徑成本
- ❌ 需要啟發式優化

### A*
- ✅ 需要最短路徑
- ✅ 有良好的啟發式函數
- ✅ 可以預測距離
- ❌ 內存受限
- ❌ 啟發式函數難以設計

### MCTS
- ✅ 狀態空間巨大
- ✅ 難以評估中間狀態
- ✅ 有模擬預算
- ❌ 需要快速響應
- ❌ 狀態模擬耗時

## 🚀 最佳實踐

### 1. 選擇合適的深度

```javascript
// Minimax 深度選擇
const depth = {
  easy: 1,    // 看1步
  medium: 3,  // 看3步
  hard: 9,    // 看到底（井字遊戲）
};
```

### 2. 緩存計算結果

```javascript
const cache = new Map();

const cachedEvaluate = (state) => {
  const key = JSON.stringify(state);
  if (cache.has(key)) {
    return cache.get(key);
  }
  const result = evaluate(state);
  cache.set(key, result);
  return result;
};
```

### 3. 限制執行時間

```javascript
const startTime = Date.now();
const timeLimit = 1000; // 1秒

while (Date.now() - startTime < timeLimit) {
  // 執行 AI 計算
}
```

## 📄 授權

MIT License

---

**讓 AI 為你的遊戲增添智能！🤖**
