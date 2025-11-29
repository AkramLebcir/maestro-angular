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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ModuleAccess } from '../auth/decorators/module-access.decorator';

@Controller('topics')
@ModuleAccess('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createTopicDto: CreateTopicDto,
  ): Promise<TopicResponseDto> {
    return this.topicsService.create(user.id, createTopicDto);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser): Promise<TopicResponseDto[]> {
    return this.topicsService.findAll(user.id);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TopicResponseDto> {
    return this.topicsService.findOne(user.id, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTopicDto: UpdateTopicDto,
  ): Promise<TopicResponseDto> {
    return this.topicsService.update(user.id, id, updateTopicDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.topicsService.remove(user.id, id);
  }

  // Topic Elements endpoints
  @Get(':id/elements')
  async findElementsByTopic(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TopicElementResponseDto[]> {
    return this.topicsService.findElementsByTopic(user.id, id);
  }

  @Post(':id/elements')
  @HttpCode(HttpStatus.CREATED)
  async createElement(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) topicId: number,
    @Body() createElementDto: CreateTopicElementDto,
  ): Promise<TopicElementResponseDto> {
    return this.topicsService.createElement(user.id, topicId, createElementDto);
  }

  @Patch(':id/elements/:elementId')
  async updateElement(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) topicId: number,
    @Param('elementId', ParseIntPipe) elementId: number,
    @Body() updateElementDto: UpdateTopicElementDto,
  ): Promise<TopicElementResponseDto> {
    return this.topicsService.updateElement(user.id, topicId, elementId, updateElementDto);
  }

  @Delete(':id/elements/:elementId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeElement(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) topicId: number,
    @Param('elementId', ParseIntPipe) elementId: number,
  ): Promise<void> {
    return this.topicsService.removeElement(user.id, topicId, elementId);
  }
}


