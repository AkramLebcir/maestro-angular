import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './attendance.entity';
import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceResponseDto } from './dto/attendance-response.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
  ) {}

  async create(ownerId: number, createAttendanceDto: CreateAttendanceDto): Promise<AttendanceResponseDto> {
    // Validate student exists and belongs to owner
    const student = await this.studentRepository.findOne({
      where: { id: createAttendanceDto.studentId, ownerId },
    });
    if (!student) {
      throw new BadRequestException(`Student with ID ${createAttendanceDto.studentId} not found`);
    }

    // Validate class exists and belongs to owner
    const classEntity = await this.classRepository.findOne({
      where: { id: createAttendanceDto.classId, ownerId },
    });
    if (!classEntity) {
      throw new BadRequestException(`Class with ID ${createAttendanceDto.classId} not found`);
    }

    // Check if attendance record already exists for this student, class, date, and lessonTime
    // Only check for duplicates if lessonTime matches (or both are null/undefined)
    const whereClause: any = {
      ownerId,
      studentId: createAttendanceDto.studentId,
      classId: createAttendanceDto.classId,
      date: new Date(createAttendanceDto.date),
    };

    // If lessonTime is provided, include it in the duplicate check
    if (createAttendanceDto.lessonTime) {
      whereClause.lessonTime = createAttendanceDto.lessonTime;
    } else {
      // If lessonTime is not provided, check for records where lessonTime is null
      whereClause.lessonTime = null;
    }

    const existingRecord = await this.attendanceRepository.findOne({
      where: whereClause,
    });

    if (existingRecord) {
      throw new BadRequestException(
        `Attendance record already exists for student ${createAttendanceDto.studentId} in class ${createAttendanceDto.classId} on ${createAttendanceDto.date}${createAttendanceDto.lessonTime ? ` at ${createAttendanceDto.lessonTime}` : ''}`,
      );
    }

    // Convert date string to Date
    const attendanceData: Partial<Attendance> = {
      ...createAttendanceDto,
      ownerId,
      date: new Date(createAttendanceDto.date),
    };

    const attendance = this.attendanceRepository.create(attendanceData);
    const savedAttendance = await this.attendanceRepository.save(attendance);
    return this.findOne(ownerId, savedAttendance.id);
  }

  async findAll(ownerId: number, query?: { studentId?: number; classId?: number; date?: string }): Promise<AttendanceResponseDto[]> {
    const where: any = { ownerId };

    if (query?.studentId) {
      where.studentId = query.studentId;
    }

    if (query?.classId) {
      where.classId = query.classId;
    }

    if (query?.date) {
      where.date = new Date(query.date);
    }

    const attendanceRecords = await this.attendanceRepository.find({
      where,
      relations: ['student', 'class'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });

    return attendanceRecords.map((record) => this.mapToResponseDto(record));
  }

  async findOne(ownerId: number, id: number): Promise<AttendanceResponseDto> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id, ownerId },
      relations: ['student', 'class'],
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }

    return this.mapToResponseDto(attendance);
  }

  async update(ownerId: number, id: number, updateAttendanceDto: UpdateAttendanceDto): Promise<AttendanceResponseDto> {
    const attendance = await this.attendanceRepository.findOne({ where: { id, ownerId } });

    if (!attendance) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }

    // Validate student exists if studentId is being updated
    if (updateAttendanceDto.studentId !== undefined && updateAttendanceDto.studentId !== null) {
      const student = await this.studentRepository.findOne({
        where: { id: updateAttendanceDto.studentId, ownerId },
      });
      if (!student) {
        throw new BadRequestException(`Student with ID ${updateAttendanceDto.studentId} not found`);
      }
    }

    // Validate class exists if classId is being updated
    if (updateAttendanceDto.classId !== undefined && updateAttendanceDto.classId !== null) {
      const classEntity = await this.classRepository.findOne({
        where: { id: updateAttendanceDto.classId, ownerId },
      });
      if (!classEntity) {
        throw new BadRequestException(`Class with ID ${updateAttendanceDto.classId} not found`);
      }
    }

    // Only update fields that are explicitly provided
    const fieldsToUpdate: Partial<Attendance> = {};

    if (updateAttendanceDto.studentId !== undefined) {
      fieldsToUpdate.studentId = updateAttendanceDto.studentId;
    }
    if (updateAttendanceDto.classId !== undefined) {
      fieldsToUpdate.classId = updateAttendanceDto.classId;
    }
    if (updateAttendanceDto.date !== undefined) {
      fieldsToUpdate.date = new Date(updateAttendanceDto.date);
    }
    if (updateAttendanceDto.status !== undefined) {
      fieldsToUpdate.status = updateAttendanceDto.status;
    }
    if (updateAttendanceDto.lessonTime !== undefined) {
      fieldsToUpdate.lessonTime = updateAttendanceDto.lessonTime || null;
    }
    if (updateAttendanceDto.lessonSubject !== undefined) {
      fieldsToUpdate.lessonSubject = updateAttendanceDto.lessonSubject || null;
    }
    if (updateAttendanceDto.notes !== undefined) {
      fieldsToUpdate.notes = updateAttendanceDto.notes && updateAttendanceDto.notes.trim() !== '' 
        ? updateAttendanceDto.notes.trim() 
        : null;
    }

    Object.assign(attendance, fieldsToUpdate);
    await this.attendanceRepository.save(attendance);
    return this.findOne(ownerId, id);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    const attendance = await this.attendanceRepository.findOne({ where: { id, ownerId } });

    if (!attendance) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }

    await this.attendanceRepository.remove(attendance);
  }

  private mapToResponseDto(attendance: Attendance): AttendanceResponseDto {
    return {
      id: attendance.id,
      studentId: attendance.studentId,
      student: attendance.student
        ? {
            id: attendance.student.id,
            firstName: attendance.student.firstName,
            lastName: attendance.student.lastName,
            photo: attendance.student.photo,
            gender: attendance.student.gender,
          }
        : undefined,
      classId: attendance.classId,
      class: attendance.class
        ? {
            id: attendance.class.id,
            name: attendance.class.name,
          }
        : undefined,
      date: attendance.date instanceof Date 
        ? attendance.date.toISOString().split('T')[0] 
        : attendance.date,
      status: attendance.status,
      lessonTime: attendance.lessonTime,
      lessonSubject: attendance.lessonSubject,
      notes: attendance.notes,
      createdAt: attendance.createdAt,
      updatedAt: attendance.updatedAt,
    };
  }
}

