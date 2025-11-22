import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { Class } from '../classes/class.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentResponseDto } from './dto/student-response.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<StudentResponseDto> {
    // Validate class exists if classId is provided
    if (createStudentDto.classId !== undefined && createStudentDto.classId !== null) {
      const classEntity = await this.classRepository.findOne({
        where: { id: createStudentDto.classId },
      });
      if (!classEntity) {
        throw new BadRequestException(`Class with ID ${createStudentDto.classId} not found`);
      }
    }

    // Convert dateOfBirth string to Date if provided, and prepare data for entity
    const { dateOfBirth, ...restDto } = createStudentDto;
    const studentData: Partial<Student> = {
      ...restDto,
      ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
    };

    const student = this.studentRepository.create(studentData);
    const savedStudent = await this.studentRepository.save(student) as Student;
    return this.findOne(savedStudent.id);
  }

  async findAll(): Promise<StudentResponseDto[]> {
    const students = await this.studentRepository.find({
      relations: ['class'],
    });

    return students.map((student) => this.mapToResponseDto(student));
  }

  async findOne(id: number): Promise<StudentResponseDto> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['class'],
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return this.mapToResponseDto(student);
  }

  async update(id: number, updateStudentDto: UpdateStudentDto): Promise<StudentResponseDto> {
    const student = await this.studentRepository.findOne({ where: { id } });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    // Validate class exists if classId is being updated
    if (updateStudentDto.classId !== undefined && updateStudentDto.classId !== null) {
      const classEntity = await this.classRepository.findOne({
        where: { id: updateStudentDto.classId },
      });
      if (!classEntity) {
        throw new BadRequestException(`Class with ID ${updateStudentDto.classId} not found`);
      }
    }

    // Only update fields that are explicitly provided in the DTO (not undefined)
    // This prevents overwriting fields with undefined values
    const fieldsToUpdate: Partial<Student> = {};
    
    // Required fields - always update if provided
    if (updateStudentDto.firstName !== undefined) {
      fieldsToUpdate.firstName = updateStudentDto.firstName;
    }
    if (updateStudentDto.lastName !== undefined) {
      fieldsToUpdate.lastName = updateStudentDto.lastName;
    }
    
    // Optional string fields - update if provided, treat empty strings as null
    if (updateStudentDto.email !== undefined) {
      fieldsToUpdate.email = updateStudentDto.email && typeof updateStudentDto.email === 'string' && updateStudentDto.email.trim() !== '' ? updateStudentDto.email.trim() : null;
    }
    if (updateStudentDto.studentNumber !== undefined) {
      fieldsToUpdate.studentNumber = updateStudentDto.studentNumber && typeof updateStudentDto.studentNumber === 'string' && updateStudentDto.studentNumber.trim() !== '' ? updateStudentDto.studentNumber.trim() : null;
    }
    if (updateStudentDto.idNumber !== undefined) {
      fieldsToUpdate.idNumber = updateStudentDto.idNumber && typeof updateStudentDto.idNumber === 'string' && updateStudentDto.idNumber.trim() !== '' ? updateStudentDto.idNumber.trim() : null;
    }
    if (updateStudentDto.placeOfBirth !== undefined) {
      fieldsToUpdate.placeOfBirth = updateStudentDto.placeOfBirth && typeof updateStudentDto.placeOfBirth === 'string' && updateStudentDto.placeOfBirth.trim() !== '' ? updateStudentDto.placeOfBirth.trim() : null;
    }
    if (updateStudentDto.studentId !== undefined) {
      fieldsToUpdate.studentId = updateStudentDto.studentId && typeof updateStudentDto.studentId === 'string' && updateStudentDto.studentId.trim() !== '' ? updateStudentDto.studentId.trim() : null;
    }
    if (updateStudentDto.photo !== undefined) {
      fieldsToUpdate.photo = updateStudentDto.photo && typeof updateStudentDto.photo === 'string' && updateStudentDto.photo.trim() !== '' ? updateStudentDto.photo.trim() : null;
    }
    if (updateStudentDto.generalNotes !== undefined) {
      fieldsToUpdate.generalNotes = updateStudentDto.generalNotes && typeof updateStudentDto.generalNotes === 'string' && updateStudentDto.generalNotes.trim() !== '' ? updateStudentDto.generalNotes.trim() : null;
    }
    
    // Date field - convert string to Date if provided
    if (updateStudentDto.dateOfBirth !== undefined) {
      fieldsToUpdate.dateOfBirth = updateStudentDto.dateOfBirth ? new Date(updateStudentDto.dateOfBirth) : null;
    }
    
    // Enum field - update if provided
    if (updateStudentDto.gender !== undefined) {
      fieldsToUpdate.gender = updateStudentDto.gender || null;
    }
    
    // Boolean field - update if provided
    if (updateStudentDto.isRepeater !== undefined) {
      fieldsToUpdate.isRepeater = updateStudentDto.isRepeater ?? false;
    }
    
    // Optional numeric field - update if provided (null to clear, number to set)
    if (updateStudentDto.classId !== undefined) {
      fieldsToUpdate.classId = updateStudentDto.classId || null;
    }

    Object.assign(student, fieldsToUpdate);
    await this.studentRepository.save(student);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const student = await this.studentRepository.findOne({ where: { id } });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    await this.studentRepository.remove(student);
  }

  private mapToResponseDto(student: Student): StudentResponseDto {
    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      studentNumber: student.studentNumber,
      idNumber: student.idNumber,
      dateOfBirth: student.dateOfBirth ? (student.dateOfBirth instanceof Date ? student.dateOfBirth.toISOString().split('T')[0] : student.dateOfBirth) : undefined,
      placeOfBirth: student.placeOfBirth,
      gender: student.gender,
      isRepeater: student.isRepeater,
      studentId: student.studentId,
      photo: student.photo,
      generalNotes: student.generalNotes,
      classId: student.classId,
      class: student.class
        ? {
            id: student.class.id,
            name: student.class.name,
            level: student.class.level,
            subject: student.class.subject,
          }
        : undefined,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }
}

