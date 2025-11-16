# 📝 Quick Notes - Fast Note Taking

> A lightning-fast note-taking browser extension with markdown support and auto-save

## ✨ Features

- **Instant Access**: Press `Ctrl+Shift+N` to open notes anywhere
- **Markdown Support**: Format your notes with markdown syntax
- **Auto-Save**: Notes automatically saved as you type
- **Multiple Notes**: Create and manage multiple notes
- **Search**: Find notes quickly with full-text search
- **Export**: Export notes as text, markdown, or HTML
- **Dark Mode**: Beautiful dark theme for night owls
- **Cloud Sync**: Sync notes across devices (Chrome Sync)
- **Context Menu**: Save selected text as a new note
- **Keyboard Shortcuts**: Navigate and edit with keyboard

## 🚀 Quick Start

### Installation

```bash
cd browser-extensions/productivity-tools/quick-notes
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

### Creating Notes

1. Click the extension icon or press `Ctrl+Shift+N`
2. Start typing - notes auto-save
3. Click "New Note" for another note
4. Notes are automatically titled by first line

### Quick Capture

1. Select any text on a webpage
2. Right-click → "Save to Quick Notes"
3. Text is saved as a new note

### Organizing Notes

- **Pin Important Notes**: Click the pin icon
- **Delete Notes**: Click the trash icon
- **Search Notes**: Use the search bar
- **Sort Notes**: By date or title

### Keyboard Shortcuts

- `Ctrl+Shift+N` - Open Quick Notes
- `Ctrl+N` - New note
- `Ctrl+S` - Manual save
- `Ctrl+F` - Search
- `Ctrl+B` - Bold
- `Ctrl+I` - Italic
- `Esc` - Close popup

## 📋 Markdown Support

Quick Notes supports full markdown syntax:

### Headers
```markdown
# H1 Header
## H2 Header
### H3 Header
```

### Formatting
```markdown
**Bold text**
*Italic text*
~~Strikethrough~~
`Inline code`
```

### Lists
```markdown
- Bullet list
- Item 2

1. Numbered list
2. Item 2
```

### Links & Images
```markdown
[Link text](https://example.com)
![Alt text](image-url.jpg)
```

### Code Blocks
````markdown
```javascript
function hello() {
  console.log("Hello!");
}
```
````

### Quotes
```markdown
> This is a quote
> Multiple lines
```

### Tables
```markdown
| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |
```

## 💾 Export Options

### Export Single Note
1. Open the note
2. Click the export icon
3. Choose format:
   - Text (.txt)
   - Markdown (.md)
   - HTML (.html)
   - PDF (coming soon)

### Export All Notes
1. Click settings
2. Select "Export All"
3. Downloads ZIP file with all notes

## ⚙️ Settings

- **Auto-Save Delay**: Customize save delay (default: 1 second)
- **Theme**: Light, Dark, or Auto
- **Font Size**: Small, Medium, Large
- **Sync**: Enable/disable Chrome Sync
- **Export Format**: Default export format
- **Keyboard Shortcuts**: Customize shortcuts

## 🛠️ Tech Stack

- **React 18** + **TypeScript**
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Marked.js** for markdown rendering
- **Vite** + **CRXJS** for building
- **Chrome Extension Manifest V3**

## 📁 Project Structure

```
quick-notes/
├── src/
│   ├── background/
│   │   └── service-worker.ts      # Background tasks
│   ├── popup/
│   │   ├── App.tsx                # Main app
│   │   └── index.tsx
│   ├── components/
│   │   ├── NoteEditor.tsx         # Note editor
│   │   ├── NoteList.tsx           # Note list
│   │   ├── SearchBar.tsx          # Search
│   │   └── MarkdownPreview.tsx    # Preview
│   ├── hooks/
│   │   ├── useNotes.ts            # Note operations
│   │   └── useAutoSave.ts         # Auto-save logic
│   ├── types/
│   │   └── note.ts                # TypeScript types
│   └── utils/
│       ├── storage.ts             # Storage utilities
│       ├── markdown.ts            # Markdown helpers
│       └── export.ts              # Export functions
├── public/
│   └── icons/
├── manifest.json
└── README.md
```

## 💡 Use Cases

### Developers
```
- Code snippets
- API endpoints
- Bug notes
- Todo lists
- Command references
```

### Students
```
- Lecture notes
- Study summaries
- Assignment deadlines
- Research ideas
- Reading notes
```

### Writers
```
- Story ideas
- Character notes
- Plot outlines
- Research snippets
- Quotes collection
```

### General
```
- Shopping lists
- Meeting notes
- Reminders
- Bookmarks with notes
- Quick thoughts
```

## 🎨 Templates

Quick Notes includes pre-made templates:

- **Todo List**: Checkbox list template
- **Meeting Notes**: Meeting structure
- **Code Snippet**: Pre-formatted code block
- **Daily Journal**: Date-stamped entry
- **Book Notes**: Book review template

## 🔒 Privacy

- All notes stored locally by default
- Optional Chrome Sync (encrypted in transit)
- No external servers
- No analytics or tracking
- Completely offline capable
- Open source for transparency

## 📊 Statistics

Track your note-taking:
- Total notes created
- Total words written
- Most active days
- Average note length
- Writing streaks

## 🤝 Contributing

Contributions welcome:
- Bug reports
- Feature requests
- UI improvements
- Template suggestions
- Documentation

## 📄 License

MIT License

---

**Capture your thoughts instantly!** ⚡

Built with AI-assisted development
