import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Course, CourseProgress, LessonProgress, QuizScore, Badge } from './types';

/**
 * Course Store
 *
 * Manages course data and user progress with persistence.
 */

interface CourseState {
  // Current user
  userId: string;
  userName: string;

  // Courses
  courses: Course[];
  currentCourseId: string | null;
  currentLessonId: string | null;

  // Progress
  progress: Record<string, CourseProgress>;

  // Gamification
  totalPoints: number;
  earnedBadges: string[];
  streakDays: number;

  // Actions
  setCourse: (courseId: string) => void;
  setLesson: (lessonId: string) => void;
  completeLesson: (lessonId: string) => void;
  submitQuiz: (quizId: string, answers: Record<string, string>, score: number, maxScore: number) => void;
  addPoints: (points: number) => void;
  awardBadge: (badgeId: string) => void;
  updateTimeSpent: (lessonId: string, seconds: number) => void;
  getCourseProgress: (courseId: string) => CourseProgress | undefined;
  getLessonProgress: (courseId: string, lessonId: string) => LessonProgress | undefined;
}

// Default badges
export const BADGES: Badge[] = [
  {
    id: 'first_lesson',
    name: 'First Steps',
    description: 'Complete your first lesson',
    icon: '🎯',
    criteria: { type: 'lessons_completed', count: 1 },
  },
  {
    id: 'five_lessons',
    name: 'Getting Started',
    description: 'Complete 5 lessons',
    icon: '📚',
    criteria: { type: 'lessons_completed', count: 5 },
  },
  {
    id: 'perfect_score',
    name: 'Perfect Score',
    description: 'Get 100% on a quiz',
    icon: '💯',
    criteria: { type: 'perfect_quiz', count: 1 },
  },
  {
    id: 'three_day_streak',
    name: 'Consistent Learner',
    description: 'Learn for 3 days in a row',
    icon: '🔥',
    criteria: { type: 'streak_days', count: 3 },
  },
  {
    id: 'course_complete',
    name: 'Course Master',
    description: 'Complete an entire course',
    icon: '🏆',
    criteria: { type: 'course_completed' },
  },
  {
    id: 'hundred_points',
    name: 'Point Collector',
    description: 'Earn 100 points',
    icon: '⭐',
    criteria: { type: 'points_earned', count: 100 },
  },
];

export const useCourseStore = create<CourseState>()(
  persist(
    (set, get) => ({
      userId: 'user_1',
      userName: 'Learner',
      courses: [],
      currentCourseId: null,
      currentLessonId: null,
      progress: {},
      totalPoints: 0,
      earnedBadges: [],
      streakDays: 0,

      setCourse: (courseId) => {
        set({ currentCourseId: courseId });

        // Initialize progress if not exists
        const progress = get().progress;
        if (!progress[courseId]) {
          set({
            progress: {
              ...progress,
              [courseId]: {
                courseId,
                startedAt: new Date(),
                lastAccessedAt: new Date(),
                completedLessons: {},
                overallProgress: 0,
                totalTimeSpent: 0,
                earnedPoints: 0,
                badges: [],
              },
            },
          });
        } else {
          // Update last accessed
          set({
            progress: {
              ...progress,
              [courseId]: {
                ...progress[courseId],
                lastAccessedAt: new Date(),
              },
            },
          });
        }
      },

      setLesson: (lessonId) => {
        set({ currentLessonId: lessonId });
      },

      completeLesson: (lessonId) => {
        const { currentCourseId, progress, courses, totalPoints, earnedBadges } = get();
        if (!currentCourseId) return;

        const courseProgress = progress[currentCourseId];
        if (!courseProgress) return;

        const lessonProgress: LessonProgress = courseProgress.completedLessons[lessonId] || {
          lessonId,
          completed: false,
          timeSpent: 0,
          quizScores: {},
        };

        if (!lessonProgress.completed) {
          lessonProgress.completed = true;
          lessonProgress.completedAt = new Date();

          // Calculate points (10 points per lesson)
          const pointsEarned = 10;

          // Calculate overall progress
          const course = courses.find((c) => c.id === currentCourseId);
          let totalLessons = 0;
          if (course) {
            course.modules.forEach((m) => {
              totalLessons += m.lessons.length;
            });
          }

          const completedCount = Object.values(courseProgress.completedLessons).filter(
            (l) => l.completed
          ).length + 1;

          const overallProgress = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

          set({
            progress: {
              ...progress,
              [currentCourseId]: {
                ...courseProgress,
                completedLessons: {
                  ...courseProgress.completedLessons,
                  [lessonId]: lessonProgress,
                },
                overallProgress,
                earnedPoints: courseProgress.earnedPoints + pointsEarned,
              },
            },
            totalPoints: totalPoints + pointsEarned,
          });

          // Check for badges
          const newBadges = [...earnedBadges];

          // First lesson badge
          if (completedCount === 1 && !earnedBadges.includes('first_lesson')) {
            newBadges.push('first_lesson');
          }

          // Five lessons badge
          if (completedCount >= 5 && !earnedBadges.includes('five_lessons')) {
            newBadges.push('five_lessons');
          }

          // Course complete badge
          if (overallProgress === 100 && !earnedBadges.includes('course_complete')) {
            newBadges.push('course_complete');
          }

          if (newBadges.length > earnedBadges.length) {
            set({ earnedBadges: newBadges });
          }
        }
      },

      submitQuiz: (quizId, answers, score, maxScore) => {
        const { currentCourseId, currentLessonId, progress, totalPoints, earnedBadges } = get();
        if (!currentCourseId || !currentLessonId) return;

        const courseProgress = progress[currentCourseId];
        if (!courseProgress) return;

        const lessonProgress = courseProgress.completedLessons[currentLessonId] || {
          lessonId: currentLessonId,
          completed: false,
          timeSpent: 0,
          quizScores: {},
        };

        const quizScore: QuizScore = {
          quizId,
          score,
          maxScore,
          passed: score >= maxScore * 0.7,
          attempts: (lessonProgress.quizScores[quizId]?.attempts || 0) + 1,
          answers,
          completedAt: new Date(),
        };

        // Points based on score
        const pointsEarned = Math.round((score / maxScore) * 20);

        set({
          progress: {
            ...progress,
            [currentCourseId]: {
              ...courseProgress,
              completedLessons: {
                ...courseProgress.completedLessons,
                [currentLessonId]: {
                  ...lessonProgress,
                  quizScores: {
                    ...lessonProgress.quizScores,
                    [quizId]: quizScore,
                  },
                },
              },
              earnedPoints: courseProgress.earnedPoints + pointsEarned,
            },
          },
          totalPoints: totalPoints + pointsEarned,
        });

        // Perfect score badge
        if (score === maxScore && !earnedBadges.includes('perfect_score')) {
          set({ earnedBadges: [...earnedBadges, 'perfect_score'] });
        }

        // 100 points badge
        if (totalPoints + pointsEarned >= 100 && !earnedBadges.includes('hundred_points')) {
          set({ earnedBadges: [...earnedBadges, 'hundred_points'] });
        }
      },

      addPoints: (points) => {
        set((state) => ({ totalPoints: state.totalPoints + points }));
      },

      awardBadge: (badgeId) => {
        const { earnedBadges } = get();
        if (!earnedBadges.includes(badgeId)) {
          set({ earnedBadges: [...earnedBadges, badgeId] });
        }
      },

      updateTimeSpent: (lessonId, seconds) => {
        const { currentCourseId, progress } = get();
        if (!currentCourseId) return;

        const courseProgress = progress[currentCourseId];
        if (!courseProgress) return;

        const lessonProgress = courseProgress.completedLessons[lessonId] || {
          lessonId,
          completed: false,
          timeSpent: 0,
          quizScores: {},
        };

        set({
          progress: {
            ...progress,
            [currentCourseId]: {
              ...courseProgress,
              completedLessons: {
                ...courseProgress.completedLessons,
                [lessonId]: {
                  ...lessonProgress,
                  timeSpent: lessonProgress.timeSpent + seconds,
                },
              },
              totalTimeSpent: courseProgress.totalTimeSpent + seconds,
            },
          },
        });
      },

      getCourseProgress: (courseId) => {
        return get().progress[courseId];
      },

      getLessonProgress: (courseId, lessonId) => {
        const courseProgress = get().progress[courseId];
        return courseProgress?.completedLessons[lessonId];
      },
    }),
    {
      name: 'course-storage',
    }
  )
);
