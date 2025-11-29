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

  findAll(ownerId: number, labId?: number): Promise<LabSoftware[]> {
    const where: any = { ownerId };
    if (labId) where.labId = labId;
    return this.repo.find({ where, order: { programName: 'ASC', id: 'ASC' } });
  }

  async findOne(ownerId: number, id: number): Promise<LabSoftware> {
    const item = await this.repo.findOne({ where: { id, ownerId } });
    if (!item) throw new NotFoundException('Lab software not found');
    return item;
  }

  create(ownerId: number, dto: CreateLabSoftwareDto): Promise<LabSoftware> {
    const entity = this.repo.create({ ...dto, ownerId });
    return this.repo.save(entity);
  }

  async update(ownerId: number, id: number, dto: UpdateLabSoftwareDto): Promise<LabSoftware> {
    await this.repo.update({ id, ownerId }, dto);
    return this.findOne(ownerId, id);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    await this.repo.delete({ id, ownerId });
  }
}


