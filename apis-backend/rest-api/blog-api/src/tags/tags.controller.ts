import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TagsService } from './tags.service';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: '創建標籤' })
  @ApiBearerAuth()
  create(@Body() createData: any) {
    return this.tagsService.create(createData);
  }

  @Get()
  @ApiOperation({ summary: '獲取所有標籤' })
  findAll() {
    return this.tagsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '獲取單一標籤' })
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新標籤' })
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.tagsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: '刪除標籤' })
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }
}
