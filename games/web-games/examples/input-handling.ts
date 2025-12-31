/**
 * Input Handling System
 *
 * This example demonstrates comprehensive input handling for web games,
 * including keyboard, mouse, touch, and gamepad support.
 *
 * Key Concepts:
 * - Keyboard input with key states
 * - Mouse tracking and button handling
 * - Touch support for mobile devices
 * - Gamepad API integration
 * - Input buffering and combo detection
 * - Virtual joystick for mobile
 */

// ============== Types ==============

interface KeyState {
  pressed: boolean;
  justPressed: boolean;
  justReleased: boolean;
  pressTime: number;
}

interface MouseState {
  x: number;
  y: number;
  buttons: {
    left: boolean;
    middle: boolean;
    right: boolean;
  };
  wheelDelta: number;
}

interface TouchPoint {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
}

interface GamepadState {
  connected: boolean;
  buttons: boolean[];
  axes: number[];
}

// ============== Keyboard Input Manager ==============

class KeyboardManager {
  private keys: Map<string, KeyState> = new Map();
  private keyBindings: Map<string, string> = new Map();

  constructor() {
    this.setupListeners();
  }

  /**
   * Setup keyboard event listeners
   */
  private setupListeners(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const state = this.getKeyState(key);

      if (!state.pressed) {
        state.justPressed = true;
        state.pressTime = performance.now();
      }

      state.pressed = true;
      this.keys.set(key, state);

      // Prevent default for game keys
      if (this.isGameKey(key)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const state = this.getKeyState(key);

      state.pressed = false;
      state.justReleased = true;
      this.keys.set(key, state);
    });

    // Clear focus-related issues
    window.addEventListener('blur', () => {
      this.reset();
    });
  }

  /**
   * Get key state
   */
  private getKeyState(key: string): KeyState {
    return (
      this.keys.get(key) || {
        pressed: false,
        justPressed: false,
        justReleased: false,
        pressTime: 0,
      }
    );
  }

  /**
   * Check if a key is currently pressed
   */
  isKeyDown(key: string): boolean {
    return this.getKeyState(key.toLowerCase()).pressed;
  }

  /**
   * Check if a key was just pressed this frame
   */
  isKeyPressed(key: string): boolean {
    return this.getKeyState(key.toLowerCase()).justPressed;
  }

  /**
   * Check if a key was just released this frame
   */
  isKeyReleased(key: string): boolean {
    return this.getKeyState(key.toLowerCase()).justReleased;
  }

  /**
   * Get how long a key has been held (in milliseconds)
   */
  getKeyHoldTime(key: string): number {
    const state = this.getKeyState(key.toLowerCase());
    return state.pressed ? performance.now() - state.pressTime : 0;
  }

  /**
   * Bind an action to a key
   */
  bindKey(action: string, key: string): void {
    this.keyBindings.set(action, key.toLowerCase());
  }

  /**
   * Check if an action is active
   */
  isActionDown(action: string): boolean {
    const key = this.keyBindings.get(action);
    return key ? this.isKeyDown(key) : false;
  }

  /**
   * Check if an action was just triggered
   */
  isActionPressed(action: string): boolean {
    const key = this.keyBindings.get(action);
    return key ? this.isKeyPressed(key) : false;
  }

  /**
   * Update - call this at the end of each frame
   */
  update(): void {
    for (const [key, state] of this.keys) {
      state.justPressed = false;
      state.justReleased = false;
      this.keys.set(key, state);
    }
  }

  /**
   * Reset all key states
   */
  reset(): void {
    this.keys.clear();
  }

  /**
   * Check if a key should be prevented from default behavior
   */
  private isGameKey(key: string): boolean {
    const gameKeys = [
      'arrowup',
      'arrowdown',
      'arrowleft',
      'arrowright',
      ' ',
      'w',
      'a',
      's',
      'd',
    ];
    return gameKeys.includes(key.toLowerCase());
  }
}

// ============== Mouse Input Manager ==============

class MouseManager {
  private state: MouseState = {
    x: 0,
    y: 0,
    buttons: { left: false, middle: false, right: false },
    wheelDelta: 0,
  };
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupListeners();
  }

  /**
   * Setup mouse event listeners
   */
  private setupListeners(): void {
    // Mouse move
    this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      this.state.x = e.clientX - rect.left;
      this.state.y = e.clientY - rect.top;
    });

    // Mouse buttons
    this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      this.updateButton(e.button, true);
    });

    this.canvas.addEventListener('mouseup', (e: MouseEvent) => {
      this.updateButton(e.button, false);
    });

    // Context menu
    this.canvas.addEventListener('contextmenu', (e: Event) => {
      e.preventDefault();
    });

    // Mouse wheel
    this.canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      this.state.wheelDelta = e.deltaY;
    });

    // Reset buttons when losing focus
    window.addEventListener('blur', () => {
      this.state.buttons = { left: false, middle: false, right: false };
    });
  }

  /**
   * Update button state
   */
  private updateButton(button: number, pressed: boolean): void {
    switch (button) {
      case 0:
        this.state.buttons.left = pressed;
        break;
      case 1:
        this.state.buttons.middle = pressed;
        break;
      case 2:
        this.state.buttons.right = pressed;
        break;
    }
  }

  /**
   * Get mouse position
   */
  getPosition(): { x: number; y: number } {
    return { x: this.state.x, y: this.state.y };
  }

  /**
   * Check if left button is pressed
   */
  isLeftButtonDown(): boolean {
    return this.state.buttons.left;
  }

  /**
   * Check if right button is pressed
   */
  isRightButtonDown(): boolean {
    return this.state.buttons.right;
  }

  /**
   * Check if middle button is pressed
   */
  isMiddleButtonDown(): boolean {
    return this.state.buttons.middle;
  }

  /**
   * Get wheel delta
   */
  getWheelDelta(): number {
    return this.state.wheelDelta;
  }

  /**
   * Update - call at end of frame
   */
  update(): void {
    this.state.wheelDelta = 0;
  }
}

// ============== Touch Input Manager ==============

class TouchManager {
  private touches: Map<number, TouchPoint> = new Map();
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupListeners();
  }

  /**
   * Setup touch event listeners
   */
  private setupListeners(): void {
    this.canvas.addEventListener('touchstart', (e: TouchEvent) => {
      e.preventDefault();
      this.handleTouches(e.touches, 'start');
    });

    this.canvas.addEventListener('touchmove', (e: TouchEvent) => {
      e.preventDefault();
      this.handleTouches(e.touches, 'move');
    });

    this.canvas.addEventListener('touchend', (e: TouchEvent) => {
      e.preventDefault();
      this.handleTouchEnd(e.changedTouches);
    });

    this.canvas.addEventListener('touchcancel', (e: TouchEvent) => {
      e.preventDefault();
      this.handleTouchEnd(e.changedTouches);
    });
  }

  /**
   * Handle touch events
   */
  private handleTouches(touches: TouchList, type: 'start' | 'move'): void {
    const rect = this.canvas.getBoundingClientRect();

    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (type === 'start') {
        this.touches.set(touch.identifier, {
          id: touch.identifier,
          x,
          y,
          startX: x,
          startY: y,
          deltaX: 0,
          deltaY: 0,
        });
      } else {
        const existing = this.touches.get(touch.identifier);
        if (existing) {
          existing.deltaX = x - existing.x;
          existing.deltaY = y - existing.y;
          existing.x = x;
          existing.y = y;
        }
      }
    }
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(touches: TouchList): void {
    for (let i = 0; i < touches.length; i++) {
      this.touches.delete(touches[i].identifier);
    }
  }

  /**
   * Get all active touches
   */
  getTouches(): TouchPoint[] {
    return Array.from(this.touches.values());
  }

  /**
   * Get primary touch (first touch)
   */
  getPrimaryTouch(): TouchPoint | null {
    const touches = this.getTouches();
    return touches.length > 0 ? touches[0] : null;
  }

  /**
   * Check if screen is being touched
   */
  isTouching(): boolean {
    return this.touches.size > 0;
  }

  /**
   * Get touch count
   */
  getTouchCount(): number {
    return this.touches.size;
  }
}

// ============== Gamepad Manager ==============

class GamepadManager {
  private gamepads: Map<number, GamepadState> = new Map();
  private deadzone: number = 0.15;

  constructor() {
    this.setupListeners();
  }

  /**
   * Setup gamepad event listeners
   */
  private setupListeners(): void {
    window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
      console.log('🎮 Gamepad connected:', e.gamepad.id);
      this.updateGamepad(e.gamepad);
    });

    window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => {
      console.log('🎮 Gamepad disconnected:', e.gamepad.id);
      this.gamepads.delete(e.gamepad.index);
    });
  }

  /**
   * Update gamepad states
   */
  update(): void {
    const gamepads = navigator.getGamepads();

    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (gamepad) {
        this.updateGamepad(gamepad);
      }
    }
  }

  /**
   * Update a specific gamepad
   */
  private updateGamepad(gamepad: Gamepad): void {
    const state: GamepadState = {
      connected: gamepad.connected,
      buttons: gamepad.buttons.map((b) => b.pressed),
      axes: gamepad.axes.map((a) => (Math.abs(a) < this.deadzone ? 0 : a)),
    };

    this.gamepads.set(gamepad.index, state);
  }

  /**
   * Get gamepad state
   */
  getGamepad(index: number = 0): GamepadState | null {
    return this.gamepads.get(index) || null;
  }

  /**
   * Check if button is pressed
   */
  isButtonPressed(button: number, gamepadIndex: number = 0): boolean {
    const gamepad = this.getGamepad(gamepadIndex);
    return gamepad ? gamepad.buttons[button] || false : false;
  }

  /**
   * Get axis value
   */
  getAxis(axis: number, gamepadIndex: number = 0): number {
    const gamepad = this.getGamepad(gamepadIndex);
    return gamepad ? gamepad.axes[axis] || 0 : 0;
  }

  /**
   * Get left stick
   */
  getLeftStick(gamepadIndex: number = 0): { x: number; y: number } {
    return {
      x: this.getAxis(0, gamepadIndex),
      y: this.getAxis(1, gamepadIndex),
    };
  }

  /**
   * Get right stick
   */
  getRightStick(gamepadIndex: number = 0): { x: number; y: number } {
    return {
      x: this.getAxis(2, gamepadIndex),
      y: this.getAxis(3, gamepadIndex),
    };
  }
}

// ============== Virtual Joystick (for mobile) ==============

class VirtualJoystick {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private active: boolean = false;
  private centerX: number = 0;
  private centerY: number = 0;
  private currentX: number = 0;
  private currentY: number = 0;
  private maxRadius: number = 50;
  private touchId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupListeners();
  }

  /**
   * Setup touch listeners for joystick
   */
  private setupListeners(): void {
    this.canvas.addEventListener('touchstart', (e: TouchEvent) => {
      if (this.touchId !== null) return;

      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Only activate if touch is in left half of screen
      if (x < this.canvas.width / 2) {
        this.touchId = touch.identifier;
        this.active = true;
        this.centerX = x;
        this.centerY = y;
        this.currentX = x;
        this.currentY = y;
      }
    });

    this.canvas.addEventListener('touchmove', (e: TouchEvent) => {
      if (this.touchId === null) return;

      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === this.touchId) {
          const rect = this.canvas.getBoundingClientRect();
          this.currentX = e.touches[i].clientX - rect.left;
          this.currentY = e.touches[i].clientY - rect.top;
          break;
        }
      }
    });

    const endTouch = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.touchId) {
          this.active = false;
          this.touchId = null;
          break;
        }
      }
    };

    this.canvas.addEventListener('touchend', endTouch);
    this.canvas.addEventListener('touchcancel', endTouch);
  }

  /**
   * Get joystick direction (-1 to 1)
   */
  getDirection(): { x: number; y: number } {
    if (!this.active) {
      return { x: 0, y: 0 };
    }

    const dx = this.currentX - this.centerX;
    const dy = this.currentY - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
      return { x: 0, y: 0 };
    }

    const clamped = Math.min(distance, this.maxRadius);
    return {
      x: (dx / distance) * (clamped / this.maxRadius),
      y: (dy / distance) * (clamped / this.maxRadius),
    };
  }

  /**
   * Render the joystick
   */
  render(): void {
    if (!this.active) return;

    const direction = this.getDirection();

    // Draw outer circle
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, this.maxRadius, 0, Math.PI * 2);
    this.ctx.stroke();

    // Draw inner circle (thumb)
    const thumbX = this.centerX + direction.x * this.maxRadius;
    const thumbY = this.centerY + direction.y * this.maxRadius;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.beginPath();
    this.ctx.arc(thumbX, thumbY, 25, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

// ============== Unified Input Manager ==============

class InputManager {
  keyboard: KeyboardManager;
  mouse: MouseManager;
  touch: TouchManager;
  gamepad: GamepadManager;
  joystick: VirtualJoystick;

  constructor(canvas: HTMLCanvasElement) {
    this.keyboard = new KeyboardManager();
    this.mouse = new MouseManager(canvas);
    this.touch = new TouchManager(canvas);
    this.gamepad = new GamepadManager();
    this.joystick = new VirtualJoystick(canvas);

    // Setup default key bindings
    this.setupDefaultBindings();
  }

  /**
   * Setup default key bindings
   */
  private setupDefaultBindings(): void {
    this.keyboard.bindKey('moveUp', 'w');
    this.keyboard.bindKey('moveDown', 's');
    this.keyboard.bindKey('moveLeft', 'a');
    this.keyboard.bindKey('moveRight', 'd');
    this.keyboard.bindKey('jump', ' ');
    this.keyboard.bindKey('action', 'e');
  }

  /**
   * Get movement input from all sources
   */
  getMovement(): { x: number; y: number } {
    let x = 0;
    let y = 0;

    // Keyboard
    if (this.keyboard.isActionDown('moveLeft')) x -= 1;
    if (this.keyboard.isActionDown('moveRight')) x += 1;
    if (this.keyboard.isActionDown('moveUp')) y -= 1;
    if (this.keyboard.isActionDown('moveDown')) y += 1;

    // Gamepad
    const leftStick = this.gamepad.getLeftStick();
    x += leftStick.x;
    y += leftStick.y;

    // Virtual joystick
    const joystick = this.joystick.getDirection();
    x += joystick.x;
    y += joystick.y;

    // Normalize diagonal movement
    const magnitude = Math.sqrt(x * x + y * y);
    if (magnitude > 1) {
      x /= magnitude;
      y /= magnitude;
    }

    return { x, y };
  }

  /**
   * Update all input systems
   */
  update(): void {
    this.keyboard.update();
    this.mouse.update();
    this.gamepad.update();
  }

  /**
   * Render input visualizations
   */
  render(): void {
    this.joystick.render();
  }
}

// ============== Demo ==============

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

if (!canvas || !ctx) {
  throw new Error('Canvas not found');
}

canvas.width = 800;
canvas.height = 600;

// Create input manager
const input = new InputManager(canvas);

// Player object
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  speed: 200,
};

let lastTime = performance.now();

function gameLoop(): void {
  const currentTime = performance.now();
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;

  // Get movement input
  const movement = input.getMovement();

  // Update player position
  player.x += movement.x * player.speed * (deltaTime / 1000);
  player.y += movement.y * player.speed * (deltaTime / 1000);

  // Keep player in bounds
  player.x = Math.max(20, Math.min(canvas.width - 20, player.x));
  player.y = Math.max(20, Math.min(canvas.height - 20, player.y));

  // Render
  ctx.fillStyle = '#0a0e27';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw player
  ctx.fillStyle = '#4ecdc4';
  ctx.beginPath();
  ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
  ctx.fill();

  // Draw direction indicator
  if (movement.x !== 0 || movement.y !== 0) {
    ctx.strokeStyle = '#f9ca24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + movement.x * 40, player.y + movement.y * 40);
    ctx.stroke();
  }

  // Render input visualizations
  input.render();

  // Display info
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px monospace';
  ctx.fillText('WASD / Arrow Keys / Left Stick / Touch: Move', 10, 20);
  ctx.fillText(`Position: (${Math.round(player.x)}, ${Math.round(player.y)})`, 10, 40);
  ctx.fillText(`Movement: (${movement.x.toFixed(2)}, ${movement.y.toFixed(2)})`, 10, 60);

  // Update input
  input.update();

  requestAnimationFrame(gameLoop);
}

gameLoop();

// ============== Export ==============

export {
  InputManager,
  KeyboardManager,
  MouseManager,
  TouchManager,
  GamepadManager,
  VirtualJoystick,
};
