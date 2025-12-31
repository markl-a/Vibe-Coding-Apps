/**
 * Entity Extraction Example
 * Demonstrates extracting entities (names, dates, locations, etc.) from natural language
 */

// ===== Entity Types =====

export type EntityType =
  | 'person'
  | 'location'
  | 'organization'
  | 'date'
  | 'time'
  | 'duration'
  | 'number'
  | 'email'
  | 'phone'
  | 'url'
  | 'currency'
  | 'percentage'
  | 'custom';

export interface Entity {
  type: EntityType;
  value: string;
  normalizedValue?: any;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

export interface EntityPattern {
  type: EntityType;
  pattern: RegExp;
  normalizer?: (value: string) => any;
}

// ===== Entity Extractor =====

export class EntityExtractor {
  private patterns: EntityPattern[] = [];
  private customPatterns: Map<string, EntityPattern[]> = new Map();

  constructor() {
    this.initializeDefaultPatterns();
  }

  /**
   * Initialize default entity patterns
   */
  private initializeDefaultPatterns(): void {
    // Email pattern
    this.patterns.push({
      type: 'email',
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      normalizer: (value) => value.toLowerCase(),
    });

    // Phone number pattern (various formats)
    this.patterns.push({
      type: 'phone',
      pattern: /\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b/g,
      normalizer: (value) => value.replace(/\D/g, ''),
    });

    // URL pattern
    this.patterns.push({
      type: 'url',
      pattern: /\b(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/g,
    });

    // Number pattern
    this.patterns.push({
      type: 'number',
      pattern: /\b\d+(?:\.\d+)?\b/g,
      normalizer: (value) => parseFloat(value),
    });

    // Currency pattern
    this.patterns.push({
      type: 'currency',
      pattern: /\$\s*\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD)/gi,
      normalizer: (value) => {
        const number = value.replace(/[$,dollars?USD\s]/gi, '');
        return parseFloat(number);
      },
    });

    // Percentage pattern
    this.patterns.push({
      type: 'percentage',
      pattern: /\b\d+(?:\.\d+)?%|\b\d+(?:\.\d+)?\s*percent/gi,
      normalizer: (value) => {
        const number = value.replace(/%|percent/gi, '');
        return parseFloat(number);
      },
    });

    // Date pattern (various formats)
    this.patterns.push({
      type: 'date',
      pattern: /\b(?:\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})\b/g,
      normalizer: (value) => new Date(value),
    });

    // Time pattern
    this.patterns.push({
      type: 'time',
      pattern: /\b\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:AM|PM))?\b/gi,
      normalizer: (value) => value.toLowerCase(),
    });

    // Duration pattern
    this.patterns.push({
      type: 'duration',
      pattern: /\b\d+\s*(?:hours?|minutes?|seconds?|days?|weeks?|months?|years?)\b/gi,
      normalizer: (value) => {
        const match = value.match(/(\d+)\s*(\w+)/);
        if (match) {
          return {
            value: parseInt(match[1]),
            unit: match[2].toLowerCase(),
          };
        }
        return value;
      },
    });
  }

  /**
   * Extract entities from text
   */
  public extract(text: string): Entity[] {
    const entities: Entity[] = [];

    // Extract using default patterns
    this.patterns.forEach((pattern) => {
      const matches = this.findMatches(text, pattern);
      entities.push(...matches);
    });

    // Extract using custom patterns
    this.customPatterns.forEach((patterns) => {
      patterns.forEach((pattern) => {
        const matches = this.findMatches(text, pattern);
        entities.push(...matches);
      });
    });

    // Sort entities by position
    entities.sort((a, b) => a.startIndex - b.startIndex);

    // Remove overlapping entities (keep highest confidence)
    return this.removeOverlaps(entities);
  }

  /**
   * Find pattern matches in text
   */
  private findMatches(text: string, pattern: EntityPattern): Entity[] {
    const entities: Entity[] = [];
    const regex = new RegExp(pattern.pattern);
    let match: RegExpExecArray | null;

    // Reset regex lastIndex
    regex.lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      const value = match[0];
      const normalizedValue = pattern.normalizer ? pattern.normalizer(value) : value;

      entities.push({
        type: pattern.type,
        value,
        normalizedValue,
        startIndex: match.index,
        endIndex: match.index + value.length,
        confidence: 1.0,
      });
    }

    return entities;
  }

  /**
   * Remove overlapping entities
   */
  private removeOverlaps(entities: Entity[]): Entity[] {
    const result: Entity[] = [];

    for (const entity of entities) {
      const hasOverlap = result.some(
        (existing) =>
          (entity.startIndex >= existing.startIndex && entity.startIndex < existing.endIndex) ||
          (entity.endIndex > existing.startIndex && entity.endIndex <= existing.endIndex)
      );

      if (!hasOverlap) {
        result.push(entity);
      }
    }

    return result;
  }

  /**
   * Register custom entity pattern
   */
  public registerPattern(name: string, pattern: EntityPattern): void {
    if (!this.customPatterns.has(name)) {
      this.customPatterns.set(name, []);
    }
    this.customPatterns.get(name)!.push(pattern);
  }

  /**
   * Extract entities of specific type
   */
  public extractByType(text: string, type: EntityType): Entity[] {
    const allEntities = this.extract(text);
    return allEntities.filter((entity) => entity.type === type);
  }
}

// ===== Named Entity Recognizer =====

export class NamedEntityRecognizer extends EntityExtractor {
  private gazetteer: Map<EntityType, Set<string>> = new Map();

  constructor() {
    super();
    this.initializeGazetteer();
  }

  /**
   * Initialize gazetteer with known entities
   */
  private initializeGazetteer(): void {
    // Common person names
    this.addToGazetteer('person', [
      'john',
      'mary',
      'robert',
      'sarah',
      'michael',
      'jennifer',
      'william',
      'elizabeth',
    ]);

    // Common locations
    this.addToGazetteer('location', [
      'new york',
      'los angeles',
      'chicago',
      'houston',
      'london',
      'paris',
      'tokyo',
      'beijing',
    ]);

    // Common organizations
    this.addToGazetteer('organization', [
      'google',
      'microsoft',
      'apple',
      'amazon',
      'facebook',
      'tesla',
      'ibm',
      'oracle',
    ]);
  }

  /**
   * Add entries to gazetteer
   */
  public addToGazetteer(type: EntityType, entries: string[]): void {
    if (!this.gazetteer.has(type)) {
      this.gazetteer.set(type, new Set());
    }

    const set = this.gazetteer.get(type)!;
    entries.forEach((entry) => set.add(entry.toLowerCase()));
  }

  /**
   * Extract named entities using gazetteer lookup
   */
  public extractNamed(text: string): Entity[] {
    const entities: Entity[] = [];
    const lowerText = text.toLowerCase();

    this.gazetteer.forEach((entries, type) => {
      entries.forEach((entry) => {
        let index = 0;
        while ((index = lowerText.indexOf(entry, index)) !== -1) {
          // Check if it's a word boundary
          const before = index === 0 || /\s/.test(text[index - 1]);
          const after = index + entry.length === text.length || /\s/.test(text[index + entry.length]);

          if (before && after) {
            entities.push({
              type,
              value: text.substr(index, entry.length),
              normalizedValue: entry,
              startIndex: index,
              endIndex: index + entry.length,
              confidence: 0.9,
            });
          }

          index += entry.length;
        }
      });
    });

    // Also get pattern-based entities
    const patternEntities = this.extract(text);
    entities.push(...patternEntities);

    // Sort and remove overlaps
    entities.sort((a, b) => a.startIndex - b.startIndex);
    return this.removeOverlaps(entities);
  }

  /**
   * Remove overlapping entities (override to keep higher confidence)
   */
  private removeOverlaps(entities: Entity[]): Entity[] {
    const result: Entity[] = [];

    for (const entity of entities) {
      const overlapping = result.findIndex(
        (existing) =>
          (entity.startIndex >= existing.startIndex && entity.startIndex < existing.endIndex) ||
          (entity.endIndex > existing.startIndex && entity.endIndex <= existing.endIndex)
      );

      if (overlapping === -1) {
        result.push(entity);
      } else if (entity.confidence > result[overlapping].confidence) {
        result[overlapping] = entity;
      }
    }

    return result;
  }
}

// ===== Contextual Entity Extractor =====

export interface ExtractionContext {
  previousEntities?: Entity[];
  topic?: string;
  userPreferences?: Record<string, any>;
}

export class ContextualEntityExtractor extends NamedEntityRecognizer {
  private context: ExtractionContext = {};

  /**
   * Extract entities with context awareness
   */
  public extractWithContext(text: string, context?: ExtractionContext): Entity[] {
    if (context) {
      this.context = context;
    }

    const entities = this.extractNamed(text);

    // Enhance entities with context
    return entities.map((entity) => this.enhanceWithContext(entity));
  }

  /**
   * Enhance entity with contextual information
   */
  private enhanceWithContext(entity: Entity): Entity {
    // Example: boost confidence if entity matches previous context
    if (this.context.previousEntities) {
      const previousMatch = this.context.previousEntities.find(
        (prev) => prev.normalizedValue === entity.normalizedValue
      );

      if (previousMatch) {
        entity.confidence = Math.min(entity.confidence + 0.1, 1.0);
      }
    }

    return entity;
  }

  /**
   * Set extraction context
   */
  public setContext(context: ExtractionContext): void {
    this.context = context;
  }

  /**
   * Get current context
   */
  public getContext(): ExtractionContext {
    return { ...this.context };
  }
}

// ===== Example Usage =====

/**
 * Example 1: Basic entity extraction
 */
export function example1_BasicExtraction() {
  const extractor = new EntityExtractor();

  const text = `
    Please send the report to john.doe@example.com or call me at 555-123-4567.
    The meeting is scheduled for 03/15/2024 at 2:30 PM and will last 2 hours.
    The project budget is $50,000 and we need 75% completion by next month.
  `;

  const entities = extractor.extract(text);

  console.log('Extracted entities:');
  entities.forEach((entity) => {
    console.log(`- ${entity.type}: "${entity.value}" (normalized: ${JSON.stringify(entity.normalizedValue)})`);
  });
}

/**
 * Example 2: Named entity recognition
 */
export function example2_NamedEntities() {
  const recognizer = new NamedEntityRecognizer();

  // Add custom entities to gazetteer
  recognizer.addToGazetteer('person', ['alice smith', 'bob johnson', 'carol williams']);
  recognizer.addToGazetteer('location', ['san francisco', 'seattle', 'boston']);
  recognizer.addToGazetteer('organization', ['openai', 'anthropic', 'deepmind']);

  const text = `
    Alice Smith from OpenAI will visit our San Francisco office next week.
    She will meet with Bob Johnson to discuss the project timeline.
  `;

  const entities = recognizer.extractNamed(text);

  console.log('Named entities:');
  entities.forEach((entity) => {
    console.log(`- ${entity.type}: "${entity.value}" (confidence: ${entity.confidence})`);
  });
}

/**
 * Example 3: Extract specific entity types
 */
export function example3_TypeSpecificExtraction() {
  const extractor = new EntityExtractor();

  const text = `
    The event is on 05/20/2024 at 3:00 PM.
    Contact: support@company.com or call 1-800-555-0123.
    Budget: $25,000 with 30% allocated to marketing.
    Visit our website at https://example.com for more details.
  `;

  // Extract only dates
  console.log('Dates:');
  const dates = extractor.extractByType(text, 'date');
  dates.forEach((entity) => console.log(`- ${entity.value}`));

  // Extract only emails
  console.log('\nEmails:');
  const emails = extractor.extractByType(text, 'email');
  emails.forEach((entity) => console.log(`- ${entity.value}`));

  // Extract only currency
  console.log('\nCurrency:');
  const currency = extractor.extractByType(text, 'currency');
  currency.forEach((entity) => console.log(`- ${entity.value} (${entity.normalizedValue})`));
}

/**
 * Example 4: Custom entity patterns
 */
export function example4_CustomPatterns() {
  const extractor = new EntityExtractor();

  // Register custom patterns
  extractor.registerPattern('product_code', {
    type: 'custom',
    pattern: /\b[A-Z]{2,3}-\d{4,6}\b/g,
    normalizer: (value) => value.toUpperCase(),
  });

  extractor.registerPattern('ticket_number', {
    type: 'custom',
    pattern: /\bTICKET-\d{6}\b/gi,
    normalizer: (value) => value.toUpperCase(),
  });

  const text = `
    Please check product codes AB-12345 and XYZ-987654.
    Related tickets: TICKET-123456 and TICKET-789012.
  `;

  const entities = extractor.extract(text);

  console.log('Custom entities:');
  entities.forEach((entity) => {
    console.log(`- ${entity.type}: "${entity.value}" (normalized: ${entity.normalizedValue})`);
  });
}

/**
 * Example 5: Contextual entity extraction
 */
export function example5_ContextualExtraction() {
  const extractor = new ContextualEntityExtractor();

  // First message in conversation
  const text1 = 'I need to book a flight to New York for next Friday';
  const entities1 = extractor.extractWithContext(text1);

  console.log('Message 1 entities:');
  entities1.forEach((e) => console.log(`- ${e.type}: ${e.value}`));

  // Set context from first message
  extractor.setContext({
    previousEntities: entities1,
    topic: 'travel',
  });

  // Second message (referencing previous context)
  const text2 = 'Also book a hotel in the same city for 3 nights';
  const entities2 = extractor.extractWithContext(text2);

  console.log('\nMessage 2 entities:');
  entities2.forEach((e) => console.log(`- ${e.type}: ${e.value} (confidence: ${e.confidence})`));
}

/**
 * Example 6: Entity resolution and linking
 */
export function example6_EntityResolution() {
  const extractor = new NamedEntityRecognizer();

  // Add entities with variations
  extractor.addToGazetteer('organization', [
    'microsoft',
    'microsoft corporation',
    'msft',
  ]);

  extractor.addToGazetteer('person', [
    'bill gates',
    'william gates',
    'william h. gates',
  ]);

  const text = `
    Bill Gates founded Microsoft Corporation in 1975.
    MSFT is now one of the largest tech companies.
    William Gates III is known for his philanthropy.
  `;

  const entities = extractor.extractNamed(text);

  console.log('Resolved entities:');
  entities.forEach((entity) => {
    console.log(`- ${entity.type}: "${entity.value}" → ${entity.normalizedValue}`);
  });
}

/**
 * Example 7: Multi-language entity extraction
 */
export function example7_MultiLanguage() {
  const extractor = new EntityExtractor();

  // Add patterns for different languages
  extractor.registerPattern('spanish_date', {
    type: 'date',
    pattern: /\b\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+\d{4}\b/gi,
    normalizer: (value) => {
      // Convert Spanish month names to English
      const monthMap: Record<string, string> = {
        enero: 'January',
        febrero: 'February',
        marzo: 'March',
        abril: 'April',
        mayo: 'May',
        junio: 'June',
        julio: 'July',
        agosto: 'August',
        septiembre: 'September',
        octubre: 'October',
        noviembre: 'November',
        diciembre: 'December',
      };

      const parts = value.split(/\s+/);
      const day = parts[0];
      const month = monthMap[parts[2].toLowerCase()];
      const year = parts[4];

      return new Date(`${month} ${day}, ${year}`);
    },
  });

  const text = 'La reunión es el 15 de marzo de 2024';

  const entities = extractor.extract(text);

  console.log('Multi-language entities:');
  entities.forEach((entity) => {
    console.log(`- ${entity.type}: "${entity.value}"`);
    console.log(`  Normalized: ${entity.normalizedValue}`);
  });
}

/**
 * Best Practices:
 *
 * 1. Pattern Design:
 *    - Use specific patterns to reduce false positives
 *    - Test patterns with diverse inputs
 *    - Consider language and regional variations
 *
 * 2. Entity Normalization:
 *    - Normalize entities to standard formats
 *    - Handle variations (e.g., "NYC" → "New York City")
 *    - Preserve original value for display
 *
 * 3. Gazetteer Management:
 *    - Keep gazetteer up to date
 *    - Include common variations
 *    - Consider domain-specific entities
 *
 * 4. Context Usage:
 *    - Use conversation context to improve accuracy
 *    - Resolve references (e.g., "it", "there")
 *    - Track entity mentions across turns
 *
 * 5. Performance:
 *    - Cache compiled regex patterns
 *    - Limit pattern complexity
 *    - Use appropriate data structures for lookups
 */
