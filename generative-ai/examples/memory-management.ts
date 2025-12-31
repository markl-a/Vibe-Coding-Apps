/**
 * Memory Management Examples
 *
 * This file demonstrates:
 * - Conversation history
 * - Summary memory
 * - Buffer window
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// 1. CONVERSATION HISTORY
// ============================================================================

/**
 * Message interface for conversation
 */
interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Basic conversation history manager
 */
class ConversationHistory {
  private messages: ConversationMessage[] = [];
  private systemPrompt?: string;

  constructor(systemPrompt?: string) {
    this.systemPrompt = systemPrompt;
  }

  /**
   * Add a message to history
   */
  addMessage(role: 'user' | 'assistant', content: string, metadata?: Record<string, unknown>): void {
    this.messages.push({
      role,
      content,
      timestamp: Date.now(),
      metadata,
    });
  }

  /**
   * Get all messages
   */
  getMessages(): ConversationMessage[] {
    return [...this.messages];
  }

  /**
   * Get messages formatted for OpenAI API
   */
  getOpenAIMessages(): OpenAI.Chat.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (this.systemPrompt) {
      messages.push({ role: 'system', content: this.systemPrompt });
    }

    for (const msg of this.messages) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    return messages;
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.messages = [];
  }

  /**
   * Get message count
   */
  count(): number {
    return this.messages.length;
  }

  /**
   * Get total character count
   */
  getTotalChars(): number {
    return this.messages.reduce((sum, msg) => sum + msg.content.length, 0);
  }

  /**
   * Search messages by content
   */
  search(query: string): ConversationMessage[] {
    const lowerQuery = query.toLowerCase();
    return this.messages.filter(msg =>
      msg.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get messages by role
   */
  getByRole(role: 'user' | 'assistant'): ConversationMessage[] {
    return this.messages.filter(msg => msg.role === role);
  }

  /**
   * Get recent messages
   */
  getRecent(count: number): ConversationMessage[] {
    return this.messages.slice(-count);
  }
}

/**
 * Example: Basic conversation with history
 */
async function basicConversationExample(): Promise<void> {
  const conversation = new ConversationHistory(
    'You are a helpful assistant with expertise in technology.'
  );

  const exchanges = [
    'What is TypeScript?',
    'How does it compare to JavaScript?',
    'Can you give me an example of a TypeScript interface?',
  ];

  console.log('Conversation History Example\n');

  for (const userMessage of exchanges) {
    conversation.addMessage('user', userMessage);

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: conversation.getOpenAIMessages(),
      max_tokens: 200,
    });

    const assistantMessage = response.choices[0].message.content || '';
    conversation.addMessage('assistant', assistantMessage);

    console.log(`User: ${userMessage}`);
    console.log(`Assistant: ${assistantMessage}\n`);
  }

  console.log(`Total messages: ${conversation.count()}`);
  console.log(`Total characters: ${conversation.getTotalChars()}`);
}

// ============================================================================
// 2. SUMMARY MEMORY
// ============================================================================

/**
 * Summary-based memory system
 */
class SummaryMemory {
  private summary: string = '';
  private recentMessages: ConversationMessage[] = [];
  private maxRecentMessages: number;
  private systemPrompt?: string;

  constructor(maxRecentMessages: number = 5, systemPrompt?: string) {
    this.maxRecentMessages = maxRecentMessages;
    this.systemPrompt = systemPrompt;
  }

  /**
   * Add a message and update summary if needed
   */
  async addMessage(role: 'user' | 'assistant', content: string): Promise<void> {
    this.recentMessages.push({
      role,
      content,
      timestamp: Date.now(),
    });

    // If we exceed max recent messages, summarize old ones
    if (this.recentMessages.length > this.maxRecentMessages) {
      await this.updateSummary();
    }
  }

  /**
   * Update the conversation summary
   */
  private async updateSummary(): Promise<void> {
    // Get messages to summarize (keep last maxRecentMessages)
    const messagesToSummarize = this.recentMessages.slice(
      0,
      this.recentMessages.length - this.maxRecentMessages
    );

    if (messagesToSummarize.length === 0) {
      return;
    }

    // Create summary prompt
    const conversationText = messagesToSummarize
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const summaryPrompt = this.summary
      ? `Previous summary: ${this.summary}\n\nNew conversation:\n${conversationText}\n\nUpdate the summary to include the new information.`
      : `Summarize the following conversation concisely:\n\n${conversationText}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise summaries of conversations.',
        },
        {
          role: 'user',
          content: summaryPrompt,
        },
      ],
      max_tokens: 300,
    });

    this.summary = response.choices[0].message.content || '';

    // Keep only recent messages
    this.recentMessages = this.recentMessages.slice(-this.maxRecentMessages);

    console.log('\n[Summary Updated]');
    console.log(this.summary);
    console.log('---\n');
  }

  /**
   * Get messages for OpenAI API with summary context
   */
  getOpenAIMessages(): OpenAI.Chat.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    // Add system prompt with summary
    let systemContent = this.systemPrompt || 'You are a helpful assistant.';
    if (this.summary) {
      systemContent += `\n\nConversation summary so far: ${this.summary}`;
    }
    messages.push({ role: 'system', content: systemContent });

    // Add recent messages
    for (const msg of this.recentMessages) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    return messages;
  }

  /**
   * Get current summary
   */
  getSummary(): string {
    return this.summary;
  }

  /**
   * Clear all memory
   */
  clear(): void {
    this.summary = '';
    this.recentMessages = [];
  }
}

/**
 * Example: Long conversation with summary memory
 */
async function summaryMemoryExample(): Promise<void> {
  const memory = new SummaryMemory(3, 'You are a knowledgeable AI assistant.');

  const exchanges = [
    'Tell me about the history of computers.',
    'What were the first computers used for?',
    'How did personal computers become popular?',
    'What is the difference between hardware and software?',
    'Can you explain what an operating system does?',
    'What about mobile operating systems?',
    'How do modern smartphones compare to early computers?', // This will trigger summary
    'What role did Steve Jobs play in personal computing?',
  ];

  console.log('Summary Memory Example\n');

  for (const userMessage of exchanges) {
    await memory.addMessage('user', userMessage);

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: memory.getOpenAIMessages(),
      max_tokens: 150,
    });

    const assistantMessage = response.choices[0].message.content || '';
    await memory.addMessage('assistant', assistantMessage);

    console.log(`User: ${userMessage}`);
    console.log(`Assistant: ${assistantMessage}\n`);
  }

  console.log('Final Summary:');
  console.log(memory.getSummary());
}

// ============================================================================
// 3. BUFFER WINDOW MEMORY
// ============================================================================

/**
 * Buffer window memory with token tracking
 */
class BufferWindowMemory {
  private messages: ConversationMessage[] = [];
  private maxTokens: number;
  private systemPrompt?: string;
  private readonly CHARS_PER_TOKEN = 4; // Rough estimate

  constructor(maxTokens: number = 2000, systemPrompt?: string) {
    this.maxTokens = maxTokens;
    this.systemPrompt = systemPrompt;
  }

  /**
   * Estimate token count for a message
   */
  private estimateTokens(content: string): number {
    return Math.ceil(content.length / this.CHARS_PER_TOKEN);
  }

  /**
   * Get total estimated tokens
   */
  private getTotalTokens(): number {
    let total = 0;

    if (this.systemPrompt) {
      total += this.estimateTokens(this.systemPrompt);
    }

    for (const msg of this.messages) {
      total += this.estimateTokens(msg.content);
    }

    return total;
  }

  /**
   * Add message and trim if needed
   */
  addMessage(role: 'user' | 'assistant', content: string): void {
    this.messages.push({
      role,
      content,
      timestamp: Date.now(),
    });

    // Trim old messages if we exceed token limit
    this.trimToFit();
  }

  /**
   * Trim messages to fit within token limit
   */
  private trimToFit(): void {
    while (this.getTotalTokens() > this.maxTokens && this.messages.length > 2) {
      // Always keep at least one exchange (user + assistant)
      this.messages.shift();
    }
  }

  /**
   * Get messages for OpenAI API
   */
  getOpenAIMessages(): OpenAI.Chat.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (this.systemPrompt) {
      messages.push({ role: 'system', content: this.systemPrompt });
    }

    for (const msg of this.messages) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    return messages;
  }

  /**
   * Get current stats
   */
  getStats(): {
    messageCount: number;
    estimatedTokens: number;
    maxTokens: number;
    utilizationPercent: number;
  } {
    const estimatedTokens = this.getTotalTokens();

    return {
      messageCount: this.messages.length,
      estimatedTokens,
      maxTokens: this.maxTokens,
      utilizationPercent: (estimatedTokens / this.maxTokens) * 100,
    };
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.messages = [];
  }
}

/**
 * Example: Buffer window with token management
 */
async function bufferWindowExample(): Promise<void> {
  const memory = new BufferWindowMemory(1000, 'You are a helpful coding assistant.');

  const exchanges = [
    'Explain what a closure is in JavaScript',
    'Can you show me an example?',
    'How are closures useful in React?',
    'What is the difference between let and var?',
    'Can you explain hoisting?',
    'Show me an example of hoisting',
  ];

  console.log('Buffer Window Memory Example\n');

  for (const userMessage of exchanges) {
    memory.addMessage('user', userMessage);

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: memory.getOpenAIMessages(),
      max_tokens: 150,
    });

    const assistantMessage = response.choices[0].message.content || '';
    memory.addMessage('assistant', assistantMessage);

    const stats = memory.getStats();

    console.log(`User: ${userMessage}`);
    console.log(`Assistant: ${assistantMessage}`);
    console.log(`[Memory: ${stats.messageCount} msgs, ~${stats.estimatedTokens} tokens, ${stats.utilizationPercent.toFixed(1)}% full]\n`);
  }
}

// ============================================================================
// 4. ADVANCED MEMORY STRATEGIES
// ============================================================================

/**
 * Hybrid memory combining multiple strategies
 */
class HybridMemory {
  private summaryMemory: SummaryMemory;
  private bufferMemory: BufferWindowMemory;
  private importantMessages: ConversationMessage[] = [];

  constructor(
    maxRecentMessages: number = 5,
    maxTokens: number = 2000,
    systemPrompt?: string
  ) {
    this.summaryMemory = new SummaryMemory(maxRecentMessages, systemPrompt);
    this.bufferMemory = new BufferWindowMemory(maxTokens, systemPrompt);
  }

  /**
   * Add message with importance flag
   */
  async addMessage(
    role: 'user' | 'assistant',
    content: string,
    important: boolean = false
  ): Promise<void> {
    await this.summaryMemory.addMessage(role, content);
    this.bufferMemory.addMessage(role, content);

    if (important) {
      this.importantMessages.push({
        role,
        content,
        timestamp: Date.now(),
        metadata: { important: true },
      });
    }
  }

  /**
   * Get messages using hybrid strategy
   */
  getOpenAIMessages(): OpenAI.Chat.ChatCompletionMessageParam[] {
    // Start with buffer memory messages
    const messages = this.bufferMemory.getOpenAIMessages();

    // Add important messages that might not be in buffer
    for (const importantMsg of this.importantMessages) {
      const alreadyIncluded = messages.some(
        msg => msg.role === importantMsg.role && msg.content === importantMsg.content
      );

      if (!alreadyIncluded) {
        // Insert important messages near the beginning (after system prompt)
        messages.splice(1, 0, {
          role: importantMsg.role,
          content: `[Important context]: ${importantMsg.content}`,
        });
      }
    }

    return messages;
  }

  /**
   * Get summary for reference
   */
  getSummary(): string {
    return this.summaryMemory.getSummary();
  }

  /**
   * Clear all memory
   */
  clear(): void {
    this.summaryMemory.clear();
    this.bufferMemory.clear();
    this.importantMessages = [];
  }
}

/**
 * Example: Hybrid memory strategy
 */
async function hybridMemoryExample(): Promise<void> {
  const memory = new HybridMemory(3, 800, 'You are a project management assistant.');

  const exchanges = [
    { text: 'We are starting a new project called Phoenix.', important: true },
    { text: 'The deadline is December 31st.', important: true },
    { text: 'Who should be on the team?' },
    { text: 'What tasks need to be completed first?' },
    { text: 'How should we track progress?' },
    { text: 'What is the project deadline again?' }, // Should recall from important messages
  ];

  console.log('Hybrid Memory Example\n');

  for (const exchange of exchanges) {
    await memory.addMessage('user', exchange.text, exchange.important || false);

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: memory.getOpenAIMessages(),
      max_tokens: 150,
    });

    const assistantMessage = response.choices[0].message.content || '';
    await memory.addMessage('assistant', assistantMessage);

    const importantTag = exchange.important ? ' [IMPORTANT]' : '';
    console.log(`User: ${exchange.text}${importantTag}`);
    console.log(`Assistant: ${assistantMessage}\n`);
  }

  console.log('Conversation Summary:');
  console.log(memory.getSummary());
}

/**
 * Persistent memory with storage
 */
class PersistentMemory extends ConversationHistory {
  private storageKey: string;

  constructor(storageKey: string, systemPrompt?: string) {
    super(systemPrompt);
    this.storageKey = storageKey;
    this.load();
  }

  /**
   * Save to storage (localStorage/file in real implementation)
   */
  save(): void {
    const data = {
      messages: this.getMessages(),
      timestamp: Date.now(),
    };

    // In browser: localStorage.setItem(this.storageKey, JSON.stringify(data));
    // In Node.js: fs.writeFileSync(this.storageKey, JSON.stringify(data));
    console.log(`[Saved ${this.count()} messages to ${this.storageKey}]`);
  }

  /**
   * Load from storage
   */
  load(): void {
    try {
      // In browser: const data = localStorage.getItem(this.storageKey);
      // In Node.js: const data = fs.readFileSync(this.storageKey, 'utf-8');
      // const parsed = JSON.parse(data);
      // For demo purposes, we skip actual loading
      console.log(`[Loaded memory from ${this.storageKey}]`);
    } catch (error) {
      console.log(`[No existing memory found for ${this.storageKey}]`);
    }
  }

  /**
   * Override addMessage to auto-save
   */
  override addMessage(
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, unknown>
  ): void {
    super.addMessage(role, content, metadata);
    this.save();
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  try {
    console.log('=== Memory Management Examples ===\n');

    console.log('1. Basic Conversation History');
    console.log('------------------------------');
    await basicConversationExample();

    console.log('\n\n2. Summary Memory');
    console.log('-----------------');
    await summaryMemoryExample();

    console.log('\n\n3. Buffer Window Memory');
    console.log('-----------------------');
    await bufferWindowExample();

    console.log('\n\n4. Hybrid Memory Strategy');
    console.log('--------------------------');
    await hybridMemoryExample();

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  main();
}

export {
  ConversationMessage,
  ConversationHistory,
  SummaryMemory,
  BufferWindowMemory,
  HybridMemory,
  PersistentMemory,
  basicConversationExample,
  summaryMemoryExample,
  bufferWindowExample,
  hybridMemoryExample,
};
