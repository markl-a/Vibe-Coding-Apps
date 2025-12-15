import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ description: '標籤名稱', example: 'TypeScript' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'URL slug', example: 'typescript' })
  @IsString()
  slug: string;
}
