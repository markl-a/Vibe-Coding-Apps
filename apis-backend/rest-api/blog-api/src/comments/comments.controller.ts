import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './comment.entity';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: '創建評論' })
  @ApiBearerAuth()
  create(@Body() createData: CreateCommentDto): Promise<Comment> {
    return this.commentsService.create(createData);
  }

  @Get()
  @ApiOperation({ summary: '獲取文章評論' })
  findByArticle(@Query('articleId') articleId: string): Promise<Comment[]> {
    return this.commentsService.findByArticle(articleId);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '審核通過評論' })
  @ApiBearerAuth()
  approve(@Param('id') id: string): Promise<Comment> {
    return this.commentsService.approve(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '刪除評論' })
  @ApiBearerAuth()
  remove(@Param('id') id: string): Promise<void> {
    return this.commentsService.remove(id);
  }
}
