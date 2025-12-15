import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: '用戶名', example: 'john_doe' })
  @IsString()
  username: string;

  @ApiProperty({ description: '密碼', example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}
