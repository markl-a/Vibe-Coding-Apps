import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(categoryData: Partial<Category>): Promise<Category> {
    const category = this.categoriesRepository.create(categoryData);
    return this.categoriesRepository.save(category);
  }

  async findAll(page = 1, limit = 50): Promise<{ data: Category[]; total: number }> {
    // Ensure limit doesn't exceed maximum
    const maxLimit = 100;
    const safeLimit = Math.min(limit, maxLimit);
    const offset = (page - 1) * safeLimit;

    // Don't load articles in findAll - use separate query if needed
    const [data, total] = await this.categoriesRepository
      .createQueryBuilder('category')
      .loadRelationCountAndMap('category.articleCount', 'category.articles')
      .skip(offset)
      .take(safeLimit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string, includeArticles = false, limit = 20): Promise<Category> {
    const queryBuilder = this.categoriesRepository
      .createQueryBuilder('category')
      .where('category.id = :id', { id });

    if (includeArticles) {
      // Limit articles to prevent loading too many
      queryBuilder
        .leftJoinAndSelect('category.articles', 'articles', 'articles.status = :status', { status: 'PUBLISHED' })
        .orderBy('articles.publishedAt', 'DESC')
        .take(limit);
    }

    const category = await queryBuilder.getOne();

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async findBySlug(slug: string, includeArticles = false, limit = 20): Promise<Category> {
    const queryBuilder = this.categoriesRepository
      .createQueryBuilder('category')
      .where('category.slug = :slug', { slug });

    if (includeArticles) {
      // Limit articles to prevent loading too many
      queryBuilder
        .leftJoinAndSelect('category.articles', 'articles', 'articles.status = :status', { status: 'PUBLISHED' })
        .orderBy('articles.publishedAt', 'DESC')
        .take(limit);
    }

    const category = await queryBuilder.getOne();

    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }
    return category;
  }

  async update(id: string, updateData: Partial<Category>): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, updateData);
    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
  }
}
