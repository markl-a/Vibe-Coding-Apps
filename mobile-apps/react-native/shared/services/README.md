# AI 服务文档 🤖

完整的 AI 集成服务层，支持多个主流 AI 提供商。

## 支持的 AI 提供商

- **OpenAI** (GPT-4, GPT-4o, GPT-4o-mini)
- **Anthropic Claude** (Claude 3.5 Sonnet, Claude 3 Opus/Haiku)
- **Google Gemini** (Gemini 2.0 Flash, Gemini 1.5 Pro)
- **Ollama** (本地运行的开源模型)

## 安装

### 环境变量配置

创建 `.env` 文件：

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
```

### 依赖安装

```bash
npm install
# 或
yarn install
```

## 基础用法

### 简单对话

```typescript
import { chat } from '../shared/services/aiService';

const messages = [
  {
    role: 'user',
    content: '你好，介绍一下 React Native',
  },
];

const config = {
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini',
};

const response = await chat(messages, config);
console.log(response.message);
```

### 多轮对话

```typescript
import { chat, Message } from '../shared/services/aiService';

const conversationHistory: Message[] = [
  {
    role: 'system',
    content: '你是一个有帮助的 AI 助手。',
  },
  {
    role: 'user',
    content: '什么是 React Native？',
  },
  {
    role: 'assistant',
    content: 'React Native 是一个用于构建跨平台移动应用的框架...',
  },
  {
    role: 'user',
    content: '它和 Flutter 有什么区别？',
  },
];

const response = await chat(conversationHistory, config);
```

### 使用不同的 AI 提供商

```typescript
// OpenAI
const openaiConfig = {
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini',
};

// Anthropic Claude
const claudeConfig = {
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20241022',
};

// Google Gemini
const geminiConfig = {
  provider: 'gemini',
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-2.0-flash-exp',
};

// Ollama (本地)
const ollamaConfig = {
  provider: 'ollama',
  model: 'llama3.2',
  baseURL: 'http://localhost:11434',
};
```

### 流式响应

```typescript
import { chatStream } from '../shared/services/aiService';

const stream = chatStream(messages, config);

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

## 预设 AI 助手

使用预配置的 AI 助手角色：

```typescript
import { AI_ASSISTANTS } from '../shared/services/aiService';

// 可用的助手类型
const assistants = {
  general: '通用助手',
  coder: '编程助手',
  translator: '翻译助手',
  writer: '写作助手',
  teacher: '教学助手',
};

// 使用预设助手
const messages = [
  {
    role: 'system',
    content: AI_ASSISTANTS.coder.systemPrompt,
  },
  {
    role: 'user',
    content: '如何在 React Native 中实现防抖？',
  },
];
```

## 实际应用示例

### 1. 聊天应用

```typescript
import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { chat, Message, AIConfig } from '../shared/services/aiService';

function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const config: AIConfig = {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chat([...messages, userMessage], config);

      const aiMessage: Message = {
        role: 'assistant',
        content: response.message,
      };

      setMessages([...messages, userMessage, aiMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {messages.map((msg, i) => (
        <Text key={i}>
          {msg.role}: {msg.content}
        </Text>
      ))}
      <TextInput value={input} onChangeText={setInput} />
      <Button title="发送" onPress={sendMessage} disabled={loading} />
    </View>
  );
}
```

### 2. 文本摘要

```typescript
async function summarizeText(text: string): Promise<string> {
  const messages: Message[] = [
    {
      role: 'system',
      content: '请为以下文本生成简洁的摘要，提取关键信息。',
    },
    {
      role: 'user',
      content: text,
    },
  ];

  const config: AIConfig = {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini',
  };

  const response = await chat(messages, config);
  return response.message;
}

// 使用
const summary = await summarizeText('很长的文本内容...');
```

### 3. 代码解释

```typescript
async function explainCode(code: string, language: string): Promise<string> {
  const messages: Message[] = [
    {
      role: 'system',
      content: '你是一个编程教学助手。请详细解释代码的功能和工作原理。',
    },
    {
      role: 'user',
      content: `请解释以下 ${language} 代码：\n\n${code}`,
    },
  ];

  const config: AIConfig = {
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-5-sonnet-20241022',
  };

  const response = await chat(messages, config);
  return response.message;
}
```

### 4. 语言翻译

```typescript
async function translate(
  text: string,
  targetLanguage: string
): Promise<string> {
  const messages: Message[] = [
    {
      role: 'system',
      content: `你是一个专业的翻译助手。请将文本翻译成${targetLanguage}，保持原意和语气。`,
    },
    {
      role: 'user',
      content: text,
    },
  ];

  const config: AIConfig = {
    provider: 'gemini',
    apiKey: process.env.GEMINI_API_KEY,
  };

  const response = await chat(messages, config);
  return response.message;
}

// 使用
const translation = await translate('Hello, how are you?', '中文');
```

### 5. 图像描述生成（使用 GPT-4 Vision）

```typescript
async function describeImage(imageUrl: string): Promise<string> {
  // 注意：需要使用支持视觉的模型
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请详细描述这张图片的内容。',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
```

## API 参考

### chat()

主要的聊天完成函数。

```typescript
async function chat(
  messages: Message[],
  config: AIConfig
): Promise<ChatCompletionResponse>
```

**参数:**
- `messages`: 消息历史数组
- `config`: AI 配置对象

**返回:**
```typescript
{
  message: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

### chatStream()

流式响应函数（仅部分提供商支持）。

```typescript
async function* chatStream(
  messages: Message[],
  config: AIConfig
): AsyncGenerator<string>
```

### 类型定义

```typescript
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

interface AIConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'ollama';
  apiKey?: string;
  model?: string;
  baseURL?: string;
}
```

## 错误处理

```typescript
try {
  const response = await chat(messages, config);
  console.log(response.message);
} catch (error) {
  if (error instanceof Error) {
    console.error('AI 错误:', error.message);

    // 处理特定错误
    if (error.message.includes('API key')) {
      console.error('API 密钥无效');
    } else if (error.message.includes('quota')) {
      console.error('API 配额已用完');
    } else if (error.message.includes('network')) {
      console.error('网络连接错误');
    }
  }
}
```

## 最佳实践

1. **API 密钥安全**
   - 不要在代码中硬编码 API 密钥
   - 使用环境变量
   - 在生产环境中使用后端代理

2. **成本控制**
   - 选择合适的模型（mini 版本通常更便宜）
   - 限制 token 数量
   - 实现请求缓存

3. **用户体验**
   - 显示加载状态
   - 实现流式响应提升体验
   - 优雅处理错误

4. **性能优化**
   - 使用较小的模型处理简单任务
   - 批量处理请求
   - 实现本地缓存

5. **提示工程**
   - 编写清晰的 system prompt
   - 提供充足的上下文
   - 使用示例指导输出格式

## Token 使用估算

不同模型的定价（仅供参考）：

| 模型 | 输入 Token | 输出 Token |
|------|-----------|-----------|
| GPT-4o-mini | $0.15 / 1M | $0.60 / 1M |
| GPT-4o | $2.50 / 1M | $10.00 / 1M |
| Claude 3.5 Sonnet | $3.00 / 1M | $15.00 / 1M |
| Gemini 2.0 Flash | 免费(有限) | 免费(有限) |

1000 个 token ≈ 750 个英文单词 ≈ 500 个中文字符

## 故障排查

### API 密钥错误
```
Error: OpenAI API 调用失败
```
检查 API 密钥是否正确配置。

### 网络错误
```
Error: Failed to fetch
```
检查网络连接和 API 端点是否可访问。

### 配额超限
```
Error: You exceeded your current quota
```
检查 API 账户余额和使用限制。

## 本地开发（Ollama）

使用 Ollama 在本地运行模型：

```bash
# 安装 Ollama
# 访问 https://ollama.ai

# 下载模型
ollama pull llama3.2

# 启动服务（默认端口 11434）
ollama serve
```

在代码中使用：

```typescript
const config: AIConfig = {
  provider: 'ollama',
  model: 'llama3.2',
  baseURL: 'http://localhost:11434',
};
```

## 许可证

MIT License
