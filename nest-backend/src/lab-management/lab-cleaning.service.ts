import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabCleaning } from './lab-cleaning.entity';
import { CreateLabCleaningDto } from './dto/create-lab-cleaning.dto';
import { UpdateLabCleaningDto } from './dto/update-lab-cleaning.dto';

@Injectable()
export class LabCleaningService {
  constructor(
    @InjectRepository(LabCleaning)
    private readonly repo: Repository<LabCleaning>,
  ) {}

  findAll(ownerId: number, labId?: number): Promise<LabCleaning[]> {
    const where: any = { ownerId };
    if (labId) where.labId = labId;
    return this.repo.find({ where, order: { checkDate: 'DESC', id: 'DESC' } });
  }

  async findOne(ownerId: number, id: number): Promise<LabCleaning> {
    const item = await this.repo.findOne({ where: { id, ownerId } });
    if (!item) throw new NotFoundException('Lab cleaning entry not found');
    return item;
  }

  create(ownerId: number, dto: CreateLabCleaningDto): Promise<LabCleaning> {
    const entity = this.repo.create({ ...dto, ownerId });
    return this.repo.save(entity);
  }

  async update(ownerId: number, id: number, dto: UpdateLabCleaningDto): Promise<LabCleaning> {
    await this.repo.update({ id, ownerId }, dto);
    return this.findOne(ownerId, id);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    await this.repo.delete({ id, ownerId });
  }
}


