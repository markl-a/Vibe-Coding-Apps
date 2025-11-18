import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const GRID_SIZE = 3; // 3x3 grid
const HOLE_SIZE = (width - 80) / GRID_SIZE;
const GAME_DURATION = 30; // 30 seconds

export default function App() {
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [moles, setMoles] = useState(Array(9).fill(false));
  const [difficulty, setDifficulty] = useState('medium'); // easy, medium, hard
  const [aiHintEnabled, setAiHintEnabled] = useState(false);
  const [hintIndex, setHintIndex] = useState(null);

  const moleAnimations = useRef(Array(9).fill(null).map(() => new Animated.Value(0))).current;
  const timerRef = useRef(null);
  const moleSpawnRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (moleSpawnRef.current) clearInterval(moleSpawnRef.current);
    };
  }, []);

  const getSpawnInterval = () => {
    switch (difficulty) {
      case 'easy':
        return 1500;
      case 'medium':
        return 1000;
      case 'hard':
        return 600;
      default:
        return 1000;
    }
  };

  const getMoleVisibleTime = () => {
    switch (difficulty) {
      case 'easy':
        return 2000;
      case 'medium':
        return 1200;
      case 'hard':
        return 800;
      default:
        return 1200;
    }
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGameStarted(true);
    setGameOver(false);
    setMoles(Array(9).fill(false));
    setHintIndex(null);

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start spawning moles
    spawnMole();
    moleSpawnRef.current = setInterval(() => {
      spawnMole();
    }, getSpawnInterval());
  };

  const spawnMole = () => {
    const availableHoles = [];
    moles.forEach((mole, index) => {
      if (!mole) availableHoles.push(index);
    });

    if (availableHoles.length > 0) {
      const randomIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
      showMole(randomIndex);

      // AI Hint: show the first mole that appears
      if (aiHintEnabled && hintIndex === null) {
        setHintIndex(randomIndex);
      }
    }
  };

  const showMole = (index) => {
    setMoles(prev => {
      const newMoles = [...prev];
      newMoles[index] = true;
      return newMoles;
    });

    // Animate mole up
    Animated.spring(moleAnimations[index], {
      toValue: 1,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start();

    // Hide mole after visible time
    setTimeout(() => {
      hideMole(index, false);
    }, getMoleVisibleTime());
  };

  const hideMole = (index, wasHit) => {
    if (wasHit && hintIndex === index) {
      setHintIndex(null);
    }

    // Animate mole down
    Animated.spring(moleAnimations[index], {
      toValue: 0,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start(() => {
      setMoles(prev => {
        const newMoles = [...prev];
        newMoles[index] = false;
        return newMoles;
      });
    });
  };

  const whackMole = (index) => {
    if (!gameStarted || gameOver || !moles[index]) return;

    // Hit the mole
    setScore(prev => prev + 10);
    hideMole(index, true);

    // Vibration feedback (optional, requires expo-haptics)
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const endGame = () => {
    setGameStarted(false);
    setGameOver(true);

    if (timerRef.current) clearInterval(timerRef.current);
    if (moleSpawnRef.current) clearInterval(moleSpawnRef.current);

    // Update best score
    if (score > bestScore) {
      setBestScore(score);
    }

    // Hide all moles
    moles.forEach((mole, index) => {
      if (mole) {
        Animated.timing(moleAnimations[index], {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    });

    setMoles(Array(9).fill(false));
    setHintIndex(null);
  };

  const changeDifficulty = () => {
    const difficulties = ['easy', 'medium', 'hard'];
    const currentIndex = difficulties.indexOf(difficulty);
    const nextDifficulty = difficulties[(currentIndex + 1) % 3];
    setDifficulty(nextDifficulty);
  };

  const getDifficultyText = () => {
    switch (difficulty) {
      case 'easy': return '簡單';
      case 'medium': return '中等';
      case 'hard': return '困難';
      default: return '中等';
    }
  };

  const renderHole = (index) => {
    const isMoleVisible = moles[index];
    const isHinted = aiHintEnabled && hintIndex === index;

    const translateY = moleAnimations[index].interpolate({
      inputRange: [0, 1],
      outputRange: [HOLE_SIZE, 0],
    });

    return (
      <TouchableOpacity
        key={index}
        style={[styles.hole, isHinted && styles.hintedHole]}
        onPress={() => whackMole(index)}
        activeOpacity={0.7}
      >
        <View style={styles.holeInner}>
          {isMoleVisible && (
            <Animated.View
              style={[
                styles.mole,
                {
                  transform: [{ translateY }],
                },
              ]}
            >
              <Text style={styles.moleText}>🐹</Text>
            </Animated.View>
          )}
        </View>
        {isHinted && (
          <View style={styles.hintIndicator}>
            <Text style={styles.hintText}>💡</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />

      <View style={styles.header}>
        <Text style={styles.title}>🔨 打地鼠</Text>
        <Text style={styles.subtitle}>Whack-a-Mole</Text>
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

          <View style={styles.settingsContainer}>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={changeDifficulty}
            >
              <Text style={styles.settingLabel}>難度</Text>
              <Text style={styles.settingValue}>{getDifficultyText()}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setAiHintEnabled(!aiHintEnabled)}
            >
              <Text style={styles.settingLabel}>AI 提示</Text>
              <Text style={styles.settingValue}>{aiHintEnabled ? '開啟' : '關閉'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.instructionsBox}>
            <Text style={styles.instructionTitle}>遊戲說明</Text>
            <Text style={styles.instructionText}>
              • 點擊地洞中出現的地鼠{'\n'}
              • 每打中一隻得 10 分{'\n'}
              • 地鼠會自動消失，要快速反應！{'\n'}
              • 遊戲時間：{GAME_DURATION} 秒{'\n'}
              {aiHintEnabled && '• 💡 標記顯示可以打的地鼠'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.startButton}
            onPress={startGame}
          >
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
            <View style={styles.timerBox}>
              <Text style={styles.timerLabel}>時間</Text>
              <Text style={[
                styles.timerValue,
                timeLeft <= 5 && styles.timerWarning
              ]}>
                {timeLeft}s
              </Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>最高</Text>
              <Text style={styles.scoreValue}>{bestScore}</Text>
            </View>
          </View>

          <View style={styles.gameBoard}>
            {Array(GRID_SIZE).fill(null).map((_, row) => (
              <View key={row} style={styles.row}>
                {Array(GRID_SIZE).fill(null).map((_, col) => {
                  const index = row * GRID_SIZE + col;
                  return renderHole(index);
                })}
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.quitButton}
            onPress={endGame}
          >
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
    backgroundColor: '#8BC34A',
    alignItems: 'center',
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#33691E',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 20,
    color: '#fff',
    marginTop: 5,
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
    color: '#33691E',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#689F38',
  },
  settingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  settingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    color: '#33691E',
    marginBottom: 5,
  },
  settingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#689F38',
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
    color: '#33691E',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: '#558B2F',
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#FF6F00',
    paddingHorizontal: 60,
    paddingVertical: 20,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    marginBottom: 30,
  },
  scoreBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 12,
    minWidth: 90,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#33691E',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#689F38',
  },
  timerBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 12,
    minWidth: 90,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 14,
    color: '#33691E',
  },
  timerValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#689F38',
  },
  timerWarning: {
    color: '#F44336',
  },
  gameBoard: {
    backgroundColor: '#7CB342',
    padding: 10,
    borderRadius: 20,
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
  },
  hole: {
    width: HOLE_SIZE,
    height: HOLE_SIZE,
    margin: 5,
    backgroundColor: '#5D4037',
    borderRadius: HOLE_SIZE / 2,
    overflow: 'hidden',
    position: 'relative',
  },
  hintedHole: {
    borderWidth: 3,
    borderColor: '#FFEB3B',
  },
  holeInner: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  mole: {
    width: HOLE_SIZE * 0.8,
    height: HOLE_SIZE * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8D6E63',
    borderRadius: (HOLE_SIZE * 0.8) / 2,
  },
  moleText: {
    fontSize: HOLE_SIZE * 0.5,
  },
  hintIndicator: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFEB3B',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    fontSize: 16,
  },
  quitButton: {
    backgroundColor: '#D32F2F',
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
