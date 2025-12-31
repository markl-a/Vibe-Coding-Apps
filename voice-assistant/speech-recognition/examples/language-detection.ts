/**
 * Language Detection Example
 * Demonstrates detecting spoken language from audio input
 */

import { useSpeechRecognition } from '../web-speech-demo/src/hooks/useSpeechRecognition.js';

// ===== Language Detection Configuration =====

export interface LanguageDetectionConfig {
  supportedLanguages?: string[];
  autoSwitch?: boolean;
  confidenceThreshold?: number;
  sampleDuration?: number; // milliseconds
  onLanguageDetected?: (language: string, confidence: number) => void;
  onLanguageChanged?: (fromLang: string, toLang: string) => void;
}

// ===== Language Detector =====

export class LanguageDetector {
  private config: LanguageDetectionConfig;
  private currentLanguage = 'en-US';
  private detectionHistory: Map<string, number> = new Map();
  private recognizers: Map<string, any> = new Map();
  private isDetecting = false;

  // Common language codes and their names
  private static SUPPORTED_LANGUAGES = {
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
    'es-ES': 'Spanish (Spain)',
    'es-MX': 'Spanish (Mexico)',
    'fr-FR': 'French',
    'de-DE': 'German',
    'it-IT': 'Italian',
    'pt-BR': 'Portuguese (Brazil)',
    'pt-PT': 'Portuguese (Portugal)',
    'ru-RU': 'Russian',
    'ja-JP': 'Japanese',
    'ko-KR': 'Korean',
    'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
    'ar-SA': 'Arabic',
    'hi-IN': 'Hindi',
    'th-TH': 'Thai',
    'vi-VN': 'Vietnamese',
    'nl-NL': 'Dutch',
    'pl-PL': 'Polish',
    'tr-TR': 'Turkish',
    'sv-SE': 'Swedish',
    'da-DK': 'Danish',
    'no-NO': 'Norwegian',
    'fi-FI': 'Finnish',
  };

  constructor(config: LanguageDetectionConfig = {}) {
    this.config = {
      supportedLanguages: Object.keys(LanguageDetector.SUPPORTED_LANGUAGES),
      autoSwitch: true,
      confidenceThreshold: 0.7,
      sampleDuration: 2000,
      ...config,
    };

    this.initializeRecognizers();
  }

  /**
   * Initialize speech recognizers for each supported language
   */
  private initializeRecognizers(): void {
    if (typeof window === 'undefined') {
      console.warn('Language detection not available in this environment');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    // Create recognizer for each language
    this.config.supportedLanguages?.forEach((lang) => {
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      this.recognizers.set(lang, recognition);
    });
  }

  /**
   * Detect language from audio sample
   */
  public async detectLanguage(): Promise<{ language: string; confidence: number }> {
    if (this.isDetecting) {
      throw new Error('Detection already in progress');
    }

    this.isDetecting = true;
    const detectionPromises: Promise<{ language: string; confidence: number }>[] = [];

    // Try recognition with each language
    this.recognizers.forEach((recognition, language) => {
      const promise = new Promise<{ language: string; confidence: number }>((resolve) => {
        let resolved = false;

        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve({ language, confidence: 0 });
          }
        }, this.config.sampleDuration);

        recognition.onresult = (event: any) => {
          if (resolved) return;

          const result = event.results[0];
          if (result && result[0]) {
            resolved = true;
            clearTimeout(timeout);
            recognition.stop();
            resolve({
              language,
              confidence: result[0].confidence || 0,
            });
          }
        };

        recognition.onerror = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve({ language, confidence: 0 });
          }
        };

        try {
          recognition.start();
        } catch (error) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve({ language, confidence: 0 });
          }
        }
      });

      detectionPromises.push(promise);
    });

    // Wait for all recognizers to finish or timeout
    const results = await Promise.all(detectionPromises);

    // Find language with highest confidence
    const bestMatch = results.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    this.isDetecting = false;

    // Update detection history
    this.detectionHistory.set(bestMatch.language, bestMatch.confidence);

    // Trigger callbacks
    if (bestMatch.confidence >= (this.config.confidenceThreshold || 0.7)) {
      if (this.config.onLanguageDetected) {
        this.config.onLanguageDetected(bestMatch.language, bestMatch.confidence);
      }

      // Auto-switch if enabled
      if (this.config.autoSwitch && bestMatch.language !== this.currentLanguage) {
        const prevLanguage = this.currentLanguage;
        this.currentLanguage = bestMatch.language;

        if (this.config.onLanguageChanged) {
          this.config.onLanguageChanged(prevLanguage, bestMatch.language);
        }
      }
    }

    return bestMatch;
  }

  /**
   * Get current detected language
   */
  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Get language name from code
   */
  public static getLanguageName(code: string): string {
    return LanguageDetector.SUPPORTED_LANGUAGES[code as keyof typeof LanguageDetector.SUPPORTED_LANGUAGES] || code;
  }

  /**
   * Get detection history
   */
  public getDetectionHistory(): Map<string, number> {
    return new Map(this.detectionHistory);
  }

  /**
   * Clear detection history
   */
  public clearHistory(): void {
    this.detectionHistory.clear();
  }

  /**
   * Set current language manually
   */
  public setLanguage(language: string): void {
    const prevLanguage = this.currentLanguage;
    this.currentLanguage = language;

    if (this.config.onLanguageChanged) {
      this.config.onLanguageChanged(prevLanguage, language);
    }
  }
}

// ===== Continuous Language Detection =====

export class ContinuousLanguageDetector {
  private detector: LanguageDetector;
  private intervalHandle?: NodeJS.Timeout;
  private detectionInterval = 5000; // 5 seconds

  constructor(config: LanguageDetectionConfig = {}) {
    this.detector = new LanguageDetector(config);
  }

  /**
   * Start continuous language detection
   */
  public start(interval?: number): void {
    if (interval) {
      this.detectionInterval = interval;
    }

    this.intervalHandle = setInterval(async () => {
      try {
        await this.detector.detectLanguage();
      } catch (error) {
        console.error('Language detection error:', error);
      }
    }, this.detectionInterval);

    console.log('Continuous language detection started');
  }

  /**
   * Stop continuous language detection
   */
  public stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
      console.log('Continuous language detection stopped');
    }
  }

  /**
   * Get current language
   */
  public getCurrentLanguage(): string {
    return this.detector.getCurrentLanguage();
  }

  /**
   * Get detector instance
   */
  public getDetector(): LanguageDetector {
    return this.detector;
  }
}

// ===== Statistical Language Detection =====

export class StatisticalLanguageDetector {
  private samples: Array<{ language: string; confidence: number; timestamp: number }> = [];
  private maxSamples = 10;
  private detector: LanguageDetector;

  constructor(config: LanguageDetectionConfig = {}) {
    this.detector = new LanguageDetector({
      ...config,
      onLanguageDetected: (language, confidence) => {
        this.addSample(language, confidence);
        config.onLanguageDetected?.(language, confidence);
      },
    });
  }

  /**
   * Add detection sample
   */
  private addSample(language: string, confidence: number): void {
    this.samples.push({
      language,
      confidence,
      timestamp: Date.now(),
    });

    // Keep only recent samples
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  /**
   * Detect language with statistical analysis
   */
  public async detectLanguage(): Promise<{ language: string; confidence: number }> {
    const result = await this.detector.detectLanguage();
    return this.getMostLikelyLanguage();
  }

  /**
   * Get most likely language based on recent samples
   */
  public getMostLikelyLanguage(): { language: string; confidence: number } {
    if (this.samples.length === 0) {
      return { language: 'en-US', confidence: 0 };
    }

    // Calculate weighted average for each language
    const languageScores = new Map<string, number>();

    this.samples.forEach((sample) => {
      const currentScore = languageScores.get(sample.language) || 0;
      languageScores.set(sample.language, currentScore + sample.confidence);
    });

    // Find language with highest score
    let bestLanguage = 'en-US';
    let bestScore = 0;

    languageScores.forEach((score, language) => {
      if (score > bestScore) {
        bestScore = score;
        bestLanguage = language;
      }
    });

    const avgConfidence = bestScore / this.samples.length;

    return { language: bestLanguage, confidence: avgConfidence };
  }

  /**
   * Get detection samples
   */
  public getSamples(): Array<{ language: string; confidence: number; timestamp: number }> {
    return [...this.samples];
  }

  /**
   * Clear samples
   */
  public clearSamples(): void {
    this.samples = [];
  }

  /**
   * Set maximum number of samples to keep
   */
  public setMaxSamples(max: number): void {
    this.maxSamples = max;

    // Trim existing samples if needed
    while (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }
}

// ===== Multi-Speaker Language Detection =====

export interface SpeakerLanguage {
  speakerId: string;
  language: string;
  confidence: number;
  lastDetected: number;
}

export class MultiSpeakerLanguageDetector {
  private speakers: Map<string, SpeakerLanguage> = new Map();
  private currentSpeaker: string | null = null;
  private detector: LanguageDetector;

  constructor(config: LanguageDetectionConfig = {}) {
    this.detector = new LanguageDetector(config);
  }

  /**
   * Detect language for a specific speaker
   */
  public async detectSpeakerLanguage(speakerId: string): Promise<SpeakerLanguage> {
    this.currentSpeaker = speakerId;

    const result = await this.detector.detectLanguage();

    const speakerLanguage: SpeakerLanguage = {
      speakerId,
      language: result.language,
      confidence: result.confidence,
      lastDetected: Date.now(),
    };

    this.speakers.set(speakerId, speakerLanguage);

    return speakerLanguage;
  }

  /**
   * Get language for a specific speaker
   */
  public getSpeakerLanguage(speakerId: string): SpeakerLanguage | undefined {
    return this.speakers.get(speakerId);
  }

  /**
   * Get all speakers
   */
  public getAllSpeakers(): SpeakerLanguage[] {
    return Array.from(this.speakers.values());
  }

  /**
   * Remove speaker
   */
  public removeSpeaker(speakerId: string): void {
    this.speakers.delete(speakerId);
  }

  /**
   * Clear all speakers
   */
  public clearSpeakers(): void {
    this.speakers.clear();
  }
}

// ===== Example Usage =====

/**
 * Example 1: Basic language detection
 */
export async function example1_BasicDetection() {
  const detector = new LanguageDetector({
    supportedLanguages: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP'],
    confidenceThreshold: 0.7,
    onLanguageDetected: (language, confidence) => {
      const languageName = LanguageDetector.getLanguageName(language);
      console.log(`Detected language: ${languageName} (${(confidence * 100).toFixed(1)}% confidence)`);
    },
  });

  try {
    const result = await detector.detectLanguage();
    console.log('Detection result:', result);
  } catch (error) {
    console.error('Detection failed:', error);
  }
}

/**
 * Example 2: Auto-switching language
 */
export async function example2_AutoSwitch() {
  const detector = new LanguageDetector({
    supportedLanguages: ['en-US', 'es-ES', 'fr-FR', 'de-DE'],
    autoSwitch: true,
    onLanguageChanged: (fromLang, toLang) => {
      console.log(`Language switched from ${LanguageDetector.getLanguageName(fromLang)} to ${LanguageDetector.getLanguageName(toLang)}`);
      updateUILanguage(toLang);
    },
  });

  // Detect every 3 seconds
  setInterval(async () => {
    await detector.detectLanguage();
  }, 3000);
}

/**
 * Example 3: Continuous detection with statistics
 */
export function example3_StatisticalDetection() {
  const detector = new StatisticalLanguageDetector({
    supportedLanguages: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'zh-CN'],
    confidenceThreshold: 0.6,
  });

  detector.setMaxSamples(15);

  // Detect periodically
  const interval = setInterval(async () => {
    await detector.detectLanguage();

    // Get most likely language based on statistics
    const mostLikely = detector.getMostLikelyLanguage();
    console.log(`Most likely language: ${LanguageDetector.getLanguageName(mostLikely.language)}`);
    console.log(`Average confidence: ${(mostLikely.confidence * 100).toFixed(1)}%`);

    // Show samples
    const samples = detector.getSamples();
    console.log('Recent samples:', samples);
  }, 5000);

  // Stop after 1 minute
  setTimeout(() => {
    clearInterval(interval);
  }, 60000);
}

/**
 * Example 4: Multi-speaker language detection
 */
export async function example4_MultiSpeaker() {
  const detector = new MultiSpeakerLanguageDetector({
    supportedLanguages: ['en-US', 'es-ES', 'fr-FR', 'de-DE'],
  });

  // Detect language for different speakers
  const speaker1 = await detector.detectSpeakerLanguage('speaker-1');
  console.log(`Speaker 1 speaks: ${LanguageDetector.getLanguageName(speaker1.language)}`);

  // Wait a bit for next speaker
  setTimeout(async () => {
    const speaker2 = await detector.detectSpeakerLanguage('speaker-2');
    console.log(`Speaker 2 speaks: ${LanguageDetector.getLanguageName(speaker2.language)}`);

    // Show all speakers
    const allSpeakers = detector.getAllSpeakers();
    console.log('All speakers:', allSpeakers);
  }, 3000);
}

/**
 * Example 5: Language detection with UI integration
 */
export function example5_UIIntegration() {
  let currentDetector: ContinuousLanguageDetector | null = null;

  // Start detection button
  const startButton = document.getElementById('start-detection');
  startButton?.addEventListener('click', () => {
    currentDetector = new ContinuousLanguageDetector({
      supportedLanguages: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP'],
      autoSwitch: true,
      onLanguageDetected: (language, confidence) => {
        updateLanguageDisplay(language, confidence);
      },
      onLanguageChanged: (fromLang, toLang) => {
        showLanguageChangeNotification(fromLang, toLang);
      },
    });

    currentDetector.start(3000); // Detect every 3 seconds
  });

  // Stop detection button
  const stopButton = document.getElementById('stop-detection');
  stopButton?.addEventListener('click', () => {
    currentDetector?.stop();
    currentDetector = null;
  });
}

// Helper functions
function updateUILanguage(language: string): void {
  console.log(`Updating UI to language: ${language}`);
  // Implementation: Change UI language, load translations, etc.
}

function updateLanguageDisplay(language: string, confidence: number): void {
  const display = document.getElementById('language-display');
  if (display) {
    const languageName = LanguageDetector.getLanguageName(language);
    display.textContent = `${languageName} (${(confidence * 100).toFixed(1)}%)`;
  }
}

function showLanguageChangeNotification(fromLang: string, toLang: string): void {
  const from = LanguageDetector.getLanguageName(fromLang);
  const to = LanguageDetector.getLanguageName(toLang);
  console.log(`Language changed: ${from} → ${to}`);
  // Implementation: Show toast notification, etc.
}

/**
 * Advanced Features:
 *
 * 1. Text-based language detection (complementary):
 */
export function detectLanguageFromText(text: string): string {
  // Common words in different languages
  const languagePatterns = {
    'en-US': /\b(the|is|are|was|were|have|has|will|can|would)\b/i,
    'es-ES': /\b(el|la|los|las|es|son|fue|fueron|tiene|tienen)\b/i,
    'fr-FR': /\b(le|la|les|est|sont|était|étaient|avoir|être)\b/i,
    'de-DE': /\b(der|die|das|ist|sind|war|waren|haben|sein)\b/i,
    'ja-JP': /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,
    'zh-CN': /[\u4E00-\u9FFF]/,
    'ar-SA': /[\u0600-\u06FF]/,
    'ru-RU': /[\u0400-\u04FF]/,
  };

  for (const [language, pattern] of Object.entries(languagePatterns)) {
    if (pattern.test(text)) {
      return language;
    }
  }

  return 'en-US'; // Default
}

/**
 * Integration Tips:
 *
 * 1. Performance Optimization:
 *    - Use appropriate detection intervals
 *    - Cache detection results
 *    - Implement confidence thresholds
 *
 * 2. Accuracy Improvement:
 *    - Combine audio and text-based detection
 *    - Use statistical analysis over multiple samples
 *    - Consider user's preferred languages
 *
 * 3. User Experience:
 *    - Show visual feedback during detection
 *    - Allow manual language selection
 *    - Smooth transitions between languages
 *
 * 4. Privacy:
 *    - Process audio locally when possible
 *    - Clear indication when detecting
 *    - Allow users to disable auto-detection
 */
