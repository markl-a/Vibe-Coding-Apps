import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Tag } from './tag.entity';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: '創建標籤' })
  @ApiBearerAuth()
  create(@Body() createData: CreateTagDto): Promise<Tag> {
    return this.tagsService.create(createData);
  }

  @Get()
  @ApiOperation({ summary: '獲取所有標籤' })
  findAll(): Promise<Tag[]> {
    return this.tagsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '獲取單一標籤' })
  findOne(@Param('id') id: string): Promise<Tag> {
    return this.tagsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新標籤' })
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateData: UpdateTagDto): Promise<Tag> {
    return this.tagsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: '刪除標籤' })
  @ApiBearerAuth()
  remove(@Param('id') id: string): Promise<void> {
    return this.tagsService.remove(id);
  }
}
