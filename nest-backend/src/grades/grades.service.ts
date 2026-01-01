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
        
        // Determine the maximum column count by scanning actual rows
        let actualMaxColumn = 0;
        const rowCount = worksheet.actualRowCount || worksheet.rowCount || 100;
        
        // First pass: find maximum column count
        for (let rowNum = 1; rowNum <= Math.min(rowCount, 100); rowNum++) {
          const row = worksheet.getRow(rowNum);
          if (!row) continue;
          
          if (row.cellCount > actualMaxColumn) {
            actualMaxColumn = row.cellCount;
          }
          // Also check actual column numbers in use
          row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            if (colNumber > actualMaxColumn) {
              actualMaxColumn = colNumber;
            }
          });
        }
        
        // Ensure minimum of 10 columns to handle most cases
        actualMaxColumn = Math.max(actualMaxColumn, 10);
        
        // Convert worksheet to 2D array with proper column alignment
        const rawData: any[][] = [];
        
        for (let rowNum = 1; rowNum <= Math.min(rowCount, 1000); rowNum++) {
          const row = worksheet.getRow(rowNum);
          if (!row) continue;
          
          const rowData: any[] = [];
          for (let colNum = 1; colNum <= actualMaxColumn; colNum++) {
            const cell = row.getCell(colNum);
            let value = cell.value;
            
            if (value === null || value === undefined) {
              value = '';
            } else if (typeof value === 'object' && value !== null) {
              if ('text' in value) {
                value = value.text;
              } else if ('result' in value && typeof value.result !== 'undefined') {
                value = value.result;
              } else if (value instanceof Date) {
                value = value.toISOString().split('T')[0];
              } else {
                value = String(value);
              }
            }
            rowData.push(value);
          }
          
          // Only add non-empty rows
          if (rowData.some(cell => cell !== '' && cell !== null && cell !== undefined)) {
            rawData.push(rowData);
          }
        }

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

  async exportProcessedExcel(
    ownerId: number,
    payload: {
      processedExcelData: any[];
      processedSheetsData: Array<{ sheetName: string; data: any[] }>;
      gradeErrors: any[];
      selectedLanguage?: string;
      selectedLevel?: string;
    },
  ): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();

      // Sheet 0: تقرير أخطاء النقاط
      if (payload.gradeErrors && payload.gradeErrors.length > 0) {
        const errorSheet = workbook.addWorksheet('GradeErrors');
        errorSheet.addRow(['#', 'الاسم', 'الصفحة', 'العمود', 'القيمة', 'الخطأ']);

        // Style header row
        errorSheet.getRow(1).font = { bold: true };
        errorSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };

        payload.gradeErrors.forEach((student: any, studentIndex: number) => {
          student.errors.forEach((error: any) => {
            errorSheet.addRow([
              studentIndex + 1,
              `${student.firstName || ''} ${student.lastName || ''}`.trim() || '-',
              student.sheetName || '-',
              error.columnHeader || '-',
              error.value !== null && error.value !== undefined && error.value !== '' ? error.value : '-',
              error.error || '-'
            ]);
          });
        });
      }

      // Process each sheet
      if (payload.processedSheetsData && payload.processedSheetsData.length > 0) {
        payload.processedSheetsData.forEach((sheetInfo, sheetIndex) => {
          const sheetData = sheetInfo.data;
          if (!sheetData || sheetData.length === 0) return;

          // Get all unique column headers
          const allColumnHeaders = new Set<string>();
          sheetData.forEach((row: any) => {
            if (row.gradeColumns) {
              row.gradeColumns.forEach((col: any) => {
                if (col.header && !allColumnHeaders.has(String(col.header))) {
                  allColumnHeaders.add(String(col.header));
                }
              });
            }
          });

          // Build headers
          const headers: any[] = ['#', 'رقم الهوية', 'الاسم', 'اللقب'];

          // Map headers based on language
          const lang = payload.selectedLanguage || 'AR';
          const mapHeaderToTranslated = (header: string): string => {
            const headerStr = String(header).trim();
            if (headerStr === '01' || headerStr === '1') {
              if (lang === 'FR') return 'Évaluation continue';
              if (lang === 'EN') return 'Continuous Assessment';
              return 'التقييم المستمر';
            } else if (headerStr === '02' || headerStr === '2') {
              if (lang === 'FR') return 'Travaux pratiques ou Expression orale';
              if (lang === 'EN') return 'Practical Work or Oral Expression';
              return 'أعمال تطبيقية أو تعبير شفوي';
            } else if (headerStr === '03' || headerStr === '3') {
              if (lang === 'FR') return 'Moyenne des devoirs';
              if (lang === 'EN') return 'Assignment Average';
              return 'معدل الفروض';
            } else if (headerStr === '09' || headerStr === '9') {
              if (lang === 'FR') return 'Examen';
              if (lang === 'EN') return 'Test';
              return 'الاختبار';
            }
            return headerStr;
          };

          const gradeHeaders = Array.from(allColumnHeaders).map(mapHeaderToTranslated);
          headers.push(...gradeHeaders);
          headers.push('المعدل', 'الملاحظات', 'الإرشادات');

          const excelData: any[] = [headers];

          // Data rows
          sheetData.forEach((row: any, index: number) => {
            const rowData: any[] = [
              index + 1,
              row.id || '-',
              row.firstName || '-',
              row.lastName || '-'
            ];

            // Map translated headers back to original
            const mapTranslatedToOriginal = (translatedHeader: string): string => {
              if (translatedHeader === 'التقييم المستمر' || translatedHeader === 'Évaluation continue' || translatedHeader === 'Continuous Assessment') {
                return '01';
              }
              if (translatedHeader === 'أعمال تطبيقية أو تعبير شفوي' || translatedHeader === 'Travaux pratiques ou Expression orale' || translatedHeader === 'Practical Work or Oral Expression') {
                return '02';
              }
              if (translatedHeader === 'معدل الفروض' || translatedHeader === 'Moyenne des devoirs' || translatedHeader === 'Assignment Average') {
                return '03';
              }
              if (translatedHeader === 'الاختبار' || translatedHeader === 'Examen' || translatedHeader === 'Test') {
                return '09';
              }
              return translatedHeader;
            };

            gradeHeaders.forEach(translatedHeader => {
              const originalHeader = mapTranslatedToOriginal(translatedHeader);
              const gradeCol = row.gradeColumns?.find((col: any) => {
                const colHeader = String(col.header).trim();
                return colHeader === originalHeader || colHeader === translatedHeader;
              });
              const value = gradeCol?.value;
              if (value !== undefined && value !== null && value !== '') {
                const numValue = parseFloat(String(value));
                rowData.push(isNaN(numValue) ? value : numValue);
              } else {
                rowData.push('-');
              }
            });

            rowData.push(
              row.average?.toFixed(2) || '-',
              row.observation || '-',
              row.guidance || '-'
            );

            excelData.push(rowData);
          });

          // Create worksheet
          let cleanSheetName = sheetInfo.sheetName || `Sheet${sheetIndex + 1}`;
          cleanSheetName = cleanSheetName.substring(0, 31);
          cleanSheetName = cleanSheetName.replace(/[\\\/\?\*\[\]]/g, '_');
          const ws = workbook.addWorksheet(cleanSheetName);

          // Add rows
          excelData.forEach(row => {
            ws.addRow(row);
          });

          // Style header row
          ws.getRow(1).font = { bold: true };
          ws.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };

          // Apply color coding to grade columns
          const firstGradeColIndex = 5;
          const lastGradeColIndex = firstGradeColIndex + gradeHeaders.length - 1;

          for (let rowIndex = 2; rowIndex <= excelData.length; rowIndex++) {
            const row = ws.getRow(rowIndex);
            for (let colIndex = firstGradeColIndex; colIndex <= lastGradeColIndex; colIndex++) {
              const cell = row.getCell(colIndex);
              if (!cell || !cell.value) continue;

              const rawValue = cell.value;
              const strValue = rawValue !== undefined && rawValue !== null ? String(rawValue).trim() : '';
              const numValue = parseFloat(strValue);

              if (strValue === '' || strValue === '-') {
                continue;
              }

              let fgColor = 'FFC7CE'; // red

              if (!isNaN(numValue) && numValue >= 0.25 && numValue <= 20) {
                fgColor = 'C6EFCE'; // green
              } else if (strValue.includes('غ م') || (!isNaN(numValue) && numValue === 0)) {
                fgColor = 'FFEB9C'; // orange
              }

              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: fgColor }
              };
            }
          }
        });
      } else {
        // Fallback: single sheet with all data
        const allColumnHeaders = new Set<string>();
        payload.processedExcelData.forEach(row => {
          if (row.gradeColumns) {
            row.gradeColumns.forEach((col: any) => {
              if (col.header && !allColumnHeaders.has(String(col.header))) {
                allColumnHeaders.add(String(col.header));
              }
            });
          }
        });

        const headers: any[] = ['#', 'رقم الهوية', 'الاسم', 'اللقب'];
        const lang = payload.selectedLanguage || 'AR';
        const mapHeaderToTranslated = (header: string): string => {
          const headerStr = String(header).trim();
          if (headerStr === '01' || headerStr === '1') {
            if (lang === 'FR') return 'Évaluation continue';
            if (lang === 'EN') return 'Continuous Assessment';
            return 'التقييم المستمر';
          } else if (headerStr === '02' || headerStr === '2') {
            if (lang === 'FR') return 'Travaux pratiques ou Expression orale';
            if (lang === 'EN') return 'Practical Work or Oral Expression';
            return 'أعمال تطبيقية أو تعبير شفوي';
          } else if (headerStr === '03' || headerStr === '3') {
            if (lang === 'FR') return 'Moyenne des devoirs';
            if (lang === 'EN') return 'Assignment Average';
            return 'معدل الفروض';
          } else if (headerStr === '09' || headerStr === '9') {
            if (lang === 'FR') return 'Examen';
            if (lang === 'EN') return 'Test';
            return 'الاختبار';
          }
          return headerStr;
        };

        const gradeHeaders = Array.from(allColumnHeaders).map(mapHeaderToTranslated);
        headers.push(...gradeHeaders);
        headers.push('المعدل', 'الملاحظات', 'الإرشادات');

        const excelData: any[] = [headers];

        payload.processedExcelData.forEach((row, index) => {
          const rowData: any[] = [
            index + 1,
            row.id || '-',
            row.firstName || '-',
            row.lastName || '-'
          ];

          const mapTranslatedToOriginal = (translatedHeader: string): string => {
            if (translatedHeader === 'التقييم المستمر' || translatedHeader === 'Évaluation continue' || translatedHeader === 'Continuous Assessment') {
              return '01';
            }
            if (translatedHeader === 'أعمال تطبيقية أو تعبير شفوي' || translatedHeader === 'Travaux pratiques ou Expression orale' || translatedHeader === 'Practical Work or Oral Expression') {
              return '02';
            }
            if (translatedHeader === 'معدل الفروض' || translatedHeader === 'Moyenne des devoirs' || translatedHeader === 'Assignment Average') {
              return '03';
            }
            if (translatedHeader === 'الاختبار' || translatedHeader === 'Examen' || translatedHeader === 'Test') {
              return '09';
            }
            return translatedHeader;
          };

          gradeHeaders.forEach(translatedHeader => {
            const originalHeader = mapTranslatedToOriginal(translatedHeader);
            const gradeCol = row.gradeColumns?.find((col: any) => {
              const colHeader = String(col.header).trim();
              return colHeader === originalHeader || colHeader === translatedHeader;
            });
            const value = gradeCol?.value;
            if (value !== undefined && value !== null && value !== '') {
              const numValue = parseFloat(String(value));
              rowData.push(isNaN(numValue) ? value : numValue);
            } else {
              rowData.push('-');
            }
          });

          rowData.push(
            row.average?.toFixed(2) || '-',
            row.observation || '-',
            row.guidance || '-'
          );

          excelData.push(rowData);
        });

        const ws = workbook.addWorksheet('النتائج المعالجة');
        excelData.forEach(row => {
          ws.addRow(row);
        });

        ws.getRow(1).font = { bold: true };
        ws.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };

        const firstGradeColIndex = 5;
        const lastGradeColIndex = firstGradeColIndex + gradeHeaders.length - 1;

        for (let rowIndex = 2; rowIndex <= excelData.length; rowIndex++) {
          const row = ws.getRow(rowIndex);
          for (let colIndex = firstGradeColIndex; colIndex <= lastGradeColIndex; colIndex++) {
            const cell = row.getCell(colIndex);
            if (!cell || !cell.value) continue;

            const rawValue = cell.value;
            const strValue = rawValue !== undefined && rawValue !== null ? String(rawValue).trim() : '';
            const numValue = parseFloat(strValue);

            if (strValue === '' || strValue === '-') {
              continue;
            }

            let fgColor = 'FFC7CE';

            if (!isNaN(numValue) && numValue >= 0.25 && numValue <= 20) {
              fgColor = 'C6EFCE';
            } else if (strValue.includes('غ م') || (!isNaN(numValue) && numValue === 0)) {
              fgColor = 'FFEB9C';
            }

            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: fgColor }
            };
          }
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      console.error('Export Processed Excel Error:', error);
      throw new BadRequestException(
        `فشل تصدير البيانات المعالجة إلى Excel. الخطأ: ${error.message || error}`
      );
    }
  }

  async exportProcessedExcelWithOriginalStructure(
    ownerId: number,
    originalFile: Express.Multer.File,
    payload: {
      processedSheetsData: Array<{ sheetName: string; data: any[] }>;
      selectedLanguage?: string;
    },
  ): Promise<Buffer> {
    try {
      const originalWorkbook = new ExcelJS.Workbook();
      await originalWorkbook.xlsx.load(originalFile.buffer as any);

      const workbook = new ExcelJS.Workbook();

      // Process each sheet from original file
      for (const originalWorksheet of originalWorkbook.worksheets) {
        const sheetName = originalWorksheet.name;
        const sheetData: any[][] = [];

        // Convert worksheet to 2D array
        originalWorksheet.eachRow((row) => {
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
          sheetData.push(rowData);
        });

        if (!sheetData || sheetData.length === 0) {
          const ws = workbook.addWorksheet(sheetName);
          continue;
        }

        // Find header row
        let headerRow = -1;
        const priorityRows = [6, 7, 8];
        for (const rowIndex of priorityRows) {
          if (rowIndex < sheetData.length) {
            const row = sheetData[rowIndex];
            if (Array.isArray(row) && row.some((cell: any) => {
              const cellStr = String(cell || '').toLowerCase();
              return cellStr.includes('name') || 
                     cellStr.includes('اسم') || 
                     cellStr.includes('nom') ||
                     cellStr.includes('score') ||
                     cellStr.includes('درجة') ||
                     cellStr.includes('obs') ||
                     cellStr.includes('ملاحظات') ||
                     cellStr.includes('cons') ||
                     cellStr.includes('إرشادات');
            })) {
              headerRow = rowIndex;
              break;
            }
          }
        }

        if (headerRow === -1) {
          for (let i = 0; i < Math.min(15, sheetData.length); i++) {
            if (priorityRows.includes(i)) continue;
            const row = sheetData[i];
            if (Array.isArray(row) && row.some((cell: any) => {
              const cellStr = String(cell || '').toLowerCase();
              return cellStr.includes('name') || 
                     cellStr.includes('اسم') || 
                     cellStr.includes('nom') ||
                     cellStr.includes('score') ||
                     cellStr.includes('درجة');
            })) {
              headerRow = i;
              break;
            }
          }
        }

        if (headerRow === -1) {
          headerRow = 0;
        }

        const headers = sheetData[headerRow] || [];

        // Find notes and guidance columns
        let notesColIndex = -1;
        let guidanceColIndex = -1;

        for (let colIndex = 0; colIndex < headers.length; colIndex++) {
          const header = String(headers[colIndex] || '').toLowerCase().trim();

          if (notesColIndex === -1) {
            if (header === 'obs' || 
                header === 'ratings' || 
                header === 'تقديرات' ||
                header.includes('obs') || 
                header.includes('ratings') || 
                header.includes('تقديرات') ||
                header.includes('observation') ||
                header.includes('ملاحظات')) {
              notesColIndex = colIndex;
            }
          }

          if (guidanceColIndex === -1) {
            if (header === 'cons' || 
                header === 'guidance' || 
                header === 'إرشادات' ||
                header.includes('cons') || 
                header.includes('guidance') || 
                header.includes('إرشادات')) {
              guidanceColIndex = colIndex;
            }
          }
        }

        // Add columns if not found
        const lang = payload.selectedLanguage || 'AR';
        if (notesColIndex === -1) {
          notesColIndex = headers.length;
          if (lang === 'FR') {
            headers.push('Appréciation');
          } else if (lang === 'EN') {
            headers.push('Ratings');
          } else {
            headers.push('التقديرات');
          }
          for (let i = 0; i < sheetData.length; i++) {
            while (sheetData[i].length <= notesColIndex) {
              sheetData[i].push('');
            }
          }
        }

        if (guidanceColIndex === -1) {
          guidanceColIndex = headers.length;
          if (lang === 'FR') {
            headers.push('Conseils');
          } else if (lang === 'EN') {
            headers.push('Guidance');
          } else {
            headers.push('الإرشادات');
          }
          for (let i = 0; i < sheetData.length; i++) {
            while (sheetData[i].length <= guidanceColIndex) {
              sheetData[i].push('');
            }
          }
        }

        sheetData[headerRow] = headers;

        // Map processed data
        const sheetProcessedData = payload.processedSheetsData.find(s => s.sheetName === sheetName);
        const processedDataMap = new Map<string, { observation: string; guidance: string }>();

        if (sheetProcessedData && sheetProcessedData.data) {
          sheetProcessedData.data.forEach((row: any) => {
            const key1 = `${row.firstName || ''}_${row.lastName || ''}_${row.id || ''}`.trim().toLowerCase();
            const key2 = `${row.firstName || ''}_${row.lastName || ''}`.trim().toLowerCase();
            const key3 = `${row.lastName || ''}_${row.firstName || ''}`.trim().toLowerCase();
            const key4 = `${row.id || ''}`.trim().toLowerCase();

            const data = {
              observation: row.observation || '',
              guidance: row.guidance || '',
            };

            processedDataMap.set(key1, data);
            if (key2 !== key1) processedDataMap.set(key2, data);
            if (key3 !== key2 && key3 !== key1) processedDataMap.set(key3, data);
            if (key4 && key4 !== key1 && key4 !== key2 && key4 !== key3) processedDataMap.set(key4, data);
          });
        }

        // Fill data into rows
        for (let rowIndex = headerRow + 1; rowIndex < sheetData.length; rowIndex++) {
          const row = sheetData[rowIndex];
          if (!row || row.length === 0) continue;

          let firstName = '';
          let lastName = '';
          let id = '';

          for (let colIndex = 0; colIndex < headers.length; colIndex++) {
            const header = String(headers[colIndex] || '').toLowerCase().trim();

            if (!firstName && (
              header === 'prenom' || 
              header.includes('prenom') ||
              header.includes('firstname') || 
              (header.includes('الاسم') && !header.includes('اللقب'))
            )) {
              firstName = String(row[colIndex] || '').trim();
            }

            if (!lastName && (
              header === 'nom' || 
              (header.includes('nom') && !header.includes('prenom')) ||
              header.includes('lastname') || 
              header.includes('اللقب')
            )) {
              lastName = String(row[colIndex] || '').trim();
            }

            if (!id && (
              header === 'matricule' ||
              header.includes('matricule') ||
              header.includes('id') || 
              header.includes('رقم') || 
              header.includes('code')
            )) {
              id = String(row[colIndex] || '').trim();
            }
          }

          let matchedData = processedDataMap.get(`${firstName}_${lastName}_${id}`.trim().toLowerCase());
          if (!matchedData) {
            matchedData = processedDataMap.get(`${firstName}_${lastName}`.trim().toLowerCase());
          }
          if (!matchedData) {
            matchedData = processedDataMap.get(`${lastName}_${firstName}`.trim().toLowerCase());
          }
          if (!matchedData && id) {
            matchedData = processedDataMap.get(id.trim().toLowerCase());
          }

          if (notesColIndex !== -1) {
            while (row.length <= notesColIndex) {
              row.push('');
            }
            if (matchedData) {
              row[notesColIndex] = matchedData.observation || '';
            }
          }

          if (guidanceColIndex !== -1) {
            while (row.length <= guidanceColIndex) {
              row.push('');
            }
            if (matchedData) {
              row[guidanceColIndex] = matchedData.guidance || '';
            }
          }
        }

        // Create worksheet
        let cleanSheetName = sheetName || `Sheet${workbook.worksheets.length + 1}`;
        cleanSheetName = cleanSheetName.substring(0, 31);
        cleanSheetName = cleanSheetName.replace(/[\\\/\?\*\[\]]/g, '_');
        const ws = workbook.addWorksheet(cleanSheetName);

        sheetData.forEach(row => {
          ws.addRow(row);
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      console.error('Export Processed Excel With Original Structure Error:', error);
      throw new BadRequestException(
        `فشل تصدير البيانات مع الحفاظ على البنية الأصلية. الخطأ: ${error.message || error}`
      );
    }
  }
}
