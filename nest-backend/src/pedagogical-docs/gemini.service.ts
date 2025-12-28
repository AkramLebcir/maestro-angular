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

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // بناء prompt تفصيلي للذكاء الاصطناعي
    const prompt = this.buildPrompt(dto);

    // إعداد timeout (180 ثانية)
    const timeoutMs = 180000;

    // دالة لإجراء الطلب مع إعادة المحاولة و timeout
    const makeRequest = async (retries = 2): Promise<string> => {
      try {
        // إنشاء timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('TIMEOUT: تم تجاوز الوقت المسموح. يرجى المحاولة مرة أخرى.'));
          }, timeoutMs);
        });

        // إجراء الطلب مع timeout
        const apiCall = model.generateContent(prompt);
        const result = await Promise.race([apiCall, timeoutPromise]);
        const response = await result.response;
        return response.text();
      } catch (error: any) {
        // التحقق من أخطاء الشبكة التي يمكن إعادة المحاولة عليها
        const isNetworkError = 
          error?.message?.includes('network') ||
          error?.message?.includes('fetch') ||
          error?.message?.includes('ECONNRESET') ||
          error?.message?.includes('ETIMEDOUT') ||
          error?.message?.includes('ENOTFOUND') ||
          error?.message?.includes('ECONNREFUSED') ||
          error?.code === 'ECONNRESET' ||
          error?.code === 'ETIMEDOUT' ||
          error?.code === 'ENOTFOUND' ||
          error?.code === 'ECONNREFUSED';

        if (isNetworkError && retries > 0) {
          console.log(`Network error occurred, retrying... (${retries} attempts remaining)`);
          // انتظار قبل إعادة المحاولة (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 2000 * (3 - retries)));
          return makeRequest(retries - 1);
        }
        throw error;
      }
    };

    try {
      const text = await makeRequest();
      
      // Parse the JSON response from AI
      const lessonPlan = this.parseAIResponse(text, dto);
      return lessonPlan;
    } catch (error: any) {
      console.error('Error generating lesson plan:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      });
      
      // تحسين رسائل الخطأ
      if (error?.message?.includes('TIMEOUT')) {
        throw new Error('تم تجاوز الوقت المسموح للطلب. يرجى المحاولة مرة أخرى. قد يكون الطلب معقداً جداً أو الاتصال بالإنترنت بطيئاً.');
      } else if (error?.message?.includes('API key') || error?.message?.includes('API_KEY')) {
        throw new Error('مفتاح Gemini API غير صحيح أو غير موجود. تحقق من إعدادات ملف .env');
      } else if (error?.message?.includes('quota') || error?.message?.includes('quotaExceeded') || error?.message?.includes('429')) {
        throw new Error('تم تجاوز الحد المسموح لاستخدام Gemini API. يرجى المحاولة لاحقاً');
      } else if (
        error?.message?.includes('network') || 
        error?.message?.includes('fetch') ||
        error?.message?.includes('ECONNRESET') ||
        error?.message?.includes('ETIMEDOUT') ||
        error?.message?.includes('ENOTFOUND') ||
        error?.message?.includes('ECONNREFUSED') ||
        error?.code === 'ECONNRESET' ||
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'ENOTFOUND' ||
        error?.code === 'ECONNREFUSED'
      ) {
        throw new Error('خطأ في الاتصال بالإنترنت. تحقق من اتصالك بالشبكة وحاول مرة أخرى. إذا استمرت المشكلة، تحقق من إعدادات الجدار الناري أو الوكيل.');
      } else if (error?.message?.includes('400') || error?.status === 400) {
        throw new Error('طلب غير صحيح. يرجى التحقق من البيانات المدخلة.');
      } else if (error?.message?.includes('403') || error?.status === 403) {
        throw new Error('غير مصرح بالوصول إلى Gemini API. تحقق من صلاحيات مفتاح API.');
      } else if (error?.message?.includes('500') || error?.status === 500) {
        throw new Error('خطأ في خادم Gemini API. يرجى المحاولة لاحقاً.');
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

    // حساب التوزيع الزمني المقترح (نسبي لمدة الحصة)
    const totalMinutes = dto.sessionDuration;
    const timeDistribution = {
      engagement: Math.round(totalMinutes * 0.20), // 20% للالتزام
      representation: Math.round(totalMinutes * 0.40), // 40% للتمثيل
      participation: Math.round(totalMinutes * 0.25), // 25% للمشاركة
      evaluation: Math.round(totalMinutes * 0.15), // 15% للتقييم
    };

    return `أنت معلم محترف في الجزائر متخصص في إعداد خطط الدروس (المذكرات) وفق المنهاج الجزائري والمنهجية البيداغوجية الحديثة.

المهمة: أنشئ خطة درس مفصلة وشاملة (مذكرة) باللغة العربية وفق النموذج المطلوب.

المعلومات الأساسية:
- المادة الدراسية: ${dto.subject}
- المستوى: ${dto.level}
- الشعبة: ${dto.section}
- المجال المفاهيمي (الميدان): ${dto.conceptualField}
- الوحدة المفاهيمية (المقطع): ${dto.conceptualUnit}
- الأهداف التعلمية: ${dto.learningObjectives}
- الكفاءة المستهدفة (الهدف): ${dto.targetCompetency}
- مستوى القسم: ${dto.classLevel}
- مدة الحصة: ${dto.sessionDuration} دقيقة

تعليمات خاصة بمستوى القسم:
${strategyInstructions}

البنية المطلوبة للدرس:
يجب أن يتكون الدرس من 4 مراحل رئيسية مع تفاصيل كاملة لكل مرحلة:

1. مرحلة التزام (الوضعية المشكلة):
   - يجب أن تبدأ بوضعية مشكلة حقيقية وواقعية تتعلق بالموضوع
   - بناء المعرفة المسبقة للتلاميذ من خلال استثارة معلوماتهم السابقة
   - إثارة الاهتمام والفضول في الدرس
   - يجب أن تكون الوضعية المشكلة مناسبة لمستوى القسم (${dto.classLevel})
   - الوقت المقترح: حوالي ${timeDistribution.engagement} دقيقة

2. مرحلة تمثيل (إلقاء الدرس):
   - طريقة إلقاء الدرس بالتفصيل مع الشرح الوافي
   - مقدمة شاملة إلى مفهوم الدرس الرئيسي
   - يجب أن تكون الاستراتيجيات المستخدمة من استراتيجيات التعلم النشط:
     * التعلم التعاوني
     * التعلم بالقرين
     * العمل بالأفواج
     * العصف الذهني
     * التعلم بالمشاريع
     * الاستكشاف الموجه
     * التعلم باللعب
     * التعلم القائم على حل المشكلات
   - يجب تحديد الاستراتيجية المستخدمة بوضوح لكل عنصر
   - الوقت المقترح: حوالي ${timeDistribution.representation} دقيقة

3. مرحلة مشاركة (تفاعل التلاميذ):
   - تفاعل التلاميذ مع الدرس من خلال أنشطة تفاعلية
   - أسئلة تشجيعية ومناقشات
   - أنشطة تطبيقية عملية
   - يجب أن تكون الأنشطة متنوعة وتناسب مستوى القسم
   - الوقت المقترح: حوالي ${timeDistribution.participation} دقيقة

4. مرحلة التقييم (الختامي والمرحلي):
   - تقويم مرحلي: تقييم فوري لفهم التلاميذ أثناء الدرس
   - تقويم ختامي: تقييم شامل لتحقيق الكفاءة المستهدفة
   - يجب أن يتضمن أسئلة تقييمية وأنشطة تقييمية واضحة
   - التأكد من تحقيق الأهداف التعلمية والكفاءة المستهدفة
   - الوقت المقترح: حوالي ${timeDistribution.evaluation} دقيقة

الموارد المطلوبة:
يجب اقتراح موارد تعليمية واقعية ومتاحة في البيئة المدرسية الجزائرية، مثل:
- سبورة (بيضاء أو سوداء)
- كتب مدرسية ومراجع
- أدوات تقنية (حاسوب، بروجكتور، شاشة عرض)
- مواد بصرية (صور، رسوم بيانية، خرائط)
- أدوات عملية (حسب المادة الدراسية)
- أوراق عمل
- أنشطة تفاعلية

ملاحظات مهمة:
- جميع النصوص يجب أن تكون باللغة العربية الفصحى
- المحتوى يجب أن يكون مناسباً لمستوى القسم (${dto.classLevel}) والمادة الدراسية (${dto.subject})
- الاستراتيجيات يجب أن تكون من استراتيجيات التعلم النشط حصراً
- الأنشطة يجب أن تكون متنوعة وتناسب البيئة المدرسية الجزائرية
- الزمن المقترح يجب أن يكون منطقياً ومتناسباً مع مدة الحصة (${dto.sessionDuration} دقيقة)
- يجب أن يكون مجموع الأزمنة للمراحل الأربع قريباً جداً من مدة الحصة الإجمالية
- الموارد يجب أن تكون واقعية ومتاحة في البيئة المدرسية

قم بإرجاع النتيجة بصيغة JSON فقط (بدون أي نص إضافي) بالتنسيق التالي:
{
  "stages": [
    {
      "stage": "1) التزام",
      "time": "${timeDistribution.engagement} دقيقة",
      "methodologicalApproach": "وصف تفصيلي ومفصل للوضعية المشكلة، كيفية بناء المعرفة المسبقة، طرق الإثارة في الدرس، الأنشطة التفاعلية المستخدمة...",
      "strategy": "اسم الاستراتيجية المستخدمة من استراتيجيات التعلم النشط (مثل: التعلم التعاوني، التعلم بالقرين، العصف الذهني، إلخ)",
      "requiredResources": "قائمة مفصلة بالموارد المطلوبة لهذه المرحلة (سبورة، مواد بصرية، أدوات، إلخ)",
      "notes": "ملاحظات إضافية مهمة للمعلم (اختياري)"
    },
    {
      "stage": "2) تمثيل",
      "time": "${timeDistribution.representation} دقيقة",
      "methodologicalApproach": "وصف تفصيلي وشامل لطريقة إلقاء الدرس، الشرح الوافي للمفاهيم، المقدمة الشاملة لمفهوم الدرس، التفاصيل المنهجية، الخطوات التعليمية...",
      "strategy": "اسم الاستراتيجية المستخدمة من استراتيجيات التعلم النشط (مثل: التعلم القائم على حل المشكلات، الاستكشاف الموجه، التعلم بالمشاريع، إلخ)",
      "requiredResources": "قائمة مفصلة بالموارد المطلوبة لهذه المرحلة",
      "notes": "ملاحظات إضافية مهمة للمعلم (اختياري)"
    },
    {
      "stage": "3) مشاركة",
      "time": "${timeDistribution.participation} دقيقة",
      "methodologicalApproach": "وصف تفصيلي لأنشطة التفاعل، كيفية تفاعل التلاميذ مع الدرس، الأسئلة والمناقشات، الأنشطة التطبيقية العملية...",
      "strategy": "اسم الاستراتيجية المستخدمة من استراتيجيات التعلم النشط (مثل: العمل بالأفواج، التعلم بالقرين، التعلم التعاوني، إلخ)",
      "requiredResources": "قائمة مفصلة بالموارد المطلوبة لهذه المرحلة",
      "notes": "ملاحظات إضافية مهمة للمعلم (اختياري)"
    },
    {
      "stage": "4) التقييم",
      "time": "${timeDistribution.evaluation} دقيقة",
      "methodologicalApproach": "وصف تفصيلي للتقويم المرحلي (أثناء الدرس) والتقويم الختامي (في نهاية الدرس)، أسئلة تقييمية واضحة، أنشطة تقييمية عملية، كيفية التأكد من تحقيق الكفاءة المستهدفة...",
      "strategy": "اسم الاستراتيجية المستخدمة للتقييم من استراتيجيات التعلم النشط",
      "requiredResources": "قائمة مفصلة بالموارد المطلوبة لهذه المرحلة (أوراق التقييم، أدوات التقييم، إلخ)",
      "notes": "ملاحظات إضافية مهمة للمعلم (اختياري)"
    }
  ],
  "currentActivity": "نشاط مستقل يثير الاهتمام في الدرس يمكن للتلاميذ القيام به عند بداية الحصة (اختياري - يمكن تركه فارغاً إذا لم يكن مناسباً)"
}

تأكد من:
1. أن جميع الأوصاف مفصلة وواضحة وتتضمن معلومات كافية للمعلم
2. أن الاستراتيجيات المذكورة من استراتيجيات التعلم النشط فقط
3. أن الأزمنة المذكورة متقاربة من الأزمنة المقترحة أعلاه ومجموعها قريب من ${dto.sessionDuration} دقيقة
4. أن المحتوى مناسب تماماً لمستوى القسم (${dto.classLevel})
5. أن الموارد واقعية ومتاحة في المدارس الجزائرية`;
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

      // معالجة المراحل - يمكن أن تكون أكثر من 4 أو أقل
      const requiredStages = ['1) التزام', '2) تمثيل', '3) مشاركة', '4) التقييم'];
      const stages: LessonPlanStage[] = [];
      
      // استخدام المراحل المستلمة أو إنشاء 4 مراحل افتراضية
      if (parsed.stages && parsed.stages.length > 0) {
        parsed.stages.forEach((parsedStage: any, index: number) => {
          stages.push({
            stage: parsedStage.stage || (index < 4 ? requiredStages[index] : ''),
            time: parsedStage.time || '',
            methodologicalApproach: parsedStage.methodologicalApproach || '',
            strategy: parsedStage.strategy || '',
            requiredResources: parsedStage.requiredResources || '',
            notes: parsedStage.notes || ''
          });
        });
      } else {
        // إنشاء 4 مراحل افتراضية إذا لم تكن موجودة
        for (let i = 0; i < 4; i++) {
          stages.push({
            stage: requiredStages[i],
            time: '',
            methodologicalApproach: '',
            strategy: '',
            requiredResources: '',
            notes: ''
          });
        }
      }
      
      // التأكد من وجود مراحل على الأقل (إذا كانت فارغة تماماً، أضف 4 مراحل)
      if (stages.length === 0) {
        for (let i = 0; i < 4; i++) {
          stages.push({
            stage: requiredStages[i],
            time: '',
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
        learningObjectives: dto.learningObjectives,
        currentActivity: parsed.currentActivity || '',
        memoNumber: '',
        teacherName: '',
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
        learningObjectives: dto.learningObjectives,
        currentActivity: '',
        memoNumber: '',
        teacherName: '',
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

