import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabFurniture } from './lab-furniture.entity';
import { CreateLabFurnitureDto } from './dto/create-lab-furniture.dto';
import { UpdateLabFurnitureDto } from './dto/update-lab-furniture.dto';

@Injectable()
export class LabFurnitureService {
  constructor(
    @InjectRepository(LabFurniture)
    private readonly repo: Repository<LabFurniture>,
  ) {}

  findAll(labId?: number): Promise<LabFurniture[]> {
    const where = labId ? { labId } : {};
    return this.repo.find({ where, order: { itemName: 'ASC', id: 'ASC' } });
  }

  async findOne(id: number): Promise<LabFurniture> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Lab furniture not found');
    return item;
  }

  create(dto: CreateLabFurnitureDto): Promise<LabFurniture> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateLabFurnitureDto): Promise<LabFurniture> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}


