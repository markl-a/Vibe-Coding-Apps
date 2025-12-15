import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTagDto {
  @ApiProperty({ description: '標籤名稱', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'URL slug', required: false })
  @IsString()
  @IsOptional()
  slug?: string;
}
