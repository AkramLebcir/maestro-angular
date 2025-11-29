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

  findAll(ownerId: number, labId?: number): Promise<LabEquipment[]> {
    const where: any = { ownerId };
    if (labId) where.labId = labId;
    return this.repo.find({ where, order: { itemName: 'ASC', id: 'ASC' } });
  }

  async findOne(ownerId: number, id: number): Promise<LabEquipment> {
    const item = await this.repo.findOne({ where: { id, ownerId } });
    if (!item) throw new NotFoundException('Lab equipment not found');
    return item;
  }

  create(ownerId: number, dto: CreateLabEquipmentDto): Promise<LabEquipment> {
    const entity = this.repo.create({ ...dto, ownerId });
    return this.repo.save(entity);
  }

  async update(ownerId: number, id: number, dto: UpdateLabEquipmentDto): Promise<LabEquipment> {
    await this.repo.update({ id, ownerId }, dto);
    return this.findOne(ownerId, id);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    await this.repo.delete({ id, ownerId });
  }
}


