/**
 * Knowledge Base Article Management Examples
 *
 * This example demonstrates:
 * - Creating and updating articles
 * - Article categorization and tagging
 * - Search functionality with filters
 * - Version history and rollback
 * - Article approval workflow
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Type definitions for article operations
interface ArticleCreationData {
  title: string;
  content: string;
  summary?: string;
  authorId: string;
  categoryId: string;
  tags?: string[];
  status?: ArticleStatus;
  isPublic: boolean;
  allowComments: boolean;
}

interface ArticleUpdateData {
  title?: string;
  content?: string;
  summary?: string;
  categoryId?: string;
  tags?: string[];
  status?: ArticleStatus;
}

interface SearchFilters {
  query?: string;
  categoryId?: string;
  tags?: string[];
  authorId?: string;
  status?: ArticleStatus;
  isPublic?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

type ArticleStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'ARCHIVED';

/**
 * Create a new article
 *
 * @param data - Article creation details
 * @returns Created article object
 */
export async function createArticle(data: ArticleCreationData) {
  try {
    // Validate required fields
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Article title is required');
    }

    if (!data.content || data.content.trim().length === 0) {
      throw new Error('Article content is required');
    }

    // Generate URL slug from title
    const slug = generateSlug(data.title);

    // Create article
    const article = await prisma.article.create({
      data: {
        title: data.title,
        content: data.content,
        summary: data.summary,
        slug,
        authorId: data.authorId,
        categoryId: data.categoryId,
        status: data.status || 'DRAFT',
        isPublic: data.isPublic,
        allowComments: data.allowComments,
        version: 1,
        viewCount: 0,
        likeCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    // Create initial version history
    await prisma.articleVersion.create({
      data: {
        articleId: article.id,
        version: 1,
        title: article.title,
        content: article.content,
        summary: article.summary,
        createdById: data.authorId,
        createdAt: new Date(),
        changeDescription: 'Initial version'
      }
    });

    // Add tags if provided
    if (data.tags && data.tags.length > 0) {
      await addTagsToArticle(article.id, data.tags);
    }

    console.log('Article created successfully:', {
      id: article.id,
      title: article.title,
      slug: article.slug,
      author: `${article.author.firstName} ${article.author.lastName}`,
      category: article.category.name,
      status: article.status
    });

    return article;
  } catch (error) {
    console.error('Error creating article:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('Article with this slug already exists');
      }
      if (error.code === 'P2025') {
        throw new Error('Author or category not found');
      }
    }

    throw error;
  }
}

/**
 * Generate URL-friendly slug from title
 *
 * @param title - Article title
 * @returns URL slug
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .substring(0, 100); // Limit length
}

/**
 * Update an existing article
 *
 * @param articleId - Article ID
 * @param data - Fields to update
 * @param updatedById - ID of user making the update
 * @param changeDescription - Description of changes
 * @returns Updated article
 */
export async function updateArticle(
  articleId: string,
  data: ArticleUpdateData,
  updatedById: string,
  changeDescription?: string
) {
  try {
    const currentArticle = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!currentArticle) {
      throw new Error('Article not found');
    }

    // Prepare update data
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
      version: { increment: 1 }
    };

    // Generate new slug if title changed
    if (data.title && data.title !== currentArticle.title) {
      updateData.slug = generateSlug(data.title);
    }

    // Update article
    const article = await prisma.article.update({
      where: { id: articleId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create version history entry
    await prisma.articleVersion.create({
      data: {
        articleId,
        version: article.version,
        title: article.title,
        content: article.content,
        summary: article.summary,
        createdById: updatedById,
        createdAt: new Date(),
        changeDescription: changeDescription || 'Article updated'
      }
    });

    // Update tags if provided
    if (data.tags) {
      // Remove existing tags
      await prisma.articleTag.deleteMany({
        where: { articleId }
      });
      // Add new tags
      await addTagsToArticle(articleId, data.tags);
    }

    console.log('Article updated:', {
      id: article.id,
      title: article.title,
      version: article.version,
      updatedBy: updatedById,
      changes: Object.keys(data)
    });

    return article;
  } catch (error) {
    console.error('Error updating article:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new Error('Article not found');
      }
    }

    throw error;
  }
}

/**
 * Add tags to an article
 *
 * @param articleId - Article ID
 * @param tagNames - Array of tag names
 */
async function addTagsToArticle(articleId: string, tagNames: string[]) {
  try {
    const tagPromises = tagNames.map(async tagName => {
      const normalizedTag = tagName.toLowerCase().trim();

      // Find or create tag
      let tag = await prisma.tag.findUnique({
        where: { name: normalizedTag }
      });

      if (!tag) {
        tag = await prisma.tag.create({
          data: {
            name: normalizedTag,
            slug: generateSlug(normalizedTag)
          }
        });
      }

      // Link tag to article
      return prisma.articleTag.create({
        data: {
          articleId,
          tagId: tag.id
        }
      });
    });

    await Promise.all(tagPromises);

    console.log('Tags added to article:', {
      articleId,
      tagsCount: tagNames.length
    });
  } catch (error) {
    console.error('Error adding tags:', error);
    throw error;
  }
}

/**
 * Search articles with filters
 *
 * @param filters - Search filters
 * @param page - Page number
 * @param limit - Results per page
 * @returns Paginated search results
 */
export async function searchArticles(
  filters: SearchFilters = {},
  page: number = 1,
  limit: number = 20
) {
  try {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { content: { contains: filters.query, mode: 'insensitive' } },
        { summary: { contains: filters.query, mode: 'insensitive' } }
      ];
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.authorId) {
      where.authorId = filters.authorId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters.createdAfter || filters.createdBefore) {
      where.createdAt = {};
      if (filters.createdAfter) {
        where.createdAt.gte = filters.createdAfter;
      }
      if (filters.createdBefore) {
        where.createdAt.lte = filters.createdBefore;
      }
    }

    // Handle tag filtering
    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: {
              in: filters.tags
            }
          }
        }
      };
    }

    // Execute search
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          }
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.article.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    console.log('Articles searched:', {
      query: filters.query || 'all',
      resultsCount: articles.length,
      page,
      totalPages,
      total
    });

    return {
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    };
  } catch (error) {
    console.error('Error searching articles:', error);
    throw error;
  }
}

/**
 * Get article version history
 *
 * @param articleId - Article ID
 * @returns Array of article versions
 */
export async function getArticleVersionHistory(articleId: string) {
  try {
    const versions = await prisma.articleVersion.findMany({
      where: { articleId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { version: 'desc' }
    });

    console.log('Version history retrieved:', {
      articleId,
      versionsCount: versions.length
    });

    return versions;
  } catch (error) {
    console.error('Error retrieving version history:', error);
    throw error;
  }
}

/**
 * Rollback article to a previous version
 *
 * @param articleId - Article ID
 * @param targetVersion - Version number to rollback to
 * @param rolledBackBy - ID of user performing rollback
 * @returns Updated article
 */
export async function rollbackToVersion(
  articleId: string,
  targetVersion: number,
  rolledBackBy: string
) {
  try {
    // Get the target version
    const version = await prisma.articleVersion.findFirst({
      where: {
        articleId,
        version: targetVersion
      }
    });

    if (!version) {
      throw new Error(`Version ${targetVersion} not found`);
    }

    const currentArticle = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!currentArticle) {
      throw new Error('Article not found');
    }

    // Update article with version content
    const article = await prisma.article.update({
      where: { id: articleId },
      data: {
        title: version.title,
        content: version.content,
        summary: version.summary,
        version: { increment: 1 },
        updatedAt: new Date()
      }
    });

    // Create new version entry for the rollback
    await prisma.articleVersion.create({
      data: {
        articleId,
        version: article.version,
        title: version.title,
        content: version.content,
        summary: version.summary,
        createdById: rolledBackBy,
        createdAt: new Date(),
        changeDescription: `Rolled back to version ${targetVersion}`
      }
    });

    console.log('Article rolled back:', {
      articleId,
      fromVersion: currentArticle.version,
      toVersion: targetVersion,
      newVersion: article.version,
      rolledBackBy
    });

    return article;
  } catch (error) {
    console.error('Error rolling back article:', error);
    throw error;
  }
}

/**
 * Submit article for review
 *
 * @param articleId - Article ID
 * @param submittedBy - ID of user submitting for review
 * @returns Updated article
 */
export async function submitForReview(articleId: string, submittedBy: string) {
  try {
    const article = await prisma.article.update({
      where: { id: articleId },
      data: {
        status: 'PENDING_REVIEW',
        submittedForReviewAt: new Date(),
        submittedForReviewBy: submittedBy
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Create notification for reviewers
    // In a real app, you would notify designated reviewers
    console.log('Article submitted for review:', {
      articleId,
      title: article.title,
      submittedBy: `${article.author.firstName} ${article.author.lastName}`
    });

    return article;
  } catch (error) {
    console.error('Error submitting article for review:', error);
    throw error;
  }
}

/**
 * Approve or reject an article
 *
 * @param articleId - Article ID
 * @param approved - Whether to approve or reject
 * @param reviewerId - ID of reviewer
 * @param comments - Review comments
 * @returns Updated article
 */
export async function reviewArticle(
  articleId: string,
  approved: boolean,
  reviewerId: string,
  comments?: string
) {
  try {
    const newStatus: ArticleStatus = approved ? 'APPROVED' : 'DRAFT';

    const article = await prisma.article.update({
      where: { id: articleId },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        reviewComments: comments,
        ...(approved && { publishedAt: new Date() })
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create notification for author
    await prisma.notification.create({
      data: {
        userId: article.authorId,
        type: approved ? 'ARTICLE_APPROVED' : 'ARTICLE_REJECTED',
        referenceId: articleId,
        referenceType: 'ARTICLE',
        content: `Your article "${article.title}" has been ${approved ? 'approved' : 'rejected'}`,
        isRead: false,
        createdAt: new Date()
      }
    });

    console.log('Article reviewed:', {
      articleId,
      title: article.title,
      approved,
      reviewerId,
      newStatus
    });

    return article;
  } catch (error) {
    console.error('Error reviewing article:', error);
    throw error;
  }
}

/**
 * Track article view
 *
 * @param articleId - Article ID
 * @param userId - ID of user viewing the article (optional)
 */
export async function trackArticleView(articleId: string, userId?: string) {
  try {
    // Increment view count
    await prisma.article.update({
      where: { id: articleId },
      data: {
        viewCount: { increment: 1 }
      }
    });

    // Record individual view if user is logged in
    if (userId) {
      await prisma.articleView.create({
        data: {
          articleId,
          userId,
          viewedAt: new Date()
        }
      });
    }

    console.log('Article view tracked:', { articleId, userId: userId || 'anonymous' });
  } catch (error) {
    console.error('Error tracking article view:', error);
    // Don't throw - view tracking failures shouldn't break article display
  }
}

/**
 * Example usage demonstrating article management workflow
 */
export async function runArticleManagementExample() {
  try {
    console.log('=== Knowledge Base Article Management Example ===\n');

    // 1. Create a new article
    console.log('1. Creating new article...');
    const article = await createArticle({
      title: 'Getting Started with TypeScript',
      content: `# Introduction\n\nTypeScript is a strongly typed programming language that builds on JavaScript...\n\n## Installation\n\n\`\`\`bash\nnpm install -g typescript\n\`\`\`\n\n## Basic Types\n\nTypeScript supports various types including...`,
      summary: 'Learn the basics of TypeScript and how to get started',
      authorId: 'user-123', // Replace with actual user ID
      categoryId: 'cat-programming', // Replace with actual category ID
      tags: ['typescript', 'programming', 'tutorial', 'beginner'],
      status: 'DRAFT',
      isPublic: true,
      allowComments: true
    });

    // 2. Update the article
    console.log('\n2. Updating article...');
    await updateArticle(
      article.id,
      {
        content: article.content + '\n\n## Advanced Features\n\nTypeScript also provides advanced features like...',
        tags: ['typescript', 'programming', 'tutorial', 'beginner', 'advanced']
      },
      'user-123',
      'Added advanced features section'
    );

    // 3. Submit for review
    console.log('\n3. Submitting article for review...');
    await submitForReview(article.id, 'user-123');

    // 4. Review and approve
    console.log('\n4. Reviewing article...');
    await reviewArticle(
      article.id,
      true,
      'user-reviewer-456', // Replace with actual reviewer ID
      'Great article! Approved for publication.'
    );

    // 5. Search articles
    console.log('\n5. Searching articles...');
    const searchResults = await searchArticles({
      query: 'TypeScript',
      tags: ['programming'],
      status: 'APPROVED'
    }, 1, 10);
    console.log(`Found ${searchResults.articles.length} articles`);

    // 6. View version history
    console.log('\n6. Getting version history...');
    const versions = await getArticleVersionHistory(article.id);
    console.log(`Article has ${versions.length} versions`);

    // 7. Track views
    console.log('\n7. Tracking article views...');
    await trackArticleView(article.id, 'user-reader-789');

    // 8. Rollback to previous version (example)
    console.log('\n8. Rolling back to version 1...');
    await rollbackToVersion(article.id, 1, 'user-123');

    console.log('\n=== Example completed successfully ===');
  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uncomment to run the example
// runArticleManagementExample();
