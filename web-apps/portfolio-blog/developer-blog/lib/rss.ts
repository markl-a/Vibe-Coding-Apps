import { Feed } from 'feed';
import { getAllPosts } from './mdx';
import { getBaseUrl } from './utils';

export function generateRssFeed() {
  const baseUrl = getBaseUrl();
  const posts = getAllPosts();

  const feed = new Feed({
    title: 'Developer Blog',
    description: 'A modern developer blog with tutorials and insights',
    id: baseUrl,
    link: baseUrl,
    language: 'en',
    image: `${baseUrl}/logo.png`,
    favicon: `${baseUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    feedLinks: {
      rss2: `${baseUrl}/rss.xml`,
      json: `${baseUrl}/feed.json`,
      atom: `${baseUrl}/atom.xml`,
    },
    author: {
      name: 'Developer Blog',
      email: 'hello@example.com',
      link: baseUrl,
    },
  });

  posts.forEach((post) => {
    const url = `${baseUrl}/blog/${post.slug}`;
    feed.addItem({
      title: post.title,
      id: url,
      link: url,
      description: post.description,
      content: post.content,
      author: [
        {
          name: post.author,
        },
      ],
      date: new Date(post.date),
      category: post.tags.map((tag) => ({ name: tag })),
    });
  });

  return {
    rss: feed.rss2(),
    atom: feed.atom1(),
    json: feed.json1(),
  };
}
