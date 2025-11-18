# 🎮 推箱子 AI 輔助系統

## AI 功能說明

本專案提供了智能提示系統，幫助玩家解決推箱子謎題。

### 🤖 AI 功能特性

1. **智能提示系統** - 分析當前局面並給出最佳移動建議
2. **BFS 路徑尋找** - 檢查玩家是否能到達箱子推動位置
3. **死鎖檢測** - 識別無法移動的箱子（角落死鎖）
4. **進度分析** - 顯示完成百分比和平均距離
5. **難度評估** - 自動評估當前關卡難度

### 📚 使用方法

#### 整合 AI 提示系統

在 `game.js` 中添加 AI 支持：

```javascript
// 在 create() 函數中初始化 AI
this.solver = new SokobanSolver(levels[currentLevel]);

// 在 update() 或鍵盤事件中獲取提示
function showHint() {
    const currentState = {
        playerX: playerX,
        playerY: playerY,
        boxes: boxes,
        targets: targets
    };

    const hint = this.solver.getHint(currentState);

    if (hint.direction) {
        console.log(`💡 提示: ${hint.reason}`);
        console.log(`建議方向: ${hint.direction}`);
    }
}

// 按 H 鍵顯示提示
this.input.keyboard.on('keydown-H', showHint);
```

#### 分析當前進度

```javascript
const analysis = solver.analyzePosition(currentState);

console.log(`進度: ${analysis.progress}`);
console.log(`已完成: ${analysis.boxesOnTarget}/${analysis.totalBoxes}`);
console.log(`平均距離: ${analysis.averageDistance}`);
console.log(`難度: ${analysis.difficulty}`);
```

#### 檢測死鎖

```javascript
boxes.forEach(box => {
    const deadlock = solver.detectDeadlock(box, walls);
    if (deadlock.isDeadlock) {
        console.warn(`⚠️ ${deadlock.reason}`);
        // 可以高亮顯示死鎖的箱子
    }
});
```

### 🎮 建議的控制方案

- `H` 鍵 - 顯示下一步提示
- `A` 鍵 - 分析當前局面
- `U` 鍵 - 撤銷上一步（需要實現歷史記錄）
- `R` 鍵 - 重置關卡

### 🧠 AI 算法詳解

#### 提示生成算法

```
1. 遍歷所有未在目標點的箱子
2. 為每個箱子找到最近的目標點
3. 使用 BFS 檢查玩家能否到達箱子
4. 計算移動優先級（基於距離）
5. 返回最優先的移動建議
```

#### BFS 路徑尋找

```javascript
function bfsPlayerPath(start, goal, obstacles) {
    queue = [start]
    visited = {start}

    while queue not empty:
        current = queue.pop()
        if current == goal:
            return true

        for each neighbor of current:
            if neighbor walkable and not visited:
                visited.add(neighbor)
                queue.add(neighbor)

    return false
}
```

#### 死鎖檢測

```
箱子在角落 = (左或右有牆) AND (上或下有牆)
如果箱子在角落且不是目標點 → 死鎖
```

### 📊 AI 功能演示

```javascript
// 完整示例
class GameWithAI {
    create() {
        // 初始化 AI
        this.solver = new SokobanSolver(currentLevel);
        this.hintEnabled = false;

        // 添加按鍵監聽
        this.input.keyboard.on('keydown-H', () => {
            this.hintEnabled = !this.hintEnabled;
            if (this.hintEnabled) {
                this.showHint();
            }
        });

        this.input.keyboard.on('keydown-A', () => {
            this.showAnalysis();
        });
    }

    showHint() {
        const state = this.getCurrentState();
        const hint = this.solver.getHint(state);

        // 在畫面上顯示提示
        this.hintText.setText(hint.reason);

        // 可以用箭頭或高亮顯示建議方向
        if (hint.direction) {
            this.drawHintArrow(hint.direction);
        }
    }

    showAnalysis() {
        const state = this.getCurrentState();
        const analysis = this.solver.analyzePosition(state);

        const text = `
            進度: ${analysis.progress}
            已完成: ${analysis.boxesOnTarget}/${analysis.totalBoxes}
            難度: ${analysis.difficulty}
        `;

        this.analysisText.setText(text);
    }
}
```

### 🎯 高級功能

#### 1. 完整解決方案生成（BFS/A*）

```javascript
class AdvancedSolver extends SokobanSolver {
    findSolution(initialState) {
        // 使用 A* 搜索完整解決方案
        // 狀態: {playerPos, boxPositions}
        // 動作: {UP, DOWN, LEFT, RIGHT}
        // 目標: 所有箱子在目標點

        const openSet = new PriorityQueue();
        openSet.add(initialState, 0);

        while (!openSet.empty()) {
            const current = openSet.pop();

            if (this.isWin(current)) {
                return this.reconstructPath(current);
            }

            // 展開所有可能的移動...
        }

        return null; // 無解
    }
}
```

#### 2. 提示視覺化

```javascript
function drawHintArrow(graphics, box, direction) {
    const arrowLength = 30;
    const arrowColor = 0xFFFF00;

    let endX = box.x, endY = box.y;

    switch(direction) {
        case 'UP': endY -= arrowLength; break;
        case 'DOWN': endY += arrowLength; break;
        case 'LEFT': endX -= arrowLength; break;
        case 'RIGHT': endX += arrowLength; break;
    }

    graphics.lineStyle(3, arrowColor, 1);
    graphics.beginPath();
    graphics.moveTo(box.x, box.y);
    graphics.lineTo(endX, endY);
    graphics.strokePath();

    // 繪製箭頭頭部...
}
```

#### 3. 學習模式

```javascript
class LearningMode {
    constructor(solver) {
        this.solver = solver;
        this.mistakes = [];
        this.hints = [];
    }

    recordMove(move) {
        // 記錄玩家移動
        this.moveHistory.push(move);

        // 檢查是否導致死鎖
        const deadlock = this.solver.detectDeadlock(move.box);
        if (deadlock.isDeadlock) {
            this.mistakes.push({
                move: move,
                reason: deadlock.reason
            });
        }
    }

    getPersonalizedHint() {
        // 基於玩家歷史錯誤給出個性化提示
        const commonMistakes = this.analyzeCommonMistakes();
        return `注意避免: ${commonMistakes}`;
    }
}
```

### 🎓 學習要點

1. **BFS vs A*** - BFS 適合找最短步數，A* 適合找最優解
2. **狀態空間搜索** - 推箱子的狀態空間指數級增長
3. **死鎖檢測** - 及早發現無解狀態可以大幅提升性能
4. **啟發式函數** - 好的啟發式可以減少 90% 的搜索時間

### 📝 已知限制

- 當前實現是啟發式提示，不保證最優解
- 複雜關卡的完整求解可能需要較長時間
- 未檢測所有類型的死鎖（如箱子連鎖）

### 🤝 進階挑戰

1. **實現完整的 A* 求解器** - 找到最少步數的解
2. **添加更多死鎖模式** - 檢測複雜死鎖
3. **優化搜索算法** - 使用更好的啟發式函數
4. **添加關卡編輯器** - 允許玩家創建關卡
5. **實現撤銷/重做** - 完整的歷史記錄系統

---

**💡 提示**：推箱子是 PSPACE-complete 問題，某些關卡可能沒有高效算法！
