/**
 * Voice Customization Example
 * Demonstrates customizing voice characteristics and creating voice profiles
 */

// ===== Voice Profile =====

export interface VoiceProfile {
  id: string;
  name: string;
  voice?: string;
  lang: string;
  pitch: number;
  rate: number;
  volume: number;
  emphasis?: 'strong' | 'moderate' | 'none';
  style?: 'formal' | 'casual' | 'cheerful' | 'empathetic';
  gender?: 'male' | 'female' | 'neutral';
}

export interface VoicePreset {
  name: string;
  description: string;
  profile: Partial<VoiceProfile>;
}

// ===== Voice Customizer =====

export class VoiceCustomizer {
  private profiles: Map<string, VoiceProfile> = new Map();
  private currentProfile: VoiceProfile;
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  // Predefined presets
  private static PRESETS: VoicePreset[] = [
    {
      name: 'Default',
      description: 'Standard voice settings',
      profile: {
        pitch: 1.0,
        rate: 1.0,
        volume: 1.0,
        emphasis: 'moderate',
        style: 'formal',
      },
    },
    {
      name: 'News Anchor',
      description: 'Clear, authoritative voice',
      profile: {
        pitch: 0.9,
        rate: 0.95,
        volume: 1.0,
        emphasis: 'moderate',
        style: 'formal',
      },
    },
    {
      name: 'Storyteller',
      description: 'Warm, engaging voice',
      profile: {
        pitch: 1.1,
        rate: 0.85,
        volume: 0.9,
        emphasis: 'strong',
        style: 'cheerful',
      },
    },
    {
      name: 'Assistant',
      description: 'Friendly, helpful voice',
      profile: {
        pitch: 1.05,
        rate: 1.0,
        volume: 0.95,
        emphasis: 'moderate',
        style: 'casual',
      },
    },
    {
      name: 'Meditation',
      description: 'Calm, soothing voice',
      profile: {
        pitch: 0.85,
        rate: 0.7,
        volume: 0.8,
        emphasis: 'none',
        style: 'empathetic',
      },
    },
    {
      name: 'Audiobook',
      description: 'Pleasant, consistent voice',
      profile: {
        pitch: 1.0,
        rate: 0.9,
        volume: 0.9,
        emphasis: 'moderate',
        style: 'formal',
      },
    },
  ];

  constructor() {
    this.currentProfile = this.createDefaultProfile();
    this.initialize();
  }

  /**
   * Initialize speech synthesis
   */
  private initialize(): void {
    if (typeof window === 'undefined') return;

    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();

      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  /**
   * Load available voices
   */
  private loadVoices(): void {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  /**
   * Create default profile
   */
  private createDefaultProfile(): VoiceProfile {
    return {
      id: 'default',
      name: 'Default',
      lang: 'en-US',
      pitch: 1.0,
      rate: 1.0,
      volume: 1.0,
      emphasis: 'moderate',
      style: 'formal',
    };
  }

  /**
   * Create a new voice profile
   */
  public createProfile(profile: Partial<VoiceProfile> & { name: string }): VoiceProfile {
    const id = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newProfile: VoiceProfile = {
      id,
      lang: 'en-US',
      pitch: 1.0,
      rate: 1.0,
      volume: 1.0,
      emphasis: 'moderate',
      style: 'formal',
      ...profile,
    };

    this.profiles.set(id, newProfile);
    return newProfile;
  }

  /**
   * Load a profile
   */
  public loadProfile(profileId: string): boolean {
    const profile = this.profiles.get(profileId);

    if (!profile) {
      return false;
    }

    this.currentProfile = profile;
    return true;
  }

  /**
   * Update current profile
   */
  public updateProfile(updates: Partial<VoiceProfile>): void {
    this.currentProfile = { ...this.currentProfile, ...updates };

    // Update in profiles map if it exists
    if (this.profiles.has(this.currentProfile.id)) {
      this.profiles.set(this.currentProfile.id, this.currentProfile);
    }
  }

  /**
   * Get current profile
   */
  public getCurrentProfile(): VoiceProfile {
    return { ...this.currentProfile };
  }

  /**
   * Get all profiles
   */
  public getProfiles(): VoiceProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Delete a profile
   */
  public deleteProfile(profileId: string): boolean {
    return this.profiles.delete(profileId);
  }

  /**
   * Apply preset
   */
  public applyPreset(presetName: string): boolean {
    const preset = VoiceCustomizer.PRESETS.find((p) => p.name === presetName);

    if (!preset) {
      return false;
    }

    this.updateProfile(preset.profile);
    return true;
  }

  /**
   * Get available presets
   */
  public static getPresets(): VoicePreset[] {
    return [...VoiceCustomizer.PRESETS];
  }

  /**
   * Speak with current profile
   */
  public speak(text: string): Promise<void> {
    if (!this.synth) {
      return Promise.reject(new Error('Speech synthesis not available'));
    }

    this.synth.cancel();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Apply profile settings
      if (this.currentProfile.voice) {
        const voice = this.voices.find((v) => v.name === this.currentProfile.voice);
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.lang = this.currentProfile.lang;
      utterance.pitch = this.currentProfile.pitch;
      utterance.rate = this.currentProfile.rate;
      utterance.volume = this.currentProfile.volume;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(event.error));

      this.synth.speak(utterance);
    });
  }

  /**
   * Find best voice for profile
   */
  public findBestVoice(profile?: Partial<VoiceProfile>): SpeechSynthesisVoice | null {
    const targetProfile = profile || this.currentProfile;
    const targetLang = targetProfile.lang || 'en-US';
    const targetGender = targetProfile.gender;

    // Filter by language
    let candidates = this.voices.filter((v) => v.lang.startsWith(targetLang));

    // Filter by gender if specified
    if (targetGender && candidates.length > 1) {
      const genderFiltered = candidates.filter((v) => {
        const nameLower = v.name.toLowerCase();
        if (targetGender === 'male') {
          return nameLower.includes('male') || nameLower.includes('man');
        } else if (targetGender === 'female') {
          return nameLower.includes('female') || nameLower.includes('woman');
        }
        return true;
      });

      if (genderFiltered.length > 0) {
        candidates = genderFiltered;
      }
    }

    // Prefer local voices
    const localVoices = candidates.filter((v) => v.localService);
    if (localVoices.length > 0) {
      return localVoices[0];
    }

    return candidates.length > 0 ? candidates[0] : null;
  }

  /**
   * Auto-configure profile for best experience
   */
  public autoConfigureProfile(): void {
    const bestVoice = this.findBestVoice();

    if (bestVoice) {
      this.updateProfile({
        voice: bestVoice.name,
        lang: bestVoice.lang,
      });
    }
  }

  /**
   * Export profile to JSON
   */
  public exportProfile(profileId?: string): string {
    const profile = profileId
      ? this.profiles.get(profileId)
      : this.currentProfile;

    return JSON.stringify(profile, null, 2);
  }

  /**
   * Import profile from JSON
   */
  public importProfile(json: string): VoiceProfile {
    const profile = JSON.parse(json) as VoiceProfile;

    // Generate new ID
    const newId = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    profile.id = newId;

    this.profiles.set(newId, profile);
    return profile;
  }
}

// ===== Advanced Voice Modifier =====

export class VoiceModifier extends VoiceCustomizer {
  private audioContext: AudioContext | null = null;

  constructor() {
    super();

    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Apply audio effects to voice
   */
  public async speakWithEffects(
    text: string,
    effects: {
      reverb?: number; // 0 to 1
      echo?: number; // 0 to 1
      chorus?: number; // 0 to 1
    }
  ): Promise<void> {
    // This is a simplified example
    // Real implementation would use Web Audio API to apply effects
    console.log('Applying effects:', effects);
    return this.speak(text);
  }

  /**
   * Create voice morph (e.g., robot voice, chipmunk, etc.)
   */
  public morphVoice(morphType: 'robot' | 'chipmunk' | 'deep' | 'whisper'): void {
    switch (morphType) {
      case 'robot':
        this.updateProfile({ pitch: 0.8, rate: 0.9 });
        break;
      case 'chipmunk':
        this.updateProfile({ pitch: 1.8, rate: 1.3 });
        break;
      case 'deep':
        this.updateProfile({ pitch: 0.6, rate: 0.8 });
        break;
      case 'whisper':
        this.updateProfile({ volume: 0.4, rate: 0.9 });
        break;
    }
  }
}

// ===== Character Voice System =====

export interface CharacterVoice extends VoiceProfile {
  characterName: string;
  personality: string;
  samplePhrases: string[];
}

export class CharacterVoiceSystem extends VoiceCustomizer {
  private characters: Map<string, CharacterVoice> = new Map();

  /**
   * Create a character voice
   */
  public createCharacter(character: Partial<CharacterVoice> & { characterName: string }): CharacterVoice {
    const id = `character-${Date.now()}`;

    const characterVoice: CharacterVoice = {
      id,
      name: character.characterName,
      characterName: character.characterName,
      personality: character.personality || 'friendly',
      samplePhrases: character.samplePhrases || [],
      lang: character.lang || 'en-US',
      pitch: character.pitch || 1.0,
      rate: character.rate || 1.0,
      volume: character.volume || 1.0,
      emphasis: character.emphasis || 'moderate',
      style: character.style || 'casual',
    };

    this.characters.set(id, characterVoice);
    return characterVoice;
  }

  /**
   * Speak as character
   */
  public async speakAsCharacter(characterId: string, text: string): Promise<void> {
    const character = this.characters.get(characterId);

    if (!character) {
      throw new Error('Character not found');
    }

    // Load character profile
    this.loadProfile(characterId);

    // Speak
    return this.speak(text);
  }

  /**
   * Get all characters
   */
  public getCharacters(): CharacterVoice[] {
    return Array.from(this.characters.values());
  }
}

// ===== Example Usage =====

/**
 * Example 1: Basic voice customization
 */
export async function example1_BasicCustomization() {
  const customizer = new VoiceCustomizer();

  // Create a custom profile
  const profile = customizer.createProfile({
    name: 'My Voice',
    pitch: 1.2,
    rate: 0.9,
    volume: 0.95,
  });

  console.log('Created profile:', profile);

  // Load and use the profile
  customizer.loadProfile(profile.id);
  await customizer.speak('This is my custom voice.');
}

/**
 * Example 2: Using presets
 */
export async function example2_Presets() {
  const customizer = new VoiceCustomizer();

  // Get available presets
  const presets = VoiceCustomizer.getPresets();
  console.log('Available presets:', presets.map((p) => p.name));

  // Try each preset
  for (const preset of presets) {
    console.log(`\nApplying preset: ${preset.name}`);
    customizer.applyPreset(preset.name);

    const text = `This is the ${preset.name} voice preset. ${preset.description}`;
    await customizer.speak(text);

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

/**
 * Example 3: Voice profile management
 */
export function example3_ProfileManagement() {
  const customizer = new VoiceCustomizer();

  // Create multiple profiles
  const profiles = [
    customizer.createProfile({
      name: 'Professional',
      pitch: 0.95,
      rate: 1.0,
      style: 'formal',
    }),
    customizer.createProfile({
      name: 'Friendly',
      pitch: 1.1,
      rate: 1.05,
      style: 'casual',
    }),
    customizer.createProfile({
      name: 'Calm',
      pitch: 0.9,
      rate: 0.8,
      style: 'empathetic',
    }),
  ];

  // Export profiles
  profiles.forEach((profile) => {
    const json = customizer.exportProfile(profile.id);
    console.log(`Profile ${profile.name}:`, json);
  });

  // Import a profile
  const importedJson = customizer.exportProfile(profiles[0].id);
  const imported = customizer.importProfile(importedJson);
  console.log('Imported profile:', imported);
}

/**
 * Example 4: Auto voice selection
 */
export async function example4_AutoVoice() {
  const customizer = new VoiceCustomizer();

  // Create profile with gender preference
  customizer.updateProfile({
    lang: 'en-US',
    gender: 'female',
  });

  // Find best matching voice
  const bestVoice = customizer.findBestVoice();
  console.log('Best voice:', bestVoice?.name);

  // Auto-configure
  customizer.autoConfigureProfile();
  console.log('Auto-configured profile:', customizer.getCurrentProfile());

  await customizer.speak('This voice was automatically selected for you.');
}

/**
 * Example 5: Voice morphing
 */
export async function example5_VoiceMorph() {
  const modifier = new VoiceModifier();

  const text = 'Listen to how my voice changes.';

  // Normal voice
  console.log('Normal voice');
  await modifier.speak(text);
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Robot voice
  console.log('Robot voice');
  modifier.morphVoice('robot');
  await modifier.speak(text);
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Chipmunk voice
  console.log('Chipmunk voice');
  modifier.morphVoice('chipmunk');
  await modifier.speak(text);
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Deep voice
  console.log('Deep voice');
  modifier.morphVoice('deep');
  await modifier.speak(text);
}

/**
 * Example 6: Character voices
 */
export async function example6_CharacterVoices() {
  const system = new CharacterVoiceSystem();

  // Create characters
  const narrator = system.createCharacter({
    characterName: 'Narrator',
    personality: 'authoritative',
    pitch: 0.95,
    rate: 0.9,
    style: 'formal',
    samplePhrases: ['Once upon a time...', 'And so the story begins...'],
  });

  const hero = system.createCharacter({
    characterName: 'Hero',
    personality: 'brave',
    pitch: 1.0,
    rate: 1.1,
    style: 'cheerful',
    samplePhrases: ['I will save the day!', "Let's go!"],
  });

  const villain = system.createCharacter({
    characterName: 'Villain',
    personality: 'menacing',
    pitch: 0.7,
    rate: 0.85,
    style: 'formal',
    samplePhrases: ['You will never defeat me!', 'Mwahahaha!'],
  });

  // Tell a story
  await system.speakAsCharacter(narrator.id, 'Once upon a time, there was a brave hero.');
  await new Promise((resolve) => setTimeout(resolve, 500));

  await system.speakAsCharacter(hero.id, 'I will save the kingdom!');
  await new Promise((resolve) => setTimeout(resolve, 500));

  await system.speakAsCharacter(villain.id, 'Not if I can help it!');
}

/**
 * Example 7: Interactive voice customizer UI
 */
export function example7_InteractiveUI() {
  const customizer = new VoiceCustomizer();

  // Pitch slider
  const pitchSlider = document.getElementById('pitch-slider') as HTMLInputElement;
  pitchSlider?.addEventListener('input', (e) => {
    const pitch = parseFloat((e.target as HTMLInputElement).value);
    customizer.updateProfile({ pitch });
    console.log('Pitch:', pitch);
  });

  // Rate slider
  const rateSlider = document.getElementById('rate-slider') as HTMLInputElement;
  rateSlider?.addEventListener('input', (e) => {
    const rate = parseFloat((e.target as HTMLInputElement).value);
    customizer.updateProfile({ rate });
    console.log('Rate:', rate);
  });

  // Volume slider
  const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement;
  volumeSlider?.addEventListener('input', (e) => {
    const volume = parseFloat((e.target as HTMLInputElement).value);
    customizer.updateProfile({ volume });
    console.log('Volume:', volume);
  });

  // Preset selector
  const presetSelect = document.getElementById('preset-select') as HTMLSelectElement;
  VoiceCustomizer.getPresets().forEach((preset) => {
    const option = document.createElement('option');
    option.value = preset.name;
    option.textContent = preset.name;
    presetSelect?.appendChild(option);
  });

  presetSelect?.addEventListener('change', (e) => {
    const presetName = (e.target as HTMLSelectElement).value;
    customizer.applyPreset(presetName);
    updateUIFromProfile(customizer.getCurrentProfile());
  });

  // Test button
  const testButton = document.getElementById('test-voice-btn');
  testButton?.addEventListener('click', () => {
    customizer.speak('This is how I sound with these settings.');
  });

  // Save profile button
  const saveButton = document.getElementById('save-profile-btn');
  saveButton?.addEventListener('click', () => {
    const name = prompt('Enter profile name:');
    if (name) {
      const profile = customizer.createProfile({
        name,
        ...customizer.getCurrentProfile(),
      });
      console.log('Profile saved:', profile);
    }
  });
}

function updateUIFromProfile(profile: VoiceProfile): void {
  const pitchSlider = document.getElementById('pitch-slider') as HTMLInputElement;
  const rateSlider = document.getElementById('rate-slider') as HTMLInputElement;
  const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement;

  if (pitchSlider) pitchSlider.value = profile.pitch.toString();
  if (rateSlider) rateSlider.value = profile.rate.toString();
  if (volumeSlider) volumeSlider.value = profile.volume.toString();
}

/**
 * Best Practices:
 *
 * 1. Profile Management:
 *    - Provide predefined presets for common use cases
 *    - Allow users to create and save custom profiles
 *    - Support profile import/export for sharing
 *
 * 2. Voice Selection:
 *    - Auto-select best voice based on language/gender
 *    - Consider voice quality (local vs remote)
 *    - Test voice compatibility across browsers
 *
 * 3. Customization:
 *    - Provide intuitive UI controls (sliders, presets)
 *    - Show real-time preview of changes
 *    - Set reasonable min/max ranges
 *
 * 4. Character Voices:
 *    - Create distinct voices for different characters
 *    - Maintain consistency within character
 *    - Consider personality in voice settings
 *
 * 5. Performance:
 *    - Cache voice settings
 *    - Avoid excessive voice switching
 *    - Test across different devices
 */
