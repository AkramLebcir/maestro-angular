import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './class.entity';
import { Lab } from '../labs/lab.entity';
import { Student } from '../students/student.entity';
import { Grade } from '../grades/grade.entity';
import { Attendance } from '../attendance/attendance.entity';
import { BehaviorEvent } from '../behavior-events/behavior-event.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassResponseDto } from './dto/class-response.dto';

import * as ExcelJS from 'exceljs';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    @InjectRepository(Lab)
    private labRepository: Repository<Lab>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Grade)
    private gradeRepository: Repository<Grade>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(BehaviorEvent)
    private behaviorEventRepository: Repository<BehaviorEvent>,
  ) {}

  async importDigitalization(ownerId: number, file: Express.Multer.File): Promise<{ importedCount: number; createdClasses: number }> {
    try {
      // Load Excel file using exceljs
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer as any);
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new BadRequestException('لا توجد أوراق عمل في ملف Excel');
      }
      
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
      
      // Convert worksheet to 2D array first to ensure proper column alignment
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
              value = value;
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
      
      // Find header row using the same logic as students service
      const headerRowIndex = this.findHeaderRow(rawData);
      if (headerRowIndex === -1) {
        throw new BadRequestException('لم يتم العثور على صف الرأس في ملف Excel. تأكد من وجود أعمدة مثل "رقم التعريف" و "الاسم" و "اللقب"');
      }
      
      // Extract headers from detected header row
      const headers: string[] = rawData[headerRowIndex].map(cell => {
        if (cell === null || cell === undefined) return '';
        return String(cell).trim();
      });
      
      // Convert rows to objects
      const data: any[] = [];
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        const rowData: any = {};
        
        for (let j = 0; j < Math.min(headers.length, row.length); j++) {
          const header = headers[j];
          if (!header || header === '') continue;
          
          let value = row[j];
          // Handle different cell value types
          if (value === null || value === undefined || value === '') {
            rowData[header] = null;
          } else if (value instanceof Date) {
            rowData[header] = value;
          } else {
            rowData[header] = value;
          }
        }
        
        // Only add row if it has at least one non-empty value
        if (Object.keys(rowData).length > 0 && Object.values(rowData).some(v => v !== null && v !== undefined && v !== '')) {
          data.push(rowData);
        }
      }

      // Debug: Log sheet info
      console.log('Total rows in sheet:', data.length);
      if (data.length > 0) {
        console.log('First row keys:', Object.keys(data[0]));
        console.log('First row sample:', JSON.stringify(data[0], null, 2));
      } else {
        console.log('WARNING: No data rows found in Excel file!');
        throw new BadRequestException('لا توجد بيانات في ملف Excel');
      }

      let createdClasses = 0;
      let importedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      const classMap = new Map<string, Class>();
      const processedIdNumbers = new Set<string>(); // Track idNumbers in current import to prevent duplicates

      // Helper to normalize strings and handle Arabic
      const normalize = (str: any): string => {
        if (str === null || str === undefined) return '';
        return String(str).trim();
      };

      // Helper function to find column value with multiple possible names
      const findColumn = (row: any, possibleNames: string[]): any => {
        for (const name of possibleNames) {
          if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
            return row[name];
          }
        }
        return null;
      };

      // Helper function to parse date with multiple formats
      const parseDate = (dateValue: any): Date | null => {
        if (!dateValue) return null;
        
        // If it's already a Date object
        if (dateValue instanceof Date) {
          // Validate the date
          if (!isNaN(dateValue.getTime())) {
            return dateValue;
          }
          return null;
        }

        const dateStr = String(dateValue).trim();
        if (!dateStr) return null;

        // Try Excel serial date format (number of days since 1900-01-01)
        if (typeof dateValue === 'number') {
          try {
            // Excel date serial number
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
            if (!isNaN(date.getTime())) {
              return date;
            }
          } catch (e) {
            // Continue to other parsing methods
          }
        }

        // Try DD/MM/YYYY or DD/MM/YY formats
        const dateMatch = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
        if (dateMatch) {
          const day = parseInt(dateMatch[1], 10);
          const month = parseInt(dateMatch[2], 10) - 1; // Months are 0-indexed
          let year = parseInt(dateMatch[3], 10);
          
          // Handle 2-digit year
          if (year < 100) {
            // For students, assume 2000+ for years 00-49, 1900+ for 50-99
            year += year < 50 ? 2000 : 1900;
          }
          
          const date = new Date(year, month, day);
          if (!isNaN(date.getTime()) && date.getDate() === day && date.getMonth() === month) {
            return date;
          }
        }

        // Try standard Date parser
        const standardDate = new Date(dateStr);
        if (!isNaN(standardDate.getTime())) {
          return standardDate;
        }

        return null;
      };

      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        
        // Skip empty rows
        if (!row || Object.keys(row).length === 0) continue;

        try {
          // Extract الفوج التربوي (Classroom/Section)
          const className = normalize(
            findColumn(row, [
              'الفوج التربوي',
              'الفوج',
              'القسم',
              'Classroom',
              'Section',
              'Class'
            ])
          );

          if (!className) {
            console.log(`Skipping row ${rowIndex + 1} - no class name found`);
            skippedCount++;
            continue;
          }

          // Find or create class
          let classEntity = classMap.get(className);
          if (!classEntity) {
            // Check database
            classEntity = await this.classRepository.findOne({
              where: { name: className, ownerId },
            });

            if (!classEntity) {
              // Determine level from class name
              let level = '1st_year_high'; // Default
              if (className.includes('أولى') || className.includes('1')) {
                level = '1st_year_high';
              } else if (className.includes('ثانية') || className.includes('2')) {
                level = '2nd_year_high';
              } else if (className.includes('ثالثة') || className.includes('3')) {
                level = '3rd_year_high';
              } else if (className.includes('رابعة') || className.includes('4')) {
                level = '4th_year_middle';
              }

              // Create class
              classEntity = this.classRepository.create({
                name: className,
                level: level as any,
                subject: 'عام',
                weeklySessions: 0,
                ownerId,
              });
              classEntity = await this.classRepository.save(classEntity);
              createdClasses++;
              console.log(`Created new class: ${className}`);
            }
            classMap.set(className, classEntity);
          }

          // Extract رقم التعريف أو الكود (Identity Number)
          let idNumberRaw = findColumn(row, [
            'رقم التعريف',
            'رقم التعريف أو الكود',
            'الكود',
            'رقم الهوية',
            'رقم الهوية / الكود',
            'ID',
            'id',
            'identity_number',
            'code'
          ]);

          // Handle numeric ID (convert to string, handle scientific notation)
          let idNumber: string;
          if (typeof idNumberRaw === 'number') {
            // Convert to string without scientific notation
            // Use toFixed(0) to avoid scientific notation for large numbers
            if (idNumberRaw > Number.MAX_SAFE_INTEGER) {
              idNumber = idNumberRaw.toString();
            } else {
              idNumber = Math.floor(idNumberRaw).toString();
            }
          } else {
            idNumber = normalize(idNumberRaw);
          }

          if (!idNumber || idNumber === '') {
            console.log(`Skipping row ${rowIndex + 1} - no ID number found`);
            skippedCount++;
            continue;
          }

          // Check for duplicate idNumber in current import
          if (processedIdNumbers.has(idNumber)) {
            errors.push(`الصف ${rowIndex + 1}: رقم التعريف ${idNumber} مكرر في الملف`);
            skippedCount++;
            continue;
          }

          // Check if student already exists in database with this idNumber
          const existingStudent = await this.studentRepository.findOne({
            where: { idNumber, ownerId },
          });

          if (existingStudent) {
            // Update existing student
            console.log(`Updating existing student with idNumber: ${idNumber}`);
          }

          // Extract اللقب (Last Name)
          const lastName = normalize(
            findColumn(row, [
              'اللقب',
              'Last Name',
              'lastName',
              'last_name',
              'Nom',
              'nom'
            ])
          );

          // Extract الاسم (First Name)
          const firstName = normalize(
            findColumn(row, [
              'الاسم',
              'First Name',
              'firstName',
              'first_name',
              'Prénom',
              'prenom'
            ])
          );

          if (!firstName || !lastName) {
            errors.push(`الصف ${rowIndex + 1}: الاسم أو اللقب مفقود (رقم التعريف: ${idNumber})`);
            skippedCount++;
            continue;
          }

          // Extract الجنس (Gender)
          const genderStr = normalize(
            findColumn(row, [
              'الجنس',
              'Gender',
              'gender',
              'Sexe',
              'sexe'
            ])
          );
          
          let gender: 'male' | 'female' | null = null;
          if (genderStr) {
            const genderLower = genderStr.toLowerCase();
            if (genderLower === 'ذكر' || genderLower === 'male' || genderLower === 'm' || genderLower === 'ذ') {
              gender = 'male';
            } else if (genderLower === 'أنثى' || genderLower === 'أنثى' || genderLower === 'female' || genderLower === 'f' || genderLower === 'أن') {
              gender = 'female';
            }
          }

          // Extract تاريخ الميلاد (Date of Birth)
          const dobRaw = findColumn(row, [
            'تاريخ الميلاد',
            'Date of Birth',
            'dateOfBirth',
            'birth_date',
            'Date de naissance',
            'dateNaissance'
          ]);
          
          const dateOfBirth = parseDate(dobRaw);

          // Registration Number (optional)
          let studentRegNumber = normalize(
            findColumn(row, [
              'رقم التسجيل',
              'Registration',
              'registration',
              'studentNumber',
              'student_number'
            ])
          );
          if (typeof studentRegNumber === 'number') {
            studentRegNumber = String(studentRegNumber);
          }

          // Prepare student data
          const studentData: any = {
            firstName: firstName,
            lastName: lastName,
            idNumber: idNumber,
            studentNumber: studentRegNumber || idNumber,
            gender: gender,
            dateOfBirth: dateOfBirth,
            classId: classEntity.id,
            ownerId,
            studentId: studentRegNumber || idNumber,
          };

          if (existingStudent) {
            // Update existing student
            Object.assign(existingStudent, studentData);
            await this.studentRepository.save(existingStudent);
          } else {
            // Create new student
            const newStudent = this.studentRepository.create(studentData);
            await this.studentRepository.save(newStudent);
          }

          processedIdNumbers.add(idNumber);
          importedCount++;
        } catch (error) {
          console.error(`Error processing row ${rowIndex + 1}:`, error);
          errors.push(`الصف ${rowIndex + 1}: ${error.message || 'خطأ غير معروف'}`);
          skippedCount++;
        }
      }

      // Log summary
      console.log(`Import completed: ${importedCount} imported, ${createdClasses} classes created, ${skippedCount} skipped`);
      if (errors.length > 0) {
        console.log('Errors:', errors);
      }

      return { 
        importedCount, 
        createdClasses
      };
    } catch (error) {
      console.error('Import Digitalization Error:', error);
      throw new BadRequestException(
        `فشل معالجة ملف Excel. يرجى التحقق من تنسيق الملف والمحاولة مرة أخرى. الخطأ: ${error.message || error}`
      );
    }
  }

  private findHeaderRow(rawData: any[][]): number {
    const keyColumns = [
      'رقم التعريف', 'رقم الهوية', 'رقم الهوية / الكود', 'idNumber', 'id_number', 'رقم_الهوية', 'رقم_التعريف',
      'الاسم', 'firstName', 'first_name', 'الاسم الأول', 'first name', 'name',
      'اللقب', 'lastName', 'last_name', 'اسم العائلة', 'family_name', 'last name', 'surname',
      'الفوج التربوي', 'الفوج', 'القسم', 'Classroom', 'Section', 'Class',
      'تاريخ الميلاد', 'تاريخ الازدياد', 'dateOfBirth', 'date_of_birth', 'تاريخ_الميلاد', 'تاريخ_الازدياد', 'birth_date', 'date of birth', 'dob',
      'مكان الميلاد', 'مكان الازدياد', 'placeOfBirth', 'place_of_birth', 'مكان_الميلاد', 'مكان_الازدياد', 'birth_place', 'place of birth',
      'الجنس', 'gender', 'sex', 'sexe', 'النوع', 'الجنس/النوع',
      'معيد', 'مكرر', 'isRepeater', 'is_repeater', 'repeater'
    ];

    const maxRowsToCheck = Math.min(20, rawData.length);
    for (let i = 0; i < maxRowsToCheck; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      const rowStrings = row.map(cell => {
        if (cell === null || cell === undefined) return '';
        return String(cell).trim().toLowerCase();
      });

      let matchCount = 0;
      for (const keyColumn of keyColumns) {
        if (rowStrings.some(cell => cell === keyColumn.toLowerCase() || cell.includes(keyColumn.toLowerCase()))) {
          matchCount++;
        }
      }

      if (matchCount >= 2) {
        return i;
      }
    }

    return -1;
  }

  async create(ownerId: number, createClassDto: CreateClassDto): Promise<ClassResponseDto> {
    // Validate lab exists if labId is provided
    if (createClassDto.labId !== undefined && createClassDto.labId !== null) {
      const lab = await this.labRepository.findOne({
        where: { id: createClassDto.labId, ownerId },
      });
      if (!lab) {
        throw new BadRequestException(`Lab with ID ${createClassDto.labId} not found`);
      }
    }

    const classEntity = this.classRepository.create({
      ...createClassDto,
      ownerId,
    });
    const savedClass = await this.classRepository.save(classEntity);
    return this.findOne(ownerId, savedClass.id);
  }

  async findAll(ownerId: number): Promise<ClassResponseDto[]> {
    const classes = await this.classRepository.find({
      where: { ownerId },
      relations: ['lab', 'students'],
    });

    return classes.map((classEntity) => this.mapToResponseDto(classEntity));
  }

  async findOne(ownerId: number, id: number): Promise<ClassResponseDto> {
    const classEntity = await this.findOwnedClass(ownerId, id, ['lab', 'students']);
    return this.mapToResponseDto(classEntity);
  }

  async update(ownerId: number, id: number, updateClassDto: UpdateClassDto): Promise<ClassResponseDto> {
    const classEntity = await this.findOwnedClass(ownerId, id);

    // Validate lab exists if labId is being updated
    if (updateClassDto.labId !== undefined && updateClassDto.labId !== null) {
      const lab = await this.labRepository.findOne({
        where: { id: updateClassDto.labId, ownerId },
      });
      if (!lab) {
        throw new BadRequestException(`Lab with ID ${updateClassDto.labId} not found`);
      }
    }

    Object.assign(classEntity, updateClassDto);
    await this.classRepository.save(classEntity);
    return this.findOne(ownerId, id);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    const classEntity = await this.findOwnedClass(ownerId, id);
    await this.classRepository.remove(classEntity);
  }

  async getStudentCount(ownerId: number, id: number): Promise<number> {
    const classEntity = await this.findOwnedClass(ownerId, id, ['students']);
    return classEntity.students?.length || 0;
  }

  private mapToResponseDto(classEntity: Class): ClassResponseDto {
    return {
      id: classEntity.id,
      level: classEntity.level,
      name: classEntity.name,
      subject: classEntity.subject,
      labId: classEntity.labId,
      lab: classEntity.lab
        ? {
            id: classEntity.lab.id,
            name: classEntity.lab.name,
            location: classEntity.lab.location,
          }
        : undefined,
      weeklySessions: classEntity.weeklySessions,
      studentCount: classEntity.students?.length || 0,
      createdAt: classEntity.createdAt,
      updatedAt: classEntity.updatedAt,
    };
  }

  private async findOwnedClass(ownerId: number, id: number, relations: string[] = []): Promise<Class> {
    const classEntity = await this.classRepository.findOne({
      where: { id, ownerId },
      relations,
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    return classEntity;
  }

  async getClassSummaryReport(ownerId: number, classId: number): Promise<any> {
    const classEntity = await this.findOwnedClass(ownerId, classId, ['students']);

    // Get all students with their grades
    const students = await this.studentRepository.find({
      where: { classId, ownerId },
      order: { lastName: 'ASC', firstName: 'ASC' },
    });

    // Get all grades for this class
    const grades = await this.gradeRepository.find({
      where: { classId, ownerId },
      relations: ['student'],
    });

    // Get all attendance records for this class
    const attendanceRecords = await this.attendanceRepository.find({
      where: { classId, ownerId },
      relations: ['student'],
    });

    // Get all behavior events for this class
    const behaviorEvents = await this.behaviorEventRepository.find({
      where: { classId, ownerId },
      relations: ['student'],
    });

    // Calculate student grades (average of all assessment types)
    const studentsWithGrades = students.map(student => {
      const studentGrades = grades.filter(g => g.studentId === student.id);
      const totalScore = studentGrades.reduce((sum, g) => sum + parseFloat(g.score.toString()), 0);
      const totalMaxScore = studentGrades.reduce((sum, g) => sum + parseFloat(g.maxScore.toString()), 0);
      const averageGrade = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
      
      return {
        ...student,
        averageGrade,
        grades: studentGrades,
      };
    });

    // Sort by average grade descending
    studentsWithGrades.sort((a, b) => b.averageGrade - a.averageGrade);

    // Calculate attendance statistics
    const attendanceStats = {
      present: attendanceRecords.filter(a => a.status === 'present').length,
      absent: attendanceRecords.filter(a => a.status === 'absent').length,
      late: attendanceRecords.filter(a => a.status === 'late').length,
      excused: attendanceRecords.filter(a => a.status === 'excused').length,
      sick: attendanceRecords.filter(a => a.status === 'left_early').length,
    };

    // Get top 5 students by attendance status
    const attendanceByStudent = students.map(student => {
      const records = attendanceRecords.filter(a => a.studentId === student.id);
      return {
        student,
        present: records.filter(a => a.status === 'present').length,
        absent: records.filter(a => a.status === 'absent').length,
        late: records.filter(a => a.status === 'late').length,
        excused: records.filter(a => a.status === 'excused').length,
        sick: records.filter(a => a.status === 'left_early').length,
      };
    });

    const top5Present = [...attendanceByStudent]
      .sort((a, b) => b.present - a.present)
      .slice(0, 5)
      .map(item => ({ name: `${item.student.firstName} ${item.student.lastName}`, count: item.present }));

    const top5Late = [...attendanceByStudent]
      .sort((a, b) => b.late - a.late)
      .slice(0, 5)
      .map(item => ({ name: `${item.student.firstName} ${item.student.lastName}`, count: item.late }));

    const top5Excused = [...attendanceByStudent]
      .sort((a, b) => b.excused - a.excused)
      .slice(0, 5)
      .map(item => ({ name: `${item.student.firstName} ${item.student.lastName}`, count: item.excused }));

    const top5Sick = [...attendanceByStudent]
      .sort((a, b) => b.sick - a.sick)
      .slice(0, 5)
      .map(item => ({ name: `${item.student.firstName} ${item.student.lastName}`, count: item.sick }));

    // Calculate behavior statistics
    // Positive behaviors: behaviorId 1-5, Negative behaviors: behaviorId 6-10
    const positiveBehaviors = behaviorEvents.filter(e => e.behaviorId >= 1 && e.behaviorId <= 5);
    const negativeBehaviors = behaviorEvents.filter(e => e.behaviorId >= 6 && e.behaviorId <= 10);

    const behaviorByStudent = students.map(student => {
      const events = behaviorEvents.filter(e => e.studentId === student.id);
      return {
        student,
        positive: events.filter(e => e.behaviorId >= 1 && e.behaviorId <= 5).length,
        negative: events.filter(e => e.behaviorId >= 6 && e.behaviorId <= 10).length,
      };
    });

    const top5Positive = [...behaviorByStudent]
      .sort((a, b) => b.positive - a.positive)
      .slice(0, 5)
      .map(item => ({ name: `${item.student.firstName} ${item.student.lastName}`, count: item.positive }));

    const top5Negative = [...behaviorByStudent]
      .sort((a, b) => b.negative - a.negative)
      .slice(0, 5)
      .map(item => ({ name: `${item.student.firstName} ${item.student.lastName}`, count: item.negative }));

    // Calculate weekly attendance distribution (last 16 weeks)
    const weeklyAttendance = this.calculateWeeklyAttendance(attendanceRecords, 16);

    // Calculate weekly behavior distribution (last 16 weeks)
    const weeklyBehavior = this.calculateWeeklyBehavior(behaviorEvents, 16);

    // Calculate gradebook statistics
    // Assessment types: 1=notebook, 2=duty, 3=attendance, 4=behavior, 5=continuous, 6=oral, 8=assignment, 9=test
    const assessmentTypes = [
      { id: 1, name: 'Notebook Correction', nameAr: 'تصحيح الدفتر', weight: 1 },
      { id: 2, name: 'Duty', nameAr: 'الواجب', weight: 1 },
      { id: 3, name: 'Attendance', nameAr: 'الحضور', weight: 1 },
      { id: 4, name: 'Behavior', nameAr: 'السلوك', weight: 1 },
      { id: 5, name: 'Continuous Assessment', nameAr: 'التقييم المستمر', weight: 2 },
      { id: 6, name: 'Oral Expression', nameAr: 'التعبير الشفهي', weight: 1 },
      { id: 8, name: 'Assignment', nameAr: 'الفرض', weight: 1 },
      { id: 9, name: 'Test', nameAr: 'الاختبار', weight: 3 },
    ];

    const gradebookStats = assessmentTypes.map(assessment => {
      const assessmentGrades = grades.filter(g => g.assessmentId === assessment.id);
      if (assessmentGrades.length === 0) return null;

      const scores = assessmentGrades.map(g => parseFloat(g.score.toString()));
      const maxScores = assessmentGrades.map(g => parseFloat(g.maxScore.toString()));
      const percentages = scores.map((score, i) => (score / maxScores[i]) * 100);

      return {
        ...assessment,
        max: Math.max(...percentages),
        min: Math.min(...percentages),
        average: percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
        median: this.calculateMedian(percentages),
        mode: this.calculateMode(percentages),
        totalWeight: assessment.weight,
      };
    }).filter(Boolean);

    // Calculate letter grades distribution
    const letterGrades = studentsWithGrades.map(s => {
      const grade = s.averageGrade;
      if (grade >= 90) return 'A';
      if (grade >= 80) return 'B';
      if (grade >= 70) return 'C';
      if (grade >= 60) return 'D';
      return 'F';
    });

    const gradeDistribution = {
      A: letterGrades.filter(g => g === 'A').length,
      B: letterGrades.filter(g => g === 'B').length,
      C: letterGrades.filter(g => g === 'C').length,
      D: letterGrades.filter(g => g === 'D').length,
      F: letterGrades.filter(g => g === 'F').length,
    };

    return {
      class: {
        id: classEntity.id,
        name: classEntity.name,
        subject: classEntity.subject,
        studentCount: students.length,
      },
      students: studentsWithGrades.map(s => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        averageGrade: s.averageGrade,
      })),
      attendance: {
        overall: attendanceStats,
        weekly: weeklyAttendance,
        top5: {
          present: top5Present,
          late: top5Late,
          excused: top5Excused,
          sick: top5Sick,
        },
      },
      behavior: {
        overall: {
          positive: positiveBehaviors.length,
          negative: negativeBehaviors.length,
        },
        weekly: weeklyBehavior,
        top5: {
          positive: top5Positive,
          negative: top5Negative,
        },
      },
      gradebook: {
        assessments: gradebookStats,
        gradeDistribution,
      },
    };
  }

  private calculateWeeklyAttendance(records: Attendance[], weeks: number): any[] {
    const now = new Date();
    const weeklyData: any[] = [];
    
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekRecords = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= weekStart && recordDate <= weekEnd;
      });

      weeklyData.push({
        week: weekStart.toISOString().split('T')[0],
        present: weekRecords.filter(r => r.status === 'present').length,
        absent: weekRecords.filter(r => r.status === 'absent').length,
        late: weekRecords.filter(r => r.status === 'late').length,
        excused: weekRecords.filter(r => r.status === 'excused').length,
        sick: weekRecords.filter(r => r.status === 'left_early').length,
      });
    }

    return weeklyData;
  }

  private calculateWeeklyBehavior(events: BehaviorEvent[], weeks: number): any[] {
    const now = new Date();
    const weeklyData: any[] = [];
    
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate >= weekStart && eventDate <= weekEnd;
      });

      weeklyData.push({
        week: weekStart.toISOString().split('T')[0],
        positive: weekEvents.filter(e => e.behaviorId >= 1 && e.behaviorId <= 5).length,
        negative: weekEvents.filter(e => e.behaviorId >= 6 && e.behaviorId <= 10).length,
      });
    }

    return weeklyData;
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private calculateMode(values: number[]): number {
    const frequency: { [key: number]: number } = {};
    values.forEach(v => {
      const rounded = Math.round(v);
      frequency[rounded] = (frequency[rounded] || 0) + 1;
    });
    
    let maxFreq = 0;
    let mode = 0;
    Object.keys(frequency).forEach(key => {
      if (frequency[parseInt(key)] > maxFreq) {
        maxFreq = frequency[parseInt(key)];
        mode = parseInt(key);
      }
    });
    
    return mode;
  }
}

