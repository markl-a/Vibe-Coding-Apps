/**
 * Quiz Creation Example for Assessment Tools
 *
 * Demonstrates creating quizzes, question banks, randomization,
 * and various question types for educational assessments.
 */

// Types
interface Quiz {
  id: string;
  title: string;
  description: string;
  instructions: string;
  questions: Question[];
  settings: QuizSettings;
  metadata: QuizMetadata;
  createdAt: Date;
  updatedAt: Date;
}

interface QuizSettings {
  timeLimit?: number; // minutes
  attemptsAllowed: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswers: 'immediately' | 'after-submit' | 'after-deadline' | 'never';
  allowReview: boolean;
  passingScore: number; // percentage
  randomizeFromBank: boolean;
  questionsToShow?: number;
}

interface QuizMetadata {
  category: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedDuration: number; // minutes
  totalPoints: number;
}

type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | ShortAnswerQuestion
  | EssayQuestion
  | MatchingQuestion
  | FillInBlankQuestion
  | CodeQuestion;

interface BaseQuestion {
  id: string;
  type: string;
  question: string;
  points: number;
  explanation?: string;
  hints?: string[];
  media?: MediaAttachment;
  tags?: string[];
}

interface MediaAttachment {
  type: 'image' | 'video' | 'audio';
  url: string;
  altText?: string;
}

interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: QuizOption[];
  allowMultiple: boolean;
  correctAnswers: string[];
  partialCredit: boolean;
}

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
}

interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false';
  correctAnswer: boolean;
}

interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short-answer';
  correctAnswers: string[];
  caseSensitive: boolean;
  acceptableVariations?: string[];
}

interface EssayQuestion extends BaseQuestion {
  type: 'essay';
  minWords?: number;
  maxWords?: number;
  rubric?: RubricCriteria[];
}

interface RubricCriteria {
  name: string;
  description: string;
  maxPoints: number;
}

interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  pairs: MatchingPair[];
  options: string[];
}

interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

interface FillInBlankQuestion extends BaseQuestion {
  type: 'fill-in-blank';
  template: string; // "The capital of France is _____"
  blanks: BlankAnswer[];
}

interface BlankAnswer {
  position: number;
  correctAnswers: string[];
  caseSensitive: boolean;
}

interface CodeQuestion extends BaseQuestion {
  type: 'code';
  language: string;
  starterCode?: string;
  testCases: TestCase[];
  allowedAttempts: number;
}

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  points: number;
}

interface QuestionBank {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  category: string;
  tags: string[];
}

// Quiz Creation Service
class QuizCreationService {
  private quizzes: Map<string, Quiz> = new Map();
  private questionBanks: Map<string, QuestionBank> = new Map();

  /**
   * Create a new quiz
   */
  createQuiz(data: {
    title: string;
    description: string;
    instructions: string;
    settings: QuizSettings;
    metadata: Omit<QuizMetadata, 'totalPoints'>;
  }): Quiz {
    const quiz: Quiz = {
      id: this.generateId(),
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      questions: [],
      settings: data.settings,
      metadata: {
        ...data.metadata,
        totalPoints: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.quizzes.set(quiz.id, quiz);
    console.log(`✅ Quiz created: ${quiz.title} (ID: ${quiz.id})`);
    return quiz;
  }

  /**
   * Add multiple choice question
   */
  addMultipleChoiceQuestion(
    quizId: string,
    data: {
      question: string;
      options: Array<{ text: string; isCorrect: boolean; feedback?: string }>;
      points: number;
      allowMultiple?: boolean;
      partialCredit?: boolean;
      explanation?: string;
      hints?: string[];
    }
  ): MultipleChoiceQuestion {
    const quiz = this.getQuiz(quizId);

    const question: MultipleChoiceQuestion = {
      id: this.generateId(),
      type: 'multiple-choice',
      question: data.question,
      points: data.points,
      options: data.options.map(opt => ({
        id: this.generateId(),
        ...opt,
      })),
      allowMultiple: data.allowMultiple ?? false,
      correctAnswers: [],
      partialCredit: data.partialCredit ?? false,
      explanation: data.explanation,
      hints: data.hints,
    };

    question.correctAnswers = question.options
      .filter(opt => opt.isCorrect)
      .map(opt => opt.id);

    quiz.questions.push(question);
    this.updateQuizMetadata(quiz);

    console.log(`✅ Multiple choice question added: "${data.question.substring(0, 50)}..."`);
    return question;
  }

  /**
   * Add true/false question
   */
  addTrueFalseQuestion(
    quizId: string,
    data: {
      question: string;
      correctAnswer: boolean;
      points: number;
      explanation?: string;
    }
  ): TrueFalseQuestion {
    const quiz = this.getQuiz(quizId);

    const question: TrueFalseQuestion = {
      id: this.generateId(),
      type: 'true-false',
      question: data.question,
      correctAnswer: data.correctAnswer,
      points: data.points,
      explanation: data.explanation,
    };

    quiz.questions.push(question);
    this.updateQuizMetadata(quiz);

    console.log(`✅ True/False question added`);
    return question;
  }

  /**
   * Add short answer question
   */
  addShortAnswerQuestion(
    quizId: string,
    data: {
      question: string;
      correctAnswers: string[];
      points: number;
      caseSensitive?: boolean;
      acceptableVariations?: string[];
    }
  ): ShortAnswerQuestion {
    const quiz = this.getQuiz(quizId);

    const question: ShortAnswerQuestion = {
      id: this.generateId(),
      type: 'short-answer',
      question: data.question,
      correctAnswers: data.correctAnswers,
      caseSensitive: data.caseSensitive ?? false,
      acceptableVariations: data.acceptableVariations,
      points: data.points,
    };

    quiz.questions.push(question);
    this.updateQuizMetadata(quiz);

    console.log(`✅ Short answer question added`);
    return question;
  }

  /**
   * Add essay question
   */
  addEssayQuestion(
    quizId: string,
    data: {
      question: string;
      points: number;
      minWords?: number;
      maxWords?: number;
      rubric?: RubricCriteria[];
    }
  ): EssayQuestion {
    const quiz = this.getQuiz(quizId);

    const question: EssayQuestion = {
      id: this.generateId(),
      type: 'essay',
      question: data.question,
      points: data.points,
      minWords: data.minWords,
      maxWords: data.maxWords,
      rubric: data.rubric,
    };

    quiz.questions.push(question);
    this.updateQuizMetadata(quiz);

    console.log(`✅ Essay question added`);
    return question;
  }

  /**
   * Add code question
   */
  addCodeQuestion(
    quizId: string,
    data: {
      question: string;
      language: string;
      points: number;
      starterCode?: string;
      testCases: Array<{
        input: string;
        expectedOutput: string;
        isHidden?: boolean;
        points?: number;
      }>;
      allowedAttempts?: number;
    }
  ): CodeQuestion {
    const quiz = this.getQuiz(quizId);

    const question: CodeQuestion = {
      id: this.generateId(),
      type: 'code',
      question: data.question,
      language: data.language,
      points: data.points,
      starterCode: data.starterCode,
      testCases: data.testCases.map(tc => ({
        id: this.generateId(),
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden ?? false,
        points: tc.points ?? data.points / data.testCases.length,
      })),
      allowedAttempts: data.allowedAttempts ?? 3,
    };

    quiz.questions.push(question);
    this.updateQuizMetadata(quiz);

    console.log(`✅ Code question added (${data.language})`);
    return question;
  }

  /**
   * Add fill-in-blank question
   */
  addFillInBlankQuestion(
    quizId: string,
    data: {
      question: string;
      template: string;
      blanks: Array<{ position: number; correctAnswers: string[]; caseSensitive?: boolean }>;
      points: number;
    }
  ): FillInBlankQuestion {
    const quiz = this.getQuiz(quizId);

    const question: FillInBlankQuestion = {
      id: this.generateId(),
      type: 'fill-in-blank',
      question: data.question,
      template: data.template,
      blanks: data.blanks.map(b => ({
        ...b,
        caseSensitive: b.caseSensitive ?? false,
      })),
      points: data.points,
    };

    quiz.questions.push(question);
    this.updateQuizMetadata(quiz);

    console.log(`✅ Fill-in-blank question added`);
    return question;
  }

  /**
   * Create question bank
   */
  createQuestionBank(data: {
    name: string;
    description: string;
    category: string;
    tags: string[];
  }): QuestionBank {
    const bank: QuestionBank = {
      id: this.generateId(),
      name: data.name,
      description: data.description,
      category: data.category,
      tags: data.tags,
      questions: [],
    };

    this.questionBanks.set(bank.id, bank);
    console.log(`✅ Question bank created: ${bank.name}`);
    return bank;
  }

  /**
   * Add questions from bank to quiz
   */
  addQuestionsFromBank(
    quizId: string,
    bankId: string,
    count?: number,
    filters?: { tags?: string[]; difficulty?: string }
  ): void {
    const quiz = this.getQuiz(quizId);
    const bank = this.questionBanks.get(bankId);

    if (!bank) {
      throw new Error(`Question bank ${bankId} not found`);
    }

    let questions = [...bank.questions];

    // Apply filters
    if (filters?.tags) {
      questions = questions.filter(q =>
        q.tags?.some(tag => filters.tags?.includes(tag))
      );
    }

    // Shuffle and select
    questions = this.shuffleArray(questions);

    const questionsToAdd = count
      ? questions.slice(0, count)
      : questions;

    quiz.questions.push(...questionsToAdd);
    this.updateQuizMetadata(quiz);

    console.log(`✅ Added ${questionsToAdd.length} questions from bank`);
  }

  /**
   * Duplicate quiz
   */
  duplicateQuiz(quizId: string, newTitle: string): Quiz {
    const original = this.getQuiz(quizId);

    const duplicate: Quiz = {
      ...JSON.parse(JSON.stringify(original)),
      id: this.generateId(),
      title: newTitle,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Generate new IDs for questions
    duplicate.questions = duplicate.questions.map(q => ({
      ...q,
      id: this.generateId(),
    }));

    this.quizzes.set(duplicate.id, duplicate);
    console.log(`✅ Quiz duplicated: ${duplicate.title}`);
    return duplicate;
  }

  /**
   * Update quiz settings
   */
  updateQuizSettings(
    quizId: string,
    settings: Partial<QuizSettings>
  ): Quiz {
    const quiz = this.getQuiz(quizId);
    quiz.settings = { ...quiz.settings, ...settings };
    quiz.updatedAt = new Date();

    console.log(`✅ Quiz settings updated`);
    return quiz;
  }

  /**
   * Get quiz statistics
   */
  getQuizStats(quizId: string) {
    const quiz = this.getQuiz(quizId);

    const questionTypes = quiz.questions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalQuestions: quiz.questions.length,
      totalPoints: quiz.metadata.totalPoints,
      averagePointsPerQuestion:
        quiz.metadata.totalPoints / quiz.questions.length || 0,
      questionTypes,
      estimatedDuration: quiz.metadata.estimatedDuration,
      difficulty: quiz.metadata.difficulty,
    };
  }

  /**
   * Validate quiz
   */
  validateQuiz(quizId: string): { valid: boolean; errors: string[] } {
    const quiz = this.getQuiz(quizId);
    const errors: string[] = [];

    if (quiz.questions.length === 0) {
      errors.push('Quiz must have at least one question');
    }

    if (quiz.metadata.totalPoints === 0) {
      errors.push('Quiz must have points assigned');
    }

    // Validate each question
    quiz.questions.forEach((q, index) => {
      if (!q.question || q.question.trim().length === 0) {
        errors.push(`Question ${index + 1} has no text`);
      }

      if (q.points <= 0) {
        errors.push(`Question ${index + 1} has invalid points`);
      }

      if (q.type === 'multiple-choice') {
        const mcq = q as MultipleChoiceQuestion;
        if (mcq.correctAnswers.length === 0) {
          errors.push(`Question ${index + 1} has no correct answer`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private updateQuizMetadata(quiz: Quiz): void {
    quiz.metadata.totalPoints = quiz.questions.reduce(
      (sum, q) => sum + q.points,
      0
    );
    quiz.updatedAt = new Date();
  }

  private getQuiz(quizId: string): Quiz {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) {
      throw new Error(`Quiz ${quizId} not found`);
    }
    return quiz;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getQuiz(quizId: string): Quiz {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) {
      throw new Error(`Quiz ${quizId} not found`);
    }
    return quiz;
  }
}

// Example Usage
async function demonstrateQuizCreation() {
  console.log('=== Quiz Creation Example ===\n');

  const service = new QuizCreationService();

  // Create a quiz
  const quiz = service.createQuiz({
    title: 'JavaScript Fundamentals Quiz',
    description: 'Test your knowledge of JavaScript basics',
    instructions: 'Answer all questions to the best of your ability. You have 30 minutes.',
    settings: {
      timeLimit: 30,
      attemptsAllowed: 2,
      shuffleQuestions: true,
      shuffleOptions: true,
      showCorrectAnswers: 'after-submit',
      allowReview: true,
      passingScore: 70,
      randomizeFromBank: false,
    },
    metadata: {
      category: 'Programming',
      tags: ['JavaScript', 'Web Development'],
      difficulty: 'medium',
      estimatedDuration: 25,
    },
  });

  // Add various question types
  console.log('\n📝 Adding questions...\n');

  // Multiple choice
  service.addMultipleChoiceQuestion(quiz.id, {
    question: 'Which of the following is a JavaScript data type?',
    options: [
      { text: 'String', isCorrect: true },
      { text: 'Number', isCorrect: true },
      { text: 'Float', isCorrect: false, feedback: 'Float is not a separate type in JavaScript' },
      { text: 'Boolean', isCorrect: true },
    ],
    points: 10,
    allowMultiple: true,
    partialCredit: true,
    explanation: 'JavaScript has several primitive data types including String, Number, and Boolean.',
  });

  // True/False
  service.addTrueFalseQuestion(quiz.id, {
    question: 'JavaScript is a statically-typed language.',
    correctAnswer: false,
    points: 5,
    explanation: 'JavaScript is dynamically-typed, meaning variables can hold any type of value.',
  });

  // Short answer
  service.addShortAnswerQuestion(quiz.id, {
    question: 'What keyword is used to declare a block-scoped variable in JavaScript?',
    correctAnswers: ['let', 'const'],
    points: 5,
    caseSensitive: false,
  });

  // Code question
  service.addCodeQuestion(quiz.id, {
    question: 'Write a function that returns the sum of two numbers.',
    language: 'javascript',
    points: 15,
    starterCode: 'function sum(a, b) {\n  // Your code here\n}',
    testCases: [
      { input: 'sum(2, 3)', expectedOutput: '5', points: 5 },
      { input: 'sum(-1, 1)', expectedOutput: '0', points: 5 },
      { input: 'sum(0, 0)', expectedOutput: '0', points: 5, isHidden: true },
    ],
    allowedAttempts: 3,
  });

  // Fill in blank
  service.addFillInBlankQuestion(quiz.id, {
    question: 'Complete the sentence about JavaScript arrays',
    template: 'Arrays in JavaScript are _____ indexed and can hold _____ types of values.',
    blanks: [
      { position: 0, correctAnswers: ['zero', '0'], caseSensitive: false },
      { position: 1, correctAnswers: ['multiple', 'different', 'various'], caseSensitive: false },
    ],
    points: 10,
  });

  // Essay question
  service.addEssayQuestion(quiz.id, {
    question: 'Explain the concept of closures in JavaScript with an example.',
    points: 20,
    minWords: 100,
    maxWords: 300,
    rubric: [
      { name: 'Understanding', description: 'Demonstrates clear understanding of closures', maxPoints: 10 },
      { name: 'Example', description: 'Provides a relevant code example', maxPoints: 7 },
      { name: 'Clarity', description: 'Explanation is clear and well-structured', maxPoints: 3 },
    ],
  });

  // Get quiz statistics
  console.log('\n📊 Quiz Statistics:');
  const stats = service.getQuizStats(quiz.id);
  console.log(`   Total Questions: ${stats.totalQuestions}`);
  console.log(`   Total Points: ${stats.totalPoints}`);
  console.log(`   Average Points: ${stats.averagePointsPerQuestion.toFixed(2)}`);
  console.log(`   Question Types:`, stats.questionTypes);
  console.log(`   Difficulty: ${stats.difficulty}`);

  // Validate quiz
  console.log('\n✅ Validating quiz...');
  const validation = service.validateQuiz(quiz.id);
  if (validation.valid) {
    console.log('   Quiz is valid and ready to publish!');
  } else {
    console.log('   Validation errors:');
    validation.errors.forEach(error => console.log(`     - ${error}`));
  }

  // Duplicate quiz
  const advancedQuiz = service.duplicateQuiz(quiz.id, 'Advanced JavaScript Quiz');
  service.updateQuizSettings(advancedQuiz.id, {
    timeLimit: 45,
    passingScore: 80,
  });

  console.log('\n✅ Quiz creation demonstration complete!');
}

// Run the example
demonstrateQuizCreation().catch(console.error);
