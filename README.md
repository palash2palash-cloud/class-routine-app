# ক্লাস রুটিন (Class Routine)

শিক্ষকদের জন্য বাংলা ও ইংরেজি, দুই ভাষার সাপ্তাহিক ক্লাস রুটিন অ্যাপ। পুরোপুরি অফলাইনে চলে, সব তথ্য ফোনেই থাকে।

## APK ডাউনলোড

সবসময় সর্বশেষ সংস্করণ এই লিংকে পাবেন:

https://github.com/palash2palash-cloud/class-routine-app/releases/latest/download/ClassRoutine.apk

## কী কী করা যায়

- আজকের ক্লাসগুলো সময় অনুযায়ী কার্ডে, চলমান ক্লাস হাইলাইট করা, পরের ক্লাসের কাউন্টডাউন
- শনিবার থেকে শুক্রবার, যেকোনো দিনকে ছুটি হিসেবে চিহ্নিত করা
- ক্লাস যোগ, সম্পাদনা, মুছে ফেলা (নিশ্চিত করার পর), অন্য দিনে কপি
- প্রতিটি ক্লাসের আগে রিমাইন্ডার নোটিফিকেশন (৫, ১০, ১৫, ৩০ বা নিজের পছন্দের মিনিট; সব ক্লাসের জন্য বা আলাদা করে)
- নির্দিষ্ট বারে বা শুধু আজকের জন্য রিমাইন্ডার বন্ধ
- ১৪টি রং আর নিজের পছন্দের রং বানানোর সুবিধা
- সাপ্তাহিক তালিকা ও গ্রিড, টেনে এনে ক্লাস সাজানো, খোঁজা
- JSON ব্যাকআপ ও রিস্টোর, PNG ছবি ও PDF হিসেবে সেভ
- বাংলা/ইংরেজি ভাষা, লাইট/ডার্ক থিম

## প্রযুক্তি ও সংস্করণ

| জিনিস | সংস্করণ |
|---|---|
| @capacitor/core, cli, android | 7.6.9 |
| @capacitor/local-notifications | 7.0.7 |
| @capacitor/filesystem | 7.1.9 |
| @capacitor/share | 7.0.4 |
| @capacitor/app | 7.1.2 |
| SortableJS (www/lib) | 1.15.7 |
| ফন্ট: Hind Siliguri (www/fonts) | Google Fonts, SIL OFL 1.1 |
| Android | minSdk 23 (Android 6), targetSdk 35 |
| Build | Node 22, Java 21, GitHub Actions |

## ফাইলগুলো কোথায়

- `www/` : অ্যাপের HTML, CSS, JavaScript, অনুবাদ (`www/i18n/bn.json`, `www/i18n/en.json`), ফন্ট
- `resources/` : অ্যাপ আইকন আর স্প্ল্যাশ স্ক্রিন
- `scripts/prepare-android.js` : Android প্রজেক্টে আইকন, অনুমতি, সংস্করণ বসায়
- `keystore/debug.keystore` : অ্যাপে সই করার স্থায়ী চাবি, যাতে আপডেটের সময় পুরোনো অ্যাপ মুছতে না হয়। এটি মুছবেন না।
- `.github/workflows/build.yml` : GitHub Actions দিয়ে APK তৈরি আর Release-এ রাখা
