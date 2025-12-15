import { IsString, IsOptional, IsEnum, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ArticleStatus } from '../article.entity';

export class UpdateArticleDto {
  @ApiProperty({ description: '文章標題', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'URL slug', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ description: '文章內容', required: false })
  @IsString()
  @IsOptional()
  content?: string;

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
    required: false
  })
  @IsEnum(ArticleStatus)
  @IsOptional()
  status?: ArticleStatus;

  @ApiProperty({ description: '分類ID列表', required: false })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  categoryIds?: string[];

  @ApiProperty({ description: '標籤ID列表', required: false })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  tagIds?: string[];
}
