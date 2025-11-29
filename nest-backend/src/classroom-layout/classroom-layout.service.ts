import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ClassroomLayout, TableType } from './entities/classroom-layout.entity';
import { Desk } from './entities/desk.entity';
import { DeskAssignment, SeatPosition } from './entities/desk-assignment.entity';
import { Class } from '../classes/class.entity';
import { Student } from '../students/student.entity';
import { CreateLayoutDto } from './dto/create-layout.dto';
import { UpdateLayoutDto } from './dto/update-layout.dto';
import { SaveAssignmentsDto } from './dto/save-assignments.dto';
import { UpdateDeskPositionsDto } from './dto/update-desk-positions.dto';

export interface LayoutResponse {
  layout: {
    id: number;
    classId: number;
    rows: number;
    tableType: TableType;
    settings?: any;
  };
  desks: Array<{
    id: number;
    row: number;
    column: number;
    capacity: number;
    x: number;
    y: number;
    label: string;
    assignments: Array<{
      id: number;
      studentId: number;
      student: {
        id: number;
        firstName: string;
        lastName: string;
        photo?: string;
      };
      seatPosition: SeatPosition;
    }>;
  }>;
}

@Injectable()
export class ClassroomLayoutService {
  private readonly logger = new Logger(ClassroomLayoutService.name);

  constructor(
    @InjectRepository(ClassroomLayout)
    private readonly layoutRepository: Repository<ClassroomLayout>,
    @InjectRepository(Desk)
    private readonly deskRepository: Repository<Desk>,
    @InjectRepository(DeskAssignment)
    private readonly assignmentRepository: Repository<DeskAssignment>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  /**
   * إنشاء تخطيط جديد للقاعة
   */
  async createLayout(ownerId: number, createDto: CreateLayoutDto): Promise<LayoutResponse> {
    // التحقق من وجود القسم
    const classEntity = await this.classRepository.findOne({
      where: { id: createDto.classId, ownerId },
    });
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${createDto.classId} not found`);
    }

    // التحقق من صحة عدد الصفوف
    if (createDto.rows !== 3 && createDto.rows !== 4) {
      throw new BadRequestException('عدد الصفوف يجب أن يكون 3 أو 4');
    }

    // حذف التخطيط القديم إن وجد
    const existingLayout = await this.layoutRepository.findOne({
      where: { classId: createDto.classId, ownerId },
      relations: ['desks'],
    });

    if (existingLayout) {
      await this.layoutRepository.remove(existingLayout);
    }

    // إنشاء التخطيط الجديد
    const layout = this.layoutRepository.create({
      ownerId,
      classId: createDto.classId,
      rows: createDto.rows,
      tableType: createDto.tableType,
      settings: createDto.settings || {},
    });

    const savedLayout = await this.layoutRepository.save(layout);

    // إنشاء الطاولات بناءً على عدد الصفوف ونوع الطاولة
    const desks = await this.generateDesks(savedLayout, createDto.rows, createDto.tableType);

    return this.buildLayoutResponse(savedLayout, desks);
  }

  /**
   * إنشاء الطاولات بناءً على عدد الصفوف ونوع الطاولة
   * الصفوف أفقية: كل صف أفقي يحتوي على عدد الطاولات = عدد الصفوف المختار (3 أو 4)
   * مع مسافات متساوية بين الطاولات
   */
  private async generateDesks(
    layout: ClassroomLayout,
    rows: number,
    tableType: TableType,
  ): Promise<Desk[]> {
    const desks: Desk[] = [];
    const capacity = tableType === TableType.SINGLE ? 1 : 2;
    
    // عدد الطاولات في كل صف أفقي = عدد الصفوف المختار (3 أو 4)
    const desksPerRow = rows; // كل سطر يحتوي على 3 أو 4 طاولات
    
    // عدد الصفوف الأفقية (يمكن تعديله حسب الحاجة)
    const numberOfRows = tableType === TableType.DOUBLE ? 6 : 8; // عدد الصفوف الأفقية

    // المسافات الثابتة بين الطاولات (بالنسبة المئوية)
    // مسافات واضحة ومرئية بين الطاولات
    const horizontalSpacing = 12; // المسافة الأفقية بين الطاولات في نفس الصف (12%)
    const verticalSpacing = 15; // المسافة العمودية بين الصفوف الأفقية (15%)
    
    // عرض وارتفاع كل طاولة (بالنسبة المئوية) - ثابت
    const deskWidth = 9; // عرض الطاولة (9%)
    const deskHeight = 7; // ارتفاع الطاولة (7%)
    
    // حساب المساحة الإجمالية المطلوبة
    const totalWidth = (desksPerRow * deskWidth) + ((desksPerRow - 1) * horizontalSpacing);
    const totalHeight = (numberOfRows * deskHeight) + ((numberOfRows - 1) * verticalSpacing);
    
    // نقطة البداية (لتوسيط التخطيط في منتصف القاعة)
    const startX = Math.max(5, (100 - totalWidth) / 2); // على الأقل 5% من اليسار
    const startY = Math.max(10, (100 - totalHeight) / 2); // على الأقل 10% من الأعلى

    // إنشاء الطاولات مع مسافات متساوية تماماً
    // الصفوف أفقية: كل صف أفقي يحتوي على عدد الطاولات = عدد الصفوف المختار
    for (let row = 1; row <= numberOfRows; row++) {
      for (let col = 1; col <= desksPerRow; col++) {
        // حساب الموضع الأفقي (X) - المسافة بين الطاولات في نفس الصف
        const x = startX + ((col - 1) * (deskWidth + horizontalSpacing)) + (deskWidth / 2);
        
        // حساب الموضع العمودي (Y) - المسافة بين الصفوف الأفقية (من الأعلى للأسفل)
        const y = startY + ((row - 1) * (deskHeight + verticalSpacing)) + (deskHeight / 2);
        
        const desk = this.deskRepository.create({
          layoutId: layout.id,
          row, // رقم الصف الأفقي
          column: col, // رقم الطاولة في الصف
          capacity,
          x: Math.round(x * 100) / 100, // تقريب إلى رقمين عشريين
          y: Math.round(y * 100) / 100,
          label: `طاولة ${row}-${col}`,
        });
        desks.push(desk);
      }
    }

    return this.deskRepository.save(desks);
  }

  /**
   * الحصول على تخطيط القاعة
   */
  async getLayout(ownerId: number, classId: number): Promise<LayoutResponse | null> {
    const layout = await this.layoutRepository.findOne({
      where: { classId, ownerId },
      relations: ['desks', 'desks.assignments', 'desks.assignments.student'],
    });

    if (!layout) {
      return null;
    }

    return this.buildLayoutResponse(layout, layout.desks);
  }

  /**
   * تحديث مواضع الطاولات
   */
  async updateDeskPositions(
    ownerId: number,
    updateDto: UpdateDeskPositionsDto,
  ): Promise<LayoutResponse> {
    const layout = await this.layoutRepository.findOne({
      where: { classId: updateDto.classId, ownerId },
    });

    if (!layout) {
      throw new NotFoundException('Layout not found');
    }

    // تحديث مواضع الطاولات
    for (const position of updateDto.positions) {
      await this.deskRepository.update(
        { id: position.deskId, layoutId: layout.id },
        { x: position.x, y: position.y },
      );
    }

    return this.getLayout(ownerId, updateDto.classId) as Promise<LayoutResponse>;
  }

  /**
   * حفظ توزيع التلاميذ
   */
  async saveAssignments(ownerId: number, saveDto: SaveAssignmentsDto): Promise<LayoutResponse> {
    // التحقق من وجود القسم
    const classEntity = await this.classRepository.findOne({
      where: { id: saveDto.classId, ownerId },
    });
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${saveDto.classId} not found`);
    }

    // الحصول على التخطيط
    const layout = await this.layoutRepository.findOne({
      where: { classId: saveDto.classId, ownerId },
      relations: ['desks'],
    });

    if (!layout) {
      throw new NotFoundException('Layout not found. Please create layout first.');
    }

    // حذف التوزيعات القديمة
    const deskIds = layout.desks.map((d) => d.id);
    if (deskIds.length > 0) {
      await this.assignmentRepository.delete({
        deskId: In(deskIds),
        ownerId,
      });
    }

    // التحقق من صحة البيانات
    const studentIds = saveDto.assignments.map((a) => a.studentId);
    const students = await this.studentRepository.find({
      where: { id: In(studentIds), ownerId },
    });
    const studentMap = new Map(students.map((s) => [s.id, s]));

    const deskMap = new Map(layout.desks.map((d) => [d.id, d]));

    // إنشاء التوزيعات الجديدة
    const assignments: DeskAssignment[] = [];

    for (const assignmentDto of saveDto.assignments) {
      const desk = deskMap.get(assignmentDto.deskId);
      if (!desk) {
        throw new BadRequestException(`Desk ${assignmentDto.deskId} not found`);
      }

      const student = studentMap.get(assignmentDto.studentId);
      if (!student) {
        throw new BadRequestException(`Student ${assignmentDto.studentId} not found`);
      }

      // التحقق من السعة
      const existingCount = assignments.filter((a) => a.deskId === desk.id).length;
      if (existingCount >= desk.capacity) {
        throw new BadRequestException(
          `Desk ${desk.label} is full (capacity: ${desk.capacity})`,
        );
      }

      const assignment = this.assignmentRepository.create({
        ownerId,
        deskId: assignmentDto.deskId,
        studentId: assignmentDto.studentId,
        classId: saveDto.classId,
        seatPosition: assignmentDto.seatPosition || SeatPosition.CENTER,
      });

      assignments.push(assignment);
    }

    await this.assignmentRepository.save(assignments);

    return this.getLayout(ownerId, saveDto.classId) as Promise<LayoutResponse>;
  }

  /**
   * بناء استجابة التخطيط
   */
  private buildLayoutResponse(
    layout: ClassroomLayout,
    desks: Desk[],
  ): LayoutResponse {
    return {
      layout: {
        id: layout.id,
        classId: layout.classId,
        rows: layout.rows,
        tableType: layout.tableType,
        settings: layout.settings,
      },
      desks: desks.map((desk) => ({
        id: desk.id,
        row: desk.row,
        column: desk.column,
        capacity: desk.capacity,
        x: desk.x,
        y: desk.y,
        label: desk.label,
        assignments: (desk.assignments || []).map((assignment) => ({
          id: assignment.id,
          studentId: assignment.studentId,
          student: {
            id: assignment.student.id,
            firstName: assignment.student.firstName,
            lastName: assignment.student.lastName,
            photo: assignment.student.photo,
          },
          seatPosition: assignment.seatPosition,
        })),
      })),
    };
  }
}

