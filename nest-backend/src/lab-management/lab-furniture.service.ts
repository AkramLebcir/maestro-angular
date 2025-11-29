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

  findAll(ownerId: number, labId?: number): Promise<LabFurniture[]> {
    const where: any = { ownerId };
    if (labId) where.labId = labId;
    return this.repo.find({ where, order: { itemName: 'ASC', id: 'ASC' } });
  }

  async findOne(ownerId: number, id: number): Promise<LabFurniture> {
    const item = await this.repo.findOne({ where: { id, ownerId } });
    if (!item) throw new NotFoundException('Lab furniture not found');
    return item;
  }

  create(ownerId: number, dto: CreateLabFurnitureDto): Promise<LabFurniture> {
    const entity = this.repo.create({ ...dto, ownerId });
    return this.repo.save(entity);
  }

  async update(ownerId: number, id: number, dto: UpdateLabFurnitureDto): Promise<LabFurniture> {
    await this.repo.update({ id, ownerId }, dto);
    return this.findOne(ownerId, id);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    await this.repo.delete({ id, ownerId });
  }
}


