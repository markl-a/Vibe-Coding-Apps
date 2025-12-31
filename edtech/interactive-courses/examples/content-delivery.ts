/**
 * Content Delivery Example for Interactive Learning
 *
 * Demonstrates adaptive content delivery, personalized learning paths,
 * media streaming, and progressive content unlocking.
 */

// Types
interface ContentDeliverySystem {
  studentId: string;
  courseId: string;
  currentPath: LearningPath;
  deliverySettings: DeliverySettings;
  adaptiveEngine: AdaptiveEngine;
}

interface LearningPath {
  id: string;
  name: string;
  modules: PathModule[];
  currentModule: number;
  currentLesson: number;
  completionRate: number;
  estimatedTimeRemaining: number; // minutes
}

interface PathModule {
  id: string;
  title: string;
  lessons: Lesson[];
  prerequisites: string[];
  locked: boolean;
  adaptiveContent: boolean;
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'article' | 'interactive' | 'quiz' | 'lab' | 'discussion';
  content: LessonContent;
  metadata: LessonMetadata;
  deliveryConfig: DeliveryConfig;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
}

interface LessonContent {
  url?: string;
  html?: string;
  markdown?: string;
  interactive?: InteractiveContent;
  media?: MediaContent;
  attachments?: Attachment[];
}

interface InteractiveContent {
  type: 'simulation' | 'code-editor' | 'diagram' | 'game';
  config: Record<string, unknown>;
  data: unknown;
}

interface MediaContent {
  type: 'video' | 'audio' | 'slides';
  sources: MediaSource[];
  captions?: Caption[];
  thumbnails?: string[];
  duration: number;
  streamingUrl: string;
}

interface MediaSource {
  quality: '360p' | '480p' | '720p' | '1080p' | '4k';
  url: string;
  bitrate: number;
  codec: string;
}

interface Caption {
  language: string;
  url: string;
  label: string;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  downloadable: boolean;
}

interface LessonMetadata {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // minutes
  learningObjectives: string[];
  keywords: string[];
  prerequisites: string[];
}

interface DeliveryConfig {
  adaptiveSpeed: boolean;
  skipAllowed: boolean;
  reviewRequired: boolean;
  minimumTimeRequired?: number;
  requiredInteractions?: string[];
}

interface DeliverySettings {
  speed: number; // 0.5 to 2.0
  quality: 'auto' | 'low' | 'medium' | 'high';
  captionsEnabled: boolean;
  preferredLanguage: string;
  autoplay: boolean;
  notifications: boolean;
}

interface AdaptiveEngine {
  enabled: boolean;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  difficultyLevel: number; // 1-10
  pacePreference: 'slow' | 'normal' | 'fast';
  recommendations: ContentRecommendation[];
}

interface ContentRecommendation {
  lessonId: string;
  reason: string;
  confidence: number; // 0-1
  priority: 'low' | 'medium' | 'high';
}

interface ProgressCheckpoint {
  lessonId: string;
  timestamp: Date;
  position: number; // For video: seconds, for article: scroll percentage
  completed: boolean;
  interactions: number;
}

interface ContentAnalytics {
  lessonId: string;
  views: number;
  completions: number;
  averageTimeSpent: number;
  averageProgress: number;
  dropoffPoints: number[];
  engagementRate: number;
  satisfactionScore: number;
}

// Content Delivery Service
class ContentDeliveryService {
  private learningPaths: Map<string, LearningPath> = new Map();
  private checkpoints: Map<string, ProgressCheckpoint[]> = new Map();
  private analytics: Map<string, ContentAnalytics> = new Map();

  /**
   * Initialize content delivery for a student
   */
  initializeDelivery(
    studentId: string,
    courseId: string,
    settings: DeliverySettings
  ): ContentDeliverySystem {
    console.log(`🚀 Initializing content delivery for student ${studentId}...`);

    const learningPath = this.generateLearningPath(studentId, courseId);

    const system: ContentDeliverySystem = {
      studentId,
      courseId,
      currentPath: learningPath,
      deliverySettings: settings,
      adaptiveEngine: {
        enabled: true,
        learningStyle: 'visual',
        difficultyLevel: 5,
        pacePreference: 'normal',
        recommendations: [],
      },
    };

    console.log(`✅ Content delivery initialized`);
    console.log(`   Path: ${learningPath.name}`);
    console.log(`   Modules: ${learningPath.modules.length}`);

    return system;
  }

  /**
   * Get next lesson for student
   */
  getNextLesson(system: ContentDeliverySystem): Lesson | null {
    const path = system.currentPath;
    const module = path.modules[path.currentModule];

    if (!module) {
      console.log('🎉 All modules completed!');
      return null;
    }

    // Check if module is locked
    if (module.locked) {
      console.log(`🔒 Module "${module.title}" is locked`);
      return null;
    }

    const lesson = module.lessons[path.currentLesson];

    if (!lesson) {
      // Move to next module
      path.currentModule++;
      path.currentLesson = 0;
      return this.getNextLesson(system);
    }

    // Adapt content based on student performance
    if (module.adaptiveContent && system.adaptiveEngine.enabled) {
      this.adaptLessonDifficulty(lesson, system.adaptiveEngine);
    }

    console.log(`📚 Next lesson: ${lesson.title}`);
    return lesson;
  }

  /**
   * Deliver lesson content
   */
  async deliverLesson(
    system: ContentDeliverySystem,
    lessonId: string
  ): Promise<{
    lesson: Lesson;
    content: LessonContent;
    streamingUrl?: string;
  }> {
    console.log(`📦 Delivering lesson ${lessonId}...`);

    const lesson = this.findLesson(system.currentPath, lessonId);

    if (!lesson) {
      throw new Error(`Lesson ${lessonId} not found`);
    }

    if (lesson.status === 'locked') {
      throw new Error('Lesson is locked');
    }

    // Update status
    if (lesson.status === 'available') {
      lesson.status = 'in-progress';
    }

    // Optimize content delivery based on settings
    const optimizedContent = await this.optimizeContent(
      lesson.content,
      system.deliverySettings
    );

    // Generate streaming URL for media
    let streamingUrl: string | undefined;
    if (lesson.content.media) {
      streamingUrl = this.generateStreamingUrl(
        lesson.content.media,
        system.deliverySettings
      );
    }

    // Track delivery
    this.trackDelivery(system.studentId, lessonId);

    console.log(`✅ Lesson delivered: ${lesson.title}`);
    console.log(`   Type: ${lesson.type}`);
    console.log(`   Duration: ${lesson.metadata.estimatedDuration} minutes`);

    return {
      lesson,
      content: optimizedContent,
      streamingUrl,
    };
  }

  /**
   * Save progress checkpoint
   */
  saveCheckpoint(
    studentId: string,
    lessonId: string,
    position: number,
    interactions: number
  ): void {
    const key = `${studentId}:${lessonId}`;
    let checkpoints = this.checkpoints.get(key) || [];

    const checkpoint: ProgressCheckpoint = {
      lessonId,
      timestamp: new Date(),
      position,
      completed: false,
      interactions,
    };

    checkpoints.push(checkpoint);
    this.checkpoints.set(key, checkpoints);

    console.log(`💾 Checkpoint saved at ${position}%`);
  }

  /**
   * Complete lesson
   */
  completeLesson(
    system: ContentDeliverySystem,
    lessonId: string,
    score?: number
  ): void {
    const lesson = this.findLesson(system.currentPath, lessonId);

    if (!lesson) {
      throw new Error(`Lesson ${lessonId} not found`);
    }

    lesson.status = 'completed';

    // Mark checkpoint as completed
    const key = `${system.studentId}:${lessonId}`;
    const checkpoints = this.checkpoints.get(key) || [];
    if (checkpoints.length > 0) {
      checkpoints[checkpoints.length - 1].completed = true;
    }

    // Update path progress
    system.currentPath.currentLesson++;
    this.updatePathProgress(system.currentPath);

    // Unlock next content if applicable
    this.unlockNextContent(system);

    // Update adaptive engine
    if (score !== undefined) {
      this.updateAdaptiveEngine(system.adaptiveEngine, score);
    }

    console.log(`✅ Lesson completed: ${lesson.title}`);
    console.log(`   Overall progress: ${system.currentPath.completionRate}%`);
  }

  /**
   * Get personalized recommendations
   */
  getRecommendations(system: ContentDeliverySystem): ContentRecommendation[] {
    console.log('🎯 Generating personalized recommendations...');

    const recommendations: ContentRecommendation[] = [];
    const engine = system.adaptiveEngine;

    // Recommend based on learning style
    const lessons = this.getAllLessons(system.currentPath);

    lessons.forEach(lesson => {
      if (lesson.status === 'available') {
        let confidence = 0.5;
        let reason = '';

        // Match learning style
        if (engine.learningStyle === 'visual' && lesson.type === 'video') {
          confidence += 0.3;
          reason = 'Matches your visual learning style';
        } else if (
          engine.learningStyle === 'reading' &&
          lesson.type === 'article'
        ) {
          confidence += 0.3;
          reason = 'Matches your reading preference';
        } else if (
          engine.learningStyle === 'kinesthetic' &&
          lesson.type === 'interactive'
        ) {
          confidence += 0.3;
          reason = 'Matches your hands-on learning style';
        }

        // Match difficulty
        const difficultyMatch = this.matchDifficulty(
          lesson.metadata.difficulty,
          engine.difficultyLevel
        );
        confidence += difficultyMatch * 0.2;

        if (confidence > 0.6) {
          recommendations.push({
            lessonId: lesson.id,
            reason,
            confidence,
            priority: confidence > 0.8 ? 'high' : 'medium',
          });
        }
      }
    });

    recommendations.sort((a, b) => b.confidence - a.confidence);

    console.log(`   Found ${recommendations.length} recommendations`);
    return recommendations.slice(0, 5);
  }

  /**
   * Adjust playback speed
   */
  adjustSpeed(system: ContentDeliverySystem, speed: number): void {
    if (speed < 0.5 || speed > 2.0) {
      throw new Error('Speed must be between 0.5 and 2.0');
    }

    system.deliverySettings.speed = speed;
    console.log(`⚡ Playback speed adjusted to ${speed}x`);
  }

  /**
   * Switch quality
   */
  switchQuality(
    system: ContentDeliverySystem,
    quality: DeliverySettings['quality']
  ): void {
    system.deliverySettings.quality = quality;
    console.log(`📺 Quality switched to ${quality}`);
  }

  /**
   * Get lesson analytics
   */
  getLessonAnalytics(lessonId: string): ContentAnalytics {
    let analytics = this.analytics.get(lessonId);

    if (!analytics) {
      analytics = {
        lessonId,
        views: 0,
        completions: 0,
        averageTimeSpent: 0,
        averageProgress: 0,
        dropoffPoints: [],
        engagementRate: 0,
        satisfactionScore: 0,
      };
      this.analytics.set(lessonId, analytics);
    }

    return analytics;
  }

  // Helper methods

  private generateLearningPath(
    studentId: string,
    courseId: string
  ): LearningPath {
    // Simplified - would normally generate based on student data
    return {
      id: this.generateId(),
      name: 'Personalized Learning Path',
      modules: [
        {
          id: 'module-1',
          title: 'Introduction to Web Development',
          lessons: this.generateSampleLessons('module-1'),
          prerequisites: [],
          locked: false,
          adaptiveContent: true,
        },
        {
          id: 'module-2',
          title: 'Advanced Concepts',
          lessons: this.generateSampleLessons('module-2'),
          prerequisites: ['module-1'],
          locked: true,
          adaptiveContent: true,
        },
      ],
      currentModule: 0,
      currentLesson: 0,
      completionRate: 0,
      estimatedTimeRemaining: 300,
    };
  }

  private generateSampleLessons(moduleId: string): Lesson[] {
    return [
      {
        id: `${moduleId}-lesson-1`,
        title: 'Introduction Video',
        type: 'video',
        content: {
          media: {
            type: 'video',
            sources: [
              {
                quality: '720p',
                url: 'https://cdn.example.com/video-720p.mp4',
                bitrate: 2500,
                codec: 'h264',
              },
              {
                quality: '1080p',
                url: 'https://cdn.example.com/video-1080p.mp4',
                bitrate: 5000,
                codec: 'h264',
              },
            ],
            duration: 600,
            streamingUrl: 'https://stream.example.com/video',
            captions: [
              {
                language: 'en',
                url: 'https://cdn.example.com/captions-en.vtt',
                label: 'English',
              },
            ],
          },
        },
        metadata: {
          difficulty: 'beginner',
          estimatedDuration: 10,
          learningObjectives: ['Understand basic concepts', 'Get overview'],
          keywords: ['introduction', 'overview'],
          prerequisites: [],
        },
        deliveryConfig: {
          adaptiveSpeed: true,
          skipAllowed: false,
          reviewRequired: false,
          minimumTimeRequired: 8,
        },
        status: 'available',
      },
      {
        id: `${moduleId}-lesson-2`,
        title: 'Interactive Exercise',
        type: 'interactive',
        content: {
          interactive: {
            type: 'code-editor',
            config: {
              language: 'javascript',
              theme: 'dark',
              readonly: false,
            },
            data: {
              starterCode: 'console.log("Hello, World!");',
              solution: 'console.log("Hello, World!");',
            },
          },
        },
        metadata: {
          difficulty: 'beginner',
          estimatedDuration: 15,
          learningObjectives: ['Practice coding', 'Apply concepts'],
          keywords: ['hands-on', 'practice'],
          prerequisites: [`${moduleId}-lesson-1`],
        },
        deliveryConfig: {
          adaptiveSpeed: false,
          skipAllowed: false,
          reviewRequired: true,
          requiredInteractions: ['compile', 'test', 'submit'],
        },
        status: 'locked',
      },
    ];
  }

  private adaptLessonDifficulty(
    lesson: Lesson,
    engine: AdaptiveEngine
  ): void {
    // Adjust content based on difficulty level
    if (engine.difficultyLevel < 4) {
      // Simplify for struggling students
      lesson.metadata.difficulty = 'beginner';
    } else if (engine.difficultyLevel > 7) {
      // Add challenge for advanced students
      lesson.metadata.difficulty = 'advanced';
    }
  }

  private async optimizeContent(
    content: LessonContent,
    settings: DeliverySettings
  ): Promise<LessonContent> {
    // Clone content
    const optimized = { ...content };

    // Optimize media if present
    if (optimized.media) {
      optimized.media = { ...optimized.media };

      // Select appropriate quality
      const quality = this.selectQuality(settings.quality, optimized.media);
      optimized.media.sources = optimized.media.sources.filter(
        s => s.quality === quality
      );
    }

    return optimized;
  }

  private selectQuality(
    preference: DeliverySettings['quality'],
    media: MediaContent
  ): MediaSource['quality'] {
    if (preference === 'auto') return '720p';
    if (preference === 'low') return '360p';
    if (preference === 'medium') return '720p';
    return '1080p';
  }

  private generateStreamingUrl(
    media: MediaContent,
    settings: DeliverySettings
  ): string {
    const quality = this.selectQuality(settings.quality, media);
    return `${media.streamingUrl}?quality=${quality}&speed=${settings.speed}`;
  }

  private trackDelivery(studentId: string, lessonId: string): void {
    const analytics = this.getLessonAnalytics(lessonId);
    analytics.views++;
  }

  private findLesson(path: LearningPath, lessonId: string): Lesson | null {
    for (const module of path.modules) {
      const lesson = module.lessons.find(l => l.id === lessonId);
      if (lesson) return lesson;
    }
    return null;
  }

  private getAllLessons(path: LearningPath): Lesson[] {
    return path.modules.flatMap(m => m.lessons);
  }

  private updatePathProgress(path: LearningPath): void {
    const allLessons = this.getAllLessons(path);
    const completedLessons = allLessons.filter(
      l => l.status === 'completed'
    ).length;

    path.completionRate = (completedLessons / allLessons.length) * 100;

    // Update time estimate
    const remainingLessons = allLessons.filter(
      l => l.status !== 'completed'
    );
    path.estimatedTimeRemaining = remainingLessons.reduce(
      (sum, l) => sum + l.metadata.estimatedDuration,
      0
    );
  }

  private unlockNextContent(system: ContentDeliverySystem): void {
    const path = system.currentPath;
    const currentModule = path.modules[path.currentModule];

    if (!currentModule) return;

    // Unlock next lesson in current module
    const nextLesson = currentModule.lessons[path.currentLesson];
    if (nextLesson && nextLesson.status === 'locked') {
      nextLesson.status = 'available';
      console.log(`🔓 Unlocked: ${nextLesson.title}`);
    }

    // Check if current module is completed
    const allCompleted = currentModule.lessons.every(
      l => l.status === 'completed'
    );

    if (allCompleted) {
      // Unlock next module
      const nextModule = path.modules[path.currentModule + 1];
      if (nextModule && nextModule.locked) {
        nextModule.locked = false;
        console.log(`🔓 Unlocked module: ${nextModule.title}`);
      }
    }
  }

  private updateAdaptiveEngine(engine: AdaptiveEngine, score: number): void {
    // Adjust difficulty based on performance
    if (score >= 90) {
      engine.difficultyLevel = Math.min(10, engine.difficultyLevel + 1);
    } else if (score < 70) {
      engine.difficultyLevel = Math.max(1, engine.difficultyLevel - 1);
    }
  }

  private matchDifficulty(
    lessonDifficulty: LessonMetadata['difficulty'],
    studentLevel: number
  ): number {
    const difficultyMap = {
      beginner: 3,
      intermediate: 6,
      advanced: 9,
    };

    const lessonLevel = difficultyMap[lessonDifficulty];
    const difference = Math.abs(lessonLevel - studentLevel);

    return Math.max(0, 1 - difference / 10);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Example Usage
async function demonstrateContentDelivery() {
  console.log('=== Content Delivery Example ===\n');

  const service = new ContentDeliveryService();

  // Initialize delivery system
  const system = service.initializeDelivery('student-001', 'course-webdev', {
    speed: 1.0,
    quality: 'auto',
    captionsEnabled: true,
    preferredLanguage: 'en',
    autoplay: false,
    notifications: true,
  });

  // Get next lesson
  console.log('\n📚 Getting next lesson...\n');
  const nextLesson = service.getNextLesson(system);

  if (nextLesson) {
    // Deliver lesson
    const delivered = await service.deliverLesson(system, nextLesson.id);

    console.log('\n📺 Lesson Content:');
    console.log(`   Title: ${delivered.lesson.title}`);
    console.log(`   Type: ${delivered.lesson.type}`);
    if (delivered.streamingUrl) {
      console.log(`   Streaming URL: ${delivered.streamingUrl}`);
    }

    // Simulate progress
    console.log('\n⏳ Simulating lesson progress...\n');
    service.saveCheckpoint(system.studentId, nextLesson.id, 25, 5);
    service.saveCheckpoint(system.studentId, nextLesson.id, 50, 12);
    service.saveCheckpoint(system.studentId, nextLesson.id, 75, 18);

    // Complete lesson
    service.completeLesson(system, nextLesson.id, 95);

    // Get next lesson
    const secondLesson = service.getNextLesson(system);
    if (secondLesson) {
      console.log(`\n📚 Next up: ${secondLesson.title}`);
    }
  }

  // Get recommendations
  console.log('\n🎯 Getting personalized recommendations...\n');
  const recommendations = service.getRecommendations(system);
  recommendations.forEach((rec, index) => {
    console.log(
      `   ${index + 1}. Lesson ${rec.lessonId} (${rec.priority} priority)`
    );
    console.log(`      Reason: ${rec.reason}`);
    console.log(`      Confidence: ${(rec.confidence * 100).toFixed(0)}%`);
  });

  // Adjust settings
  console.log('\n⚙️ Adjusting delivery settings...\n');
  service.adjustSpeed(system, 1.5);
  service.switchQuality(system, 'high');

  console.log('\n✅ Content delivery demonstration complete!');
}

// Run the example
demonstrateContentDelivery().catch(console.error);
