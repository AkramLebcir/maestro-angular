# حل مشاكل نظام الاشتراكات

## مشكلة: "حدث خطأ أثناء تحميل المدفوعات"

### الحلول المحتملة:

#### 1. التأكد من وجود الجداول في قاعدة البيانات

إذا كان `synchronize: false` في إعدادات TypeORM، يجب إنشاء الجداول يدوياً:

```sql
-- إنشاء جدول subscription_plans
CREATE TABLE subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  "nameEn" VARCHAR NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('semester', 'annual')),
  price DECIMAL(10, 2) NOT NULL,
  "durationMonths" INTEGER NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  description TEXT,
  "descriptionEn" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول subscriptions
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "planId" INTEGER NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  "activatedAt" TIMESTAMP,
  "cancelledAt" TIMESTAMP,
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول payments
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id),
  "subscriptionId" INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  method VARCHAR NOT NULL DEFAULT 'manual' CHECK (method IN ('manual', 'card', 'other')),
  "transactionId" TEXT,
  "receiptNumber" TEXT,
  notes TEXT,
  "paidAt" TIMESTAMP,
  "paymentGatewayData" JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء فهارس
CREATE INDEX idx_subscriptions_user_id ON subscriptions("userId");
CREATE INDEX idx_subscriptions_plan_id ON subscriptions("planId");
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_payments_user_id ON payments("userId");
CREATE INDEX idx_payments_subscription_id ON payments("subscriptionId");
CREATE INDEX idx_payments_status ON payments(status);
```

#### 2. تفعيل Synchronize (للتطوير فقط)

في ملف `.env` أو `typeorm.config.ts`:
```typescript
synchronize: true  // فقط للتطوير، لا تستخدم في الإنتاج!
```

#### 3. التحقق من الصلاحيات

تأكد من أن المستخدم الحالي لديه صلاحيات Admin:
- يجب أن يكون `role: 'admin'` في جدول `users`
- يجب أن يكون JWT token صالح

#### 4. التحقق من الـ API Endpoint

تأكد من أن الـ endpoint صحيح:
```
GET /api/subscriptions/payments
```

#### 5. فحص Console في المتصفح

افتح Developer Tools (F12) وتحقق من:
- رسائل الخطأ في Console
- Network tab لرؤية الـ response من الـ API

#### 6. فحص Logs في Backend

تحقق من logs الـ backend لرؤية الخطأ الدقيق:
```bash
cd nest-backend
npm run start:dev
```

### إذا استمرت المشكلة:

1. **تحقق من قاعدة البيانات**:
   ```sql
   SELECT * FROM payments;
   SELECT * FROM subscriptions;
   SELECT * FROM subscription_plans;
   ```

2. **تحقق من الـ Relations**:
   قد تكون المشكلة في الـ foreign keys. تأكد من وجود البيانات المرتبطة.

3. **إعادة تشغيل الـ Backend**:
   ```bash
   cd nest-backend
   npm run start:dev
   ```

4. **مسح Cache المتصفح**:
   اضغط Ctrl+Shift+R (أو Cmd+Shift+R على Mac)

### ملاحظات:

- تم إضافة معالجة أخطاء محسّنة في الكود
- إذا فشلت الـ relations، سيتم تحميل البيانات بدون relations
- رسائل الخطأ الآن أكثر وضوحاً في Frontend









