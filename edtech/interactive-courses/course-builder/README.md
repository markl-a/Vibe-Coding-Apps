# Course Builder

An interactive course builder with quizzes, progress tracking, and gamification features for online learning.

## Features

- **Modular Course Structure**: Organize content into modules and lessons
- **Rich Content Types**: Text (Markdown), code blocks, quizzes
- **Interactive Quizzes**: Multiple choice, true/false, fill-in-the-blank
- **Progress Tracking**: Persistent progress with local storage
- **Gamification**: Points, badges, and achievements
- **Responsive Design**: Works on desktop and mobile

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173 in your browser.

## Course Structure

```typescript
interface Course {
  id: string;
  title: string;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content: ContentBlock[];
}
```

## Content Types

### Text Content

```typescript
{
  type: 'text',
  data: {
    text: '# Heading\n\nParagraph with **bold** and `code`',
    format: 'markdown'
  }
}
```

### Code Content

```typescript
{
  type: 'code',
  data: {
    code: 'console.log("Hello!");',
    language: 'javascript',
    executable: true
  }
}
```

### Quiz Content

```typescript
{
  type: 'quiz',
  data: {
    title: 'Check Your Knowledge',
    passingScore: 70,
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'What is 2 + 2?',
        options: [
          { id: 'a', text: '3', isCorrect: false },
          { id: 'b', text: '4', isCorrect: true },
          { id: 'c', text: '5', isCorrect: false }
        ],
        points: 10
      }
    ]
  }
}
```

## Question Types

| Type | Description |
|------|-------------|
| `multiple_choice` | Select one option from many |
| `true_false` | True or false question |
| `fill_blank` | Type the correct answer |
| `code` | Write code (coming soon) |

## Gamification

### Points

- Complete a lesson: +10 points
- Quiz score: Up to +20 points based on score

### Badges

| Badge | Criteria |
|-------|----------|
| First Steps | Complete first lesson |
| Getting Started | Complete 5 lessons |
| Perfect Score | Get 100% on a quiz |
| Consistent Learner | 3-day streak |
| Course Master | Complete entire course |
| Point Collector | Earn 100 points |

## State Management

Uses Zustand with persistence:

```typescript
import { useCourseStore } from './store';

// Get progress
const progress = useCourseStore((state) => state.getCourseProgress(courseId));

// Complete lesson
useCourseStore.getState().completeLesson(lessonId);

// Submit quiz
useCourseStore.getState().submitQuiz(quizId, answers, score, maxScore);
```

## Creating a Course

```typescript
const myCourse: Course = {
  id: 'my_course',
  title: 'My Course',
  modules: [
    {
      id: 'mod_1',
      title: 'Introduction',
      lessons: [
        {
          id: 'lesson_1',
          title: 'Getting Started',
          content: [
            {
              id: 'text_1',
              type: 'text',
              data: { text: '# Welcome!\n\nLet\'s begin...' }
            },
            {
              id: 'quiz_1',
              type: 'quiz',
              data: {
                title: 'Quick Check',
                passingScore: 70,
                questions: [/* ... */]
              }
            }
          ]
        }
      ]
    }
  ]
};
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App                                 │
│                                                             │
│  ┌────────────────┐              ┌──────────────────┐     │
│  │    Sidebar     │              │   Main Content    │     │
│  │                │              │                   │     │
│  │  - Progress    │              │  - Lesson View    │     │
│  │  - Navigation  │              │  - Content        │     │
│  │  - Badges      │              │  - Quizzes        │     │
│  └────────────────┘              └──────────────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                  Zustand Store                       │  │
│  │  - Course data   - Progress   - Points   - Badges   │  │
│  └─────────────────────────────────────────────────────┘  │
│                           │                                │
│                           ▼                                │
│                   ┌───────────────┐                       │
│                   │ Local Storage │                       │
│                   │  (Persist)    │                       │
│                   └───────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## Extending

### Add New Content Type

1. Add type to `types.ts`
2. Create renderer in `App.tsx`
3. Style in `styles.css`

### Add New Badge

```typescript
// In store.ts
export const BADGES: Badge[] = [
  // ...existing badges
  {
    id: 'new_badge',
    name: 'New Badge',
    description: 'Achievement description',
    icon: '🎯',
    criteria: { type: 'custom', count: 10 }
  }
];
```

## Resources

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Instructional Design](https://www.instructionaldesign.org/)
- [Gamification in Education](https://www.edutopia.org/article/gamification-education)

## License

MIT
