# حل سريع لمشكلة "Cannot POST /api/auth/login"

## المشكلة
Backend يعيد 404 عند محاولة الوصول إلى `/api/auth/login`

## الحل السريع

### 1. أوقف Backend الحالي
```bash
pkill -f "nest start"
```

### 2. أعد بناء Backend
```bash
cd nest-backend
npm run build
```

### 3. شغل Backend من جديد
```bash
npm run start:dev
```

### 4. اختبر المسار
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@test.com","password":"test123456"}'
```

## إذا استمرت المشكلة

1. **تحقق من أن Backend يعمل على المنفذ الصحيح:**
   ```bash
   lsof -ti:3000
   ```

2. **تحقق من logs:**
   ```bash
   # في terminal آخر
   cd nest-backend
   npm run start:dev
   # راقب الرسائل للتأكد من أن AuthModule محمل
   ```

3. **تحقق من أن Angular يستخدم Proxy:**
   - تأكد من تشغيل `ng serve` (وليس `ng serve --configuration production`)
   - تحقق من `angular.json` أن `proxyConfig` موجود في development configuration

4. **اختبر مباشرة بدون Proxy:**
   - في `environment.ts`، غيّر `apiUrl` إلى `'http://localhost:3000/api'`
   - اختبر من المتصفح مباشرة

## ملاحظة مهمة

إذا كان Backend يعمل بالفعل، قد تحتاج فقط إلى:
- إعادة تحميل الصفحة في المتصفح
- مسح cache المتصفح
- التأكد من أن Angular يعمل على `http://localhost:4200`



