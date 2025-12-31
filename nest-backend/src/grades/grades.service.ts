import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Grade } from './grade.entity';
import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradeResponseDto } from './dto/grade-response.dto';
import { GradingSettingsService } from '../grading-settings/grading-settings.service';

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Grade)
    private gradeRepository: Repository<Grade>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    private gradingSettingsService: GradingSettingsService,
  ) {}

  async create(ownerId: number, createGradeDto: CreateGradeDto): Promise<GradeResponseDto> {
    // Validate student exists and belongs to owner
    const student = await this.studentRepository.findOne({
      where: { id: createGradeDto.studentId, ownerId },
    });
    if (!student) {
      throw new BadRequestException(`Student with ID ${createGradeDto.studentId} not found`);
    }

    // Validate class exists and belongs to owner
    const classEntity = await this.classRepository.findOne({
      where: { id: createGradeDto.classId, ownerId },
    });
    if (!classEntity) {
      throw new BadRequestException(`Class with ID ${createGradeDto.classId} not found`);
    }

    // Convert date string to Date
    const gradeData: Partial<Grade> = {
      ...createGradeDto,
      ownerId,
      date: new Date(createGradeDto.date),
    };

    const grade = this.gradeRepository.create(gradeData);
    const savedGrade = await this.gradeRepository.save(grade);
    
    // Calculate and save continuous assessment if this grade affects it
    // Assessment ID 5 is continuous_assessment - don't recalculate if we're creating it
    const CONTINUOUS_ASSESSMENT_ID = 5;
    if (createGradeDto.assessmentId !== CONTINUOUS_ASSESSMENT_ID) {
      await this.updateContinuousAssessment(ownerId, createGradeDto.studentId, createGradeDto.classId);
    }
    
    return this.findOne(ownerId, savedGrade.id);
  }

  async findAll(ownerId: number, classId?: number): Promise<GradeResponseDto[]> {
    const where: any = { ownerId };
    if (classId !== undefined) {
      where.classId = classId;
    }

    const grades = await this.gradeRepository.find({
      where,
      relations: ['student', 'class'],
      order: { date: 'DESC' },
    });

    return grades.map((grade) => this.mapToResponseDto(grade));
  }

  async findOne(ownerId: number, id: number): Promise<GradeResponseDto> {
    const grade = await this.gradeRepository.findOne({
      where: { id, ownerId },
      relations: ['student', 'class'],
    });

    if (!grade) {
      throw new NotFoundException(`Grade with ID ${id} not found`);
    }

    return this.mapToResponseDto(grade);
  }

  async update(ownerId: number, id: number, updateGradeDto: UpdateGradeDto): Promise<GradeResponseDto> {
    const grade = await this.gradeRepository.findOne({ where: { id, ownerId } });

    if (!grade) {
      throw new NotFoundException(`Grade with ID ${id} not found`);
    }

    // Validate student exists if studentId is being updated
    if (updateGradeDto.studentId !== undefined) {
      const student = await this.studentRepository.findOne({
        where: { id: updateGradeDto.studentId, ownerId },
      });
      if (!student) {
        throw new BadRequestException(`Student with ID ${updateGradeDto.studentId} not found`);
      }
    }

    // Validate class exists if classId is being updated
    if (updateGradeDto.classId !== undefined) {
      const classEntity = await this.classRepository.findOne({
        where: { id: updateGradeDto.classId, ownerId },
      });
      if (!classEntity) {
        throw new BadRequestException(`Class with ID ${updateGradeDto.classId} not found`);
      }
    }

    // Only update fields that are explicitly provided
    const fieldsToUpdate: Partial<Grade> = {};
    
    if (updateGradeDto.studentId !== undefined) {
      fieldsToUpdate.studentId = updateGradeDto.studentId;
    }
    if (updateGradeDto.assessmentId !== undefined) {
      fieldsToUpdate.assessmentId = updateGradeDto.assessmentId;
    }
    if (updateGradeDto.customAssessmentId !== undefined) {
      fieldsToUpdate.customAssessmentId = updateGradeDto.customAssessmentId;
    }
    if (updateGradeDto.classId !== undefined) {
      fieldsToUpdate.classId = updateGradeDto.classId;
    }
    if (updateGradeDto.score !== undefined) {
      fieldsToUpdate.score = updateGradeDto.score;
    }
    if (updateGradeDto.maxScore !== undefined) {
      fieldsToUpdate.maxScore = updateGradeDto.maxScore;
    }
    if (updateGradeDto.date !== undefined) {
      fieldsToUpdate.date = new Date(updateGradeDto.date);
    }
    if (updateGradeDto.notes !== undefined) {
      fieldsToUpdate.notes = updateGradeDto.notes && typeof updateGradeDto.notes === 'string' && updateGradeDto.notes.trim() !== '' 
        ? updateGradeDto.notes.trim() 
        : null;
    }
    if (updateGradeDto.mark !== undefined) {
      fieldsToUpdate.mark = updateGradeDto.mark && typeof updateGradeDto.mark === 'string' && updateGradeDto.mark.trim() !== '' 
        ? updateGradeDto.mark.trim() 
        : null;
    }
    if (updateGradeDto.term !== undefined) {
      fieldsToUpdate.term = updateGradeDto.term;
    }

    Object.assign(grade, fieldsToUpdate);
    await this.gradeRepository.save(grade);
    
    // Calculate and save continuous assessment if this grade affects it
    // Assessment ID 5 is continuous_assessment - don't recalculate if we're updating it
    const CONTINUOUS_ASSESSMENT_ID = 5;
    const finalAssessmentId = updateGradeDto.assessmentId !== undefined ? updateGradeDto.assessmentId : grade.assessmentId;
    if (finalAssessmentId !== CONTINUOUS_ASSESSMENT_ID) {
      const finalStudentId = updateGradeDto.studentId !== undefined ? updateGradeDto.studentId : grade.studentId;
      const finalClassId = updateGradeDto.classId !== undefined ? updateGradeDto.classId : grade.classId;
      await this.updateContinuousAssessment(ownerId, finalStudentId, finalClassId);
    }
    
    return this.findOne(ownerId, id);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    const grade = await this.gradeRepository.findOne({ where: { id, ownerId } });

    if (!grade) {
      throw new NotFoundException(`Grade with ID ${id} not found`);
    }

    const studentId = grade.studentId;
    const classId = grade.classId;
    const assessmentId = grade.assessmentId;

    await this.gradeRepository.remove(grade);
    
    // Recalculate continuous assessment after deletion (unless we deleted the continuous assessment itself)
    const CONTINUOUS_ASSESSMENT_ID = 5;
    if (assessmentId !== CONTINUOUS_ASSESSMENT_ID) {
      await this.updateContinuousAssessment(ownerId, studentId, classId);
    }
  }

  /**
   * Calculate continuous assessment based on grading settings
   */
  private async updateContinuousAssessment(ownerId: number, studentId: number, classId: number): Promise<void> {
    // Assessment IDs based on frontend definition
    const NOTEBOOK_CORRECTION_ID = 1;
    const DUTY_ID = 2;
    const ATTENDANCE_ID = 3;
    const BEHAVIOR_ID = 4;
    const CONTINUOUS_ASSESSMENT_ID = 5;

    // Fetch Grading Settings
    const settings = await this.gradingSettingsService.findByClassId(ownerId, classId);

    // Default Max Scores
    let notebookMax = 5;
    let dutyMax = 5;
    let attendanceMax = 5;
    let behaviorMax = 5;
    let customColumns = [];

    if (settings) {
        notebookMax = Number(settings.notebookCorrectionMaxScore);
        dutyMax = Number(settings.dutyMaxScore);
        attendanceMax = Number(settings.attendanceMaxScore);
        behaviorMax = Number(settings.behaviorMaxScore);
        customColumns = settings.customAssessmentColumns || [];
    }

    // Get all related grades for this student and class
    const standardIds = [NOTEBOOK_CORRECTION_ID, DUTY_ID, ATTENDANCE_ID, BEHAVIOR_ID];
    
    const grades = await this.gradeRepository.find({
      where: [
        { ownerId, studentId, classId, assessmentId: In(standardIds) },
        { ownerId, studentId, classId, customAssessmentId: Not(IsNull()) }
      ],
    });

    const getScore = (assessmentId: number) => {
        const grade = grades.find(g => g.assessmentId === assessmentId);
        return grade ? parseFloat(grade.score.toString()) : 0;
    };

    const notebook = getScore(NOTEBOOK_CORRECTION_ID);
    const duty = getScore(DUTY_ID);
    const attendance = getScore(ATTENDANCE_ID);
    const behavior = getScore(BEHAVIOR_ID);

    let total = 0;
    
    // Add standard components (use Math.min to respect max score settings)
    // We sum the actual score, but logically it shouldn't exceed the max score. 
    // However, if the user entered a score higher than max, we typically count it as is or cap it.
    // The requirement says "Validation... check points... not exceed". That's frontend validation.
    // Here we just sum up what's in the DB. 
    total += notebook;
    total += duty;
    total += attendance;
    total += behavior;

    // Add custom columns
    if (customColumns.length > 0) {
        for (const col of customColumns) {
            // Find grade for this custom column by customAssessmentId
            const grade = grades.find(g => g.customAssessmentId === col.id);
            if (grade) {
                const score = parseFloat(grade.score.toString());
                total += score;
            }
        }
    }

    // Cap at 20
    const finalScore = Math.min(Math.max(total, 0), 20);

    // Find existing continuous assessment grade
    const existingContinuousGrade = await this.gradeRepository.findOne({
      where: {
        ownerId,
        studentId,
        classId,
        assessmentId: CONTINUOUS_ASSESSMENT_ID,
      },
    });

    // Use the most recent date from the related grades, or today's date
    const mostRecentDate = grades.length > 0
      ? grades.reduce((latest, g) => g.date > latest ? g.date : latest, grades[0].date)
      : new Date();

    if (existingContinuousGrade) {
      // Update existing continuous assessment grade
      existingContinuousGrade.score = finalScore;
      existingContinuousGrade.maxScore = 20;
      existingContinuousGrade.date = mostRecentDate;
      await this.gradeRepository.save(existingContinuousGrade);
    } else {
      // Create new continuous assessment grade
      const continuousGrade = this.gradeRepository.create({
        ownerId,
        studentId,
        classId,
        assessmentId: CONTINUOUS_ASSESSMENT_ID,
        score: finalScore,
        maxScore: 20,
        date: mostRecentDate,
        notes: 'محسوب تلقائياً',
      });
      await this.gradeRepository.save(continuousGrade);
    }
  }

  private mapToResponseDto(grade: Grade): GradeResponseDto {
    return {
      id: grade.id,
      studentId: grade.studentId,
      student: grade.student
        ? {
            id: grade.student.id,
            firstName: grade.student.firstName,
            lastName: grade.student.lastName,
            gender: grade.student.gender,
          }
        : undefined,
      assessmentId: grade.assessmentId,
      customAssessmentId: grade.customAssessmentId,
      classId: grade.classId,
      class: grade.class
        ? {
            id: grade.class.id,
            name: grade.class.name,
          }
        : undefined,
      term: grade.term,
      score: typeof grade.score === 'string' ? parseFloat(grade.score) : grade.score,
      maxScore: typeof grade.maxScore === 'string' ? parseFloat(grade.maxScore) : grade.maxScore,
      date: grade.date instanceof Date ? grade.date.toISOString().split('T')[0] : grade.date,
      notes: grade.notes,
      mark: grade.mark,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
    };
  }

  async importFromExcel(ownerId: number, file: Express.Multer.File): Promise<{
    sheets: Array<{
      sheetName: string;
      rawData: any[][];
    }>;
  }> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer as any);

      const sheetsInfo: Array<{
        sheetName: string;
        rawData: any[][];
      }> = [];

      for (const worksheet of workbook.worksheets) {
        const sheetName = worksheet.name;
        const rawData: any[][] = [];

        // Convert worksheet to 2D array
        worksheet.eachRow((row) => {
          const rowData: any[] = [];
          row.eachCell({ includeEmpty: true }, (cell) => {
            let value = cell.value;
            if (value === null || value === undefined) {
              value = '';
            } else if (typeof value === 'object' && 'text' in value) {
              value = value.text;
            } else if (value instanceof Date) {
              value = value.toISOString().split('T')[0];
            }
            rowData.push(value);
          });
          rawData.push(rowData);
        });

        if (rawData.length > 0) {
          sheetsInfo.push({
            sheetName,
            rawData,
          });
        }
      }

      return { sheets: sheetsInfo };
    } catch (error) {
      console.error('Import Excel Error:', error);
      throw new BadRequestException(
        `فشل معالجة ملف Excel. يرجى التحقق من تنسيق الملف والمحاولة مرة أخرى. الخطأ: ${error.message || error}`
      );
    }
  }

  async exportToExcel(
    ownerId: number,
    classId: number,
    excelData: any[][],
  ): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('سجل الدرجات');

      // Add rows
      excelData.forEach(row => {
        worksheet.addRow(row);
      });

      // Style header row
      if (excelData.length > 0) {
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      console.error('Export Excel Error:', error);
      throw new BadRequestException(
        `فشل تصدير البيانات إلى Excel. الخطأ: ${error.message || error}`
      );
    }
  }
}
