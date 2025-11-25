import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BehaviorEvent } from './behavior-event.entity';
import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';
import { CreateBehaviorEventDto } from './dto/create-behavior-event.dto';
import { UpdateBehaviorEventDto } from './dto/update-behavior-event.dto';
import { BehaviorEventResponseDto } from './dto/behavior-event-response.dto';

@Injectable()
export class BehaviorEventsService {
  constructor(
    @InjectRepository(BehaviorEvent)
    private behaviorEventRepository: Repository<BehaviorEvent>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
  ) {}

  async create(createBehaviorEventDto: CreateBehaviorEventDto): Promise<BehaviorEventResponseDto> {
    // Validate student exists
    const student = await this.studentRepository.findOne({
      where: { id: createBehaviorEventDto.studentId },
    });
    if (!student) {
      throw new BadRequestException(`Student with ID ${createBehaviorEventDto.studentId} not found`);
    }

    // Validate class exists if classId is provided
    if (createBehaviorEventDto.classId !== undefined && createBehaviorEventDto.classId !== null) {
      const classEntity = await this.classRepository.findOne({
        where: { id: createBehaviorEventDto.classId },
      });
      if (!classEntity) {
        throw new BadRequestException(`Class with ID ${createBehaviorEventDto.classId} not found`);
      }
    }

    // Convert date string to Date
    const behaviorEventData: Partial<BehaviorEvent> = {
      ...createBehaviorEventDto,
      date: new Date(createBehaviorEventDto.date),
    };

    const behaviorEvent = this.behaviorEventRepository.create(behaviorEventData);
    const savedBehaviorEvent = await this.behaviorEventRepository.save(behaviorEvent);
    return this.findOne(savedBehaviorEvent.id);
  }

  async findAll(query?: { studentId?: number; classId?: number }): Promise<BehaviorEventResponseDto[]> {
    const where: any = {};
    
    if (query?.studentId) {
      where.studentId = query.studentId;
    }
    
    if (query?.classId) {
      where.classId = query.classId;
    }

    const behaviorEvents = await this.behaviorEventRepository.find({
      where,
      relations: ['student', 'class'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });

    return behaviorEvents.map((event) => this.mapToResponseDto(event));
  }

  async findOne(id: number): Promise<BehaviorEventResponseDto> {
    const behaviorEvent = await this.behaviorEventRepository.findOne({
      where: { id },
      relations: ['student', 'class'],
    });

    if (!behaviorEvent) {
      throw new NotFoundException(`Behavior event with ID ${id} not found`);
    }

    return this.mapToResponseDto(behaviorEvent);
  }

  async update(id: number, updateBehaviorEventDto: UpdateBehaviorEventDto): Promise<BehaviorEventResponseDto> {
    const behaviorEvent = await this.behaviorEventRepository.findOne({ where: { id } });

    if (!behaviorEvent) {
      throw new NotFoundException(`Behavior event with ID ${id} not found`);
    }

    // Validate student exists if studentId is being updated
    if (updateBehaviorEventDto.studentId !== undefined && updateBehaviorEventDto.studentId !== null) {
      const student = await this.studentRepository.findOne({
        where: { id: updateBehaviorEventDto.studentId },
      });
      if (!student) {
        throw new BadRequestException(`Student with ID ${updateBehaviorEventDto.studentId} not found`);
      }
    }

    // Validate class exists if classId is being updated
    if (updateBehaviorEventDto.classId !== undefined && updateBehaviorEventDto.classId !== null) {
      const classEntity = await this.classRepository.findOne({
        where: { id: updateBehaviorEventDto.classId },
      });
      if (!classEntity) {
        throw new BadRequestException(`Class with ID ${updateBehaviorEventDto.classId} not found`);
      }
    }

    // Only update fields that are explicitly provided
    const fieldsToUpdate: Partial<BehaviorEvent> = {};
    
    if (updateBehaviorEventDto.studentId !== undefined) {
      fieldsToUpdate.studentId = updateBehaviorEventDto.studentId;
    }
    if (updateBehaviorEventDto.behaviorId !== undefined) {
      fieldsToUpdate.behaviorId = updateBehaviorEventDto.behaviorId;
    }
    if (updateBehaviorEventDto.date !== undefined) {
      fieldsToUpdate.date = new Date(updateBehaviorEventDto.date);
    }
    if (updateBehaviorEventDto.description !== undefined) {
      fieldsToUpdate.description = updateBehaviorEventDto.description && updateBehaviorEventDto.description.trim() !== '' 
        ? updateBehaviorEventDto.description.trim() 
        : null;
    }
    if (updateBehaviorEventDto.classId !== undefined) {
      fieldsToUpdate.classId = updateBehaviorEventDto.classId || null;
    }

    Object.assign(behaviorEvent, fieldsToUpdate);
    await this.behaviorEventRepository.save(behaviorEvent);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const behaviorEvent = await this.behaviorEventRepository.findOne({ where: { id } });

    if (!behaviorEvent) {
      throw new NotFoundException(`Behavior event with ID ${id} not found`);
    }

    await this.behaviorEventRepository.remove(behaviorEvent);
  }

  private mapToResponseDto(behaviorEvent: BehaviorEvent): BehaviorEventResponseDto {
    return {
      id: behaviorEvent.id,
      studentId: behaviorEvent.studentId,
      student: behaviorEvent.student
        ? {
            id: behaviorEvent.student.id,
            firstName: behaviorEvent.student.firstName,
            lastName: behaviorEvent.student.lastName,
            photo: behaviorEvent.student.photo,
          }
        : undefined,
      behaviorId: behaviorEvent.behaviorId,
      date: behaviorEvent.date instanceof Date 
        ? behaviorEvent.date.toISOString().split('T')[0] 
        : behaviorEvent.date,
      description: behaviorEvent.description,
      classId: behaviorEvent.classId,
      class: behaviorEvent.class
        ? {
            id: behaviorEvent.class.id,
            name: behaviorEvent.class.name,
          }
        : undefined,
      createdAt: behaviorEvent.createdAt,
      updatedAt: behaviorEvent.updatedAt,
    };
  }
}


