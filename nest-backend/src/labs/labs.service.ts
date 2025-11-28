import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lab } from './lab.entity';
import { CreateLabDto } from './dto/create-lab.dto';
import { UpdateLabDto } from './dto/update-lab.dto';
import { LabResponseDto } from './dto/lab-response.dto';

@Injectable()
export class LabsService {
  constructor(
    @InjectRepository(Lab)
    private labRepository: Repository<Lab>,
  ) {}

  async create(ownerId: number, createLabDto: CreateLabDto): Promise<LabResponseDto> {
    const lab = this.labRepository.create({
      ...createLabDto,
      ownerId,
    });
    const savedLab = await this.labRepository.save(lab);
    return this.mapToResponseDto(savedLab);
  }

  async findAll(ownerId: number): Promise<LabResponseDto[]> {
    const labs = await this.labRepository.find({ where: { ownerId } });
    return labs.map((lab) => this.mapToResponseDto(lab));
  }

  async findOne(ownerId: number, id: number): Promise<LabResponseDto> {
    const lab = await this.findOwnedLab(ownerId, id);
    return this.mapToResponseDto(lab);
  }

  async update(ownerId: number, id: number, updateLabDto: UpdateLabDto): Promise<LabResponseDto> {
    const lab = await this.findOwnedLab(ownerId, id);

    Object.assign(lab, updateLabDto);
    await this.labRepository.save(lab);
    return this.mapToResponseDto(lab);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    const lab = await this.findOwnedLab(ownerId, id);
    await this.labRepository.remove(lab);
  }

  private mapToResponseDto(lab: Lab): LabResponseDto {
    return {
      id: lab.id,
      name: lab.name,
      description: lab.description,
      location: lab.location,
      isAvailable: lab.isAvailable,
      createdAt: lab.createdAt,
      updatedAt: lab.updatedAt,
    };
  }

  private async findOwnedLab(ownerId: number, id: number): Promise<Lab> {
    const lab = await this.labRepository.findOne({ where: { id, ownerId } });

    if (!lab) {
      throw new NotFoundException(`Lab with ID ${id} not found`);
    }

    return lab;
  }
}


