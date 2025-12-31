/**
 * Dialog Management Example
 * Demonstrates managing multi-turn conversations and dialog flow
 */

// ===== Dialog State =====

export interface DialogState {
  currentIntent?: string;
  slots: Record<string, any>;
  context: Record<string, any>;
  history: DialogTurn[];
  completed: boolean;
}

export interface DialogTurn {
  speaker: 'user' | 'assistant';
  text: string;
  intent?: string;
  entities?: Record<string, any>;
  timestamp: number;
}

export interface DialogNode {
  id: string;
  prompt?: string;
  action?: (state: DialogState) => void;
  next?: string | ((state: DialogState) => string);
  requireSlots?: string[];
  validate?: (state: DialogState) => boolean;
}

// ===== Dialog Manager =====

export class DialogManager {
  private state: DialogState;
  private nodes: Map<string, DialogNode> = new Map();
  private currentNode = 'start';

  constructor() {
    this.state = {
      slots: {},
      context: {},
      history: [],
      completed: false,
    };
  }

  /**
   * Register a dialog node
   */
  public registerNode(node: DialogNode): void {
    this.nodes.set(node.id, node);
  }

  /**
   * Process user input
   */
  public processInput(input: string, intent?: string, entities?: Record<string, any>): string {
    // Add user turn to history
    this.addTurn('user', input, intent, entities);

    // Update slots from entities
    if (entities) {
      Object.assign(this.state.slots, entities);
    }

    // Update intent if provided
    if (intent) {
      this.state.currentIntent = intent;
    }

    // Get current node
    const node = this.nodes.get(this.currentNode);

    if (!node) {
      return 'I encountered an error. Please try again.';
    }

    // Check if required slots are filled
    if (node.requireSlots) {
      const missingSlot = node.requireSlots.find((slot) => !this.state.slots[slot]);

      if (missingSlot) {
        const response = this.promptForSlot(missingSlot);
        this.addTurn('assistant', response);
        return response;
      }
    }

    // Validate state
    if (node.validate && !node.validate(this.state)) {
      const response = 'Sorry, I could not validate that information. Please try again.';
      this.addTurn('assistant', response);
      return response;
    }

    // Execute node action
    if (node.action) {
      node.action(this.state);
    }

    // Determine next node
    let nextNodeId: string;
    if (typeof node.next === 'function') {
      nextNodeId = node.next(this.state);
    } else if (node.next) {
      nextNodeId = node.next;
    } else {
      // No next node, conversation complete
      this.state.completed = true;
      nextNodeId = 'end';
    }

    this.currentNode = nextNodeId;

    // Get response from next node
    const nextNode = this.nodes.get(nextNodeId);
    const response = nextNode?.prompt || 'Thank you!';

    this.addTurn('assistant', response);

    return response;
  }

  /**
   * Prompt for missing slot
   */
  private promptForSlot(slot: string): string {
    // Default prompts for common slots
    const defaultPrompts: Record<string, string> = {
      name: 'What is your name?',
      email: 'What is your email address?',
      phone: 'What is your phone number?',
      date: 'What date would you like?',
      time: 'What time works for you?',
      location: 'Where would you like this?',
      amount: 'What amount?',
    };

    return defaultPrompts[slot] || `Please provide ${slot}.`;
  }

  /**
   * Add turn to history
   */
  private addTurn(
    speaker: 'user' | 'assistant',
    text: string,
    intent?: string,
    entities?: Record<string, any>
  ): void {
    this.state.history.push({
      speaker,
      text,
      intent,
      entities,
      timestamp: Date.now(),
    });
  }

  /**
   * Get current state
   */
  public getState(): DialogState {
    return { ...this.state };
  }

  /**
   * Set state
   */
  public setState(state: Partial<DialogState>): void {
    this.state = { ...this.state, ...state };
  }

  /**
   * Reset dialog
   */
  public reset(): void {
    this.state = {
      slots: {},
      context: {},
      history: [],
      completed: false,
    };
    this.currentNode = 'start';
  }

  /**
   * Get conversation history
   */
  public getHistory(): DialogTurn[] {
    return [...this.state.history];
  }
}

// ===== Slot-Filling Dialog Manager =====

export interface SlotDefinition {
  name: string;
  type: string;
  required: boolean;
  prompt: string;
  validate?: (value: any) => boolean;
  errorMessage?: string;
}

export class SlotFillingDialogManager {
  private slots: Map<string, SlotDefinition> = new Map();
  private filledSlots: Map<string, any> = new Map();
  private currentSlot: string | null = null;
  private onComplete?: (slots: Record<string, any>) => void;

  /**
   * Register slot definitions
   */
  public registerSlots(slots: SlotDefinition[]): void {
    slots.forEach((slot) => {
      this.slots.set(slot.name, slot);
    });
  }

  /**
   * Process user input
   */
  public processInput(input: string, entities?: Record<string, any>): string {
    // Fill slots from entities
    if (entities) {
      Object.entries(entities).forEach(([key, value]) => {
        const slot = this.slots.get(key);
        if (slot) {
          this.fillSlot(key, value);
        }
      });
    }

    // Check if all required slots are filled
    const nextSlot = this.getNextRequiredSlot();

    if (!nextSlot) {
      // All slots filled, complete dialog
      const result = Object.fromEntries(this.filledSlots);

      if (this.onComplete) {
        this.onComplete(result);
      }

      return 'Thank you! I have all the information I need.';
    }

    // Prompt for next slot
    this.currentSlot = nextSlot;
    return this.slots.get(nextSlot)!.prompt;
  }

  /**
   * Fill a slot
   */
  private fillSlot(name: string, value: any): boolean {
    const slot = this.slots.get(name);

    if (!slot) {
      return false;
    }

    // Validate value
    if (slot.validate && !slot.validate(value)) {
      return false;
    }

    this.filledSlots.set(name, value);
    return true;
  }

  /**
   * Get next required slot that is not filled
   */
  private getNextRequiredSlot(): string | null {
    for (const [name, slot] of this.slots) {
      if (slot.required && !this.filledSlots.has(name)) {
        return name;
      }
    }
    return null;
  }

  /**
   * Set completion callback
   */
  public onCompletion(callback: (slots: Record<string, any>) => void): void {
    this.onComplete = callback;
  }

  /**
   * Reset dialog
   */
  public reset(): void {
    this.filledSlots.clear();
    this.currentSlot = null;
  }

  /**
   * Get filled slots
   */
  public getFilledSlots(): Record<string, any> {
    return Object.fromEntries(this.filledSlots);
  }
}

// ===== State Machine Dialog Manager =====

export interface StateMachineConfig {
  initialState: string;
  states: Record<string, StateConfig>;
}

export interface StateConfig {
  onEnter?: (context: Record<string, any>) => string;
  onExit?: (context: Record<string, any>) => void;
  transitions: Record<string, string | ((context: Record<string, any>) => string)>;
}

export class StateMachineDialogManager {
  private currentState: string;
  private states: Record<string, StateConfig>;
  private context: Record<string, any> = {};

  constructor(config: StateMachineConfig) {
    this.currentState = config.initialState;
    this.states = config.states;
  }

  /**
   * Process input and transition states
   */
  public processInput(input: string, intent?: string): string {
    const state = this.states[this.currentState];

    if (!state) {
      return 'I encountered an error. Please start over.';
    }

    // Determine next state based on intent
    const transition = intent ? state.transitions[intent] : null;

    if (!transition) {
      return 'I did not understand that. Could you please rephrase?';
    }

    // Call onExit for current state
    if (state.onExit) {
      state.onExit(this.context);
    }

    // Transition to next state
    const nextState = typeof transition === 'function' ? transition(this.context) : transition;
    this.currentState = nextState;

    // Call onEnter for new state
    const newState = this.states[nextState];
    if (newState?.onEnter) {
      return newState.onEnter(this.context);
    }

    return 'What would you like to do next?';
  }

  /**
   * Get current state
   */
  public getCurrentState(): string {
    return this.currentState;
  }

  /**
   * Set context
   */
  public setContext(context: Record<string, any>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Get context
   */
  public getContext(): Record<string, any> {
    return { ...this.context };
  }

  /**
   * Reset to initial state
   */
  public reset(): void {
    this.currentState = this.states[this.currentState] ? this.currentState : 'start';
    this.context = {};
  }
}

// ===== Example Usage =====

/**
 * Example 1: Basic dialog flow
 */
export function example1_BasicDialog() {
  const manager = new DialogManager();

  // Define dialog nodes
  manager.registerNode({
    id: 'start',
    prompt: 'Hello! Would you like to book a restaurant reservation?',
    next: (state) => {
      // Simple yes/no logic
      return state.currentIntent === 'yes' ? 'get_date' : 'end';
    },
  });

  manager.registerNode({
    id: 'get_date',
    prompt: 'What date would you like to reserve?',
    requireSlots: ['date'],
    next: 'get_time',
  });

  manager.registerNode({
    id: 'get_time',
    prompt: 'What time?',
    requireSlots: ['date', 'time'],
    next: 'get_party_size',
  });

  manager.registerNode({
    id: 'get_party_size',
    prompt: 'How many people?',
    requireSlots: ['date', 'time', 'party_size'],
    next: 'confirm',
  });

  manager.registerNode({
    id: 'confirm',
    prompt: 'Let me confirm your reservation...',
    action: (state) => {
      console.log('Booking reservation:', state.slots);
    },
    next: 'end',
  });

  manager.registerNode({
    id: 'end',
    prompt: 'Thank you for your reservation! Have a great day!',
  });

  // Simulate conversation
  console.log('Bot:', manager.processInput('Hi', 'greeting'));
  console.log('Bot:', manager.processInput('Yes, I would', 'yes'));
  console.log('Bot:', manager.processInput('Tomorrow', undefined, { date: 'tomorrow' }));
  console.log('Bot:', manager.processInput('7 PM', undefined, { time: '7:00 PM' }));
  console.log('Bot:', manager.processInput('4 people', undefined, { party_size: 4 }));
}

/**
 * Example 2: Slot-filling dialog
 */
export function example2_SlotFilling() {
  const manager = new SlotFillingDialogManager();

  // Define slots
  manager.registerSlots([
    {
      name: 'name',
      type: 'string',
      required: true,
      prompt: 'What is your name?',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      prompt: 'What is your email address?',
      validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      errorMessage: 'Please provide a valid email address.',
    },
    {
      name: 'phone',
      type: 'phone',
      required: true,
      prompt: 'What is your phone number?',
    },
  ]);

  // Set completion callback
  manager.onCompletion((slots) => {
    console.log('Registration complete:', slots);
    // Send confirmation email, etc.
  });

  // Simulate conversation
  console.log('Bot:', manager.processInput('Hello', {}));
  console.log('Bot:', manager.processInput('John Doe', { name: 'John Doe' }));
  console.log('Bot:', manager.processInput('john@example.com', { email: 'john@example.com' }));
  console.log('Bot:', manager.processInput('555-1234', { phone: '555-1234' }));
}

/**
 * Example 3: State machine dialog
 */
export function example3_StateMachine() {
  const manager = new StateMachineDialogManager({
    initialState: 'greeting',
    states: {
      greeting: {
        onEnter: () => 'Hi! How can I help you today?',
        transitions: {
          check_balance: 'balance',
          transfer_money: 'transfer',
          help: 'help',
        },
      },
      balance: {
        onEnter: (context) => {
          const balance = 5000; // Mock balance
          context.balance = balance;
          return `Your current balance is $${balance}. What else can I help you with?`;
        },
        transitions: {
          transfer_money: 'transfer',
          main_menu: 'greeting',
          done: 'goodbye',
        },
      },
      transfer: {
        onEnter: () => 'Who would you like to transfer money to?',
        transitions: {
          confirm_transfer: 'confirm_transfer',
          cancel: 'greeting',
        },
      },
      confirm_transfer: {
        onEnter: (context) => {
          return `Transfer $${context.amount} to ${context.recipient}? Say "confirm" or "cancel".`;
        },
        transitions: {
          confirm: 'transfer_complete',
          cancel: 'greeting',
        },
      },
      transfer_complete: {
        onEnter: () => 'Transfer complete! Is there anything else I can help you with?',
        transitions: {
          check_balance: 'balance',
          done: 'goodbye',
        },
      },
      help: {
        onEnter: () => 'You can check your balance, transfer money, or ask for help.',
        transitions: {
          main_menu: 'greeting',
        },
      },
      goodbye: {
        onEnter: () => 'Thank you for banking with us. Goodbye!',
        transitions: {},
      },
    },
  });

  // Simulate conversation
  console.log('Bot:', manager.processInput('Hello', 'greeting'));
  console.log('Bot:', manager.processInput('Check my balance', 'check_balance'));
  console.log('Bot:', manager.processInput('Transfer money', 'transfer_money'));

  manager.setContext({ recipient: 'Alice', amount: 100 });
  console.log('Bot:', manager.processInput('Alice', 'confirm_transfer'));
  console.log('Bot:', manager.processInput('Confirm', 'confirm'));
  console.log('Bot:', manager.processInput('Done', 'done'));
}

/**
 * Example 4: Multi-intent handling
 */
export function example4_MultiIntent() {
  const manager = new DialogManager();

  manager.registerNode({
    id: 'start',
    prompt: 'Welcome! You can ask about weather, set a timer, or play music.',
    next: (state) => {
      switch (state.currentIntent) {
        case 'weather':
          return 'weather';
        case 'set_timer':
          return 'timer';
        case 'play_music':
          return 'music';
        default:
          return 'start';
      }
    },
  });

  manager.registerNode({
    id: 'weather',
    requireSlots: ['location'],
    action: (state) => {
      console.log(`Getting weather for ${state.slots.location}`);
    },
    prompt: 'The weather is sunny. Anything else?',
    next: 'start',
  });

  manager.registerNode({
    id: 'timer',
    requireSlots: ['duration'],
    action: (state) => {
      console.log(`Setting timer for ${state.slots.duration}`);
    },
    prompt: 'Timer set! Anything else?',
    next: 'start',
  });

  manager.registerNode({
    id: 'music',
    requireSlots: ['song'],
    action: (state) => {
      console.log(`Playing ${state.slots.song}`);
    },
    prompt: 'Now playing. Anything else?',
    next: 'start',
  });

  // Simulate multi-turn conversation
  console.log('Bot:', manager.processInput('Hi', 'greeting'));
  console.log('Bot:', manager.processInput('What is the weather in NYC', 'weather', { location: 'NYC' }));
  console.log('Bot:', manager.processInput('Set a timer for 10 minutes', 'set_timer', { duration: '10 minutes' }));
  console.log('Bot:', manager.processInput('Play some jazz', 'play_music', { song: 'jazz playlist' }));
}

/**
 * Example 5: Context-aware dialog
 */
export function example5_ContextAware() {
  const manager = new DialogManager();

  manager.registerNode({
    id: 'start',
    prompt: 'Hello! I can help you book flights or hotels.',
    next: (state) => {
      return state.currentIntent === 'book_flight' ? 'flight' : 'hotel';
    },
  });

  manager.registerNode({
    id: 'flight',
    requireSlots: ['destination', 'date'],
    action: (state) => {
      // Store in context for potential hotel booking
      state.context.destination = state.slots.destination;
      state.context.date = state.slots.date;
    },
    prompt: 'Flight booked! Would you also like to book a hotel?',
    next: (state) => {
      return state.currentIntent === 'yes' ? 'hotel' : 'end';
    },
  });

  manager.registerNode({
    id: 'hotel',
    // If we have context from flight booking, use it
    requireSlots: ['destination', 'date'],
    action: (state) => {
      // Use destination and date from context if available
      const destination = state.slots.destination || state.context.destination;
      const date = state.slots.date || state.context.date;
      console.log(`Booking hotel in ${destination} for ${date}`);
    },
    prompt: 'Hotel booked! Have a great trip!',
    next: 'end',
  });

  manager.registerNode({
    id: 'end',
    prompt: 'Thank you for booking with us!',
  });

  // Simulate conversation with context
  console.log('Bot:', manager.processInput('Hi', 'greeting'));
  console.log(
    'Bot:',
    manager.processInput('Book a flight to Paris', 'book_flight', {
      destination: 'Paris',
      date: 'next week',
    })
  );
  console.log('Bot:', manager.processInput('Yes', 'yes'));
  // Hotel booking should use Paris and next week from context
}

/**
 * Best Practices:
 *
 * 1. Dialog Design:
 *    - Keep conversations focused and goal-oriented
 *    - Provide clear prompts and confirmations
 *    - Handle errors and edge cases gracefully
 *
 * 2. State Management:
 *    - Maintain conversation context
 *    - Track filled slots and required information
 *    - Support going back or changing previous answers
 *
 * 3. User Experience:
 *    - Allow flexible input (don't be too rigid)
 *    - Provide help and clarification when needed
 *    - Support shortcuts for experienced users
 *
 * 4. Error Handling:
 *    - Validate user input
 *    - Provide helpful error messages
 *    - Offer alternatives or corrections
 *
 * 5. Context Awareness:
 *    - Remember previous interactions
 *    - Use context to reduce user effort
 *    - Support multi-turn conversations naturally
 */
