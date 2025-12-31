import type { Course } from './types';

/**
 * Sample Course Data
 */

export const sampleCourse: Course = {
  id: 'course_intro_programming',
  title: 'Introduction to Programming',
  description: 'Learn the fundamentals of programming with JavaScript. Perfect for beginners!',
  thumbnail: 'https://via.placeholder.com/300x200',
  author: 'Course Builder Team',
  difficulty: 'beginner',
  tags: ['programming', 'javascript', 'beginner'],
  estimatedHours: 10,
  createdAt: new Date(),
  updatedAt: new Date(),
  modules: [
    {
      id: 'mod_1',
      title: 'Getting Started',
      description: 'Set up your environment and write your first code',
      order: 1,
      lessons: [
        {
          id: 'lesson_1_1',
          title: 'What is Programming?',
          description: 'Understanding the basics of programming',
          order: 1,
          duration: 15,
          content: [
            {
              id: 'content_1',
              type: 'text',
              data: {
                text: `# What is Programming?

Programming is the process of creating instructions that a computer can follow to perform specific tasks. These instructions are written in a **programming language** that both humans can read and computers can understand.

## Why Learn Programming?

- **Problem Solving**: Programming teaches you to break down complex problems
- **Creativity**: Build apps, games, websites, and more
- **Career Opportunities**: High demand for developers worldwide
- **Automation**: Automate repetitive tasks

## Your Journey Starts Here

In this course, we'll learn JavaScript, one of the most popular programming languages. It runs in web browsers and can be used to build:

- Interactive websites
- Mobile applications
- Server-side applications
- Games and more!`,
                format: 'markdown',
              },
            },
            {
              id: 'quiz_1',
              type: 'quiz',
              data: {
                title: 'Check Your Understanding',
                passingScore: 70,
                questions: [
                  {
                    id: 'q1',
                    type: 'multiple_choice',
                    question: 'What is programming?',
                    options: [
                      { id: 'a', text: 'A type of computer hardware', isCorrect: false },
                      { id: 'b', text: 'Creating instructions for computers', isCorrect: true },
                      { id: 'c', text: 'A video game genre', isCorrect: false },
                      { id: 'd', text: 'A social media platform', isCorrect: false },
                    ],
                    explanation: 'Programming is the process of creating instructions (code) that computers can execute.',
                    points: 10,
                  },
                  {
                    id: 'q2',
                    type: 'true_false',
                    question: 'JavaScript can only be used for websites.',
                    options: [
                      { id: 'true', text: 'True', isCorrect: false },
                      { id: 'false', text: 'False', isCorrect: true },
                    ],
                    explanation: 'JavaScript is versatile and can be used for websites, mobile apps, servers, and more!',
                    points: 10,
                  },
                ],
              },
            },
          ],
        },
        {
          id: 'lesson_1_2',
          title: 'Your First Program',
          description: 'Write and run your first JavaScript code',
          order: 2,
          duration: 20,
          content: [
            {
              id: 'content_2',
              type: 'text',
              data: {
                text: `# Your First Program

Let's write your first JavaScript program! The traditional first program outputs "Hello, World!" to the screen.

## The console.log() Function

In JavaScript, we use \`console.log()\` to display messages:`,
                format: 'markdown',
              },
            },
            {
              id: 'code_1',
              type: 'code',
              data: {
                code: `// This is a comment - computers ignore these
// They help humans understand the code

// Display "Hello, World!" in the console
console.log("Hello, World!");

// You can display numbers too
console.log(42);

// And do math!
console.log(10 + 5);`,
                language: 'javascript',
                executable: true,
              },
            },
            {
              id: 'quiz_2',
              type: 'quiz',
              data: {
                title: 'Practice Quiz',
                passingScore: 70,
                questions: [
                  {
                    id: 'q1',
                    type: 'multiple_choice',
                    question: 'Which function displays output in JavaScript?',
                    options: [
                      { id: 'a', text: 'print()', isCorrect: false },
                      { id: 'b', text: 'console.log()', isCorrect: true },
                      { id: 'c', text: 'display()', isCorrect: false },
                      { id: 'd', text: 'show()', isCorrect: false },
                    ],
                    explanation: 'console.log() is used to output messages to the browser console.',
                    points: 10,
                  },
                  {
                    id: 'q2',
                    type: 'fill_blank',
                    question: 'What will console.log(5 + 3) display?',
                    correctAnswer: '8',
                    explanation: '5 + 3 equals 8, and console.log() will display this result.',
                    points: 10,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      id: 'mod_2',
      title: 'Variables and Data Types',
      description: 'Learn how to store and work with data',
      order: 2,
      lessons: [
        {
          id: 'lesson_2_1',
          title: 'Understanding Variables',
          description: 'Store and retrieve data with variables',
          order: 1,
          duration: 25,
          content: [
            {
              id: 'content_3',
              type: 'text',
              data: {
                text: `# Variables

Variables are containers that store data values. Think of them as labeled boxes where you can put things.

## Declaring Variables

In JavaScript, we use \`let\` or \`const\` to create variables:

- **let**: For values that might change
- **const**: For values that stay the same`,
                format: 'markdown',
              },
            },
            {
              id: 'code_2',
              type: 'code',
              data: {
                code: `// Using let for changeable values
let score = 0;
console.log("Initial score:", score);

score = 100;  // Change the value
console.log("New score:", score);

// Using const for constants
const playerName = "Alex";
console.log("Player:", playerName);

// This would cause an error:
// playerName = "Sam";  // Can't reassign const!`,
                language: 'javascript',
                executable: true,
              },
            },
            {
              id: 'quiz_3',
              type: 'quiz',
              data: {
                title: 'Variables Quiz',
                passingScore: 70,
                questions: [
                  {
                    id: 'q1',
                    type: 'multiple_choice',
                    question: 'Which keyword creates a variable that cannot be reassigned?',
                    options: [
                      { id: 'a', text: 'let', isCorrect: false },
                      { id: 'b', text: 'var', isCorrect: false },
                      { id: 'c', text: 'const', isCorrect: true },
                      { id: 'd', text: 'variable', isCorrect: false },
                    ],
                    explanation: 'const creates a constant that cannot be reassigned after declaration.',
                    points: 10,
                  },
                  {
                    id: 'q2',
                    type: 'true_false',
                    question: 'You can change the value of a variable declared with let.',
                    options: [
                      { id: 'true', text: 'True', isCorrect: true },
                      { id: 'false', text: 'False', isCorrect: false },
                    ],
                    explanation: 'Variables declared with let can be reassigned to new values.',
                    points: 10,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};
