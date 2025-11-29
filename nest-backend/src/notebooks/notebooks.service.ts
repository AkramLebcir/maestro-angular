import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notebook } from './notebook.entity';
import { CourseEntry } from './course-entry.entity';
import { Class } from '../classes/class.entity';
import { CreateNotebookDto } from './dto/create-notebook.dto';
import { UpdateNotebookDto } from './dto/update-notebook.dto';
import { NotebookResponseDto } from './dto/notebook-response.dto';
import { CreateCourseEntryDto } from './dto/create-course-entry.dto';
import { UpdateCourseEntryDto } from './dto/update-course-entry.dto';
import { CourseEntryResponseDto } from './dto/course-entry-response.dto';

@Injectable()
export class NotebooksService {
  constructor(
    @InjectRepository(Notebook)
    private notebookRepository: Repository<Notebook>,
    @InjectRepository(CourseEntry)
    private courseEntryRepository: Repository<CourseEntry>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
  ) {}

  async create(ownerId: number, createNotebookDto: CreateNotebookDto): Promise<NotebookResponseDto> {
    // Validate class exists if classId is provided
    if (createNotebookDto.classId !== undefined && createNotebookDto.classId !== null) {
      const classEntity = await this.classRepository.findOne({
        where: { id: createNotebookDto.classId, ownerId },
      });
      if (!classEntity) {
        throw new BadRequestException(`Class with ID ${createNotebookDto.classId} not found`);
      }
    }

    const notebook = this.notebookRepository.create({
      ...createNotebookDto,
      ownerId,
    });
    const savedNotebook = await this.notebookRepository.save(notebook);
    return this.findOne(ownerId, savedNotebook.id);
  }

  async findAll(ownerId: number): Promise<NotebookResponseDto[]> {
    const notebooks = await this.notebookRepository.find({
      where: { ownerId },
      relations: ['class'],
    });

    return notebooks.map((notebook) => this.mapToResponseDto(notebook));
  }

  async findOne(ownerId: number, id: number): Promise<NotebookResponseDto> {
    const notebook = await this.notebookRepository.findOne({
      where: { id, ownerId },
      relations: ['class'],
    });

    if (!notebook) {
      throw new NotFoundException(`Notebook with ID ${id} not found`);
    }

    return this.mapToResponseDto(notebook);
  }

  async update(ownerId: number, id: number, updateNotebookDto: UpdateNotebookDto): Promise<NotebookResponseDto> {
    const notebook = await this.notebookRepository.findOne({ where: { id, ownerId } });

    if (!notebook) {
      throw new NotFoundException(`Notebook with ID ${id} not found`);
    }

    // Validate class exists if classId is being updated
    if (updateNotebookDto.classId !== undefined && updateNotebookDto.classId !== null) {
      const classEntity = await this.classRepository.findOne({
        where: { id: updateNotebookDto.classId, ownerId },
      });
      if (!classEntity) {
        throw new BadRequestException(`Class with ID ${updateNotebookDto.classId} not found`);
      }
    }

    Object.assign(notebook, updateNotebookDto);
    await this.notebookRepository.save(notebook);
    return this.findOne(ownerId, id);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    const notebook = await this.notebookRepository.findOne({ where: { id, ownerId } });

    if (!notebook) {
      throw new NotFoundException(`Notebook with ID ${id} not found`);
    }

    await this.notebookRepository.remove(notebook);
  }

  private mapToResponseDto(notebook: Notebook): NotebookResponseDto {
    return {
      id: notebook.id,
      title: notebook.title,
      description: notebook.description,
      content: notebook.content,
      classId: notebook.classId,
      class: notebook.class
        ? {
            id: notebook.class.id,
            name: notebook.class.name,
            subject: notebook.class.subject,
          }
        : undefined,
      createdAt: notebook.createdAt,
      updatedAt: notebook.updatedAt,
    };
  }

  // Course Entry Methods
  async createCourseEntry(ownerId: number, notebookId: number, createCourseEntryDto: CreateCourseEntryDto): Promise<CourseEntryResponseDto> {
    // Validate notebook exists and belongs to owner
    const notebook = await this.notebookRepository.findOne({ where: { id: notebookId, ownerId } });
    if (!notebook) {
      throw new NotFoundException(`Notebook with ID ${notebookId} not found`);
    }

    // Validate time range
    const startMinutes = this.timeToMinutes(createCourseEntryDto.startTime);
    const endMinutes = this.timeToMinutes(createCourseEntryDto.endTime);
    if (startMinutes >= endMinutes) {
      throw new BadRequestException('startTime must be before endTime');
    }

    const courseEntry = this.courseEntryRepository.create({
      ...createCourseEntryDto,
      notebookId,
      ownerId,
    });
    const savedCourseEntry = await this.courseEntryRepository.save(courseEntry);
    // Reload with relations
    const reloadedEntry = await this.courseEntryRepository.findOne({
      where: { id: savedCourseEntry.id, ownerId },
      relations: ['topic', 'topic.elements'],
    });
    return this.mapCourseEntryToResponseDto(reloadedEntry || savedCourseEntry);
  }

  async findAllCourseEntries(ownerId: number, notebookId: number): Promise<CourseEntryResponseDto[]> {
    // Validate notebook exists and belongs to owner
    const notebook = await this.notebookRepository.findOne({ where: { id: notebookId, ownerId } });
    if (!notebook) {
      throw new NotFoundException(`Notebook with ID ${notebookId} not found`);
    }

    const courseEntries = await this.courseEntryRepository.find({
      where: { notebookId, ownerId },
      relations: ['topic', 'topic.elements'],
      order: {
        date: 'ASC',
        startTime: 'ASC',
      },
    });

    return courseEntries.map((entry) => this.mapCourseEntryToResponseDto(entry));
  }

  async findOneCourseEntry(ownerId: number, notebookId: number, courseEntryId: number): Promise<CourseEntryResponseDto> {
    const courseEntry = await this.courseEntryRepository.findOne({
      where: { id: courseEntryId, notebookId, ownerId },
      relations: ['topic', 'topic.elements'],
    });

    if (!courseEntry) {
      throw new NotFoundException(`Course entry with ID ${courseEntryId} not found in notebook ${notebookId}`);
    }

    return this.mapCourseEntryToResponseDto(courseEntry);
  }

  async updateCourseEntry(
    ownerId: number,
    notebookId: number,
    courseEntryId: number,
    updateCourseEntryDto: UpdateCourseEntryDto,
  ): Promise<CourseEntryResponseDto> {
    const courseEntry = await this.courseEntryRepository.findOne({
      where: { id: courseEntryId, notebookId, ownerId },
    });

    if (!courseEntry) {
      throw new NotFoundException(`Course entry with ID ${courseEntryId} not found in notebook ${notebookId}`);
    }

    // Validate time range if times are being updated
    if (updateCourseEntryDto.startTime || updateCourseEntryDto.endTime) {
      const startTime = updateCourseEntryDto.startTime || courseEntry.startTime;
      const endTime = updateCourseEntryDto.endTime || courseEntry.endTime;
      const startMinutes = this.timeToMinutes(startTime);
      const endMinutes = this.timeToMinutes(endTime);
      if (startMinutes >= endMinutes) {
        throw new BadRequestException('startTime must be before endTime');
      }
    }

    // Validate notebook exists if notebookId is being updated
    if (updateCourseEntryDto.notebookId !== undefined && updateCourseEntryDto.notebookId !== notebookId) {
      const notebook = await this.notebookRepository.findOne({
        where: { id: updateCourseEntryDto.notebookId, ownerId },
      });
      if (!notebook) {
        throw new BadRequestException(`Notebook with ID ${updateCourseEntryDto.notebookId} not found`);
      }
    }

    Object.assign(courseEntry, updateCourseEntryDto);
    const savedCourseEntry = await this.courseEntryRepository.save(courseEntry);
    // Reload with relations
    const reloadedEntry = await this.courseEntryRepository.findOne({
      where: { id: savedCourseEntry.id, ownerId },
      relations: ['topic', 'topic.elements'],
    });
    return this.mapCourseEntryToResponseDto(reloadedEntry || savedCourseEntry);
  }

  async removeCourseEntry(ownerId: number, notebookId: number, courseEntryId: number): Promise<void> {
    const courseEntry = await this.courseEntryRepository.findOne({
      where: { id: courseEntryId, notebookId, ownerId },
    });

    if (!courseEntry) {
      throw new NotFoundException(`Course entry with ID ${courseEntryId} not found in notebook ${notebookId}`);
    }

    await this.courseEntryRepository.remove(courseEntry);
  }

  private mapCourseEntryToResponseDto(courseEntry: CourseEntry): CourseEntryResponseDto {
    return {
      id: courseEntry.id,
      title: courseEntry.title,
      description: courseEntry.description,
      date: courseEntry.date,
      startTime: courseEntry.startTime,
      endTime: courseEntry.endTime,
      notebookId: courseEntry.notebookId,
      topicId: courseEntry.topicId,
      topic: courseEntry.topic
        ? {
            id: courseEntry.topic.id,
            title: courseEntry.topic.title,
            subtitle: courseEntry.topic.subtitle,
            description: courseEntry.topic.description,
            elements: courseEntry.topic.elements
              ? courseEntry.topic.elements
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((el) => ({
                    id: el.id,
                    content: el.content,
                    order: el.order || 0,
                  }))
              : [],
          }
        : undefined,
      order: courseEntry.order,
      mark: courseEntry.mark,
      note: courseEntry.note,
      createdAt: courseEntry.createdAt,
      updatedAt: courseEntry.updatedAt,
    };
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

