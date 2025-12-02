import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProgressTracking } from './progress-tracking.entity';
import { Subject } from '../subjects/subject.entity';
import { Class } from '../classes/class.entity';
import { AnnualDistribution } from '../annual-planning/annual-distribution.entity';
import { Notebook } from '../notebooks/notebook.entity';
import { CourseEntry } from '../notebooks/course-entry.entity';
import { SubjectProgressDto } from './dto/subject-progress.dto';
import { ProgressItemDto } from './dto/progress-item.dto';

@Injectable()
export class ProgressTrackingService {
  constructor(
    @InjectRepository(ProgressTracking)
    private readonly progressRepo: Repository<ProgressTracking>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
    @InjectRepository(AnnualDistribution)
    private readonly distRepo: Repository<AnnualDistribution>,
    @InjectRepository(Notebook)
    private readonly notebookRepo: Repository<Notebook>,
    @InjectRepository(CourseEntry)
    private readonly courseEntryRepo: Repository<CourseEntry>,
  ) {}

  /**
   * إنشاء/تحديث آخر درس منجز لقسم معيّن
   */
  async upsertProgress(ownerId: number, payload: {
    classId: number;
    teacherId?: number;
    lastLessonReached: number;
  }): Promise<ProgressTracking> {
    // Validate class exists and belongs to owner
    const classEntity = await this.classRepo.findOne({
      where: { id: payload.classId, ownerId },
    });
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${payload.classId} not found`);
    }

    let entity = await this.progressRepo.findOne({
      where: { classId: payload.classId, ownerId },
    });

    if (!entity) {
      entity = this.progressRepo.create({
        classId: payload.classId,
        ownerId,
      });
    }

    entity.teacherId = payload.teacherId;
    entity.lastLessonReached = payload.lastLessonReached;

    return this.progressRepo.save(entity);
  }

  /**
   * إرجاع تقرير مادة واحدة على مستوى جميع الأقسام المرتبطة بها.
   */
  async getSubjectProgress(
    ownerId: number,
    subjectId: number,
    opts?: { date?: string },
  ): Promise<SubjectProgressDto> {
    try {
      // يمكن لاحقاً استخدام subjectId فعلياً لربطه بجدول المواد، حالياً نستخدمه كـ وسم فقط
      let subject = await this.subjectRepo.findOne({ where: { id: subjectId, ownerId } });
      if (!subject) {
        subject = this.subjectRepo.create({
          nameAr: `مادة #${subjectId}`,
          level: '',
          totalLessons: 16, // قيمة افتراضية معقولة
          ownerId,
        });
      }

      // نأتي بجميع الأقسام الخاصة بالمستخدم (يمكن تصفيتها لاحقاً حسب المستوى/الشعبة)
      const classes = await this.classRepo.find({
        where: { ownerId },
        order: { level: 'ASC', name: 'ASC' },
      });

      const classIds = classes.map((c) => c.id);

      // تقدم مسجل يدوياً إن وجد
      const progressRows =
        classIds.length > 0
          ? await this.progressRepo.find({
              where: { classId: In(classIds), ownerId },
            })
          : [];

      // استخراج آخر درس من دفاتر الأستاذ (notebooks/course_entries)
      const lastLessonByClass = await this.getLastLessonFromNotebooks(ownerId, classIds);

      const today = opts?.date ? new Date(opts.date) : new Date();
      const currentDateStr = today.toISOString().slice(0, 10);

      let currentWeek = 1;
      let expectedLesson = 0;
      
      try {
        const computed = await this.computeExpectedLesson(
          ownerId,
          subjectId,
          today,
        );
        currentWeek = computed.currentWeek;
        expectedLesson = computed.expectedLesson;
      } catch (computeError) {
        console.error('Error computing expected lesson:', computeError);
        // استخدام قيم افتراضية في حالة الخطأ
        currentWeek = 1;
        expectedLesson = 0;
      }

    const items: ProgressItemDto[] = classes.map((cls) => {
      const progress = progressRows.find((p) => p.classId === cls.id);
      // الأولوية: آخر درس من الدفتر، ثم ما هو مسجل يدوياً، وإلا 0
      const lastFromNotebook = lastLessonByClass.get(cls.id) ?? 0;
      const lastManual = progress?.lastLessonReached ?? 0;
      const lastLessonReached = Math.max(lastFromNotebook, lastManual);

      const lessonProgressPercentage =
        subject.totalLessons > 0
          ? (lastLessonReached / subject.totalLessons) * 100
          : 0;

      const delayOrAdvanceUnits = lastLessonReached - expectedLesson;
      const delayPercentage =
        subject.totalLessons > 0
          ? (delayOrAdvanceUnits / subject.totalLessons) * 100
          : 0;

      let status: ProgressItemDto['status'] = 'onTrack';
      if (delayOrAdvanceUnits > 0) status = 'advance';
      else if (delayOrAdvanceUnits < 0) status = 'delay';

      return {
        teacherId: progress?.teacherId,
        classId: cls.id,
        className: cls.name,
        level: cls.level,
        lastLessonReached,
        lessonProgressPercentage,
        expectedLesson,
        delayOrAdvanceUnits,
        delayPercentage,
        status,
      };
    });

      const delayed = items.filter((i) => i.status === 'delay');
      const advanced = items.filter((i) => i.status === 'advance');

      return {
        subjectId: subject.id,
        subjectNameAr: subject.nameAr,
        level: subject.level,
        totalLessons: subject.totalLessons,
        currentDate: currentDateStr,
        currentWeek,
        expectedLesson,
        items,
        delayed,
        advanced,
      };
    } catch (error) {
      console.error('Error in getSubjectProgress:', error);
      throw new Error(`فشل في جلب بيانات التقدم: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  }

  /**
   * حساب الأسبوع الحالي ورقم الدرس المتوقع من جدول التوزيع السنوي.
   *
   * currentWeek = الفارق بالأيام / 7 + 1
   * expectedLesson = الدرس ذو lessonNumber الأعلى الذي weekNumber <= currentWeek
   */
  private async computeExpectedLesson(ownerId: number, subjectId: number, date: Date): Promise<{
    currentWeek: number;
    expectedLesson: number;
  }> {
    const distributions = await this.distRepo.find({
      where: { subjectId, ownerId },
      order: { term: 'ASC', weekNumber: 'ASC' },
    });

    if (distributions.length === 0) {
      return { currentWeek: 1, expectedLesson: 0 };
    }

    const first = distributions[0];
    const base = new Date(first.yearStartDate);

    const diffMs = date.getTime() - base.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const currentWeek = Math.max(1, Math.floor(diffDays / 7) + 1);

    const candidates = distributions.filter(
      (d) =>
        d.weekNumber <= currentWeek &&
        typeof d.lessonNumber === 'number' &&
        d.lessonNumber !== null,
    );

    const expectedLesson =
      candidates.length > 0
        ? Math.max(...candidates.map((c) => c.lessonNumber ?? 0))
        : 0;

    return { currentWeek, expectedLesson };
  }

  /**
   * استخراج رقم آخر درس من خلال دفاتر الأستاذ (لكل قسم).
   * نعتمد على أكبر قيمة في حقل order، وإن لم يوجد نستخدم الترتيب الزمني.
   */
  private async getLastLessonFromNotebooks(
    ownerId: number,
    classIds: number[],
  ): Promise<Map<number, number>> {
    const result = new Map<number, number>();
    if (classIds.length === 0) {
      return result;
    }

    const notebooks = await this.notebookRepo.find({
      where: { classId: In(classIds), ownerId },
    });
    if (notebooks.length === 0) {
      return result;
    }

    const notebookIds = notebooks.map((n) => n.id);
    const entries = await this.courseEntryRepo.find({
      where: { notebookId: In(notebookIds), ownerId },
      order: { date: 'ASC', startTime: 'ASC' },
    });

    for (const entry of entries) {
      const notebook = notebooks.find((n) => n.id === entry.notebookId);
      if (!notebook || !notebook.classId) continue;
      const classId = notebook.classId;

      const current = result.get(classId) ?? 0;
      const lessonNumber =
        typeof entry.order === 'number' && entry.order !== null
          ? entry.order
          : current + 1;

      if (lessonNumber > current) {
        result.set(classId, lessonNumber);
      }
    }

    return result;
  }
}


