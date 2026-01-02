import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyJournalEntry } from './daily-journal-entry.entity';
import { Class } from '../classes/class.entity';
import { Topic } from '../topics/topic.entity';
import { CreateDailyJournalEntryDto } from './dto/create-daily-journal-entry.dto';
import { UpdateDailyJournalEntryDto } from './dto/update-daily-journal-entry.dto';
import { DailyJournalEntryResponseDto } from './dto/daily-journal-entry-response.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class DailyJournalService {
  constructor(
    @InjectRepository(DailyJournalEntry)
    private journalEntryRepository: Repository<DailyJournalEntry>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
  ) {}

  async create(ownerId: number, createDto: CreateDailyJournalEntryDto): Promise<DailyJournalEntryResponseDto> {
    // Validate class exists and belongs to owner
    const classEntity = await this.classRepository.findOne({
      where: { id: createDto.classId, ownerId },
    });
    if (!classEntity) {
      throw new BadRequestException(`Class with ID ${createDto.classId} not found`);
    }

    // Validate topic exists if topicId is provided
    if (createDto.topicId !== undefined && createDto.topicId !== null) {
      const topic = await this.topicRepository.findOne({
        where: { id: createDto.topicId, ownerId },
      });
      if (!topic) {
        throw new BadRequestException(`Topic with ID ${createDto.topicId} not found`);
      }
    }

    // Validate time range
    const startMinutes = this.timeToMinutes(createDto.startTime);
    const endMinutes = this.timeToMinutes(createDto.endTime);
    if (startMinutes >= endMinutes) {
      throw new BadRequestException('startTime must be before endTime');
    }

    const entry = this.journalEntryRepository.create({
      ...createDto,
      ownerId,
    });
    const savedEntry = await this.journalEntryRepository.save(entry);
    return this.findOne(ownerId, savedEntry.id);
  }

  async findAll(ownerId: number, userRole?: UserRole): Promise<DailyJournalEntryResponseDto[]> {
    // Admins can see all entries, teachers only see their own
    const whereCondition = userRole === UserRole.ADMIN ? {} : { ownerId };
    
    const entries = await this.journalEntryRepository.find({
      where: whereCondition,
      relations: ['class', 'topic'],
      order: { date: 'DESC', startTime: 'ASC' },
    });

    return entries.map((entry) => this.mapToResponseDto(entry));
  }

  async findOne(ownerId: number, id: number): Promise<DailyJournalEntryResponseDto> {
    const entry = await this.journalEntryRepository.findOne({
      where: { id, ownerId },
      relations: ['class', 'topic'],
    });

    if (!entry) {
      throw new NotFoundException(`Daily journal entry with ID ${id} not found`);
    }

    return this.mapToResponseDto(entry);
  }

  async update(
    ownerId: number,
    id: number,
    updateDto: UpdateDailyJournalEntryDto,
  ): Promise<DailyJournalEntryResponseDto> {
    const entry = await this.journalEntryRepository.findOne({ where: { id, ownerId } });

    if (!entry) {
      throw new NotFoundException(`Daily journal entry with ID ${id} not found`);
    }

    // Validate class exists if classId is being updated
    if (updateDto.classId !== undefined && updateDto.classId !== null) {
      const classEntity = await this.classRepository.findOne({
        where: { id: updateDto.classId, ownerId },
      });
      if (!classEntity) {
        throw new BadRequestException(`Class with ID ${updateDto.classId} not found`);
      }
    }

    // Validate topic exists if topicId is being updated
    if (updateDto.topicId !== undefined && updateDto.topicId !== null) {
      const topic = await this.topicRepository.findOne({
        where: { id: updateDto.topicId, ownerId },
      });
      if (!topic) {
        throw new BadRequestException(`Topic with ID ${updateDto.topicId} not found`);
      }
    }

    // Validate time range if times are being updated
    if (updateDto.startTime && updateDto.endTime) {
      const startMinutes = this.timeToMinutes(updateDto.startTime);
      const endMinutes = this.timeToMinutes(updateDto.endTime);
      if (startMinutes >= endMinutes) {
        throw new BadRequestException('startTime must be before endTime');
      }
    }

    Object.assign(entry, updateDto);
    await this.journalEntryRepository.save(entry);
    return this.findOne(ownerId, id);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    const entry = await this.journalEntryRepository.findOne({ where: { id, ownerId } });

    if (!entry) {
      throw new NotFoundException(`Daily journal entry with ID ${id} not found`);
    }

    await this.journalEntryRepository.remove(entry);
  }

  private mapToResponseDto(entry: DailyJournalEntry): DailyJournalEntryResponseDto {
    return {
      id: entry.id,
      date: entry.date,
      startTime: entry.startTime,
      endTime: entry.endTime,
      classId: entry.classId,
      class: entry.class
        ? {
            id: entry.class.id,
            name: entry.class.name,
            level: entry.class.level,
            subject: entry.class.subject,
          }
        : undefined,
      level: entry.level,
      section: entry.section,
      topicId: entry.topicId,
      topic: entry.topic
        ? {
            id: entry.topic.id,
            title: entry.topic.title,
            subtitle: entry.topic.subtitle,
            description: entry.topic.description,
          }
        : undefined,
      subtitle: entry.subtitle,
      activity: entry.activity,
      homework: entry.homework,
      notes: entry.notes,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  private timeToMinutes(time: string): number {
    const parts = time.split(':');
    const hours = parseInt(parts[0] || '0', 10);
    const minutes = parseInt(parts[1] || '0', 10);
    return hours * 60 + minutes;
  }
}

