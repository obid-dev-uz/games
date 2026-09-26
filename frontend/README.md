# KHO Games

Android va iOS uchun JavaScript'da yozilgan mobil o'yinlar to'plami.
Asosiy stek: Vue 3, Pinia, Vue Router, Tailwind CSS v4 va Tauri 2.

## Buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `pnpm dev` | Brauzerda ishga tushirish (`http://localhost:1420`) |
| `pnpm test` | Unit testlar (vitest) |
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
├── shared/            umumiy, ma'lumotsiz yordamchilar
├── styles/main.css    Tailwind + mobil sozlamalar
└── games/
    └── <id>/          bitta o'yinga kerak bo'lgan hamma narsa
```

## Yangi o'yin qo'shish qoidalari

Har bir o'yin `src/games/<id>/` papkasida to'liq izolyatsiyada yashaydi:

1. `manifest.js` fayli `{ id, name, icon, color, order, routes }` obyektini qaytaradi. `id` papka nomiga teng bo'lishi shart. Launcher o'yinni avtomatik topadi.
2. Marshrutlar `/<id>/...` ostida joylashadi, marshrut nomlari `<id>-` bilan boshlanadi.
3. Pinia store id'lari `<id>/` bilan boshlanadi, masalan `defineStore("sudoku/game", ...)`.
4. Ma'lumotlar faqat `createStorage("<id>")` orqali saqlanadi, kalitlar `kho.<id>.*` ko'rinishida bo'ladi.
5. O'yinlar bir-birini import qilmaydi. Umumiy kod faqat `src/shared/` dan olinadi.
