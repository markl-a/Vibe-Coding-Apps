import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
  ) {}

  async create(tagData: Partial<Tag>): Promise<Tag> {
    const tag = this.tagsRepository.create(tagData);
    return this.tagsRepository.save(tag);
  }

  async findAll(page = 1, limit = 50): Promise<{ data: Tag[]; total: number }> {
    // Ensure limit doesn't exceed maximum
    const maxLimit = 100;
    const safeLimit = Math.min(limit, maxLimit);
    const offset = (page - 1) * safeLimit;

    // Don't load articles in findAll - use separate query if needed
    const [data, total] = await this.tagsRepository
      .createQueryBuilder('tag')
      .loadRelationCountAndMap('tag.articleCount', 'tag.articles')
      .skip(offset)
      .take(safeLimit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string, includeArticles = false, limit = 20): Promise<Tag> {
    const queryBuilder = this.tagsRepository
      .createQueryBuilder('tag')
      .where('tag.id = :id', { id });

    if (includeArticles) {
      // Limit articles to prevent loading too many
      queryBuilder
        .leftJoinAndSelect('tag.articles', 'articles', 'articles.status = :status', { status: 'PUBLISHED' })
        .orderBy('articles.publishedAt', 'DESC')
        .take(limit);
    }

    const tag = await queryBuilder.getOne();

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return tag;
  }

  async update(id: string, updateData: Partial<Tag>): Promise<Tag> {
    const tag = await this.findOne(id);
    Object.assign(tag, updateData);
    return this.tagsRepository.save(tag);
  }

  async remove(id: string): Promise<void> {
    const tag = await this.findOne(id);
    await this.tagsRepository.remove(tag);
  }
}
