import React, { useState, useEffect } from 'react';
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

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 100) / 4;

// 卡片圖案
const CARD_SYMBOLS = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎡', '🎢', '🎰'];

export default function App() {
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [bestScore, setBestScore] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('medium'); // easy: 3x4, medium: 4x4, hard: 4x5
  const [aiHintEnabled, setAiHintEnabled] = useState(false);
  const [hintPair, setHintPair] = useState(null);

  useEffect(() => {
    initializeGame();
  }, [difficulty]);

  const getDifficulty = () => {
    switch (difficulty) {
      case 'easy':
        return { pairs: 6, grid: [3, 4] }; // 3x4 = 12 cards
      case 'medium':
        return { pairs: 8, grid: [4, 4] }; // 4x4 = 16 cards
      case 'hard':
        return { pairs: 10, grid: [4, 5] }; // 4x5 = 20 cards
      default:
        return { pairs: 8, grid: [4, 4] };
    }
  };

  const initializeGame = () => {
    const { pairs } = getDifficulty();
    const symbols = CARD_SYMBOLS.slice(0, pairs);
    const cardPairs = [...symbols, ...symbols];

    // 洗牌
    const shuffled = cardPairs
      .map((symbol, index) => ({ symbol, id: index, originalIndex: Math.floor(index / 2) }))
      .sort(() => Math.random() - 0.5);

    setCards(shuffled);
    setFlippedIndices([]);
    setMatchedPairs([]);
    setMoves(0);
    setHintPair(null);
  };

  const startGame = () => {
    setGameStarted(true);
    initializeGame();
  };

  const handleCardPress = (index) => {
    if (!gameStarted) return;
    if (flippedIndices.length === 2) return;
    if (flippedIndices.includes(index)) return;
    if (matchedPairs.includes(cards[index].originalIndex)) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      checkMatch(newFlipped);
    }
  };

  const checkMatch = (indices) => {
    const [first, second] = indices;
    const firstCard = cards[first];
    const secondCard = cards[second];

    if (firstCard.symbol === secondCard.symbol) {
      // 配對成功
      setTimeout(() => {
        setMatchedPairs([...matchedPairs, firstCard.originalIndex]);
        setFlippedIndices([]);

        // 檢查遊戲是否結束
        if (matchedPairs.length + 1 === getDifficulty().pairs) {
          endGame();
        }
      }, 500);
    } else {
      // 配對失敗
      setTimeout(() => {
        setFlippedIndices([]);
      }, 1000);
    }
  };

  const endGame = () => {
    setTimeout(() => {
      const message = `恭喜完成！\n移動次數: ${moves}`;
      Alert.alert('遊戲結束', message, [
        { text: '再玩一次', onPress: startGame }
      ]);

      if (bestScore === null || moves < bestScore) {
        setBestScore(moves);
      }
    }, 500);
  };

  const getAIHint = () => {
    if (!aiHintEnabled) return;

    // 找到已翻開但未配對的卡片
    const unmatched = cards
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => !matchedPairs.includes(card.originalIndex));

    // 找到第一對可以配對的卡片
    for (let i = 0; i < unmatched.length; i++) {
      for (let j = i + 1; j < unmatched.length; j++) {
        if (unmatched[i].card.symbol === unmatched[j].card.symbol) {
          setHintPair([unmatched[i].index, unmatched[j].index]);
          setTimeout(() => setHintPair(null), 2000);
          return;
        }
      }
    }
  };

  const changeDifficulty = () => {
    const difficulties = ['easy', 'medium', 'hard'];
    const currentIndex = difficulties.indexOf(difficulty);
    const nextDifficulty = difficulties[(currentIndex + 1) % 3];
    setDifficulty(nextDifficulty);
    setGameStarted(false);
  };

  const getDifficultyText = () => {
    switch (difficulty) {
      case 'easy': return '簡單 (3x4)';
      case 'medium': return '中等 (4x4)';
      case 'hard': return '困難 (4x5)';
      default: return '中等';
    }
  };

  const isCardFlipped = (index) => {
    return flippedIndices.includes(index) ||
           matchedPairs.includes(cards[index]?.originalIndex);
  };

  const isCardHinted = (index) => {
    return hintPair && hintPair.includes(index);
  };

  const renderCard = (card, index) => {
    const flipped = isCardFlipped(index);
    const hinted = isCardHinted(index);

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.card,
          flipped && styles.cardFlipped,
          hinted && styles.cardHinted,
        ]}
        onPress={() => handleCardPress(index)}
        disabled={!gameStarted || flipped}
      >
        <Text style={styles.cardText}>
          {flipped ? card.symbol : '?'}
        </Text>
      </TouchableOpacity>
    );
  };

  const { grid } = getDifficulty();

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />

      <View style={styles.header}>
        <Text style={styles.title}>🧠 記憶翻牌</Text>
        <Text style={styles.subtitle}>Memory Card Game</Text>
      </View>

      {!gameStarted ? (
        <View style={styles.menuContainer}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>最佳成績</Text>
              <Text style={styles.statValue}>
                {bestScore !== null ? `${bestScore} 步` : '--'}
              </Text>
            </View>
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
              • 翻開兩張卡片尋找配對{'\n'}
              • 記住卡片位置{'\n'}
              • 找到所有配對即獲勝{'\n'}
              • 使用最少步數完成遊戲{'\n'}
              {aiHintEnabled && '• AI 提示會短暫高亮可配對的卡片'}
            </Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <Text style={styles.startButtonText}>開始遊戲</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.gameHeader}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>移動次數</Text>
              <Text style={styles.scoreValue}>{moves}</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>配對數</Text>
              <Text style={styles.scoreValue}>
                {matchedPairs.length} / {getDifficulty().pairs}
              </Text>
            </View>
          </View>

          {aiHintEnabled && (
            <TouchableOpacity style={styles.hintButton} onPress={getAIHint}>
              <Text style={styles.hintButtonText}>💡 AI 提示</Text>
            </TouchableOpacity>
          )}

          <View style={styles.gameBoard}>
            {Array(grid[0]).fill(null).map((_, row) => (
              <View key={row} style={styles.row}>
                {Array(grid[1]).fill(null).map((_, col) => {
                  const index = row * grid[1] + col;
                  return cards[index] && renderCard(cards[index], index);
                })}
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.quitButton} onPress={() => setGameStarted(false)}>
            <Text style={styles.quitButtonText}>返回菜單</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667EEA',
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
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 18,
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
    marginBottom: 30,
  },
  statItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 15,
    minWidth: 200,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
    color: '#667EEA',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#764BA2',
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
    color: '#667EEA',
    marginBottom: 5,
  },
  settingValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#764BA2',
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
    color: '#667EEA',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: '#764BA2',
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#F093FB',
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
    marginBottom: 20,
  },
  scoreBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 12,
    minWidth: 130,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#667EEA',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#764BA2',
  },
  hintButton: {
    backgroundColor: '#F093FB',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 20,
  },
  hintButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  gameBoard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  cardFlipped: {
    backgroundColor: '#F093FB',
  },
  cardHinted: {
    backgroundColor: '#FFD700',
    borderWidth: 3,
    borderColor: '#FFA500',
  },
  cardText: {
    fontSize: CARD_SIZE * 0.5,
    fontWeight: 'bold',
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
