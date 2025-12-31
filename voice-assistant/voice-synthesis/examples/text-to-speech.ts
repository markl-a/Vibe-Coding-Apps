/**
 * Text-to-Speech Example
 * Demonstrates converting text to speech using Web Speech API and external TTS services
 */

// ===== Web Speech API Text-to-Speech =====

export interface TTSConfig {
  voice?: string;
  lang?: string;
  pitch?: number; // 0 to 2
  rate?: number; // 0.1 to 10
  volume?: number; // 0 to 1
}

export class TextToSpeech {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private config: Required<TTSConfig>;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(config: TTSConfig = {}) {
    this.config = {
      voice: '',
      lang: 'en-US',
      pitch: 1,
      rate: 1,
      volume: 1,
      ...config,
    };

    this.initialize();
  }

  /**
   * Initialize speech synthesis
   */
  private initialize(): void {
    if (typeof window === 'undefined') {
      console.warn('Text-to-speech not available in this environment');
      return;
    }

    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      return;
    }

    this.synth = window.speechSynthesis;

    // Load voices
    this.loadVoices();

    // Reload voices when they change (some browsers load voices asynchronously)
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  /**
   * Load available voices
   */
  private loadVoices(): void {
    if (!this.synth) return;

    this.voices = this.synth.getVoices();
    console.log(`Loaded ${this.voices.length} voices`);
  }

  /**
   * Get available voices
   */
  public getVoices(): SpeechSynthesisVoice[] {
    return [...this.voices];
  }

  /**
   * Get voices by language
   */
  public getVoicesByLanguage(lang: string): SpeechSynthesisVoice[] {
    return this.voices.filter((voice) => voice.lang.startsWith(lang));
  }

  /**
   * Set voice by name
   */
  public setVoice(voiceName: string): boolean {
    const voice = this.voices.find((v) => v.name === voiceName);
    if (voice) {
      this.config.voice = voiceName;
      return true;
    }
    return false;
  }

  /**
   * Speak text
   */
  public speak(text: string, options?: Partial<TTSConfig>): Promise<void> {
    if (!this.synth) {
      return Promise.reject(new Error('Speech synthesis not available'));
    }

    // Cancel any ongoing speech
    this.cancel();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Apply configuration
      const config = { ...this.config, ...options };

      // Set voice
      if (config.voice) {
        const voice = this.voices.find((v) => v.name === config.voice);
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.lang = config.lang;
      utterance.pitch = config.pitch;
      utterance.rate = config.rate;
      utterance.volume = config.volume;

      // Event handlers
      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  /**
   * Pause speech
   */
  public pause(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  /**
   * Resume speech
   */
  public resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  /**
   * Cancel speech
   */
  public cancel(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Check if currently speaking
   */
  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }

  /**
   * Check if paused
   */
  public isPaused(): boolean {
    return this.synth ? this.synth.paused : false;
  }

  /**
   * Set configuration
   */
  public setConfig(config: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): TTSConfig {
    return { ...this.config };
  }
}

// ===== Advanced TTS with Queue Management =====

export interface QueuedSpeech {
  id: string;
  text: string;
  options?: Partial<TTSConfig>;
  priority?: number;
}

export class AdvancedTextToSpeech extends TextToSpeech {
  private queue: QueuedSpeech[] = [];
  private isProcessing = false;
  private onQueueComplete?: () => void;

  /**
   * Add text to speech queue
   */
  public enqueue(text: string, options?: Partial<TTSConfig>, priority = 0): string {
    const id = `speech-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const queuedSpeech: QueuedSpeech = {
      id,
      text,
      options,
      priority,
    };

    this.queue.push(queuedSpeech);

    // Sort by priority (higher priority first)
    this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Start processing if not already
    if (!this.isProcessing) {
      this.processQueue();
    }

    return id;
  }

  /**
   * Process speech queue
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      if (this.onQueueComplete) {
        this.onQueueComplete();
      }
      return;
    }

    this.isProcessing = true;

    const item = this.queue.shift();
    if (!item) return;

    try {
      await this.speak(item.text, item.options);
    } catch (error) {
      console.error('Speech error:', error);
    }

    // Process next item
    this.processQueue();
  }

  /**
   * Clear queue
   */
  public clearQueue(): void {
    this.queue = [];
    this.cancel();
    this.isProcessing = false;
  }

  /**
   * Get queue length
   */
  public getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Set queue completion callback
   */
  public onComplete(callback: () => void): void {
    this.onQueueComplete = callback;
  }
}

// ===== Streaming TTS (for long texts) =====

export class StreamingTextToSpeech extends AdvancedTextToSpeech {
  /**
   * Speak long text by splitting into sentences
   */
  public async speakLong(text: string, options?: Partial<TTSConfig>): Promise<void> {
    // Split text into sentences
    const sentences = this.splitIntoSentences(text);

    // Queue each sentence
    for (const sentence of sentences) {
      this.enqueue(sentence.trim(), options);
    }

    // Wait for queue to complete
    return new Promise((resolve) => {
      this.onComplete(() => resolve());
    });
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Split on sentence boundaries
    return text
      .split(/[.!?]+/)
      .filter((sentence) => sentence.trim().length > 0)
      .map((sentence) => sentence.trim() + '.');
  }
}

// ===== Cloud TTS Service Integration =====

export interface CloudTTSConfig {
  apiKey: string;
  voice?: string;
  language?: string;
  audioEncoding?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
  speakingRate?: number;
  pitch?: number;
}

export class CloudTextToSpeech {
  private config: CloudTTSConfig;
  private audioContext: AudioContext | null = null;

  constructor(config: CloudTTSConfig) {
    this.config = {
      language: 'en-US',
      audioEncoding: 'MP3',
      speakingRate: 1.0,
      pitch: 0.0,
      ...config,
    };

    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Synthesize speech using cloud API
   */
  public async synthesize(text: string): Promise<Blob> {
    const requestBody = {
      input: { text },
      voice: {
        languageCode: this.config.language,
        name: this.config.voice,
      },
      audioConfig: {
        audioEncoding: this.config.audioEncoding,
        speakingRate: this.config.speakingRate,
        pitch: this.config.pitch,
      },
    };

    // Example: Google Cloud TTS API
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`TTS API request failed: ${response.statusText}`);
    }

    const result = await response.json();

    // Decode base64 audio content
    const audioContent = atob(result.audioContent);
    const audioArray = new Uint8Array(audioContent.length);

    for (let i = 0; i < audioContent.length; i++) {
      audioArray[i] = audioContent.charCodeAt(i);
    }

    return new Blob([audioArray], { type: 'audio/mp3' });
  }

  /**
   * Synthesize and play audio
   */
  public async speak(text: string): Promise<void> {
    const audioBlob = await this.synthesize(text);
    return this.playAudio(audioBlob);
  }

  /**
   * Play audio blob
   */
  private async playAudio(blob: Blob): Promise<void> {
    const audio = new Audio(URL.createObjectURL(blob));

    return new Promise((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Audio playback failed'));
      audio.play();
    });
  }

  /**
   * List available voices
   */
  public async listVoices(): Promise<any[]> {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/voices?key=${this.config.apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Failed to list voices: ${response.statusText}`);
    }

    const result = await response.json();
    return result.voices || [];
  }
}

// ===== Example Usage =====

/**
 * Example 1: Basic text-to-speech
 */
export async function example1_BasicTTS() {
  const tts = new TextToSpeech({
    lang: 'en-US',
    pitch: 1,
    rate: 1,
    volume: 1,
  });

  // Get available voices
  const voices = tts.getVoices();
  console.log('Available voices:', voices.map((v) => v.name));

  // Speak text
  try {
    await tts.speak('Hello! This is a text-to-speech example.');
    console.log('Speech completed');
  } catch (error) {
    console.error('Speech error:', error);
  }
}

/**
 * Example 2: Voice selection
 */
export async function example2_VoiceSelection() {
  const tts = new TextToSpeech();

  // Get voices for a specific language
  const englishVoices = tts.getVoicesByLanguage('en-US');
  console.log('English voices:', englishVoices.map((v) => v.name));

  // Try different voices
  for (const voice of englishVoices.slice(0, 3)) {
    console.log(`Speaking with voice: ${voice.name}`);
    tts.setVoice(voice.name);
    await tts.speak('This is how I sound.');
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait between voices
  }
}

/**
 * Example 3: Speech parameters
 */
export async function example3_Parameters() {
  const tts = new TextToSpeech();

  const text = 'The quick brown fox jumps over the lazy dog.';

  // Normal speed
  console.log('Normal speed');
  await tts.speak(text, { rate: 1 });

  await new Promise((resolve) => setTimeout(resolve, 500));

  // Fast speed
  console.log('Fast speed');
  await tts.speak(text, { rate: 1.5 });

  await new Promise((resolve) => setTimeout(resolve, 500));

  // Slow speed
  console.log('Slow speed');
  await tts.speak(text, { rate: 0.7 });

  await new Promise((resolve) => setTimeout(resolve, 500));

  // High pitch
  console.log('High pitch');
  await tts.speak(text, { pitch: 1.5 });

  await new Promise((resolve) => setTimeout(resolve, 500));

  // Low pitch
  console.log('Low pitch');
  await tts.speak(text, { pitch: 0.7 });
}

/**
 * Example 4: Speech queue
 */
export async function example4_SpeechQueue() {
  const tts = new AdvancedTextToSpeech();

  // Add multiple items to queue
  tts.enqueue('First message.');
  tts.enqueue('Second message.');
  tts.enqueue('Third message.');

  // Add high priority message
  tts.enqueue('Important message!', {}, 10);

  // The important message will be spoken next due to priority

  tts.onComplete(() => {
    console.log('All messages spoken');
  });
}

/**
 * Example 5: Long text streaming
 */
export async function example5_LongText() {
  const tts = new StreamingTextToSpeech();

  const longText = `
    This is a very long text that will be split into multiple sentences.
    Each sentence will be spoken separately to ensure smooth playback.
    This approach works better for long articles or books.
    The text-to-speech system will queue each sentence automatically.
  `;

  try {
    await tts.speakLong(longText);
    console.log('Long text completed');
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 6: Cloud TTS
 */
export async function example6_CloudTTS() {
  const cloudTTS = new CloudTextToSpeech({
    apiKey: 'YOUR_API_KEY',
    language: 'en-US',
    voice: 'en-US-Wavenet-D',
    speakingRate: 1.0,
    pitch: 0.0,
  });

  // List available voices
  try {
    const voices = await cloudTTS.listVoices();
    console.log('Available cloud voices:', voices.length);
  } catch (error) {
    console.error('Failed to list voices:', error);
  }

  // Synthesize speech
  try {
    await cloudTTS.speak('Hello from the cloud!');
    console.log('Cloud speech completed');
  } catch (error) {
    console.error('Cloud TTS error:', error);
  }
}

/**
 * Example 7: Interactive TTS
 */
export function example7_Interactive() {
  const tts = new TextToSpeech();

  // Setup UI controls
  const speakButton = document.getElementById('speak-btn');
  const pauseButton = document.getElementById('pause-btn');
  const resumeButton = document.getElementById('resume-btn');
  const cancelButton = document.getElementById('cancel-btn');
  const textInput = document.getElementById('text-input') as HTMLTextAreaElement;

  speakButton?.addEventListener('click', () => {
    const text = textInput?.value || 'Please enter some text.';
    tts.speak(text);
  });

  pauseButton?.addEventListener('click', () => {
    tts.pause();
  });

  resumeButton?.addEventListener('click', () => {
    tts.resume();
  });

  cancelButton?.addEventListener('click', () => {
    tts.cancel();
  });

  // Voice selector
  const voiceSelect = document.getElementById('voice-select') as HTMLSelectElement;
  const voices = tts.getVoices();

  voices.forEach((voice) => {
    const option = document.createElement('option');
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect?.appendChild(option);
  });

  voiceSelect?.addEventListener('change', () => {
    tts.setVoice(voiceSelect.value);
  });
}

/**
 * Best Practices:
 *
 * 1. Voice Selection:
 *    - Provide voice options to users
 *    - Consider language and regional preferences
 *    - Test voices for quality and clarity
 *
 * 2. Speech Parameters:
 *    - Use appropriate rate for content type
 *    - Adjust pitch for different contexts
 *    - Consider user preferences for volume
 *
 * 3. Long Text Handling:
 *    - Split long texts into sentences
 *    - Use queuing for smooth playback
 *    - Provide pause/resume controls
 *
 * 4. User Experience:
 *    - Provide playback controls (pause, resume, cancel)
 *    - Show speaking status visually
 *    - Allow speed/pitch customization
 *
 * 5. Error Handling:
 *    - Handle browser compatibility issues
 *    - Gracefully handle API failures
 *    - Provide fallback options
 *
 * 6. Performance:
 *    - Cache synthesized audio when possible
 *    - Use streaming for long texts
 *    - Consider bandwidth for cloud TTS
 */
