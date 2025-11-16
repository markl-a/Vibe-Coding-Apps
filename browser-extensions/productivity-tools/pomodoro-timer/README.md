# 🍅 Pomodoro Timer - Focus & Productivity

> A beautiful and functional Pomodoro Timer browser extension to boost your productivity using the Pomodoro Technique

## ✨ Features

- **Classic Pomodoro Timer**: 25-minute work sessions with 5-minute breaks
- **Customizable Intervals**: Adjust work, short break, and long break durations
- **Visual & Audio Notifications**: Get notified when sessions complete
- **Session Tracking**: Track completed pomodoros and productivity stats
- **Dark/Light Theme**: Beautiful UI that adapts to your preference
- **Keyboard Shortcuts**: Quick access with keyboard commands
- **Persistent State**: Resume your session even after closing the popup

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
