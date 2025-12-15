import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
  ) {}

  async create(commentData: Partial<Comment>): Promise<Comment> {
    const comment = this.commentsRepository.create(commentData);
    return this.commentsRepository.save(comment);
  }

  async findByArticle(
    articleId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: Comment[]; total: number }> {
    // Ensure limit doesn't exceed maximum
    const maxLimit = 100;
    const safeLimit = Math.min(limit, maxLimit);
    const offset = (page - 1) * safeLimit;

    const [data, total] = await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.articleId = :articleId', { articleId })
      .andWhere('comment.isApproved = :isApproved', { isApproved: true })
      .orderBy('comment.createdAt', 'DESC')
      .skip(offset)
      .take(safeLimit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.article', 'article')
      .where('comment.id = :id', { id })
      .getOne();

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    return comment;
  }

  async approve(id: string): Promise<Comment> {
    const comment = await this.findOne(id);
    comment.isApproved = true;
    return this.commentsRepository.save(comment);
  }

  async remove(id: string): Promise<void> {
    const comment = await this.findOne(id);
    await this.commentsRepository.remove(comment);
  }
}
