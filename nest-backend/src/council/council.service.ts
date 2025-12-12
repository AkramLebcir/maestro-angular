import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CouncilSemesterRecord } from './entities/council-semester-record.entity';
import { FinalCouncilDecision } from './entities/final-council-decision.entity';
import { CreateCouncilSemesterRecordDto } from './dto/create-council-semester-record.dto';
import { UpdateCouncilSemesterRecordDto } from './dto/update-council-semester-record.dto';
import { CreateFinalCouncilDecisionDto } from './dto/create-final-council-decision.dto';
import { UpdateFinalCouncilDecisionDto } from './dto/update-final-council-decision.dto';
import { Grade } from '../grades/grade.entity';

@Injectable()
export class CouncilService {
  constructor(
    @InjectRepository(CouncilSemesterRecord)
    private councilSemesterRecordRepository: Repository<CouncilSemesterRecord>,
    @InjectRepository(FinalCouncilDecision)
    private finalCouncilDecisionRepository: Repository<FinalCouncilDecision>,
    @InjectRepository(Grade)
    private gradeRepository: Repository<Grade>,
  ) {}

  // =================== Council Semester Records ===================

  async createCouncilSemesterRecord(
    dto: CreateCouncilSemesterRecordDto,
    ownerId: number,
  ): Promise<CouncilSemesterRecord> {
    const record = this.councilSemesterRecordRepository.create({
      ...dto,
      ownerId,
    });
    return await this.councilSemesterRecordRepository.save(record);
  }

  async findAllCouncilSemesterRecords(
    classId: number,
    term: number,
    ownerId: number,
  ): Promise<CouncilSemesterRecord[]> {
    return await this.councilSemesterRecordRepository.find({
      where: { classId, term, ownerId },
      relations: ['student', 'class'],
      order: { studentId: 'ASC' },
    });
  }

  async findOneCouncilSemesterRecord(
    id: number,
    ownerId: number,
  ): Promise<CouncilSemesterRecord> {
    const record = await this.councilSemesterRecordRepository.findOne({
      where: { id, ownerId },
      relations: ['student', 'class'],
    });
    if (!record) {
      throw new NotFoundException(`Council semester record #${id} not found`);
    }
    return record;
  }

  async updateCouncilSemesterRecord(
    id: number,
    dto: UpdateCouncilSemesterRecordDto,
    ownerId: number,
  ): Promise<CouncilSemesterRecord> {
    const record = await this.findOneCouncilSemesterRecord(id, ownerId);
    Object.assign(record, dto);
    return await this.councilSemesterRecordRepository.save(record);
  }

  async deleteCouncilSemesterRecord(
    id: number,
    ownerId: number,
  ): Promise<void> {
    const record = await this.findOneCouncilSemesterRecord(id, ownerId);
    await this.councilSemesterRecordRepository.remove(record);
  }

  async bulkUpsertCouncilSemesterRecords(
    records: CreateCouncilSemesterRecordDto[],
    ownerId: number,
  ): Promise<CouncilSemesterRecord[]> {
    const results: CouncilSemesterRecord[] = [];
    
    for (const dto of records) {
      const existing = await this.councilSemesterRecordRepository.findOne({
        where: {
          studentId: dto.studentId,
          classId: dto.classId,
          term: dto.term,
          ownerId,
        },
      });

      if (existing) {
        Object.assign(existing, dto);
        results.push(await this.councilSemesterRecordRepository.save(existing));
      } else {
        const newRecord = this.councilSemesterRecordRepository.create({
          ...dto,
          ownerId,
        });
        results.push(await this.councilSemesterRecordRepository.save(newRecord));
      }
    }

    return results;
  }

  // حساب معدل الأستاذ تلقائياً من النقاط
  async calculateTeacherAverage(
    studentId: number,
    classId: number,
    term: number,
    ownerId: number,
  ): Promise<number> {
    const grades = await this.gradeRepository.find({
      where: { studentId, classId, term, ownerId },
    });

    if (grades.length === 0) return 0;

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const grade of grades) {
      const normalizedScore = (grade.score / grade.maxScore) * 20;
      // افترض أن كل نقطة لها وزن 1 (يمكن تعديله حسب نظام التقييم)
      totalWeightedScore += normalizedScore;
      totalWeight += 1;
    }

    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  }

  // =================== Final Council Decisions ===================

  async createFinalCouncilDecision(
    dto: CreateFinalCouncilDecisionDto,
    ownerId: number,
  ): Promise<FinalCouncilDecision> {
    // حساب المعدل السنوي تلقائياً
    const annualAverage = this.calculateAnnualAverage(
      dto.term1Average,
      dto.term2Average,
      dto.term3Average,
    );

    // حساب القرار التلقائي إذا لم يكن يدوياً
    let finalDecision = dto.finalDecision;
    if (!dto.isManualDecision) {
      finalDecision = this.determineDecision(annualAverage);
    }

    const decision = this.finalCouncilDecisionRepository.create({
      ...dto,
      annualAverage,
      finalDecision,
      ownerId,
    });
    return await this.finalCouncilDecisionRepository.save(decision);
  }

  async findAllFinalCouncilDecisions(
    classId: number,
    ownerId: number,
  ): Promise<FinalCouncilDecision[]> {
    return await this.finalCouncilDecisionRepository.find({
      where: { classId, ownerId },
      relations: ['student', 'class'],
      order: { studentId: 'ASC' },
    });
  }

  async findOneFinalCouncilDecision(
    id: number,
    ownerId: number,
  ): Promise<FinalCouncilDecision> {
    const decision = await this.finalCouncilDecisionRepository.findOne({
      where: { id, ownerId },
      relations: ['student', 'class'],
    });
    if (!decision) {
      throw new NotFoundException(`Final council decision #${id} not found`);
    }
    return decision;
  }

  async updateFinalCouncilDecision(
    id: number,
    dto: UpdateFinalCouncilDecisionDto,
    ownerId: number,
  ): Promise<FinalCouncilDecision> {
    const decision = await this.findOneFinalCouncilDecision(id, ownerId);

    // إعادة حساب المعدل السنوي
    const annualAverage = this.calculateAnnualAverage(
      dto.term1Average ?? decision.term1Average,
      dto.term2Average ?? decision.term2Average,
      dto.term3Average ?? decision.term3Average,
    );

    // إعادة حساب القرار إذا لم يكن يدوياً
    let finalDecision = dto.finalDecision ?? decision.finalDecision;
    if (!dto.isManualDecision && !decision.isManualDecision) {
      finalDecision = this.determineDecision(annualAverage);
    }

    Object.assign(decision, dto, { annualAverage, finalDecision });
    return await this.finalCouncilDecisionRepository.save(decision);
  }

  async deleteFinalCouncilDecision(
    id: number,
    ownerId: number,
  ): Promise<void> {
    const decision = await this.findOneFinalCouncilDecision(id, ownerId);
    await this.finalCouncilDecisionRepository.remove(decision);
  }

  async bulkUpsertFinalCouncilDecisions(
    decisions: CreateFinalCouncilDecisionDto[],
    ownerId: number,
  ): Promise<FinalCouncilDecision[]> {
    const results: FinalCouncilDecision[] = [];
    
    for (const dto of decisions) {
      const existing = await this.finalCouncilDecisionRepository.findOne({
        where: {
          studentId: dto.studentId,
          classId: dto.classId,
          ownerId,
        },
      });

      const annualAverage = this.calculateAnnualAverage(
        dto.term1Average,
        dto.term2Average,
        dto.term3Average,
      );

      let finalDecision = dto.finalDecision;
      if (!dto.isManualDecision) {
        finalDecision = this.determineDecision(annualAverage);
      }

      if (existing) {
        Object.assign(existing, dto, { annualAverage, finalDecision });
        results.push(await this.finalCouncilDecisionRepository.save(existing));
      } else {
        const newDecision = this.finalCouncilDecisionRepository.create({
          ...dto,
          annualAverage,
          finalDecision,
          ownerId,
        });
        results.push(await this.finalCouncilDecisionRepository.save(newDecision));
      }
    }

    return results;
  }

  // =================== Helper Methods ===================

  private calculateAnnualAverage(
    term1?: number,
    term2?: number,
    term3?: number,
  ): number {
    const terms = [term1, term2, term3].filter(t => t !== null && t !== undefined);
    if (terms.length === 0) return 0;
    return terms.reduce((sum, t) => sum + t, 0) / terms.length;
  }

  private determineDecision(annualAverage: number): string {
    if (annualAverage >= 10) {
      return 'pass'; // يتنقل
    } else if (annualAverage >= 9) {
      return 'remedial'; // استدراك
    } else {
      return 'repeat'; // يرتب
    }
  }

  // جلب معدلات الفصول من council semester records
  async syncTermAveragesFromCouncilRecords(
    studentId: number,
    classId: number,
    ownerId: number,
  ): Promise<{ term1?: number; term2?: number; term3?: number }> {
    const records = await this.councilSemesterRecordRepository.find({
      where: { studentId, classId, ownerId },
    });

    const result: any = {};
    for (const record of records) {
      if (record.term === 1) result.term1 = record.semesterAverage;
      if (record.term === 2) result.term2 = record.semesterAverage;
      if (record.term === 3) result.term3 = record.semesterAverage;
    }

    return result;
  }
}

