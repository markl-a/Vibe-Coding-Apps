/**
 * Speech-to-Text Example
 * Demonstrates converting speech to text using Web Speech API and external APIs
 */

import { useSpeechRecognition } from '../web-speech-demo/src/hooks/useSpeechRecognition.js';

// ===== Web Speech API Implementation =====

/**
 * Basic speech-to-text using Web Speech API
 */
export function basicSpeechToText() {
  const recognition = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    lang: 'en-US',
    onResult: (transcript, isFinal) => {
      if (isFinal) {
        console.log('Final transcript:', transcript);
      } else {
        console.log('Interim transcript:', transcript);
      }
    },
    onError: (error) => {
      console.error('Speech recognition error:', error);
    },
  });

  return recognition;
}

// ===== Advanced Speech-to-Text Configuration =====

export interface SpeechToTextConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  punctuation?: boolean;
  profanityFilter?: boolean;
  enableAutomaticPunctuation?: boolean;
}

export class SpeechToTextService {
  private recognition: any;
  private isListening = false;
  private transcript = '';
  private config: SpeechToTextConfig;

  constructor(config: SpeechToTextConfig = {}) {
    this.config = {
      language: 'en-US',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      punctuation: true,
      profanityFilter: false,
      enableAutomaticPunctuation: true,
      ...config,
    };

    this.initializeRecognition();
  }

  private initializeRecognition(): void {
    if (typeof window === 'undefined') {
      console.warn('Speech recognition not available in this environment');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.lang = this.config.language;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('Speech recognition started');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('Speech recognition ended');
    };

    this.recognition.onresult = (event: any) => {
      const results = Array.from(event.results);

      // Get all alternatives for the latest result
      const latestResult = results[event.resultIndex];
      const alternatives = Array.from(latestResult as any).map((alt: any) => ({
        transcript: alt.transcript,
        confidence: alt.confidence,
      }));

      // Use the best alternative
      const bestAlternative = alternatives[0];

      if (latestResult.isFinal) {
        this.transcript += bestAlternative.transcript + ' ';
        this.onFinalResult(bestAlternative.transcript, alternatives);
      } else {
        this.onInterimResult(bestAlternative.transcript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.onError(event.error);
    };
  }

  /**
   * Start listening for speech
   */
  public start(): void {
    if (!this.recognition) {
      console.error('Speech recognition not initialized');
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
    }
  }

  /**
   * Stop listening for speech
   */
  public stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Reset transcript
   */
  public reset(): void {
    this.transcript = '';
  }

  /**
   * Get current transcript
   */
  public getTranscript(): string {
    return this.transcript;
  }

  /**
   * Change recognition language
   */
  public setLanguage(language: string): void {
    this.config.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  // Override these methods in your implementation
  protected onFinalResult(transcript: string, alternatives: any[]): void {
    console.log('Final result:', transcript);
    console.log('Alternatives:', alternatives);
  }

  protected onInterimResult(transcript: string): void {
    console.log('Interim result:', transcript);
  }

  protected onError(error: string): void {
    console.error('Error:', error);
  }
}

// ===== Real-time Transcription with Streaming =====

export class StreamingSpeechToText extends SpeechToTextService {
  private onTranscriptCallback?: (text: string, isFinal: boolean) => void;
  private onAlternativesCallback?: (alternatives: any[]) => void;

  /**
   * Set callback for transcript updates
   */
  public onTranscript(callback: (text: string, isFinal: boolean) => void): void {
    this.onTranscriptCallback = callback;
  }

  /**
   * Set callback for alternatives
   */
  public onAlternatives(callback: (alternatives: any[]) => void): void {
    this.onAlternativesCallback = callback;
  }

  protected onFinalResult(transcript: string, alternatives: any[]): void {
    if (this.onTranscriptCallback) {
      this.onTranscriptCallback(transcript, true);
    }
    if (this.onAlternativesCallback) {
      this.onAlternativesCallback(alternatives);
    }
  }

  protected onInterimResult(transcript: string): void {
    if (this.onTranscriptCallback) {
      this.onTranscriptCallback(transcript, false);
    }
  }
}

// ===== Multi-Language Speech-to-Text =====

export class MultiLanguageSpeechToText {
  private services: Map<string, SpeechToTextService> = new Map();
  private currentLanguage = 'en-US';

  constructor(languages: string[]) {
    languages.forEach((lang) => {
      this.services.set(lang, new SpeechToTextService({ language: lang }));
    });
  }

  /**
   * Switch to a different language
   */
  public switchLanguage(language: string): void {
    const currentService = this.services.get(this.currentLanguage);
    if (currentService) {
      currentService.stop();
    }

    this.currentLanguage = language;
    const newService = this.services.get(language);

    if (!newService) {
      console.error(`Language ${language} not supported`);
      return;
    }

    newService.start();
  }

  /**
   * Get current language
   */
  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Get transcript for a specific language
   */
  public getTranscript(language?: string): string {
    const service = this.services.get(language || this.currentLanguage);
    return service ? service.getTranscript() : '';
  }
}

// ===== External API Integration (e.g., Google Cloud Speech-to-Text) =====

export interface CloudSpeechConfig {
  apiKey: string;
  language?: string;
  encoding?: 'LINEAR16' | 'FLAC' | 'MULAW' | 'AMR' | 'OGG_OPUS' | 'WEBM_OPUS';
  sampleRateHertz?: number;
  enableAutomaticPunctuation?: boolean;
  enableWordTimeOffsets?: boolean;
  enableSpeakerDiarization?: boolean;
  diarizationSpeakerCount?: number;
}

export class CloudSpeechToText {
  private config: CloudSpeechConfig;
  private mediaRecorder?: MediaRecorder;
  private audioChunks: Blob[] = [];

  constructor(config: CloudSpeechConfig) {
    this.config = {
      language: 'en-US',
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: false,
      enableSpeakerDiarization: false,
      ...config,
    };
  }

  /**
   * Start recording audio
   */
  public async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and transcribe
   */
  public async stopRecording(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const transcript = await this.transcribeAudio(audioBlob);
          resolve(transcript);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    });
  }

  /**
   * Transcribe audio blob using cloud API
   */
  private async transcribeAudio(audioBlob: Blob): Promise<string> {
    // Convert blob to base64
    const base64Audio = await this.blobToBase64(audioBlob);

    // Prepare request body
    const requestBody = {
      config: {
        encoding: this.config.encoding,
        sampleRateHertz: this.config.sampleRateHertz,
        languageCode: this.config.language,
        enableAutomaticPunctuation: this.config.enableAutomaticPunctuation,
        enableWordTimeOffsets: this.config.enableWordTimeOffsets,
        enableSpeakerDiarization: this.config.enableSpeakerDiarization,
        diarizationSpeakerCount: this.config.diarizationSpeakerCount,
      },
      audio: {
        content: base64Audio,
      },
    };

    // Call cloud API (example endpoint)
    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();

    // Extract transcript from response
    if (result.results && result.results.length > 0) {
      return result.results
        .map((r: any) => r.alternatives[0].transcript)
        .join(' ');
    }

    return '';
  }

  /**
   * Convert blob to base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// ===== Example Usage =====

/**
 * Example 1: Basic speech-to-text
 */
export function example1_BasicUsage() {
  const stt = new SpeechToTextService({
    language: 'en-US',
    continuous: true,
    interimResults: true,
  });

  // Start listening
  stt.start();

  // Stop after 10 seconds
  setTimeout(() => {
    stt.stop();
    console.log('Final transcript:', stt.getTranscript());
  }, 10000);
}

/**
 * Example 2: Real-time streaming transcription
 */
export function example2_StreamingTranscription() {
  const stt = new StreamingSpeechToText({
    language: 'en-US',
  });

  // Set up callbacks
  stt.onTranscript((text, isFinal) => {
    if (isFinal) {
      console.log('Final:', text);
      // Update UI with final transcript
      updateTranscriptUI(text, true);
    } else {
      console.log('Interim:', text);
      // Update UI with interim transcript
      updateTranscriptUI(text, false);
    }
  });

  stt.onAlternatives((alternatives) => {
    console.log('Alternative transcriptions:', alternatives);
  });

  stt.start();
}

/**
 * Example 3: Multi-language support
 */
export function example3_MultiLanguage() {
  const multiLang = new MultiLanguageSpeechToText([
    'en-US',
    'es-ES',
    'fr-FR',
    'de-DE',
    'ja-JP',
  ]);

  // Start with English
  multiLang.switchLanguage('en-US');

  // Switch to Spanish after 5 seconds
  setTimeout(() => {
    multiLang.switchLanguage('es-ES');
    console.log('Switched to Spanish');
  }, 5000);

  // Switch to Japanese after 10 seconds
  setTimeout(() => {
    multiLang.switchLanguage('ja-JP');
    console.log('Switched to Japanese');
  }, 10000);
}

/**
 * Example 4: Cloud-based speech-to-text
 */
export async function example4_CloudSTT() {
  const cloudSTT = new CloudSpeechToText({
    apiKey: 'YOUR_API_KEY',
    language: 'en-US',
    enableAutomaticPunctuation: true,
    enableSpeakerDiarization: true,
    diarizationSpeakerCount: 2,
  });

  // Start recording
  await cloudSTT.startRecording();
  console.log('Recording...');

  // Stop after 10 seconds and get transcript
  setTimeout(async () => {
    const transcript = await cloudSTT.stopRecording();
    console.log('Cloud transcript:', transcript);
  }, 10000);
}

/**
 * Example 5: Custom speech-to-text with post-processing
 */
export class CustomSpeechToText extends SpeechToTextService {
  protected onFinalResult(transcript: string, alternatives: any[]): void {
    // Apply custom post-processing
    const processed = this.postProcess(transcript);
    console.log('Processed transcript:', processed);
  }

  private postProcess(transcript: string): string {
    // Remove filler words
    let processed = transcript.replace(/\b(um|uh|like|you know)\b/gi, '');

    // Fix common misrecognitions
    processed = processed.replace(/\btheir\b/g, 'there');

    // Capitalize sentences
    processed = processed.replace(/(^\w|\.\s+\w)/g, (match) => match.toUpperCase());

    // Add punctuation at the end if missing
    if (!/[.!?]$/.test(processed)) {
      processed += '.';
    }

    return processed.trim();
  }
}

// Helper function for UI updates
function updateTranscriptUI(text: string, isFinal: boolean): void {
  // Implementation depends on your UI framework
  console.log(`UI Update (${isFinal ? 'final' : 'interim'}):`, text);
}

/**
 * Integration Notes:
 *
 * 1. Browser Compatibility:
 *    - Chrome/Edge: Full support for Web Speech API
 *    - Firefox: Limited support
 *    - Safari: Requires webkit prefix
 *
 * 2. Permissions:
 *    - Request microphone permission before starting
 *    - Handle permission denied gracefully
 *
 * 3. Network Requirements:
 *    - Web Speech API requires internet connection
 *    - Consider offline alternatives like Vosk or Whisper
 *
 * 4. Performance:
 *    - Continuous mode can be resource-intensive
 *    - Consider using non-continuous mode for better battery life
 *
 * 5. Accuracy Improvements:
 *    - Use multiple alternatives and confidence scores
 *    - Implement custom post-processing
 *    - Consider domain-specific language models
 */
