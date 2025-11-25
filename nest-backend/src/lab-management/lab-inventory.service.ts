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

  findAll(labId?: number): Promise<LabInventoryItem[]> {
    const where = labId ? { labId } : {};
    return this.repo.find({ where, order: { category: 'ASC', label: 'ASC' } });
  }

  async findOne(id: number): Promise<LabInventoryItem> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  create(dto: CreateLabInventoryItemDto): Promise<LabInventoryItem> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateLabInventoryItemDto): Promise<LabInventoryItem> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}


