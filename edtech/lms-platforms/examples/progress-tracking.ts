/**
 * Progress Tracking Example for LMS Platforms
 *
 * Demonstrates tracking student progress, completion status, learning analytics,
 * and performance metrics in an LMS.
 */

// Types
interface LearningProgress {
  studentId: string;
  courseId: string;
  overallProgress: number; // 0-100
  moduleProgress: Map<string, ModuleProgress>;
  startedAt: Date;
  lastAccessedAt: Date;
  estimatedCompletionDate?: Date;
  totalTimeSpent: number; // minutes
  streakDays: number;
  milestones: Milestone[];
}

interface ModuleProgress {
  moduleId: string;
  progress: number; // 0-100
  lessonProgress: Map<string, LessonProgress>;
  status: 'not-started' | 'in-progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
}

interface LessonProgress {
  lessonId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number; // 0-100
  timeSpent: number; // minutes
  attempts: number;
  lastAttemptAt?: Date;
  completedAt?: Date;
  score?: number;
  interactions: LessonInteraction[];
}

interface LessonInteraction {
  timestamp: Date;
  type: 'view' | 'play' | 'pause' | 'complete' | 'submit' | 'bookmark';
  data?: Record<string, unknown>;
}

interface Milestone {
  id: string;
  type: 'first-lesson' | 'module-completed' | 'course-completed' | 'streak' | 'perfect-score';
  achievedAt: Date;
  metadata?: Record<string, unknown>;
}

interface ProgressSnapshot {
  timestamp: Date;
  progress: number;
  lessonsCompleted: number;
  timeSpent: number;
}

interface LearningAnalytics {
  studentId: string;
  courseId: string;
  engagementScore: number; // 0-100
  performanceScore: number; // 0-100
  paceScore: number; // 0-100 (compared to average)
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  timeDistribution: {
    videos: number;
    readings: number;
    assignments: number;
    quizzes: number;
  };
  activityPattern: {
    mostActiveDay: string;
    mostActiveHour: number;
    averageSessionDuration: number;
  };
}

interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  progress: number;
  score: number;
  timeSpent: number;
}

// Progress Tracking Service
class ProgressTrackingService {
  private progressRecords: Map<string, LearningProgress> = new Map();
  private progressHistory: Map<string, ProgressSnapshot[]> = new Map();

  /**
   * Initialize progress tracking for a student
   */
  initializeProgress(studentId: string, courseId: string): LearningProgress {
    const key = this.getKey(studentId, courseId);

    const progress: LearningProgress = {
      studentId,
      courseId,
      overallProgress: 0,
      moduleProgress: new Map(),
      startedAt: new Date(),
      lastAccessedAt: new Date(),
      totalTimeSpent: 0,
      streakDays: 0,
      milestones: [],
    };

    this.progressRecords.set(key, progress);
    this.progressHistory.set(key, []);

    console.log(`✅ Progress tracking initialized for student ${studentId}`);
    return progress;
  }

  /**
   * Record lesson interaction
   */
  recordInteraction(
    studentId: string,
    courseId: string,
    moduleId: string,
    lessonId: string,
    interaction: Omit<LessonInteraction, 'timestamp'>
  ): void {
    const progress = this.getProgress(studentId, courseId);
    progress.lastAccessedAt = new Date();

    // Get or create module progress
    let moduleProgress = progress.moduleProgress.get(moduleId);
    if (!moduleProgress) {
      moduleProgress = {
        moduleId,
        progress: 0,
        lessonProgress: new Map(),
        status: 'not-started',
      };
      progress.moduleProgress.set(moduleId, moduleProgress);
    }

    // Get or create lesson progress
    let lessonProgress = moduleProgress.lessonProgress.get(lessonId);
    if (!lessonProgress) {
      lessonProgress = {
        lessonId,
        status: 'not-started',
        progress: 0,
        timeSpent: 0,
        attempts: 0,
        interactions: [],
      };
      moduleProgress.lessonProgress.set(lessonId, lessonProgress);
    }

    // Update lesson status
    if (lessonProgress.status === 'not-started') {
      lessonProgress.status = 'in-progress';
      moduleProgress.status = 'in-progress';
    }

    // Add interaction
    lessonProgress.interactions.push({
      timestamp: new Date(),
      ...interaction,
    });

    // Update time spent if it's a time-based interaction
    if (interaction.data?.duration) {
      const duration = interaction.data.duration as number;
      lessonProgress.timeSpent += duration;
      progress.totalTimeSpent += duration;
    }

    console.log(`📝 Interaction recorded: ${interaction.type} for lesson ${lessonId}`);
  }

  /**
   * Mark lesson as completed
   */
  completeLesson(
    studentId: string,
    courseId: string,
    moduleId: string,
    lessonId: string,
    score?: number
  ): void {
    const progress = this.getProgress(studentId, courseId);
    const moduleProgress = progress.moduleProgress.get(moduleId);

    if (!moduleProgress) {
      throw new Error(`Module ${moduleId} not found in progress`);
    }

    const lessonProgress = moduleProgress.lessonProgress.get(lessonId);
    if (!lessonProgress) {
      throw new Error(`Lesson ${lessonId} not found in progress`);
    }

    lessonProgress.status = 'completed';
    lessonProgress.progress = 100;
    lessonProgress.completedAt = new Date();
    if (score !== undefined) {
      lessonProgress.score = score;
    }

    // Check for first lesson milestone
    if (this.countCompletedLessons(progress) === 1) {
      this.addMilestone(progress, {
        id: this.generateId(),
        type: 'first-lesson',
        achievedAt: new Date(),
      });
    }

    // Check for perfect score milestone
    if (score === 100) {
      this.addMilestone(progress, {
        id: this.generateId(),
        type: 'perfect-score',
        achievedAt: new Date(),
        metadata: { lessonId },
      });
    }

    // Update module progress
    this.updateModuleProgress(progress, moduleId);

    // Update overall progress
    this.updateOverallProgress(progress);

    // Update streak
    this.updateStreak(progress);

    // Take snapshot
    this.takeSnapshot(studentId, courseId, progress);

    console.log(`✅ Lesson completed: ${lessonId} (Score: ${score ?? 'N/A'})`);
  }

  /**
   * Update module progress
   */
  private updateModuleProgress(
    progress: LearningProgress,
    moduleId: string
  ): void {
    const moduleProgress = progress.moduleProgress.get(moduleId);
    if (!moduleProgress) return;

    const lessons = Array.from(moduleProgress.lessonProgress.values());
    const completedLessons = lessons.filter(l => l.status === 'completed');

    moduleProgress.progress =
      (completedLessons.length / lessons.length) * 100 || 0;

    if (moduleProgress.progress === 100) {
      moduleProgress.status = 'completed';
      moduleProgress.completedAt = new Date();

      this.addMilestone(progress, {
        id: this.generateId(),
        type: 'module-completed',
        achievedAt: new Date(),
        metadata: { moduleId },
      });

      console.log(`🎉 Module completed: ${moduleId}`);
    }
  }

  /**
   * Update overall progress
   */
  private updateOverallProgress(progress: LearningProgress): void {
    const modules = Array.from(progress.moduleProgress.values());

    if (modules.length === 0) {
      progress.overallProgress = 0;
      return;
    }

    const totalProgress = modules.reduce((sum, m) => sum + m.progress, 0);
    progress.overallProgress = totalProgress / modules.length;

    if (progress.overallProgress === 100) {
      this.addMilestone(progress, {
        id: this.generateId(),
        type: 'course-completed',
        achievedAt: new Date(),
      });

      console.log(`🎉 Course completed!`);
    }

    // Calculate estimated completion date
    if (progress.overallProgress > 0 && progress.overallProgress < 100) {
      const daysElapsed = Math.floor(
        (Date.now() - progress.startedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const progressRate = progress.overallProgress / daysElapsed;
      const remainingProgress = 100 - progress.overallProgress;
      const estimatedDaysRemaining = Math.ceil(remainingProgress / progressRate);

      progress.estimatedCompletionDate = new Date(
        Date.now() + estimatedDaysRemaining * 24 * 60 * 60 * 1000
      );
    }
  }

  /**
   * Update learning streak
   */
  private updateStreak(progress: LearningProgress): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastAccessed = new Date(progress.lastAccessedAt);
    lastAccessed.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (today.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) {
      // Same day - no change
      return;
    } else if (daysDiff === 1) {
      // Consecutive day - increment streak
      progress.streakDays++;

      if (progress.streakDays % 7 === 0) {
        this.addMilestone(progress, {
          id: this.generateId(),
          type: 'streak',
          achievedAt: new Date(),
          metadata: { days: progress.streakDays },
        });
      }
    } else {
      // Streak broken
      progress.streakDays = 1;
    }
  }

  /**
   * Get detailed progress report
   */
  getProgressReport(studentId: string, courseId: string): LearningProgress {
    return this.getProgress(studentId, courseId);
  }

  /**
   * Generate learning analytics
   */
  generateAnalytics(studentId: string, courseId: string): LearningAnalytics {
    const progress = this.getProgress(studentId, courseId);

    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore(progress);

    // Calculate performance score
    const performanceScore = this.calculatePerformanceScore(progress);

    // Calculate pace score
    const paceScore = this.calculatePaceScore(progress);

    // Analyze strengths and weaknesses
    const { strengths, weaknesses } = this.analyzePerformance(progress);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      progress,
      engagementScore,
      performanceScore
    );

    // Calculate time distribution
    const timeDistribution = this.calculateTimeDistribution(progress);

    // Analyze activity pattern
    const activityPattern = this.analyzeActivityPattern(progress);

    return {
      studentId,
      courseId,
      engagementScore,
      performanceScore,
      paceScore,
      strengths,
      weaknesses,
      recommendations,
      timeDistribution,
      activityPattern,
    };
  }

  /**
   * Get progress history
   */
  getProgressHistory(studentId: string, courseId: string): ProgressSnapshot[] {
    const key = this.getKey(studentId, courseId);
    return this.progressHistory.get(key) || [];
  }

  /**
   * Generate leaderboard
   */
  generateLeaderboard(courseId: string): LeaderboardEntry[] {
    const courseProgress = Array.from(this.progressRecords.values())
      .filter(p => p.courseId === courseId)
      .map(p => ({
        studentId: p.studentId,
        progress: p.overallProgress,
        score: this.calculatePerformanceScore(p),
        timeSpent: p.totalTimeSpent,
      }))
      .sort((a, b) => {
        if (b.progress !== a.progress) return b.progress - a.progress;
        if (b.score !== a.score) return b.score - a.score;
        return a.timeSpent - b.timeSpent;
      });

    return courseProgress.map((entry, index) => ({
      rank: index + 1,
      studentName: `Student ${entry.studentId}`,
      ...entry,
    }));
  }

  // Helper methods
  private calculateEngagementScore(progress: LearningProgress): number {
    const factors = {
      streak: Math.min(progress.streakDays / 30, 1) * 30,
      timeSpent: Math.min(progress.totalTimeSpent / 1000, 1) * 40,
      progress: (progress.overallProgress / 100) * 30,
    };

    return Math.round(factors.streak + factors.timeSpent + factors.progress);
  }

  private calculatePerformanceScore(progress: LearningProgress): number {
    const allScores: number[] = [];

    progress.moduleProgress.forEach(moduleProgress => {
      moduleProgress.lessonProgress.forEach(lessonProgress => {
        if (lessonProgress.score !== undefined) {
          allScores.push(lessonProgress.score);
        }
      });
    });

    if (allScores.length === 0) return 0;

    return Math.round(
      allScores.reduce((sum, score) => sum + score, 0) / allScores.length
    );
  }

  private calculatePaceScore(progress: LearningProgress): number {
    const expectedRate = 10; // lessons per week
    const weeksElapsed = Math.max(
      (Date.now() - progress.startedAt.getTime()) / (1000 * 60 * 60 * 24 * 7),
      1
    );

    const actualRate = this.countCompletedLessons(progress) / weeksElapsed;
    return Math.min(Math.round((actualRate / expectedRate) * 100), 100);
  }

  private analyzePerformance(progress: LearningProgress): {
    strengths: string[];
    weaknesses: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (progress.streakDays >= 7) {
      strengths.push('Consistent learning habits');
    }

    const avgScore = this.calculatePerformanceScore(progress);
    if (avgScore >= 90) {
      strengths.push('Excellent comprehension');
    } else if (avgScore < 70) {
      weaknesses.push('Struggling with assessments');
    }

    if (progress.overallProgress < 20 && progress.totalTimeSpent > 500) {
      weaknesses.push('Low completion rate despite high time investment');
    }

    return { strengths, weaknesses };
  }

  private generateRecommendations(
    progress: LearningProgress,
    engagement: number,
    performance: number
  ): string[] {
    const recommendations: string[] = [];

    if (engagement < 50) {
      recommendations.push('Try to maintain a daily learning streak');
    }

    if (performance < 70) {
      recommendations.push('Review previous lessons before moving forward');
      recommendations.push('Consider seeking help from instructors');
    }

    if (progress.streakDays === 0) {
      recommendations.push('Start building a learning routine');
    }

    return recommendations;
  }

  private calculateTimeDistribution(progress: LearningProgress): {
    videos: number;
    readings: number;
    assignments: number;
    quizzes: number;
  } {
    // Simplified - would need lesson type information
    return {
      videos: 40,
      readings: 30,
      assignments: 20,
      quizzes: 10,
    };
  }

  private analyzeActivityPattern(progress: LearningProgress): {
    mostActiveDay: string;
    mostActiveHour: number;
    averageSessionDuration: number;
  } {
    // Simplified - would need detailed session tracking
    return {
      mostActiveDay: 'Monday',
      mostActiveHour: 19,
      averageSessionDuration: 45,
    };
  }

  private countCompletedLessons(progress: LearningProgress): number {
    let count = 0;
    progress.moduleProgress.forEach(moduleProgress => {
      moduleProgress.lessonProgress.forEach(lessonProgress => {
        if (lessonProgress.status === 'completed') count++;
      });
    });
    return count;
  }

  private addMilestone(progress: LearningProgress, milestone: Milestone): void {
    progress.milestones.push(milestone);
    console.log(`🏆 Milestone achieved: ${milestone.type}`);
  }

  private takeSnapshot(
    studentId: string,
    courseId: string,
    progress: LearningProgress
  ): void {
    const key = this.getKey(studentId, courseId);
    const history = this.progressHistory.get(key) || [];

    history.push({
      timestamp: new Date(),
      progress: progress.overallProgress,
      lessonsCompleted: this.countCompletedLessons(progress),
      timeSpent: progress.totalTimeSpent,
    });

    this.progressHistory.set(key, history);
  }

  private getProgress(studentId: string, courseId: string): LearningProgress {
    const key = this.getKey(studentId, courseId);
    const progress = this.progressRecords.get(key);

    if (!progress) {
      throw new Error(`Progress not found for student ${studentId}`);
    }

    return progress;
  }

  private getKey(studentId: string, courseId: string): string {
    return `${studentId}:${courseId}`;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Example Usage
async function demonstrateProgressTracking() {
  console.log('=== Progress Tracking Example ===\n');

  const service = new ProgressTrackingService();

  const studentId = 'student-001';
  const courseId = 'course-webdev';
  const moduleId = 'module-html';
  const lessonId = 'lesson-intro';

  // Initialize progress
  service.initializeProgress(studentId, courseId);

  // Simulate learning activities
  console.log('\n📚 Simulating learning activities...\n');

  // Start watching a video lesson
  service.recordInteraction(studentId, courseId, moduleId, lessonId, {
    type: 'view',
  });

  service.recordInteraction(studentId, courseId, moduleId, lessonId, {
    type: 'play',
    data: { duration: 15 }, // 15 minutes
  });

  // Complete the lesson
  service.completeLesson(studentId, courseId, moduleId, lessonId, 95);

  // Complete more lessons
  for (let i = 2; i <= 5; i++) {
    const lesson = `lesson-${i}`;
    service.recordInteraction(studentId, courseId, moduleId, lesson, {
      type: 'view',
    });
    service.completeLesson(studentId, courseId, moduleId, lesson, 85 + i * 2);
  }

  // Get progress report
  console.log('\n📊 Progress Report:');
  const report = service.getProgressReport(studentId, courseId);
  console.log(`   Overall Progress: ${report.overallProgress.toFixed(2)}%`);
  console.log(`   Time Spent: ${report.totalTimeSpent} minutes`);
  console.log(`   Streak Days: ${report.streakDays}`);
  console.log(`   Milestones: ${report.milestones.length}`);

  if (report.estimatedCompletionDate) {
    console.log(
      `   Estimated Completion: ${report.estimatedCompletionDate.toDateString()}`
    );
  }

  // Generate analytics
  console.log('\n📈 Learning Analytics:');
  const analytics = service.generateAnalytics(studentId, courseId);
  console.log(`   Engagement Score: ${analytics.engagementScore}/100`);
  console.log(`   Performance Score: ${analytics.performanceScore}/100`);
  console.log(`   Pace Score: ${analytics.paceScore}/100`);
  console.log(`   Strengths: ${analytics.strengths.join(', ') || 'None yet'}`);
  console.log(
    `   Weaknesses: ${analytics.weaknesses.join(', ') || 'None identified'}`
  );
  console.log(`   Recommendations:`);
  analytics.recommendations.forEach(rec => {
    console.log(`     - ${rec}`);
  });

  // Get progress history
  console.log('\n📜 Progress History:');
  const history = service.getProgressHistory(studentId, courseId);
  history.forEach((snapshot, index) => {
    console.log(
      `   ${index + 1}. ${snapshot.progress.toFixed(2)}% - ${snapshot.lessonsCompleted} lessons (${snapshot.timeSpent}min)`
    );
  });

  // Generate leaderboard
  console.log('\n🏆 Course Leaderboard:');
  const leaderboard = service.generateLeaderboard(courseId);
  leaderboard.forEach(entry => {
    console.log(
      `   ${entry.rank}. ${entry.studentName} - ${entry.progress.toFixed(2)}% (Score: ${entry.score})`
    );
  });

  console.log('\n✅ Progress tracking demonstration complete!');
}

// Run the example
demonstrateProgressTracking().catch(console.error);
