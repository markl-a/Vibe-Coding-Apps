/**
 * AI Opponent for Tic-Tac-Toe using Minimax Algorithm
 * 這個模組實現了不可戰勝的 AI 對手
 */

class AIOpponent {
  constructor(difficulty = 'hard') {
    this.difficulty = difficulty; // 'easy', 'medium', 'hard'
  }

  /**
   * 主要的 AI 移動函數
   * @param {Array} board - 當前棋盤狀態
   * @param {string} aiPlayer - AI 玩家的符號 ('X' 或 'O')
   * @returns {number} - 最佳移動的索引位置
   */
  getBestMove(board, aiPlayer) {
    switch (this.difficulty) {
      case 'easy':
        return this.getRandomMove(board);
      case 'medium':
        // 50% 機率使用最佳策略，50% 隨機
        return Math.random() > 0.5
          ? this.getMinimaxMove(board, aiPlayer)
          : this.getRandomMove(board);
      case 'hard':
      default:
        return this.getMinimaxMove(board, aiPlayer);
    }
  }

  /**
   * 隨機移動（簡單難度）
   */
  getRandomMove(board) {
    const availableMoves = this.getAvailableMoves(board);
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  /**
   * 使用 Minimax 演算法獲取最佳移動
   */
  getMinimaxMove(board, aiPlayer) {
    const humanPlayer = aiPlayer === 'X' ? 'O' : 'X';
    let bestScore = -Infinity;
    let bestMove = null;

    const availableMoves = this.getAvailableMoves(board);

    for (const move of availableMoves) {
      // 嘗試這個移動
      const newBoard = [...board];
      newBoard[move] = aiPlayer;

      // 計算這個移動的分數
      const score = this.minimax(newBoard, 0, false, aiPlayer, humanPlayer);

      // 如果這個移動更好，記錄它
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  /**
   * Minimax 演算法核心
   * @param {Array} board - 當前棋盤狀態
   * @param {number} depth - 當前搜索深度
   * @param {boolean} isMaximizing - 是否是最大化玩家的回合
   * @param {string} aiPlayer - AI 玩家符號
   * @param {string} humanPlayer - 人類玩家符號
   * @returns {number} - 當前棋盤狀態的分數
   */
  minimax(board, depth, isMaximizing, aiPlayer, humanPlayer) {
    const winner = this.calculateWinner(board);

    // 終止條件
    if (winner === aiPlayer) {
      return 10 - depth; // AI 獲勝，深度越淺分數越高
    }
    if (winner === humanPlayer) {
      return depth - 10; // 人類獲勝，深度越淺分數越低
    }
    if (this.isBoardFull(board)) {
      return 0; // 平局
    }

    if (isMaximizing) {
      // AI 的回合（最大化分數）
      let bestScore = -Infinity;
      const availableMoves = this.getAvailableMoves(board);

      for (const move of availableMoves) {
        const newBoard = [...board];
        newBoard[move] = aiPlayer;
        const score = this.minimax(newBoard, depth + 1, false, aiPlayer, humanPlayer);
        bestScore = Math.max(score, bestScore);
      }

      return bestScore;
    } else {
      // 人類的回合（最小化分數）
      let bestScore = Infinity;
      const availableMoves = this.getAvailableMoves(board);

      for (const move of availableMoves) {
        const newBoard = [...board];
        newBoard[move] = humanPlayer;
        const score = this.minimax(newBoard, depth + 1, true, aiPlayer, humanPlayer);
        bestScore = Math.min(score, bestScore);
      }

      return bestScore;
    }
  }

  /**
   * 獲取所有可用的移動位置
   */
  getAvailableMoves(board) {
    const moves = [];
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        moves.push(i);
      }
    }
    return moves;
  }

  /**
   * 檢查棋盤是否已滿
   */
  isBoardFull(board) {
    return board.every(cell => cell !== null);
  }

  /**
   * 計算獲勝者
   */
  calculateWinner(board) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // 橫向
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // 縱向
      [0, 4, 8], [2, 4, 6],            // 斜向
    ];

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    return null;
  }

  /**
   * 設置難度
   */
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }

  /**
   * 獲取 AI 提示（給玩家的幫助）
   */
  getHint(board, player) {
    // 使用 Minimax 獲取最佳移動作為提示
    return this.getMinimaxMove(board, player);
  }
}

export default AIOpponent;
