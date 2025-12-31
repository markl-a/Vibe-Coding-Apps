import { DynamicTool, DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export interface ToolDefinition<T extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  description: string;
  schema?: z.ZodObject<T>;
  func: (input: z.infer<z.ZodObject<T>> | string) => Promise<string>;
}

// Calculator tool
const calculatorTool = new DynamicTool({
  name: 'calculator',
  description: 'Useful for performing mathematical calculations. Input should be a valid mathematical expression.',
  func: async (input: string) => {
    try {
      // Simple and safe math evaluation
      const sanitized = input.replace(/[^0-9+\-*/.() ]/g, '');
      const result = Function(`"use strict"; return (${sanitized})`)();
      return String(result);
    } catch (error: unknown) {
      return `Error: Could not calculate "${input}"`;
    }
  },
});

// Weather tool (mock)
const weatherTool = new DynamicStructuredTool({
  name: 'get_weather',
  description: 'Get the current weather for a location. Returns temperature, conditions, and humidity.',
  schema: z.object({
    location: z.string().describe('The city and country, e.g., "Tokyo, Japan"'),
  }),
  func: async ({ location }) => {
    // Mock weather data - in production, call a real API
    const mockWeather = {
      'Tokyo, Japan': { temp: 22, conditions: 'Partly cloudy', humidity: 65 },
      'New York, USA': { temp: 18, conditions: 'Sunny', humidity: 45 },
      'London, UK': { temp: 14, conditions: 'Rainy', humidity: 80 },
      'Sydney, Australia': { temp: 25, conditions: 'Clear', humidity: 55 },
    };

    const weather = mockWeather[location as keyof typeof mockWeather] || {
      temp: 20,
      conditions: 'Unknown',
      humidity: 50,
    };

    return JSON.stringify({
      location,
      temperature: `${weather.temp}°C`,
      conditions: weather.conditions,
      humidity: `${weather.humidity}%`,
    });
  },
});

// Search tool (mock)
const searchTool = new DynamicStructuredTool({
  name: 'web_search',
  description: 'Search the web for current information. Use this when you need up-to-date facts.',
  schema: z.object({
    query: z.string().describe('The search query'),
  }),
  func: async ({ query }) => {
    // Mock search results - in production, use a real search API
    return JSON.stringify({
      query,
      results: [
        {
          title: `Information about: ${query}`,
          snippet: `This is a mock search result for "${query}". In production, integrate with a real search API like Tavily, SerpAPI, or Bing.`,
          url: 'https://example.com/result1',
        },
        {
          title: `More about: ${query}`,
          snippet: `Additional information related to "${query}" would appear here.`,
          url: 'https://example.com/result2',
        },
      ],
    });
  },
});

// Date/Time tool
const dateTimeTool = new DynamicTool({
  name: 'get_datetime',
  description: 'Get the current date and time. No input required.',
  func: async () => {
    const now = new Date();
    return JSON.stringify({
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      iso: now.toISOString(),
    });
  },
});

// Create all tools
export function createTools(): DynamicTool[] {
  return [calculatorTool, weatherTool, searchTool, dateTimeTool];
}

// Create custom tool
export function createCustomTool(definition: ToolDefinition): DynamicTool {
  if (definition.schema) {
    return new DynamicStructuredTool({
      name: definition.name,
      description: definition.description,
      schema: definition.schema,
      func: definition.func,
    });
  }

  return new DynamicTool({
    name: definition.name,
    description: definition.description,
    func: definition.func,
  });
}
