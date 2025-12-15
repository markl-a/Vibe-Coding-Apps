import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './category.entity';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: '創建分類' })
  @ApiBearerAuth()
  create(@Body() createData: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(createData);
  }

  @Get()
  @ApiOperation({ summary: '獲取所有分類' })
  findAll(): Promise<Category[]> {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '獲取單一分類' })
  findOne(@Param('id') id: string): Promise<Category> {
    return this.categoriesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新分類' })
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateData: UpdateCategoryDto): Promise<Category> {
    return this.categoriesService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: '刪除分類' })
  @ApiBearerAuth()
  remove(@Param('id') id: string): Promise<void> {
    return this.categoriesService.remove(id);
  }
}
