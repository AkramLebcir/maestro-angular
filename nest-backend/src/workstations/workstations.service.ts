import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Workstation } from './workstation.entity';
import {
  AttendanceStatus,
  BehaviorStatus,
  SeatAssignment,
} from './seat-assignment.entity';
import { ConfigureLayoutDto } from './dto/configure-layout.dto';
import { SaveAssignmentsDto } from './dto/save-assignments.dto';
import { UpdateAssignmentStatusDto } from './dto/update-assignment-status.dto';
import { PrintLayoutDto } from './dto/print-layout.dto';
import { UpdateWorkstationPositionsDto } from './dto/update-workstation-positions.dto';
import { Class } from '../classes/class.entity';
import { Student } from '../students/student.entity';
import { Grade } from '../grades/grade.entity';

export interface SeatingStats {
  totalWorkstations: number;
  totalSeats: number;
  assignedSeats: number;
  averageAttendance: number;
  averageGrade: number | null;
  positiveBehaviorRate: number;
  studentCount: number;
}

@Injectable()
export class WorkstationsService {
  private readonly DEFAULT_STATIONS = 15;
  private readonly DEFAULT_CAPACITY = 2;

  constructor(
    @InjectRepository(Workstation)
    private readonly workstationRepository: Repository<Workstation>,
    @InjectRepository(SeatAssignment)
    private readonly assignmentRepository: Repository<SeatAssignment>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Grade)
    private readonly gradeRepository: Repository<Grade>,
  ) {}

  async getLayout(classId: number, group?: number) {
    const workstations = await this.loadLayout(classId, group);
    const stats = await this.buildStats(classId, workstations);

    return {
      classId,
      group: group ?? null,
      workstations,
      stats,
    };
  }

  async configureLayout(dto: ConfigureLayoutDto) {
    const totalStations = dto.totalStations ?? this.DEFAULT_STATIONS;
    const capacity = dto.capacity ?? this.DEFAULT_CAPACITY;

    await this.workstationRepository.delete({ classId: dto.classId });
    await this.createDefaultLayout(dto.classId, totalStations, capacity);
    return this.getLayout(dto.classId);
  }

  async saveAssignments(dto: SaveAssignmentsDto) {
    const group = dto.group ?? 1;
    const layout = await this.loadLayout(dto.classId);
    const workstationMap = new Map(layout.map((ws) => [ws.id, ws]));

    const seatKeys = new Set<string>();
    dto.assignments.forEach((assignment) => {
      const workstation = workstationMap.get(assignment.workstationId);
      if (!workstation) {
        throw new BadRequestException(
          `Workstation ${assignment.workstationId} is not part of class ${dto.classId}`,
        );
      }

      const seatIndex = assignment.seatIndex ?? 0;
      if (seatIndex >= workstation.capacity) {
        throw new BadRequestException(
          `Seat index ${seatIndex} exceeds capacity for workstation ${workstation.label}`,
        );
      }

      const key = `${assignment.workstationId}-${seatIndex}`;
      if (seatKeys.has(key)) {
        throw new BadRequestException(
          `Seat ${workstation.label} #${seatIndex + 1} already has an assignment`,
        );
      }
      seatKeys.add(key);
    });

    const studentIds = dto.assignments.map((a) => a.studentId);
    const students = await this.studentRepository.findBy({
      id: In(studentIds),
    });
    const studentMap = new Map(students.map((student) => [student.id, student]));

    dto.assignments.forEach((assignment) => {
      const student = studentMap.get(assignment.studentId);
      if (!student) {
        throw new BadRequestException(
          `Student ${assignment.studentId} could not be found`,
        );
      }
      if (student.classId !== dto.classId) {
        throw new BadRequestException(
          `Student ${student.firstName} ${student.lastName} is not part of the selected class`,
        );
      }
      if (student.group && student.group !== group) {
        throw new BadRequestException(
          `Student ${student.firstName} ${student.lastName} belongs to group ${student.group}`,
        );
      }
    });

    await this.assignmentRepository.delete({
      classId: dto.classId,
      group,
    });

    const newAssignments = dto.assignments.map((assignment) => {
      const workstation = workstationMap.get(assignment.workstationId);
      return this.assignmentRepository.create({
        classId: dto.classId,
        labId: workstation?.labId ?? null,
        group,
        workstationId: assignment.workstationId,
        studentId: assignment.studentId,
        seatIndex: assignment.seatIndex ?? 0,
        attendanceStatus:
          assignment.attendanceStatus ?? AttendanceStatus.PRESENT,
        behaviorStatus:
          assignment.behaviorStatus ?? BehaviorStatus.NEUTRAL,
        behaviorNotes: assignment.behaviorNotes ?? null,
      });
    });

    if (newAssignments.length > 0) {
      await this.assignmentRepository.save(newAssignments);
    }

    return this.getLayout(dto.classId, group);
  }

  async updatePositions(dto: UpdateWorkstationPositionsDto) {
    const workstations = await this.workstationRepository.find({
      where: { classId: dto.classId },
    });
    const map = new Map(workstations.map((ws) => [ws.id, ws]));

    for (const position of dto.positions) {
      const workstation = map.get(position.workstationId);
      if (!workstation) {
        throw new BadRequestException(
          `Workstation ${position.workstationId} is not part of class ${dto.classId}`,
        );
      }
      workstation.x = position.x;
      workstation.y = position.y;
      if (position.positionIndex !== undefined) {
        workstation.positionIndex = position.positionIndex;
      }
      if (position.zone) {
        workstation.zone = position.zone;
      }
    }

    await this.workstationRepository.save(Array.from(map.values()));
    return this.getLayout(dto.classId);
  }

  async updateAssignmentStatus(
    id: number,
    dto: UpdateAssignmentStatusDto,
  ) {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment ${id} not found`);
    }

    if (dto.attendanceStatus) {
      assignment.attendanceStatus = dto.attendanceStatus;
    }
    if (dto.behaviorStatus) {
      assignment.behaviorStatus = dto.behaviorStatus;
    }
    if (dto.behaviorNotes !== undefined) {
      assignment.behaviorNotes =
        dto.behaviorNotes && dto.behaviorNotes.trim() !== ''
          ? dto.behaviorNotes
          : null;
    }

    return this.assignmentRepository.save(assignment);
  }

  async getPrintableLayout(dto: PrintLayoutDto) {
    if (!dto.includeAllClasses && !dto.classId) {
      throw new BadRequestException(
        'classId is required unless includeAllClasses is true',
      );
    }

    const classIds = dto.includeAllClasses
      ? (await this.classRepository.find({ select: ['id'] })).map(
          (cls) => cls.id,
        )
      : [dto.classId as number];

    const classesPayload = [];

    for (const classId of classIds) {
      const classEntity = await this.classRepository.findOne({
        where: { id: classId },
        relations: ['lab'],
      });

      if (!classEntity) {
        continue;
      }

      const groupNumbers =
        dto.includeBothGroups || dto.includeAllClasses
          ? [1, 2]
          : dto.group
          ? [dto.group]
          : [1];

      const groups = [];
      for (const group of groupNumbers) {
        const layout = await this.getLayout(classId, group);
        let filteredWorkstations = layout.workstations;
        if (dto.workstationIds && dto.workstationIds.length) {
          const allowed = new Set(dto.workstationIds);
          filteredWorkstations = filteredWorkstations.filter((ws) =>
            allowed.has(ws.id),
          );
        }
        if (dto.workstationLabel) {
          filteredWorkstations = filteredWorkstations.filter(
            (ws) => ws.label === dto.workstationLabel,
          );
        }
        if (dto.workstationLabels && dto.workstationLabels.length) {
          const labelSet = new Set(dto.workstationLabels);
          filteredWorkstations = filteredWorkstations.filter((ws) =>
            labelSet.has(ws.label),
          );
        }
        if (filteredWorkstations.length === 0) {
          continue;
        }
        groups.push({
          group,
          classId,
          groupId: layout.group,
          workstations: filteredWorkstations,
          stats: layout.stats,
        });
      }

      classesPayload.push({
        class: {
          id: classEntity.id,
          name: classEntity.name,
          level: classEntity.level,
          subject: classEntity.subject,
          labName: classEntity.lab?.name,
        },
        groups,
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      scope: dto.includeAllClasses ? 'all' : 'class',
      classes: classesPayload,
    };
  }

  private async createDefaultLayout(
    classId: number,
    totalStations: number,
    capacity: number,
  ) {
    const classEntity = await this.classRepository.findOne({
      where: { id: classId },
    });

    if (!classEntity) {
      throw new NotFoundException(`Class ${classId} not found`);
    }

    const coordinates = this.buildDefaultCoordinates(totalStations);
    const workstations = coordinates.map((coord, index) =>
      this.workstationRepository.create({
        label: `PC-${(index + 1).toString().padStart(2, '0')}`,
        capacity,
        classId,
        labId: classEntity.labId ?? null,
        positionIndex: index + 1,
        layoutPreset: 'u-default',
        x: coord.x,
        y: coord.y,
        zone: coord.zone,
      }),
    );

    await this.workstationRepository.save(workstations);
  }

  private async loadLayout(classId: number, group?: number) {
    await this.ensureLayoutExists(classId);

    const qb = this.workstationRepository
      .createQueryBuilder('workstation')
      .leftJoinAndSelect(
        'workstation.assignments',
        'assignment',
        group ? 'assignment.group = :group' : '1=1',
        group ? { group } : {},
      )
      .leftJoinAndSelect('assignment.student', 'student')
      .where('workstation.classId = :classId', { classId })
      .orderBy('workstation.positionIndex', 'ASC')
      .addOrderBy('assignment.seatIndex', 'ASC');

    return qb.getMany();
  }

  private async ensureLayoutExists(classId: number) {
    const count = await this.workstationRepository.count({
      where: { classId },
    });
    if (count === 0) {
      await this.createDefaultLayout(
        classId,
        this.DEFAULT_STATIONS,
        this.DEFAULT_CAPACITY,
      );
    }
  }

  private buildDefaultCoordinates(total: number) {
    const coords: { x: number; y: number; zone: string }[] = [];

    const topCount = Math.min(total, 5);
    const topSpacing = topCount > 1 ? 66 / (topCount - 1) : 0;
    for (let i = 0; i < topCount; i++) {
      coords.push({
        x: Number((17 + i * topSpacing).toFixed(2)),
        y: 12,
        zone: 'top',
      });
    }

    let remaining = total - topCount;
    let step = 0;
    const verticalSpacing = 18;
    while (remaining > 0) {
      coords.push({
        x: 24,
        y: Number((22 + step * verticalSpacing).toFixed(2)),
        zone: 'left',
      });
      remaining--;
      if (remaining > 0) {
        coords.push({
          x: 76,
          y: Number((22 + step * verticalSpacing).toFixed(2)),
          zone: 'right',
        });
        remaining--;
      }
      step++;
    }

    return coords;
  }

  private async buildStats(classId: number, workstations: Workstation[]) {
    const assignments = workstations.flatMap(
      (ws) => ws.assignments ?? [],
    );
    const assignedSeats = assignments.length;
    const totalSeats = workstations.reduce(
      (sum, ws) => sum + ws.capacity,
      0,
    );

    const presentCount = assignments.filter(
      (assignment) => assignment.attendanceStatus === AttendanceStatus.PRESENT,
    ).length;
    const averageAttendance =
      assignedSeats > 0
        ? Math.round((presentCount / assignedSeats) * 100)
        : 0;

    const positiveBehaviorCount = assignments.filter(
      (assignment) => assignment.behaviorStatus === BehaviorStatus.POSITIVE,
    ).length;
    const positiveBehaviorRate =
      assignedSeats > 0
        ? Math.round((positiveBehaviorCount / assignedSeats) * 100)
        : 0;

    const grades = await this.gradeRepository.find({
      where: { classId },
      select: ['score', 'maxScore'],
    });
    const averageGrade =
      grades.length > 0
        ? Math.round(
            (grades.reduce((sum, grade) => {
              const score = Number(grade.score);
              const maxScore = Number(grade.maxScore) || 1;
              return sum + score / maxScore;
            }, 0) /
              grades.length) *
              100,
          )
        : null;

    const studentCount = await this.studentRepository.count({
      where: { classId },
    });

    const stats: SeatingStats = {
      totalWorkstations: workstations.length,
      totalSeats,
      assignedSeats,
      averageAttendance,
      averageGrade,
      positiveBehaviorRate,
      studentCount,
    };

    return stats;
  }
}


