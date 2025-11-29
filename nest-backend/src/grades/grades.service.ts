import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade } from './grade.entity';
import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradeResponseDto } from './dto/grade-response.dto';

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Grade)
    private gradeRepository: Repository<Grade>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
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
   * Calculate continuous assessment based on behavior, attendance, duty, and notebook grades
   * Formula: notebook + duty + attendance + behavior (all out of 5, total out of 20)
   * Assessment IDs: notebook_correction=1, duty=2, attendance=3, behavior=4, continuous_assessment=5
   */
  private async updateContinuousAssessment(ownerId: number, studentId: number, classId: number): Promise<void> {
    // Assessment IDs based on frontend definition
    const NOTEBOOK_CORRECTION_ID = 1;
    const DUTY_ID = 2;
    const ATTENDANCE_ID = 3;
    const BEHAVIOR_ID = 4;
    const CONTINUOUS_ASSESSMENT_ID = 5;

    // Get all related grades for this student and class
    const grades = await this.gradeRepository.find({
      where: [
        { ownerId, studentId, classId, assessmentId: NOTEBOOK_CORRECTION_ID },
        { ownerId, studentId, classId, assessmentId: DUTY_ID },
        { ownerId, studentId, classId, assessmentId: ATTENDANCE_ID },
        { ownerId, studentId, classId, assessmentId: BEHAVIOR_ID },
      ],
    });

    const notebookGrade = grades.find(g => g.assessmentId === NOTEBOOK_CORRECTION_ID);
    const dutyGrade = grades.find(g => g.assessmentId === DUTY_ID);
    const attendanceGrade = grades.find(g => g.assessmentId === ATTENDANCE_ID);
    const behaviorGrade = grades.find(g => g.assessmentId === BEHAVIOR_ID);

    const behavior = behaviorGrade ? parseFloat(behaviorGrade.score.toString()) : 0;
    const attendance = attendanceGrade ? parseFloat(attendanceGrade.score.toString()) : 0;
    const duty = dutyGrade ? parseFloat(dutyGrade.score.toString()) : 0;
    const notebook = notebookGrade ? parseFloat(notebookGrade.score.toString()) : 0;

    // Calculate continuous assessment
    // Max scores: behavior=5, attendance=5, duty=5, notebook=5, total=20
    // Simple sum: notebook + duty + attendance + behavior
    const total = behavior + attendance + duty + notebook;
    const finalScore = Math.min(Math.max(total, 0), 20); // Cap at 20, minimum 0

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
    const relatedGrades = [notebookGrade, dutyGrade, attendanceGrade, behaviorGrade].filter(Boolean);
    const mostRecentDate = relatedGrades.length > 0
      ? relatedGrades.reduce((latest, g) => g.date > latest ? g.date : latest, relatedGrades[0].date)
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
}

