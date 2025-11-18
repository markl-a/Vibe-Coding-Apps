/**
 * Mobile Games AI Helper Library
 * 為移動遊戲提供通用的 AI 輔助功能
 */

class GameAI {
  /**
   * Minimax 演算法 - 用於雙人零和遊戲
   * @param {Object} gameState - 當前遊戲狀態
   * @param {number} depth - 搜索深度
   * @param {boolean} isMaximizing - 是否為最大化玩家
   * @param {Function} evaluate - 評估函數
   * @param {Function} getNextStates - 獲取所有可能的下一個狀態
   * @param {Function} isTerminal - 是否為終止狀態
   * @returns {Object} - {score, move}
   */
  static minimax(gameState, depth, isMaximizing, evaluate, getNextStates, isTerminal) {
    if (depth === 0 || isTerminal(gameState)) {
      return { score: evaluate(gameState), move: null };
    }

    const nextStates = getNextStates(gameState);

    if (isMaximizing) {
      let bestScore = -Infinity;
      let bestMove = null;

      for (const { state, move } of nextStates) {
        const result = this.minimax(state, depth - 1, false, evaluate, getNextStates, isTerminal);
        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = move;
        }
      }

      return { score: bestScore, move: bestMove };
    } else {
      let bestScore = Infinity;
      let bestMove = null;

      for (const { state, move } of nextStates) {
        const result = this.minimax(state, depth - 1, true, evaluate, getNextStates, isTerminal);
        if (result.score < bestScore) {
          bestScore = result.score;
          bestMove = move;
        }
      }

      return { score: bestScore, move: bestMove };
    }
  }

  /**
   * Alpha-Beta 剪枝優化的 Minimax
   */
  static alphabeta(gameState, depth, alpha, beta, isMaximizing, evaluate, getNextStates, isTerminal) {
    if (depth === 0 || isTerminal(gameState)) {
      return { score: evaluate(gameState), move: null };
    }

    const nextStates = getNextStates(gameState);

    if (isMaximizing) {
      let bestScore = -Infinity;
      let bestMove = null;

      for (const { state, move } of nextStates) {
        const result = this.alphabeta(state, depth - 1, alpha, beta, false, evaluate, getNextStates, isTerminal);
        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = move;
        }
        alpha = Math.max(alpha, bestScore);
        if (beta <= alpha) break; // Beta 剪枝
      }

      return { score: bestScore, move: bestMove };
    } else {
      let bestScore = Infinity;
      let bestMove = null;

      for (const { state, move } of nextStates) {
        const result = this.alphabeta(state, depth - 1, alpha, beta, true, evaluate, getNextStates, isTerminal);
        if (result.score < bestScore) {
          bestScore = result.score;
          bestMove = move;
        }
        beta = Math.min(beta, bestScore);
        if (beta <= alpha) break; // Alpha 剪枝
      }

      return { score: bestScore, move: bestMove };
    }
  }

  /**
   * BFS 廣度優先搜索 - 用於尋找最短路徑
   * @param {Object} start - 起始位置
   * @param {Object} goal - 目標位置
   * @param {Function} getNeighbors - 獲取鄰居節點的函數
   * @param {Function} isEqual - 判斷兩個節點是否相同
   * @returns {Array} - 從起點到終點的路徑
   */
  static bfs(start, goal, getNeighbors, isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b)) {
    const queue = [[start]];
    const visited = new Set([JSON.stringify(start)]);

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (isEqual(current, goal)) {
        return path;
      }

      for (const neighbor of getNeighbors(current)) {
        const key = JSON.stringify(neighbor);
        if (!visited.has(key)) {
          visited.add(key);
          queue.push([...path, neighbor]);
        }
      }
    }

    return null; // 未找到路徑
  }

  /**
   * A* 尋路演算法
   * @param {Object} start - 起始位置
   * @param {Object} goal - 目標位置
   * @param {Function} getNeighbors - 獲取鄰居節點
   * @param {Function} heuristic - 啟發式函數（估算到目標的距離）
   * @param {Function} cost - 成本函數（實際移動成本）
   * @returns {Array} - 最短路徑
   */
  static astar(start, goal, getNeighbors, heuristic, cost = () => 1) {
    const openSet = [{ node: start, path: [start], g: 0, f: heuristic(start, goal) }];
    const closedSet = new Set();

    while (openSet.length > 0) {
      // 找到 f 值最小的節點
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();

      const key = JSON.stringify(current.node);
      if (JSON.stringify(current.node) === JSON.stringify(goal)) {
        return current.path;
      }

      closedSet.add(key);

      for (const neighbor of getNeighbors(current.node)) {
        const neighborKey = JSON.stringify(neighbor);
        if (closedSet.has(neighborKey)) continue;

        const g = current.g + cost(current.node, neighbor);
        const h = heuristic(neighbor, goal);
        const f = g + h;

        const existing = openSet.find(item => JSON.stringify(item.node) === neighborKey);
        if (!existing || g < existing.g) {
          if (existing) {
            existing.g = g;
            existing.f = f;
            existing.path = [...current.path, neighbor];
          } else {
            openSet.push({
              node: neighbor,
              path: [...current.path, neighbor],
              g,
              f,
            });
          }
        }
      }
    }

    return null;
  }

  /**
   * 曼哈頓距離 - 常用於網格遊戲的啟發式函數
   */
  static manhattanDistance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  /**
   * 歐幾里得距離
   */
  static euclideanDistance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  /**
   * 模擬退火演算法 - 用於優化問題
   */
  static simulatedAnnealing(initialState, getNeighbor, energy, temperature = 1000, coolingRate = 0.95) {
    let current = initialState;
    let currentEnergy = energy(current);
    let best = current;
    let bestEnergy = currentEnergy;

    while (temperature > 1) {
      const neighbor = getNeighbor(current);
      const neighborEnergy = energy(neighbor);
      const delta = neighborEnergy - currentEnergy;

      if (delta < 0 || Math.random() < Math.exp(-delta / temperature)) {
        current = neighbor;
        currentEnergy = neighborEnergy;

        if (currentEnergy < bestEnergy) {
          best = current;
          bestEnergy = currentEnergy;
        }
      }

      temperature *= coolingRate;
    }

    return best;
  }

  /**
   * 遺傳演算法 - 用於進化式優化
   */
  static geneticAlgorithm(
    populationSize,
    generateIndividual,
    fitness,
    crossover,
    mutate,
    generations = 100
  ) {
    let population = Array(populationSize).fill(null).map(generateIndividual);

    for (let gen = 0; gen < generations; gen++) {
      // 評估適應度
      const fitnessScores = population.map(fitness);

      // 選擇
      const selected = this.tournamentSelection(population, fitnessScores, populationSize);

      // 交叉和變異
      const nextGeneration = [];
      for (let i = 0; i < populationSize; i += 2) {
        let child1 = selected[i];
        let child2 = selected[i + 1] || selected[i];

        if (Math.random() < 0.7) {
          [child1, child2] = crossover(child1, child2);
        }

        if (Math.random() < 0.1) {
          child1 = mutate(child1);
        }
        if (Math.random() < 0.1) {
          child2 = mutate(child2);
        }

        nextGeneration.push(child1, child2);
      }

      population = nextGeneration.slice(0, populationSize);
    }

    // 返回最佳個體
    const fitnessScores = population.map(fitness);
    const bestIndex = fitnessScores.indexOf(Math.max(...fitnessScores));
    return population[bestIndex];
  }

  /**
   * 錦標賽選擇
   */
  static tournamentSelection(population, fitnessScores, count, tournamentSize = 3) {
    const selected = [];

    for (let i = 0; i < count; i++) {
      let best = null;
      let bestFitness = -Infinity;

      for (let j = 0; j < tournamentSize; j++) {
        const idx = Math.floor(Math.random() * population.length);
        if (fitnessScores[idx] > bestFitness) {
          best = population[idx];
          bestFitness = fitnessScores[idx];
        }
      }

      selected.push(best);
    }

    return selected;
  }

  /**
   * 蒙特卡洛樹搜索 (MCTS) - 用於複雜遊戲
   */
  static mcts(rootState, getNextStates, isTerminal, evaluate, iterations = 1000) {
    const root = { state: rootState, visits: 0, value: 0, children: [], parent: null };

    for (let i = 0; i < iterations; i++) {
      let node = root;

      // Selection
      while (node.children.length > 0 && !isTerminal(node.state)) {
        node = this.uctSelect(node);
      }

      // Expansion
      if (!isTerminal(node.state) && node.visits > 0) {
        const nextStates = getNextStates(node.state);
        for (const { state, move } of nextStates) {
          node.children.push({
            state,
            move,
            visits: 0,
            value: 0,
            children: [],
            parent: node,
          });
        }
        if (node.children.length > 0) {
          node = node.children[0];
        }
      }

      // Simulation
      const value = this.simulate(node.state, getNextStates, isTerminal, evaluate);

      // Backpropagation
      while (node !== null) {
        node.visits++;
        node.value += value;
        node = node.parent;
      }
    }

    // 選擇訪問次數最多的子節點
    let bestChild = root.children[0];
    for (const child of root.children) {
      if (child.visits > bestChild.visits) {
        bestChild = child;
      }
    }

    return bestChild.move;
  }

  /**
   * UCT 選擇
   */
  static uctSelect(node, exploration = Math.sqrt(2)) {
    let best = node.children[0];
    let bestUCT = -Infinity;

    for (const child of node.children) {
      const uct = child.visits === 0
        ? Infinity
        : child.value / child.visits +
          exploration * Math.sqrt(Math.log(node.visits) / child.visits);

      if (uct > bestUCT) {
        best = child;
        bestUCT = uct;
      }
    }

    return best;
  }

  /**
   * 模擬遊戲至結束
   */
  static simulate(state, getNextStates, isTerminal, evaluate) {
    let currentState = state;

    while (!isTerminal(currentState)) {
      const nextStates = getNextStates(currentState);
      if (nextStates.length === 0) break;
      currentState = nextStates[Math.floor(Math.random() * nextStates.length)].state;
    }

    return evaluate(currentState);
  }
}

export default GameAI;
