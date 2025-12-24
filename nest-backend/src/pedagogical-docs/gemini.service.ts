import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GenerateLessonPlanDto, GenerateLessonPlanResponseDto, LessonPlanStage } from './dto/generate-lesson-plan.dto';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not found in environment variables');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateLessonPlan(dto: GenerateLessonPlanDto): Promise<GenerateLessonPlanResponseDto> {
    if (!this.genAI) {
      throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file.');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

    // بناء prompt تفصيلي للذكاء الاصطناعي
    const prompt = this.buildPrompt(dto);

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response from AI
      const lessonPlan = this.parseAIResponse(text, dto);
      return lessonPlan;
    } catch (error: any) {
      console.error('Error generating lesson plan:', error);
      
      // تحسين رسائل الخطأ
      if (error?.message?.includes('API key')) {
        throw new Error('مفتاح Gemini API غير صحيح. تحقق من إعدادات ملف .env');
      } else if (error?.message?.includes('quota') || error?.message?.includes('quotaExceeded')) {
        throw new Error('تم تجاوز الحد المسموح لاستخدام Gemini API. يرجى المحاولة لاحقاً');
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        throw new Error('خطأ في الاتصال بالإنترنت. تحقق من اتصالك بالشبكة');
      } else {
        const errorMsg = error?.message || 'فشل في توليد خطة الدرس';
        throw new Error(`فشل في توليد خطة الدرس: ${errorMsg}`);
      }
    }
  }

  private buildPrompt(dto: GenerateLessonPlanDto): string {
    const classLevelInstructions = {
      'ضعيف': 'ركز على الأنشطة التبسيطية، استخدم أمثلة واقعية وواضحة، استخدم استراتيجيات بصرية وتفاعلية بسيطة، قدم شرحاً مفصلاً ومتدرجاً، استخدم التكرار والتدريب المكثف.',
      'متوسط': 'استخدم أنشطة متوازنة بين البساطة والتعقيد، قدم أمثلة متنوعة، استخدم استراتيجيات تفاعلية مثل العمل بالأفواج والتعلم بالقرين، قدم شرحاً واضحاً مع فرص للتفكير والتحليل.',
      'ممتاز': 'اقترح وضعيات مشكلة معقدة تثير التفكير العالي، استخدم استراتيجيات متقدمة مثل العصف الذهني والتعلم بالمشاريع، قدم أنشطة تتطلب تحليل وتوليف وتقييم، شجع على التفكير النقدي والإبداعي.'
    };

    const strategyInstructions = classLevelInstructions[dto.classLevel] || classLevelInstructions['متوسط'];

    return `أنت معلم محترف في الجزائر متخصص في إعداد خطط الدروس (المذكرات) وفق المنهاج الجزائري.

المهمة: أنشئ خطة درس مفصلة (مذكرة) باللغة العربية وفق النموذج المطلوب.

المعلومات:
- المادة الدراسية: ${dto.subject}
- المستوى والشعبة: ${dto.level} - ${dto.section}
- المجال المفاهيمي: ${dto.conceptualField}
- الوحدة المفاهيمية: ${dto.conceptualUnit}
- عنوان الدرس: ${dto.lessonTitle}
- الكفاءة المستهدفة (الهدف): ${dto.targetCompetency}
- مستوى القسم: ${dto.classLevel}
- مدة الحصة: ${dto.sessionDuration} دقيقة

تعليمات خاصة بمستوى القسم:
${strategyInstructions}

البنية المطلوبة:
الدرس يجب أن يتكون من 4 مراحل رئيسية:
1. التزام: وضعية مشكلة (بناء المعرفة المسبقة، والإثارة في الدرس)
2. تمثيل: طريقة إلقاء الدرس بالتفصيل (مقدمة إلى مفهوم الدرس) مع الاستراتيجيات المتبعة في كل عنصر
3. مشاركة: تفاعل التلاميذ مع الدرس (أنشطة تفاعلية، أسئلة، مناقشات)
4. التقييم: تقييم ما إذا كان الهدف قد تحقق (أسئلة تقييمية، أنشطة تقييمية)

استراتيجيات مقترحة (اختر ما يناسب مستوى القسم):
- العمل بالأفواج
- التعلم بالقرين
- العصف الذهني
- التعلم بالمشاريع
- التعلم التعاوني
- التعلم النشط
- استخدام الوسائط المتعددة
- الأنشطة التطبيقية

الموارد المطلوبة: اقترح موارد تعليمية مناسبة مثل (سبورة، كتب، أدوات تقنية، مواد بصرية، إلخ)

الزمن: اقترح توزيع زمني منطقي لكل مرحلة (بالدقائق)

قم بإرجاع النتيجة بصيغة JSON فقط (بدون أي نص إضافي) بالتنسيق التالي:
{
  "stages": [
    {
      "stage": "1) التزام",
      "time": "X دقيقة",
      "methodologicalApproach": "وصف تفصيلي للوضعية المشكلة والأنشطة...",
      "strategy": "اسم الاستراتيجية المستخدمة",
      "requiredResources": "قائمة الموارد المطلوبة",
      "notes": "ملاحظات إضافية (اختياري)"
    },
    {
      "stage": "2) تمثيل",
      "time": "X دقيقة",
      "methodologicalApproach": "وصف تفصيلي لطريقة إلقاء الدرس...",
      "strategy": "اسم الاستراتيجية المستخدمة",
      "requiredResources": "قائمة الموارد المطلوبة",
      "notes": "ملاحظات إضافية (اختياري)"
    },
    {
      "stage": "3) مشاركة",
      "time": "X دقيقة",
      "methodologicalApproach": "وصف تفصيلي لأنشطة التفاعل...",
      "strategy": "اسم الاستراتيجية المستخدمة",
      "requiredResources": "قائمة الموارد المطلوبة",
      "notes": "ملاحظات إضافية (اختياري)"
    },
    {
      "stage": "4) التقييم",
      "time": "X دقيقة",
      "methodologicalApproach": "وصف تفصيلي لأدوات التقييم...",
      "strategy": "اسم الاستراتيجية المستخدمة",
      "requiredResources": "قائمة الموارد المطلوبة",
      "notes": "ملاحظات إضافية (اختياري)"
    }
  ],
  "currentActivity": "نشاط مستقل يثير الاهتمام في الدرس (اختياري)"
}

تأكد من:
- جميع النصوص باللغة العربية
- المحتوى مناسب لمستوى القسم المحدد (${dto.classLevel}) والمادة الدراسية (${dto.subject})
- الاستراتيجيات والأنشطة مناسبة للبيئة المدرسية الجزائرية والمادة المحددة
- الزمن مقترح بشكل منطقي ومتناسب مع مدة الحصة الإجمالية (${dto.sessionDuration} دقيقة)
- يجب أن يكون مجموع الأزمنة للمراحل الأربع قريباً من مدة الحصة (${dto.sessionDuration} دقيقة)
- الموارد واقعية ومتاحة في البيئة المدرسية ومتناسبة مع المادة الدراسية`;
  }

  private parseAIResponse(text: string, dto: GenerateLessonPlanDto): GenerateLessonPlanResponseDto {
    try {
      // محاولة استخراج JSON من النص (في حالة احتواء النص على كود markdown أو نص إضافي)
      let jsonText = text.trim();
      
      // إزالة markdown code blocks إذا كانت موجودة
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(jsonText);
      
      // التحقق من وجود stages
      if (!parsed.stages || !Array.isArray(parsed.stages)) {
        throw new Error('Invalid response structure: stages array not found');
      }

      // التأكد من وجود 4 مراحل
      const requiredStages = ['1) التزام', '2) تمثيل', '3) مشاركة', '4) التقييم'];
      const stages: LessonPlanStage[] = [];
      
      // إنشاء 4 مراحل (إما من البيانات المستلمة أو قوالب افتراضية)
      for (let i = 0; i < 4; i++) {
        const parsedStage = parsed.stages[i];
        if (parsedStage) {
          stages.push({
            stage: parsedStage.stage || requiredStages[i],
            time: parsedStage.time || 'دقيقة',
            methodologicalApproach: parsedStage.methodologicalApproach || '',
            strategy: parsedStage.strategy || '',
            requiredResources: parsedStage.requiredResources || '',
            notes: parsedStage.notes || ''
          });
        } else {
          // إضافة مرحلة افتراضية إذا كانت مفقودة
          stages.push({
            stage: requiredStages[i],
            time: 'دقيقة',
            methodologicalApproach: '',
            strategy: '',
            requiredResources: '',
            notes: ''
          });
        }
      }

      const currentDate = new Date();
      const formattedDate = `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}`;

      return {
        date: formattedDate,
        level: dto.level,
        section: dto.section,
        conceptualField: dto.conceptualField,
        conceptualUnit: dto.conceptualUnit,
        objective: dto.targetCompetency,
        currentActivity: parsed.currentActivity || '',
        stages: stages
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Response text:', text);
      
      // في حالة فشل التحليل، إرجاع نموذج افتراضي
      const currentDate = new Date();
      const formattedDate = `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}`;

      return {
        date: formattedDate,
        level: dto.level,
        section: dto.section,
        conceptualField: dto.conceptualField,
        conceptualUnit: dto.conceptualUnit,
        objective: dto.targetCompetency,
        currentActivity: '',
        stages: [
          {
            stage: '1) التزام',
            time: '10 دقيقة',
            methodologicalApproach: 'الوضعية المشكلة (بناء المعرفة المسبقة، والإثارة في الدرس)',
            strategy: '',
            requiredResources: '',
            notes: ''
          },
          {
            stage: '2) تمثيل',
            time: '20 دقيقة',
            methodologicalApproach: 'طريقة إلقاء الدرس بالتفصيل (مقدمة إلى مفهوم الدرس) مع الاستراتيجيات المتبعة في كل عنصر',
            strategy: '',
            requiredResources: '',
            notes: ''
          },
          {
            stage: '3) مشاركة',
            time: '15 دقيقة',
            methodologicalApproach: '(تفاعل التلاميذ مع الدرس)',
            strategy: '',
            requiredResources: '',
            notes: ''
          },
          {
            stage: '4) التقييم',
            time: '10 دقيقة',
            methodologicalApproach: 'هل وصلت إلى هدفي كمدرس؟',
            strategy: '',
            requiredResources: '',
            notes: ''
          }
        ]
      };
    }
  }
}

