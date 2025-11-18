import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Alert,
  StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const CELL_SIZE = 20;
const GRID_WIDTH = Math.floor((width - 40) / CELL_SIZE);
const GRID_HEIGHT = Math.floor((height * 0.6) / CELL_SIZE);

const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export default function App() {
  const [snake, setSnake] = useState([{ x: 5, y: 5 }]);
  const [food, setFood] = useState({ x: 10, y: 10 });
  const [direction, setDirection] = useState(DIRECTIONS.RIGHT);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [speed, setSpeed] = useState(150); // ms per move
  const [aiAssist, setAiAssist] = useState(false);
  const [suggestedPath, setSuggestedPath] = useState([]);

  const gameLoopRef = useRef(null);
  const directionQueueRef = useRef([]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = setInterval(moveSnake, speed);
      return () => clearInterval(gameLoopRef.current);
    }
  }, [gameStarted, gameOver, direction, snake, speed]);

  useEffect(() => {
    if (aiAssist && gameStarted && !gameOver) {
      calculateAIPath();
    }
  }, [aiAssist, snake, food]);

  const generateFood = () => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_WIDTH),
        y: Math.floor(Math.random() * GRID_HEIGHT),
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  };

  const calculateAIPath = () => {
    // 簡單的 BFS 尋路算法
    const head = snake[0];
    const queue = [[head]];
    const visited = new Set([`${head.x},${head.y}`]);

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (current.x === food.x && current.y === food.y) {
        setSuggestedPath(path.slice(1, 4)); // 只顯示前 3 步
        return;
      }

      for (const dir of Object.values(DIRECTIONS)) {
        const next = {
          x: current.x + dir.x,
          y: current.y + dir.y,
        };

        const key = `${next.x},${next.y}`;
        if (
          !visited.has(key) &&
          next.x >= 0 &&
          next.x < GRID_WIDTH &&
          next.y >= 0 &&
          next.y < GRID_HEIGHT &&
          !snake.some(segment => segment.x === next.x && segment.y === next.y)
        ) {
          visited.add(key);
          queue.push([...path, next]);
        }
      }
    }
    setSuggestedPath([]);
  };

  const moveSnake = () => {
    // Process direction queue
    if (directionQueueRef.current.length > 0) {
      const newDir = directionQueueRef.current.shift();
      if (isValidDirection(newDir)) {
        setDirection(newDir);
        return;
      }
    }

    const head = snake[0];
    const newHead = {
      x: head.x + direction.x,
      y: head.y + direction.y,
    };

    // Check wall collision
    if (
      newHead.x < 0 ||
      newHead.x >= GRID_WIDTH ||
      newHead.y < 0 ||
      newHead.y >= GRID_HEIGHT
    ) {
      endGame();
      return;
    }

    // Check self collision
    if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
      endGame();
      return;
    }

    const newSnake = [newHead, ...snake];

    // Check food collision
    if (newHead.x === food.x && newHead.y === food.y) {
      setScore(prev => prev + 10);
      setFood(generateFood());
      // Increase speed
      setSpeed(prev => Math.max(50, prev - 2));
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  };

  const isValidDirection = (newDir) => {
    // Can't reverse direction
    return !(
      (direction === DIRECTIONS.UP && newDir === DIRECTIONS.DOWN) ||
      (direction === DIRECTIONS.DOWN && newDir === DIRECTIONS.UP) ||
      (direction === DIRECTIONS.LEFT && newDir === DIRECTIONS.RIGHT) ||
      (direction === DIRECTIONS.RIGHT && newDir === DIRECTIONS.LEFT)
    );
  };

  const changeDirection = (newDir) => {
    if (isValidDirection(newDir)) {
      directionQueueRef.current.push(newDir);
    }
  };

  const startGame = () => {
    setSnake([{ x: 5, y: 5 }]);
    setFood(generateFood());
    setDirection(DIRECTIONS.RIGHT);
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setSpeed(150);
    directionQueueRef.current = [];
    setSuggestedPath([]);
  };

  const endGame = () => {
    setGameOver(true);
    setGameStarted(false);
    clearInterval(gameLoopRef.current);

    if (score > bestScore) {
      setBestScore(score);
    }

    Alert.alert(
      '遊戲結束',
      `得分: ${score}\n蛇長: ${snake.length}`,
      [{ text: '再玩一次', onPress: startGame }]
    );
  };

  const isSuggested = (x, y) => {
    return suggestedPath.some(pos => pos.x === x && pos.y === y);
  };

  const renderGrid = () => {
    const grid = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const isSnakeHead = snake[0].x === x && snake[0].y === y;
        const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y);
        const isFood = food.x === x && food.y === y;
        const suggested = isSuggested(x, y);

        grid.push(
          <View
            key={`${x}-${y}`}
            style={[
              styles.cell,
              isSnakeHead && styles.snakeHead,
              isSnakeBody && styles.snakeBody,
              isFood && styles.food,
              suggested && styles.suggestedPath,
            ]}
          />
        );
      }
    }
    return grid;
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />

      <View style={styles.header}>
        <Text style={styles.title}>🐍 貪吃蛇</Text>
        <Text style={styles.subtitle}>Snake Game</Text>
      </View>

      {!gameStarted ? (
        <View style={styles.menuContainer}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>最高分</Text>
              <Text style={styles.statValue}>{bestScore}</Text>
            </View>
            {gameOver && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>本次得分</Text>
                <Text style={styles.statValue}>{score}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={() => setAiAssist(!aiAssist)}
          >
            <Text style={styles.settingLabel}>AI 路徑提示</Text>
            <Text style={styles.settingValue}>{aiAssist ? '開啟' : '關閉'}</Text>
          </TouchableOpacity>

          <View style={styles.instructionsBox}>
            <Text style={styles.instructionTitle}>遊戲說明</Text>
            <Text style={styles.instructionText}>
              • 使用方向按鈕控制蛇移動{'\n'}
              • 吃食物讓蛇變長並得分{'\n'}
              • 避免撞牆和撞到自己{'\n'}
              • 速度會逐漸加快{'\n'}
              {aiAssist && '• 黃色路徑顯示 AI 建議的方向'}
            </Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <Text style={styles.startButtonText}>
              {gameOver ? '再玩一次' : '開始遊戲'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.gameHeader}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>得分</Text>
              <Text style={styles.scoreValue}>{score}</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>長度</Text>
              <Text style={styles.scoreValue}>{snake.length}</Text>
            </View>
          </View>

          <View style={styles.gameBoard}>
            {renderGrid()}
          </View>

          <View style={styles.controls}>
            <View style={styles.controlRow}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => changeDirection(DIRECTIONS.UP)}
              >
                <Text style={styles.controlText}>↑</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.controlRow}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => changeDirection(DIRECTIONS.LEFT)}
              >
                <Text style={styles.controlText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => changeDirection(DIRECTIONS.DOWN)}
              >
                <Text style={styles.controlText}>↓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => changeDirection(DIRECTIONS.RIGHT)}
              >
                <Text style={styles.controlText}>→</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.quitButton} onPress={endGame}>
            <Text style={styles.quitButtonText}>結束遊戲</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C3E50',
    alignItems: 'center',
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  statItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 15,
    minWidth: 120,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
    color: '#2C3E50',
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  settingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
    marginBottom: 30,
  },
  settingLabel: {
    fontSize: 14,
    color: '#2C3E50',
  },
  settingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  instructionsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    marginBottom: 30,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: '#34495E',
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 60,
    paddingVertical: 20,
    borderRadius: 30,
  },
  startButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginBottom: 20,
  },
  scoreBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#2C3E50',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  gameBoard: {
    width: GRID_WIDTH * CELL_SIZE,
    height: GRID_HEIGHT * CELL_SIZE,
    backgroundColor: '#34495E',
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: '#34495E',
  },
  snakeHead: {
    backgroundColor: '#27AE60',
    borderRadius: CELL_SIZE / 4,
  },
  snakeBody: {
    backgroundColor: '#2ECC71',
    borderRadius: CELL_SIZE / 4,
  },
  food: {
    backgroundColor: '#E74C3C',
    borderRadius: CELL_SIZE / 2,
  },
  suggestedPath: {
    backgroundColor: '#F39C12',
    opacity: 0.5,
  },
  controls: {
    marginBottom: 20,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  controlButton: {
    width: 70,
    height: 70,
    backgroundColor: '#3498DB',
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 35,
  },
  controlText: {
    fontSize: 30,
    color: '#fff',
    fontWeight: 'bold',
  },
  quitButton: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  quitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
