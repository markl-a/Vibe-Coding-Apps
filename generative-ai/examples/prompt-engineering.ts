/**
 * Prompt Engineering Examples
 *
 * This file demonstrates:
 * - Prompt templates
 * - Few-shot examples
 * - System prompts
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// 1. PROMPT TEMPLATES
// ============================================================================

interface PromptVariables {
  [key: string]: string | number | boolean;
}

/**
 * Simple template engine for prompts
 */
class PromptTemplate {
  private template: string;

  constructor(template: string) {
    this.template = template;
  }

  /**
   * Format the template with variables
   */
  format(variables: PromptVariables): string {
    let result = this.template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  /**
   * Format and execute with OpenAI
   */
  async execute(
    variables: PromptVariables,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    const prompt = this.format(variables);
    const {
      model = 'gpt-4',
      temperature = 0.7,
      maxTokens = 500,
    } = options;

    try {
      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error executing prompt template:', error);
      throw error;
    }
  }
}

/**
 * Example: Email generation template
 */
async function emailGenerationTemplate(): Promise<void> {
  const template = new PromptTemplate(`
Write a professional email with the following details:

Recipient: {recipient}
Subject: {subject}
Tone: {tone}
Key Points:
{keyPoints}

Please make it concise and well-structured.
  `.trim());

  try {
    const result = await template.execute({
      recipient: 'Jane Smith, VP of Engineering',
      subject: 'Q4 Project Timeline Update',
      tone: 'professional and optimistic',
      keyPoints: `
- Project is on track for December delivery
- Team has completed 80% of core features
- Need additional QA resources for final testing
      `.trim(),
    });

    console.log('Generated Email:');
    console.log(result);
  } catch (error) {
    console.error('Error in email generation:', error);
    throw error;
  }
}

/**
 * Example: Code review template
 */
async function codeReviewTemplate(): Promise<void> {
  const template = new PromptTemplate(`
Review the following {language} code and provide feedback on:
1. Code quality and best practices
2. Potential bugs or security issues
3. Performance improvements
4. Readability and maintainability

Code:
\`\`\`{language}
{code}
\`\`\`

Please be specific and provide examples where applicable.
  `.trim());

  try {
    const result = await template.execute({
      language: 'TypeScript',
      code: `
function processUsers(users: any[]) {
  const result = [];
  for (let i = 0; i < users.length; i++) {
    if (users[i].active == true) {
      result.push(users[i]);
    }
  }
  return result;
}
      `.trim(),
    }, {
      temperature: 0.3, // Lower temperature for more focused reviews
    });

    console.log('Code Review:');
    console.log(result);
  } catch (error) {
    console.error('Error in code review:', error);
    throw error;
  }
}

// ============================================================================
// 2. FEW-SHOT EXAMPLES
// ============================================================================

/**
 * Few-shot learning for text classification
 */
async function fewShotClassification(): Promise<void> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a customer support ticket classifier. Classify tickets into: TECHNICAL, BILLING, FEATURE_REQUEST, or GENERAL.',
        },
        // Few-shot examples
        {
          role: 'user',
          content: 'My payment was charged twice this month.',
        },
        {
          role: 'assistant',
          content: 'BILLING',
        },
        {
          role: 'user',
          content: 'The app crashes when I try to export data.',
        },
        {
          role: 'assistant',
          content: 'TECHNICAL',
        },
        {
          role: 'user',
          content: 'It would be great if you could add dark mode.',
        },
        {
          role: 'assistant',
          content: 'FEATURE_REQUEST',
        },
        // Actual query
        {
          role: 'user',
          content: 'I cannot login to my account. It says invalid credentials but I know my password is correct.',
        },
      ],
      temperature: 0.3,
    });

    console.log('Classification Result:');
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('Error in few-shot classification:', error);
    throw error;
  }
}

/**
 * Few-shot learning for structured data extraction
 */
async function fewShotDataExtraction(): Promise<void> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Extract structured information from meeting notes. Return JSON with: date, attendees (array), topics (array), action_items (array with person and task).',
        },
        // Example 1
        {
          role: 'user',
          content: 'Meeting on Jan 15th with John and Sarah. Discussed Q1 budget and marketing strategy. John will prepare budget proposal by Friday.',
        },
        {
          role: 'assistant',
          content: JSON.stringify({
            date: '2024-01-15',
            attendees: ['John', 'Sarah'],
            topics: ['Q1 budget', 'marketing strategy'],
            action_items: [
              { person: 'John', task: 'Prepare budget proposal by Friday' },
            ],
          }, null, 2),
        },
        // Example 2
        {
          role: 'user',
          content: 'Team sync yesterday with Mike, Lisa, and Tom. Covered sprint planning and infrastructure upgrades. Lisa to review deployment pipeline. Tom will update documentation.',
        },
        {
          role: 'assistant',
          content: JSON.stringify({
            date: 'yesterday',
            attendees: ['Mike', 'Lisa', 'Tom'],
            topics: ['sprint planning', 'infrastructure upgrades'],
            action_items: [
              { person: 'Lisa', task: 'Review deployment pipeline' },
              { person: 'Tom', task: 'Update documentation' },
            ],
          }, null, 2),
        },
        // Actual query
        {
          role: 'user',
          content: 'Had a call this morning with Emma, David, and Rachel. We talked about customer feedback analysis and new feature prioritization. Emma will compile the feedback report. David needs to create mockups for the top 3 features.',
        },
      ],
      temperature: 0.2,
    });

    console.log('Extracted Data:');
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('Error in few-shot data extraction:', error);
    throw error;
  }
}

/**
 * Few-shot learning for creative writing style
 */
async function fewShotStyleTransfer(): Promise<void> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Rewrite text in a pirate speaking style.',
        },
        {
          role: 'user',
          content: 'Hello, how are you today?',
        },
        {
          role: 'assistant',
          content: 'Ahoy there, matey! How be ye farin\' on this fine day?',
        },
        {
          role: 'user',
          content: 'I need to go to the store to buy some groceries.',
        },
        {
          role: 'assistant',
          content: 'I be needin\' to set sail fer the marketplace to gather me provisions, arr!',
        },
        {
          role: 'user',
          content: 'The meeting has been rescheduled to next Tuesday at 3 PM.',
        },
      ],
      temperature: 0.8,
    });

    console.log('Style Transfer Result:');
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('Error in few-shot style transfer:', error);
    throw error;
  }
}

// ============================================================================
// 3. SYSTEM PROMPTS
// ============================================================================

/**
 * System prompt for a technical documentation assistant
 */
async function technicalDocumentationAssistant(query: string): Promise<void> {
  const systemPrompt = `You are a technical documentation expert specializing in API documentation.

Your responsibilities:
1. Write clear, accurate API documentation
2. Include code examples in multiple languages
3. Follow OpenAPI/Swagger specifications
4. Highlight security considerations
5. Provide usage examples and best practices

Style guidelines:
- Use clear, concise language
- Include practical examples
- Organize information hierarchically
- Use proper technical terminology
- Add warnings for deprecated features

Always structure your response with:
- Overview
- Parameters/Arguments
- Return Values
- Code Examples
- Error Handling
- Best Practices`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      temperature: 0.3,
    });

    console.log('Documentation:');
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('Error in technical documentation:', error);
    throw error;
  }
}

/**
 * System prompt for a code mentor
 */
async function codeMentor(studentCode: string, question: string): Promise<void> {
  const systemPrompt = `You are a patient and encouraging coding mentor for beginners.

Teaching philosophy:
1. Encourage learning through discovery
2. Break down complex concepts into simple parts
3. Use analogies and real-world examples
4. Provide hints rather than complete solutions
5. Celebrate progress and learning moments

Communication style:
- Friendly and supportive
- Use simple, jargon-free language
- Ask guiding questions
- Provide step-by-step explanations
- Encourage experimentation

When reviewing code:
- Point out what works well first
- Suggest improvements gently
- Explain the "why" behind best practices
- Provide learning resources
- Encourage asking questions`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Here's my code:\n\n${studentCode}\n\nQuestion: ${question}`,
        },
      ],
      temperature: 0.7,
    });

    console.log('Mentor Response:');
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('Error in code mentor:', error);
    throw error;
  }
}

/**
 * System prompt for a creative writing assistant
 */
async function creativeWritingAssistant(prompt: string): Promise<void> {
  const systemPrompt = `You are a creative writing assistant specializing in storytelling.

Your expertise:
- Character development
- Plot structure and pacing
- Dialogue and voice
- World-building
- Descriptive writing

Approach:
1. Understand the writer's vision
2. Offer suggestions, not dictates
3. Maintain the writer's unique voice
4. Provide multiple options when brainstorming
5. Balance creativity with coherence

Feedback style:
- Encouraging and constructive
- Specific and actionable
- Reference literary techniques
- Suggest examples from published works
- Focus on strengthening the story`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.9,
    });

    console.log('Writing Assistance:');
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('Error in creative writing:', error);
    throw error;
  }
}

/**
 * System prompt for a data analyst
 */
async function dataAnalystAssistant(data: string, analysis: string): Promise<void> {
  const systemPrompt = `You are a data analyst assistant with expertise in statistics and data visualization.

Capabilities:
- Exploratory data analysis
- Statistical hypothesis testing
- Trend identification
- Data quality assessment
- Visualization recommendations

Analysis approach:
1. Summarize key findings
2. Identify patterns and anomalies
3. Provide statistical context
4. Suggest visualization methods
5. Recommend follow-up analyses

Communication:
- Use data-driven insights
- Explain statistical concepts clearly
- Include specific numbers and percentages
- Suggest actionable recommendations
- Acknowledge limitations and assumptions`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Dataset:\n${data}\n\nAnalysis request: ${analysis}`,
        },
      ],
      temperature: 0.4,
    });

    console.log('Data Analysis:');
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('Error in data analysis:', error);
    throw error;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  try {
    console.log('=== Prompt Engineering Examples ===\n');

    console.log('\n1. Email Generation Template');
    console.log('-----------------------------');
    await emailGenerationTemplate();

    console.log('\n\n2. Code Review Template');
    console.log('-----------------------');
    await codeReviewTemplate();

    console.log('\n\n3. Few-Shot Classification');
    console.log('---------------------------');
    await fewShotClassification();

    console.log('\n\n4. Few-Shot Data Extraction');
    console.log('----------------------------');
    await fewShotDataExtraction();

    console.log('\n\n5. Few-Shot Style Transfer');
    console.log('---------------------------');
    await fewShotStyleTransfer();

    console.log('\n\n6. Technical Documentation System Prompt');
    console.log('----------------------------------------');
    await technicalDocumentationAssistant(
      'Document a REST API endpoint for creating a new user account.'
    );

    console.log('\n\n7. Code Mentor System Prompt');
    console.log('-----------------------------');
    await codeMentor(
      'let x = 5\nif (x = 10) { console.log("ten") }',
      "Why doesn't this work as expected?"
    );

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
  PromptTemplate,
  emailGenerationTemplate,
  codeReviewTemplate,
  fewShotClassification,
  fewShotDataExtraction,
  fewShotStyleTransfer,
  technicalDocumentationAssistant,
  codeMentor,
  creativeWritingAssistant,
  dataAnalystAssistant,
};
