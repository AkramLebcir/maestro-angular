import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './class.entity';
import { Lab } from '../labs/lab.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassResponseDto } from './dto/class-response.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    @InjectRepository(Lab)
    private labRepository: Repository<Lab>,
  ) {}

  async create(createClassDto: CreateClassDto): Promise<ClassResponseDto> {
    // Validate lab exists if labId is provided
    if (createClassDto.labId !== undefined && createClassDto.labId !== null) {
      const lab = await this.labRepository.findOne({
        where: { id: createClassDto.labId },
      });
      if (!lab) {
        throw new BadRequestException(`Lab with ID ${createClassDto.labId} not found`);
      }
    }

    const classEntity = this.classRepository.create(createClassDto);
    const savedClass = await this.classRepository.save(classEntity);
    return this.findOne(savedClass.id);
  }

  async findAll(): Promise<ClassResponseDto[]> {
    const classes = await this.classRepository.find({
      relations: ['lab', 'students'],
    });

    return classes.map((classEntity) => this.mapToResponseDto(classEntity));
  }

  async findOne(id: number): Promise<ClassResponseDto> {
    const classEntity = await this.classRepository.findOne({
      where: { id },
      relations: ['lab', 'students'],
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    return this.mapToResponseDto(classEntity);
  }

  async update(id: number, updateClassDto: UpdateClassDto): Promise<ClassResponseDto> {
    const classEntity = await this.classRepository.findOne({ where: { id } });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    // Validate lab exists if labId is being updated
    if (updateClassDto.labId !== undefined && updateClassDto.labId !== null) {
      const lab = await this.labRepository.findOne({
        where: { id: updateClassDto.labId },
      });
      if (!lab) {
        throw new BadRequestException(`Lab with ID ${updateClassDto.labId} not found`);
      }
    }

    Object.assign(classEntity, updateClassDto);
    await this.classRepository.save(classEntity);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const classEntity = await this.classRepository.findOne({ where: { id } });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    await this.classRepository.remove(classEntity);
  }

  async getStudentCount(id: number): Promise<number> {
    const classEntity = await this.classRepository.findOne({
      where: { id },
      relations: ['students'],
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    return classEntity.students?.length || 0;
  }

  private mapToResponseDto(classEntity: Class): ClassResponseDto {
    return {
      id: classEntity.id,
      level: classEntity.level,
      name: classEntity.name,
      subject: classEntity.subject,
      labId: classEntity.labId,
      lab: classEntity.lab
        ? {
            id: classEntity.lab.id,
            name: classEntity.lab.name,
            location: classEntity.lab.location,
          }
        : undefined,
      weeklySessions: classEntity.weeklySessions,
      studentCount: classEntity.students?.length || 0,
      createdAt: classEntity.createdAt,
      updatedAt: classEntity.updatedAt,
    };
  }
}

