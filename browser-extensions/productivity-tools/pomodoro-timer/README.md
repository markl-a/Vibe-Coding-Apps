# 🍅 Pomodoro Timer - Focus & Productivity

> A beautiful and functional Pomodoro Timer browser extension to boost your productivity using the Pomodoro Technique

## ✨ Features

### Core Features
- **Classic Pomodoro Timer**: 25-minute work sessions with 5-minute breaks
- **Customizable Intervals**: Adjust work, short break, and long break durations
- **Visual & Audio Notifications**: Get notified when sessions complete
- **Session Tracking**: Track completed pomodoros and productivity stats
- **Dark/Light Theme**: Beautiful UI that adapts to your preference
- **Keyboard Shortcuts**: Quick access with keyboard commands
- **Persistent State**: Resume your session even after closing the popup

### 🤖 AI-Powered Insights (New!)
- **📊 Productivity Analysis**: Track patterns and trends in your work habits
- **💡 Personalized Recommendations**: Get AI-driven suggestions to optimize your focus time
- **🔥 Streak Tracking**: Monitor your consistency and build productive habits
- **⏰ Peak Performance Detection**: Discover your most productive times of day
- **📈 Completion Rate Analysis**: Understand and improve your task completion
- **☕ Smart Break Suggestions**: Receive context-aware activity suggestions for breaks
- **📅 Weekly Pattern Analysis**: Identify your most productive days
- **📊 AI-Generated Reports**: Get detailed productivity reports with actionable insights
- **🎯 Optimal Duration Prediction**: AI suggests ideal focus session lengths based on your performance

## 🚀 Quick Start

### Installation

```bash
cd browser-extensions/productivity-tools/pomodoro-timer
npm install
```

### Development

```bash
npm run dev
```

Then load the extension in Chrome:
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder

### Build for Production

```bash
npm run build
```

## 🎯 How to Use

1. Click the extension icon to open the timer
2. Click "Start" to begin a 25-minute focus session
3. Work until the timer ends
4. Take a 5-minute break when prompted
5. After 4 pomodoros, take a longer 15-minute break

## ⚙️ Customization

Click the settings icon to customize:
- Work duration (default: 25 minutes)
- Short break duration (default: 5 minutes)
- Long break duration (default: 15 minutes)
- Pomodoros until long break (default: 4)
- Sound notifications
- Desktop notifications

## 📊 Statistics

Track your productivity:
- Total pomodoros completed
- Total focus time
- Daily/Weekly/Monthly stats
- Productivity trends

## 🤖 AI Insights Tab

Access powerful AI-driven productivity insights:

### Productivity Analysis
The AI analyzes your work patterns and provides:
- **Success Insights**: Celebrate your streaks and achievements
- **Warning Alerts**: Identify productivity drops early
- **Performance Tips**: Get suggestions for your peak productivity times
- **Completion Metrics**: Track and improve your task completion rates

### Personalized Recommendations
Receive tailored advice based on your unique work patterns:
- Focus time optimization
- Break frequency suggestions
- Optimal scheduling recommendations
- Session duration adjustments

### Smart Break Activities
During breaks, get context-aware suggestions like:
- **Short Breaks** (5 min): Quick stretches, hydration, eye rest
- **Long Breaks** (15 min): Walks, healthy snacks, meditation, planning

### AI-Generated Reports
Click "生成報告" to get a comprehensive productivity report including:
- Total performance metrics
- Current streaks
- Peak productivity times
- Actionable recommendations
- Copy-to-clipboard functionality

### How It Works
1. Complete pomodoro sessions to build your data history
2. Switch to the "🤖 AI 洞察" tab
3. View real-time insights and recommendations
4. Generate detailed reports as needed
5. Apply suggestions to improve productivity

**No API Key Required** - All AI analysis runs locally using intelligent algorithms!

## 🛠️ Tech Stack

- **React 18** + **TypeScript**
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Vite** + **CRXJS** for building
- **Chrome Extension Manifest V3**

## 📁 Project Structure

```
pomodoro-timer/
├── src/
│   ├── background/
│   │   └── service-worker.ts      # Background timer logic
│   ├── popup/
│   │   ├── App.tsx                # Main popup component
│   │   └── index.tsx              # Entry point
│   ├── components/
│   │   ├── Timer.tsx              # Timer display
│   │   ├── Controls.tsx           # Start/Pause/Reset buttons
│   │   ├── Settings.tsx           # Settings panel
│   │   └── Stats.tsx              # Statistics display
│   ├── hooks/
│   │   ├── useTimer.ts            # Timer logic hook
│   │   └── useSettings.ts         # Settings management
│   ├── store/
│   │   └── timerStore.ts          # Zustand state
│   ├── types/
│   │   └── timer.ts               # TypeScript types
│   └── utils/
│       ├── timeFormat.ts          # Time formatting utilities
│       └── notifications.ts       # Notification helpers
├── public/
│   └── icons/                     # Extension icons
├── manifest.json
├── package.json
└── README.md
```

## 🎨 Screenshots

### Timer Running
![Timer](docs/screenshots/timer.png)

### Break Time
![Break](docs/screenshots/break.png)

### Statistics
![Stats](docs/screenshots/stats.png)

## 🔑 Keyboard Shortcuts

- `Space` - Start/Pause timer
- `R` - Reset timer
- `S` - Open settings
- `Esc` - Close popup

## 📝 The Pomodoro Technique

The Pomodoro Technique is a time management method:

1. Choose a task
2. Set the timer for 25 minutes
3. Work on the task until the timer rings
4. Take a 5-minute break
5. Every 4 pomodoros, take a longer 15-minute break

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

MIT License

---

**Boost your productivity with focused work sessions!** 🚀

Made with ❤️ using AI-assisted development
