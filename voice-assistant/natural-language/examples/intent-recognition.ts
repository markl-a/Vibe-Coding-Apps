/**
 * Intent Recognition Example
 * Demonstrates recognizing user intents from natural language input
 */

// ===== Intent Configuration =====

export interface Intent {
  name: string;
  description: string;
  patterns: string[];
  parameters?: IntentParameter[];
  action: (params: Record<string, any>) => void;
}

export interface IntentParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'time' | 'entity';
  required: boolean;
  prompt?: string;
}

export interface IntentMatch {
  intent: string;
  confidence: number;
  parameters: Record<string, any>;
}

// ===== Intent Recognizer =====

export class IntentRecognizer {
  private intents: Map<string, Intent> = new Map();
  private confidenceThreshold = 0.6;

  /**
   * Register an intent
   */
  public registerIntent(intent: Intent): void {
    this.intents.set(intent.name, intent);
    console.log(`Intent registered: ${intent.name}`);
  }

  /**
   * Register multiple intents
   */
  public registerIntents(intents: Intent[]): void {
    intents.forEach((intent) => this.registerIntent(intent));
  }

  /**
   * Recognize intent from user input
   */
  public recognize(input: string): IntentMatch | null {
    const normalizedInput = this.normalizeInput(input);
    let bestMatch: IntentMatch | null = null;
    let highestConfidence = 0;

    // Check each intent
    this.intents.forEach((intent) => {
      const match = this.matchIntent(normalizedInput, intent);

      if (match && match.confidence > highestConfidence) {
        highestConfidence = match.confidence;
        bestMatch = match;
      }
    });

    // Return match if above threshold
    if (bestMatch && bestMatch.confidence >= this.confidenceThreshold) {
      return bestMatch;
    }

    return null;
  }

  /**
   * Match input against an intent
   */
  private matchIntent(input: string, intent: Intent): IntentMatch | null {
    let bestConfidence = 0;
    let parameters: Record<string, any> = {};

    // Try to match against each pattern
    for (const pattern of intent.patterns) {
      const result = this.matchPattern(input, pattern, intent.parameters);

      if (result && result.confidence > bestConfidence) {
        bestConfidence = result.confidence;
        parameters = result.parameters;
      }
    }

    if (bestConfidence === 0) {
      return null;
    }

    return {
      intent: intent.name,
      confidence: bestConfidence,
      parameters,
    };
  }

  /**
   * Match input against a pattern
   */
  private matchPattern(
    input: string,
    pattern: string,
    parameters?: IntentParameter[]
  ): { confidence: number; parameters: Record<string, any> } | null {
    // Convert pattern to regex
    const regex = this.patternToRegex(pattern, parameters);
    const match = input.match(regex);

    if (!match) {
      return null;
    }

    // Calculate confidence based on match quality
    const confidence = this.calculateConfidence(input, match[0]);

    // Extract parameters
    const extractedParams: Record<string, any> = {};
    if (parameters && match.groups) {
      parameters.forEach((param) => {
        if (match.groups![param.name]) {
          extractedParams[param.name] = this.parseParameter(
            match.groups![param.name],
            param.type
          );
        }
      });
    }

    return { confidence, parameters: extractedParams };
  }

  /**
   * Convert pattern to regex
   */
  private patternToRegex(pattern: string, parameters?: IntentParameter[]): RegExp {
    let regexPattern = pattern;

    // Replace parameter placeholders with capture groups
    if (parameters) {
      parameters.forEach((param) => {
        const placeholder = `{${param.name}}`;
        let captureGroup = '';

        switch (param.type) {
          case 'number':
            captureGroup = `(?<${param.name}>\\d+(?:\\.\\d+)?)`;
            break;
          case 'date':
            captureGroup = `(?<${param.name}>\\d{1,2}[/-]\\d{1,2}(?:[/-]\\d{2,4})?)`;
            break;
          case 'time':
            captureGroup = `(?<${param.name}>\\d{1,2}:\\d{2}(?:\\s*(?:AM|PM))?)`;
            break;
          default:
            captureGroup = `(?<${param.name}>[\\w\\s]+?)`;
        }

        regexPattern = regexPattern.replace(placeholder, captureGroup);
      });
    }

    // Escape special regex characters except our capture groups
    regexPattern = regexPattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\\\(?=\()/g, '');

    // Make pattern flexible with optional words
    regexPattern = regexPattern.replace(/\s+/g, '\\s+');

    return new RegExp(regexPattern, 'i');
  }

  /**
   * Parse parameter value based on type
   */
  private parseParameter(value: string, type: string): any {
    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'date':
        return new Date(value);
      case 'time':
        return value; // Could parse into time object
      default:
        return value.trim();
    }
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(input: string, match: string): number {
    // Simple confidence based on match length vs input length
    const matchRatio = match.length / input.length;

    // Boost confidence if match is exact
    if (match.toLowerCase() === input.toLowerCase()) {
      return 1.0;
    }

    // Base confidence on how much of the input was matched
    return Math.min(matchRatio * 1.2, 0.99);
  }

  /**
   * Normalize user input
   */
  private normalizeInput(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[.,!?]+$/g, '') // Remove trailing punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Set confidence threshold
   */
  public setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = threshold;
  }

  /**
   * Get all registered intents
   */
  public getIntents(): Intent[] {
    return Array.from(this.intents.values());
  }
}

// ===== Advanced Intent Recognizer with ML-like Features =====

export class AdvancedIntentRecognizer extends IntentRecognizer {
  private trainingData: Map<string, string[]> = new Map();

  /**
   * Train intent with example utterances
   */
  public train(intentName: string, examples: string[]): void {
    this.trainingData.set(intentName, examples);
    console.log(`Trained ${intentName} with ${examples.length} examples`);
  }

  /**
   * Enhanced recognition using training data
   */
  public recognize(input: string): IntentMatch | null {
    // First try pattern-based recognition
    let match = super.recognize(input);

    if (match && match.confidence > 0.8) {
      return match;
    }

    // Try similarity-based matching with training data
    const similarityMatch = this.recognizeBySimilarity(input);

    // Return best match
    if (!match || (similarityMatch && similarityMatch.confidence > match.confidence)) {
      return similarityMatch;
    }

    return match;
  }

  /**
   * Recognize intent by similarity to training examples
   */
  private recognizeBySimilarity(input: string): IntentMatch | null {
    let bestMatch: IntentMatch | null = null;
    let highestSimilarity = 0;

    this.trainingData.forEach((examples, intentName) => {
      examples.forEach((example) => {
        const similarity = this.calculateSimilarity(input, example);

        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatch = {
            intent: intentName,
            confidence: similarity,
            parameters: {},
          };
        }
      });
    });

    return bestMatch;
  }

  /**
   * Calculate string similarity (Levenshtein-based)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Levenshtein distance algorithm
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        const cost = str1[j - 1] === str2[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}

// ===== Contextual Intent Recognizer =====

export interface ConversationContext {
  previousIntent?: string;
  parameters: Record<string, any>;
  topic?: string;
}

export class ContextualIntentRecognizer extends AdvancedIntentRecognizer {
  private context: ConversationContext = { parameters: {} };

  /**
   * Recognize intent with context awareness
   */
  public recognizeWithContext(input: string): IntentMatch | null {
    const match = this.recognize(input);

    if (!match) {
      return null;
    }

    // Merge context parameters with recognized parameters
    const enhancedMatch: IntentMatch = {
      ...match,
      parameters: {
        ...this.context.parameters,
        ...match.parameters,
      },
    };

    // Update context
    this.context.previousIntent = match.intent;
    this.context.parameters = enhancedMatch.parameters;

    return enhancedMatch;
  }

  /**
   * Set conversation context
   */
  public setContext(context: Partial<ConversationContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Get current context
   */
  public getContext(): ConversationContext {
    return { ...this.context };
  }

  /**
   * Clear context
   */
  public clearContext(): void {
    this.context = { parameters: {} };
  }
}

// ===== Example Usage =====

/**
 * Example 1: Basic intent recognition
 */
export function example1_BasicIntents() {
  const recognizer = new IntentRecognizer();

  // Register intents
  recognizer.registerIntents([
    {
      name: 'greeting',
      description: 'User greets the assistant',
      patterns: ['hello', 'hi', 'hey', 'good morning', 'good evening'],
      action: () => {
        console.log('Action: Greet user back');
        speak('Hello! How can I help you today?');
      },
    },
    {
      name: 'weather',
      description: 'User asks about weather',
      patterns: [
        'what is the weather',
        'how is the weather',
        'weather forecast',
        'is it going to rain',
      ],
      action: () => {
        console.log('Action: Get weather information');
        getWeather();
      },
    },
    {
      name: 'time',
      description: 'User asks for time',
      patterns: ['what time is it', 'tell me the time', 'current time'],
      action: () => {
        console.log('Action: Tell current time');
        const time = new Date().toLocaleTimeString();
        speak(`The current time is ${time}`);
      },
    },
  ]);

  // Test recognition
  const tests = [
    'Hello there',
    'What is the weather like today?',
    'Can you tell me the time?',
  ];

  tests.forEach((input) => {
    const match = recognizer.recognize(input);
    console.log(`Input: "${input}"`);
    console.log('Match:', match);
    console.log('---');

    if (match) {
      const intent = recognizer.getIntents().find((i) => i.name === match.intent);
      intent?.action(match.parameters);
    }
  });
}

/**
 * Example 2: Intent with parameters
 */
export function example2_ParameterExtraction() {
  const recognizer = new IntentRecognizer();

  recognizer.registerIntents([
    {
      name: 'set_timer',
      description: 'Set a timer',
      patterns: [
        'set a timer for {duration} minutes',
        'set timer {duration} minutes',
        'timer for {duration} minutes',
      ],
      parameters: [
        {
          name: 'duration',
          type: 'number',
          required: true,
          prompt: 'How many minutes?',
        },
      ],
      action: (params) => {
        console.log(`Action: Set timer for ${params.duration} minutes`);
        setTimer(params.duration);
      },
    },
    {
      name: 'play_music',
      description: 'Play music',
      patterns: [
        'play {song}',
        'play song {song}',
        'play music {song}',
        'I want to listen to {song}',
      ],
      parameters: [
        {
          name: 'song',
          type: 'string',
          required: true,
          prompt: 'What would you like to listen to?',
        },
      ],
      action: (params) => {
        console.log(`Action: Play "${params.song}"`);
        playMusic(params.song);
      },
    },
    {
      name: 'schedule_meeting',
      description: 'Schedule a meeting',
      patterns: [
        'schedule meeting at {time}',
        'schedule a meeting for {time}',
        'set up meeting at {time}',
      ],
      parameters: [
        {
          name: 'time',
          type: 'time',
          required: true,
          prompt: 'What time?',
        },
      ],
      action: (params) => {
        console.log(`Action: Schedule meeting at ${params.time}`);
        scheduleMeeting(params.time);
      },
    },
  ]);

  // Test with parameters
  const tests = [
    'Set a timer for 15 minutes',
    'Play Bohemian Rhapsody',
    'Schedule meeting at 2:30 PM',
  ];

  tests.forEach((input) => {
    const match = recognizer.recognize(input);
    console.log(`Input: "${input}"`);
    console.log('Match:', match);

    if (match) {
      const intent = recognizer.getIntents().find((i) => i.name === match.intent);
      intent?.action(match.parameters);
    }
    console.log('---');
  });
}

/**
 * Example 3: Advanced intent recognition with training
 */
export function example3_TrainedRecognition() {
  const recognizer = new AdvancedIntentRecognizer();

  // Register intents
  recognizer.registerIntent({
    name: 'book_flight',
    description: 'Book a flight',
    patterns: ['book flight', 'book a flight', 'I want to book a flight'],
    action: (params) => {
      console.log('Action: Book flight');
      bookFlight(params);
    },
  });

  // Train with examples
  recognizer.train('book_flight', [
    'I need to book a flight',
    'Can you help me book a flight?',
    'I would like to fly',
    'Book me a plane ticket',
    'I want to travel by air',
    'Reserve a flight for me',
  ]);

  // Test with variations
  const tests = [
    'I need to book a flight',
    'Help me book a plane ticket',
    'I want to fly somewhere',
  ];

  tests.forEach((input) => {
    const match = recognizer.recognize(input);
    console.log(`Input: "${input}"`);
    console.log('Match:', match);
    console.log('---');
  });
}

/**
 * Example 4: Contextual intent recognition
 */
export function example4_ContextualRecognition() {
  const recognizer = new ContextualIntentRecognizer();

  recognizer.registerIntents([
    {
      name: 'weather',
      description: 'Weather query',
      patterns: ['weather in {location}', 'what is the weather in {location}'],
      parameters: [
        {
          name: 'location',
          type: 'string',
          required: true,
        },
      ],
      action: (params) => {
        console.log(`Action: Get weather for ${params.location}`);
      },
    },
    {
      name: 'weather_tomorrow',
      description: 'Weather query for tomorrow',
      patterns: ['what about tomorrow', 'how about tomorrow', 'tomorrow'],
      action: (params) => {
        console.log(`Action: Get weather for tomorrow in ${params.location}`);
      },
    },
  ]);

  // Simulate conversation
  console.log('User: What is the weather in New York?');
  let match = recognizer.recognizeWithContext('What is the weather in New York?');
  console.log('Match:', match);
  console.log('Context:', recognizer.getContext());

  console.log('\nUser: What about tomorrow?');
  match = recognizer.recognizeWithContext('What about tomorrow?');
  console.log('Match:', match); // Should use location from context
  console.log('Context:', recognizer.getContext());
}

/**
 * Example 5: Multi-domain intent recognition
 */
export function example5_MultiDomain() {
  const recognizer = new AdvancedIntentRecognizer();

  // Smart home domain
  recognizer.registerIntents([
    {
      name: 'smart_home.lights_on',
      description: 'Turn on lights',
      patterns: ['turn on the lights', 'lights on', 'turn on lights in {room}'],
      parameters: [{ name: 'room', type: 'string', required: false }],
      action: (params) => {
        const room = params.room || 'all rooms';
        console.log(`Action: Turn on lights in ${room}`);
      },
    },
    {
      name: 'smart_home.temperature',
      description: 'Set temperature',
      patterns: ['set temperature to {temp}', 'set thermostat to {temp}'],
      parameters: [{ name: 'temp', type: 'number', required: true }],
      action: (params) => {
        console.log(`Action: Set temperature to ${params.temp}°`);
      },
    },
  ]);

  // Media domain
  recognizer.registerIntents([
    {
      name: 'media.play',
      description: 'Play media',
      patterns: ['play {media}', 'start {media}'],
      parameters: [{ name: 'media', type: 'string', required: true }],
      action: (params) => {
        console.log(`Action: Play ${params.media}`);
      },
    },
    {
      name: 'media.volume',
      description: 'Set volume',
      patterns: ['set volume to {level}', 'volume {level}'],
      parameters: [{ name: 'level', type: 'number', required: true }],
      action: (params) => {
        console.log(`Action: Set volume to ${params.level}`);
      },
    },
  ]);

  // Test multi-domain
  const tests = [
    'Turn on lights in bedroom',
    'Set temperature to 72',
    'Play my playlist',
    'Set volume to 50',
  ];

  tests.forEach((input) => {
    const match = recognizer.recognize(input);
    console.log(`Input: "${input}"`);
    console.log('Match:', match);

    if (match) {
      const intent = recognizer.getIntents().find((i) => i.name === match.intent);
      intent?.action(match.parameters);
    }
    console.log('---');
  });
}

// Helper functions
function speak(text: string): void {
  console.log(`Speaking: "${text}"`);
}

function getWeather(): void {
  console.log('Getting weather information...');
}

function setTimer(minutes: number): void {
  console.log(`Timer set for ${minutes} minutes`);
}

function playMusic(song: string): void {
  console.log(`Playing: ${song}`);
}

function scheduleMeeting(time: string): void {
  console.log(`Meeting scheduled at ${time}`);
}

function bookFlight(params: any): void {
  console.log('Booking flight...', params);
}

/**
 * Best Practices:
 *
 * 1. Intent Design:
 *    - Keep intents focused and specific
 *    - Use clear, descriptive names
 *    - Define comprehensive pattern variations
 *
 * 2. Parameter Extraction:
 *    - Define required vs optional parameters
 *    - Provide clear prompts for missing parameters
 *    - Validate parameter types and values
 *
 * 3. Training Data:
 *    - Provide diverse training examples
 *    - Include common variations and phrasings
 *    - Regularly update based on user interactions
 *
 * 4. Context Management:
 *    - Maintain conversation context
 *    - Use context to resolve ambiguities
 *    - Clear context when appropriate
 *
 * 5. Error Handling:
 *    - Handle unrecognized intents gracefully
 *    - Provide helpful fallback responses
 *    - Allow users to rephrase or clarify
 */
