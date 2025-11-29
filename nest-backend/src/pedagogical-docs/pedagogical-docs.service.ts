import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PedagogicalDocument } from './pedagogical-document.entity';
import { CreatePedagogicalDocumentDto } from './dto/create-pedagogical-document.dto';
import { PedagogicalDocumentFilterDto } from './dto/pedagogical-document-filter.dto';

@Injectable()
export class PedagogicalDocsService {
  constructor(
    @InjectRepository(PedagogicalDocument)
    private readonly repo: Repository<PedagogicalDocument>,
  ) {}

  async create(
    ownerId: number,
    dto: CreatePedagogicalDocumentDto & {
      fileUrl: string;
      originalFileName: string;
    },
  ): Promise<PedagogicalDocument> {
    const entity = this.repo.create({
      ...dto,
      ownerId,
    });
    return this.repo.save(entity);
  }

  async findAll(ownerId: number, filters: PedagogicalDocumentFilterDto): Promise<PedagogicalDocument[]> {
    const where: any = { ownerId };
    if (filters.level) {
      where.level = filters.level;
    }
    if (filters.type) {
      where.type = filters.type;
    }

    return this.repo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }
}


