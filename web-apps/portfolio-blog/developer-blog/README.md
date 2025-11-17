# Developer Blog

A modern, feature-rich developer blog built with Next.js 14, TypeScript, and MDX.

## Features

- **Next.js 14 App Router** - Utilizing the latest Next.js features
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Modern styling with utility classes
- **MDX Support** - Write blog posts in Markdown with React components
- **Syntax Highlighting** - Code blocks with Prism.js
- **Reading Time** - Automatic reading time estimation
- **Tag System** - Organize posts by tags
- **Search Functionality** - Search through blog posts
- **Table of Contents** - Auto-generated TOC for posts
- **Dark Mode** - Toggle between light and dark themes
- **RSS Feed** - RSS feed for blog posts
- **SEO Optimized** - Meta tags and Open Graph support
- **Responsive Design** - Mobile-friendly layout

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

## Project Structure

```
developer-blog/
├── app/                    # Next.js 14 App Router
│   ├── about/             # About page
│   ├── api/               # API routes
│   ├── blog/              # Blog pages
│   │   ├── [slug]/       # Individual blog post
│   │   └── tag/[tag]/    # Posts filtered by tag
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── blog/             # Blog-specific components
│   └── ui/               # Reusable UI components
├── content/              # Blog posts (MDX)
│   └── posts/            # Individual blog posts
├── lib/                  # Utility functions
├── public/               # Static files
├── styles/               # Global styles
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

## License

MIT

## Author

Your Name
