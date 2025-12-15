import { IsString, IsOptional, IsEnum, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ArticleStatus } from '../article.entity';

export class CreateArticleDto {
  @ApiProperty({ description: '文章標題', example: '我的第一篇文章' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'URL slug', example: 'my-first-article' })
  @IsString()
  slug: string;

  @ApiProperty({ description: '文章內容', example: '這是文章的詳細內容...' })
  @IsString()
  content: string;

  @ApiProperty({ description: '文章摘要', required: false })
  @IsString()
  @IsOptional()
  excerpt?: string;

  @ApiProperty({ description: '封面圖片URL', required: false })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiProperty({
    description: '文章狀態',
    enum: ArticleStatus,
    default: ArticleStatus.DRAFT,
    required: false
  })
  @IsEnum(ArticleStatus)
  @IsOptional()
  status?: ArticleStatus;

  @ApiProperty({ description: '作者ID', example: 'uuid-string' })
  @IsUUID()
  authorId: string;

  @ApiProperty({ description: '分類ID列表', example: ['uuid1', 'uuid2'], required: false })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  categoryIds?: string[];

  @ApiProperty({ description: '標籤ID列表', example: ['uuid1', 'uuid2'], required: false })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  tagIds?: string[];
}
