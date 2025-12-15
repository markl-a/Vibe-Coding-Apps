import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: '分類名稱', example: '技術' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'URL slug', example: 'technology' })
  @IsString()
  slug: string;

  @ApiProperty({ description: '分類描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
