import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabInventoryItem } from './lab-inventory-item.entity';
import { CreateLabInventoryItemDto } from './dto/create-lab-inventory-item.dto';
import { UpdateLabInventoryItemDto } from './dto/update-lab-inventory-item.dto';

@Injectable()
export class LabInventoryService {
  constructor(
    @InjectRepository(LabInventoryItem)
    private readonly repo: Repository<LabInventoryItem>,
  ) {}

  findAll(ownerId: number, labId?: number): Promise<LabInventoryItem[]> {
    const where: any = { ownerId };
    if (labId) where.labId = labId;
    return this.repo.find({ where, order: { category: 'ASC', label: 'ASC' } });
  }

  async findOne(ownerId: number, id: number): Promise<LabInventoryItem> {
    const item = await this.repo.findOne({ where: { id, ownerId } });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  create(ownerId: number, dto: CreateLabInventoryItemDto): Promise<LabInventoryItem> {
    const entity = this.repo.create({ ...dto, ownerId });
    return this.repo.save(entity);
  }

  async update(ownerId: number, id: number, dto: UpdateLabInventoryItemDto): Promise<LabInventoryItem> {
    await this.repo.update({ id, ownerId }, dto);
    return this.findOne(ownerId, id);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    await this.repo.delete({ id, ownerId });
  }
}


