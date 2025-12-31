/**
 * Interactive Exercises Example for Interactive Learning
 *
 * Demonstrates interactive coding exercises, simulations, drag-and-drop activities,
 * real-time feedback, and collaborative learning exercises.
 */

// Types
interface Exercise {
  id: string;
  title: string;
  type: ExerciseType;
  description: string;
  instructions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  timeLimit?: number; // minutes
  attempts: number;
  maxAttempts?: number;
}

type ExerciseType =
  | 'code'
  | 'drag-drop'
  | 'fill-blank'
  | 'simulation'
  | 'diagram'
  | 'matching'
  | 'sorting';

interface CodeExercise extends Exercise {
  type: 'code';
  language: string;
  starterCode: string;
  solution?: string;
  testCases: TestCase[];
  hints: CodeHint[];
  allowedLibraries: string[];
  environment: 'browser' | 'node' | 'python' | 'java';
}

interface TestCase {
  id: string;
  name: string;
  input: unknown;
  expectedOutput: unknown;
  isHidden: boolean;
  points: number;
  timeout?: number;
}

interface CodeHint {
  level: number; // 1-3, 1 being most helpful
  text: string;
  pointsPenalty: number;
}

interface DragDropExercise extends Exercise {
  type: 'drag-drop';
  items: DraggableItem[];
  dropZones: DropZone[];
  allowMultiple: boolean;
  showFeedbackImmediately: boolean;
}

interface DraggableItem {
  id: string;
  content: string;
  correctZone: string;
  category?: string;
}

interface DropZone {
  id: string;
  label: string;
  accepts?: string[]; // categories
  maxItems?: number;
}

interface SimulationExercise extends Exercise {
  type: 'simulation';
  scenario: Scenario;
  variables: SimulationVariable[];
  goals: SimulationGoal[];
  constraints: Constraint[];
}

interface Scenario {
  title: string;
  description: string;
  initialState: Record<string, unknown>;
  visualizationType: 'chart' | '3d' | 'diagram' | 'animation';
}

interface SimulationVariable {
  name: string;
  type: 'slider' | 'input' | 'toggle';
  min?: number;
  max?: number;
  step?: number;
  defaultValue: unknown;
  unit?: string;
}

interface SimulationGoal {
  id: string;
  description: string;
  condition: string; // JavaScript expression
  points: number;
}

interface Constraint {
  description: string;
  validation: string; // JavaScript expression
}

interface ExerciseAttempt {
  id: string;
  exerciseId: string;
  studentId: string;
  attemptNumber: number;
  startedAt: Date;
  submittedAt?: Date;
  answer: ExerciseAnswer;
  result?: ExerciseResult;
  hintsUsed: number;
  status: 'in-progress' | 'submitted' | 'graded';
}

interface ExerciseAnswer {
  type: ExerciseType;
  data: unknown;
  interactions: Interaction[];
}

interface Interaction {
  timestamp: Date;
  type: string;
  data: unknown;
}

interface ExerciseResult {
  correct: boolean;
  score: number;
  maxScore: number;
  feedback: Feedback[];
  executionTime?: number;
  testResults?: TestResult[];
  suggestions: string[];
}

interface Feedback {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  reference?: string;
}

interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput: unknown;
  expectedOutput: unknown;
  error?: string;
  executionTime: number;
}

interface CollaborativeExercise {
  id: string;
  baseExercise: Exercise;
  mode: 'pair-programming' | 'group-project' | 'peer-review';
  participants: Participant[];
  roles: Role[];
  communicationTools: string[];
  sharedWorkspace: SharedWorkspace;
}

interface Participant {
  studentId: string;
  role: string;
  joinedAt: Date;
  contributionScore: number;
}

interface Role {
  name: string;
  description: string;
  permissions: string[];
  responsibilities: string[];
}

interface SharedWorkspace {
  code?: string;
  annotations: Annotation[];
  chat: ChatMessage[];
  revisionHistory: Revision[];
}

interface Annotation {
  id: string;
  authorId: string;
  line: number;
  text: string;
  resolved: boolean;
  createdAt: Date;
}

interface ChatMessage {
  id: string;
  authorId: string;
  message: string;
  timestamp: Date;
}

interface Revision {
  id: string;
  authorId: string;
  changes: string;
  timestamp: Date;
}

// Interactive Exercise Service
class InteractiveExerciseService {
  private exercises: Map<string, Exercise> = new Map();
  private attempts: Map<string, ExerciseAttempt> = new Map();
  private collaborativeExercises: Map<string, CollaborativeExercise> = new Map();

  /**
   * Create a code exercise
   */
  createCodeExercise(data: {
    title: string;
    description: string;
    instructions: string[];
    language: string;
    starterCode: string;
    testCases: Omit<TestCase, 'id'>[];
    difficulty: Exercise['difficulty'];
    points: number;
  }): CodeExercise {
    const exercise: CodeExercise = {
      id: this.generateId(),
      type: 'code',
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      language: data.language,
      starterCode: data.starterCode,
      testCases: data.testCases.map(tc => ({
        ...tc,
        id: this.generateId(),
      })),
      hints: [],
      allowedLibraries: [],
      environment: this.getEnvironmentFromLanguage(data.language),
      difficulty: data.difficulty,
      points: data.points,
      attempts: 0,
    };

    this.exercises.set(exercise.id, exercise);
    console.log(`✅ Code exercise created: ${exercise.title}`);
    return exercise;
  }

  /**
   * Create drag-and-drop exercise
   */
  createDragDropExercise(data: {
    title: string;
    description: string;
    instructions: string[];
    items: Omit<DraggableItem, 'id'>[];
    dropZones: DropZone[];
    difficulty: Exercise['difficulty'];
    points: number;
  }): DragDropExercise {
    const exercise: DragDropExercise = {
      id: this.generateId(),
      type: 'drag-drop',
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      items: data.items.map(item => ({
        ...item,
        id: this.generateId(),
      })),
      dropZones: data.dropZones,
      allowMultiple: false,
      showFeedbackImmediately: true,
      difficulty: data.difficulty,
      points: data.points,
      attempts: 0,
    };

    this.exercises.set(exercise.id, exercise);
    console.log(`✅ Drag-drop exercise created: ${exercise.title}`);
    return exercise;
  }

  /**
   * Create simulation exercise
   */
  createSimulationExercise(data: {
    title: string;
    description: string;
    scenario: Scenario;
    variables: SimulationVariable[];
    goals: Omit<SimulationGoal, 'id'>[];
    difficulty: Exercise['difficulty'];
    points: number;
  }): SimulationExercise {
    const exercise: SimulationExercise = {
      id: this.generateId(),
      type: 'simulation',
      title: data.title,
      description: data.description,
      instructions: ['Adjust variables to meet the goals'],
      scenario: data.scenario,
      variables: data.variables,
      goals: data.goals.map(g => ({ ...g, id: this.generateId() })),
      constraints: [],
      difficulty: data.difficulty,
      points: data.points,
      attempts: 0,
    };

    this.exercises.set(exercise.id, exercise);
    console.log(`✅ Simulation exercise created: ${exercise.title}`);
    return exercise;
  }

  /**
   * Start exercise attempt
   */
  startAttempt(
    exerciseId: string,
    studentId: string
  ): ExerciseAttempt {
    const exercise = this.exercises.get(exerciseId);

    if (!exercise) {
      throw new Error(`Exercise ${exerciseId} not found`);
    }

    // Check attempt limit
    if (exercise.maxAttempts && exercise.attempts >= exercise.maxAttempts) {
      throw new Error('Maximum attempts reached');
    }

    const attempt: ExerciseAttempt = {
      id: this.generateId(),
      exerciseId,
      studentId,
      attemptNumber: exercise.attempts + 1,
      startedAt: new Date(),
      answer: {
        type: exercise.type,
        data: null,
        interactions: [],
      },
      hintsUsed: 0,
      status: 'in-progress',
    };

    exercise.attempts++;
    this.attempts.set(attempt.id, attempt);

    console.log(`🚀 Attempt started: ${exercise.title} (Attempt #${attempt.attemptNumber})`);
    return attempt;
  }

  /**
   * Submit code exercise
   */
  async submitCodeExercise(
    attemptId: string,
    code: string
  ): Promise<ExerciseResult> {
    const attempt = this.getAttempt(attemptId);
    const exercise = this.exercises.get(attempt.exerciseId) as CodeExercise;

    console.log(`📝 Submitting code exercise...`);

    attempt.answer.data = code;
    attempt.submittedAt = new Date();
    attempt.status = 'submitted';

    // Run test cases
    const testResults: TestResult[] = [];
    let passedTests = 0;

    for (const testCase of exercise.testCases) {
      const result = await this.executeCode(
        code,
        testCase,
        exercise.language
      );

      testResults.push(result);
      if (result.passed) passedTests++;
    }

    const allPassed = passedTests === exercise.testCases.length;
    const score = Math.floor(
      (passedTests / exercise.testCases.length) * exercise.points
    );

    // Generate feedback
    const feedback = this.generateCodeFeedback(
      code,
      testResults,
      exercise
    );

    const result: ExerciseResult = {
      correct: allPassed,
      score,
      maxScore: exercise.points,
      feedback,
      testResults,
      suggestions: this.generateSuggestions(code, testResults),
    };

    attempt.result = result;
    attempt.status = 'graded';

    console.log(`✅ Code graded: ${passedTests}/${exercise.testCases.length} tests passed`);
    console.log(`   Score: ${score}/${exercise.points}`);

    return result;
  }

  /**
   * Submit drag-drop exercise
   */
  submitDragDropExercise(
    attemptId: string,
    placements: Record<string, string> // itemId -> zoneId
  ): ExerciseResult {
    const attempt = this.getAttempt(attemptId);
    const exercise = this.exercises.get(
      attempt.exerciseId
    ) as DragDropExercise;

    console.log(`📝 Submitting drag-drop exercise...`);

    attempt.answer.data = placements;
    attempt.submittedAt = new Date();
    attempt.status = 'submitted';

    // Check correctness
    let correctPlacements = 0;
    const feedback: Feedback[] = [];

    exercise.items.forEach(item => {
      const placedZone = placements[item.id];
      const isCorrect = placedZone === item.correctZone;

      if (isCorrect) {
        correctPlacements++;
        feedback.push({
          type: 'success',
          message: `✅ "${item.content}" is correctly placed`,
        });
      } else {
        feedback.push({
          type: 'error',
          message: `❌ "${item.content}" is incorrectly placed`,
        });
      }
    });

    const score = Math.floor(
      (correctPlacements / exercise.items.length) * exercise.points
    );

    const result: ExerciseResult = {
      correct: correctPlacements === exercise.items.length,
      score,
      maxScore: exercise.points,
      feedback,
      suggestions:
        correctPlacements < exercise.items.length
          ? ['Review the categories and try again']
          : [],
    };

    attempt.result = result;
    attempt.status = 'graded';

    console.log(`✅ Drag-drop graded: ${correctPlacements}/${exercise.items.length} correct`);
    console.log(`   Score: ${score}/${exercise.points}`);

    return result;
  }

  /**
   * Submit simulation exercise
   */
  submitSimulationExercise(
    attemptId: string,
    variableValues: Record<string, unknown>
  ): ExerciseResult {
    const attempt = this.getAttempt(attemptId);
    const exercise = this.exercises.get(
      attempt.exerciseId
    ) as SimulationExercise;

    console.log(`📝 Submitting simulation exercise...`);

    attempt.answer.data = variableValues;
    attempt.submittedAt = new Date();
    attempt.status = 'submitted';

    // Evaluate goals
    let achievedGoals = 0;
    const feedback: Feedback[] = [];

    exercise.goals.forEach(goal => {
      const achieved = this.evaluateCondition(goal.condition, variableValues);

      if (achieved) {
        achievedGoals++;
        feedback.push({
          type: 'success',
          message: `✅ ${goal.description}`,
        });
      } else {
        feedback.push({
          type: 'error',
          message: `❌ ${goal.description}`,
        });
      }
    });

    const score = exercise.goals.reduce((sum, goal, index) => {
      return sum + (index < achievedGoals ? goal.points : 0);
    }, 0);

    const result: ExerciseResult = {
      correct: achievedGoals === exercise.goals.length,
      score,
      maxScore: exercise.points,
      feedback,
      suggestions:
        achievedGoals < exercise.goals.length
          ? ['Try adjusting the variables to meet all goals']
          : [],
    };

    attempt.result = result;
    attempt.status = 'graded';

    console.log(`✅ Simulation graded: ${achievedGoals}/${exercise.goals.length} goals achieved`);
    console.log(`   Score: ${score}/${exercise.points}`);

    return result;
  }

  /**
   * Get hint for exercise
   */
  getHint(attemptId: string, level: number): CodeHint | null {
    const attempt = this.getAttempt(attemptId);
    const exercise = this.exercises.get(attempt.exerciseId) as CodeExercise;

    if (exercise.type !== 'code') {
      return null;
    }

    const hint = exercise.hints.find(h => h.level === level);

    if (hint) {
      attempt.hintsUsed++;
      console.log(`💡 Hint provided (Level ${level})`);
    }

    return hint || null;
  }

  /**
   * Record interaction
   */
  recordInteraction(
    attemptId: string,
    type: string,
    data: unknown
  ): void {
    const attempt = this.getAttempt(attemptId);

    attempt.answer.interactions.push({
      timestamp: new Date(),
      type,
      data,
    });
  }

  /**
   * Create collaborative exercise
   */
  createCollaborativeExercise(
    exerciseId: string,
    mode: CollaborativeExercise['mode'],
    participants: string[]
  ): CollaborativeExercise {
    const baseExercise = this.exercises.get(exerciseId);

    if (!baseExercise) {
      throw new Error(`Exercise ${exerciseId} not found`);
    }

    const collabExercise: CollaborativeExercise = {
      id: this.generateId(),
      baseExercise,
      mode,
      participants: participants.map(id => ({
        studentId: id,
        role: 'contributor',
        joinedAt: new Date(),
        contributionScore: 0,
      })),
      roles: this.getDefaultRoles(mode),
      communicationTools: ['chat', 'voice', 'annotations'],
      sharedWorkspace: {
        code: baseExercise.type === 'code' ? (baseExercise as CodeExercise).starterCode : undefined,
        annotations: [],
        chat: [],
        revisionHistory: [],
      },
    };

    this.collaborativeExercises.set(collabExercise.id, collabExercise);

    console.log(`✅ Collaborative exercise created (${mode})`);
    console.log(`   Participants: ${participants.length}`);

    return collabExercise;
  }

  /**
   * Add annotation to collaborative workspace
   */
  addAnnotation(
    collabExerciseId: string,
    authorId: string,
    line: number,
    text: string
  ): void {
    const exercise = this.collaborativeExercises.get(collabExerciseId);

    if (!exercise) {
      throw new Error('Collaborative exercise not found');
    }

    exercise.sharedWorkspace.annotations.push({
      id: this.generateId(),
      authorId,
      line,
      text,
      resolved: false,
      createdAt: new Date(),
    });

    console.log(`💬 Annotation added at line ${line}`);
  }

  // Helper methods

  private async executeCode(
    code: string,
    testCase: TestCase,
    language: string
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      // Simplified - in production would use sandboxed execution
      console.log(`   Running test: ${testCase.name}...`);

      // Simulate execution
      const passed = Math.random() > 0.3; // 70% pass rate for demo

      return {
        testCaseId: testCase.id,
        passed,
        actualOutput: passed ? testCase.expectedOutput : 'incorrect output',
        expectedOutput: testCase.expectedOutput,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        testCaseId: testCase.id,
        passed: false,
        actualOutput: null,
        expectedOutput: testCase.expectedOutput,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  }

  private generateCodeFeedback(
    code: string,
    testResults: TestResult[],
    exercise: CodeExercise
  ): Feedback[] {
    const feedback: Feedback[] = [];

    testResults.forEach(result => {
      if (result.passed) {
        feedback.push({
          type: 'success',
          message: `Test "${result.testCaseId}" passed`,
        });
      } else {
        feedback.push({
          type: 'error',
          message: `Test "${result.testCaseId}" failed`,
          reference: result.error,
        });
      }
    });

    return feedback;
  }

  private generateSuggestions(
    code: string,
    testResults: TestResult[]
  ): string[] {
    const suggestions: string[] = [];

    const failedTests = testResults.filter(t => !t.passed);

    if (failedTests.length > 0) {
      suggestions.push('Review the failed test cases');
      suggestions.push('Check your logic for edge cases');
    }

    if (code.length < 10) {
      suggestions.push('Your solution seems too short');
    }

    return suggestions;
  }

  private evaluateCondition(
    condition: string,
    variables: Record<string, unknown>
  ): boolean {
    // Simplified - in production would safely evaluate condition
    return Math.random() > 0.5; // 50% success rate for demo
  }

  private getDefaultRoles(mode: CollaborativeExercise['mode']): Role[] {
    if (mode === 'pair-programming') {
      return [
        {
          name: 'Driver',
          description: 'Writes the code',
          permissions: ['edit', 'run'],
          responsibilities: ['Write code', 'Implement solutions'],
        },
        {
          name: 'Navigator',
          description: 'Reviews and guides',
          permissions: ['comment', 'suggest'],
          responsibilities: ['Review code', 'Suggest improvements'],
        },
      ];
    }

    return [
      {
        name: 'Contributor',
        description: 'Team member',
        permissions: ['edit', 'comment', 'run'],
        responsibilities: ['Collaborate on solution'],
      },
    ];
  }

  private getEnvironmentFromLanguage(language: string): CodeExercise['environment'] {
    const envMap: Record<string, CodeExercise['environment']> = {
      javascript: 'browser',
      typescript: 'node',
      python: 'python',
      java: 'java',
    };

    return envMap[language] || 'browser';
  }

  private getAttempt(attemptId: string): ExerciseAttempt {
    const attempt = this.attempts.get(attemptId);
    if (!attempt) {
      throw new Error(`Attempt ${attemptId} not found`);
    }
    return attempt;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Example Usage
async function demonstrateInteractiveExercises() {
  console.log('=== Interactive Exercises Example ===\n');

  const service = new InteractiveExerciseService();

  // Create code exercise
  console.log('📝 Creating code exercise...\n');
  const codeExercise = service.createCodeExercise({
    title: 'Array Sum Function',
    description: 'Write a function that calculates the sum of an array',
    instructions: [
      'Create a function named "sumArray"',
      'It should accept an array of numbers as parameter',
      'Return the sum of all numbers in the array',
    ],
    language: 'javascript',
    starterCode: 'function sumArray(arr) {\n  // Your code here\n}',
    testCases: [
      {
        name: 'Basic sum',
        input: [1, 2, 3, 4, 5],
        expectedOutput: 15,
        isHidden: false,
        points: 5,
      },
      {
        name: 'Empty array',
        input: [],
        expectedOutput: 0,
        isHidden: false,
        points: 3,
      },
      {
        name: 'Negative numbers',
        input: [-1, -2, -3],
        expectedOutput: -6,
        isHidden: true,
        points: 2,
      },
    ],
    difficulty: 'easy',
    points: 10,
  });

  // Start attempt
  const attempt1 = service.startAttempt(codeExercise.id, 'student-001');

  // Submit code
  const codeResult = await service.submitCodeExercise(
    attempt1.id,
    'function sumArray(arr) {\n  return arr.reduce((a, b) => a + b, 0);\n}'
  );

  console.log('\n📊 Code Exercise Results:');
  console.log(`   Score: ${codeResult.score}/${codeResult.maxScore}`);
  console.log(`   Status: ${codeResult.correct ? 'PASSED ✅' : 'FAILED ❌'}`);

  // Create drag-drop exercise
  console.log('\n📝 Creating drag-drop exercise...\n');
  const dragDropExercise = service.createDragDropExercise({
    title: 'Sort Programming Concepts',
    description: 'Categorize programming concepts',
    instructions: ['Drag each item to the correct category'],
    items: [
      { content: 'for loop', correctZone: 'control-flow', category: 'syntax' },
      { content: 'array', correctZone: 'data-structures', category: 'data' },
      { content: 'if statement', correctZone: 'control-flow', category: 'syntax' },
      { content: 'object', correctZone: 'data-structures', category: 'data' },
    ],
    dropZones: [
      { id: 'control-flow', label: 'Control Flow' },
      { id: 'data-structures', label: 'Data Structures' },
    ],
    difficulty: 'easy',
    points: 8,
  });

  // Submit drag-drop
  const attempt2 = service.startAttempt(dragDropExercise.id, 'student-001');
  const dragDropResult = service.submitDragDropExercise(attempt2.id, {
    '1': 'control-flow',
    '2': 'data-structures',
    '3': 'control-flow',
    '4': 'data-structures',
  });

  console.log('\n📊 Drag-Drop Results:');
  console.log(`   Score: ${dragDropResult.score}/${dragDropResult.maxScore}`);

  // Create simulation exercise
  console.log('\n📝 Creating simulation exercise...\n');
  const simExercise = service.createSimulationExercise({
    title: 'Optimize Server Resources',
    description: 'Balance server load and response time',
    scenario: {
      title: 'Web Server Configuration',
      description: 'Configure server to handle traffic efficiently',
      initialState: { cpu: 50, memory: 60, requests: 1000 },
      visualizationType: 'chart',
    },
    variables: [
      {
        name: 'cpuCores',
        type: 'slider',
        min: 1,
        max: 16,
        step: 1,
        defaultValue: 4,
        unit: 'cores',
      },
      {
        name: 'memoryGB',
        type: 'slider',
        min: 2,
        max: 64,
        step: 2,
        defaultValue: 8,
        unit: 'GB',
      },
    ],
    goals: [
      {
        description: 'Keep response time under 100ms',
        condition: 'responseTime < 100',
        points: 5,
      },
      {
        description: 'Handle at least 5000 requests/sec',
        condition: 'requestsPerSec >= 5000',
        points: 5,
      },
    ],
    difficulty: 'medium',
    points: 10,
  });

  // Submit simulation
  const attempt3 = service.startAttempt(simExercise.id, 'student-001');
  const simResult = service.submitSimulationExercise(attempt3.id, {
    cpuCores: 8,
    memoryGB: 16,
  });

  console.log('\n📊 Simulation Results:');
  console.log(`   Score: ${simResult.score}/${simResult.maxScore}`);

  // Create collaborative exercise
  console.log('\n👥 Creating collaborative exercise...\n');
  const collabExercise = service.createCollaborativeExercise(
    codeExercise.id,
    'pair-programming',
    ['student-001', 'student-002']
  );

  service.addAnnotation(
    collabExercise.id,
    'student-002',
    5,
    'Consider using a more efficient algorithm here'
  );

  console.log('\n✅ Interactive exercises demonstration complete!');
}

// Run the example
demonstrateInteractiveExercises().catch(console.error);
