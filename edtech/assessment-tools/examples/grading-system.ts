/**
 * Grading System Example for Assessment Tools
 *
 * Demonstrates automatic grading, rubric-based assessment, grade calculation,
 * and feedback generation for educational assessments.
 */

// Types
interface QuizAttempt {
  id: string;
  studentId: string;
  quizId: string;
  attemptNumber: number;
  startedAt: Date;
  submittedAt?: Date;
  answers: Map<string, Answer>;
  status: 'in-progress' | 'submitted' | 'graded';
  timeSpent: number; // minutes
}

interface Answer {
  questionId: string;
  questionType: string;
  value: unknown;
  submittedAt: Date;
  flagged: boolean;
}

interface GradingResult {
  attemptId: string;
  studentId: string;
  quizId: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  grade: string;
  questionResults: QuestionResult[];
  feedback: string[];
  gradedAt: Date;
  gradedBy: 'auto' | string; // 'auto' or instructor ID
}

interface QuestionResult {
  questionId: string;
  questionType: string;
  studentAnswer: unknown;
  correctAnswer: unknown;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  feedback?: string;
  partialCredit?: boolean;
}

interface RubricGrading {
  criteriaId: string;
  criteriaName: string;
  maxPoints: number;
  pointsEarned: number;
  feedback: string;
}

interface GradeScale {
  letter: string;
  minPercentage: number;
  maxPercentage: number;
  gpa: number;
}

interface GradingStatistics {
  quizId: string;
  totalAttempts: number;
  averageScore: number;
  medianScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  averageTimeSpent: number;
  questionStatistics: QuestionStatistics[];
}

interface QuestionStatistics {
  questionId: string;
  totalResponses: number;
  correctResponses: number;
  averageScore: number;
  difficultyIndex: number; // 0-1, higher = easier
  discriminationIndex: number; // -1 to 1, higher = better
}

// Grading Service
class GradingService {
  private attempts: Map<string, QuizAttempt> = new Map();
  private results: Map<string, GradingResult> = new Map();
  private gradeScale: GradeScale[] = [
    { letter: 'A+', minPercentage: 97, maxPercentage: 100, gpa: 4.0 },
    { letter: 'A', minPercentage: 93, maxPercentage: 96, gpa: 4.0 },
    { letter: 'A-', minPercentage: 90, maxPercentage: 92, gpa: 3.7 },
    { letter: 'B+', minPercentage: 87, maxPercentage: 89, gpa: 3.3 },
    { letter: 'B', minPercentage: 83, maxPercentage: 86, gpa: 3.0 },
    { letter: 'B-', minPercentage: 80, maxPercentage: 82, gpa: 2.7 },
    { letter: 'C+', minPercentage: 77, maxPercentage: 79, gpa: 2.3 },
    { letter: 'C', minPercentage: 73, maxPercentage: 76, gpa: 2.0 },
    { letter: 'C-', minPercentage: 70, maxPercentage: 72, gpa: 1.7 },
    { letter: 'D+', minPercentage: 67, maxPercentage: 69, gpa: 1.3 },
    { letter: 'D', minPercentage: 63, maxPercentage: 66, gpa: 1.0 },
    { letter: 'D-', minPercentage: 60, maxPercentage: 62, gpa: 0.7 },
    { letter: 'F', minPercentage: 0, maxPercentage: 59, gpa: 0.0 },
  ];

  /**
   * Submit quiz attempt for grading
   */
  async gradeAttempt(
    attemptId: string,
    quiz: any
  ): Promise<GradingResult> {
    const attempt = this.getAttempt(attemptId);

    if (attempt.status === 'graded') {
      throw new Error('Attempt already graded');
    }

    console.log(`📝 Grading attempt ${attemptId}...`);

    const questionResults: QuestionResult[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Grade each question
    for (const question of quiz.questions) {
      const answer = attempt.answers.get(question.id);
      const result = await this.gradeQuestion(question, answer);

      questionResults.push(result);
      totalScore += result.pointsEarned;
      maxScore += result.maxPoints;
    }

    const percentage = (totalScore / maxScore) * 100 || 0;
    const letterGrade = this.getLetterGrade(percentage);
    const passed = percentage >= quiz.settings.passingScore;

    // Generate feedback
    const feedback = this.generateFeedback(questionResults, percentage, passed);

    const gradingResult: GradingResult = {
      attemptId,
      studentId: attempt.studentId,
      quizId: attempt.quizId,
      score: totalScore,
      maxScore,
      percentage,
      passed,
      grade: letterGrade,
      questionResults,
      feedback,
      gradedAt: new Date(),
      gradedBy: 'auto',
    };

    this.results.set(attemptId, gradingResult);
    attempt.status = 'graded';

    console.log(`✅ Grading complete: ${totalScore}/${maxScore} (${percentage.toFixed(2)}%) - ${letterGrade}`);
    return gradingResult;
  }

  /**
   * Grade individual question
   */
  private async gradeQuestion(
    question: any,
    answer?: Answer
  ): Promise<QuestionResult> {
    if (!answer) {
      return {
        questionId: question.id,
        questionType: question.type,
        studentAnswer: null,
        correctAnswer: this.getCorrectAnswer(question),
        isCorrect: false,
        pointsEarned: 0,
        maxPoints: question.points,
        feedback: 'Question not answered',
      };
    }

    switch (question.type) {
      case 'multiple-choice':
        return this.gradeMultipleChoice(question, answer);
      case 'true-false':
        return this.gradeTrueFalse(question, answer);
      case 'short-answer':
        return this.gradeShortAnswer(question, answer);
      case 'code':
        return await this.gradeCode(question, answer);
      case 'fill-in-blank':
        return this.gradeFillInBlank(question, answer);
      case 'essay':
        return this.gradeEssay(question, answer);
      default:
        return {
          questionId: question.id,
          questionType: question.type,
          studentAnswer: answer.value,
          correctAnswer: null,
          isCorrect: false,
          pointsEarned: 0,
          maxPoints: question.points,
          feedback: 'Unsupported question type',
        };
    }
  }

  /**
   * Grade multiple choice question
   */
  private gradeMultipleChoice(question: any, answer: Answer): QuestionResult {
    const studentAnswers = Array.isArray(answer.value)
      ? answer.value
      : [answer.value];

    const correctAnswers = new Set(question.correctAnswers);
    const studentSet = new Set(studentAnswers);

    let isCorrect = false;
    let pointsEarned = 0;

    if (question.allowMultiple && question.partialCredit) {
      // Calculate partial credit
      const correctSelected = studentAnswers.filter(a =>
        correctAnswers.has(a)
      ).length;
      const incorrectSelected = studentAnswers.filter(
        a => !correctAnswers.has(a)
      ).length;

      const partialPoints =
        (correctSelected / correctAnswers.size) * question.points;
      const penalty = (incorrectSelected / correctAnswers.size) * question.points;

      pointsEarned = Math.max(0, partialPoints - penalty);
      isCorrect = pointsEarned === question.points;
    } else {
      // All or nothing
      isCorrect =
        correctAnswers.size === studentSet.size &&
        [...correctAnswers].every(a => studentSet.has(a));
      pointsEarned = isCorrect ? question.points : 0;
    }

    return {
      questionId: question.id,
      questionType: question.type,
      studentAnswer: studentAnswers,
      correctAnswer: Array.from(correctAnswers),
      isCorrect,
      pointsEarned,
      maxPoints: question.points,
      partialCredit: question.partialCredit && pointsEarned > 0 && !isCorrect,
    };
  }

  /**
   * Grade true/false question
   */
  private gradeTrueFalse(question: any, answer: Answer): QuestionResult {
    const isCorrect = answer.value === question.correctAnswer;

    return {
      questionId: question.id,
      questionType: question.type,
      studentAnswer: answer.value,
      correctAnswer: question.correctAnswer,
      isCorrect,
      pointsEarned: isCorrect ? question.points : 0,
      maxPoints: question.points,
    };
  }

  /**
   * Grade short answer question
   */
  private gradeShortAnswer(question: any, answer: Answer): QuestionResult {
    let studentAnswer = String(answer.value);
    let correctAnswers = question.correctAnswers;

    if (!question.caseSensitive) {
      studentAnswer = studentAnswer.toLowerCase();
      correctAnswers = correctAnswers.map((a: string) => a.toLowerCase());
    }

    // Include acceptable variations
    if (question.acceptableVariations) {
      correctAnswers = [
        ...correctAnswers,
        ...question.acceptableVariations.map((v: string) =>
          question.caseSensitive ? v : v.toLowerCase()
        ),
      ];
    }

    const isCorrect = correctAnswers.includes(studentAnswer.trim());

    return {
      questionId: question.id,
      questionType: question.type,
      studentAnswer: answer.value,
      correctAnswer: question.correctAnswers,
      isCorrect,
      pointsEarned: isCorrect ? question.points : 0,
      maxPoints: question.points,
      feedback: isCorrect
        ? 'Correct!'
        : `Expected: ${question.correctAnswers.join(' or ')}`,
    };
  }

  /**
   * Grade code question
   */
  private async gradeCode(question: any, answer: Answer): Promise<QuestionResult> {
    const code = String(answer.value);
    let totalPoints = 0;
    let passedTests = 0;

    // Run test cases
    for (const testCase of question.testCases) {
      try {
        const result = await this.executeCode(code, testCase.input, question.language);
        if (result.trim() === testCase.expectedOutput.trim()) {
          totalPoints += testCase.points;
          passedTests++;
        }
      } catch (error) {
        // Test failed
        console.log(`   Test failed: ${error instanceof Error ? error.message : error}`);
      }
    }

    const isCorrect = passedTests === question.testCases.length;

    return {
      questionId: question.id,
      questionType: question.type,
      studentAnswer: code,
      correctAnswer: `${passedTests}/${question.testCases.length} tests passed`,
      isCorrect,
      pointsEarned: totalPoints,
      maxPoints: question.points,
      feedback: `Passed ${passedTests} out of ${question.testCases.length} test cases`,
    };
  }

  /**
   * Grade fill-in-blank question
   */
  private gradeFillInBlank(question: any, answer: Answer): QuestionResult {
    const studentAnswers = answer.value as string[];
    let correctBlanks = 0;

    question.blanks.forEach((blank: any, index: number) => {
      let studentAnswer = studentAnswers[index] || '';
      let correctAnswers = blank.correctAnswers;

      if (!blank.caseSensitive) {
        studentAnswer = studentAnswer.toLowerCase();
        correctAnswers = correctAnswers.map((a: string) => a.toLowerCase());
      }

      if (correctAnswers.includes(studentAnswer.trim())) {
        correctBlanks++;
      }
    });

    const percentage = correctBlanks / question.blanks.length;
    const pointsEarned = percentage * question.points;
    const isCorrect = correctBlanks === question.blanks.length;

    return {
      questionId: question.id,
      questionType: question.type,
      studentAnswer: studentAnswers,
      correctAnswer: question.blanks.map((b: any) => b.correctAnswers),
      isCorrect,
      pointsEarned,
      maxPoints: question.points,
      feedback: `${correctBlanks} out of ${question.blanks.length} blanks correct`,
      partialCredit: pointsEarned > 0 && !isCorrect,
    };
  }

  /**
   * Grade essay question (requires manual grading)
   */
  private gradeEssay(question: any, answer: Answer): QuestionResult {
    const text = String(answer.value);
    const wordCount = text.split(/\s+/).length;

    // Automatic validation only
    let feedback = '';
    if (question.minWords && wordCount < question.minWords) {
      feedback = `Below minimum word count (${wordCount}/${question.minWords})`;
    } else if (question.maxWords && wordCount > question.maxWords) {
      feedback = `Exceeds maximum word count (${wordCount}/${question.maxWords})`;
    } else {
      feedback = 'Awaiting manual grading';
    }

    return {
      questionId: question.id,
      questionType: question.type,
      studentAnswer: text,
      correctAnswer: 'Manual grading required',
      isCorrect: false,
      pointsEarned: 0, // Will be updated by instructor
      maxPoints: question.points,
      feedback,
    };
  }

  /**
   * Manual grading with rubric
   */
  gradeWithRubric(
    attemptId: string,
    questionId: string,
    rubricGrades: RubricGrading[],
    overallFeedback: string
  ): void {
    const result = this.results.get(attemptId);
    if (!result) {
      throw new Error('Grading result not found');
    }

    const questionResult = result.questionResults.find(
      q => q.questionId === questionId
    );

    if (!questionResult) {
      throw new Error('Question result not found');
    }

    // Calculate total points from rubric
    const pointsEarned = rubricGrades.reduce(
      (sum, grade) => sum + grade.pointsEarned,
      0
    );

    questionResult.pointsEarned = pointsEarned;
    questionResult.feedback = overallFeedback;

    // Recalculate total score
    result.score = result.questionResults.reduce(
      (sum, q) => sum + q.pointsEarned,
      0
    );
    result.percentage = (result.score / result.maxScore) * 100;
    result.grade = this.getLetterGrade(result.percentage);

    console.log(`✅ Manual grading complete for question ${questionId}`);
  }

  /**
   * Get grading statistics for a quiz
   */
  getGradingStatistics(quizId: string): GradingStatistics {
    const quizResults = Array.from(this.results.values()).filter(
      r => r.quizId === quizId
    );

    if (quizResults.length === 0) {
      throw new Error('No graded attempts found for this quiz');
    }

    const scores = quizResults.map(r => r.percentage).sort((a, b) => a - b);
    const attempts = Array.from(this.attempts.values()).filter(
      a => a.quizId === quizId
    );

    const questionStats = this.calculateQuestionStatistics(quizResults);

    return {
      quizId,
      totalAttempts: quizResults.length,
      averageScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
      medianScore: scores[Math.floor(scores.length / 2)],
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      passRate:
        (quizResults.filter(r => r.passed).length / quizResults.length) * 100,
      averageTimeSpent:
        attempts.reduce((sum, a) => sum + a.timeSpent, 0) / attempts.length,
      questionStatistics: questionStats,
    };
  }

  /**
   * Calculate question-level statistics
   */
  private calculateQuestionStatistics(
    results: GradingResult[]
  ): QuestionStatistics[] {
    const questionMap = new Map<string, QuestionResult[]>();

    // Group results by question
    results.forEach(result => {
      result.questionResults.forEach(qr => {
        if (!questionMap.has(qr.questionId)) {
          questionMap.set(qr.questionId, []);
        }
        questionMap.get(qr.questionId)!.push(qr);
      });
    });

    // Calculate statistics
    return Array.from(questionMap.entries()).map(([questionId, qResults]) => {
      const totalResponses = qResults.length;
      const correctResponses = qResults.filter(q => q.isCorrect).length;
      const averageScore =
        qResults.reduce((sum, q) => sum + q.pointsEarned, 0) / totalResponses;
      const difficultyIndex = correctResponses / totalResponses;

      return {
        questionId,
        totalResponses,
        correctResponses,
        averageScore,
        difficultyIndex,
        discriminationIndex: 0.5, // Simplified - would need more complex calculation
      };
    });
  }

  /**
   * Generate feedback based on performance
   */
  private generateFeedback(
    questionResults: QuestionResult[],
    percentage: number,
    passed: boolean
  ): string[] {
    const feedback: string[] = [];

    if (passed) {
      feedback.push('Congratulations! You passed the quiz.');
    } else {
      feedback.push('You did not meet the passing score. Please review and try again.');
    }

    const correctCount = questionResults.filter(q => q.isCorrect).length;
    const totalCount = questionResults.length;

    feedback.push(
      `You answered ${correctCount} out of ${totalCount} questions correctly.`
    );

    // Identify areas for improvement
    const weakAreas = questionResults
      .filter(q => !q.isCorrect && q.pointsEarned / q.maxPoints < 0.5)
      .slice(0, 3);

    if (weakAreas.length > 0) {
      feedback.push(
        'Areas for improvement: Questions ' +
          weakAreas.map(q => q.questionId).join(', ')
      );
    }

    return feedback;
  }

  /**
   * Get letter grade from percentage
   */
  private getLetterGrade(percentage: number): string {
    const grade = this.gradeScale.find(
      g => percentage >= g.minPercentage && percentage <= g.maxPercentage
    );
    return grade?.letter || 'F';
  }

  /**
   * Get correct answer for a question
   */
  private getCorrectAnswer(question: any): unknown {
    switch (question.type) {
      case 'multiple-choice':
        return question.correctAnswers;
      case 'true-false':
        return question.correctAnswer;
      case 'short-answer':
        return question.correctAnswers;
      case 'fill-in-blank':
        return question.blanks.map((b: any) => b.correctAnswers);
      default:
        return null;
    }
  }

  /**
   * Execute code (simplified simulation)
   */
  private async executeCode(
    code: string,
    input: string,
    language: string
  ): Promise<string> {
    // Simplified - in production, would use sandboxed execution
    console.log(`   Executing ${language} code with input: ${input}`);
    return 'expected output'; // Simulated result
  }

  private getAttempt(attemptId: string): QuizAttempt {
    const attempt = this.attempts.get(attemptId);
    if (!attempt) {
      throw new Error(`Attempt ${attemptId} not found`);
    }
    return attempt;
  }

  /**
   * Create a mock attempt for testing
   */
  createMockAttempt(studentId: string, quizId: string): QuizAttempt {
    const attempt: QuizAttempt = {
      id: this.generateId(),
      studentId,
      quizId,
      attemptNumber: 1,
      startedAt: new Date(),
      answers: new Map(),
      status: 'in-progress',
      timeSpent: 0,
    };

    this.attempts.set(attempt.id, attempt);
    return attempt;
  }

  /**
   * Add answer to attempt
   */
  addAnswer(attemptId: string, questionId: string, answer: Omit<Answer, 'submittedAt' | 'flagged'>): void {
    const attempt = this.getAttempt(attemptId);
    attempt.answers.set(questionId, {
      ...answer,
      submittedAt: new Date(),
      flagged: false,
    });
  }

  /**
   * Submit attempt
   */
  submitAttempt(attemptId: string): void {
    const attempt = this.getAttempt(attemptId);
    attempt.submittedAt = new Date();
    attempt.status = 'submitted';
    attempt.timeSpent = Math.floor(
      (attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 60000
    );
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Example Usage
async function demonstrateGrading() {
  console.log('=== Grading System Example ===\n');

  const service = new GradingService();

  // Mock quiz structure
  const quiz = {
    id: 'quiz-001',
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Which are programming languages?',
        correctAnswers: ['opt1', 'opt2'],
        allowMultiple: true,
        partialCredit: true,
        points: 10,
      },
      {
        id: 'q2',
        type: 'true-false',
        question: 'JavaScript is compiled.',
        correctAnswer: false,
        points: 5,
      },
      {
        id: 'q3',
        type: 'short-answer',
        question: 'What is 2+2?',
        correctAnswers: ['4', 'four'],
        caseSensitive: false,
        points: 5,
      },
    ],
    settings: {
      passingScore: 70,
    },
  };

  // Create attempt
  const attempt = service.createMockAttempt('student-001', quiz.id);

  // Add answers
  service.addAnswer(attempt.id, 'q1', {
    questionId: 'q1',
    questionType: 'multiple-choice',
    value: ['opt1', 'opt2'], // Correct
  });

  service.addAnswer(attempt.id, 'q2', {
    questionId: 'q2',
    questionType: 'true-false',
    value: false, // Correct
  });

  service.addAnswer(attempt.id, 'q3', {
    questionId: 'q3',
    questionType: 'short-answer',
    value: 'Four', // Correct (case insensitive)
  });

  // Submit attempt
  service.submitAttempt(attempt.id);

  // Grade the attempt
  console.log('\n📝 Grading quiz attempt...\n');
  const result = await service.gradeAttempt(attempt.id, quiz);

  // Display results
  console.log('\n📊 Grading Results:');
  console.log(`   Student: ${result.studentId}`);
  console.log(`   Score: ${result.score}/${result.maxScore}`);
  console.log(`   Percentage: ${result.percentage.toFixed(2)}%`);
  console.log(`   Grade: ${result.grade}`);
  console.log(`   Status: ${result.passed ? 'PASSED ✅' : 'FAILED ❌'}`);

  console.log('\n📝 Question Results:');
  result.questionResults.forEach((qr, index) => {
    console.log(
      `   Q${index + 1}: ${qr.isCorrect ? '✅' : '❌'} ${qr.pointsEarned}/${qr.maxPoints} points`
    );
    if (qr.feedback) {
      console.log(`        ${qr.feedback}`);
    }
  });

  console.log('\n💬 Feedback:');
  result.feedback.forEach(f => {
    console.log(`   - ${f}`);
  });

  // Get statistics (with mock data)
  console.log('\n📈 Quiz Statistics:');
  const stats = service.getGradingStatistics(quiz.id);
  console.log(`   Total Attempts: ${stats.totalAttempts}`);
  console.log(`   Average Score: ${stats.averageScore.toFixed(2)}%`);
  console.log(`   Pass Rate: ${stats.passRate.toFixed(2)}%`);
  console.log(`   Highest Score: ${stats.highestScore.toFixed(2)}%`);

  console.log('\n✅ Grading demonstration complete!');
}

// Run the example
demonstrateGrading().catch(console.error);
