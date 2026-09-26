# Release qo'llanmasi (Play Market va App Store)

## 1. Versiya

Versiya faqat `src-tauri/tauri.conf.json` dagi `version` maydonida o'zgartiriladi, masalan `0.1.0` → `0.2.0`.
Android'ning `versionCode` qiymati undan avtomatik hisoblanadi: `major*1000000 + minor*1000 + patch`.
Har bir yangi yuklashda versiya albatta oshirilishi kerak, aks holda Play Console uni qabul qilmaydi.

> **Ilova identifikatori** (`identifier`, hozir `kho.games`) Play Market va App Store'da **birinchi
> yuklashdan keyin o'zgartirib bo'lmaydi**. Uni birinchi release'dan oldin tasdiqlab oling.

## 2. Android

### Muhit

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export NDK_HOME=$ANDROID_HOME/ndk/29.0.14206865
```

Qo'shimcha Rust targetlari o'rnatilgan bo'lishi kerak: `aarch64`, `armv7`, `i686` va `x86_64` (`-linux-android`).

### Upload kalitini yaratish (bir marta)

Kalitni **faqat o'zingiz** yarating va parolni xavfsiz joyda saqlang.
Kalit yoki parol yo'qolsa, ilovani yangilab bo'lmaydi. Play App Signing'da buni tiklash mumkin, lekin jarayon uzoq davom etadi.

```bash
mkdir -p ~/keys && keytool -genkey -v -keystore ~/keys/kho-games-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

Keyin `src-tauri/gen/android/keystore.properties` faylini yarating. Bu fayl git'ga tushmaydi:

```properties
storeFile=/home/<user>/keys/kho-games-upload.jks
storePassword=<parol>
keyAlias=upload
keyPassword=<parol>
```

Agar bu fayl bo'lmasa, release build imzosiz chiqadi. Bunday build Play Console'ga yuklanmaydi.

### Yig'ish

```bash
pnpm tauri android build --aab
```

Natija: `src-tauri/gen/android/app/build/outputs/bundle/universalRelease/app-universal-release.aab`.
Bu faylni Play Console → **Testing → Internal testing** bo'limiga yuklang va avval shu yerda sinab ko'ring.

Telefonda tekshirish uchun USB debugging yoqilgan holda quyidagini ishga tushiring:

```bash
pnpm tauri android dev
```

### Generatsiya qilingan fayllarga kiritilgan qo'lda o'zgartirishlar

`src-tauri/gen/android` git'da saqlanadi. `pnpm tauri android init` qayta ishga tushirilsa, quyidagi o'zgartirishlar yo'qoladi va ularni **qayta kiritish** kerak:

| Fayl | O'zgartirish |
|---|---|
| `buildSrc/.../BuildTask.kt` | `pnpm-native` → `pnpm` (aks holda Gradle build yiqiladi) |
| `app/src/main/AndroidManifest.xml` | `screenOrientation="portrait"`, Android TV qatorlari olib tashlangan |
| `app/src/main/java/kho/games/MainActivity.kt` | tizim panellari (status/nav bar) uchun chekinish |
| `app/src/main/res/values*/colors.xml`, `themes.xml` | ilova foni va splash rangi (`#F8FAFC` / `#0F172A`) |
| `app/build.gradle.kts` | `keystore.properties` orqali release imzolash |

### Ikonka

Manba fayl: `app-icon.svg`. Uni o'zgartirgandan keyin quyidagini ishga tushiring:

```bash
pnpm tauri icon app-icon.svg
```

So'ng `res/values/ic_launcher_background.xml` dagi rangni `#4f46e5` ga qaytaring, chunki buyruq uni `#fff` ga o'zgartiradi.

## 3. iOS (faqat macOS)

Kerak bo'ladi: Xcode, Apple Developer akkaunti ($99/yil) va `rustup target add aarch64-apple-ios aarch64-apple-ios-sim`.

```bash
pnpm tauri ios init
pnpm tauri icon app-icon.svg
pnpm tauri ios dev
pnpm tauri ios build
```

`tauri ios init` dan keyin Xcode'da (`src-tauri/gen/apple`) quyidagilarni sozlang:
- **Signing & Capabilities:** o'z Team'ingizni tanlang.
- **Deployment Info:** faqat *Portrait* (iPhone) qoldiring.

Tayyor IPA Xcode → Product → Archive orqali App Store Connect'ga yuklanadi. Avval TestFlight'da sinab ko'ring.

## 4. Do'kon uchun tekshiruv ro'yxati

- [ ] Ilova identifikatori tasdiqlangan
- [ ] Maxfiylik siyosati sahifasi (URL). Ilova hech qanday shaxsiy ma'lumot yig'maydi, hammasi qurilmada saqlanadi.
- [ ] Play Console'da **Data safety**: "No data collected"
- [ ] Kontent reytingi so'rovnomasi (IARC)
- [ ] Skrinshotlar: telefon uchun kamida 2 ta (Play), 6.7" va 6.5" iPhone o'lchamlari (App Store)
- [ ] Qisqa va to'liq tavsif (uz / ru / en)
- [ ] 512×512 ikonka (Play) va 1024×1024 ikonka (App Store): `src-tauri/icons/` dan yoki `app-icon.svg` dan
- [ ] Play uchun 1024×500 feature graphic
