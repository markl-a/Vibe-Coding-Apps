# ReAct AI Agent

An AI agent using the ReAct (Reasoning + Acting) pattern with LangChain and OpenAI.

## What is ReAct?

ReAct is an agent paradigm where the AI:
1. **Thinks** about what to do (Reasoning)
2. **Acts** by using a tool (Acting)
3. **Observes** the result
4. Repeats until the task is complete

This creates a transparent decision-making process where you can see the agent's thought process.

## Features

- **ReAct Pattern**: Transparent reasoning with tool usage
- **Built-in Tools**: Calculator, weather, search, datetime
- **Custom Tools**: Easy to add your own tools
- **CLI Interface**: Interactive command-line chat
- **REST API**: HTTP endpoints for integration
- **Streaming**: Real-time response streaming

## Quick Start

### Prerequisites

- Node.js 18+
- OpenAI API key

### Installation

```bash
pnpm install
```

### Configuration

```bash
export OPENAI_API_KEY=sk-your-api-key
```

### Run CLI

```bash
pnpm cli
```

### Run Server

```bash
pnpm dev
```

## Example Interactions

```
You: What's 15% of 250 plus the current temperature in Tokyo?

🤔 Thinking...

--- Agent Steps ---
Step 1:
  Thought: I need to calculate 15% of 250 and get Tokyo's temperature
  Action: calculator
  Input: 250 * 0.15
  Result: 37.5

Step 2:
  Thought: Now I need to get Tokyo's weather
  Action: get_weather
  Input: {"location": "Tokyo, Japan"}
  Result: {"temperature": "22°C", "conditions": "Partly cloudy"}

-------------------

Agent: 15% of 250 is 37.5. The current temperature in Tokyo is 22°C.
So 37.5 + 22 = 59.5
```

## Built-in Tools

| Tool | Description |
|------|-------------|
| `calculator` | Perform mathematical calculations |
| `get_weather` | Get weather for a location (mock) |
| `web_search` | Search the web (mock) |
| `get_datetime` | Get current date and time |

## API Usage

### Run Agent

```bash
curl -X POST http://localhost:3000/run \
  -H "Content-Type: application/json" \
  -d '{"input": "What is 25 * 4 and what time is it?"}'
```

Response:
```json
{
  "output": "25 * 4 = 100. The current time is 2:30 PM.",
  "steps": [
    {
      "thought": "I need to calculate and get the time",
      "action": "calculator",
      "actionInput": "25 * 4",
      "observation": "100"
    },
    {
      "thought": "Now get the current time",
      "action": "get_datetime",
      "observation": "{\"time\": \"2:30 PM\"}"
    }
  ]
}
```

### List Tools

```bash
curl http://localhost:3000/tools
```

## Adding Custom Tools

```typescript
import { createAgent } from './agent.js';
import { createCustomTool } from './tools.js';
import { z } from 'zod';

const myTool = createCustomTool({
  name: 'my_tool',
  description: 'Does something useful',
  schema: z.object({
    param: z.string().describe('A parameter'),
  }),
  func: async ({ param }) => {
    return `Processed: ${param}`;
  },
});

const agent = await createAgent(config, [myTool]);
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        User Input                        │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                      ReAct Agent                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  1. Thought: "I need to..."                       │  │
│  │  2. Action: calculator                            │  │
│  │  3. Observation: "100"                            │  │
│  │  4. Thought: "Now I should..."                    │  │
│  │  5. Action: get_weather                           │  │
│  │  6. Observation: "{temp: 22}"                     │  │
│  │  7. Final Answer: "..."                           │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   ┌───────────┐      ┌───────────┐      ┌───────────┐
   │ Calculator│      │  Weather  │      │  Search   │
   └───────────┘      └───────────┘      └───────────┘
```

## Resources

- [LangChain Agents](https://js.langchain.com/docs/modules/agents/)
- [ReAct Paper](https://arxiv.org/abs/2210.03629)
- [LangChain Hub](https://smith.langchain.com/hub)

## License

MIT
