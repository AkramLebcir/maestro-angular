import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GradingSettings, BaseColumnConfig, BaseColumnKey, LanguageCode } from './grading-settings.entity';
import { Class } from '../classes/class.entity';
import { CreateGradingSettingsDto, UpdateGradingSettingsDto, BulkApplySettingsDto } from './dto/create-grading-settings.dto';

const DEFAULT_BASE_COLUMN_SETTINGS: BaseColumnConfig[] = [
  { key: 'notebook_correction', visible: true },
  { key: 'duty', visible: true },
  { key: 'attendance', visible: true },
  { key: 'behavior', visible: true },
];

const normalizeBaseColumnSettings = (settings?: BaseColumnConfig[]): BaseColumnConfig[] => {
  const source = settings && settings.length > 0 ? settings : DEFAULT_BASE_COLUMN_SETTINGS;
  return source.map(config => ({
    key: config.key,
    label: config.label,
    visible: config.visible ?? true,
  }));
};

@Injectable()
export class GradingSettingsService {
  constructor(
    @InjectRepository(GradingSettings)
    private gradingSettingsRepository: Repository<GradingSettings>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
  ) {}

  async findByClassId(ownerId: number, classId: number): Promise<GradingSettings | null> {
    const settings = await this.gradingSettingsRepository.findOne({
      where: { ownerId, classId },
      relations: ['class'],
    });
    if (!settings) return null;
    settings.baseColumnSettings = normalizeBaseColumnSettings(settings.baseColumnSettings);
    settings.autoFillOralExpressionFromSeating =
      settings.autoFillOralExpressionFromSeating ?? false;
    return settings;
  }

  async findAll(ownerId: number): Promise<GradingSettings[]> {
    const settings = await this.gradingSettingsRepository.find({
      where: { ownerId },
      relations: ['class'],
    });
    settings.forEach(setting => {
      setting.baseColumnSettings = normalizeBaseColumnSettings(setting.baseColumnSettings);
      setting.autoFillOralExpressionFromSeating =
        setting.autoFillOralExpressionFromSeating ?? false;
    });
    return settings;
  }

  async create(ownerId: number, createDto: CreateGradingSettingsDto): Promise<GradingSettings> {
    // Verify class exists and belongs to owner
    const classEntity = await this.classRepository.findOne({
      where: { id: createDto.classId, ownerId },
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${createDto.classId} not found`);
    }

    // Check if settings already exist
    const existing = await this.findByClassId(ownerId, createDto.classId);
    if (existing) {
      throw new BadRequestException(`Grading settings already exist for class ${createDto.classId}`);
    }

    // Validate total max score doesn't exceed 20
    await this.validateTotalMaxScore(createDto);

    const settings = this.gradingSettingsRepository.create({
      ownerId,
      classId: createDto.classId,
      notebookCorrectionMaxScore: createDto.notebookCorrectionMaxScore ?? 5,
      dutyMaxScore: createDto.dutyMaxScore ?? 5,
      attendanceMaxScore: createDto.attendanceMaxScore ?? 5,
      attendanceAutoApply: createDto.attendanceAutoApply ?? true,
      behaviorMaxScore: createDto.behaviorMaxScore ?? 5,
      behaviorAutoApply: createDto.behaviorAutoApply ?? true,
      customAssessmentColumns: createDto.customAssessmentColumns ?? [],
      baseColumnSettings: normalizeBaseColumnSettings(createDto.baseColumnSettings),
      includeOralExpression: createDto.includeOralExpression ?? true,
      autoFillOralExpressionFromSeating:
        createDto.autoFillOralExpressionFromSeating ?? false,
      customRatings: createDto.customRatings ?? null,
      customGuidance: createDto.customGuidance ?? null,
    });

    return this.gradingSettingsRepository.save(settings);
  }

  async update(ownerId: number, classId: number, updateDto: UpdateGradingSettingsDto): Promise<GradingSettings> {
    const settings = await this.findByClassId(ownerId, classId);

    if (!settings) {
      // Create if doesn't exist
      return this.create(ownerId, { ...updateDto, classId });
    }

    // Validate total max score if max scores are being updated
    const mergedDto = {
      notebookCorrectionMaxScore: updateDto.notebookCorrectionMaxScore ?? settings.notebookCorrectionMaxScore,
      dutyMaxScore: updateDto.dutyMaxScore ?? settings.dutyMaxScore,
      attendanceMaxScore: updateDto.attendanceMaxScore ?? settings.attendanceMaxScore,
      behaviorMaxScore: updateDto.behaviorMaxScore ?? settings.behaviorMaxScore,
      customAssessmentColumns: updateDto.customAssessmentColumns ?? settings.customAssessmentColumns ?? [],
    };
    await this.validateTotalMaxScore(mergedDto);

    // Update fields
    if (updateDto.notebookCorrectionMaxScore !== undefined) {
      settings.notebookCorrectionMaxScore = updateDto.notebookCorrectionMaxScore;
    }
    if (updateDto.dutyMaxScore !== undefined) {
      settings.dutyMaxScore = updateDto.dutyMaxScore;
    }
    if (updateDto.attendanceMaxScore !== undefined) {
      settings.attendanceMaxScore = updateDto.attendanceMaxScore;
    }
    if (updateDto.attendanceAutoApply !== undefined) {
      settings.attendanceAutoApply = updateDto.attendanceAutoApply;
    }
    if (updateDto.behaviorMaxScore !== undefined) {
      settings.behaviorMaxScore = updateDto.behaviorMaxScore;
    }
    if (updateDto.behaviorAutoApply !== undefined) {
      settings.behaviorAutoApply = updateDto.behaviorAutoApply;
    }
    if (updateDto.customAssessmentColumns !== undefined) {
      settings.customAssessmentColumns = updateDto.customAssessmentColumns;
    }
    if (updateDto.baseColumnSettings !== undefined) {
      settings.baseColumnSettings = normalizeBaseColumnSettings(updateDto.baseColumnSettings);
    } else {
      settings.baseColumnSettings = normalizeBaseColumnSettings(settings.baseColumnSettings);
    }
    if (updateDto.includeOralExpression !== undefined) {
      settings.includeOralExpression = updateDto.includeOralExpression;
    }
    if (updateDto.autoFillOralExpressionFromSeating !== undefined) {
      settings.autoFillOralExpressionFromSeating =
        updateDto.autoFillOralExpressionFromSeating;
    }
    if (updateDto.customRatings !== undefined) {
      settings.customRatings = updateDto.customRatings;
    }
    if (updateDto.customGuidance !== undefined) {
      settings.customGuidance = updateDto.customGuidance;
    }

    return this.gradingSettingsRepository.save(settings);
  }

  async bulkApply(ownerId: number, bulkDto: BulkApplySettingsDto): Promise<GradingSettings[]> {
    // Determine which classes to apply to
    let classIds: number[];

    if (bulkDto.applyToAllClasses) {
      // Get all classes for the owner
      const allClasses = await this.classRepository.find({
        where: { ownerId },
        select: ['id'],
      });
      classIds = allClasses.map((cls) => cls.id);
    } else {
      if (!bulkDto.classIds || bulkDto.classIds.length === 0) {
        throw new BadRequestException('classIds is required unless applyToAllClasses is true');
      }
      classIds = bulkDto.classIds;
    }

    // Verify all classes exist and belong to owner
    const classes = await this.classRepository.find({
      where: { id: In(classIds), ownerId },
    });

    if (classes.length !== classIds.length) {
      throw new NotFoundException('One or more classes not found');
    }

    // Validate total max score
    await this.validateTotalMaxScore(bulkDto);

    const results: GradingSettings[] = [];

    for (const classId of classIds) {
      // Get existing settings to merge ratings/guidance with language selection
      const existingSettings = await this.findByClassId(ownerId, classId);

      // Prepare ratings with language selection
      let customRatings = bulkDto.customRatings;
      if (bulkDto.customRatings !== undefined) {
        if (bulkDto.ratingsLanguage && existingSettings?.customRatings) {
          // Merge: update only the selected language in existing ratings
          customRatings = this.mergeRatingsWithLanguage(
            existingSettings.customRatings,
            bulkDto.customRatings,
            bulkDto.ratingsLanguage,
          );
        }
        // If ratingsLanguage is not specified, customRatings will replace entirely (already set above)
      }

      // Prepare guidance with language selection
      let customGuidance = bulkDto.customGuidance;
      if (bulkDto.customGuidance !== undefined) {
        if (bulkDto.guidanceLanguage && existingSettings?.customGuidance) {
          // Merge: update only the selected language in existing guidance
          customGuidance = this.mergeGuidanceWithLanguage(
            existingSettings.customGuidance,
            bulkDto.customGuidance,
            bulkDto.guidanceLanguage,
          );
        }
        // If guidanceLanguage is not specified, customGuidance will replace entirely (already set above)
      }

      const updateDto: UpdateGradingSettingsDto = {
        notebookCorrectionMaxScore: bulkDto.notebookCorrectionMaxScore,
        dutyMaxScore: bulkDto.dutyMaxScore,
        attendanceMaxScore: bulkDto.attendanceMaxScore,
        attendanceAutoApply: bulkDto.attendanceAutoApply,
        behaviorMaxScore: bulkDto.behaviorMaxScore,
        behaviorAutoApply: bulkDto.behaviorAutoApply,
        customAssessmentColumns: bulkDto.customAssessmentColumns,
        baseColumnSettings: bulkDto.baseColumnSettings,
        includeOralExpression: bulkDto.includeOralExpression,
        autoFillOralExpressionFromSeating:
          bulkDto.autoFillOralExpressionFromSeating,
        customRatings,
        customGuidance,
      };

      const updated = await this.update(ownerId, classId, updateDto);
      results.push(updated);
    }

    return results;
  }

  private mergeRatingsWithLanguage(
    existing: any[],
    newRatings: any[],
    language: LanguageCode,
  ): any[] {
    // If no existing ratings, return new ones
    if (!existing || existing.length === 0) {
      return newRatings;
    }

    // Create a map of existing ratings by min/max for quick lookup
    const existingMap = new Map<string, any>();
    existing.forEach((rating) => {
      const key = `${rating.min}-${rating.max ?? 'inf'}`;
      existingMap.set(key, { ...rating });
    });

    // Update existing ratings with new language values
    newRatings.forEach((newRating) => {
      const key = `${newRating.min}-${newRating.max ?? 'inf'}`;
      const existingRating = existingMap.get(key);

      if (existingRating) {
        // Update only the selected language
        existingRating.ratings[language] = newRating.ratings[language];
      } else {
        // Add new rating if it doesn't exist
        existingMap.set(key, { ...newRating });
      }
    });

    return Array.from(existingMap.values());
  }

  private mergeGuidanceWithLanguage(
    existing: any[],
    newGuidance: any[],
    language: LanguageCode,
  ): any[] {
    // If no existing guidance, return new ones
    if (!existing || existing.length === 0) {
      return newGuidance;
    }

    // Create a map of existing guidance by min/max for quick lookup
    const existingMap = new Map<string, any>();
    existing.forEach((guidance) => {
      const key = `${guidance.min}-${guidance.max ?? 'inf'}`;
      existingMap.set(key, { ...guidance });
    });

    // Update existing guidance with new language values
    newGuidance.forEach((newGuidanceItem) => {
      const key = `${newGuidanceItem.min}-${newGuidanceItem.max ?? 'inf'}`;
      const existingGuidance = existingMap.get(key);

      if (existingGuidance) {
        // Update only the selected language
        existingGuidance.guidance[language] = newGuidanceItem.guidance[language];
      } else {
        // Add new guidance if it doesn't exist
        existingMap.set(key, { ...newGuidanceItem });
      }
    });

    return Array.from(existingMap.values());
  }

  async delete(ownerId: number, classId: number): Promise<void> {
    const settings = await this.findByClassId(ownerId, classId);
    if (!settings) {
      throw new NotFoundException(`Grading settings not found for class ${classId}`);
    }
    await this.gradingSettingsRepository.remove(settings);
  }

  private async validateTotalMaxScore(dto: any): Promise<void> {
    const notebookMax = Number(dto.notebookCorrectionMaxScore ?? 5);
    const dutyMax = Number(dto.dutyMaxScore ?? 5);
    const attendanceMax = Number(dto.attendanceMaxScore ?? 5);
    const behaviorMax = Number(dto.behaviorMaxScore ?? 5);
    const customColumns = dto.customAssessmentColumns ?? [];
    
    const customColumnsTotal = customColumns.reduce((sum: number, col: any) => {
      return sum + Number(col.maxScore ?? 0);
    }, 0);

    const total = notebookMax + dutyMax + attendanceMax + behaviorMax + customColumnsTotal;

    if (total > 20) {
      throw new BadRequestException(
        `مجموع النقاط القصوى يجب ألا يتجاوز 20. المجموع الحالي: ${total}`
      );
    }
  }
}

