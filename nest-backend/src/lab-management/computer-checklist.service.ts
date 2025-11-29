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

  findAll(ownerId: number, labId?: number): Promise<ComputerChecklist[]> {
    const where: any = { ownerId };
    if (labId) where.labId = labId;
    return this.repo.find({ where, order: { deviceNumber: 'ASC' } });
  }

  async findOne(ownerId: number, id: number): Promise<ComputerChecklist> {
    const item = await this.repo.findOne({ where: { id, ownerId } });
    if (!item) throw new NotFoundException('Checklist item not found');
    return item;
  }

  create(ownerId: number, dto: CreateComputerChecklistDto): Promise<ComputerChecklist> {
    const entity = this.repo.create({ ...dto, ownerId });
    return this.repo.save(entity);
  }

  async update(
    ownerId: number,
    id: number,
    dto: UpdateComputerChecklistDto,
  ): Promise<ComputerChecklist> {
    await this.repo.update({ id, ownerId }, dto);
    return this.findOne(ownerId, id);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    await this.repo.delete({ id, ownerId });
  }
}


