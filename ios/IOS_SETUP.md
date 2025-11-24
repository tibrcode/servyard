# إعداد iOS لـ ServYard

## الخطوة 1: تنزيل GoogleService-Info.plist

1. افتح [Firebase Console](https://console.firebase.google.com)
2. اختر مشروع **servyard-de527**
3. اضغط على ⚙️ (Settings) > Project Settings
4. في قسم "Your apps"، اضغط "Add app" > iOS
5. أدخل Bundle ID: `com.servyard.app`
6. اضغط "Register app"
7. نزّل ملف `GoogleService-Info.plist`
8. انسخه إلى:
   ```
   ios/App/App/GoogleService-Info.plist
   ```

## الخطوة 2: فتح المشروع في Xcode

```bash
npx cap open ios
```

## الخطوة 3: تحديث Xcode

1. افتح `ios/App/App.xcworkspace` في Xcode
2. اختر Target "App"
3. في "Signing & Capabilities":
   - اختر فريقك (Team)
   - تأكد من Bundle Identifier: `com.servyard.app`
4. أضف Capability "Push Notifications"
5. أضف Capability "Background Modes" > Remote notifications

## الخطوة 4: بناء التطبيق

```bash
npm run build
npx cap sync ios
npx cap run ios
```

## ملاحظات مهمة

- تأكد من تثبيت Xcode 15+ وأدوات سطر الأوامر
- للاختبار على جهاز حقيقي، تحتاج حساب Apple Developer
- Push Notifications لا تعمل على Simulator
