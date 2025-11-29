import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabDeviceLog } from './lab-device-log.entity';
import { CreateLabDeviceLogDto } from './dto/create-lab-device-log.dto';
import { UpdateLabDeviceLogDto } from './dto/update-lab-device-log.dto';

@Injectable()
export class LabDeviceLogsService {
  constructor(
    @InjectRepository(LabDeviceLog)
    private readonly repo: Repository<LabDeviceLog>,
  ) {}

  findAll(ownerId: number, labId?: number): Promise<LabDeviceLog[]> {
    const where: any = { ownerId };
    if (labId) where.labId = labId;
    return this.repo.find({ where, order: { exitDate: 'DESC', id: 'DESC' } });
  }

  async findOne(ownerId: number, id: number): Promise<LabDeviceLog> {
    const log = await this.repo.findOne({ where: { id, ownerId } });
    if (!log) {
      throw new NotFoundException('Device log not found');
    }
    return log;
  }

  create(ownerId: number, dto: CreateLabDeviceLogDto): Promise<LabDeviceLog> {
    const entity = this.repo.create({ ...dto, ownerId });
    return this.repo.save(entity);
  }

  async update(ownerId: number, id: number, dto: UpdateLabDeviceLogDto): Promise<LabDeviceLog> {
    await this.repo.update({ id, ownerId }, dto);
    return this.findOne(ownerId, id);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    await this.repo.delete({ id, ownerId });
  }
}


