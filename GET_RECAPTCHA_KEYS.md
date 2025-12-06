# كيفية الحصول على مفاتيح reCAPTCHA الحقيقية

## الخطوات التفصيلية:

### 1. تسجيل الدخول إلى Google reCAPTCHA Admin

1. اذهب إلى: **https://www.google.com/recaptcha/admin**
2. سجل الدخول بحساب Google الخاص بك

### 2. إنشاء موقع جديد

1. اضغط على زر **"+"** أو **"Create"** في أعلى الصفحة

2. املأ المعلومات التالية:
   - **Label (التسمية):** 
     - مثال: `Ala Project` أو `My School System`
   
   - **reCAPTCHA type:**
     - اختر: **reCAPTCHA v2**
     - ثم اختر: **"I'm not a robot" Checkbox** ✓
   
   - **Domains (النطاقات):**
     - للاختبار المحلي: أضف `localhost`
     - للإنتاج: أضف نطاقك (مثلاً: `myschool.com` و `www.myschool.com`)
     - **ملاحظة:** يمكنك إضافة عدة نطاقات، كل واحد في سطر منفصل
   
   - **Owners (المالكون):**
     - اختر حساب Google الخاص بك

3. اقرأ واقبل **Terms of Service**

4. اضغط على **"Submit"**

### 3. نسخ المفاتيح

بعد الإنشاء، ستظهر صفحة تحتوي على:

#### Site Key (المفتاح العام)
- هذا المفتاح سيستخدم في **Frontend (Angular)**
- يمكن مشاركته علناً (يظهر في الكود)
- مثال: `6LcAbCdeFgHiJkLmNoPqRsTuVwXyZ1234567890`

#### Secret Key (المفتاح السري)
- هذا المفتاح سيستخدم في **Backend (NestJS)**
- **يجب أن يبقى سرياً** ولا يُشارك أبداً
- مثال: `6LcAbCdeFgHiJkLmNoPqRsTuVwXyZ1234567890_Secret`

### 4. إضافة المفاتيح إلى المشروع

#### Frontend - تحديث environment.ts:

افتح الملف: `angular-frontend/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: '/api',
  recaptchaSiteKey: 'YOUR_ACTUAL_SITE_KEY_HERE' // ضع Site Key هنا
};
```

افتح الملف: `angular-frontend/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'http://localhost:3000',
  recaptchaSiteKey: 'YOUR_ACTUAL_SITE_KEY_HERE' // ضع نفس Site Key هنا
};
```

#### Backend - إضافة Secret Key:

1. في مجلد `nest-backend/`، أنشئ أو افتح ملف `.env`

2. أضف السطر التالي:
```env
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

**مثال كامل لملف `.env`:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=15432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=nest_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=4h

# reCAPTCHA Configuration
RECAPTCHA_SECRET_KEY=6LcAbCdeFgHiJkLmNoPqRsTuVwXyZ1234567890_Secret

# Node Environment
NODE_ENV=development
```

**ملاحظة:** إذا كان ملف `.env` موجوداً بالفعل، فقط أضف سطر `RECAPTCHA_SECRET_KEY`

### 5. إعادة تشغيل التطبيقات

#### Frontend:
```bash
cd angular-frontend
npm start
```

#### Backend:
```bash
cd nest-backend
npm run start:dev
```

### 6. التحقق من النجاح

1. اذهب إلى صفحة تسجيل الدخول
2. يجب أن ترى reCAPTCHA **بدون** رسالة "for testing purposes only"
3. جرب تسجيل الدخول - يجب أن يعمل بشكل طبيعي

## ملاحظات مهمة:

⚠️ **الأمان:**
- لا ترفع ملف `.env` إلى Git أبداً
- Secret Key يجب أن يبقى سرياً
- Site Key يمكن مشاركته (يظهر في الكود)

📝 **النطاقات:**
- للاختبار: أضف `localhost` و `127.0.0.1`
- للإنتاج: أضف النطاق الفعلي للموقع

🔄 **مفاتيح مختلفة:**
- يمكنك استخدام مفاتيح مختلفة للاختبار والإنتاج
- أو استخدام نفس المفاتيح لكليهما

## استكشاف الأخطاء:

### إذا ظهرت رسالة "Invalid site key":
- تأكد من نسخ Site Key بشكل صحيح
- تأكد من إضافة النطاق الصحيح في Google reCAPTCHA Admin
- أعد تحميل الصفحة بعد تحديث المفاتيح

### إذا فشل التحقق في Backend:
- تأكد من إضافة Secret Key في ملف `.env`
- تأكد من إعادة تشغيل Backend بعد إضافة المفتاح
- تحقق من console في Backend لرؤية رسائل الخطأ

### إذا لم تظهر reCAPTCHA:
- تأكد من تحميل script في `index.html`
- تحقق من console في المتصفح للأخطاء
- تأكد من أن Site Key صحيح

