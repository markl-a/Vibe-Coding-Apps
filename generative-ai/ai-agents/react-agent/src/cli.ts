import * as readline from 'readline';
import { createAgent } from './agent.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

async function main() {
  console.log('🤖 ReAct Agent CLI');
  console.log('==================');
  console.log('Initializing agent...\n');

  const agent = await createAgent({
    openaiApiKey: OPENAI_API_KEY,
    verbose: true,
  });

  console.log('Available tools:');
  agent.getTools().forEach((tool) => {
    console.log(`  • ${tool.name}: ${tool.description}`);
  });
  console.log('\nType your questions or "quit" to exit.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = () => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
        console.log('Goodbye! 👋');
        rl.close();
        return;
      }

      if (!input.trim()) {
        askQuestion();
        return;
      }

      try {
        console.log('\n🤔 Thinking...\n');
        const result = await agent.run(input);

        if (result.steps.length > 0) {
          console.log('--- Agent Steps ---');
          result.steps.forEach((step, i) => {
            console.log(`Step ${i + 1}:`);
            if (step.thought) console.log(`  Thought: ${step.thought}`);
            if (step.action) console.log(`  Action: ${step.action}`);
            if (step.actionInput) console.log(`  Input: ${step.actionInput}`);
            if (step.observation) console.log(`  Result: ${step.observation}`);
            console.log('');
          });
          console.log('-------------------\n');
        }

        console.log(`Agent: ${result.output}\n`);
      } catch (error: unknown) {
        console.error('Error:', error);
      }

      askQuestion();
    });
  };

  askQuestion();
}

main().catch(console.error);
