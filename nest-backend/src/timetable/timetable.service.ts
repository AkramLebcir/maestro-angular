import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Timetable } from './timetable.entity';
import { Class } from '../classes/class.entity';
import { Lab } from '../labs/lab.entity';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { UpdateTimetableDto } from './dto/update-timetable.dto';
import { TimetableResponseDto } from './dto/timetable-response.dto';

@Injectable()
export class TimetableService {
  constructor(
    @InjectRepository(Timetable)
    private timetableRepository: Repository<Timetable>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    @InjectRepository(Lab)
    private labRepository: Repository<Lab>,
  ) {}

  async create(ownerId: number, createTimetableDto: CreateTimetableDto): Promise<TimetableResponseDto> {
    // Validate class exists and belongs to owner
    const classEntity = await this.classRepository.findOne({
      where: { id: createTimetableDto.classId, ownerId },
    });
    if (!classEntity) {
      throw new BadRequestException(`Class with ID ${createTimetableDto.classId} not found`);
    }

    // Validate lab exists if labId is provided
    if (createTimetableDto.labId !== undefined && createTimetableDto.labId !== null) {
      const lab = await this.labRepository.findOne({
        where: { id: createTimetableDto.labId, ownerId },
      });
      if (!lab) {
        throw new BadRequestException(`Lab with ID ${createTimetableDto.labId} not found`);
      }
    }

    // Validate time range
    const startMinutes = this.timeToMinutes(createTimetableDto.startTime);
    const endMinutes = this.timeToMinutes(createTimetableDto.endTime);
    if (startMinutes >= endMinutes) {
      throw new BadRequestException('startTime must be before endTime');
    }

    // Validate: only one class per hour slot
    const startHour = this.extractHour(createTimetableDto.startTime);
    const existingEntries = await this.timetableRepository.find({
      where: {
        ownerId,
        dayOfWeek: createTimetableDto.dayOfWeek,
      },
    });

    for (const entry of existingEntries) {
      const entryStartHour = this.extractHour(entry.startTime);
      if (entryStartHour === startHour) {
        throw new BadRequestException(
          `Cannot add more than one class per hour. There is already a class scheduled at ${entry.startTime} on this day.`
        );
      }
    }

    const timetable = this.timetableRepository.create({
      ...createTimetableDto,
      ownerId,
    });
    const savedTimetable = await this.timetableRepository.save(timetable);
    return this.findOne(ownerId, savedTimetable.id);
  }

  async findAll(ownerId: number): Promise<TimetableResponseDto[]> {
    const timetables = await this.timetableRepository.find({
      where: { ownerId },
      relations: ['class', 'lab'],
      order: {
        dayOfWeek: 'ASC',
        startTime: 'ASC',
      },
    });

    return timetables.map((timetable) => this.mapToResponseDto(timetable));
  }

  async findOne(ownerId: number, id: number): Promise<TimetableResponseDto> {
    const timetable = await this.timetableRepository.findOne({
      where: { id, ownerId },
      relations: ['class', 'lab'],
    });

    if (!timetable) {
      throw new NotFoundException(`Timetable entry with ID ${id} not found`);
    }

    return this.mapToResponseDto(timetable);
  }

  async update(ownerId: number, id: number, updateTimetableDto: UpdateTimetableDto): Promise<TimetableResponseDto> {
    const timetable = await this.timetableRepository.findOne({ where: { id, ownerId } });

    if (!timetable) {
      throw new NotFoundException(`Timetable entry with ID ${id} not found`);
    }

    // Validate class exists if classId is being updated
    if (updateTimetableDto.classId !== undefined && updateTimetableDto.classId !== null) {
      const classEntity = await this.classRepository.findOne({
        where: { id: updateTimetableDto.classId, ownerId },
      });
      if (!classEntity) {
        throw new BadRequestException(`Class with ID ${updateTimetableDto.classId} not found`);
      }
    }

    // Validate lab exists if labId is being updated
    if (updateTimetableDto.labId !== undefined && updateTimetableDto.labId !== null) {
      const lab = await this.labRepository.findOne({
        where: { id: updateTimetableDto.labId, ownerId },
      });
      if (!lab) {
        throw new BadRequestException(`Lab with ID ${updateTimetableDto.labId} not found`);
      }
    }

    // Validate time range if times are being updated
    if (updateTimetableDto.startTime && updateTimetableDto.endTime) {
      const startMinutes = this.timeToMinutes(updateTimetableDto.startTime);
      const endMinutes = this.timeToMinutes(updateTimetableDto.endTime);
      if (startMinutes >= endMinutes) {
        throw new BadRequestException('startTime must be before endTime');
      }
    } else if (updateTimetableDto.startTime && timetable.endTime) {
      const startMinutes = this.timeToMinutes(updateTimetableDto.startTime);
      const endMinutes = this.timeToMinutes(timetable.endTime);
      if (startMinutes >= endMinutes) {
        throw new BadRequestException('startTime must be before endTime');
      }
    } else if (updateTimetableDto.endTime && timetable.startTime) {
      const startMinutes = this.timeToMinutes(timetable.startTime);
      const endMinutes = this.timeToMinutes(updateTimetableDto.endTime);
      if (startMinutes >= endMinutes) {
        throw new BadRequestException('startTime must be before endTime');
      }
    }

    // Validate: only one class per hour slot (when updating day or time)
    const dayOfWeek = updateTimetableDto.dayOfWeek !== undefined ? updateTimetableDto.dayOfWeek : timetable.dayOfWeek;
    const startTime = updateTimetableDto.startTime !== undefined ? updateTimetableDto.startTime : timetable.startTime;

    if (updateTimetableDto.dayOfWeek !== undefined || updateTimetableDto.startTime !== undefined) {
      const startHour = this.extractHour(startTime);
      const existingEntries = await this.timetableRepository.find({
        where: {
          ownerId,
          dayOfWeek: dayOfWeek,
        },
      });

      for (const entry of existingEntries) {
        // Skip the current entry being updated
        if (entry.id === id) {
          continue;
        }
        const entryStartHour = this.extractHour(entry.startTime);
        if (entryStartHour === startHour) {
          throw new BadRequestException(
            `Cannot add more than one class per hour. There is already a class scheduled at ${entry.startTime} on this day.`
          );
        }
      }
    }

    Object.assign(timetable, updateTimetableDto);
    await this.timetableRepository.save(timetable);
    return this.findOne(ownerId, id);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    const timetable = await this.timetableRepository.findOne({ where: { id, ownerId } });

    if (!timetable) {
      throw new NotFoundException(`Timetable entry with ID ${id} not found`);
    }

    await this.timetableRepository.remove(timetable);
  }

  private extractHour(timeString: string): number {
    // Extract hour from time string (format: "HH:mm")
    const [hour] = timeString.split(':');
    return parseInt(hour, 10);
  }

  private timeToMinutes(timeString: string): number {
    // Convert time string (format: "HH:mm" or "HH:mm:ss") to total minutes
    if (!timeString || typeof timeString !== 'string') {
      return 0;
    }
    // Handle both "HH:mm" and "HH:mm:ss" formats
    const parts = timeString.split(':');
    const hours = parseInt(parts[0] || '0', 10);
    const minutes = parseInt(parts[1] || '0', 10);
    return hours * 60 + minutes;
  }

  private mapToResponseDto(timetable: Timetable): TimetableResponseDto {
    return {
      id: timetable.id,
      dayOfWeek: timetable.dayOfWeek,
      startTime: timetable.startTime,
      endTime: timetable.endTime,
      subject: timetable.subject,
      classId: timetable.classId,
      class: timetable.class
        ? {
            id: timetable.class.id,
            name: timetable.class.name,
          }
        : undefined,
      labId: timetable.labId,
      lab: timetable.lab
        ? {
            id: timetable.lab.id,
            name: timetable.lab.name,
          }
        : undefined,
      classroom: timetable.classroom,
      notes: timetable.notes,
      createdAt: timetable.createdAt,
      updatedAt: timetable.updatedAt,
    };
  }
}

