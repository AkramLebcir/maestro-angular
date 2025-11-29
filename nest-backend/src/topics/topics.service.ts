import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from './topic.entity';
import { TopicElement } from './topic-element.entity';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicResponseDto } from './dto/topic-response.dto';
import { CreateTopicElementDto } from './dto/create-topic-element.dto';
import { UpdateTopicElementDto } from './dto/update-topic-element.dto';
import { TopicElementResponseDto } from './dto/topic-element-response.dto';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(TopicElement)
    private topicElementRepository: Repository<TopicElement>,
  ) {}

  async create(ownerId: number, createTopicDto: CreateTopicDto): Promise<TopicResponseDto> {
    const topic = this.topicRepository.create({
      ...createTopicDto,
      ownerId,
    });
    const savedTopic = await this.topicRepository.save(topic);
    return this.mapToResponseDto(savedTopic);
  }

  async findAll(ownerId: number): Promise<TopicResponseDto[]> {
    const topics = await this.topicRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
    return topics.map((topic) => this.mapToResponseDto(topic));
  }

  async findOne(ownerId: number, id: number): Promise<TopicResponseDto> {
    const topic = await this.topicRepository.findOne({
      where: { id, ownerId },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    return this.mapToResponseDto(topic);
  }

  async update(ownerId: number, id: number, updateTopicDto: UpdateTopicDto): Promise<TopicResponseDto> {
    const topic = await this.topicRepository.findOne({ where: { id, ownerId } });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    Object.assign(topic, updateTopicDto);
    await this.topicRepository.save(topic);
    return this.mapToResponseDto(topic);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    const topic = await this.topicRepository.findOne({ where: { id, ownerId } });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    await this.topicRepository.remove(topic);
  }

  // Topic Elements methods
  async createElement(ownerId: number, topicId: number, createElementDto: CreateTopicElementDto): Promise<TopicElementResponseDto> {
    // Verify topic exists and belongs to owner
    const topic = await this.topicRepository.findOne({ where: { id: topicId, ownerId } });
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${topicId} not found`);
    }

    // If order is not provided, set it to the next available order
    let order = createElementDto.order;
    if (order === undefined) {
      const maxOrder = await this.topicElementRepository
        .createQueryBuilder('element')
        .where('element.topicId = :topicId AND element.ownerId = :ownerId', { topicId, ownerId })
        .select('MAX(element.order)', 'max')
        .getRawOne();
      order = (maxOrder?.max ?? -1) + 1;
    }

    const element = this.topicElementRepository.create({
      content: createElementDto.content,
      order: order,
      topicId: topicId, // Use topicId from URL parameter, not from DTO
      ownerId,
    });
    const savedElement = await this.topicElementRepository.save(element);
    return this.mapElementToResponseDto(savedElement);
  }

  async findElementsByTopic(ownerId: number, topicId: number): Promise<TopicElementResponseDto[]> {
    // Verify topic exists and belongs to owner
    const topic = await this.topicRepository.findOne({ where: { id: topicId, ownerId } });
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${topicId} not found`);
    }

    const elements = await this.topicElementRepository.find({
      where: { topicId, ownerId },
      order: { order: 'ASC' },
    });

    return elements.map((element) => this.mapElementToResponseDto(element));
  }

  async updateElement(
    ownerId: number,
    topicId: number,
    elementId: number,
    updateElementDto: UpdateTopicElementDto,
  ): Promise<TopicElementResponseDto> {
    const element = await this.topicElementRepository.findOne({
      where: { id: elementId, topicId, ownerId },
    });

    if (!element) {
      throw new NotFoundException(`Topic element with ID ${elementId} not found for topic ${topicId}`);
    }

    Object.assign(element, updateElementDto);
    await this.topicElementRepository.save(element);
    return this.mapElementToResponseDto(element);
  }

  async removeElement(ownerId: number, topicId: number, elementId: number): Promise<void> {
    const element = await this.topicElementRepository.findOne({
      where: { id: elementId, topicId, ownerId },
    });

    if (!element) {
      throw new NotFoundException(`Topic element with ID ${elementId} not found for topic ${topicId}`);
    }

    await this.topicElementRepository.remove(element);
  }

  private mapToResponseDto(topic: Topic): TopicResponseDto {
    return {
      id: topic.id,
      title: topic.title,
      subtitle: topic.subtitle,
      description: topic.description,
      level: topic.level,
      track: topic.track,
      elements: topic.elements?.map((element) => this.mapElementToResponseDto(element)),
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,
    };
  }

  private mapElementToResponseDto(element: TopicElement): TopicElementResponseDto {
    return {
      id: element.id,
      content: element.content,
      order: element.order,
      topicId: element.topicId,
      createdAt: element.createdAt,
      updatedAt: element.updatedAt,
    };
  }
}

