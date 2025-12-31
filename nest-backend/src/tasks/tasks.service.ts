import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(ownerId: number, createTaskDto: CreateTaskDto): Promise<TaskResponseDto> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      ownerId,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
    });
    const savedTask = await this.taskRepository.save(task);
    return this.mapToResponseDto(savedTask);
  }

  async findAll(ownerId: number): Promise<TaskResponseDto[]> {
    const tasks = await this.taskRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
    return tasks.map((task) => this.mapToResponseDto(task));
  }

  async findOne(ownerId: number, id: number): Promise<TaskResponseDto> {
    const task = await this.findOwnedTask(ownerId, id);
    return this.mapToResponseDto(task);
  }

  async update(ownerId: number, id: number, updateTaskDto: UpdateTaskDto): Promise<TaskResponseDto> {
    const task = await this.findOwnedTask(ownerId, id);
    
    if (updateTaskDto.dueDate) {
      updateTaskDto.dueDate = new Date(updateTaskDto.dueDate) as any;
    }
    
    Object.assign(task, updateTaskDto);
    await this.taskRepository.save(task);
    return this.mapToResponseDto(task);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    const task = await this.findOwnedTask(ownerId, id);
    await this.taskRepository.remove(task);
  }

  private mapToResponseDto(task: Task): TaskResponseDto {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      completed: task.completed,
      category: task.category,
      dueDate: task.dueDate,
      reminderText: task.reminderText,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  private async findOwnedTask(ownerId: number, id: number): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, ownerId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }
}

