import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiProperty({ description: '分類名稱', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'URL slug', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ description: '分類描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
