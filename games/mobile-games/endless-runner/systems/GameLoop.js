import { Dimensions } from 'react-native';
import Obstacle from '../entities/Obstacle';
import Coin from '../entities/Coin';

const { width, height } = Dimensions.get('window');

const GRAVITY = 1.2;
const JUMP_FORCE = -20;
const GROUND_Y = height - 220;

const GameLoop = (entities, { events, dispatch, time }) => {
  const player = entities.player;
  const gameState = entities.gameState;

  // Handle jump event
  events.forEach((event) => {
    if (event.type === 'jump' && !player.isJumping) {
      player.velocity.y = JUMP_FORCE;
      player.isJumping = true;
    }
  });

  // Apply gravity
  player.velocity.y += GRAVITY;
  player.position.y += player.velocity.y;

  // Ground collision
  if (player.position.y >= GROUND_Y) {
    player.position.y = GROUND_Y;
    player.velocity.y = 0;
    player.isJumping = false;
  }

  // Increase game speed over time
  gameState.speed = Math.min(5 + gameState.score / 100, 12);

  // Update score
  gameState.score += 1;
  if (gameState.score % 10 === 0) {
    dispatch({
      type: 'score-update',
      score: Math.floor(gameState.score / 10),
      coins: gameState.coins,
    });
  }

  // Spawn obstacles
  gameState.obstacleTimer += time.delta;
  if (gameState.obstacleTimer > 1500 - gameState.score / 10) {
    gameState.obstacleTimer = 0;

    const obstacleId = `obstacle_${Date.now()}`;
    const obstacleTypes = ['cactus', 'rock', 'tree'];
    const randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

    entities[obstacleId] = {
      position: { x: width, y: GROUND_Y },
      size: { width: 60, height: 60 },
      type: randomType,
      renderer: Obstacle,
    };
  }

  // Spawn coins
  gameState.coinTimer += time.delta;
  if (gameState.coinTimer > 2000) {
    gameState.coinTimer = 0;

    const coinId = `coin_${Date.now()}`;
    const coinHeight = Math.random() > 0.5 ? GROUND_Y - 100 : GROUND_Y - 200;

    entities[coinId] = {
      position: { x: width, y: coinHeight },
      size: { width: 40, height: 40 },
      renderer: Coin,
    };
  }

  // Move and remove obstacles
  Object.keys(entities).forEach((key) => {
    if (key.startsWith('obstacle_')) {
      const obstacle = entities[key];
      obstacle.position.x -= gameState.speed;

      // Check collision with player
      if (
        player.position.x < obstacle.position.x + obstacle.size.width &&
        player.position.x + player.size.width > obstacle.position.x &&
        player.position.y < obstacle.position.y + obstacle.size.height &&
        player.position.y + player.size.height > obstacle.position.y
      ) {
        dispatch({ type: 'game-over' });
      }

      // Remove off-screen obstacles
      if (obstacle.position.x < -obstacle.size.width) {
        delete entities[key];
      }
    }

    // Move and collect coins
    if (key.startsWith('coin_')) {
      const coin = entities[key];
      coin.position.x -= gameState.speed;

      // Check collision with player
      if (
        player.position.x < coin.position.x + coin.size.width &&
        player.position.x + player.size.width > coin.position.x &&
        player.position.y < coin.position.y + coin.size.height &&
        player.position.y + player.size.height > coin.position.y
      ) {
        gameState.coins += 1;
        delete entities[key];
      }

      // Remove off-screen coins
      if (coin.position.x < -coin.size.width) {
        delete entities[key];
      }
    }
  });

  return entities;
};

export default GameLoop;
