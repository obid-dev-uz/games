# KHO Games

Android va iOS uchun JavaScript'da yozilgan mobil o'yinlar to'plami.
Asosiy stek: Vue 3, Pinia, Vue Router, Tailwind CSS v3 va Tauri 2.

## Qo'llab-quvvatlanadigan qurilmalar

Eng eski qo'llab-quvvatlanadigan engine: **Android WebView / Chrome 88** va **iOS Safari 14**.
Shu chegara quyidagi uchta joyda belgilangan. Ularni doim bir xil holatda saqlang:

- `.browserslistrc`: CSS prefikslari (autoprefixer);
- `vite.config.js` → `build.target`: JS sintaksisi;
- `src/polyfills.js`: kutubxonalar chaqiradigan, lekin Chrome 88 da yo'q metodlar.

Shu sababli:
- Tailwind **v4 ishlatilmaydi**, chunki u Chrome 111+ talab qiladi (`oklch`, `@layer`);
- kodda `Array#at`, `structuredClone`, `Object.hasOwn`, `toSorted` kabi yangi metodlarni chaqirmang (polyfill qo'shmasangiz);
- Tailwind klasslarini doim to'liq yozing (`"bg-" + rang` kabi bo'lib yozilgan klasslar CSS'ga tushmaydi).
- Eski brauzerlar uchun zaxira qiymat kerak bo'lsa, ikki klassni birga yozmang (`min-h-screen min-h-dvh`,
  bu ziddiyat hisoblanadi). Zaxirani bitta CSS qoidasiga yozing, masalan `src/styles/main.css` dagi `.min-h-app` kabi.

## Buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `pnpm dev` | Brauzerda ishga tushirish (`http://localhost:1420`) |
| `pnpm test` | Unit testlar (vitest) |
| `pnpm lint:classes` | Bir-biriga zid Tailwind klasslarini topish (masalan `p-2 p-4`) |
| `pnpm build` | Frontend'ni `dist/` ga yig'ish |
| `pnpm tauri android dev` | Android qurilma yoki emulyatorda ishga tushirish |
| `pnpm tauri android build` | Play Market uchun AAB yig'ish |
| `pnpm tauri ios dev` / `build` | iOS (faqat macOS + Xcode) |

Release, imzolash va do'konga yuklash: [RELEASE.md](RELEASE.md).

Android uchun quyidagi muhit o'zgaruvchilari kerak:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export NDK_HOME=$ANDROID_HOME/ndk/29.0.14206865
```

## Tuzilma

```
src/
├── main.js            Vue + Pinia + Router
├── App.vue            safe-area qobig'i + <RouterView/>
├── router/            o'yin marshrutlarini avtomatik yig'adi
├── launcher/          bosh ekran (o'yinlar ro'yxati)
├── shared/            faqat ilova qobig'i uchun (o'yinlar reyestri); o'yinlar ishlatmaydi
├── styles/main.css    Tailwind + mobil sozlamalar
└── games/
    └── <id>/          bitta o'yinga kerak bo'lgan hamma narsa
```

## Yangi o'yin qo'shish qoidalari

Har bir o'yin `src/games/<id>/` papkasida to'liq izolyatsiyada yashaydi:

1. `manifest.js` fayli `{ id, name, icon, color, order, routes }` obyektini qaytaradi. `id` papka nomiga teng bo'lishi shart. Launcher o'yinni avtomatik topadi.
2. Marshrutlar `/<id>/...` ostida joylashadi, marshrut nomlari `<id>-` bilan boshlanadi.
3. Pinia store id'lari `<id>/` bilan boshlanadi, masalan `defineStore("sudoku/game", ...)`.
4. Ma'lumotlar o'yinning o'z `storage.js` fayli orqali saqlanadi, kalitlar `kho.<id>.*` ko'rinishida bo'ladi.
5. **O'yinlar hech qanday umumiy kodga ega emas.** O'yin papkasi faqat o'z ichidagi fayllarni va npm
   paketlarini import qiladi: boshqa o'yinni ham, `src/shared/` ni ham, `@/...` ni ham emas.
   Saqlash, navigatsiya, ovoz, vibratsiya, ikonkalar, test yordamchilari: hammasi har bir o'yinning
   o'z papkasida, kerak bo'lsa nusxa ko'chiriladi. Bu qoidani `src/__tests__/gameIsolation.test.js`
   tekshiradi, `pnpm test` buzilishni fayl va import bilan ko'rsatadi.
