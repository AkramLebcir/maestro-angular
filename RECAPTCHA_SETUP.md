# إعداد reCAPTCHA

## الحصول على مفاتيح reCAPTCHA من Google

### الخطوات:

1. **زيارة صفحة إدارة reCAPTCHA:**
   - اذهب إلى: https://www.google.com/recaptcha/admin/create

2. **إنشاء موقع جديد:**
   - **Label (التسمية):** أدخل اسم للموقع (مثلاً: "Ala Project")
   - **reCAPTCHA type:** اختر **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
   - **Domains:** أضف النطاقات المسموحة:
     - للاختبار المحلي: `localhost`
     - للإنتاج: `yourdomain.com` و `www.yourdomain.com`
   - **Owners:** اختر حساب Google الخاص بك

3. **قبول الشروط والإنشاء:**
   - اضغط على "Submit"

4. **نسخ المفاتيح:**
   - **Site Key:** هذا المفتاح الذي سيظهر في Frontend
   - **Secret Key:** هذا المفتاح الذي سيستخدم في Backend (احفظه بشكل آمن!)

## إعداد Frontend

### تحديث ملفات Environment:

**`angular-frontend/src/environments/environment.ts`** (للاختبار):
```typescript
export const environment = {
  production: false,
  apiUrl: '/api',
  recaptchaSiteKey: 'YOUR_ACTUAL_SITE_KEY_HERE'
};
```

**`angular-frontend/src/environments/environment.prod.ts`** (للإنتاج):
```typescript
export const environment = {
  production: true,
  apiUrl: 'http://localhost:3000',
  recaptchaSiteKey: 'YOUR_ACTUAL_SITE_KEY_HERE'
};
```

## إعداد Backend

### إضافة Secret Key في ملف `.env`:

في مجلد `nest-backend/`، أضف أو حدث ملف `.env`:

```env
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

**ملاحظة:** لا تشارك Secret Key أبداً أو ترفعه إلى Git!

## اختبار reCAPTCHA

1. بعد إضافة المفاتيح الحقيقية، أعد تشغيل التطبيق
2. اذهب إلى صفحة تسجيل الدخول
3. يجب أن ترى reCAPTCHA بدون رسالة "testing purposes only"
4. جرب تسجيل الدخول - يجب أن يعمل بشكل طبيعي

## ملاحظات مهمة

- **المفاتيح التجريبية:** المفاتيح الحالية (`6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`) للاختبار فقط
- **النطاقات:** تأكد من إضافة جميع النطاقات التي سيستخدم فيها التطبيق
- **الأمان:** Secret Key يجب أن يبقى سرياً ولا يُعرض في الكود
- **البيئة:** استخدم مفاتيح مختلفة للاختبار والإنتاج إذا أمكن






