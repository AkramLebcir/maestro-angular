import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HolidayPeriod } from './holiday-period.entity';
import { AnnualDistribution } from './annual-distribution.entity';
import { CreateHolidayPeriodDto } from './dto/create-holiday-period.dto';
import { UpdateHolidayPeriodDto } from './dto/update-holiday-period.dto';
import { HolidayPeriodResponseDto } from './dto/holiday-period-response.dto';
import { CreateAnnualDistributionDto } from './dto/create-annual-distribution.dto';
import { UpdateAnnualDistributionDto } from './dto/update-annual-distribution.dto';
import { AnnualDistributionResponseDto } from './dto/annual-distribution-response.dto';

@Injectable()
export class AnnualPlanningService {
  constructor(
    @InjectRepository(HolidayPeriod)
    private readonly holidayRepo: Repository<HolidayPeriod>,
    @InjectRepository(AnnualDistribution)
    private readonly distributionRepo: Repository<AnnualDistribution>,
  ) {}

  // Holiday CRUD
  async createHoliday(ownerId: number, dto: CreateHolidayPeriodDto): Promise<HolidayPeriodResponseDto> {
    const entity = this.holidayRepo.create({
      ...dto,
      ownerId,
    });
    const saved = await this.holidayRepo.save(entity);
    return this.mapHoliday(saved);
  }

  async findAllHolidays(ownerId: number, year?: string): Promise<HolidayPeriodResponseDto[]> {
    const where: any = { ownerId };
    if (year) where.year = year;
    const holidays = await this.holidayRepo.find({ where, order: { startDate: 'ASC' } });
    return holidays.map((h) => this.mapHoliday(h));
  }

  async updateHoliday(ownerId: number, id: number, dto: UpdateHolidayPeriodDto): Promise<HolidayPeriodResponseDto> {
    const entity = await this.holidayRepo.findOne({ where: { id, ownerId } });
    if (!entity) {
      throw new NotFoundException(`HolidayPeriod with ID ${id} not found`);
    }
    Object.assign(entity, dto);
    const saved = await this.holidayRepo.save(entity);
    return this.mapHoliday(saved);
  }

  async removeHoliday(ownerId: number, id: number): Promise<void> {
    const entity = await this.holidayRepo.findOne({ where: { id, ownerId } });
    if (!entity) {
      throw new NotFoundException(`HolidayPeriod with ID ${id} not found`);
    }
    await this.holidayRepo.remove(entity);
  }

  // Annual distribution CRUD
  async createDistribution(ownerId: number, dto: CreateAnnualDistributionDto): Promise<AnnualDistributionResponseDto> {
    const entity = this.distributionRepo.create({
      ...dto,
      ownerId,
    });
    const saved = await this.distributionRepo.save(entity);
    return this.mapDistribution(saved);
  }

  async findAllDistributions(
    ownerId: number,
    filters?: {
      year?: string;
      level?: string;
      track?: string;
    }
  ): Promise<AnnualDistributionResponseDto[]> {
    const where: any = { ownerId };
    if (filters?.year) where.year = filters.year;
    if (filters?.level) where.level = filters.level;
    if (filters?.track) where.track = filters.track;

    const list = await this.distributionRepo.find({
      where,
      order: { term: 'ASC', weekNumber: 'ASC' },
    });
    return list.map((d) => this.mapDistribution(d));
  }

  async updateDistribution(
    ownerId: number,
    id: number,
    dto: UpdateAnnualDistributionDto,
  ): Promise<AnnualDistributionResponseDto> {
    const entity = await this.distributionRepo.findOne({ where: { id, ownerId } });
    if (!entity) {
      throw new NotFoundException(`AnnualDistribution with ID ${id} not found`);
    }
    Object.assign(entity, dto);
    const saved = await this.distributionRepo.save(entity);
    return this.mapDistribution(saved);
  }

  async removeDistribution(ownerId: number, id: number): Promise<void> {
    const entity = await this.distributionRepo.findOne({ where: { id, ownerId } });
    if (!entity) {
      throw new NotFoundException(`AnnualDistribution with ID ${id} not found`);
    }
    await this.distributionRepo.remove(entity);
  }

  /**
   * Returns distributions with computed start/end dates after applying holiday shifts.
   */
  async getScheduledDistributions(
    ownerId: number,
    filters: {
      year: string;
      level?: string;
      track?: string;
    }
  ): Promise<AnnualDistributionResponseDto[]> {
    const distributions = await this.findAllDistributions(ownerId, filters);
    if (distributions.length === 0) {
      return [];
    }

    const holidays = await this.findAllHolidays(ownerId, filters.year);
    const holidayRanges = holidays.map((h) => ({
      start: new Date(h.startDate),
      end: new Date(h.endDate),
    }));

    return distributions.map((d) => {
      const base = new Date(d.yearStartDate);
      const scheduledStart = this.computeWeekStartDate(
        base,
        d.weekNumber,
        holidayRanges,
      );
      const scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setDate(scheduledEnd.getDate() + 6);

      return {
        ...d,
        computedStartDate: scheduledStart.toISOString().slice(0, 10),
        computedEndDate: scheduledEnd.toISOString().slice(0, 10),
      };
    });
  }

  private computeWeekStartDate(
    baseDate: Date,
    weekNumber: number,
    holidays: { start: Date; end: Date }[],
  ): Date {
    const start = new Date(baseDate);
    // naive start: 7-day blocks
    start.setDate(start.getDate() + (weekNumber - 1) * 7);

    let extraDays = 0;
    for (const h of holidays) {
      if (h.end < baseDate) continue;
      if (h.start > start) continue;

      const overlapStart = h.start < baseDate ? baseDate : h.start;
      const overlapEnd = h.end < start ? h.end : start;
      const diffMs = overlapEnd.getTime() - overlapStart.getTime();
      if (diffMs >= 0) {
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
        extraDays += days;
      }
    }

    const result = new Date(start);
    result.setDate(result.getDate() + extraDays);
    return result;
  }

  private mapHoliday(entity: HolidayPeriod): HolidayPeriodResponseDto {
    return {
      id: entity.id,
      year: entity.year,
      name: entity.name,
      type: entity.type,
      startDate: entity.startDate,
      endDate: entity.endDate,
      notes: entity.notes,
    };
  }

  private mapDistribution(entity: AnnualDistribution): AnnualDistributionResponseDto {
    return {
      id: entity.id,
      year: entity.year,
      level: entity.level,
      track: entity.track,
      term: entity.term,
      weekNumber: entity.weekNumber,
      yearStartDate: entity.yearStartDate,
      unitTitle: entity.unitTitle,
      domain: entity.domain,
      notes: entity.notes,
    };
  }
}


