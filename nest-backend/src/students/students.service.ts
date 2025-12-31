import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Student } from './student.entity';
import { Class } from '../classes/class.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentResponseDto } from './dto/student-response.dto';
import { BulkCreateStudentsDto } from './dto/bulk-create-students.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
  ) {}

  async create(ownerId: number, createStudentDto: CreateStudentDto): Promise<StudentResponseDto> {
    // Validate class exists if classId is provided
    if (createStudentDto.classId !== undefined && createStudentDto.classId !== null) {
      const classEntity = await this.classRepository.findOne({
        where: { id: createStudentDto.classId, ownerId },
      });
      if (!classEntity) {
        throw new BadRequestException(`Class with ID ${createStudentDto.classId} not found`);
      }
    }

    // Convert dateOfBirth string to Date if provided, and prepare data for entity
    const { dateOfBirth, ...restDto } = createStudentDto;
    const studentData: Partial<Student> = {
      ...restDto,
      ownerId,
      ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
    };

    const student = this.studentRepository.create(studentData);
    const savedStudent = await this.studentRepository.save(student) as Student;
    return this.findOne(ownerId, savedStudent.id);
  }

  async findAll(ownerId: number, filters?: {
    classId?: number;
    group?: number;
  }): Promise<StudentResponseDto[]> {
    const where: Record<string, any> = { ownerId };
    if (filters?.classId) {
      where.classId = filters.classId;
    }
    if (filters?.group) {
      where.group = filters.group;
    }

    const students = await this.studentRepository.find({
      where,
      relations: ['class'],
    });

    return students.map((student) => this.mapToResponseDto(student));
  }

  async findOne(ownerId: number, id: number): Promise<StudentResponseDto> {
    const student = await this.studentRepository.findOne({
      where: { id, ownerId },
      relations: ['class'],
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return this.mapToResponseDto(student);
  }

  async update(ownerId: number, id: number, updateStudentDto: UpdateStudentDto): Promise<StudentResponseDto> {
    const student = await this.studentRepository.findOne({ where: { id, ownerId } });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    // Validate class exists if classId is being updated
    if (updateStudentDto.classId !== undefined && updateStudentDto.classId !== null) {
      const classEntity = await this.classRepository.findOne({
        where: { id: updateStudentDto.classId, ownerId },
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
    
    // Special cases field - update if provided
    if (updateStudentDto.specialCases !== undefined) {
      fieldsToUpdate.specialCases = updateStudentDto.specialCases || null;
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
    
    // Group field - update if provided (1, 2, or null)
    if (updateStudentDto.group !== undefined) {
      fieldsToUpdate.group = updateStudentDto.group ?? null;
    }

    Object.assign(student, fieldsToUpdate);
    await this.studentRepository.save(student);
    return this.findOne(ownerId, id);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    const student = await this.studentRepository.findOne({ where: { id, ownerId } });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    await this.studentRepository.remove(student);
  }

  async bulkCreate(
    ownerId: number,
    bulkCreateDto: BulkCreateStudentsDto,
  ): Promise<{ success: StudentResponseDto[]; failed: Array<{ student: CreateStudentDto; error: string }> }> {
    const success: StudentResponseDto[] = [];
    const failed: Array<{ student: CreateStudentDto; error: string }> = [];

    // Get all class IDs that need validation
    const classIds = bulkCreateDto.students
      .map((s) => s.classId)
      .filter((id) => id !== undefined && id !== null) as number[];
    const uniqueClassIds = [...new Set(classIds)];

    // Validate all classes exist in one query
    const validClasses = await this.classRepository.find({
      where: uniqueClassIds.map((id) => ({ id, ownerId })),
    });
    const validClassIds = new Set(validClasses.map((c) => c.id));

    // Prepare students for batch insert
    const studentsToCreate: Partial<Student>[] = [];

    for (const createStudentDto of bulkCreateDto.students) {
      try {
        // Validate required fields
        if (!createStudentDto.firstName || !createStudentDto.lastName) {
          failed.push({
            student: createStudentDto,
            error: 'الاسم واللقب مطلوبان',
          });
          continue;
        }

        // Validate class exists if provided
        if (createStudentDto.classId !== undefined && createStudentDto.classId !== null) {
          if (!validClassIds.has(createStudentDto.classId)) {
            failed.push({
              student: createStudentDto,
              error: `Class with ID ${createStudentDto.classId} not found`,
            });
            continue;
          }
        }

        // Convert dateOfBirth string to Date if provided
        const { dateOfBirth, ...restDto } = createStudentDto;
        const studentData: Partial<Student> = {
          ...restDto,
          ownerId,
          ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        };

        studentsToCreate.push(studentData);
      } catch (error) {
        failed.push({
          student: createStudentDto,
          error: error instanceof Error ? error.message : 'خطأ غير معروف',
        });
      }
    }

    // Batch insert all valid students
    if (studentsToCreate.length > 0) {
      try {
        const createdStudents = await this.studentRepository.save(
          studentsToCreate.map((data) => this.studentRepository.create(data)),
        );

        // Fetch with relations for response
        const studentIds = createdStudents.map((s) => s.id);
        const studentsWithRelations = await this.studentRepository.find({
          where: studentIds.map((id) => ({ id, ownerId })),
          relations: ['class'],
        });

        success.push(...studentsWithRelations.map((s) => this.mapToResponseDto(s)));
      } catch (error) {
        // If batch insert fails, try individual inserts
        for (const studentData of studentsToCreate) {
          try {
            const student = this.studentRepository.create(studentData);
            const savedStudent = await this.studentRepository.save(student);
            const studentWithRelation = await this.studentRepository.findOne({
              where: { id: savedStudent.id, ownerId },
              relations: ['class'],
            });
            if (studentWithRelation) {
              success.push(this.mapToResponseDto(studentWithRelation));
            }
          } catch (individualError) {
            failed.push({
              student: studentData as any,
              error: individualError instanceof Error ? individualError.message : 'خطأ أثناء الحفظ',
            });
          }
        }
      }
    }

    return { success, failed };
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
      specialCases: student.specialCases,
      classId: student.classId,
      group: student.group,
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

  async importFromExcel(ownerId: number, file: Express.Multer.File): Promise<{
    sheets: Array<{
      sheetName: string;
      detectedRow: number;
      rawData: any[][];
    }>;
  }> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer as any);

      const sheetsInfo: Array<{
        sheetName: string;
        detectedRow: number;
        rawData: any[][];
      }> = [];

      for (const worksheet of workbook.worksheets) {
        const sheetName = worksheet.name;
        const rawData: any[][] = [];

        // Convert worksheet to 2D array
        worksheet.eachRow((row, rowNumber) => {
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

        if (rawData.length === 0) continue;

        const detectedRow = this.findHeaderRow(rawData);

        sheetsInfo.push({
          sheetName,
          detectedRow,
          rawData,
        });
      }

      return { sheets: sheetsInfo };
    } catch (error) {
      console.error('Import Excel Error:', error);
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

  async exportToExcel(ownerId: number, filters?: {
    classId?: number;
    group?: number;
  }): Promise<Buffer> {
    try {
      const students = await this.findAll(ownerId, filters);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('التلاميذ');

      // Prepare data
      const dataToExport = students.map(student => ({
        'رقم الهوية / الكود': student.idNumber || '',
        'اللقب': student.lastName,
        'الاسم': student.firstName,
        'تاريخ الميلاد': student.dateOfBirth || '',
        'مكان الميلاد': student.placeOfBirth || '',
        'الجنس': student.gender === 'male' ? 'ذكر' : student.gender === 'female' ? 'أنثى' : '',
        'معيد': student.isRepeater ? 'نعم' : 'لا',
        'رقم التلميذ': student.studentId || '',
        'القسم': student.class?.name || '',
        'البريد الإلكتروني': student.email || '',
        'رقم الطالب': student.studentNumber || '',
        'ملاحظات عامة': student.generalNotes || ''
      }));

      // Add headers
      const headers = Object.keys(dataToExport[0] || {});
      worksheet.addRow(headers);

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add data rows
      dataToExport.forEach(row => {
        worksheet.addRow(headers.map(header => (row as any)[header] || ''));
      });

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

