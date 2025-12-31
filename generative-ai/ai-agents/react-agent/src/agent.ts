import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createReactAgent } from 'langchain/agents';
import { pull } from 'langchain/hub';
import type { PromptTemplate } from '@langchain/core/prompts';
import type { DynamicTool } from '@langchain/core/tools';
import { createTools } from './tools.js';
import type { AgentResponse, AgentStep } from './types.js';

export interface AgentConfig {
  openaiApiKey: string;
  modelName?: string;
  temperature?: number;
  maxIterations?: number;
  verbose?: boolean;
}

export async function createAgent(config: AgentConfig, customTools?: DynamicTool[]) {
  const model = new ChatOpenAI({
    openAIApiKey: config.openaiApiKey,
    modelName: config.modelName ?? 'gpt-4o-mini',
    temperature: config.temperature ?? 0,
  });

  // Get the ReAct prompt from LangChain Hub
  const prompt = await pull<PromptTemplate>('hwchase17/react');

  // Combine default tools with custom tools
  const tools = [...createTools(), ...(customTools ?? [])];

  // Create the ReAct agent
  const agent = await createReactAgent({
    llm: model,
    tools,
    prompt,
  });

  // Create the executor
  const executor = new AgentExecutor({
    agent,
    tools,
    maxIterations: config.maxIterations ?? 10,
    verbose: config.verbose ?? false,
    returnIntermediateSteps: true,
  });

  return {
    async run(input: string): Promise<AgentResponse> {
      const result = await executor.invoke({ input });

      // Parse intermediate steps
      const steps: AgentStep[] = (result.intermediateSteps || []).map(
        (step: { action: { tool: string; toolInput: string; log: string }; observation: string }) => ({
          thought: step.action.log.split('Action:')[0].replace('Thought:', '').trim(),
          action: step.action.tool,
          actionInput: typeof step.action.toolInput === 'string'
            ? step.action.toolInput
            : JSON.stringify(step.action.toolInput),
          observation: step.observation,
        })
      );

      return {
        output: result.output,
        steps,
      };
    },

    async *stream(input: string): AsyncGenerator<string> {
      const result = await executor.invoke({ input });
      // Yield the final output character by character for streaming effect
      for (const char of result.output) {
        yield char;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    },

    getTools() {
      return tools.map((t) => ({ name: t.name, description: t.description }));
    },
  };
}
