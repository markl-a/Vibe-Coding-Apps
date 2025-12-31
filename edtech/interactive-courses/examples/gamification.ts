/**
 * Gamification Example for Interactive Learning
 *
 * Demonstrates points, badges, leaderboards, achievements, quests,
 * rewards, and social features for engaging learning experiences.
 */

// Types
interface GamificationSystem {
  userId: string;
  profile: UserProfile;
  progression: ProgressionSystem;
  achievements: AchievementSystem;
  social: SocialSystem;
  rewards: RewardSystem;
}

interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  level: number;
  title: string;
  xp: number;
  nextLevelXP: number;
  totalPoints: number;
  streak: StreakData;
  stats: UserStats;
}

interface StreakData {
  current: number; // days
  longest: number;
  lastActivityDate: Date;
  milestones: number[]; // e.g., [7, 30, 100]
}

interface UserStats {
  lessonsCompleted: number;
  quizzesPassed: number;
  perfectScores: number;
  timeSpent: number; // hours
  coursesCompleted: number;
  helpedOthers: number;
}

interface ProgressionSystem {
  currentLevel: number;
  xpProgress: XPProgress;
  levels: Level[];
  unlockables: Unlockable[];
}

interface XPProgress {
  current: number;
  required: number;
  percentage: number;
}

interface Level {
  level: number;
  title: string;
  minXP: number;
  rewards: Reward[];
  unlocksFeatures: string[];
}

interface Unlockable {
  id: string;
  type: 'feature' | 'avatar' | 'theme' | 'badge';
  name: string;
  description: string;
  requirement: UnlockRequirement;
  unlocked: boolean;
}

interface UnlockRequirement {
  type: 'level' | 'points' | 'achievement' | 'streak';
  value: number;
}

interface AchievementSystem {
  earned: Achievement[];
  inProgress: AchievementProgress[];
  available: Achievement[];
  showcased: string[]; // Achievement IDs displayed on profile
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
  xp: number;
  criteria: AchievementCriteria;
  earnedAt?: Date;
  progress?: number; // 0-100
}

type AchievementCategory =
  | 'learning'
  | 'mastery'
  | 'social'
  | 'exploration'
  | 'dedication';

interface AchievementCriteria {
  type: string;
  target: number;
  current?: number;
  description: string;
}

interface AchievementProgress {
  achievementId: string;
  progress: number;
  target: number;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'story' | 'challenge';
  objectives: Objective[];
  rewards: Reward[];
  expiresAt?: Date;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'available' | 'active' | 'completed' | 'expired';
}

interface Objective {
  id: string;
  description: string;
  type: string;
  target: number;
  current: number;
  completed: boolean;
}

interface Reward {
  type: 'xp' | 'points' | 'badge' | 'item' | 'currency';
  amount: number;
  item?: string;
  description: string;
}

interface SocialSystem {
  friends: Friend[];
  teams: Team[];
  leaderboards: LeaderboardEntry[];
  interactions: SocialInteraction[];
}

interface Friend {
  userId: string;
  username: string;
  level: number;
  status: 'online' | 'offline' | 'in-lesson';
  addedAt: Date;
}

interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  totalPoints: number;
  rank: number;
  createdAt: Date;
}

interface TeamMember {
  userId: string;
  username: string;
  role: 'leader' | 'member';
  contributionPoints: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  score: number;
  metric: 'xp' | 'points' | 'streak' | 'courses';
  change: number; // Rank change from previous period
}

interface SocialInteraction {
  id: string;
  type: 'kudos' | 'help' | 'share' | 'challenge';
  fromUserId: string;
  toUserId?: string;
  timestamp: Date;
  message?: string;
}

interface RewardSystem {
  currency: Currency;
  inventory: InventoryItem[];
  shop: ShopItem[];
  recentRewards: RecentReward[];
}

interface Currency {
  coins: number;
  gems: number;
}

interface InventoryItem {
  id: string;
  type: 'avatar' | 'badge' | 'powerup' | 'cosmetic';
  name: string;
  rarity: Achievement['rarity'];
  equipped: boolean;
  acquiredAt: Date;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: InventoryItem['type'];
  price: number;
  currency: 'coins' | 'gems';
  available: boolean;
  limited?: boolean;
}

interface RecentReward {
  type: Reward['type'];
  amount: number;
  reason: string;
  earnedAt: Date;
}

// Gamification Service
class GamificationService {
  private users: Map<string, GamificationSystem> = new Map();
  private quests: Map<string, Quest> = new Map();
  private achievements: Achievement[] = [];

  constructor() {
    this.initializeAchievements();
  }

  /**
   * Initialize gamification for user
   */
  initializeUser(userId: string, username: string): GamificationSystem {
    console.log(`🎮 Initializing gamification for ${username}...`);

    const system: GamificationSystem = {
      userId,
      profile: {
        id: userId,
        username,
        avatar: 'default-avatar.png',
        level: 1,
        title: 'Beginner',
        xp: 0,
        nextLevelXP: 100,
        totalPoints: 0,
        streak: {
          current: 0,
          longest: 0,
          lastActivityDate: new Date(),
          milestones: [7, 30, 100],
        },
        stats: {
          lessonsCompleted: 0,
          quizzesPassed: 0,
          perfectScores: 0,
          timeSpent: 0,
          coursesCompleted: 0,
          helpedOthers: 0,
        },
      },
      progression: {
        currentLevel: 1,
        xpProgress: { current: 0, required: 100, percentage: 0 },
        levels: this.generateLevels(),
        unlockables: this.generateUnlockables(),
      },
      achievements: {
        earned: [],
        inProgress: [],
        available: [...this.achievements],
        showcased: [],
      },
      social: {
        friends: [],
        teams: [],
        leaderboards: [],
        interactions: [],
      },
      rewards: {
        currency: { coins: 0, gems: 0 },
        inventory: [],
        shop: this.generateShopItems(),
        recentRewards: [],
      },
    };

    this.users.set(userId, system);

    // Generate initial daily quests
    this.generateDailyQuests(userId);

    console.log(`✅ Gamification initialized`);
    return system;
  }

  /**
   * Award XP and points
   */
  awardXP(
    userId: string,
    xp: number,
    points: number,
    reason: string
  ): { leveledUp: boolean; newLevel?: number } {
    const system = this.getSystem(userId);

    console.log(`⭐ Awarding ${xp} XP and ${points} points for: ${reason}`);

    system.profile.xp += xp;
    system.profile.totalPoints += points;
    system.rewards.currency.coins += Math.floor(points / 10);

    // Record reward
    system.rewards.recentRewards.unshift({
      type: 'xp',
      amount: xp,
      reason,
      earnedAt: new Date(),
    });

    // Check for level up
    const levelUp = this.checkLevelUp(system);

    // Update XP progress
    this.updateXPProgress(system);

    // Check achievements
    this.checkAchievements(system);

    return levelUp;
  }

  /**
   * Complete lesson and award rewards
   */
  completeLesson(
    userId: string,
    lessonId: string,
    score: number,
    timeSpent: number
  ): void {
    const system = this.getSystem(userId);

    console.log(`📚 Lesson completed: ${lessonId} (Score: ${score}%)`);

    // Update stats
    system.profile.stats.lessonsCompleted++;
    system.profile.stats.timeSpent += timeSpent / 60; // Convert to hours

    if (score === 100) {
      system.profile.stats.perfectScores++;
    }

    // Calculate XP based on performance
    let xp = 50; // Base XP
    if (score >= 90) xp += 30;
    else if (score >= 80) xp += 20;
    else if (score >= 70) xp += 10;

    // Bonus for perfect score
    if (score === 100) {
      xp += 20;
      console.log('   🎯 Perfect score bonus: +20 XP');
    }

    const points = score;

    this.awardXP(userId, xp, points, 'Lesson completion');

    // Update streak
    this.updateStreak(system);

    // Update quest progress
    this.updateQuestProgress(userId, 'complete-lesson', 1);
  }

  /**
   * Pass quiz
   */
  passQuiz(userId: string, quizId: string, score: number): void {
    const system = this.getSystem(userId);

    console.log(`✅ Quiz passed: ${quizId} (Score: ${score}%)`);

    system.profile.stats.quizzesPassed++;

    const xp = Math.floor(score * 1.5);
    const points = score * 2;

    this.awardXP(userId, xp, points, 'Quiz passed');

    this.updateQuestProgress(userId, 'pass-quiz', 1);
  }

  /**
   * Complete course
   */
  completeCourse(userId: string, courseId: string, finalGrade: string): void {
    const system = this.getSystem(userId);

    console.log(`🎓 Course completed: ${courseId} (Grade: ${finalGrade})`);

    system.profile.stats.coursesCompleted++;

    // Award significant XP and gems
    const xp = 500;
    const points = 1000;
    const gems = 10;

    this.awardXP(userId, xp, points, 'Course completion');
    system.rewards.currency.gems += gems;

    console.log(`   💎 Awarded ${gems} gems`);

    this.updateQuestProgress(userId, 'complete-course', 1);
  }

  /**
   * Unlock achievement
   */
  unlockAchievement(userId: string, achievementId: string): void {
    const system = this.getSystem(userId);

    const achievement = this.achievements.find(a => a.id === achievementId);

    if (!achievement) {
      throw new Error(`Achievement ${achievementId} not found`);
    }

    // Check if already earned
    if (system.achievements.earned.some(a => a.id === achievementId)) {
      return;
    }

    achievement.earnedAt = new Date();
    system.achievements.earned.push(achievement);

    // Remove from available
    system.achievements.available = system.achievements.available.filter(
      a => a.id !== achievementId
    );

    // Award rewards
    this.awardXP(userId, achievement.xp, achievement.points, `Achievement: ${achievement.name}`);

    console.log(`🏆 Achievement unlocked: ${achievement.name}`);
    console.log(`   Rarity: ${achievement.rarity}`);
    console.log(`   Rewards: ${achievement.xp} XP, ${achievement.points} points`);
  }

  /**
   * Start quest
   */
  startQuest(userId: string, questId: string): void {
    const quest = this.quests.get(questId);

    if (!quest) {
      throw new Error(`Quest ${questId} not found`);
    }

    if (quest.status !== 'available') {
      throw new Error('Quest not available');
    }

    quest.status = 'active';
    console.log(`⚔️ Quest started: ${quest.title}`);
  }

  /**
   * Update quest progress
   */
  updateQuestProgress(userId: string, objectiveType: string, amount: number): void {
    const userQuests = Array.from(this.quests.values()).filter(
      q => q.status === 'active'
    );

    userQuests.forEach(quest => {
      quest.objectives.forEach(objective => {
        if (objective.type === objectiveType && !objective.completed) {
          objective.current = Math.min(
            objective.target,
            objective.current + amount
          );

          if (objective.current >= objective.target) {
            objective.completed = true;
            console.log(`   ✓ Quest objective completed: ${objective.description}`);
          }
        }
      });

      // Check if quest is complete
      if (quest.objectives.every(o => o.completed)) {
        this.completeQuest(userId, quest.id);
      }
    });
  }

  /**
   * Complete quest
   */
  completeQuest(userId: string, questId: string): void {
    const quest = this.quests.get(questId);

    if (!quest) {
      throw new Error(`Quest ${questId} not found`);
    }

    quest.status = 'completed';

    console.log(`🎉 Quest completed: ${quest.title}`);

    // Award rewards
    quest.rewards.forEach(reward => {
      if (reward.type === 'xp') {
        this.awardXP(userId, reward.amount, 0, `Quest: ${quest.title}`);
      } else if (reward.type === 'points') {
        this.awardXP(userId, 0, reward.amount, `Quest: ${quest.title}`);
      } else if (reward.type === 'badge') {
        console.log(`   🎖️ Badge unlocked: ${reward.item}`);
      }
    });
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(
    type: 'global' | 'friends' | 'team',
    metric: LeaderboardEntry['metric'],
    limit: number = 10
  ): LeaderboardEntry[] {
    console.log(`📊 Fetching ${type} leaderboard (${metric})...`);

    // Simplified - would query actual data
    const entries: LeaderboardEntry[] = Array.from(this.users.values())
      .map((system, index) => ({
        rank: index + 1,
        userId: system.userId,
        username: system.profile.username,
        avatar: system.profile.avatar,
        score: this.getMetricValue(system, metric),
        metric,
        change: Math.floor(Math.random() * 5) - 2,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return entries;
  }

  /**
   * Send kudos to another user
   */
  sendKudos(fromUserId: string, toUserId: string, message: string): void {
    const fromSystem = this.getSystem(fromUserId);
    const toSystem = this.getSystem(toUserId);

    const interaction: SocialInteraction = {
      id: this.generateId(),
      type: 'kudos',
      fromUserId,
      toUserId,
      timestamp: new Date(),
      message,
    };

    fromSystem.social.interactions.push(interaction);
    toSystem.social.interactions.push(interaction);

    // Award points
    this.awardXP(toUserId, 10, 20, 'Received kudos');
    fromSystem.profile.stats.helpedOthers++;

    console.log(`👏 Kudos sent from ${fromSystem.profile.username} to ${toSystem.profile.username}`);
  }

  /**
   * Buy item from shop
   */
  buyItem(userId: string, itemId: string): void {
    const system = this.getSystem(userId);
    const item = system.rewards.shop.find(i => i.id === itemId);

    if (!item) {
      throw new Error('Item not found');
    }

    if (!item.available) {
      throw new Error('Item not available');
    }

    // Check currency
    const currency = system.rewards.currency[item.currency];
    if (currency < item.price) {
      throw new Error(`Insufficient ${item.currency}`);
    }

    // Deduct currency
    system.rewards.currency[item.currency] -= item.price;

    // Add to inventory
    const inventoryItem: InventoryItem = {
      id: this.generateId(),
      type: item.type,
      name: item.name,
      rarity: 'common',
      equipped: false,
      acquiredAt: new Date(),
    };

    system.rewards.inventory.push(inventoryItem);

    console.log(`🛒 Purchased: ${item.name} for ${item.price} ${item.currency}`);
  }

  // Helper methods

  private checkLevelUp(system: GamificationSystem): {
    leveledUp: boolean;
    newLevel?: number;
  } {
    const nextLevel = system.progression.levels.find(
      l => l.level === system.profile.level + 1
    );

    if (nextLevel && system.profile.xp >= nextLevel.minXP) {
      system.profile.level = nextLevel.level;
      system.profile.title = nextLevel.title;
      system.progression.currentLevel = nextLevel.level;

      console.log(`🎊 LEVEL UP! Now level ${nextLevel.level}: ${nextLevel.title}`);

      // Award level rewards
      nextLevel.rewards.forEach(reward => {
        if (reward.type === 'gems') {
          system.rewards.currency.gems += reward.amount;
          console.log(`   💎 Awarded ${reward.amount} gems`);
        }
      });

      // Unlock features
      nextLevel.unlocksFeatures.forEach(feature => {
        console.log(`   🔓 Unlocked: ${feature}`);
      });

      return { leveledUp: true, newLevel: nextLevel.level };
    }

    return { leveledUp: false };
  }

  private updateXPProgress(system: GamificationSystem): void {
    const currentLevel = system.progression.levels.find(
      l => l.level === system.profile.level
    );
    const nextLevel = system.progression.levels.find(
      l => l.level === system.profile.level + 1
    );

    if (currentLevel && nextLevel) {
      const current = system.profile.xp - currentLevel.minXP;
      const required = nextLevel.minXP - currentLevel.minXP;
      const percentage = (current / required) * 100;

      system.progression.xpProgress = {
        current,
        required,
        percentage,
      };

      system.profile.nextLevelXP = nextLevel.minXP;
    }
  }

  private updateStreak(system: GamificationSystem): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivity = new Date(system.profile.streak.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 1) {
      // Consecutive day
      system.profile.streak.current++;
      system.profile.streak.longest = Math.max(
        system.profile.streak.longest,
        system.profile.streak.current
      );

      console.log(`🔥 Streak: ${system.profile.streak.current} days`);

      // Check for streak milestones
      if (system.profile.streak.milestones.includes(system.profile.streak.current)) {
        console.log(`   🏆 Streak milestone reached!`);
        this.unlockAchievement(system.userId, `streak-${system.profile.streak.current}`);
      }
    } else if (daysDiff > 1) {
      // Streak broken
      console.log(`   💔 Streak broken at ${system.profile.streak.current} days`);
      system.profile.streak.current = 1;
    }

    system.profile.streak.lastActivityDate = new Date();
  }

  private checkAchievements(system: GamificationSystem): void {
    system.achievements.available.forEach(achievement => {
      const criteria = achievement.criteria;
      let qualified = false;

      switch (criteria.type) {
        case 'lessons-completed':
          qualified = system.profile.stats.lessonsCompleted >= criteria.target;
          break;
        case 'perfect-scores':
          qualified = system.profile.stats.perfectScores >= criteria.target;
          break;
        case 'courses-completed':
          qualified = system.profile.stats.coursesCompleted >= criteria.target;
          break;
        case 'points-earned':
          qualified = system.profile.totalPoints >= criteria.target;
          break;
      }

      if (qualified) {
        this.unlockAchievement(system.userId, achievement.id);
      }
    });
  }

  private generateDailyQuests(userId: string): void {
    const dailyQuests: Quest[] = [
      {
        id: this.generateId(),
        title: 'Daily Learning',
        description: 'Complete 3 lessons today',
        type: 'daily',
        objectives: [
          {
            id: '1',
            description: 'Complete lessons',
            type: 'complete-lesson',
            target: 3,
            current: 0,
            completed: false,
          },
        ],
        rewards: [
          { type: 'xp', amount: 100, description: '100 XP' },
          { type: 'points', amount: 50, description: '50 points' },
        ],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        difficulty: 'easy',
        status: 'available',
      },
      {
        id: this.generateId(),
        title: 'Quiz Master',
        description: 'Pass 2 quizzes with 80% or higher',
        type: 'daily',
        objectives: [
          {
            id: '1',
            description: 'Pass quizzes',
            type: 'pass-quiz',
            target: 2,
            current: 0,
            completed: false,
          },
        ],
        rewards: [
          { type: 'xp', amount: 150, description: '150 XP' },
          { type: 'points', amount: 75, description: '75 points' },
        ],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        difficulty: 'medium',
        status: 'available',
      },
    ];

    dailyQuests.forEach(quest => {
      this.quests.set(quest.id, quest);
    });

    console.log(`📋 Generated ${dailyQuests.length} daily quests`);
  }

  private generateLevels(): Level[] {
    const levels: Level[] = [];

    for (let i = 1; i <= 50; i++) {
      levels.push({
        level: i,
        title: this.getLevelTitle(i),
        minXP: Math.floor(100 * Math.pow(1.5, i - 1)),
        rewards: i % 5 === 0 ? [{ type: 'gems', amount: 10, description: '10 gems' }] : [],
        unlocksFeatures: i % 10 === 0 ? [`Feature at level ${i}`] : [],
      });
    }

    return levels;
  }

  private getLevelTitle(level: number): string {
    if (level < 5) return 'Beginner';
    if (level < 10) return 'Novice';
    if (level < 20) return 'Intermediate';
    if (level < 30) return 'Advanced';
    if (level < 40) return 'Expert';
    return 'Master';
  }

  private generateUnlockables(): Unlockable[] {
    return [
      {
        id: 'avatar-1',
        type: 'avatar',
        name: 'Cool Avatar',
        description: 'Unlock at level 5',
        requirement: { type: 'level', value: 5 },
        unlocked: false,
      },
      {
        id: 'theme-dark',
        type: 'theme',
        name: 'Dark Theme',
        description: 'Earn 1000 points',
        requirement: { type: 'points', value: 1000 },
        unlocked: false,
      },
    ];
  }

  private initializeAchievements(): void {
    this.achievements = [
      {
        id: 'first-lesson',
        name: 'First Steps',
        description: 'Complete your first lesson',
        icon: '🎯',
        category: 'learning',
        rarity: 'common',
        points: 10,
        xp: 25,
        criteria: { type: 'lessons-completed', target: 1, description: 'Complete 1 lesson' },
      },
      {
        id: 'perfect-score-1',
        name: 'Perfectionist',
        description: 'Get a perfect score',
        icon: '⭐',
        category: 'mastery',
        rarity: 'uncommon',
        points: 50,
        xp: 100,
        criteria: { type: 'perfect-scores', target: 1, description: 'Get 1 perfect score' },
      },
      {
        id: 'streak-7',
        name: 'Week Warrior',
        description: '7-day learning streak',
        icon: '🔥',
        category: 'dedication',
        rarity: 'rare',
        points: 100,
        xp: 250,
        criteria: { type: 'streak', target: 7, description: 'Maintain 7-day streak' },
      },
      {
        id: 'course-complete-1',
        name: 'Graduate',
        description: 'Complete your first course',
        icon: '🎓',
        category: 'learning',
        rarity: 'epic',
        points: 500,
        xp: 1000,
        criteria: { type: 'courses-completed', target: 1, description: 'Complete 1 course' },
      },
    ];
  }

  private generateShopItems(): ShopItem[] {
    return [
      {
        id: 'avatar-premium',
        name: 'Premium Avatar',
        description: 'Exclusive avatar design',
        type: 'avatar',
        price: 1000,
        currency: 'coins',
        available: true,
      },
      {
        id: 'xp-boost',
        name: 'XP Boost (24h)',
        description: '2x XP for 24 hours',
        type: 'powerup',
        price: 50,
        currency: 'gems',
        available: true,
        limited: true,
      },
    ];
  }

  private getMetricValue(
    system: GamificationSystem,
    metric: LeaderboardEntry['metric']
  ): number {
    switch (metric) {
      case 'xp':
        return system.profile.xp;
      case 'points':
        return system.profile.totalPoints;
      case 'streak':
        return system.profile.streak.current;
      case 'courses':
        return system.profile.stats.coursesCompleted;
      default:
        return 0;
    }
  }

  private getSystem(userId: string): GamificationSystem {
    const system = this.users.get(userId);
    if (!system) {
      throw new Error(`User ${userId} not found`);
    }
    return system;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Example Usage
async function demonstrateGamification() {
  console.log('=== Gamification Example ===\n');

  const service = new GamificationService();

  // Initialize user
  const system = service.initializeUser('user-001', 'Alice');

  console.log('\n👤 User Profile:');
  console.log(`   Username: ${system.profile.username}`);
  console.log(`   Level: ${system.profile.level} (${system.profile.title})`);
  console.log(`   XP: ${system.profile.xp}/${system.profile.nextLevelXP}`);

  // Complete lessons
  console.log('\n📚 Completing lessons...\n');
  service.completeLesson('user-001', 'lesson-1', 85, 15);
  service.completeLesson('user-001', 'lesson-2', 100, 20);
  service.completeLesson('user-001', 'lesson-3', 92, 18);

  // Pass quizzes
  console.log('\n📝 Passing quizzes...\n');
  service.passQuiz('user-001', 'quiz-1', 88);
  service.passQuiz('user-001', 'quiz-2', 95);

  // Complete course
  console.log('\n🎓 Completing course...\n');
  service.completeCourse('user-001', 'course-webdev', 'A');

  // Check profile after activities
  console.log('\n📊 Updated Profile:');
  console.log(`   Level: ${system.profile.level} (${system.profile.title})`);
  console.log(`   XP: ${system.profile.xp} (Progress: ${system.progression.xpProgress.percentage.toFixed(2)}%)`);
  console.log(`   Total Points: ${system.profile.totalPoints}`);
  console.log(`   Streak: ${system.profile.streak.current} days`);
  console.log(`   Currency: ${system.rewards.currency.coins} coins, ${system.rewards.currency.gems} gems`);

  // View achievements
  console.log('\n🏆 Achievements Earned:');
  system.achievements.earned.forEach(achievement => {
    console.log(`   ${achievement.icon} ${achievement.name} (${achievement.rarity})`);
    console.log(`      ${achievement.description}`);
  });

  // View leaderboard
  console.log('\n📊 Global Leaderboard (XP):');
  const leaderboard = service.getLeaderboard('global', 'xp', 5);
  leaderboard.forEach(entry => {
    console.log(
      `   ${entry.rank}. ${entry.username} - ${entry.score} XP ${entry.change > 0 ? '↑' : entry.change < 0 ? '↓' : '='}`
    );
  });

  // Start and complete quest
  console.log('\n⚔️ Quests...\n');
  const quests = Array.from(service['quests'].values());
  if (quests.length > 0) {
    service.startQuest('user-001', quests[0].id);
  }

  // Social interaction
  console.log('\n👥 Social Features...\n');
  const system2 = service.initializeUser('user-002', 'Bob');
  service.sendKudos('user-001', 'user-002', 'Great work on that project!');

  // Shop
  console.log('\n🛒 Shop...\n');
  console.log('Available items:');
  system.rewards.shop.slice(0, 3).forEach(item => {
    console.log(`   - ${item.name}: ${item.price} ${item.currency}`);
  });

  console.log('\n✅ Gamification demonstration complete!');
}

// Run the example
demonstrateGamification().catch(console.error);
