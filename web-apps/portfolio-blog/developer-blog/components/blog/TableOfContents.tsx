'use client';

import { useEffect, useState } from 'react';
import { TableOfContentsItem } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TableOfContentsProps {
  items: TableOfContentsItem[];
}

export default function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0% 0% -80% 0%' }
    );

    items.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      items.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="sticky top-24 hidden lg:block">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Table of Contents
      </h3>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li
            key={item.id}
            style={{ paddingLeft: `${(item.level - 2) * 12}px` }}
          >
            <a
              href={`#${item.id}`}
              className={cn(
                'block py-1 transition-colors hover:text-primary-600 dark:hover:text-primary-400',
                activeId === item.id
                  ? 'text-primary-600 dark:text-primary-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
