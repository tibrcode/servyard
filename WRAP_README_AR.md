# تغليف مشروع Vite React (Lovable) لتشغيله على Android و iOS والويب عبر Capacitor

هذا الدليل يوضح كيف نغلف تطبيق الويب الحالي بدون تعديل أي كود داخلي، باستخدام Capacitor لتشغيل نفس البناء (dist) على Android و iOS بالإضافة إلى الويب.

## المتطلبات
- Node.js و npm مثبتين.
- Android Studio (لأندرويد).
- على macOS فقط: Xcode لتجهيز iOS.

## التثبيت الأولي
1) تثبيت الحزم:
```
npm install
```

2) بناء الويب (Vite):
```
npm run build
```

3) إضافة المنصات (مرة واحدة):
- Android:
```
npm run cap:add:android
```
- iOS (يتطلب macOS):
```
npm run cap:add:ios
```

## مزامنة الموارد بعد كل تعديل أو بناء
```
npm run cap:sync
```
أو خصيصًا لمنصة معينة:
```
cap sync android
cap sync ios
```

## تشغيل التطبيق على أندرويد
- فتح المشروع في Android Studio:
```
npm run android
```
سيقوم بالأوامر: build → sync android → open android

- تشغيل مباشر على جهاز/محاكي:
```
npm run android:run
```

- وضع التطوير مع التحديث الحي (Live Reload):
```
npm run dev
npm run android:dev
```
تأكد أن هاتفك وجهاز التطوير على نفس الشبكة، وقد تحتاج لتعديل `capacitor.config.ts` (قسم server) ووضع عنوان الـ LAN الخاص بك إن لزم.

## تشغيل التطبيق على iOS (على macOS)
- فتح المشروع في Xcode:
```
npm run ios
```
- تشغيل مباشر:
```
npm run ios:run
```
- وضع التطوير الحي:
```
npm run dev
npm run ios:dev
```

## ملاحظات مهمة
- لا نغيّر أي كود داخل `src/`؛ التغليف يتم عبر ملفات Capacitor فقط.
- ناتج البناء يوضع في `dist/` ويقوم Capacitor بنسخه داخل مشاريع المنصات.
- إذا غيّرت أي إعدادات شبكة/بروتوكول، استخدم الحقول داخل `capacitor.config.ts` (مثل `server.url`, `androidScheme`, `iosScheme`).
- أول تشغيل على أندرويد قد يتطلب تمكين "Install via USB" أو إعدادات مطور.

## أوامر مفيدة
- تشخيص بيئة كاباسيتور:
```
npm run cap:doctor
```

بالتوفيق ✨
