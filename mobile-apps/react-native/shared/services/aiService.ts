/**
 * AI 服务层
 * 支持多个 AI 提供商：OpenAI, Anthropic Claude, Google Gemini
 */

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'ollama';
  apiKey?: string;
  model?: string;
  baseURL?: string;
}

export interface ChatCompletionResponse {
  message: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * OpenAI API 调用
 */
async function callOpenAI(
  messages: Message[],
  config: AIConfig
): Promise<ChatCompletionResponse> {
  const model = config.model || 'gpt-4o-mini';
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API 调用失败');
  }

  const data = await response.json();

  return {
    message: data.choices[0].message.content,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
  };
}

/**
 * Anthropic Claude API 调用
 */
async function callAnthropic(
  messages: Message[],
  config: AIConfig
): Promise<ChatCompletionResponse> {
  const model = config.model || 'claude-3-5-sonnet-20241022';
  const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;

  // 提取 system 消息
  const systemMessage = messages.find(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemMessage?.content,
      messages: conversationMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Anthropic API 调用失败');
  }

  const data = await response.json();

  return {
    message: data.content[0].text,
    usage: {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    },
  };
}

/**
 * Google Gemini API 调用
 */
async function callGemini(
  messages: Message[],
  config: AIConfig
): Promise<ChatCompletionResponse> {
  const model = config.model || 'gemini-2.0-flash-exp';
  const apiKey = config.apiKey || process.env.GEMINI_API_KEY;

  // 转换消息格式
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find(m => m.role === 'system');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction
          ? { parts: [{ text: systemInstruction.content }] }
          : undefined,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Gemini API 调用失败');
  }

  const data = await response.json();

  return {
    message: data.candidates[0].content.parts[0].text,
    usage: {
      promptTokens: data.usageMetadata?.promptTokenCount || 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: data.usageMetadata?.totalTokenCount || 0,
    },
  };
}

/**
 * Ollama 本地 API 调用
 */
async function callOllama(
  messages: Message[],
  config: AIConfig
): Promise<ChatCompletionResponse> {
  const model = config.model || 'llama3.2';
  const baseURL = config.baseURL || 'http://localhost:11434';

  const response = await fetch(`${baseURL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error('Ollama API 调用失败');
  }

  const data = await response.json();

  return {
    message: data.message.content,
  };
}

/**
 * 主要的 AI 聊天函数
 */
export async function chat(
  messages: Message[],
  config: AIConfig
): Promise<ChatCompletionResponse> {
  try {
    switch (config.provider) {
      case 'openai':
        return await callOpenAI(messages, config);
      case 'anthropic':
        return await callAnthropic(messages, config);
      case 'gemini':
        return await callGemini(messages, config);
      case 'ollama':
        return await callOllama(messages, config);
      default:
        throw new Error(`不支持的 AI 提供商: ${config.provider}`);
    }
  } catch (error) {
    console.error('AI 调用错误:', error);
    throw error;
  }
}

/**
 * 流式响应（仅支持部分提供商）
 */
export async function* chatStream(
  messages: Message[],
  config: AIConfig
): AsyncGenerator<string> {
  const model = config.model || 'gpt-4o-mini';
  const apiKey = config.apiKey;

  if (config.provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API 调用失败');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } else {
    // 对于不支持流式的提供商，一次性返回
    const response = await chat(messages, config);
    yield response.message;
  }
}

/**
 * 预设的 AI 助手配置
 */
export const AI_ASSISTANTS = {
  general: {
    name: '通用助手',
    systemPrompt: '你是一个有帮助的 AI 助手。请提供准确、有用的回答。',
  },
  coder: {
    name: '编程助手',
    systemPrompt:
      '你是一个专业的编程助手。帮助用户解决代码问题，提供最佳实践建议，并解释技术概念。',
  },
  translator: {
    name: '翻译助手',
    systemPrompt: '你是一个专业的翻译助手。请提供准确、自然的翻译。',
  },
  writer: {
    name: '写作助手',
    systemPrompt:
      '你是一个专业的写作助手。帮助用户改善文章结构、语法和表达。',
  },
  teacher: {
    name: '教学助手',
    systemPrompt:
      '你是一个耐心的教学助手。用简单易懂的方式解释复杂概念，并提供例子。',
  },
};
