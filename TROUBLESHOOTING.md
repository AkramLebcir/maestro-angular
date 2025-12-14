# حل مشكلة "Cannot POST /api/auth/login"

## المشكلة
عند محاولة تسجيل الدخول، يظهر الخطأ: `Cannot POST /api/auth/login`

## الحلول

### 1. تأكد من أن Backend يعمل
```bash
cd nest-backend
npm run start:dev
```

يجب أن ترى رسالة:
```
Application is running on: http://localhost:3000
API routes are available at: http://localhost:3000/api
```

### 2. اختبر Backend مباشرة
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@test.com","password":"test123456"}'
```

إذا حصلت على 404، فالمشكلة في Backend.

### 3. أعد بناء Backend
```bash
cd nest-backend
npm run build
npm run start:dev
```

### 4. تحقق من أن AuthModule مسجل
تأكد من أن `AuthModule` موجود في `app.module.ts`:
```typescript
imports: [
  // ... other modules
  AuthModule,
  UsersModule,
]
```

### 5. تحقق من Proxy Configuration
في `angular-frontend/angular.json`، تأكد من:
```json
"development": {
  "browserTarget": "angular-frontend:build:development",
  "proxyConfig": "proxy.conf.json"
}
```

### 6. شغل Angular مع Proxy
```bash
cd angular-frontend
ng serve
# أو
npm start
```

**مهم**: تأكد من تشغيل Angular في وضع development وليس production.

### 7. تحقق من Environment
في `angular-frontend/src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: '/api'  // يجب أن يكون '/api' وليس 'http://localhost:3000/api'
};
```

### 8. إنشاء حساب مسؤول أولي
إذا كان Backend يعمل ولكن لا يوجد مستخدمين:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123456",
    "role": "admin",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

**ملاحظة**: إذا لم يكن لديك token، ستحتاج إلى إنشاء المستخدم الأول مباشرة من قاعدة البيانات أو استخدام migration script.

## التحقق من الحل

1. Backend يعمل على `http://localhost:3000`
2. Angular يعمل على `http://localhost:4200`
3. يمكن الوصول إلى `http://localhost:3000/api/auth/login` مباشرة
4. Proxy يعمل بشكل صحيح

## إذا استمرت المشكلة

1. تحقق من console في المتصفح (F12)
2. تحقق من Network tab لرؤية الطلبات
3. تحقق من logs في Backend terminal
4. تأكد من أن CORS مفعل في Backend









