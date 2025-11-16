import Matter from 'matter-js';
import { Dimensions } from 'react-native';
import Pipe from './components/Pipe';

const { width, height } = Dimensions.get('window');

const Physics = (entities, { touches, time, dispatch }) => {
  let engine = entities.physics.engine;

  // Handle tap to jump
  touches.filter(t => t.type === 'press').forEach(t => {
    Matter.Body.setVelocity(entities.bird.body, {
      x: 0,
      y: -8
    });
  });

  // Run physics engine
  Matter.Engine.update(engine, time.delta);

  // Add pipes periodically
  if (!entities.pipeSpawnTimer) {
    entities.pipeSpawnTimer = 0;
  }
  entities.pipeSpawnTimer += time.delta;

  if (entities.pipeSpawnTimer > 2000) {
    entities.pipeSpawnTimer = 0;

    const pipeGap = 200;
    const pipeHeight = Math.random() * (height - pipeGap - 200) + 100;
    const pipeId = `pipe_${Date.now()}`;

    // Top pipe
    const topPipe = Matter.Bodies.rectangle(
      width + 30,
      pipeHeight / 2,
      60,
      pipeHeight,
      { isStatic: true, label: 'pipe' }
    );

    // Bottom pipe
    const bottomPipe = Matter.Bodies.rectangle(
      width + 30,
      height - (height - pipeHeight - pipeGap) / 2,
      60,
      height - pipeHeight - pipeGap,
      { isStatic: true, label: 'pipe' }
    );

    Matter.World.add(engine.world, [topPipe, bottomPipe]);

    entities[`${pipeId}_top`] = {
      body: topPipe,
      size: [60, pipeHeight],
      color: '#4CAF50',
      renderer: Pipe,
      scored: false
    };

    entities[`${pipeId}_bottom`] = {
      body: bottomPipe,
      size: [60, height - pipeHeight - pipeGap],
      color: '#4CAF50',
      renderer: Pipe,
      scored: false
    };
  }

  // Move pipes and check for scoring
  Object.keys(entities).forEach(key => {
    if (key.includes('pipe_')) {
      Matter.Body.translate(entities[key].body, { x: -3, y: 0 });

      // Check if bird passed pipe for scoring
      if (!entities[key].scored && entities[key].body.position.x < entities.bird.body.position.x) {
        entities[key].scored = true;
        if (key.includes('_top')) {
          dispatch({ type: 'score' });
        }
      }

      // Remove pipes that are off screen
      if (entities[key].body.position.x < -30) {
        Matter.World.remove(engine.world, entities[key].body);
        delete entities[key];
      }
    }
  });

  // Collision detection
  Matter.Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;

    pairs.forEach(pair => {
      if ((pair.bodyA.label === 'bird' && pair.bodyB.label === 'pipe') ||
          (pair.bodyA.label === 'pipe' && pair.bodyB.label === 'bird') ||
          (pair.bodyA.label === 'bird' && pair.bodyB.label === 'floor') ||
          (pair.bodyA.label === 'floor' && pair.bodyB.label === 'bird') ||
          (pair.bodyA.label === 'bird' && pair.bodyB.label === 'ceiling') ||
          (pair.bodyA.label === 'ceiling' && pair.bodyB.label === 'bird')) {
        dispatch({ type: 'game-over' });
      }
    });
  });

  return entities;
};

export default Physics;
