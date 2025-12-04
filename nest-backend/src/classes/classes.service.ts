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

