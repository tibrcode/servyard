# 🔐 دليل تفعيل Google Sign-In للموبايل Android

## المحتويات
1. [إعدادات Firebase Console](#1-إعدادات-firebase-console)
2. [إعدادات Google Cloud Console](#2-إعدادات-google-cloud-console)
3. [تثبيت Dependencies](#3-تثبيت-dependencies)
4. [ملف Helper: googleAuth.ts](#4-ملف-helper-googleauthts)
5. [تحديث build.gradle](#5-تحديث-buildgradle)
6. [تحديث AndroidManifest.xml](#6-تحديث-androidmanifestxml)
7. [استخدام في Components](#7-استخدام-في-components)
8. [بناء APK](#8-بناء-apk)
9. [ملاحظات مهمة](#9-ملاحظات-مهمة)

---

## 1️⃣ إعدادات Firebase Console

### أ) إضافة تطبيق Android:

1. اذهب إلى: https://console.firebase.google.com
2. اختر المشروع → **Project Settings** → **Add app** → **Android**
3. أدخل:
   - **Package name**: `com.yourapp.package` (من `android/app/build.gradle`)
   - **App nickname**: اسم التطبيق

### ب) الحصول على SHA-1 fingerprint:

```bash
keytool -list -v -keystore android/app/your-keystore.keystore -alias your-alias -storepass yourpassword | grep "SHA1:"
```

**مثال للناتج:**
```
SHA1: C4:61:CD:39:E6:89:A0:1B:C3:56:1D:A5:DD:78:E4:C6:BC:9D:68:2F
```

5. أضف SHA-1 في Firebase Console
6. **حمّل** `google-services.json` وضعه في: `android/app/google-services.json`

---

## 2️⃣ إعدادات Google Cloud Console

### أ) تفعيل APIs:

1. اذهب إلى: https://console.cloud.google.com/apis/library
2. فعّل هذه الـ APIs:
   - ✅ Maps JavaScript API
   - ✅ Maps SDK for Android
   - ✅ Places API
   - ✅ Geolocation API

### ب) إعداد API Key:

1. اذهب إلى: https://console.cloud.google.com/apis/credentials
2. اختر API Key الموجود أو أنشئ جديد
3. **Application restrictions**: 
   - للتجربة: اختر `None`
   - للإنتاج: اختر `Android apps` و `HTTP referrers`
4. **API restrictions**: 
   - اختر `Restrict key`
   - حدد الـ APIs المفعلة أعلاه
5. احفظ التغييرات

### ج) تفعيل Billing (ضروري جداً):

⚠️ **Google Maps لا يعمل بدون billing حتى في الاستخدام المجاني!**

1. اذهب إلى: https://console.cloud.google.com/billing
2. أضف بطاقة ائتمانية
3. تحصل على **$200 مجاناً كل شهر**
4. لن تُخصم أي مبالغ للاستخدام العادي

---

## 3️⃣ تثبيت Dependencies

```bash
npm install @codetrix-studio/capacitor-google-auth
```

---

## 4️⃣ ملف Helper: googleAuth.ts

**المسار:** `src/lib/firebase/googleAuth.ts`

```typescript
import { GoogleAuthProvider, signInWithPopup, signInWithCredential } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

// Initialize Google Auth for Capacitor
if (Capacitor.isNativePlatform()) {
  GoogleAuth.initialize({
    clientId: '866507388194-klhudvu1tasm4fp8dt4dd6f8ttinqhnq.apps.googleusercontent.com', // من google-services.json
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  });
}

// Sign out from Google to force account selection
async function clearGoogleSession() {
  try {
    if (Capacitor.isNativePlatform()) {
      // Sign out from Google Auth to clear cached account
      await GoogleAuth.signOut().catch(() => {
        // Ignore errors if not signed in
      });
    }
  } catch (error) {
    console.log('Clear session error (ignored):', error);
  }
}

export async function signInWithGoogle() {
  try {
    // Clear previous session to force account selection
    await clearGoogleSession();
    
    // For native platforms (iOS/Android)
    if (Capacitor.isNativePlatform()) {
      // Force account selection on mobile
      const googleUser = await GoogleAuth.signIn();
      
      // Create Firebase credential from Google token
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
      
      // Sign in to Firebase with the credential
      const result = await signInWithCredential(auth, credential);
      return result;
    } 
    // For web
    else {
      const provider = new GoogleAuthProvider();
      // Force account selection on web
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      return result;
    }
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

// Function to sign out from Google on mobile
export async function signOutGoogle() {
  try {
    if (Capacitor.isNativePlatform()) {
      await GoogleAuth.signOut();
    }
    await auth.signOut();
  } catch (error) {
    console.error('Google Sign-Out Error:', error);
    throw error;
  }
}
```

**ملاحظة:** استبدل `clientId` بالقيمة من ملف `google-services.json` الخاص بك:
- ابحث عن `oauth_client` → `client_type: 3` → انسخ `client_id`

---

## 5️⃣ تحديث build.gradle

**المسار:** `android/app/build.gradle`

أضف هذه السطور في قسم `dependencies`:

```gradle
dependencies {
    implementation fileTree(include: ['*.jar'], dir: 'libs')
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
    implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
    implementation project(':capacitor-android')
    
    // إضافة Google Play Services
    implementation 'com.google.android.gms:play-services-location:21.0.1'
    implementation 'com.google.android.gms:play-services-maps:18.2.0'
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
    
    testImplementation "junit:junit:$junitVersion"
    androidTestImplementation "androidx.test.ext:junit:$androidxJunitVersion"
    androidTestImplementation "androidx.test.espresso:espresso-core:$androidxEspressoCoreVersion"
    implementation project(':capacitor-cordova-android-plugins')
}
```

---

## 6️⃣ تحديث AndroidManifest.xml

**المسار:** `android/app/src/main/AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8" ?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <!-- Google Maps API Key -->
        <meta-data
            android:name="com.google.android.geo.API_KEY"
            android:value="YOUR_API_KEY_HERE"/>
        
        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/file_paths" />
        </provider>
    </application>

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />
    <uses-feature android:name="android.hardware.location.network" android:required="false" />
</manifest>
```

**⚠️ استبدل** `YOUR_API_KEY_HERE` بالـ API Key من Google Cloud Console

---

## 7️⃣ استخدام في Components

**مثال في LoginForm.tsx:**

```typescript
import { signInWithGoogle } from "@/lib/firebase/googleAuth";

const handleGoogleSignIn = async () => {
  setError('');
  setIsGoogleLoading(true);
  try {
    await signInWithGoogle();
    toast({ title: 'تم تسجيل الدخول بنجاح' });
    navigate('/home');
  } catch (err: any) {
    console.error('Google sign-in error:', err);
    let errorMessage = err?.message || 'فشل تسجيل الدخول';
    if (errorMessage.includes('User cancelled')) {
      errorMessage = '';
    }
    if (errorMessage) setError(errorMessage);
  } finally {
    setIsGoogleLoading(false);
  }
};

return (
  <Button 
    onClick={handleGoogleSignIn}
    disabled={isGoogleLoading}
  >
    {isGoogleLoading ? 'جاري التحميل...' : 'تسجيل الدخول بـ Google'}
  </Button>
);
```

---

## 8️⃣ بناء APK

### الخطوة 1: إنشاء Keystore (مرة واحدة فقط)

```bash
cd android/app
keytool -genkey -v -keystore your-app-release.keystore \
  -alias your-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass yourpassword \
  -keypass yourpassword \
  -dname "CN=YourCompany, OU=Development, O=YourCompany, L=City, S=State, C=US"
```

### الخطوة 2: Build Web

```bash
npm run build
```

### الخطوة 3: Sync مع Android

```bash
npx cap sync android
```

### الخطوة 4: Build APK الموقع

```bash
cd android
export ANDROID_HOME=~/Library/Android/sdk
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=$(pwd)/app/your-app-release.keystore \
  -Pandroid.injected.signing.store.password=yourpassword \
  -Pandroid.injected.signing.key.alias=your-alias \
  -Pandroid.injected.signing.key.password=yourpassword
```

### الخطوة 5: العثور على APK

```bash
open app/build/outputs/apk/release/
```

الملف: `app-release.apk`

---

## 9️⃣ ملاحظات مهمة

### ✅ OAuth Client ID
- استخدم **Web Client ID** من `google-services.json`
- ليس Android Client ID!
- ابحث عن `client_type: 3` في الملف

### ✅ SHA-1 Fingerprint
- يجب أن يطابق الـ keystore المستخدم في التوقيع
- مختلف لكل keystore
- أضفه في Firebase Console

### ✅ Billing Account
- **ضروري جداً** حتى في الاستخدام المجاني
- Google Maps لن يعمل بدونه
- $200 مجاناً شهرياً

### ✅ API Restrictions
- للتجربة: `None`
- للإنتاج: حدد APIs المستخدمة فقط

### ✅ Force Account Selection
- دالة `clearGoogleSession()` تجبر اختيار الحساب في كل مرة
- مهمة لتجربة مستخدم احترافية
- تمنع استخدام حساب محفوظ تلقائياً

### ✅ index.html للخرائط

أضف في `index.html` قبل `</head>`:

```html
<script>
  window.GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY_HERE';
  window.googleMapsLoaded = false;
  
  window.initGoogleMaps = function() {
    window.googleMapsLoaded = true;
    console.log('✅ Google Maps API loaded successfully');
  };
  
  window.gm_authFailure = function() {
    console.error('❌ Google Maps authentication failed');
  };
</script>
<script 
  async 
  defer
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&libraries=places&callback=initGoogleMaps&v=weekly"
  onerror="console.error('❌ Failed to load Google Maps script')">
</script>
```

---

## 🎯 Checklist النهائي

قبل النشر، تأكد من:

- [ ] تم إضافة Android app في Firebase
- [ ] تم إضافة SHA-1 في Firebase
- [ ] تم تحميل google-services.json
- [ ] تم تفعيل جميع APIs في Google Cloud
- [ ] تم إعداد API Key بشكل صحيح
- [ ] تم تفعيل Billing Account
- [ ] تم تثبيت `@codetrix-studio/capacitor-google-auth`
- [ ] تم إنشاء ملف `googleAuth.ts`
- [ ] تم تحديث `build.gradle`
- [ ] تم تحديث `AndroidManifest.xml`
- [ ] تم إنشاء keystore للتوقيع
- [ ] تم بناء APK واختباره

---

## 📞 روابط مهمة

- Firebase Console: https://console.firebase.google.com
- Google Cloud Console: https://console.cloud.google.com
- Billing: https://console.cloud.google.com/billing
- APIs Library: https://console.cloud.google.com/apis/library
- Credentials: https://console.cloud.google.com/apis/credentials

---

## 🐛 حل المشاكل الشائعة

### المشكلة: "Google Maps authentication failed"
**الحل:**
1. تحقق من تفعيل Billing
2. تحقق من API Key في `AndroidManifest.xml`
3. تأكد من تفعيل Maps SDK for Android
4. غيّر Application restrictions إلى `None` مؤقتاً

### المشكلة: Google Sign-In يستخدم نفس الحساب دائماً
**الحل:**
- دالة `clearGoogleSession()` تحل هذه المشكلة
- أو احذف cache التطبيق من إعدادات Android

### المشكلة: الخريطة تظهر ثم تختفي
**الحل:**
1. تحقق من Billing Account
2. تحقق من Application restrictions في API Key
3. تحقق من تفعيل Maps JavaScript API

---

**تم إنشاؤه بواسطة:** GitHub Copilot  
**التاريخ:** نوفمبر 2025  
**الإصدار:** 1.0

🎉 **بالتوفيق في مشروعك!**
