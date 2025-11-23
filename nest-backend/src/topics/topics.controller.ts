import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicResponseDto } from './dto/topic-response.dto';
import { CreateTopicElementDto } from './dto/create-topic-element.dto';
import { UpdateTopicElementDto } from './dto/update-topic-element.dto';
import { TopicElementResponseDto } from './dto/topic-element-response.dto';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTopicDto: CreateTopicDto): Promise<TopicResponseDto> {
    return this.topicsService.create(createTopicDto);
  }

  @Get()
  async findAll(): Promise<TopicResponseDto[]> {
    return this.topicsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<TopicResponseDto> {
    return this.topicsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTopicDto: UpdateTopicDto,
  ): Promise<TopicResponseDto> {
    return this.topicsService.update(id, updateTopicDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.topicsService.remove(id);
  }

  // Topic Elements endpoints
  @Get(':id/elements')
  async findElementsByTopic(@Param('id', ParseIntPipe) id: number): Promise<TopicElementResponseDto[]> {
    return this.topicsService.findElementsByTopic(id);
  }

  @Post(':id/elements')
  @HttpCode(HttpStatus.CREATED)
  async createElement(
    @Param('id', ParseIntPipe) topicId: number,
    @Body() createElementDto: CreateTopicElementDto,
  ): Promise<TopicElementResponseDto> {
    return this.topicsService.createElement(topicId, createElementDto);
  }

  @Patch(':id/elements/:elementId')
  async updateElement(
    @Param('id', ParseIntPipe) topicId: number,
    @Param('elementId', ParseIntPipe) elementId: number,
    @Body() updateElementDto: UpdateTopicElementDto,
  ): Promise<TopicElementResponseDto> {
    return this.topicsService.updateElement(topicId, elementId, updateElementDto);
  }

  @Delete(':id/elements/:elementId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeElement(
    @Param('id', ParseIntPipe) topicId: number,
    @Param('elementId', ParseIntPipe) elementId: number,
  ): Promise<void> {
    return this.topicsService.removeElement(topicId, elementId);
  }
}

