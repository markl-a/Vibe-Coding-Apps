/**
 * EdTech Course Builder Types
 */

// Content types
export type ContentType = 'text' | 'video' | 'image' | 'code' | 'quiz';

// Base content block
export interface ContentBlock {
  id: string;
  type: ContentType;
  data: unknown;
}

// Text content
export interface TextContent extends ContentBlock {
  type: 'text';
  data: {
    text: string;
    format?: 'markdown' | 'html' | 'plain';
  };
}

// Video content
export interface VideoContent extends ContentBlock {
  type: 'video';
  data: {
    url: string;
    title: string;
    duration?: number;
    thumbnail?: string;
  };
}

// Code content
export interface CodeContent extends ContentBlock {
  type: 'code';
  data: {
    code: string;
    language: string;
    executable?: boolean;
  };
}

// Quiz types
export type QuizQuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'code';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  options?: QuizOption[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
}

export interface QuizContent extends ContentBlock {
  type: 'quiz';
  data: {
    title: string;
    questions: QuizQuestion[];
    passingScore: number;
    timeLimit?: number; // seconds
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
  };
}

// Lesson structure
export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: ContentBlock[];
  duration?: number; // minutes
  order: number;
}

// Module structure
export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
}

// Course structure
export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  modules: Module[];
  author: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  estimatedHours: number;
  createdAt: Date;
  updatedAt: Date;
}

// Progress tracking
export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: Date;
  timeSpent: number; // seconds
  quizScores: Record<string, QuizScore>;
}

export interface QuizScore {
  quizId: string;
  score: number;
  maxScore: number;
  passed: boolean;
  attempts: number;
  answers: Record<string, string>;
  completedAt: Date;
}

export interface CourseProgress {
  courseId: string;
  startedAt: Date;
  lastAccessedAt: Date;
  completedLessons: Record<string, LessonProgress>;
  overallProgress: number; // 0-100
  totalTimeSpent: number; // seconds
  earnedPoints: number;
  badges: string[];
}

// Gamification
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: BadgeCriteria;
}

export type BadgeCriteria =
  | { type: 'lessons_completed'; count: number }
  | { type: 'perfect_quiz'; count: number }
  | { type: 'streak_days'; count: number }
  | { type: 'course_completed' }
  | { type: 'points_earned'; count: number };

// User state
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  enrolledCourses: string[];
  progress: Record<string, CourseProgress>;
  badges: string[];
  totalPoints: number;
  streakDays: number;
  lastActiveDate: Date;
}
