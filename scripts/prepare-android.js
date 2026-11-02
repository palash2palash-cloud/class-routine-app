/*
 * `npx cap add android` যে Android প্রজেক্ট বানায়, তাতে আমাদের নিজস্ব জিনিস বসানো হয়:
 *   - অ্যাপ আইকন, স্প্ল্যাশ স্ক্রিন, নোটিফিকেশনের ছোট আইকন
 *   - নোটিফিকেশন ও ঠিক-সময়ের অ্যালার্মের অনুমতি (AndroidManifest.xml)
 *   - প্রতিবার build-এ নতুন versionCode, যাতে পুরোনো অ্যাপের উপর আপডেট বসে
 *   - স্থায়ী signing key, যাতে আপডেট করতে গিয়ে অ্যাপ মুছতে না হয়
 * GitHub Actions এটি নিজে চালায়। আপনাকে কিছু করতে হবে না।
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = path.join(root, 'android', 'app');
const main = path.join(app, 'src', 'main');
const res = path.join(main, 'res');
const runNumber = parseInt(process.argv[2] || process.env.GITHUB_RUN_NUMBER || '1', 10) || 1;

function fail(msg) {
  console.error('prepare-android: ' + msg);
  process.exit(1);
}

function read(file) {
  if (!fs.existsSync(file)) fail('file not found: ' + file);
  return fs.readFileSync(file, 'utf8');
}

function replaceOnce(file, search, replacement) {
  const text = read(file);
  if (text.indexOf(search) === -1) fail('text not found in ' + path.relative(root, file) + ': ' + search);
  fs.writeFileSync(file, text.replace(search, replacement));
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// ১. পুরোনো splash.png গুলো সরিয়ে আমাদের আইকন/স্প্ল্যাশ বসানো
(function removeSplashPngs(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) removeSplashPngs(p);
    else if (entry.name === 'splash.png') fs.unlinkSync(p);
  }
})(res);
copyDir(path.join(root, 'resources', 'android', 'res'), res);
console.log('icons and splash copied');

// ২. Android 12+ স্প্ল্যাশের পটভূমির রং
replaceOnce(
  path.join(res, 'values', 'styles.xml'),
  '<item name="android:background">@drawable/splash</item>',
  '<item name="android:background">@drawable/splash</item>\n        <item name="windowSplashScreenBackground">@color/routine_splash_bg</item>'
);
console.log('splash theme updated');

// ৩. অনুমতি
const permissions = [
  '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
  '<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />',
  '<uses-permission android:name="android.permission.WAKE_LOCK" />',
  '<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" android:maxSdkVersion="32" />',
  '<uses-permission android:name="android.permission.USE_EXACT_ALARM" />'
].map(function (p) { return '    ' + p; }).join('\n');
replaceOnce(
  path.join(main, 'AndroidManifest.xml'),
  '<uses-permission android:name="android.permission.INTERNET" />',
  '<uses-permission android:name="android.permission.INTERNET" />\n' + permissions
);
console.log('permissions added');

// ৪. সংস্করণ নম্বর
const gradleFile = path.join(app, 'build.gradle');
replaceOnce(gradleFile, 'versionCode 1\n', 'versionCode ' + runNumber + '\n');
replaceOnce(gradleFile, 'versionName "1.0"', 'versionName "1.0.' + runNumber + '"');
console.log('version set to 1.0.' + runNumber + ' (' + runNumber + ')');

// ৫. স্থায়ী signing key
const keystore = path.join(root, 'keystore', 'debug.keystore');
if (!fs.existsSync(keystore)) fail('keystore missing: ' + keystore);
replaceOnce(
  gradleFile,
  'android {\n',
  'android {\n' +
  '    signingConfigs {\n' +
  '        debug {\n' +
  "            storeFile file('" + keystore.replace(/\\/g, '/') + "')\n" +
  "            storePassword 'android'\n" +
  "            keyAlias 'androiddebugkey'\n" +
  "            keyPassword 'android'\n" +
  '        }\n' +
  '    }\n'
);
console.log('signing config added');
console.log('prepare-android: done');
