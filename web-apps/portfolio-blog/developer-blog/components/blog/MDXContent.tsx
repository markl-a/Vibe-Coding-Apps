import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { useMDXComponents } from '@/lib/mdx-components';

interface MDXContentProps {
  content: string;
}

export default async function MDXContent({ content }: MDXContentProps) {
  return (
    <div className="prose prose-lg dark:prose-dark max-w-none">
      <MDXRemote
        source={content}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              rehypeSlug,
              [
                rehypeAutolinkHeadings,
                {
                  behavior: 'wrap',
                  properties: {
                    className: ['anchor'],
                  },
                },
              ],
            ],
          },
        }}
        components={useMDXComponents({})}
      />
    </div>
  );
}
