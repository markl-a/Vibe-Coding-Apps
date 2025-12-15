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
    const article = await this.articlesRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.categories', 'categories')
      .leftJoinAndSelect('article.tags', 'tags')
      .leftJoinAndSelect('article.comments', 'comments', 'comments.isApproved = :isApproved', { isApproved: true })
      .leftJoinAndSelect('comments.user', 'commentUser')
      .where('article.id = :id', { id })
      .orderBy('comments.createdAt', 'DESC')
      .limit(50) // Limit comments to 50
      .getOne();

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }
    return article;
  }

  async findBySlug(slug: string): Promise<Article> {
    const article = await this.articlesRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.categories', 'categories')
      .leftJoinAndSelect('article.tags', 'tags')
      .leftJoinAndSelect('article.comments', 'comments', 'comments.isApproved = :isApproved', { isApproved: true })
      .leftJoinAndSelect('comments.user', 'commentUser')
      .where('article.slug = :slug', { slug })
      .orderBy('comments.createdAt', 'DESC')
      .limit(50) // Limit comments to 50
      .getOne();

    if (!article) {
      throw new NotFoundException(`Article with slug ${slug} not found`);
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
