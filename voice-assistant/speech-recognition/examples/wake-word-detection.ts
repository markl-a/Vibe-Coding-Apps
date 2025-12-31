/**
 * Wake Word Detection Example
 * Demonstrates detecting specific wake words or hotwords in audio streams
 */

import { useSpeechRecognition } from '../web-speech-demo/src/hooks/useSpeechRecognition.js';

// ===== Wake Word Configuration =====

export interface WakeWordConfig {
  words: string[];
  sensitivity?: number; // 0.0 to 1.0
  threshold?: number; // Confidence threshold
  continuous?: boolean;
  onWakeWordDetected?: (word: string, confidence: number) => void;
  onError?: (error: string) => void;
}

// ===== Wake Word Detector =====

export class WakeWordDetector {
  private config: WakeWordConfig;
  private isListening = false;
  private recognition: any;
  private detectionHistory: Array<{ word: string; timestamp: number; confidence: number }> = [];

  constructor(config: WakeWordConfig) {
    this.config = {
      sensitivity: 0.8,
      threshold: 0.7,
      continuous: true,
      ...config,
    };

    this.initializeRecognition();
  }

  private initializeRecognition(): void {
    if (typeof window === 'undefined') {
      console.warn('Wake word detection not available in this environment');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 5;

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.recognition.onresult = (event: any) => {
      const results = Array.from(event.results);
      const latestResult = results[event.resultIndex];

      if (!latestResult) return;

      // Check all alternatives for wake words
      for (let i = 0; i < latestResult.length; i++) {
        const alternative = latestResult[i];
        const transcript = alternative.transcript.toLowerCase().trim();
        const confidence = alternative.confidence;

        // Check if transcript contains any wake word
        const detectedWord = this.detectWakeWord(transcript, confidence);

        if (detectedWord) {
          this.handleWakeWordDetection(detectedWord, confidence);
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Wake word detection error:', event.error);
      if (this.config.onError) {
        this.config.onError(event.error);
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if continuous mode
      if (this.config.continuous && this.isListening) {
        try {
          this.recognition.start();
        } catch (error) {
          console.error('Failed to restart wake word detection:', error);
        }
      }
    };
  }

  /**
   * Check if transcript contains a wake word
   */
  private detectWakeWord(transcript: string, confidence: number): string | null {
    if (confidence < (this.config.threshold || 0.7)) {
      return null;
    }

    for (const wakeWord of this.config.words) {
      const pattern = new RegExp(`\\b${wakeWord.toLowerCase()}\\b`, 'i');
      if (pattern.test(transcript)) {
        return wakeWord;
      }
    }

    return null;
  }

  /**
   * Handle wake word detection
   */
  private handleWakeWordDetection(word: string, confidence: number): void {
    const now = Date.now();

    // Debounce: Ignore if same word was detected very recently (within 1 second)
    const recentDetection = this.detectionHistory.find(
      (d) => d.word === word && now - d.timestamp < 1000
    );

    if (recentDetection) {
      return;
    }

    // Add to history
    this.detectionHistory.push({ word, timestamp: now, confidence });

    // Keep only last 10 detections
    if (this.detectionHistory.length > 10) {
      this.detectionHistory.shift();
    }

    console.log(`Wake word detected: "${word}" (confidence: ${confidence.toFixed(2)})`);

    // Trigger callback
    if (this.config.onWakeWordDetected) {
      this.config.onWakeWordDetected(word, confidence);
    }
  }

  /**
   * Start listening for wake words
   */
  public start(): void {
    if (!this.recognition) {
      console.error('Speech recognition not initialized');
      return;
    }

    try {
      this.isListening = true;
      this.recognition.start();
      console.log('Wake word detection started');
    } catch (error) {
      console.error('Failed to start wake word detection:', error);
    }
  }

  /**
   * Stop listening for wake words
   */
  public stop(): void {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      console.log('Wake word detection stopped');
    }
  }

  /**
   * Get detection history
   */
  public getHistory(): Array<{ word: string; timestamp: number; confidence: number }> {
    return [...this.detectionHistory];
  }

  /**
   * Clear detection history
   */
  public clearHistory(): void {
    this.detectionHistory = [];
  }
}

// ===== Advanced Wake Word System =====

export interface WakeWordPattern {
  words: string[];
  action: () => void;
  timeout?: number; // Auto-disable after timeout (ms)
}

export class AdvancedWakeWordSystem {
  private detector: WakeWordDetector;
  private patterns: Map<string, WakeWordPattern> = new Map();
  private activePattern: string | null = null;
  private timeoutHandle?: NodeJS.Timeout;

  constructor(initialPatterns: WakeWordPattern[] = []) {
    // Collect all wake words
    const allWords = initialPatterns.flatMap((p) => p.words);

    this.detector = new WakeWordDetector({
      words: allWords,
      continuous: true,
      onWakeWordDetected: (word, confidence) => {
        this.handleWakeWord(word, confidence);
      },
    });

    // Register patterns
    initialPatterns.forEach((pattern) => {
      pattern.words.forEach((word) => {
        this.patterns.set(word.toLowerCase(), pattern);
      });
    });
  }

  private handleWakeWord(word: string, confidence: number): void {
    const pattern = this.patterns.get(word.toLowerCase());

    if (!pattern) return;

    console.log(`Executing action for wake word: ${word}`);

    // Execute action
    pattern.action();

    // Set active pattern
    this.activePattern = word;

    // Set timeout if specified
    if (pattern.timeout) {
      if (this.timeoutHandle) {
        clearTimeout(this.timeoutHandle);
      }

      this.timeoutHandle = setTimeout(() => {
        this.activePattern = null;
        console.log(`Wake word "${word}" timed out`);
      }, pattern.timeout);
    }
  }

  /**
   * Register a new wake word pattern
   */
  public registerPattern(pattern: WakeWordPattern): void {
    pattern.words.forEach((word) => {
      this.patterns.set(word.toLowerCase(), pattern);
    });

    // Update detector with new words
    const allWords = Array.from(this.patterns.keys());
    this.detector.stop();
    this.detector = new WakeWordDetector({
      words: allWords,
      continuous: true,
      onWakeWordDetected: (word, confidence) => {
        this.handleWakeWord(word, confidence);
      },
    });
    this.detector.start();
  }

  /**
   * Start listening
   */
  public start(): void {
    this.detector.start();
  }

  /**
   * Stop listening
   */
  public stop(): void {
    this.detector.stop();
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
    }
  }

  /**
   * Get active pattern
   */
  public getActivePattern(): string | null {
    return this.activePattern;
  }
}

// ===== Context-Aware Wake Words =====

export interface ContextualWakeWord {
  word: string;
  contexts: string[];
  action: (context: string) => void;
}

export class ContextualWakeWordDetector {
  private detector: WakeWordDetector;
  private contextualWords: ContextualWakeWord[] = [];
  private currentContext = 'default';

  constructor(words: ContextualWakeWord[]) {
    this.contextualWords = words;

    const allWords = words.map((w) => w.word);

    this.detector = new WakeWordDetector({
      words: allWords,
      continuous: true,
      onWakeWordDetected: (word, confidence) => {
        this.handleContextualWakeWord(word, confidence);
      },
    });
  }

  private handleContextualWakeWord(word: string, confidence: number): void {
    const wakeWord = this.contextualWords.find((w) => w.word.toLowerCase() === word.toLowerCase());

    if (!wakeWord) return;

    // Check if wake word is valid in current context
    if (wakeWord.contexts.includes(this.currentContext) || wakeWord.contexts.includes('*')) {
      console.log(`Wake word "${word}" detected in context "${this.currentContext}"`);
      wakeWord.action(this.currentContext);
    } else {
      console.log(`Wake word "${word}" ignored in context "${this.currentContext}"`);
    }
  }

  /**
   * Set current context
   */
  public setContext(context: string): void {
    this.currentContext = context;
    console.log(`Context changed to: ${context}`);
  }

  /**
   * Get current context
   */
  public getContext(): string {
    return this.currentContext;
  }

  /**
   * Start listening
   */
  public start(): void {
    this.detector.start();
  }

  /**
   * Stop listening
   */
  public stop(): void {
    this.detector.stop();
  }
}

// ===== Wake Word with Confirmation =====

export class ConfirmableWakeWordDetector {
  private detector: WakeWordDetector;
  private pendingConfirmation: { word: string; timestamp: number } | null = null;
  private confirmationTimeout = 3000; // 3 seconds

  constructor(wakeWords: string[], onConfirmed: (word: string) => void) {
    this.detector = new WakeWordDetector({
      words: [...wakeWords, 'yes', 'confirm', 'no', 'cancel'],
      continuous: true,
      onWakeWordDetected: (word, confidence) => {
        this.handleWakeWord(word, confidence, onConfirmed);
      },
    });
  }

  private handleWakeWord(
    word: string,
    confidence: number,
    onConfirmed: (word: string) => void
  ): void {
    const confirmWords = ['yes', 'confirm'];
    const cancelWords = ['no', 'cancel'];

    // Check if this is a confirmation
    if (this.pendingConfirmation && confirmWords.includes(word.toLowerCase())) {
      console.log(`Wake word "${this.pendingConfirmation.word}" confirmed`);
      onConfirmed(this.pendingConfirmation.word);
      this.pendingConfirmation = null;
      return;
    }

    // Check if this is a cancellation
    if (this.pendingConfirmation && cancelWords.includes(word.toLowerCase())) {
      console.log(`Wake word "${this.pendingConfirmation.word}" cancelled`);
      this.pendingConfirmation = null;
      return;
    }

    // Set pending confirmation
    if (!confirmWords.includes(word.toLowerCase()) && !cancelWords.includes(word.toLowerCase())) {
      this.pendingConfirmation = { word, timestamp: Date.now() };
      console.log(`Wake word "${word}" detected. Say "yes" to confirm or "no" to cancel.`);

      // Auto-cancel after timeout
      setTimeout(() => {
        if (this.pendingConfirmation && this.pendingConfirmation.word === word) {
          console.log(`Wake word "${word}" confirmation timed out`);
          this.pendingConfirmation = null;
        }
      }, this.confirmationTimeout);
    }
  }

  /**
   * Start listening
   */
  public start(): void {
    this.detector.start();
  }

  /**
   * Stop listening
   */
  public stop(): void {
    this.detector.stop();
  }
}

// ===== Example Usage =====

/**
 * Example 1: Basic wake word detection
 */
export function example1_BasicWakeWord() {
  const detector = new WakeWordDetector({
    words: ['hey siri', 'ok google', 'alexa', 'hey assistant'],
    sensitivity: 0.8,
    threshold: 0.7,
    onWakeWordDetected: (word, confidence) => {
      console.log(`Wake word detected: ${word} (${(confidence * 100).toFixed(1)}% confidence)`);
      // Activate voice assistant
      activateVoiceAssistant();
    },
  });

  detector.start();
}

/**
 * Example 2: Multiple wake words with different actions
 */
export function example2_MultipleWakeWords() {
  const system = new AdvancedWakeWordSystem([
    {
      words: ['turn on lights', 'lights on'],
      action: () => {
        console.log('Turning on lights...');
        controlSmartHome('lights', 'on');
      },
    },
    {
      words: ['turn off lights', 'lights off'],
      action: () => {
        console.log('Turning off lights...');
        controlSmartHome('lights', 'off');
      },
    },
    {
      words: ['play music', 'start music'],
      action: () => {
        console.log('Playing music...');
        controlMediaPlayer('play');
      },
    },
    {
      words: ['stop music', 'pause music'],
      action: () => {
        console.log('Stopping music...');
        controlMediaPlayer('stop');
      },
    },
  ]);

  system.start();
}

/**
 * Example 3: Context-aware wake words
 */
export function example3_ContextualWakeWords() {
  const detector = new ContextualWakeWordDetector([
    {
      word: 'next',
      contexts: ['music', 'slideshow'],
      action: (context) => {
        if (context === 'music') {
          console.log('Playing next song');
          playNextSong();
        } else if (context === 'slideshow') {
          console.log('Next slide');
          nextSlide();
        }
      },
    },
    {
      word: 'previous',
      contexts: ['music', 'slideshow'],
      action: (context) => {
        if (context === 'music') {
          console.log('Playing previous song');
          playPreviousSong();
        } else if (context === 'slideshow') {
          console.log('Previous slide');
          previousSlide();
        }
      },
    },
    {
      word: 'cancel',
      contexts: ['*'], // All contexts
      action: () => {
        console.log('Operation cancelled');
        cancelOperation();
      },
    },
  ]);

  detector.start();

  // Change context based on app state
  detector.setContext('music');

  // Later...
  setTimeout(() => {
    detector.setContext('slideshow');
  }, 10000);
}

/**
 * Example 4: Wake word with confirmation
 */
export function example4_ConfirmableWakeWord() {
  const detector = new ConfirmableWakeWordDetector(
    ['delete file', 'reset settings', 'shutdown'],
    (word) => {
      console.log(`Executing confirmed action: ${word}`);

      switch (word.toLowerCase()) {
        case 'delete file':
          deleteFile();
          break;
        case 'reset settings':
          resetSettings();
          break;
        case 'shutdown':
          shutdownSystem();
          break;
      }
    }
  );

  detector.start();
}

/**
 * Example 5: Wake word with timeout
 */
export function example5_TimeoutWakeWord() {
  const system = new AdvancedWakeWordSystem([
    {
      words: ['activate assistant'],
      timeout: 5000, // Deactivate after 5 seconds
      action: () => {
        console.log('Assistant activated for 5 seconds');
        showAssistantUI();
      },
    },
  ]);

  system.start();
}

// Helper functions (mock implementations)
function activateVoiceAssistant(): void {
  console.log('Voice assistant activated');
}

function controlSmartHome(device: string, action: string): void {
  console.log(`Smart home control: ${device} - ${action}`);
}

function controlMediaPlayer(action: string): void {
  console.log(`Media player: ${action}`);
}

function playNextSong(): void {
  console.log('Playing next song');
}

function playPreviousSong(): void {
  console.log('Playing previous song');
}

function nextSlide(): void {
  console.log('Next slide');
}

function previousSlide(): void {
  console.log('Previous slide');
}

function cancelOperation(): void {
  console.log('Operation cancelled');
}

function deleteFile(): void {
  console.log('File deleted');
}

function resetSettings(): void {
  console.log('Settings reset');
}

function shutdownSystem(): void {
  console.log('System shutting down');
}

function showAssistantUI(): void {
  console.log('Assistant UI shown');
}

/**
 * Best Practices:
 *
 * 1. Wake Word Selection:
 *    - Use distinctive 2-3 word phrases
 *    - Avoid common words to reduce false positives
 *    - Test with different accents and pronunciations
 *
 * 2. Sensitivity Tuning:
 *    - Higher threshold = fewer false positives, more false negatives
 *    - Lower threshold = more false positives, fewer false negatives
 *    - Tune based on environment (noisy vs quiet)
 *
 * 3. User Feedback:
 *    - Provide visual/audio confirmation when wake word is detected
 *    - Show confidence level to user
 *    - Allow users to adjust sensitivity
 *
 * 4. Privacy:
 *    - Only process audio locally when possible
 *    - Clear indication when listening
 *    - Easy way to disable wake word detection
 *
 * 5. Performance:
 *    - Use debouncing to avoid multiple triggers
 *    - Implement timeouts for stateful wake words
 *    - Monitor battery usage in continuous mode
 */
