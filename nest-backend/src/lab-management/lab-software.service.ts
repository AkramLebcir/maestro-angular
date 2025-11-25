import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabSoftware } from './lab-software.entity';
import { CreateLabSoftwareDto } from './dto/create-lab-software.dto';
import { UpdateLabSoftwareDto } from './dto/update-lab-software.dto';

@Injectable()
export class LabSoftwareService {
  constructor(
    @InjectRepository(LabSoftware)
    private readonly repo: Repository<LabSoftware>,
  ) {}

  findAll(labId?: number): Promise<LabSoftware[]> {
    const where = labId ? { labId } : {};
    return this.repo.find({ where, order: { programName: 'ASC', id: 'ASC' } });
  }

  async findOne(id: number): Promise<LabSoftware> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Lab software not found');
    return item;
  }

  create(dto: CreateLabSoftwareDto): Promise<LabSoftware> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateLabSoftwareDto): Promise<LabSoftware> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}


