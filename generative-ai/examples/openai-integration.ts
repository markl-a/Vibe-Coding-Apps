/**
 * OpenAI Integration Examples
 *
 * This file demonstrates:
 * - Chat completions
 * - Function calling
 * - Vision API
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// 1. CHAT COMPLETIONS
// ============================================================================

/**
 * Basic chat completion example
 */
async function basicChatCompletion(): Promise<void> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides concise answers.',
        },
        {
          role: 'user',
          content: 'Explain quantum computing in simple terms.',
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    console.log('Basic Chat Completion:');
    console.log(completion.choices[0].message.content);
    console.log('\nUsage:', completion.usage);
  } catch (error) {
    console.error('Error in basic chat completion:', error);
    throw error;
  }
}

/**
 * Multi-turn conversation with context
 */
async function multiTurnConversation(): Promise<void> {
  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: 'You are a patient math tutor.',
      },
      {
        role: 'user',
        content: 'What is a derivative?',
      },
    ];

    // First response
    let completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
    });

    const firstResponse = completion.choices[0].message;
    messages.push(firstResponse);
    console.log('Assistant:', firstResponse.content);

    // Follow-up question
    messages.push({
      role: 'user',
      content: 'Can you give me an example?',
    });

    completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
    });

    console.log('\nAssistant:', completion.choices[0].message.content);
  } catch (error) {
    console.error('Error in multi-turn conversation:', error);
    throw error;
  }
}

// ============================================================================
// 2. FUNCTION CALLING
// ============================================================================

interface WeatherParams {
  location: string;
  unit?: 'celsius' | 'fahrenheit';
}

interface DatabaseQuery {
  query: string;
  filters?: Record<string, unknown>;
}

/**
 * Mock function to get weather data
 */
function getWeather(params: WeatherParams): string {
  const { location, unit = 'celsius' } = params;
  // In real implementation, this would call a weather API
  return JSON.stringify({
    location,
    temperature: unit === 'celsius' ? 22 : 72,
    unit,
    condition: 'Sunny',
  });
}

/**
 * Mock function to query database
 */
function queryDatabase(params: DatabaseQuery): string {
  // In real implementation, this would query an actual database
  return JSON.stringify({
    results: [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ],
    count: 2,
  });
}

/**
 * Function calling example
 */
async function functionCallingExample(): Promise<void> {
  try {
    const tools: OpenAI.Chat.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'get_weather',
          description: 'Get the current weather for a location',
          parameters: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: 'The city and state, e.g. San Francisco, CA',
              },
              unit: {
                type: 'string',
                enum: ['celsius', 'fahrenheit'],
                description: 'The temperature unit',
              },
            },
            required: ['location'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'query_database',
          description: 'Query the user database',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query',
              },
              filters: {
                type: 'object',
                description: 'Additional filters for the query',
              },
            },
            required: ['query'],
          },
        },
      },
    ];

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'user',
        content: "What's the weather like in Tokyo and find all users with gmail addresses?",
      },
    ];

    // First API call - model decides to use functions
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      tools: tools,
      tool_choice: 'auto',
    });

    const responseMessage = response.choices[0].message;
    messages.push(responseMessage);

    // Process tool calls
    if (responseMessage.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`\nCalling function: ${functionName}`);
        console.log('Arguments:', functionArgs);

        let functionResponse: string;

        if (functionName === 'get_weather') {
          functionResponse = getWeather(functionArgs as WeatherParams);
        } else if (functionName === 'query_database') {
          functionResponse = queryDatabase(functionArgs as DatabaseQuery);
        } else {
          functionResponse = JSON.stringify({ error: 'Unknown function' });
        }

        // Add function response to messages
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: functionResponse,
        });
      }

      // Second API call - get final response with function results
      const finalResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
      });

      console.log('\nFinal Response:');
      console.log(finalResponse.choices[0].message.content);
    }
  } catch (error) {
    console.error('Error in function calling:', error);
    throw error;
  }
}

// ============================================================================
// 3. VISION API
// ============================================================================

/**
 * Analyze image from URL
 */
async function analyzeImageFromURL(): Promise<void> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'What is in this image? Describe it in detail.',
            },
            {
              type: 'image_url',
              image_url: {
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg',
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    console.log('Image Analysis (URL):');
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('Error in image analysis from URL:', error);
    throw error;
  }
}

/**
 * Analyze image from local file (base64 encoded)
 */
async function analyzeImageFromFile(imagePath: string): Promise<void> {
  try {
    // Read image and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = getMimeType(imagePath);

    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image and extract any text you see.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    console.log('Image Analysis (Local File):');
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('Error in image analysis from file:', error);
    throw error;
  }
}

/**
 * Multi-image comparison
 */
async function compareImages(): Promise<void> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Compare these two images and describe the differences.',
            },
            {
              type: 'image_url',
              image_url: {
                url: 'https://example.com/image1.jpg',
              },
            },
            {
              type: 'image_url',
              image_url: {
                url: 'https://example.com/image2.jpg',
              },
            },
          ],
        },
      ],
      max_tokens: 800,
    });

    console.log('Image Comparison:');
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('Error in image comparison:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  try {
    console.log('=== OpenAI Integration Examples ===\n');

    console.log('\n1. Basic Chat Completion');
    console.log('------------------------');
    await basicChatCompletion();

    console.log('\n\n2. Multi-turn Conversation');
    console.log('---------------------------');
    await multiTurnConversation();

    console.log('\n\n3. Function Calling');
    console.log('-------------------');
    await functionCallingExample();

    console.log('\n\n4. Vision API - Image from URL');
    console.log('-------------------------------');
    await analyzeImageFromURL();

    // Uncomment to test local file analysis
    // console.log('\n\n5. Vision API - Image from File');
    // console.log('--------------------------------');
    // await analyzeImageFromFile('/path/to/image.jpg');

    // Uncomment to test image comparison
    // console.log('\n\n6. Vision API - Compare Images');
    // console.log('-------------------------------');
    // await compareImages();

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
  basicChatCompletion,
  multiTurnConversation,
  functionCallingExample,
  analyzeImageFromURL,
  analyzeImageFromFile,
  compareImages,
};
