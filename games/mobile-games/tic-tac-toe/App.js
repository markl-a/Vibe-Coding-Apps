import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';

const { width } = Dimensions.get('window');
const CELL_SIZE = (width - 80) / 3;

export default function App() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [winningLine, setWinningLine] = useState(null);
  const [animations] = useState(
    Array(9).fill(null).map(() => new Animated.Value(1))
  );

  useEffect(() => {
    const winner = calculateWinner(board);
    if (winner) {
      setWinningLine(winner.line);
      setTimeout(() => {
        Alert.alert(
          '遊戲結束',
          `${winner.winner} 獲勝！`,
          [{ text: '再玩一局', onPress: resetGame }]
        );
        setScores(prev => ({
          ...prev,
          [winner.winner]: prev[winner.winner] + 1
        }));
      }, 500);
    } else if (board.every(cell => cell !== null)) {
      setTimeout(() => {
        Alert.alert(
          '平局',
          '這局是平局！',
          [{ text: '再玩一局', onPress: resetGame }]
        );
        setScores(prev => ({
          ...prev,
          draws: prev.draws + 1
        }));
      }, 500);
    }
  }, [board]);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    return null;
  };

  const handlePress = (index) => {
    if (board[index] || calculateWinner(board)) {
      return;
    }

    // 動畫效果
    Animated.sequence([
      Animated.timing(animations[index], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animations[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinningLine(null);
    animations.forEach(anim => anim.setValue(1));
  };

  const resetScores = () => {
    Alert.alert(
      '重置分數',
      '確定要重置所有分數嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          onPress: () => {
            setScores({ X: 0, O: 0, draws: 0 });
            resetGame();
          }
        }
      ]
    );
  };

  const renderCell = (index) => {
    const isWinningCell = winningLine && winningLine.includes(index);
    const value = board[index];

    return (
      <Animated.View
        key={index}
        style={[
          styles.cell,
          isWinningCell && styles.winningCell,
          { transform: [{ scale: animations[index] }] }
        ]}
      >
        <TouchableOpacity
          style={styles.cellTouchable}
          onPress={() => handlePress(index)}
          disabled={!!value || !!calculateWinner(board)}
        >
          <Text style={[
            styles.cellText,
            value === 'X' ? styles.xText : styles.oText,
            isWinningCell && styles.winningText
          ]}>
            {value}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const winner = calculateWinner(board);
  const status = winner
    ? `獲勝者: ${winner.winner}`
    : board.every(cell => cell !== null)
    ? '平局！'
    : `下一位: ${isXNext ? 'X' : 'O'}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>井字遊戲</Text>
        <Text style={styles.subtitle}>Tic-Tac-Toe</Text>
      </View>

      <View style={styles.scoreBoard}>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>X</Text>
          <Text style={styles.scoreValue}>{scores.X}</Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>平局</Text>
          <Text style={styles.scoreValue}>{scores.draws}</Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>O</Text>
          <Text style={styles.scoreValue}>{scores.O}</Text>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <View style={styles.board}>
        {[0, 1, 2].map(row => (
          <View key={row} style={styles.row}>
            {[0, 1, 2].map(col => renderCell(row * 3 + col))}
          </View>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={resetGame}
        >
          <Text style={styles.buttonText}>重新開始</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={resetScores}
        >
          <Text style={styles.buttonText}>清除分數</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>遊戲規則</Text>
        <Text style={styles.instructionsText}>
          • 兩位玩家輪流在 3x3 格子中放置 X 和 O{'\n'}
          • 先將三個相同符號連成一線者獲勝{'\n'}
          • 連線可以是橫向、縱向或斜向{'\n'}
          • 如果格子填滿仍無人獲勝則為平局
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#eee',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#aaa',
    letterSpacing: 2,
  },
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f3460',
  },
  statusContainer: {
    backgroundColor: '#0f3460',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 30,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#eee',
    textAlign: 'center',
  },
  board: {
    backgroundColor: '#16213e',
    padding: 10,
    borderRadius: 20,
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    margin: 5,
    backgroundColor: '#0f3460',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  winningCell: {
    backgroundColor: '#e94560',
  },
  cellTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: CELL_SIZE * 0.6,
    fontWeight: 'bold',
  },
  xText: {
    color: '#4ecdc4',
  },
  oText: {
    color: '#ff6b6b',
  },
  winningText: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    flex: 0.45,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resetButton: {
    backgroundColor: '#e94560',
  },
  clearButton: {
    backgroundColor: '#533483',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructions: {
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 15,
    width: '100%',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#eee',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 22,
  },
});
