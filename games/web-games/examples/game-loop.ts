/**
 * Game Loop Pattern
 *
 * This example demonstrates the classic game loop pattern used in all web-based games.
 * It includes fixed timestep updates for consistent game physics, variable rendering,
 * and performance monitoring.
 *
 * Key Concepts:
 * - Fixed timestep for game logic updates
 * - Variable framerate for rendering
 * - Delta time calculations
 * - FPS monitoring
 * - Pause/resume functionality
 */

// ============== Configuration ==============

interface GameLoopConfig {
  targetFPS: number;
  fixedTimeStep: number; // milliseconds per update (1000/60 = ~16.67ms for 60 UPS)
  maxFrameSkip: number; // prevent spiral of death
}

const config: GameLoopConfig = {
  targetFPS: 60,
  fixedTimeStep: 1000 / 60, // 60 updates per second
  maxFrameSkip: 5, // skip max 5 frames if lagging
};

// ============== Game State ==============

interface GameObject {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  color: string;
}

interface GameState {
  objects: GameObject[];
  score: number;
  isPaused: boolean;
  isRunning: boolean;
}

const gameState: GameState = {
  objects: [],
  score: 0,
  isPaused: false,
  isRunning: false,
};

// ============== Performance Monitoring ==============

interface PerformanceStats {
  fps: number;
  ups: number; // updates per second
  frameTime: number;
  updateTime: number;
  renderTime: number;
}

const stats: PerformanceStats = {
  fps: 0,
  ups: 0,
  frameTime: 0,
  updateTime: 0,
  renderTime: 0,
};

// FPS counter
let fpsFrameCount = 0;
let fpsLastTime = performance.now();
let upsUpdateCount = 0;
let upsLastTime = performance.now();

// ============== Core Game Loop ==============

class GameLoop {
  private lastFrameTime: number = 0;
  private accumulator: number = 0;
  private animationFrameId: number | null = null;

  /**
   * Start the game loop
   * Uses requestAnimationFrame for smooth rendering
   */
  start(): void {
    if (gameState.isRunning) return;

    gameState.isRunning = true;
    this.lastFrameTime = performance.now();
    this.accumulator = 0;

    console.log('🎮 Game loop started');
    this.loop();
  }

  /**
   * Main game loop - called every frame
   * Implements fixed timestep for updates and variable framerate for rendering
   */
  private loop = (): void => {
    if (!gameState.isRunning) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Track frame time for performance stats
    stats.frameTime = frameTime;

    // Add frame time to accumulator
    this.accumulator += frameTime;

    // Fixed timestep updates
    let updateCount = 0;
    const updateStartTime = performance.now();

    // Update game logic in fixed time steps
    while (this.accumulator >= config.fixedTimeStep && updateCount < config.maxFrameSkip) {
      if (!gameState.isPaused) {
        this.update(config.fixedTimeStep);
        upsUpdateCount++;
      }

      this.accumulator -= config.fixedTimeStep;
      updateCount++;
    }

    stats.updateTime = performance.now() - updateStartTime;

    // Calculate interpolation factor for smooth rendering between updates
    const alpha = this.accumulator / config.fixedTimeStep;

    // Render with interpolation
    const renderStartTime = performance.now();
    this.render(alpha);
    stats.renderTime = performance.now() - renderStartTime;

    // Update FPS counter
    fpsFrameCount++;
    const fpsDelta = currentTime - fpsLastTime;
    if (fpsDelta >= 1000) {
      stats.fps = Math.round((fpsFrameCount * 1000) / fpsDelta);
      fpsFrameCount = 0;
      fpsLastTime = currentTime;
    }

    // Update UPS counter
    const upsDelta = currentTime - upsLastTime;
    if (upsDelta >= 1000) {
      stats.ups = Math.round((upsUpdateCount * 1000) / upsDelta);
      upsUpdateCount = 0;
      upsLastTime = currentTime;
    }

    // Continue the loop
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Update game logic
   * @param deltaTime - Fixed time step in milliseconds
   */
  private update(deltaTime: number): void {
    const dt = deltaTime / 1000; // Convert to seconds

    // Update all game objects
    gameState.objects.forEach((obj) => {
      // Update position based on velocity
      obj.x += obj.velocityX * dt;
      obj.y += obj.velocityY * dt;

      // Wrap around screen edges
      if (obj.x < 0) obj.x = canvas.width;
      if (obj.x > canvas.width) obj.x = 0;
      if (obj.y < 0) obj.y = canvas.height;
      if (obj.y > canvas.height) obj.y = 0;
    });

    // Increment score
    gameState.score += 1;
  }

  /**
   * Render the game
   * @param alpha - Interpolation factor (0-1) for smooth rendering
   */
  private render(alpha: number): void {
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render game objects
    gameState.objects.forEach((obj) => {
      // For smooth movement, interpolate between current and next position
      const renderX = obj.x + obj.velocityX * (alpha / 60);
      const renderY = obj.y + obj.velocityY * (alpha / 60);

      ctx.fillStyle = obj.color;
      ctx.beginPath();
      ctx.arc(renderX, renderY, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    // Render UI
    this.renderUI();
  }

  /**
   * Render UI elements (score, stats, etc.)
   */
  private renderUI(): void {
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';

    // Score
    ctx.fillText(`Score: ${gameState.score}`, 10, 20);

    // Performance stats
    ctx.fillText(`FPS: ${stats.fps}`, 10, 40);
    ctx.fillText(`UPS: ${stats.ups}`, 10, 60);
    ctx.fillText(`Frame Time: ${stats.frameTime.toFixed(2)}ms`, 10, 80);
    ctx.fillText(`Update Time: ${stats.updateTime.toFixed(2)}ms`, 10, 100);
    ctx.fillText(`Render Time: ${stats.renderTime.toFixed(2)}ms`, 10, 120);

    // Pause indicator
    if (gameState.isPaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      ctx.textAlign = 'left';
    }
  }

  /**
   * Pause the game loop
   */
  pause(): void {
    gameState.isPaused = true;
    console.log('⏸️  Game paused');
  }

  /**
   * Resume the game loop
   */
  resume(): void {
    gameState.isPaused = false;
    console.log('▶️  Game resumed');
  }

  /**
   * Stop the game loop completely
   */
  stop(): void {
    gameState.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    console.log('🛑 Game loop stopped');
  }

  /**
   * Toggle pause state
   */
  togglePause(): void {
    if (gameState.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }
}

// ============== Canvas Setup ==============

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

if (!canvas || !ctx) {
  throw new Error('Canvas not found');
}

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// ============== Game Initialization ==============

/**
 * Initialize the game with some test objects
 */
function initGame(): void {
  // Create some moving objects
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];

  for (let i = 0; i < 20; i++) {
    gameState.objects.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      velocityX: (Math.random() - 0.5) * 200,
      velocityY: (Math.random() - 0.5) * 200,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  console.log('🎮 Game initialized with', gameState.objects.length, 'objects');
}

// ============== User Input ==============

/**
 * Handle keyboard input
 */
document.addEventListener('keydown', (e: KeyboardEvent) => {
  switch (e.key) {
    case ' ':
    case 'p':
      e.preventDefault();
      gameLoop.togglePause();
      break;
    case 'Escape':
      gameLoop.stop();
      break;
    case 'r':
      // Reset game
      gameState.objects = [];
      gameState.score = 0;
      initGame();
      break;
  }
});

// ============== Start the Game ==============

const gameLoop = new GameLoop();

// Initialize and start
initGame();
gameLoop.start();

// ============== Export for Use in Other Modules ==============

export { GameLoop, GameState, PerformanceStats, config };
