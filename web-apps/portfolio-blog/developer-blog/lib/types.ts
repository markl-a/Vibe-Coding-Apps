export interface Post {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  author: string;
  image?: string;
  content: string;
  readingTime: string;
}

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  author: string;
  image?: string;
  readingTime: string;
}

export interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}

export interface SearchResult {
  slug: string;
  title: string;
  description: string;
  tags: string[];
}
