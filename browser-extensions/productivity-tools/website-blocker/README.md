# 🚫 Website Blocker - Focus Mode

> A powerful browser extension to block distracting websites and boost your productivity

## ✨ Features

- **Quick Block**: Instantly block distracting websites
- **Block Lists**: Create custom block lists for different scenarios (work, study, etc.)
- **Scheduled Blocking**: Set specific times when sites should be blocked
- **Whitelist Mode**: Allow only specific websites
- **Redirect Options**: Redirect to motivational pages or custom URLs
- **Password Protection**: Prevent yourself from disabling the blocker
- **Statistics**: Track blocked attempts and saved time
- **Import/Export**: Share block lists with others

## 🚀 Quick Start

### Installation

```bash
cd browser-extensions/productivity-tools/website-blocker
npm install
```

### Development

```bash
npm run dev
```

Load the extension:
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder

### Build for Production

```bash
npm run build
```

## 🎯 How to Use

### Basic Blocking

1. Click the extension icon
2. Enter a website URL (e.g., `facebook.com`)
3. Click "Add to Blocklist"
4. The site will be blocked immediately

### Advanced Features

**Create Block Lists**
- Organize blocks by category (Social Media, News, Gaming, etc.)
- Enable/disable entire lists with one click
- Switch between lists for different work modes

**Schedule Blocking**
- Set specific hours when sites should be blocked
- Configure different schedules for weekdays and weekends
- Use "Focus Mode" for intensive work sessions

**Redirect Page**
- Customize the page shown when accessing blocked sites
- Show motivational quotes
- Display remaining work time
- Link to productivity tips

## 📋 Block List Examples

### Social Media
```
facebook.com
twitter.com
instagram.com
linkedin.com
reddit.com
```

### Entertainment
```
youtube.com
netflix.com
twitch.tv
```

### News
```
cnn.com
bbc.com
news.google.com
```

## ⚙️ Configuration Options

- **Strict Mode**: Cannot disable without password
- **Break Reminders**: Get notified when it's time for a break
- **Productivity Goals**: Set daily focus time goals
- **Sync Settings**: Sync across devices (Chrome Sync)
- **Custom Redirect**: Use your own redirect page

## 🛠️ Tech Stack

- **React 18** + **TypeScript**
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Vite** + **CRXJS** for building
- **Chrome Extension Manifest V3**

## 📁 Project Structure

```
website-blocker/
├── src/
│   ├── background/
│   │   └── service-worker.ts      # Blocking logic
│   ├── popup/
│   │   ├── App.tsx                # Main popup
│   │   └── index.tsx
│   ├── components/
│   │   ├── BlockList.tsx          # Block list management
│   │   ├── AddSite.tsx            # Add site form
│   │   ├── Schedule.tsx           # Scheduling interface
│   │   └── Stats.tsx              # Statistics display
│   ├── types/
│   │   └── blocker.ts             # TypeScript types
│   └── utils/
│       ├── urlMatcher.ts          # URL matching logic
│       └── storage.ts             # Storage utilities
├── public/
│   ├── icons/
│   └── blocked.html               # Redirect page
├── manifest.json
└── README.md
```

## 🎨 Customization

### Custom Redirect Page

Create your own `blocked.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Site Blocked</title>
</head>
<body>
  <h1>🚫 This site is blocked</h1>
  <p>Stay focused on your goals!</p>
  <a href="#" onclick="history.back()">Go Back</a>
</body>
</html>
```

### Import/Export Settings

Export your configuration:
```javascript
// Click "Export Settings" in options
// Saves JSON file with all your settings
```

Import shared lists:
```javascript
// Click "Import Settings" in options
// Select JSON file to load
```

## 📊 Statistics Tracked

- Total sites blocked
- Blocking attempts prevented
- Estimated time saved
- Most blocked sites
- Daily/weekly trends
- Focus streak

## 🔒 Privacy

- All data stored locally
- No tracking or analytics
- No external connections
- Optional Chrome Sync for settings
- Open source and auditable

## 💡 Tips for Maximum Productivity

1. **Start Small**: Block 2-3 most distracting sites first
2. **Schedule Wisely**: Use scheduled blocking for deep work hours
3. **Use Breaks**: Don't block sites during scheduled break times
4. **Whitelist Mode**: For extreme focus, use whitelist mode
5. **Review Stats**: Check your statistics weekly to track progress

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Additional blocking patterns
- Better URL matching
- Mobile browser support
- Focus session integration
- Pomodoro timer integration

## 📄 License

MIT License

---

**Stay focused, stay productive!** 💪

Built with AI-assisted development tools
