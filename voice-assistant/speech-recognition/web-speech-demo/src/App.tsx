import { useState, useEffect, useCallback } from 'react';
import { useSpeechRecognition, useVoiceCommands, type VoiceCommand } from './hooks';

/**
 * Web Speech Demo App
 *
 * Demonstrates speech recognition and voice commands using the Web Speech API.
 */

// Supported languages
const LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'zh-TW', name: '中文 (繁體)' },
  { code: 'zh-CN', name: '中文 (简体)' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' },
  { code: 'es-ES', name: 'Español' },
  { code: 'fr-FR', name: 'Français' },
  { code: 'de-DE', name: 'Deutsch' },
];

interface HistoryItem {
  text: string;
  command?: string;
  timestamp: Date;
}

export default function App() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [backgroundColor, setBackgroundColor] = useState('#667eea');
  const [message, setMessage] = useState<string | null>(null);

  // Define commands
  const defaultCommands: VoiceCommand[] = [
    {
      phrase: 'hello',
      description: 'Say hello',
      aliases: ['hi', 'hey'],
      action: () => setMessage('Hello! How can I help you?'),
    },
    {
      phrase: 'change color to *',
      description: 'Change background color',
      aliases: ['set color *', 'make it *'],
      action: (color) => {
        if (color) {
          const colorMap: Record<string, string> = {
            red: '#e53935',
            blue: '#1e88e5',
            green: '#43a047',
            purple: '#8e24aa',
            orange: '#fb8c00',
            pink: '#d81b60',
            yellow: '#fdd835',
            black: '#212121',
          };
          setBackgroundColor(colorMap[color.toLowerCase()] || color);
          setMessage(`Changed color to ${color}`);
        }
      },
    },
    {
      phrase: 'what time is it',
      description: 'Tell current time',
      aliases: ['current time', 'time please'],
      action: () => {
        const time = new Date().toLocaleTimeString();
        setMessage(`The current time is ${time}`);
      },
    },
    {
      phrase: "what's the date",
      description: 'Tell current date',
      aliases: ['current date', 'today date'],
      action: () => {
        const date = new Date().toLocaleDateString();
        setMessage(`Today is ${date}`);
      },
    },
    {
      phrase: 'clear',
      description: 'Clear transcript',
      aliases: ['reset', 'start over'],
      action: () => {
        resetTranscript();
        setHistory([]);
        setMessage('Cleared!');
      },
    },
    {
      phrase: 'scroll down',
      description: 'Scroll page down',
      action: () => {
        window.scrollBy({ top: 200, behavior: 'smooth' });
        setMessage('Scrolling down...');
      },
    },
    {
      phrase: 'scroll up',
      description: 'Scroll page up',
      action: () => {
        window.scrollBy({ top: -200, behavior: 'smooth' });
        setMessage('Scrolling up...');
      },
    },
  ];

  const { commands, processTranscript, lastMatchedCommand } = useVoiceCommands(defaultCommands);

  const handleResult = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal && text.trim()) {
        const result = processTranscript(text);

        setHistory((prev) => [
          {
            text: text.trim(),
            command: result.matched ? result.command : undefined,
            timestamp: new Date(),
          },
          ...prev.slice(0, 9),
        ]);
      }
    },
    [processTranscript]
  );

  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    setLanguage,
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    onResult: handleResult,
  });

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!isSupported) {
    return (
      <div className="app">
        <div className="card">
          <div className="browser-support">
            <h2>Browser Not Supported</h2>
            <p>
              Web Speech API is not supported in your browser. Please use Chrome, Edge, or Safari.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app" style={{ background: `linear-gradient(135deg, ${backgroundColor} 0%, #764ba2 100%)` }}>
      <div className="card">
        <h1>Web Speech Demo</h1>
        <p className="subtitle">Speak into your microphone to see real-time transcription</p>

        {/* Status bar */}
        <div className="status-bar">
          <div className={`status-indicator ${isListening ? 'listening' : ''} ${error ? 'error' : ''}`} />
          <span>{isListening ? 'Listening...' : 'Click Start to begin'}</span>
        </div>

        {/* Controls */}
        <div className="controls">
          <button
            className="btn btn-primary"
            onClick={isListening ? stopListening : startListening}
          >
            {isListening ? '⏹ Stop' : '🎤 Start'}
          </button>
          <button className="btn btn-secondary" onClick={resetTranscript}>
            🗑 Clear
          </button>
        </div>

        {/* Message notification */}
        {message && (
          <div
            style={{
              background: '#e8f5e9',
              color: '#2e7d32',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              animation: 'fadeIn 0.3s',
            }}
          >
            {message}
          </div>
        )}

        {/* Transcript */}
        <div className="transcript-box">
          <h3>Transcript</h3>
          <p className="transcript">
            {transcript}
            {interimTranscript && <span className="interim">{interimTranscript}</span>}
            {!transcript && !interimTranscript && (
              <span style={{ color: '#999' }}>Your speech will appear here...</span>
            )}
          </p>
        </div>

        {/* Error message */}
        {error && <div className="error-message">{error}</div>}

        {/* Available commands */}
        <div className="commands-section">
          <h3>Voice Commands</h3>
          <div className="command-grid">
            {commands.map((cmd) => (
              <div
                key={cmd.phrase}
                className={`command-card ${lastMatchedCommand === cmd.phrase ? 'active' : ''}`}
              >
                <div className="command-phrase">"{cmd.phrase}"</div>
                <div className="command-desc">{cmd.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="history-section">
            <h3>Recent Speech</h3>
            <ul className="history-list">
              {history.map((item, index) => (
                <li key={index} className="history-item">
                  <span>
                    {item.text}
                    {item.command && (
                      <span
                        style={{
                          marginLeft: '0.5rem',
                          padding: '0.125rem 0.5rem',
                          background: '#e3f2fd',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          color: '#1976d2',
                        }}
                      >
                        {item.command}
                      </span>
                    )}
                  </span>
                  <span className="history-time">
                    {item.timestamp.toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Settings */}
        <div className="settings-section">
          <h3>Settings</h3>
          <div className="setting-row">
            <span className="setting-label">Language</span>
            <select
              onChange={(e) => setLanguage(e.target.value)}
              defaultValue="en-US"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
