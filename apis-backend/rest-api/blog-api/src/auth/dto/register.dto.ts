import { IsString, IsEmail, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/user.entity';

export class RegisterDto {
  @ApiProperty({ description: '用戶名', example: 'john_doe' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ description: '電子郵件', example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '密碼', example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: '顯示名稱', example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiProperty({ description: '個人簡介', required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ description: '頭像URL', required: false })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({
    description: '用戶角色',
    enum: UserRole,
    default: UserRole.USER,
    required: false
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
