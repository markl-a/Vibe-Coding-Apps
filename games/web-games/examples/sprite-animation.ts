/**
 * Sprite Animation System
 *
 * This example demonstrates how to handle sprite sheets and animations in web games.
 * It includes frame-based animation, sprite flipping, animation states, and
 * efficient sprite rendering.
 *
 * Key Concepts:
 * - Sprite sheet loading and parsing
 * - Frame-based animation with timing
 * - Animation states (idle, walk, run, jump)
 * - Sprite flipping and transformations
 * - Animation events and callbacks
 */

// ============== Types ==============

interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Animation {
  name: string;
  frames: SpriteFrame[];
  frameRate: number; // frames per second
  loop: boolean;
  onComplete?: () => void;
}

interface SpriteConfig {
  image: HTMLImageElement;
  frameWidth: number;
  frameHeight: number;
  animations: Record<string, Animation>;
}

// ============== Sprite Sheet Class ==============

class SpriteSheet {
  private image: HTMLImageElement;
  private frameWidth: number;
  private frameHeight: number;
  private columns: number;
  private rows: number;

  constructor(imageSrc: string, frameWidth: number, frameHeight: number) {
    this.image = new Image();
    this.image.src = imageSrc;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.columns = 0;
    this.rows = 0;

    this.image.onload = () => {
      this.columns = Math.floor(this.image.width / frameWidth);
      this.rows = Math.floor(this.image.height / frameHeight);
      console.log(`✅ Loaded sprite sheet: ${this.columns}x${this.rows} frames`);
    };
  }

  /**
   * Get a specific frame from the sprite sheet
   */
  getFrame(index: number): SpriteFrame {
    const col = index % this.columns;
    const row = Math.floor(index / this.columns);

    return {
      x: col * this.frameWidth,
      y: row * this.frameHeight,
      width: this.frameWidth,
      height: this.frameHeight,
    };
  }

  /**
   * Get a range of frames
   */
  getFrameRange(start: number, end: number): SpriteFrame[] {
    const frames: SpriteFrame[] = [];
    for (let i = start; i <= end; i++) {
      frames.push(this.getFrame(i));
    }
    return frames;
  }

  /**
   * Get all frames in a specific row
   */
  getFrameRow(row: number): SpriteFrame[] {
    const frames: SpriteFrame[] = [];
    for (let col = 0; col < this.columns; col++) {
      const index = row * this.columns + col;
      frames.push(this.getFrame(index));
    }
    return frames;
  }

  isLoaded(): boolean {
    return this.image.complete;
  }

  getImage(): HTMLImageElement {
    return this.image;
  }
}

// ============== Animated Sprite Class ==============

class AnimatedSprite {
  private spriteSheet: SpriteSheet;
  private animations: Map<string, Animation>;
  private currentAnimation: Animation | null = null;
  private currentFrame: number = 0;
  private frameTimer: number = 0;
  private isPlaying: boolean = false;
  private flipX: boolean = false;
  private flipY: boolean = false;

  // Position and size
  public x: number = 0;
  public y: number = 0;
  public scale: number = 1;
  public rotation: number = 0;

  constructor(spriteSheet: SpriteSheet) {
    this.spriteSheet = spriteSheet;
    this.animations = new Map();
  }

  /**
   * Add an animation to the sprite
   */
  addAnimation(animation: Animation): void {
    this.animations.set(animation.name, animation);
  }

  /**
   * Play a specific animation
   */
  play(name: string, reset: boolean = false): void {
    const animation = this.animations.get(name);

    if (!animation) {
      console.warn(`Animation "${name}" not found`);
      return;
    }

    // If already playing this animation and not resetting, do nothing
    if (this.currentAnimation === animation && !reset && this.isPlaying) {
      return;
    }

    this.currentAnimation = animation;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.isPlaying = true;
  }

  /**
   * Stop the current animation
   */
  stop(): void {
    this.isPlaying = false;
  }

  /**
   * Pause the current animation
   */
  pause(): void {
    this.isPlaying = false;
  }

  /**
   * Resume the current animation
   */
  resume(): void {
    this.isPlaying = true;
  }

  /**
   * Update the animation
   * @param deltaTime - Time since last update in milliseconds
   */
  update(deltaTime: number): void {
    if (!this.isPlaying || !this.currentAnimation) return;

    this.frameTimer += deltaTime;

    const frameDuration = 1000 / this.currentAnimation.frameRate;

    if (this.frameTimer >= frameDuration) {
      this.frameTimer -= frameDuration;
      this.currentFrame++;

      // Check if animation is complete
      if (this.currentFrame >= this.currentAnimation.frames.length) {
        if (this.currentAnimation.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.currentAnimation.frames.length - 1;
          this.isPlaying = false;

          // Call completion callback if exists
          if (this.currentAnimation.onComplete) {
            this.currentAnimation.onComplete();
          }
        }
      }
    }
  }

  /**
   * Render the sprite
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.spriteSheet.isLoaded() || !this.currentAnimation) return;

    const frame = this.currentAnimation.frames[this.currentFrame];
    const image = this.spriteSheet.getImage();

    ctx.save();

    // Apply transformations
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);

    // Draw the sprite
    ctx.drawImage(
      image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      -frame.width * this.scale / 2,
      -frame.height * this.scale / 2,
      frame.width * this.scale,
      frame.height * this.scale
    );

    ctx.restore();
  }

  /**
   * Set horizontal flip
   */
  setFlipX(flip: boolean): void {
    this.flipX = flip;
  }

  /**
   * Set vertical flip
   */
  setFlipY(flip: boolean): void {
    this.flipY = flip;
  }

  /**
   * Get current animation name
   */
  getCurrentAnimationName(): string | null {
    if (!this.currentAnimation) return null;
    return this.currentAnimation.name;
  }

  /**
   * Check if currently playing an animation
   */
  isAnimationPlaying(): boolean {
    return this.isPlaying;
  }
}

// ============== Character Sprite Example ==============

class CharacterSprite extends AnimatedSprite {
  private velocity: { x: number; y: number } = { x: 0, y: 0 };
  private facingRight: boolean = true;

  constructor(spriteSheet: SpriteSheet) {
    super(spriteSheet);
    this.setupAnimations();
  }

  /**
   * Setup character animations
   */
  private setupAnimations(): void {
    // Example: Assuming a sprite sheet with these frame layouts
    // Row 0: Idle (4 frames)
    // Row 1: Walk (6 frames)
    // Row 2: Run (8 frames)
    // Row 3: Jump (4 frames)

    this.addAnimation({
      name: 'idle',
      frames: spriteSheet.getFrameRange(0, 3),
      frameRate: 8,
      loop: true,
    });

    this.addAnimation({
      name: 'walk',
      frames: spriteSheet.getFrameRange(4, 9),
      frameRate: 12,
      loop: true,
    });

    this.addAnimation({
      name: 'run',
      frames: spriteSheet.getFrameRange(10, 17),
      frameRate: 16,
      loop: true,
    });

    this.addAnimation({
      name: 'jump',
      frames: spriteSheet.getFrameRange(18, 21),
      frameRate: 10,
      loop: false,
      onComplete: () => {
        console.log('Jump animation completed!');
        this.play('idle');
      },
    });
  }

  /**
   * Update character state and animation
   */
  updateCharacter(deltaTime: number): void {
    // Update position
    this.x += this.velocity.x * (deltaTime / 1000);
    this.y += this.velocity.y * (deltaTime / 1000);

    // Update facing direction
    if (this.velocity.x > 0 && !this.facingRight) {
      this.facingRight = true;
      this.setFlipX(false);
    } else if (this.velocity.x < 0 && this.facingRight) {
      this.facingRight = false;
      this.setFlipX(true);
    }

    // Update animation based on state
    this.updateAnimationState();

    // Update the current animation frame
    this.update(deltaTime);
  }

  /**
   * Determine which animation to play based on velocity
   */
  private updateAnimationState(): void {
    const speed = Math.abs(this.velocity.x);

    if (this.velocity.y !== 0) {
      // Jumping or falling
      if (this.getCurrentAnimationName() !== 'jump') {
        this.play('jump');
      }
    } else if (speed > 150) {
      // Running
      if (this.getCurrentAnimationName() !== 'run') {
        this.play('run');
      }
    } else if (speed > 0) {
      // Walking
      if (this.getCurrentAnimationName() !== 'walk') {
        this.play('walk');
      }
    } else {
      // Idle
      if (this.getCurrentAnimationName() !== 'idle') {
        this.play('idle');
      }
    }
  }

  /**
   * Set character velocity
   */
  setVelocity(x: number, y: number): void {
    this.velocity.x = x;
    this.velocity.y = y;
  }
}

// ============== Demo Setup ==============

// Create canvas
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

if (!canvas || !ctx) {
  throw new Error('Canvas not found');
}

canvas.width = 800;
canvas.height = 600;

// Create sprite sheet (placeholder - would use actual image)
// In a real game, you would load an actual sprite sheet image
const spriteSheet = new SpriteSheet('data:image/png;base64,placeholder', 64, 64);

// Create character
const character = new CharacterSprite(spriteSheet);
character.x = canvas.width / 2;
character.y = canvas.height / 2;
character.scale = 2;

// Start with idle animation
character.play('idle');

// ============== Input Handling ==============

const keys: Record<string, boolean> = {};

document.addEventListener('keydown', (e: KeyboardEvent) => {
  keys[e.key] = true;
});

document.addEventListener('keyup', (e: KeyboardEvent) => {
  keys[e.key] = false;
});

// ============== Game Loop ==============

let lastTime = performance.now();

function gameLoop(): void {
  const currentTime = performance.now();
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;

  // Update character velocity based on input
  let velocityX = 0;
  let velocityY = 0;

  if (keys['ArrowLeft'] || keys['a']) velocityX -= 200;
  if (keys['ArrowRight'] || keys['d']) velocityX += 200;
  if (keys['ArrowUp'] || keys['w']) velocityY -= 200;
  if (keys['ArrowDown'] || keys['s']) velocityY += 200;

  // Run faster with Shift
  if (keys['Shift']) {
    velocityX *= 1.5;
    velocityY *= 1.5;
  }

  character.setVelocity(velocityX, velocityY);

  // Update character
  character.updateCharacter(deltaTime);

  // Render
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  character.render(ctx);

  // Display instructions
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px monospace';
  ctx.fillText('Arrow Keys / WASD: Move', 10, 20);
  ctx.fillText('Shift: Run', 10, 40);
  ctx.fillText(`Animation: ${character.getCurrentAnimationName()}`, 10, 60);

  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();

// ============== Export ==============

export { SpriteSheet, AnimatedSprite, CharacterSprite, Animation, SpriteFrame };
