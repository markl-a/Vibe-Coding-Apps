# Developer Blog 🚀

A modern, **AI-powered** developer blog built with Next.js 14, TypeScript, and MDX.

## ✨ Features

### Core Features
- **Next.js 14 App Router** - Utilizing the latest Next.js features
- **TypeScript** - Type-safe code throughout
- **Tailwind CSS** - Modern styling with utility classes
- **MDX Support** - Write blog posts in Markdown with React components
- **Syntax Highlighting** - Beautiful code blocks with Prism.js
- **Reading Time** - Automatic reading time estimation
- **Tag System** - Organize posts by tags
- **Search Functionality** - Fast search through blog posts
- **Table of Contents** - Auto-generated TOC for posts
- **Dark Mode** - Seamless toggle between light and dark themes
- **RSS Feed** - RSS feed for blog posts
- **SEO Optimized** - Meta tags and Open Graph support
- **Responsive Design** - Mobile-first, fully responsive layout

### 🤖 AI-Powered Features (NEW!)

- **AI Assistant Chatbot** - Interactive AI assistant for blog navigation and content discovery
- **AI Content Generator** - Generate blog posts, outlines, and SEO metadata
- **AI Code Explainer** - Get instant code explanations and improvement suggestions
- **Interactive Code Playground** - Live code execution environment
- **Reading Progress Tracker** - Visual reading progress with smooth animations
- **Smart Content Recommendations** - AI-powered related post suggestions
- **Enhanced Search** - Intelligent search with query understanding

📖 **[View Complete AI Features Documentation](./AI_FEATURES.md)**

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Content**: MDX with next-mdx-remote
- **Syntax Highlighting**: Prism.js
- **Icons**: Lucide React
- **Date Formatting**: date-fns
- **Reading Time**: reading-time

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
developer-blog/
├── app/                    # Next.js 14 App Router
│   ├── about/             # About page
│   ├── ai-tools/          # 🆕 AI Tools page
│   ├── api/               # API routes
│   │   └── search/        # Search API endpoint
│   ├── blog/              # Blog pages
│   │   ├── [slug]/       # Individual blog post
│   │   └── tag/[tag]/    # Posts filtered by tag
│   ├── layout.tsx         # Root layout with AI Assistant
│   └── page.tsx           # Homepage
├── components/
│   ├── ai/               # 🆕 AI-powered components
│   │   ├── AIAssistant.tsx          # Chatbot assistant
│   │   ├── AIContentGenerator.tsx   # Content generation tool
│   │   └── AICodeExplainer.tsx      # Code explanation tool
│   ├── blog/             # Blog-specific components
│   │   ├── BlogCard.tsx
│   │   ├── MDXContent.tsx
│   │   ├── ReadingProgress.tsx      # 🆕 Reading tracker
│   │   ├── RelatedPosts.tsx         # 🆕 AI recommendations
│   │   ├── SearchBar.tsx
│   │   └── TableOfContents.tsx
│   ├── interactive/      # 🆕 Interactive components
│   │   └── CodePlayground.tsx       # Live code editor
│   └── ui/               # Reusable UI components
├── content/              # Blog posts (MDX)
│   └── posts/            # Individual blog posts
│       ├── getting-started-with-nextjs-14.mdx
│       ├── typescript-best-practices.mdx
│       ├── mastering-tailwind-css.mdx
│       ├── ai-powered-development-tools.mdx      # 🆕
│       └── interactive-code-learning.mdx         # 🆕
├── lib/                  # Utility functions
│   ├── ai-utils.ts       # 🆕 AI utility functions
│   ├── mdx.ts
│   ├── types.ts
│   └── utils.ts
├── AI_FEATURES.md        # 🆕 AI features documentation
├── public/               # Static files
└── next.config.js        # Next.js configuration
```

## Writing Blog Posts

Blog posts are written in MDX format and stored in the `content/posts` directory.

### Post Frontmatter

Each post should include frontmatter with the following fields:

```mdx
---
title: "Your Post Title"
date: "2024-01-01"
description: "A brief description of your post"
tags: ["tag1", "tag2"]
author: "Your Name"
image: "/images/post-image.jpg"
---

Your post content here...
```

### Adding a New Post

1. Create a new `.mdx` file in `content/posts/`
2. Add the required frontmatter
3. Write your content using Markdown and React components
4. Save the file - it will automatically appear in the blog

## Customization

### Changing Colors

Edit `tailwind.config.ts` to customize the color scheme:

```ts
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      }
    }
  }
}
```

### Adding Components

Place reusable components in the `components` directory and import them in your MDX files.

## Building for Production

```bash
npm run build
npm run start
```

## Deployment

This project can be deployed to Vercel, Netlify, or any platform that supports Next.js.

### Vercel

The easiest way to deploy is using [Vercel](https://vercel.com):

```bash
npm i -g vercel
vercel
```

## 🚀 Quick Start with AI Features

After installation, explore the AI features:

1. **Try the AI Assistant**: Click the floating sparkle button in the bottom-right
2. **Generate Content**: Visit `/ai-tools` to try content generation
3. **Explain Code**: Use the code explainer on the AI Tools page
4. **Interactive Learning**: Check out blog posts with embedded code playgrounds

## 📚 Documentation

- [AI Features Guide](./AI_FEATURES.md) - Complete AI features documentation
- [Quick Start Guide](./QUICKSTART.md) - Getting started quickly
- [Project Summary](./PROJECT_SUMMARY.md) - Overview and statistics
- [Verification Checklist](./VERIFICATION_CHECKLIST.md) - Quality assurance

## 🎯 Use Cases

Perfect for:
- **Developer Portfolios** - Showcase your expertise with professional blog
- **Tech Blogs** - Share knowledge with interactive examples
- **Learning Platforms** - Teach with AI-assisted explanations
- **Documentation Sites** - Create interactive API docs

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

MIT

## 👥 Authors

DevBlog Team - Built with ❤️ and AI

---

**Powered by**: Next.js 14 | TypeScript | Tailwind CSS | AI

**Last Updated**: 2025-11-18
