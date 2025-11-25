import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabEquipment } from './lab-equipment.entity';
import { CreateLabEquipmentDto } from './dto/create-lab-equipment.dto';
import { UpdateLabEquipmentDto } from './dto/update-lab-equipment.dto';

@Injectable()
export class LabEquipmentService {
  constructor(
    @InjectRepository(LabEquipment)
    private readonly repo: Repository<LabEquipment>,
  ) {}

  findAll(labId?: number): Promise<LabEquipment[]> {
    const where = labId ? { labId } : {};
    return this.repo.find({ where, order: { itemName: 'ASC', id: 'ASC' } });
  }

  async findOne(id: number): Promise<LabEquipment> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Lab equipment not found');
    return item;
  }

  create(dto: CreateLabEquipmentDto): Promise<LabEquipment> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateLabEquipmentDto): Promise<LabEquipment> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}


