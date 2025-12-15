import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article, ArticleStatus } from './article.entity';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private articlesRepository: Repository<Article>,
  ) {}

  async create(articleData: Partial<Article>): Promise<Article> {
    const article = this.articlesRepository.create(articleData);
    return this.articlesRepository.save(article);
  }

  async findAll(page = 1, limit = 10): Promise<{ data: Article[]; total: number }> {
    // Ensure limit doesn't exceed maximum
    const maxLimit = 100;
    const safeLimit = Math.min(limit, maxLimit);
    const offset = (page - 1) * safeLimit;

    const queryBuilder = this.articlesRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.categories', 'categories')
      .leftJoinAndSelect('article.tags', 'tags')
      .where('article.status = :status', { status: ArticleStatus.PUBLISHED })
      .orderBy('article.publishedAt', 'DESC')
      .skip(offset)
      .take(safeLimit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Article> {
    // Use subquery to limit comments to avoid N+1 and properly limit comments count
    const article = await this.articlesRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.categories', 'categories')
      .leftJoinAndSelect('article.tags', 'tags')
      .leftJoin('article.comments', 'comments')
      .leftJoin('comments.user', 'commentUser')
      .addSelect([
        'comments.id',
        'comments.content',
        'comments.createdAt',
        'comments.isApproved',
        'commentUser.id',
        'commentUser.name',
        'commentUser.email'
      ])
      .where('article.id = :id', { id })
      .andWhere('(comments.isApproved = :isApproved OR comments.id IS NULL)', { isApproved: true })
      .orderBy('article.id', 'ASC')
      .addOrderBy('comments.createdAt', 'DESC')
      .getOne();

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    // Limit comments to 50 after fetching
    if (article.comments && article.comments.length > 50) {
      article.comments = article.comments.slice(0, 50);
    }

    return article;
  }

  async findBySlug(slug: string): Promise<Article> {
    // Use subquery to limit comments to avoid N+1 and properly limit comments count
    const article = await this.articlesRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.categories', 'categories')
      .leftJoinAndSelect('article.tags', 'tags')
      .leftJoin('article.comments', 'comments')
      .leftJoin('comments.user', 'commentUser')
      .addSelect([
        'comments.id',
        'comments.content',
        'comments.createdAt',
        'comments.isApproved',
        'commentUser.id',
        'commentUser.name',
        'commentUser.email'
      ])
      .where('article.slug = :slug', { slug })
      .andWhere('(comments.isApproved = :isApproved OR comments.id IS NULL)', { isApproved: true })
      .orderBy('article.id', 'ASC')
      .addOrderBy('comments.createdAt', 'DESC')
      .getOne();

    if (!article) {
      throw new NotFoundException(`Article with slug ${slug} not found`);
    }

    // Limit comments to 50 after fetching
    if (article.comments && article.comments.length > 50) {
      article.comments = article.comments.slice(0, 50);
    }

    return article;
  }

  async update(id: string, updateData: Partial<Article>): Promise<Article> {
    const article = await this.findOne(id);
    Object.assign(article, updateData);
    return this.articlesRepository.save(article);
  }

  async remove(id: string): Promise<void> {
    const article = await this.findOne(id);
    await this.articlesRepository.remove(article);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.articlesRepository.increment({ id }, 'viewCount', 1);
  }

  async incrementLikeCount(id: string): Promise<void> {
    await this.articlesRepository.increment({ id }, 'likeCount', 1);
  }
}
