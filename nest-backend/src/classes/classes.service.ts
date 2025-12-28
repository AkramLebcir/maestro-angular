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

import * as XLSX from 'xlsx';

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
      // Use cellDates: true to let xlsx handle date parsing
      const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      // Use raw: false to get formatted values
      const data = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: null });

      // Debug: Log sheet info
      console.log('Total rows in sheet:', data.length);
      if (data.length > 0) {
        console.log('First row keys:', Object.keys(data[0]));
        console.log('First row sample:', JSON.stringify(data[0], null, 2));
        console.log('All column names in first row:', Object.keys(data[0]));
      } else {
        console.log('WARNING: No data rows found in Excel file!');
      }

      let createdClasses = 0;
      let importedCount = 0;

      const classMap = new Map<string, Class>();

      // Helper to normalize strings
      const normalize = (str: any) => (str ? String(str).trim() : '');

      for (const row of data) {
        // Skip empty rows
        if (!row) continue;

        // Try different possible column name variations
        const className = normalize(row['الفوج التربوي']) || normalize(row['الفوج']) || normalize((row as any)['الفوج التربوي']);
        if (!className) {
          console.log('Skipping row - no class name found:', Object.keys(row));
          continue;
        }

        let classEntity = classMap.get(className);
        if (!classEntity) {
          // Check database
          classEntity = await this.classRepository.findOne({
            where: { name: className, ownerId },
          });

          if (!classEntity) {
            // Determine level
            let level = '1st_year_high'; // Default
            if (className.includes('أولى')) level = '1st_year_high';
            else if (className.includes('ثانية')) level = '2nd_year_high';
            else if (className.includes('ثالثة')) level = '3rd_year_high';

            // Create class
            classEntity = this.classRepository.create({
              name: className,
              level: level as any, // Cast to match enum
              subject: 'عام', // Default subject
              weeklySessions: 0,
              ownerId,
            });
            classEntity = await this.classRepository.save(classEntity);
            createdClasses++;
          }
          classMap.set(className, classEntity);
        }

        // Process Student - try different column name variations
        let idNumber = row['رقم التعريف'] || (row as any)['رقم التعريف'] || row['ID'] || (row as any)['id'];
        // Handle scientific notation or numeric ID
        if (typeof idNumber === 'number') {
            idNumber = String(idNumber);
        } else {
            idNumber = normalize(idNumber);
        }
        
        if (!idNumber || idNumber === '') {
          console.log('Skipping row - no ID number found');
          continue; // Skip if no ID
        }

        // Registration Number (if exists, otherwise empty or use ID)
        let studentRegNumber = row['رقم التسجيل'] || (row as any)['رقم التسجيل'] || row['Registration'] || (row as any)['registration'];
        if (typeof studentRegNumber === 'number') {
             studentRegNumber = String(studentRegNumber);
        } else {
             studentRegNumber = normalize(studentRegNumber);
        }

        const genderStr = normalize(row['الجنس'] || (row as any)['الجنس'] || row['Gender'] || (row as any)['gender']);
        const gender: 'male' | 'female' = (genderStr === 'ذكر' || genderStr === 'male') ? 'male' : 'female';
        
        // Date parsing
        const dobRaw = row['تاريخ الميلاد'] || (row as any)['تاريخ الميلاد'] || row['Date of Birth'] || (row as any)['dateOfBirth'];
        let dateOfBirth: Date | null = null;
        
        if (dobRaw instanceof Date) {
          dateOfBirth = dobRaw;
        } else if (dobRaw) {
          // Try manual parsing for DD/MM/YY or DD/MM/YYYY
          const dobStr = String(dobRaw).trim();
          // Regex for DD/MM/YYYY or DD/MM/YY or D/M/YY etc.
          const dateMatch = dobStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
          
          if (dateMatch) {
            const day = parseInt(dateMatch[1], 10);
            const month = parseInt(dateMatch[2], 10) - 1; // Months are 0-indexed in JS
            let year = parseInt(dateMatch[3], 10);
            
            // Handle 2 digit year
            if (year < 100) {
              // Pivot year 50: 50-99 -> 1950-1999, 00-49 -> 2000-2049
              // But for students, likely 2000+
              year += 2000; 
            }
            
            dateOfBirth = new Date(year, month, day);
          } else {
            // Try standard parser
            const d = new Date(dobStr);
            if (!isNaN(d.getTime())) {
              dateOfBirth = d;
            }
          }
        }

        // Check if student exists by Identity Number (idNumber)
        let student = await this.studentRepository.findOne({
          where: { idNumber, ownerId },
        });

        const firstName = normalize(row['الاسم'] || (row as any)['الاسم'] || row['First Name'] || (row as any)['firstName']);
        const lastName = normalize(row['اللقب'] || (row as any)['اللقب'] || row['Last Name'] || (row as any)['lastName']);

        if (!firstName || !lastName) {
          console.log('Skipping row - missing name:', { firstName, lastName, idNumber });
          continue;
        }

        const studentData = {
          firstName: firstName,
          lastName: lastName,
          idNumber: idNumber,
          studentNumber: studentRegNumber || idNumber, // Fallback to ID number if reg number missing
          gender: gender,
          dateOfBirth: dateOfBirth,
          classId: classEntity.id,
          ownerId,
          studentId: studentRegNumber || idNumber, 
        };

        if (student) {
          // Update
          Object.assign(student, studentData);
        } else {
          // Create
          student = this.studentRepository.create(studentData);
        }

        await this.studentRepository.save(student);
        importedCount++;
      }

      return { importedCount, createdClasses };
    } catch (error) {
      console.error('Import Digitalization Error:', error);
      throw new BadRequestException('Failed to process Excel file. Please check the file format and try again. Error: ' + (error.message || error));
    }
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

