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
  private behaviors = [
    { id: 1, type: 'positive', name: 'Good General Behavior', nameAr: 'سلوك عام جيد' },
    { id: 2, type: 'positive', name: 'Good Progress', nameAr: 'تقدم جيد' },
    { id: 3, type: 'positive', name: 'Helpful', nameAr: 'متعاون' },
    { id: 4, type: 'positive', name: 'Homework done on time', nameAr: 'إنجاز الواجب في الوقت المحدد' },
    { id: 5, type: 'positive', name: 'Participating', nameAr: 'مشارك' },
    { id: 6, type: 'negative', name: 'Generally Bad Behavior', nameAr: 'سلوك عام سيء' },
    { id: 7, type: 'negative', name: 'Uses Mobile Phones Excessively', nameAr: 'استخدام الهاتف بشكل مفرط' },
    { id: 8, type: 'negative', name: 'Fighting', nameAr: 'شجار' },
    { id: 9, type: 'negative', name: 'Homework Issues', nameAr: 'مشاكل في الواجب' },
    { id: 10, type: 'negative', name: 'Chatting', nameAr: 'ثرثرة' }
  ];

  constructor(
    @InjectRepository(BehaviorEvent)
    private behaviorEventRepository: Repository<BehaviorEvent>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
  ) {}

  async create(ownerId: number, createBehaviorEventDto: CreateBehaviorEventDto): Promise<BehaviorEventResponseDto> {
    // Validate student exists and belongs to owner
    const student = await this.studentRepository.findOne({
      where: { id: createBehaviorEventDto.studentId, ownerId },
    });
    if (!student) {
      throw new BadRequestException(`Student with ID ${createBehaviorEventDto.studentId} not found`);
    }

    // Validate class exists if classId is provided
    if (createBehaviorEventDto.classId !== undefined && createBehaviorEventDto.classId !== null) {
      const classEntity = await this.classRepository.findOne({
        where: { id: createBehaviorEventDto.classId, ownerId },
      });
      if (!classEntity) {
        throw new BadRequestException(`Class with ID ${createBehaviorEventDto.classId} not found`);
      }
    }

    // Convert date string to Date
    const behaviorEventData: Partial<BehaviorEvent> = {
      ...createBehaviorEventDto,
      ownerId,
      date: new Date(createBehaviorEventDto.date),
    };

    const behaviorEvent = this.behaviorEventRepository.create(behaviorEventData);
    const savedBehaviorEvent = await this.behaviorEventRepository.save(behaviorEvent);
    return this.findOne(ownerId, savedBehaviorEvent.id);
  }

  async findAll(ownerId: number, query?: { studentId?: number; classId?: number }): Promise<BehaviorEventResponseDto[]> {
    const where: any = { ownerId };
    
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

  async findOne(ownerId: number, id: number): Promise<BehaviorEventResponseDto> {
    const behaviorEvent = await this.behaviorEventRepository.findOne({
      where: { id, ownerId },
      relations: ['student', 'class'],
    });

    if (!behaviorEvent) {
      throw new NotFoundException(`Behavior event with ID ${id} not found`);
    }

    return this.mapToResponseDto(behaviorEvent);
  }

  async update(ownerId: number, id: number, updateBehaviorEventDto: UpdateBehaviorEventDto): Promise<BehaviorEventResponseDto> {
    const behaviorEvent = await this.behaviorEventRepository.findOne({ where: { id, ownerId } });

    if (!behaviorEvent) {
      throw new NotFoundException(`Behavior event with ID ${id} not found`);
    }

    // Validate student exists if studentId is being updated
    if (updateBehaviorEventDto.studentId !== undefined && updateBehaviorEventDto.studentId !== null) {
      const student = await this.studentRepository.findOne({
        where: { id: updateBehaviorEventDto.studentId, ownerId },
      });
      if (!student) {
        throw new BadRequestException(`Student with ID ${updateBehaviorEventDto.studentId} not found`);
      }
    }

    // Validate class exists if classId is being updated
    if (updateBehaviorEventDto.classId !== undefined && updateBehaviorEventDto.classId !== null) {
      const classEntity = await this.classRepository.findOne({
        where: { id: updateBehaviorEventDto.classId, ownerId },
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

    // Add new fields support for update
    if ('type' in updateBehaviorEventDto) {
      fieldsToUpdate.type = (updateBehaviorEventDto as any).type;
    }
    if ('reason' in updateBehaviorEventDto) {
      fieldsToUpdate.reason = (updateBehaviorEventDto as any).reason;
    }
    if ('recommendations' in updateBehaviorEventDto) {
      fieldsToUpdate.recommendations = (updateBehaviorEventDto as any).recommendations;
    }

    Object.assign(behaviorEvent, fieldsToUpdate);
    await this.behaviorEventRepository.save(behaviorEvent);
    return this.findOne(ownerId, id);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    const behaviorEvent = await this.behaviorEventRepository.findOne({ where: { id, ownerId } });

    if (!behaviorEvent) {
      throw new NotFoundException(`Behavior event with ID ${id} not found`);
    }

    await this.behaviorEventRepository.remove(behaviorEvent);
  }

  private mapToResponseDto(behaviorEvent: BehaviorEvent): BehaviorEventResponseDto {
    const behavior = this.behaviors.find(b => b.id === behaviorEvent.behaviorId);
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
      behaviorType: behavior?.type,
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


