# Web Speech Demo

A React application demonstrating speech recognition and voice commands using the Web Speech API.

## Features

- **Real-time Transcription**: See your speech converted to text instantly
- **Voice Commands**: Execute actions by speaking command phrases
- **Multi-language Support**: 9 languages including English, Chinese, Japanese
- **Interim Results**: See partial results as you speak
- **Command History**: Track recent speech and matched commands

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173 in Chrome, Edge, or Safari.

## Browser Support

The Web Speech API is supported in:
- Chrome (Desktop & Android)
- Edge
- Safari (Desktop & iOS)
- Firefox (partial support)

## Voice Commands

| Command | Description |
|---------|-------------|
| "hello" / "hi" | Greet the assistant |
| "change color to [color]" | Change background color |
| "what time is it" | Get current time |
| "what's the date" | Get current date |
| "clear" / "reset" | Clear transcript |
| "scroll up/down" | Scroll the page |

## Hooks

### useSpeechRecognition

```typescript
import { useSpeechRecognition } from './hooks';

const {
  isListening,      // Whether currently listening
  transcript,       // Final transcript text
  interimTranscript,// Partial/interim text
  error,            // Error message if any
  isSupported,      // Browser support check
  startListening,   // Start recognition
  stopListening,    // Stop recognition
  resetTranscript,  // Clear transcript
  setLanguage,      // Change language
} = useSpeechRecognition({
  continuous: true,
  interimResults: true,
  lang: 'en-US',
  onResult: (text, isFinal) => console.log(text),
  onError: (error) => console.error(error),
});
```

### useVoiceCommands

```typescript
import { useVoiceCommands } from './hooks';

const { commands, processTranscript, lastMatchedCommand } = useVoiceCommands([
  {
    phrase: 'hello',
    description: 'Say hello',
    aliases: ['hi', 'hey'],
    action: () => console.log('Hello!'),
  },
  {
    phrase: 'search for *',
    description: 'Search with parameter',
    action: (query) => console.log(`Searching: ${query}`),
  },
]);

// Process spoken text
const result = processTranscript('hello there');
if (result.matched) {
  console.log(`Matched command: ${result.command}`);
}
```

## Adding Custom Commands

```typescript
const customCommands = [
  {
    phrase: 'play music',
    description: 'Start playing music',
    aliases: ['start music', 'music please'],
    action: () => {
      // Your logic here
    },
  },
  {
    phrase: 'search for *',
    description: 'Search with parameter',
    action: (query) => {
      if (query) {
        window.open(`https://google.com/search?q=${query}`);
      }
    },
  },
];
```

## Language Codes

| Code | Language |
|------|----------|
| en-US | English (US) |
| en-GB | English (UK) |
| zh-TW | Chinese (Traditional) |
| zh-CN | Chinese (Simplified) |
| ja-JP | Japanese |
| ko-KR | Korean |
| es-ES | Spanish |
| fr-FR | French |
| de-DE | German |

## Architecture

```
┌─────────────────────────────────────────┐
│              App Component              │
├─────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │
│  │      useSpeechRecognition        │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │    Web Speech API          │  │  │
│  │  │  - SpeechRecognition       │  │  │
│  │  │  - Continuous mode         │  │  │
│  │  │  - Interim results         │  │  │
│  │  └────────────────────────────┘  │  │
│  └──────────────────────────────────┘  │
│                  │                      │
│                  ▼                      │
│  ┌──────────────────────────────────┐  │
│  │       useVoiceCommands           │  │
│  │  - Pattern matching              │  │
│  │  - Command execution             │  │
│  │  - Parameter extraction          │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Tips

1. **Microphone Access**: Allow microphone access when prompted
2. **Background Noise**: Minimize background noise for better recognition
3. **Clear Speech**: Speak clearly and at a moderate pace
4. **Command Triggers**: Commands work best at the beginning of sentences

## Limitations

- Requires internet connection (speech processing is server-side)
- Recognition accuracy varies by language and accent
- Some browsers may have rate limits

## Resources

- [Web Speech API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [SpeechRecognition - MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [Browser Compatibility](https://caniuse.com/speech-recognition)

## License

MIT
