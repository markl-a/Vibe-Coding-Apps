// 推箱子 AI 求解器
// 使用 BFS 算法尋找解決方案

class SokobanSolver {
    constructor(level) {
        this.level = level;
        this.width = level.width;
        this.height = level.height;
    }

    /**
     * 獲取下一步提示
     * @param {Object} currentState - 當前遊戲狀態
     * @returns {Object|null} 提示信息 {direction, reason}
     */
    getHint(currentState) {
        const {playerX, playerY, boxes, targets} = currentState;

        // 檢查每個箱子，找出最佳移動建議
        const hints = [];

        boxes.forEach((box, index) => {
            // 檢查這個箱子是否在目標上
            const isOnTarget = targets.some(t => t.x === box.x && t.y === box.y);

            if (!isOnTarget) {
                // 找到最近的目標
                const nearestTarget = this.findNearestTarget(box, targets);

                if (nearestTarget) {
                    // 計算玩家到箱子的路徑
                    const canReach = this.canPlayerReachBox(
                        playerX, playerY, box, boxes
                    );

                    if (canReach) {
                        const direction = this.getDirectionToTarget(box, nearestTarget);
                        hints.push({
                            box: index,
                            direction: direction,
                            distance: this.manhattanDistance(box, nearestTarget),
                            reason: `將箱子 #${index + 1} 推向最近的目標點`
                        });
                    }
                }
            }
        });

        // 返回最優先的提示
        if (hints.length > 0) {
            hints.sort((a, b) => a.distance - b.distance);
            return hints[0];
        }

        return {
            direction: null,
            reason: "太棒了！所有箱子都已就位"
        };
    }

    /**
     * 檢查玩家是否能到達箱子的推動位置
     */
    canPlayerReachBox(playerX, playerY, box, allBoxes) {
        // 簡化版：檢查玩家到箱子周圍四個位置的可達性
        const pushPositions = [
            {x: box.x - 1, y: box.y, dir: 'right'},
            {x: box.x + 1, y: box.y, dir: 'left'},
            {x: box.x, y: box.y - 1, dir: 'down'},
            {x: box.x, y: box.y + 1, dir: 'up'}
        ];

        return pushPositions.some(pos => {
            return this.isWalkable(pos.x, pos.y, allBoxes) &&
                   this.bfsPlayerPath(playerX, playerY, pos.x, pos.y, allBoxes);
        });
    }

    /**
     * BFS 尋找玩家路徑
     */
    bfsPlayerPath(startX, startY, goalX, goalY, boxes) {
        const visited = new Set();
        const queue = [{x: startX, y: startY}];
        visited.add(`${startX},${startY}`);

        while (queue.length > 0) {
            const current = queue.shift();

            if (current.x === goalX && current.y === goalY) {
                return true;
            }

            const neighbors = [
                {x: current.x - 1, y: current.y},
                {x: current.x + 1, y: current.y},
                {x: current.x, y: current.y - 1},
                {x: current.x, y: current.y + 1}
            ];

            neighbors.forEach(next => {
                const key = `${next.x},${next.y}`;
                if (!visited.has(key) && this.isWalkable(next.x, next.y, boxes)) {
                    visited.add(key);
                    queue.push(next);
                }
            });
        }

        return false;
    }

    /**
     * 檢查位置是否可行走
     */
    isWalkable(x, y, boxes) {
        // 檢查邊界
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }

        // 檢查牆壁
        if (this.level.map[y][x] === 3) {
            return false;
        }

        // 檢查箱子
        if (boxes.some(box => box.x === x && box.y === y)) {
            return false;
        }

        return true;
    }

    /**
     * 找到最近的目標
     */
    findNearestTarget(box, targets) {
        let nearest = null;
        let minDist = Infinity;

        targets.forEach(target => {
            // 跳過已經有箱子的目標（除非就是這個箱子）
            const dist = this.manhattanDistance(box, target);
            if (dist > 0 && dist < minDist) {
                minDist = dist;
                nearest = target;
            }
        });

        return nearest;
    }

    /**
     * 曼哈頓距離
     */
    manhattanDistance(pos1, pos2) {
        return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
    }

    /**
     * 獲取移動方向
     */
    getDirectionToTarget(box, target) {
        const dx = target.x - box.x;
        const dy = target.y - box.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'RIGHT' : 'LEFT';
        } else {
            return dy > 0 ? 'DOWN' : 'UP';
        }
    }

    /**
     * 分析當前局面
     */
    analyzePosition(currentState) {
        const {boxes, targets} = currentState;

        let boxesOnTarget = 0;
        let totalDistance = 0;

        boxes.forEach(box => {
            const isOnTarget = targets.some(t => t.x === box.x && t.y === box.y);
            if (isOnTarget) {
                boxesOnTarget++;
            } else {
                const nearest = this.findNearestTarget(box, targets);
                if (nearest) {
                    totalDistance += this.manhattanDistance(box, nearest);
                }
            }
        });

        return {
            progress: (boxesOnTarget / boxes.length * 100).toFixed(1) + '%',
            boxesOnTarget: boxesOnTarget,
            totalBoxes: boxes.length,
            averageDistance: boxes.length > boxesOnTarget ?
                (totalDistance / (boxes.length - boxesOnTarget)).toFixed(1) : 0,
            difficulty: this.estimateDifficulty(totalDistance, boxes.length)
        };
    }

    /**
     * 估計難度
     */
    estimateDifficulty(totalDistance, boxCount) {
        const avgDist = totalDistance / boxCount;
        if (avgDist < 3) return '簡單';
        if (avgDist < 6) return '中等';
        if (avgDist < 10) return '困難';
        return '極難';
    }

    /**
     * 檢測死鎖（箱子被卡住）
     */
    detectDeadlock(box, walls) {
        // 檢查角落死鎖
        const x = box.x;
        const y = box.y;

        const isWall = (px, py) => {
            return px < 0 || px >= this.width ||
                   py < 0 || py >= this.height ||
                   this.level.map[py][px] === 3;
        };

        // 檢查四個角落
        const corners = [
            {h: isWall(x-1, y), v: isWall(x, y-1)}, // 左上
            {h: isWall(x+1, y), v: isWall(x, y-1)}, // 右上
            {h: isWall(x-1, y), v: isWall(x, y+1)}, // 左下
            {h: isWall(x+1, y), v: isWall(x, y+1)}  // 右下
        ];

        // 如果箱子在任何角落且不是目標點
        const isTarget = this.level.map[y][x] === 4;
        if (!isTarget) {
            for (const corner of corners) {
                if (corner.h && corner.v) {
                    return {
                        isDeadlock: true,
                        reason: '箱子被困在角落，無法移動'
                    };
                }
            }
        }

        return {isDeadlock: false};
    }
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SokobanSolver;
}
