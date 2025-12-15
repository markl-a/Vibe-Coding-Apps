import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './article.entity';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @ApiOperation({ summary: '創建文章' })
  @ApiBearerAuth()
  create(@Body() createData: CreateArticleDto): Promise<Article> {
    return this.articlesService.create(createData);
  }

  @Get()
  @ApiOperation({ summary: '獲取所有文章' })
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ): Promise<{ data: Article[]; total: number; page: number; limit: number }> {
    return this.articlesService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '獲取單一文章' })
  async findOne(@Param('id') id: string): Promise<Article> {
    const article = await this.articlesService.findOne(id);
    await this.articlesService.incrementViewCount(id);
    return article;
  }

  @Put(':id')
  @ApiOperation({ summary: '更新文章' })
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateData: UpdateArticleDto): Promise<Article> {
    return this.articlesService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: '刪除文章' })
  @ApiBearerAuth()
  remove(@Param('id') id: string): Promise<void> {
    return this.articlesService.remove(id);
  }

  @Post(':id/like')
  @ApiOperation({ summary: '點讚文章' })
  async like(@Param('id') id: string): Promise<{ message: string }> {
    await this.articlesService.incrementLikeCount(id);
    return { message: 'Article liked successfully' };
  }
}
