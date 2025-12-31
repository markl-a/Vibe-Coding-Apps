/**
 * SSML Formatting Example
 * Demonstrates using Speech Synthesis Markup Language (SSML) for advanced voice control
 */

// ===== SSML Builder =====

export class SSMLBuilder {
  private ssml: string[] = [];

  constructor() {
    this.ssml.push('<?xml version="1.0"?>');
    this.ssml.push('<speak>');
  }

  /**
   * Add plain text
   */
  public text(content: string): this {
    this.ssml.push(this.escapeXml(content));
    return this;
  }

  /**
   * Add a break/pause
   */
  public break(options?: { time?: string; strength?: 'none' | 'x-weak' | 'weak' | 'medium' | 'strong' | 'x-strong' }): this {
    if (options?.time) {
      this.ssml.push(`<break time="${options.time}"/>`);
    } else if (options?.strength) {
      this.ssml.push(`<break strength="${options.strength}"/>`);
    } else {
      this.ssml.push('<break/>');
    }
    return this;
  }

  /**
   * Add emphasis
   */
  public emphasis(text: string, level: 'strong' | 'moderate' | 'reduced' = 'moderate'): this {
    this.ssml.push(`<emphasis level="${level}">${this.escapeXml(text)}</emphasis>`);
    return this;
  }

  /**
   * Add prosody (pitch, rate, volume)
   */
  public prosody(text: string, options: {
    pitch?: string; // x-low, low, medium, high, x-high, or percentage
    rate?: string; // x-slow, slow, medium, fast, x-fast, or percentage
    volume?: string; // silent, x-soft, soft, medium, loud, x-loud
  }): this {
    const attrs: string[] = [];

    if (options.pitch) attrs.push(`pitch="${options.pitch}"`);
    if (options.rate) attrs.push(`rate="${options.rate}"`);
    if (options.volume) attrs.push(`volume="${options.volume}"`);

    this.ssml.push(`<prosody ${attrs.join(' ')}>${this.escapeXml(text)}</prosody>`);
    return this;
  }

  /**
   * Say as (interpret text in specific way)
   */
  public sayAs(text: string, interpretAs:
    'cardinal' | 'ordinal' | 'characters' | 'fraction' | 'unit' |
    'date' | 'time' | 'telephone' | 'address' | 'currency'
  ): this {
    this.ssml.push(`<say-as interpret-as="${interpretAs}">${this.escapeXml(text)}</say-as>`);
    return this;
  }

  /**
   * Add phoneme (pronunciation)
   */
  public phoneme(text: string, ph: string, alphabet: 'ipa' | 'x-sampa' = 'ipa'): this {
    this.ssml.push(`<phoneme alphabet="${alphabet}" ph="${ph}">${this.escapeXml(text)}</phoneme>`);
    return this;
  }

  /**
   * Add sub (substitute pronunciation)
   */
  public sub(text: string, alias: string): this {
    this.ssml.push(`<sub alias="${this.escapeXml(alias)}">${this.escapeXml(text)}</sub>`);
    return this;
  }

  /**
   * Add audio
   */
  public audio(src: string, fallbackText?: string): this {
    if (fallbackText) {
      this.ssml.push(`<audio src="${src}">${this.escapeXml(fallbackText)}</audio>`);
    } else {
      this.ssml.push(`<audio src="${src}"/>`);
    }
    return this;
  }

  /**
   * Add paragraph
   */
  public paragraph(content: string): this {
    this.ssml.push(`<p>${this.escapeXml(content)}</p>`);
    return this;
  }

  /**
   * Add sentence
   */
  public sentence(content: string): this {
    this.ssml.push(`<s>${this.escapeXml(content)}</s>`);
    return this;
  }

  /**
   * Add voice (change voice)
   */
  public voice(text: string, options: {
    name?: string;
    gender?: 'male' | 'female' | 'neutral';
    age?: number;
    variant?: number;
  }): this {
    const attrs: string[] = [];

    if (options.name) attrs.push(`name="${options.name}"`);
    if (options.gender) attrs.push(`gender="${options.gender}"`);
    if (options.age) attrs.push(`age="${options.age}"`);
    if (options.variant) attrs.push(`variant="${options.variant}"`);

    this.ssml.push(`<voice ${attrs.join(' ')}>${this.escapeXml(text)}</voice>`);
    return this;
  }

  /**
   * Add language
   */
  public lang(text: string, language: string): this {
    this.ssml.push(`<lang xml:lang="${language}">${this.escapeXml(text)}</lang>`);
    return this;
  }

  /**
   * Build final SSML
   */
  public build(): string {
    return [...this.ssml, '</speak>'].join('\n');
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Reset builder
   */
  public reset(): this {
    this.ssml = ['<?xml version="1.0"?>', '<speak>'];
    return this;
  }
}

// ===== SSML Templates =====

export class SSMLTemplates {
  /**
   * Create a greeting with time-based variation
   */
  public static greeting(name?: string): string {
    const hour = new Date().getHours();
    const builder = new SSMLBuilder();

    let greeting = '';
    if (hour < 12) {
      greeting = 'Good morning';
    } else if (hour < 18) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }

    builder.text(greeting);

    if (name) {
      builder.break({ time: '300ms' });
      builder.emphasis(name, 'strong');
    }

    builder.text('!');

    return builder.build();
  }

  /**
   * Create a news announcement
   */
  public static newsAnnouncement(headline: string, body: string): string {
    const builder = new SSMLBuilder();

    builder
      .paragraph('')
      .prosody(headline, { pitch: 'medium', rate: '95%', volume: 'loud' })
      .break({ strength: 'strong' })
      .paragraph(body);

    return builder.build();
  }

  /**
   * Create a phone number announcement
   */
  public static phoneNumber(number: string): string {
    const builder = new SSMLBuilder();

    builder
      .text('The phone number is')
      .break({ time: '300ms' })
      .sayAs(number, 'telephone');

    return builder.build();
  }

  /**
   * Create a date announcement
   */
  public static date(date: string, format = 'mdy'): string {
    const builder = new SSMLBuilder();

    builder
      .text('The date is')
      .break({ time: '300ms' })
      .sayAs(date, 'date');

    return builder.build();
  }

  /**
   * Create an address announcement
   */
  public static address(street: string, city: string, state: string, zip: string): string {
    const builder = new SSMLBuilder();

    builder
      .text(street)
      .break({ strength: 'weak' })
      .text(city)
      .break({ strength: 'weak' })
      .text(state)
      .break({ strength: 'weak' })
      .sayAs(zip, 'cardinal');

    return builder.build();
  }

  /**
   * Create a narrative with character voices
   */
  public static narrative(narrator: string, dialogues: Array<{ character: string; text: string }>): string {
    const builder = new SSMLBuilder();

    builder.paragraph(narrator);

    dialogues.forEach((dialogue) => {
      builder
        .break({ strength: 'medium' })
        .voice(dialogue.text, { name: dialogue.character });
    });

    return builder.build();
  }
}

// ===== SSML Processor =====

export class SSMLProcessor {
  private synth: SpeechSynthesis | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  /**
   * Speak SSML (note: Web Speech API has limited SSML support)
   */
  public speak(ssml: string): Promise<void> {
    if (!this.synth) {
      return Promise.reject(new Error('Speech synthesis not available'));
    }

    // Extract text from SSML (simplified - real implementation would parse SSML)
    const text = this.extractText(ssml);

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(event.error));

      this.synth!.speak(utterance);
    });
  }

  /**
   * Extract plain text from SSML
   */
  private extractText(ssml: string): string {
    // Simple XML tag removal (real implementation should use XML parser)
    return ssml
      .replace(/<\?xml[^?]*\?>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Validate SSML
   */
  public validate(ssml: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for xml declaration
    if (!ssml.includes('<?xml')) {
      errors.push('Missing XML declaration');
    }

    // Check for speak root element
    if (!ssml.includes('<speak>') || !ssml.includes('</speak>')) {
      errors.push('Missing or incomplete speak element');
    }

    // Check for balanced tags (simplified)
    const openTags = ssml.match(/<[^/][^>]*>/g) || [];
    const closeTags = ssml.match(/<\/[^>]+>/g) || [];

    if (openTags.length !== closeTags.length) {
      errors.push('Unbalanced tags detected');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ===== Example Usage =====

/**
 * Example 1: Basic SSML with breaks and emphasis
 */
export function example1_BasicSSML() {
  const builder = new SSMLBuilder();

  const ssml = builder
    .text('Welcome to our service.')
    .break({ time: '500ms' })
    .emphasis('This is very important!', 'strong')
    .break({ strength: 'medium' })
    .text('Thank you for your attention.')
    .build();

  console.log('SSML:', ssml);

  const processor = new SSMLProcessor();
  processor.speak(ssml);
}

/**
 * Example 2: Prosody control
 */
export function example2_Prosody() {
  const builder = new SSMLBuilder();

  const ssml = builder
    .prosody('This is spoken at high pitch.', { pitch: 'high' })
    .break({ time: '500ms' })
    .prosody('This is spoken slowly.', { rate: 'slow' })
    .break({ time: '500ms' })
    .prosody('This is spoken loudly.', { volume: 'loud' })
    .break({ time: '500ms' })
    .prosody('Fast and high!', { rate: 'fast', pitch: 'x-high' })
    .build();

  console.log('SSML:', ssml);

  const processor = new SSMLProcessor();
  processor.speak(ssml);
}

/**
 * Example 3: Say-As for numbers and dates
 */
export function example3_SayAs() {
  const builder = new SSMLBuilder();

  const ssml = builder
    .text('My phone number is')
    .break({ time: '300ms' })
    .sayAs('555-123-4567', 'telephone')
    .break({ strength: 'strong' })
    .text('The meeting is on')
    .break({ time: '300ms' })
    .sayAs('2024-03-15', 'date')
    .break({ strength: 'strong' })
    .text('The price is')
    .break({ time: '300ms' })
    .sayAs('$1,234.56', 'currency')
    .build();

  console.log('SSML:', ssml);

  const processor = new SSMLProcessor();
  processor.speak(ssml);
}

/**
 * Example 4: Paragraphs and sentences
 */
export function example4_Structure() {
  const builder = new SSMLBuilder();

  const ssml = builder
    .paragraph('This is the first paragraph. It contains multiple sentences.')
    .paragraph('This is the second paragraph.')
    .sentence('This is an explicit sentence.')
    .sentence('And this is another one.')
    .build();

  console.log('SSML:', ssml);

  const processor = new SSMLProcessor();
  processor.speak(ssml);
}

/**
 * Example 5: Substitution and phonemes
 */
export function example5_Pronunciation() {
  const builder = new SSMLBuilder();

  const ssml = builder
    .text('The')
    .sub('SQL', 'sequel')
    .text('database is fast.')
    .break({ time: '500ms' })
    .text('My name is')
    .phoneme('Niamh', 'niːv', 'ipa')
    .build();

  console.log('SSML:', ssml);

  const processor = new SSMLProcessor();
  processor.speak(ssml);
}

/**
 * Example 6: Multi-voice dialogue
 */
export function example6_Dialogue() {
  const builder = new SSMLBuilder();

  const ssml = builder
    .text('The conversation went like this:')
    .break({ strength: 'strong' })
    .voice('"Hello there!"', { gender: 'male' })
    .break({ time: '500ms' })
    .voice('"Hi! How are you?"', { gender: 'female' })
    .break({ time: '500ms' })
    .voice('"I am doing great, thanks!"', { gender: 'male' })
    .build();

  console.log('SSML:', ssml);

  const processor = new SSMLProcessor();
  processor.speak(ssml);
}

/**
 * Example 7: Using templates
 */
export async function example7_Templates() {
  const processor = new SSMLProcessor();

  // Greeting template
  const greeting = SSMLTemplates.greeting('Alice');
  console.log('Greeting SSML:', greeting);
  await processor.speak(greeting);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // News announcement
  const news = SSMLTemplates.newsAnnouncement(
    'Breaking News',
    'Scientists discover new planet in our solar system.'
  );
  console.log('News SSML:', news);
  await processor.speak(news);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Phone number
  const phone = SSMLTemplates.phoneNumber('555-123-4567');
  console.log('Phone SSML:', phone);
  await processor.speak(phone);
}

/**
 * Example 8: Complex announcement
 */
export function example8_ComplexAnnouncement() {
  const builder = new SSMLBuilder();

  const ssml = builder
    .paragraph('Attention passengers.')
    .break({ strength: 'strong' })
    .prosody('Flight', { volume: 'loud' })
    .sayAs('AA1234', 'characters')
    .prosody('to New York', { volume: 'loud' })
    .break({ strength: 'strong' })
    .emphasis('is now boarding', 'strong')
    .text('at gate')
    .sayAs('42', 'cardinal')
    .break({ strength: 'medium' })
    .text('Boarding time is')
    .sayAs('2:30 PM', 'time')
    .build();

  console.log('SSML:', ssml);

  const processor = new SSMLProcessor();
  processor.speak(ssml);
}

/**
 * Example 9: Weather report
 */
export function example9_WeatherReport() {
  const builder = new SSMLBuilder();

  const ssml = builder
    .paragraph('Weather forecast for today.')
    .break({ strength: 'strong' })
    .text('Morning:')
    .break({ time: '300ms' })
    .prosody('Sunny', { pitch: 'high', rate: '105%' })
    .text('with a high of')
    .sayAs('75', 'cardinal')
    .text('degrees.')
    .break({ strength: 'strong' })
    .text('Evening:')
    .break({ time: '300ms' })
    .prosody('Partly cloudy', { pitch: 'medium' })
    .text('with a low of')
    .sayAs('55', 'cardinal')
    .text('degrees.')
    .break({ strength: 'strong' })
    .text('Chance of rain:')
    .sayAs('20%', 'cardinal')
    .build();

  console.log('SSML:', ssml);

  const processor = new SSMLProcessor();
  processor.speak(ssml);
}

/**
 * Example 10: SSML validation
 */
export function example10_Validation() {
  const processor = new SSMLProcessor();

  // Valid SSML
  const validSSML = new SSMLBuilder()
    .text('This is valid SSML.')
    .build();

  const validResult = processor.validate(validSSML);
  console.log('Valid SSML:', validResult);

  // Invalid SSML (missing closing tag)
  const invalidSSML = `
    <?xml version="1.0"?>
    <speak>
      <p>Missing closing paragraph tag
      <emphasis>Some text</emphasis>
    </speak>
  `;

  const invalidResult = processor.validate(invalidSSML);
  console.log('Invalid SSML:', invalidResult);
}

/**
 * Example 11: Interactive SSML builder UI
 */
export function example11_InteractiveBuilder() {
  const builder = new SSMLBuilder();

  // Text input
  const textInput = document.getElementById('ssml-text') as HTMLInputElement;
  const addTextBtn = document.getElementById('add-text-btn');

  addTextBtn?.addEventListener('click', () => {
    if (textInput?.value) {
      builder.text(textInput.value);
      updatePreview();
      textInput.value = '';
    }
  });

  // Add break
  const addBreakBtn = document.getElementById('add-break-btn');
  const breakTime = document.getElementById('break-time') as HTMLInputElement;

  addBreakBtn?.addEventListener('click', () => {
    const time = breakTime?.value || '500ms';
    builder.break({ time });
    updatePreview();
  });

  // Add emphasis
  const emphasisInput = document.getElementById('emphasis-text') as HTMLInputElement;
  const emphasisLevel = document.getElementById('emphasis-level') as HTMLSelectElement;
  const addEmphasisBtn = document.getElementById('add-emphasis-btn');

  addEmphasisBtn?.addEventListener('click', () => {
    if (emphasisInput?.value) {
      const level = emphasisLevel?.value as 'strong' | 'moderate' | 'reduced' || 'moderate';
      builder.emphasis(emphasisInput.value, level);
      updatePreview();
      emphasisInput.value = '';
    }
  });

  // Add prosody
  const prosodyText = document.getElementById('prosody-text') as HTMLInputElement;
  const prosodyPitch = document.getElementById('prosody-pitch') as HTMLSelectElement;
  const prosodyRate = document.getElementById('prosody-rate') as HTMLSelectElement;
  const addProsodyBtn = document.getElementById('add-prosody-btn');

  addProsodyBtn?.addEventListener('click', () => {
    if (prosodyText?.value) {
      builder.prosody(prosodyText.value, {
        pitch: prosodyPitch?.value,
        rate: prosodyRate?.value,
      });
      updatePreview();
      prosodyText.value = '';
    }
  });

  // Preview
  const preview = document.getElementById('ssml-preview') as HTMLPreElement;

  function updatePreview() {
    const ssml = builder.build();
    if (preview) {
      preview.textContent = ssml;
    }
  }

  // Speak button
  const speakBtn = document.getElementById('speak-ssml-btn');
  speakBtn?.addEventListener('click', () => {
    const processor = new SSMLProcessor();
    const ssml = builder.build();
    processor.speak(ssml);
  });

  // Reset button
  const resetBtn = document.getElementById('reset-ssml-btn');
  resetBtn?.addEventListener('click', () => {
    builder.reset();
    updatePreview();
  });

  // Initial preview
  updatePreview();
}

/**
 * Best Practices:
 *
 * 1. SSML Usage:
 *    - Use breaks for natural pausing
 *    - Apply emphasis to important words
 *    - Use prosody for emotional expression
 *
 * 2. Numbers and Dates:
 *    - Use say-as for proper pronunciation
 *    - Specify format for dates
 *    - Consider regional variations
 *
 * 3. Pronunciation:
 *    - Use phonemes for difficult words
 *    - Provide substitutions for acronyms
 *    - Test with multiple voices
 *
 * 4. Structure:
 *    - Use paragraphs for logical grouping
 *    - Mark explicit sentences
 *    - Apply consistent formatting
 *
 * 5. Browser Support:
 *    - Web Speech API has limited SSML support
 *    - Test across browsers
 *    - Provide fallbacks for unsupported features
 *    - Consider cloud TTS services for full SSML support
 *
 * 6. Validation:
 *    - Validate SSML before use
 *    - Check for balanced tags
 *    - Test with target TTS engine
 */
