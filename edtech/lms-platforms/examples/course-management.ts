/**
 * Course Management Example for LMS Platforms
 *
 * Demonstrates creating, updating, and managing courses in an LMS.
 * Includes course lifecycle management, content organization, and publishing workflows.
 */

// Types
interface Course {
  id: string;
  title: string;
  description: string;
  instructor: Instructor;
  modules: Module[];
  settings: CourseSettings;
  metadata: CourseMetadata;
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

interface Instructor {
  id: string;
  name: string;
  email: string;
  bio: string;
  credentials: string[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  prerequisites?: string[];
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'assignment' | 'quiz' | 'discussion';
  content: LessonContent;
  duration: number; // minutes
  order: number;
  isRequired: boolean;
}

interface LessonContent {
  url?: string;
  text?: string;
  attachments?: Attachment[];
  instructions?: string;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

interface CourseSettings {
  enrollmentType: 'open' | 'invite-only' | 'approval-required';
  capacity?: number;
  startDate?: Date;
  endDate?: Date;
  selfPaced: boolean;
  certificateEnabled: boolean;
  forumEnabled: boolean;
  gradingScheme: GradingScheme;
}

interface GradingScheme {
  passingGrade: number;
  gradeScale: {
    A: { min: number; max: number };
    B: { min: number; max: number };
    C: { min: number; max: number };
    D: { min: number; max: number };
    F: { min: number; max: number };
  };
  weightedCategories: {
    assignments: number;
    quizzes: number;
    exams: number;
    participation: number;
  };
}

interface CourseMetadata {
  category: string;
  tags: string[];
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  thumbnail?: string;
}

// Course Management Service
class CourseManagementService {
  private courses: Map<string, Course> = new Map();

  /**
   * Create a new course
   */
  createCourse(data: {
    title: string;
    description: string;
    instructor: Instructor;
    settings: CourseSettings;
    metadata: CourseMetadata;
  }): Course {
    const course: Course = {
      id: this.generateId(),
      title: data.title,
      description: data.description,
      instructor: data.instructor,
      modules: [],
      settings: data.settings,
      metadata: data.metadata,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.courses.set(course.id, course);
    console.log(`✅ Course created: ${course.title} (ID: ${course.id})`);
    return course;
  }

  /**
   * Add a module to a course
   */
  addModule(courseId: string, moduleData: Omit<Module, 'id'>): Module {
    const course = this.getCourse(courseId);

    const module: Module = {
      id: this.generateId(),
      ...moduleData,
      lessons: [],
    };

    course.modules.push(module);
    course.modules.sort((a, b) => a.order - b.order);
    course.updatedAt = new Date();

    console.log(`✅ Module added to course: ${module.title}`);
    return module;
  }

  /**
   * Add a lesson to a module
   */
  addLesson(
    courseId: string,
    moduleId: string,
    lessonData: Omit<Lesson, 'id'>
  ): Lesson {
    const course = this.getCourse(courseId);
    const module = course.modules.find(m => m.id === moduleId);

    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    const lesson: Lesson = {
      id: this.generateId(),
      ...lessonData,
    };

    module.lessons.push(lesson);
    module.lessons.sort((a, b) => a.order - b.order);
    course.updatedAt = new Date();

    console.log(`✅ Lesson added to module: ${lesson.title}`);
    return lesson;
  }

  /**
   * Update course content
   */
  updateCourse(
    courseId: string,
    updates: Partial<Omit<Course, 'id' | 'createdAt'>>
  ): Course {
    const course = this.getCourse(courseId);

    Object.assign(course, updates, { updatedAt: new Date() });

    console.log(`✅ Course updated: ${course.title}`);
    return course;
  }

  /**
   * Publish a course
   */
  publishCourse(courseId: string): Course {
    const course = this.getCourse(courseId);

    // Validation
    if (course.modules.length === 0) {
      throw new Error('Cannot publish course without modules');
    }

    const hasLessons = course.modules.some(m => m.lessons.length > 0);
    if (!hasLessons) {
      throw new Error('Cannot publish course without lessons');
    }

    course.status = 'published';
    course.updatedAt = new Date();

    console.log(`✅ Course published: ${course.title}`);
    return course;
  }

  /**
   * Archive a course
   */
  archiveCourse(courseId: string): Course {
    const course = this.getCourse(courseId);
    course.status = 'archived';
    course.updatedAt = new Date();

    console.log(`✅ Course archived: ${course.title}`);
    return course;
  }

  /**
   * Clone a course
   */
  cloneCourse(courseId: string, newTitle: string): Course {
    const original = this.getCourse(courseId);

    const cloned: Course = {
      ...JSON.parse(JSON.stringify(original)),
      id: this.generateId(),
      title: newTitle,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Generate new IDs for modules and lessons
    cloned.modules = cloned.modules.map(module => ({
      ...module,
      id: this.generateId(),
      lessons: module.lessons.map(lesson => ({
        ...lesson,
        id: this.generateId(),
      })),
    }));

    this.courses.set(cloned.id, cloned);
    console.log(`✅ Course cloned: ${cloned.title}`);
    return cloned;
  }

  /**
   * Get course statistics
   */
  getCourseStats(courseId: string) {
    const course = this.getCourse(courseId);

    const totalLessons = course.modules.reduce(
      (sum, module) => sum + module.lessons.length,
      0
    );

    const totalDuration = course.modules.reduce(
      (sum, module) =>
        sum + module.lessons.reduce((s, lesson) => s + lesson.duration, 0),
      0
    );

    const lessonTypes = course.modules
      .flatMap(m => m.lessons)
      .reduce((acc, lesson) => {
        acc[lesson.type] = (acc[lesson.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      moduleCount: course.modules.length,
      lessonCount: totalLessons,
      totalDuration,
      averageLessonDuration: totalDuration / totalLessons || 0,
      lessonsByType: lessonTypes,
    };
  }

  /**
   * Reorder modules
   */
  reorderModules(courseId: string, moduleOrder: string[]): Course {
    const course = this.getCourse(courseId);

    moduleOrder.forEach((moduleId, index) => {
      const module = course.modules.find(m => m.id === moduleId);
      if (module) {
        module.order = index;
      }
    });

    course.modules.sort((a, b) => a.order - b.order);
    course.updatedAt = new Date();

    console.log(`✅ Modules reordered for course: ${course.title}`);
    return course;
  }

  /**
   * Get course
   */
  getCourse(courseId: string): Course {
    const course = this.courses.get(courseId);
    if (!course) {
      throw new Error(`Course ${courseId} not found`);
    }
    return course;
  }

  /**
   * List all courses
   */
  listCourses(filters?: {
    status?: Course['status'];
    category?: string;
    instructorId?: string;
  }): Course[] {
    let courses = Array.from(this.courses.values());

    if (filters?.status) {
      courses = courses.filter(c => c.status === filters.status);
    }

    if (filters?.category) {
      courses = courses.filter(c => c.metadata.category === filters.category);
    }

    if (filters?.instructorId) {
      courses = courses.filter(c => c.instructor.id === filters.instructorId);
    }

    return courses;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Example Usage
async function demonstrateCourseManagement() {
  console.log('=== Course Management Example ===\n');

  const service = new CourseManagementService();

  // Create instructor
  const instructor: Instructor = {
    id: 'inst-001',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@university.edu',
    bio: 'Computer Science Professor with 15 years of teaching experience',
    credentials: ['PhD in Computer Science', 'AWS Certified Solutions Architect'],
  };

  // Create a new course
  const course = service.createCourse({
    title: 'Introduction to Web Development',
    description: 'Learn the fundamentals of modern web development',
    instructor,
    settings: {
      enrollmentType: 'open',
      capacity: 100,
      selfPaced: true,
      certificateEnabled: true,
      forumEnabled: true,
      gradingScheme: {
        passingGrade: 70,
        gradeScale: {
          A: { min: 90, max: 100 },
          B: { min: 80, max: 89 },
          C: { min: 70, max: 79 },
          D: { min: 60, max: 69 },
          F: { min: 0, max: 59 },
        },
        weightedCategories: {
          assignments: 40,
          quizzes: 30,
          exams: 20,
          participation: 10,
        },
      },
    },
    metadata: {
      category: 'Web Development',
      tags: ['HTML', 'CSS', 'JavaScript', 'React'],
      language: 'English',
      difficulty: 'beginner',
      estimatedHours: 40,
    },
  });

  // Add modules
  const module1 = service.addModule(course.id, {
    title: 'HTML Fundamentals',
    description: 'Learn the building blocks of web pages',
    order: 1,
    lessons: [],
  });

  const module2 = service.addModule(course.id, {
    title: 'CSS Styling',
    description: 'Master styling and layout techniques',
    order: 2,
    lessons: [],
    prerequisites: [module1.id],
  });

  // Add lessons to module 1
  service.addLesson(course.id, module1.id, {
    title: 'Introduction to HTML',
    type: 'video',
    content: {
      url: 'https://videos.example.com/html-intro.mp4',
      text: 'Learn about HTML tags, elements, and document structure',
    },
    duration: 15,
    order: 1,
    isRequired: true,
  });

  service.addLesson(course.id, module1.id, {
    title: 'HTML Elements Deep Dive',
    type: 'reading',
    content: {
      text: 'Comprehensive guide to HTML elements...',
      attachments: [
        {
          id: 'att-001',
          name: 'HTML5-Cheatsheet.pdf',
          type: 'application/pdf',
          url: 'https://files.example.com/html5-cheatsheet.pdf',
          size: 2048000,
        },
      ],
    },
    duration: 30,
    order: 2,
    isRequired: true,
  });

  service.addLesson(course.id, module1.id, {
    title: 'HTML Practice Quiz',
    type: 'quiz',
    content: {
      instructions: 'Test your HTML knowledge',
    },
    duration: 20,
    order: 3,
    isRequired: true,
  });

  // Add lessons to module 2
  service.addLesson(course.id, module2.id, {
    title: 'CSS Basics',
    type: 'video',
    content: {
      url: 'https://videos.example.com/css-basics.mp4',
    },
    duration: 25,
    order: 1,
    isRequired: true,
  });

  service.addLesson(course.id, module2.id, {
    title: 'Build a Simple Layout',
    type: 'assignment',
    content: {
      instructions: 'Create a responsive layout using CSS Grid',
      attachments: [
        {
          id: 'att-002',
          name: 'starter-template.zip',
          type: 'application/zip',
          url: 'https://files.example.com/starter-template.zip',
          size: 1024000,
        },
      ],
    },
    duration: 60,
    order: 2,
    isRequired: true,
  });

  // Get course statistics
  const stats = service.getCourseStats(course.id);
  console.log('\n📊 Course Statistics:');
  console.log(`   Modules: ${stats.moduleCount}`);
  console.log(`   Lessons: ${stats.lessonCount}`);
  console.log(`   Total Duration: ${stats.totalDuration} minutes`);
  console.log(`   Lessons by Type:`, stats.lessonsByType);

  // Update course settings
  service.updateCourse(course.id, {
    settings: {
      ...course.settings,
      capacity: 150,
    },
  });

  // Publish the course
  service.publishCourse(course.id);

  // Clone the course for advanced version
  const advancedCourse = service.cloneCourse(
    course.id,
    'Advanced Web Development'
  );

  service.updateCourse(advancedCourse.id, {
    metadata: {
      ...advancedCourse.metadata,
      difficulty: 'advanced',
      estimatedHours: 80,
    },
  });

  // List courses
  console.log('\n📚 Published Courses:');
  const publishedCourses = service.listCourses({ status: 'published' });
  publishedCourses.forEach(c => {
    console.log(`   - ${c.title} (${c.metadata.difficulty})`);
  });

  console.log('\n✅ Course management demonstration complete!');
}

// Run the example
demonstrateCourseManagement().catch(console.error);
