# Quick Start Guide

Get your developer blog up and running in minutes!

## Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

## Installation Steps

1. **Install Dependencies**

```bash
npm install
```

2. **Run Development Server**

```bash
npm run dev
```

3. **Open Your Browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
developer-blog/
├── app/                    # Next.js 14 App Router
│   ├── about/             # About page
│   ├── api/               # API routes (search, RSS)
│   ├── blog/              # Blog pages
│   │   ├── [slug]/       # Individual blog post
│   │   └── tag/[tag]/    # Posts filtered by tag
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── not-found.tsx      # 404 page
├── components/            # React components
│   ├── blog/             # Blog-specific components
│   │   ├── BlogCard.tsx
│   │   ├── MDXContent.tsx
│   │   ├── SearchBar.tsx
│   │   └── TableOfContents.tsx
│   └── ui/               # Reusable UI components
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── ThemeToggle.tsx
├── content/              # Blog posts (MDX)
│   └── posts/            # Individual blog posts
│       ├── getting-started-with-nextjs-14.mdx
│       ├── typescript-best-practices.mdx
│       └── mastering-tailwind-css.mdx
├── lib/                  # Utility functions
│   ├── mdx.ts           # MDX processing
│   ├── mdx-components.tsx
│   ├── rss.ts           # RSS feed generation
│   ├── types.ts         # TypeScript types
│   └── utils.ts         # Utility functions
├── public/               # Static files
└── styles/               # Global styles
```

## Adding a New Blog Post

1. Create a new `.mdx` file in `content/posts/`:

```bash
touch content/posts/my-new-post.mdx
```

2. Add frontmatter and content:

```mdx
---
title: "My New Post"
date: "2024-01-25"
description: "A brief description of my post"
tags: ["Next.js", "React"]
author: "Your Name"
---

## Introduction

Your content here...
```

3. The post will automatically appear in your blog!

## Customization

### Change Colors

Edit `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    // Your custom colors
    500: '#your-color',
  },
}
```

### Update Site Information

Edit `app/layout.tsx` metadata:

```typescript
export const metadata: Metadata = {
  title: 'Your Blog Name',
  description: 'Your blog description',
  // ... other metadata
};
```

### Customize Components

All components are in the `components/` directory. Feel free to modify them!

## Building for Production

```bash
npm run build
npm run start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Deploy!

### Other Platforms

This is a standard Next.js app and can be deployed to:
- Netlify
- AWS Amplify
- Digital Ocean
- Any Node.js hosting

## Features

- ✅ Next.js 14 with App Router
- ✅ TypeScript
- ✅ Tailwind CSS with Dark Mode
- ✅ MDX for blog posts
- ✅ Syntax highlighting with Prism.js
- ✅ Reading time estimation
- ✅ Tag system
- ✅ Search functionality
- ✅ Table of Contents
- ✅ RSS Feed
- ✅ SEO optimized
- ✅ Responsive design

## Need Help?

- Check the [README.md](./README.md) for detailed documentation
- Review the example posts in `content/posts/`
- Visit [Next.js Documentation](https://nextjs.org/docs)

Happy blogging! 🚀
