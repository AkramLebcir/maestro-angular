import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComputerChecklist } from './computer-checklist.entity';
import { CreateComputerChecklistDto } from './dto/create-computer-checklist.dto';
import { UpdateComputerChecklistDto } from './dto/update-computer-checklist.dto';

@Injectable()
export class ComputerChecklistService {
  constructor(
    @InjectRepository(ComputerChecklist)
    private readonly repo: Repository<ComputerChecklist>,
  ) {}

  findAll(labId?: number): Promise<ComputerChecklist[]> {
    const where = labId ? { labId } : {};
    return this.repo.find({ where, order: { deviceNumber: 'ASC' } });
  }

  async findOne(id: number): Promise<ComputerChecklist> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Checklist item not found');
    return item;
  }

  create(dto: CreateComputerChecklistDto): Promise<ComputerChecklist> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(
    id: number,
    dto: UpdateComputerChecklistDto,
  ): Promise<ComputerChecklist> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}


