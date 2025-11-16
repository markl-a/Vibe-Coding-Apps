import React, { Component } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import Bird from './components/Bird';
import Pipe from './components/Pipe';
import Floor from './components/Floor';
import Physics from './Physics';

const { width, height } = Dimensions.get('window');

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      running: true,
      score: 0,
      gameOver: false,
    };

    this.gameEngine = null;
    this.entities = this.setupWorld();
  }

  setupWorld = () => {
    let engine = Matter.Engine.create({ enableSleeping: false });
    let world = engine.world;
    world.gravity.y = 1.2;

    // Bird
    const bird = Matter.Bodies.rectangle(width / 4, height / 2, 50, 50, {
      isStatic: false,
      label: 'bird'
    });
    Matter.World.add(world, bird);

    // Floor
    const floor = Matter.Bodies.rectangle(width / 2, height - 25, width, 50, {
      isStatic: true,
      label: 'floor'
    });
    Matter.World.add(world, floor);

    // Ceiling
    const ceiling = Matter.Bodies.rectangle(width / 2, -25, width, 50, {
      isStatic: true,
      label: 'ceiling'
    });
    Matter.World.add(world, ceiling);

    return {
      physics: { engine, world },
      bird: { body: bird, size: [50, 50], color: '#FFC107', renderer: Bird },
      floor: { body: floor, size: [width, 50], color: '#8B4513', renderer: Floor },
      pipes: []
    };
  };

  onEvent = (e) => {
    if (e.type === 'game-over') {
      this.setState({
        running: false,
        gameOver: true,
      });
    }
    if (e.type === 'score') {
      this.setState({
        score: this.state.score + 1,
      });
    }
  };

  reset = () => {
    this.gameEngine.swap(this.setupWorld());
    this.setState({
      running: true,
      score: 0,
      gameOver: false,
    });
  };

  render() {
    return (
      <View style={styles.container}>
        <GameEngine
          ref={(ref) => { this.gameEngine = ref; }}
          style={styles.gameContainer}
          systems={[Physics]}
          entities={this.entities}
          running={this.state.running}
          onEvent={this.onEvent}
        >
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>{this.state.score}</Text>
          </View>
        </GameEngine>

        {this.state.gameOver && (
          <View style={styles.gameOverContainer}>
            <Text style={styles.gameOverText}>Game Over</Text>
            <Text style={styles.finalScoreText}>Score: {this.state.score}</Text>
            <TouchableOpacity style={styles.restartButton} onPress={this.reset}>
              <Text style={styles.restartText}>Restart</Text>
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
  scoreContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'black',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  gameOverContainer: {
    position: 'absolute',
    top: height / 3,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 30,
    borderRadius: 15,
  },
  gameOverText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  finalScoreText: {
    fontSize: 24,
    color: 'white',
    marginBottom: 20,
  },
  restartButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  restartText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
});
