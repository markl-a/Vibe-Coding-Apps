import React, { Component } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Player from './entities/Player';
import Obstacle from './entities/Obstacle';
import Coin from './entities/Coin';
import Ground from './entities/Ground';
import GameLoop from './systems/GameLoop';

const { width, height } = Dimensions.get('window');

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      running: false,
      score: 0,
      coins: 0,
      bestScore: 0,
      gameOver: false,
      gameStarted: false,
    };

    this.gameEngine = null;
  }

  async componentDidMount() {
    await this.loadBestScore();
  }

  async loadBestScore() {
    try {
      const bestScore = await AsyncStorage.getItem('bestScore');
      if (bestScore !== null) {
        this.setState({ bestScore: parseInt(bestScore) });
      }
    } catch (e) {
      console.log('Error loading best score:', e);
    }
  }

  async saveBestScore(score) {
    try {
      if (score > this.state.bestScore) {
        await AsyncStorage.setItem('bestScore', score.toString());
        this.setState({ bestScore: score });
      }
    } catch (e) {
      console.log('Error saving best score:', e);
    }
  }

  setupWorld = () => {
    const player = {
      position: { x: 100, y: height - 220 },
      size: { width: 50, height: 50 },
      velocity: { y: 0 },
      isJumping: false,
      renderer: Player,
    };

    const ground = {
      position: { x: 0, y: height - 100 },
      size: { width: width, height: 100 },
      renderer: Ground,
    };

    return {
      player,
      ground,
      obstacles: {},
      coins: {},
      gameState: {
        score: 0,
        coins: 0,
        speed: 5,
        obstacleTimer: 0,
        coinTimer: 0,
      },
    };
  };

  onEvent = (e) => {
    if (e.type === 'game-over') {
      this.saveBestScore(this.state.score);
      this.setState({
        running: false,
        gameOver: true,
      });
    }
    if (e.type === 'score-update') {
      this.setState({
        score: e.score,
        coins: e.coins,
      });
    }
  };

  startGame = () => {
    this.setState({
      running: true,
      score: 0,
      coins: 0,
      gameOver: false,
      gameStarted: true,
    });
  };

  reset = () => {
    this.gameEngine.swap(this.setupWorld());
    this.setState({
      running: false,
      score: 0,
      coins: 0,
      gameOver: false,
      gameStarted: false,
    });
  };

  jump = () => {
    if (this.state.running) {
      this.gameEngine.dispatch({ type: 'jump' });
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />

        {this.state.gameStarted ? (
          <>
            <GameEngine
              ref={(ref) => { this.gameEngine = ref; }}
              style={styles.gameContainer}
              systems={[GameLoop]}
              entities={this.setupWorld()}
              running={this.state.running}
              onEvent={this.onEvent}
            >
              <View style={styles.header}>
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreLabel}>SCORE</Text>
                  <Text style={styles.scoreText}>{this.state.score}</Text>
                </View>
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreLabel}>COINS</Text>
                  <Text style={styles.coinsText}>💰 {this.state.coins}</Text>
                </View>
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreLabel}>BEST</Text>
                  <Text style={styles.scoreText}>{this.state.bestScore}</Text>
                </View>
              </View>
            </GameEngine>

            <TouchableOpacity
              style={styles.jumpButton}
              onPress={this.jump}
              activeOpacity={0.8}
            >
              <Text style={styles.jumpButtonText}>JUMP</Text>
            </TouchableOpacity>

            {this.state.gameOver && (
              <View style={styles.gameOverContainer}>
                <View style={styles.gameOverBox}>
                  <Text style={styles.gameOverText}>Game Over!</Text>
                  <Text style={styles.finalScoreText}>Score: {this.state.score}</Text>
                  <Text style={styles.finalCoinsText}>Coins: {this.state.coins}</Text>
                  {this.state.score > this.state.bestScore && (
                    <Text style={styles.newRecordText}>🎉 New Record!</Text>
                  )}
                  <TouchableOpacity style={styles.restartButton} onPress={this.reset}>
                    <Text style={styles.restartText}>Play Again</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.startContainer}>
            <Text style={styles.titleText}>🏃 Endless Runner</Text>
            <Text style={styles.subtitleText}>Dodge obstacles and collect coins!</Text>
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionTitle}>How to Play:</Text>
              <Text style={styles.instructionText}>• Tap JUMP to jump over obstacles</Text>
              <Text style={styles.instructionText}>• Collect coins for bonus points</Text>
              <Text style={styles.instructionText}>• Game gets faster as you progress</Text>
              <Text style={styles.instructionText}>• Don't hit the obstacles!</Text>
            </View>
            <View style={styles.bestScoreBox}>
              <Text style={styles.bestScoreLabel}>Best Score</Text>
              <Text style={styles.bestScoreValue}>{this.state.bestScore}</Text>
            </View>
            <TouchableOpacity style={styles.startButton} onPress={this.startGame}>
              <Text style={styles.startButtonText}>START GAME</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  gameContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  coinsText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  jumpButton: {
    position: 'absolute',
    bottom: 120,
    right: 30,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 50,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  jumpButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  gameOverContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  gameOverBox: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 300,
  },
  gameOverText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 15,
  },
  finalScoreText: {
    fontSize: 24,
    color: '#333',
    marginBottom: 5,
  },
  finalCoinsText: {
    fontSize: 20,
    color: '#FFD700',
    marginBottom: 15,
  },
  newRecordText: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  restartButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 10,
  },
  restartText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titleText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 20,
    color: '#FFF',
    marginBottom: 30,
    textAlign: 'center',
  },
  instructionsBox: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    width: '90%',
  },
  instructionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 3,
  },
  bestScoreBox: {
    backgroundColor: 'rgba(255,215,0,0.3)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 15,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  bestScoreLabel: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  bestScoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 50,
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
    color: 'white',
  },
});
