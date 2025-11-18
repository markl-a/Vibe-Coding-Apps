# AI 语音笔记应用 🎤🤖

一个功能强大的 AI 驱动语音笔记应用，支持语音录制、转录、智能摘要和标签提取。

## ✨ 功能特点

### 核心功能
- 🎙️ **语音录制** - 高质量音频录制
- 📝 **语音转文字** - AI 驱动的语音识别（集成 Whisper API）
- 🤖 **智能摘要** - 自动生成笔记摘要
- 🏷️ **标签提取** - AI 自动提取关键词标签
- ⭐ **收藏管理** - 快速标记重要笔记
- 🔍 **筛选查看** - 按收藏状态筛选

### AI 功能
- 多个 AI 提供商支持（OpenAI, Claude, Gemini）
- 可配置的 AI 处理选项
- 智能内容分析
- 关键词自动提取

### 用户体验
- 简洁直观的界面
- 实时录音状态显示
- 音频播放控制
- 详细的笔记视图
- 响应式设计

## 📱 应用截图

### 主要界面
- **笔记列表** - 查看所有语音笔记，支持筛选
- **录音界面** - 简单的录音操作
- **笔记详情** - 完整的笔记信息展示

## 🚀 快速开始

### 环境要求

- Node.js >= 14
- Expo CLI
- iOS 或 Android 设备/模拟器

### 安装步骤

1. **安装依赖**

```bash
npm install
# 或
yarn install
```

2. **配置 AI API**

创建 `.env` 文件：

```env
OPENAI_API_KEY=sk-...
# 或使用其他 AI 提供商
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
```

3. **运行应用**

```bash
# 启动开发服务器
npm start

# 在 iOS 上运行
npm run ios

# 在 Android 上运行
npm run android
```

## 📂 项目结构

```
ai-voice-notes-app/
├── src/
│   ├── screens/              # 页面组件
│   │   ├── RecordScreen.tsx  # 录音界面
│   │   ├── NotesListScreen.tsx  # 笔记列表
│   │   └── NoteDetailScreen.tsx  # 笔记详情
│   ├── components/           # 可重用组件
│   │   ├── VoiceRecorder.tsx  # 录音组件
│   │   └── NoteCard.tsx      # 笔记卡片
│   ├── store/                # 状态管理
│   │   └── notesStore.ts     # Zustand store
│   └── types/                # TypeScript 类型
│       └── index.ts
├── App.tsx                   # 应用入口
├── package.json
└── README.md
```

## 🎯 使用指南

### 1. 录制语音笔记

1. 点击底部导航栏的「录音」标签
2. 点击「开始录音」按钮
3. 说出你的笔记内容
4. 点击「停止」按钮结束录音

### 2. 配置 AI 处理

录音完成后，可以选择以下 AI 处理选项：

- **语音转文字**: 将语音转换为文本
- **生成摘要**: 自动生成内容摘要
- **提取标签**: 自动提取关键词

### 3. 保存笔记

1. 输入笔记标题
2. 选择需要的 AI 处理选项
3. 点击「保存笔记」
4. AI 将在后台处理（可能需要几秒钟）

### 4. 管理笔记

- **播放**: 点击笔记卡片上的播放按钮
- **收藏**: 点击星标图标
- **删除**: 点击删除图标
- **查看详情**: 点击笔记卡片

## 🔧 技术栈

### 核心技术
- **React Native** + **Expo** - 跨平台移动开发
- **TypeScript** - 类型安全
- **React Navigation** - 导航管理
- **Zustand** - 状态管理
- **AsyncStorage** - 数据持久化

### 音频处理
- **expo-av** - 音频录制和播放
- **expo-file-system** - 文件管理

### AI 集成
- **OpenAI API** - GPT 模型和 Whisper 语音识别
- **Anthropic Claude** - 可选的 AI 提供商
- **Google Gemini** - 可选的 AI 提供商

### UI 组件
- **@expo/vector-icons** - 图标库
- **date-fns** - 日期处理
- **共享组件库** - 自定义 UI 组件

## 🤖 AI 功能详解

### 语音转文字

使用 OpenAI Whisper API 或其他语音识别服务：

```typescript
// 实际实现需要调用语音识别 API
async function transcribeAudio(audioUri: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  });

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: formData,
  });

  const data = await response.json();
  return data.text;
}
```

### 智能摘要

使用 AI 模型生成摘要：

```typescript
const summaryResponse = await chat([
  {
    role: 'system',
    content: '请为以下文本生成简洁的摘要，不超过 50 字。',
  },
  {
    role: 'user',
    content: transcription,
  },
], config);
```

### 标签提取

自动提取关键词：

```typescript
const tagsResponse = await chat([
  {
    role: 'system',
    content: '请为以下文本提取 3-5 个关键词标签。',
  },
  {
    role: 'user',
    content: transcription,
  },
], config);
```

## 📊 数据模型

### VoiceNote

```typescript
interface VoiceNote {
  id: string;
  title: string;
  audioUri: string;
  transcription?: string;
  summary?: string;
  tags?: string[];
  duration: number;
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
}
```

## 🎨 UI/UX 特点

- **Material Design** 风格
- **直觉式操作** - 简单易用的录音控制
- **实时反馈** - 录音时显示时长
- **AI 状态提示** - 处理进度显示
- **优雅的动画** - 平滑的界面过渡

## 🔐 隐私和安全

- 所有录音存储在本地设备
- 用户控制何时发送数据到 AI API
- 可选的 AI 处理功能
- 不会自动上传任何数据

## 🌟 未来计划

- [ ] 云端同步
- [ ] 多语言转录
- [ ] 实时语音转文字
- [ ] 笔记分享功能
- [ ] 导出为多种格式（PDF, TXT, Markdown）
- [ ] 笔记搜索功能
- [ ] 文件夹分类
- [ ] 更多 AI 功能（情感分析、关键点提取）
- [ ] 离线语音识别
- [ ] Widget 支持

## 💡 最佳实践

### 录音质量

- 在安静的环境中录音
- 保持话筒距离适中
- 清晰地发音

### AI 处理

- 较长的录音可能需要更多处理时间
- 检查网络连接确保 AI API 可访问
- 合理使用 AI 功能以控制成本

### 性能优化

- 定期清理不需要的笔记
- 较长的录音文件较大，注意存储空间
- 在 Wi-Fi 环境下使用 AI 功能

## 🐛 故障排查

### 无法录音

1. 检查麦克风权限
2. 重启应用
3. 确认设备麦克风正常工作

### AI 处理失败

1. 检查网络连接
2. 验证 API 密钥
3. 检查 API 配额

### 音频播放问题

1. 确认文件存在
2. 检查文件权限
3. 重新录制笔记

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🙏 致谢

- OpenAI Whisper - 语音识别
- Expo 团队 - 优秀的开发工具
- React Native 社区

---

**使用 AI 让你的语音笔记更智能！** 🚀

**最后更新**: 2025-11-18
