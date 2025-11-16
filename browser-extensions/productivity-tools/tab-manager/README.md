# 📑 Tab Manager - Smart Tab Organization

> A powerful browser extension to manage, organize, and search through your tabs efficiently

## ✨ Features

- **Quick Search**: Instantly find tabs by title or URL with fuzzy search
- **Tab Groups**: Organize tabs into colored groups
- **Save Sessions**: Save and restore tab sessions for different projects
- **Duplicate Detection**: Find and close duplicate tabs
- **Memory Saver**: Suspend inactive tabs to save memory
- **Tab Preview**: Visual preview of tab content
- **Keyboard Shortcuts**: Quick access with Ctrl+Shift+T
- **Statistics**: Track tab usage and patterns
- **Export/Import**: Share tab sessions with others

## 🚀 Quick Start

### Installation

```bash
cd browser-extensions/productivity-tools/tab-manager
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

### Basic Features

**Search Tabs**
- Press `Ctrl+Shift+F` to open tab search
- Type to filter tabs by title or URL
- Click a tab to switch to it
- Use arrow keys for navigation

**Organize with Groups**
- Select multiple tabs (Ctrl+Click)
- Click "Create Group"
- Choose a color and name
- Tabs are now visually grouped

**Save Sessions**
- Click "Save Session"
- Name your session (e.g., "Work", "Research")
- Close tabs safely knowing they're saved
- Restore anytime from saved sessions

### Advanced Features

**Suspend Tabs**
- Right-click a tab → "Suspend"
- Tab content unloaded to save memory
- Click to restore when needed
- Auto-suspend after idle time

**Duplicate Management**
- Click "Find Duplicates"
- Review duplicate tabs
- Bulk close duplicates
- Keep one version

**Bulk Actions**
- Select multiple tabs
- Close all in one click
- Pin/Unpin selected tabs
- Move to new window
- Bookmark all

## 📊 Use Cases

### For Developers
```
Save sessions for:
- Project A (docs, GitHub, localhost)
- Project B (different repos, tools)
- Learning (tutorials, Stack Overflow)
```

### For Researchers
```
Organize by topic:
- Literature Review (papers, articles)
- Data Collection (sources, datasets)
- Writing (docs, references)
```

### For Students
```
Manage courses:
- Course 1 (syllabus, lectures, assignments)
- Course 2 (materials, discussions)
- General (email, calendar, news)
```

## ⚙️ Configuration

### Settings Options

- **Auto-Group**: Automatically group tabs by domain
- **Suspend Timer**: Set idle time before auto-suspend
- **Search Scope**: Search current window or all windows
- **Theme**: Light/Dark/Auto
- **Shortcuts**: Customize keyboard shortcuts
- **Privacy**: Control data collection

### Keyboard Shortcuts

- `Ctrl+Shift+T` - Open Tab Manager
- `Ctrl+Shift+F` - Search Tabs
- `Ctrl+Shift+D` - Find Duplicates
- `Ctrl+Shift+S` - Save Current Session
- `Esc` - Close popup

## 🛠️ Tech Stack

- **React 18** + **TypeScript**
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Fuse.js** for fuzzy search
- **Vite** + **CRXJS** for building
- **Chrome Extension Manifest V3**

## 📁 Project Structure

```
tab-manager/
├── src/
│   ├── background/
│   │   └── service-worker.ts      # Background tasks
│   ├── popup/
│   │   ├── App.tsx                # Main popup
│   │   └── index.tsx
│   ├── components/
│   │   ├── TabList.tsx            # Tab list display
│   │   ├── TabItem.tsx            # Individual tab
│   │   ├── SearchBar.tsx          # Search interface
│   │   ├── TabGroup.tsx           # Group management
│   │   └── SessionManager.tsx     # Session controls
│   ├── hooks/
│   │   ├── useTabs.ts             # Tab operations
│   │   ├── useSearch.ts           # Search logic
│   │   └── useSessions.ts         # Session management
│   ├── types/
│   │   └── tabs.ts                # TypeScript types
│   └── utils/
│       ├── tabUtils.ts            # Tab utilities
│       ├── searchUtils.ts         # Search helpers
│       └── storage.ts             # Storage utilities
├── public/
│   └── icons/
├── manifest.json
└── README.md
```

## 🎨 Tab Groups

### Predefined Color Schemes

- 🔵 **Blue**: Work/Professional
- 🟢 **Green**: Personal/Social
- 🟡 **Yellow**: Learning/Education
- 🔴 **Red**: Urgent/Important
- 🟣 **Purple**: Creative/Design
- 🟠 **Orange**: Shopping/Entertainment

### Custom Groups

Create your own groups:
1. Select tabs
2. Click "New Group"
3. Choose color
4. Name your group
5. Set icon (optional)

## 💡 Tips & Tricks

### Productivity Hacks

1. **One-Tab-Per-Domain Rule**
   - Use duplicate detection
   - Keep only one tab per site
   - Reduce mental clutter

2. **Time-Based Sessions**
   - Morning routine tabs
   - Afternoon focus tabs
   - Evening leisure tabs

3. **Project Isolation**
   - Create session per project
   - Switch contexts cleanly
   - Avoid tab overflow

4. **Memory Management**
   - Enable auto-suspend
   - Set aggressive timeout (15min)
   - Restore only when needed

5. **Search Power User**
   - Use fuzzy matching: "ghb pr" → "GitHub Pull Requests"
   - Domain search: "@github.com"
   - Title search: "todo"

## 📈 Statistics

Track your tab usage:
- Average tabs open
- Most used domains
- Session restore frequency
- Memory saved by suspension
- Productivity trends

## 🔒 Privacy

- All data stored locally
- No cloud sync (optional)
- No analytics tracking
- No external requests
- Open source code

## 🤝 Contributing

We welcome contributions:
- Bug reports
- Feature requests
- UI/UX improvements
- Documentation
- Code optimization

## 📄 License

MIT License

---

**Master your tabs, master your workflow!** 🚀

Built with AI-assisted development
