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

  findAll(labId?: number): Promise<LabCleaning[]> {
    const where = labId ? { labId } : {};
    return this.repo.find({ where, order: { checkDate: 'DESC', id: 'DESC' } });
  }

  async findOne(id: number): Promise<LabCleaning> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Lab cleaning entry not found');
    return item;
  }

  create(dto: CreateLabCleaningDto): Promise<LabCleaning> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateLabCleaningDto): Promise<LabCleaning> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}


