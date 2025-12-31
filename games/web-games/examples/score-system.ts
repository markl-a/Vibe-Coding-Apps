/**
 * Score and Leaderboard System
 *
 * This example demonstrates a comprehensive scoring system for web games,
 * including score tracking, combo multipliers, achievements, and leaderboards
 * with local storage persistence.
 *
 * Key Concepts:
 * - Score tracking and display
 * - Combo system with multipliers
 * - Achievement system
 * - Leaderboard with local storage
 * - Score animations and effects
 * - Statistics tracking
 */

// ============== Types ==============

interface ScoreEvent {
  amount: number;
  x: number;
  y: number;
  timestamp: number;
  type: 'normal' | 'combo' | 'bonus';
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: GameStats) => boolean;
  unlocked: boolean;
  unlockedAt?: number;
}

interface GameStats {
  score: number;
  highScore: number;
  gamesPlayed: number;
  totalScore: number;
  averageScore: number;
  longestCombo: number;
  totalPlayTime: number; // milliseconds
  achievementsUnlocked: number;
  customStats: Record<string, number>;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  date: number;
  stats?: Partial<GameStats>;
}

interface ComboState {
  count: number;
  multiplier: number;
  lastEventTime: number;
  comboTimeout: number;
}

// ============== Score Manager ==============

class ScoreManager {
  private score: number = 0;
  private scoreEvents: ScoreEvent[] = [];
  private eventDuration: number = 2000; // How long score events are displayed
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.score = 0;
  }

  /**
   * Add score with optional position for visual feedback
   */
  addScore(amount: number, x?: number, y?: number, type: 'normal' | 'combo' | 'bonus' = 'normal'): void {
    this.score += amount;

    // Create score event for visual feedback
    if (x !== undefined && y !== undefined) {
      this.scoreEvents.push({
        amount,
        x,
        y,
        timestamp: performance.now(),
        type,
      });
    }

    // Emit score change event
    this.emit('scoreChanged', this.score, amount);
  }

  /**
   * Get current score
   */
  getScore(): number {
    return this.score;
  }

  /**
   * Reset score
   */
  reset(): void {
    const oldScore = this.score;
    this.score = 0;
    this.scoreEvents = [];
    this.emit('scoreReset', oldScore);
  }

  /**
   * Update score events (call each frame)
   */
  update(): void {
    const now = performance.now();
    this.scoreEvents = this.scoreEvents.filter(
      (event) => now - event.timestamp < this.eventDuration
    );
  }

  /**
   * Render score events
   */
  render(ctx: CanvasRenderingContext2D): void {
    const now = performance.now();

    this.scoreEvents.forEach((event) => {
      const age = now - event.timestamp;
      const progress = age / this.eventDuration;
      const alpha = 1 - progress;
      const yOffset = progress * 50;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Color based on type
      let color = '#ffffff';
      if (event.type === 'combo') color = '#f9ca24';
      if (event.type === 'bonus') color = '#6c5ce7';

      ctx.fillStyle = color;
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`+${event.amount}`, event.x, event.y - yOffset);

      ctx.restore();
    });
  }

  /**
   * Event listener system
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }
}

// ============== Combo System ==============

class ComboManager {
  private combo: ComboState = {
    count: 0,
    multiplier: 1,
    lastEventTime: 0,
    comboTimeout: 2000, // 2 seconds to maintain combo
  };
  private baseMultiplier: number = 1;
  private multiplierIncrement: number = 0.1;
  private maxMultiplier: number = 5;
  private listeners: Map<string, Function[]> = new Map();

  /**
   * Add to combo
   */
  increment(): void {
    this.combo.count++;
    this.combo.lastEventTime = performance.now();

    // Calculate multiplier
    const bonusMultiplier = Math.min(
      this.combo.count * this.multiplierIncrement,
      this.maxMultiplier - this.baseMultiplier
    );
    this.combo.multiplier = this.baseMultiplier + bonusMultiplier;

    this.emit('comboIncreased', this.combo.count, this.combo.multiplier);
  }

  /**
   * Reset combo
   */
  reset(): void {
    const oldCount = this.combo.count;
    this.combo.count = 0;
    this.combo.multiplier = this.baseMultiplier;

    if (oldCount > 0) {
      this.emit('comboBroken', oldCount);
    }
  }

  /**
   * Update combo (check for timeout)
   */
  update(): void {
    if (this.combo.count > 0) {
      const timeSinceLastEvent = performance.now() - this.combo.lastEventTime;
      if (timeSinceLastEvent > this.combo.comboTimeout) {
        this.reset();
      }
    }
  }

  /**
   * Get current combo count
   */
  getCount(): number {
    return this.combo.count;
  }

  /**
   * Get current multiplier
   */
  getMultiplier(): number {
    return this.combo.multiplier;
  }

  /**
   * Get combo progress (0-1) until timeout
   */
  getProgress(): number {
    if (this.combo.count === 0) return 0;

    const timeSinceLastEvent = performance.now() - this.combo.lastEventTime;
    return 1 - timeSinceLastEvent / this.combo.comboTimeout;
  }

  /**
   * Event listener system
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }
}

// ============== Achievement System ==============

class AchievementManager {
  private achievements: Map<string, Achievement> = new Map();
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.setupDefaultAchievements();
  }

  /**
   * Setup default achievements
   */
  private setupDefaultAchievements(): void {
    this.addAchievement({
      id: 'first_points',
      name: 'First Points',
      description: 'Score your first points',
      icon: '🎯',
      condition: (stats) => stats.score > 0,
      unlocked: false,
    });

    this.addAchievement({
      id: 'score_100',
      name: 'Century',
      description: 'Score 100 points',
      icon: '💯',
      condition: (stats) => stats.score >= 100,
      unlocked: false,
    });

    this.addAchievement({
      id: 'score_1000',
      name: 'One Thousand',
      description: 'Score 1000 points',
      icon: '🌟',
      condition: (stats) => stats.score >= 1000,
      unlocked: false,
    });

    this.addAchievement({
      id: 'combo_10',
      name: 'Combo Master',
      description: 'Achieve a 10x combo',
      icon: '🔥',
      condition: (stats) => stats.longestCombo >= 10,
      unlocked: false,
    });

    this.addAchievement({
      id: 'veteran',
      name: 'Veteran',
      description: 'Play 50 games',
      icon: '🎮',
      condition: (stats) => stats.gamesPlayed >= 50,
      unlocked: false,
    });
  }

  /**
   * Add an achievement
   */
  addAchievement(achievement: Achievement): void {
    this.achievements.set(achievement.id, achievement);
  }

  /**
   * Check and unlock achievements based on stats
   */
  checkAchievements(stats: GameStats): Achievement[] {
    const newlyUnlocked: Achievement[] = [];

    this.achievements.forEach((achievement) => {
      if (!achievement.unlocked && achievement.condition(stats)) {
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        newlyUnlocked.push(achievement);
        this.emit('achievementUnlocked', achievement);
      }
    });

    return newlyUnlocked;
  }

  /**
   * Get all achievements
   */
  getAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  /**
   * Get unlocked achievements
   */
  getUnlockedAchievements(): Achievement[] {
    return this.getAchievements().filter((a) => a.unlocked);
  }

  /**
   * Event listener system
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }
}

// ============== Statistics Manager ==============

class StatsManager {
  private stats: GameStats;
  private storageKey: string = 'game_stats';
  private sessionStartTime: number = 0;

  constructor() {
    this.stats = this.loadStats();
    this.sessionStartTime = performance.now();
  }

  /**
   * Load stats from local storage
   */
  private loadStats(): GameStats {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      return JSON.parse(saved);
    }

    return {
      score: 0,
      highScore: 0,
      gamesPlayed: 0,
      totalScore: 0,
      averageScore: 0,
      longestCombo: 0,
      totalPlayTime: 0,
      achievementsUnlocked: 0,
      customStats: {},
    };
  }

  /**
   * Save stats to local storage
   */
  saveStats(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
  }

  /**
   * Update stats at end of game
   */
  endGame(score: number, longestCombo: number): void {
    this.stats.score = score;
    this.stats.gamesPlayed++;
    this.stats.totalScore += score;
    this.stats.averageScore = Math.round(this.stats.totalScore / this.stats.gamesPlayed);

    if (score > this.stats.highScore) {
      this.stats.highScore = score;
    }

    if (longestCombo > this.stats.longestCombo) {
      this.stats.longestCombo = longestCombo;
    }

    const sessionTime = performance.now() - this.sessionStartTime;
    this.stats.totalPlayTime += sessionTime;

    this.saveStats();
  }

  /**
   * Get stats
   */
  getStats(): GameStats {
    return { ...this.stats };
  }

  /**
   * Set custom stat
   */
  setCustomStat(key: string, value: number): void {
    this.stats.customStats[key] = value;
    this.saveStats();
  }

  /**
   * Increment custom stat
   */
  incrementCustomStat(key: string, amount: number = 1): void {
    this.stats.customStats[key] = (this.stats.customStats[key] || 0) + amount;
    this.saveStats();
  }

  /**
   * Reset all stats
   */
  resetStats(): void {
    localStorage.removeItem(this.storageKey);
    this.stats = this.loadStats();
  }
}

// ============== Leaderboard Manager ==============

class LeaderboardManager {
  private storageKey: string = 'game_leaderboard';
  private maxEntries: number = 10;

  /**
   * Add score to leaderboard
   */
  addScore(name: string, score: number, stats?: Partial<GameStats>): number {
    const entries = this.getLeaderboard();

    const newEntry: LeaderboardEntry = {
      rank: 0,
      name,
      score,
      date: Date.now(),
      stats,
    };

    entries.push(newEntry);
    entries.sort((a, b) => b.score - a.score);

    // Limit to max entries
    const limited = entries.slice(0, this.maxEntries);

    // Update ranks
    limited.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Save
    localStorage.setItem(this.storageKey, JSON.stringify(limited));

    // Return rank (or 0 if not in top)
    const entry = limited.find((e) => e.score === score && e.name === name);
    return entry ? entry.rank : 0;
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(): LeaderboardEntry[] {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? JSON.parse(saved) : [];
  }

  /**
   * Check if score makes leaderboard
   */
  isHighScore(score: number): boolean {
    const entries = this.getLeaderboard();

    if (entries.length < this.maxEntries) {
      return true;
    }

    return score > entries[entries.length - 1].score;
  }

  /**
   * Clear leaderboard
   */
  clearLeaderboard(): void {
    localStorage.removeItem(this.storageKey);
  }
}

// ============== Unified Game Scoring System ==============

class GameScoringSystem {
  score: ScoreManager;
  combo: ComboManager;
  achievements: AchievementManager;
  stats: StatsManager;
  leaderboard: LeaderboardManager;

  constructor() {
    this.score = new ScoreManager();
    this.combo = new ComboManager();
    this.achievements = new AchievementManager();
    this.stats = new StatsManager();
    this.leaderboard = new LeaderboardManager();

    this.setupListeners();
  }

  /**
   * Setup event listeners between systems
   */
  private setupListeners(): void {
    // When combo increases, add bonus score
    this.combo.on('comboIncreased', (count: number, multiplier: number) => {
      console.log(`Combo: ${count}x (${multiplier.toFixed(1)}x multiplier)`);
    });

    // When achievement unlocked, show notification
    this.achievements.on('achievementUnlocked', (achievement: Achievement) => {
      console.log(`🏆 Achievement Unlocked: ${achievement.name}`);
    });
  }

  /**
   * Add score with combo multiplier
   */
  addPoints(amount: number, x?: number, y?: number): void {
    const multiplier = this.combo.getMultiplier();
    const finalAmount = Math.round(amount * multiplier);

    const type = multiplier > 1 ? 'combo' : 'normal';
    this.score.addScore(finalAmount, x, y, type);

    this.combo.increment();

    // Check achievements
    this.achievements.checkAchievements(this.stats.getStats());
  }

  /**
   * Update all systems
   */
  update(): void {
    this.score.update();
    this.combo.update();
  }

  /**
   * Render score display
   */
  render(ctx: CanvasRenderingContext2D): void {
    // Render floating score numbers
    this.score.render(ctx);

    // Render score UI
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.score.getScore()}`, 10, 40);

    // Render combo
    if (this.combo.getCount() > 0) {
      const progress = this.combo.getProgress();

      ctx.fillStyle = '#f9ca24';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(
        `Combo: ${this.combo.getCount()}x (${this.combo.getMultiplier().toFixed(1)}x)`,
        10,
        80
      );

      // Combo timer bar
      ctx.fillStyle = 'rgba(249, 202, 36, 0.3)';
      ctx.fillRect(10, 90, 200, 10);
      ctx.fillStyle = '#f9ca24';
      ctx.fillRect(10, 90, 200 * progress, 10);
    }

    // Render high score
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px monospace';
    ctx.fillText(`High Score: ${this.stats.getStats().highScore}`, 10, 120);
  }

  /**
   * End game and save stats
   */
  endGame(playerName: string = 'Player'): void {
    const finalScore = this.score.getScore();
    const longestCombo = Math.max(this.combo.getCount(), this.stats.getStats().longestCombo);

    this.stats.endGame(finalScore, longestCombo);

    // Add to leaderboard if high score
    if (this.leaderboard.isHighScore(finalScore)) {
      const rank = this.leaderboard.addScore(playerName, finalScore, this.stats.getStats());
      console.log(`🏆 New leaderboard entry! Rank: ${rank}`);
    }

    // Final achievement check
    this.achievements.checkAchievements(this.stats.getStats());
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

// Create scoring system
const scoring = new GameScoringSystem();

// Demo: Add points on click
canvas.addEventListener('click', (e: MouseEvent) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  scoring.addPoints(10, x, y);
});

// Demo: Display leaderboard
function renderLeaderboard(): void {
  const leaderboard = scoring.leaderboard.getLeaderboard();

  ctx.fillStyle = '#ffffff';
  ctx.font = '20px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('Leaderboard:', canvas.width - 10, 30);

  ctx.font = '14px monospace';
  leaderboard.slice(0, 5).forEach((entry, index) => {
    ctx.fillText(
      `${entry.rank}. ${entry.name}: ${entry.score}`,
      canvas.width - 10,
      60 + index * 25
    );
  });
}

// Game loop
function gameLoop(): void {
  scoring.update();

  // Render
  ctx.fillStyle = '#0a0e27';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  scoring.render(ctx);
  renderLeaderboard();

  // Instructions
  ctx.fillStyle = '#888888';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Click to add points', canvas.width / 2, canvas.height - 20);

  requestAnimationFrame(gameLoop);
}

gameLoop();

// ============== Export ==============

export {
  GameScoringSystem,
  ScoreManager,
  ComboManager,
  AchievementManager,
  StatsManager,
  LeaderboardManager,
};
