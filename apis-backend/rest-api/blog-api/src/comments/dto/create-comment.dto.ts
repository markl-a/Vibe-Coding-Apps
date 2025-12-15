import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: '評論內容', example: '這是一條評論' })
  @IsString()
  content: string;

  @ApiProperty({ description: '文章ID', example: 'uuid-string' })
  @IsUUID()
  articleId: string;

  @ApiProperty({ description: '用戶ID', example: 'uuid-string' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: '是否已審核', default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isApproved?: boolean;
}
