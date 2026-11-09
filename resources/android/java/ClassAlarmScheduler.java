package com.palash.classroutine;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import org.json.JSONArray;
import org.json.JSONObject;

/*
 * ক্লাসের রিমাইন্ডার নিজেরাই সামলানো হয় (কোনো বাইরের প্লাগইন ছাড়া):
 *  - সব রিমাইন্ডারের তালিকা ফোনের ভেতরে (SharedPreferences) রাখা থাকে
 *  - শুধু সবচেয়ে কাছের রিমাইন্ডারটির জন্য AlarmManager.setAlarmClock() বসানো হয়।
 *    এটা ফোনের অ্যালার্ম ঘড়ির মতোই কাজ করে: ঘুমন্ত ফোন বা ব্যাটারি-সেভারেও ঠিক সময়ে বাজে।
 *  - অ্যালার্ম বাজলে নোটিফিকেশন দেখানো হয় আর পরেরটি বসানো হয়
 *  - ফোন রিস্টার্ট বা সময় বদলালে আবার বসানো হয় (ClassAlarmBootReceiver)
 */
public class ClassAlarmScheduler {

    // আগের সংস্করণের channel; নিজের বাছাই করা শব্দ হলে channel id বদলায় (channel তৈরি হলে শব্দ আর বদলানো যায় না)
    public static final String CHANNEL_ID = "class-alarm-v3";
    static final String KEY_SOUND = "sound_uri";
    // কিছু বাছাই না করলে এই শব্দ বাজে
    static final String DEFAULT_TONE = "tone_dingdong";
    static final String KEY_SOUND_TITLE = "sound_title";
    // ক্যালেন্ডারের দিনের কাজ: শব্দ ছাড়া, সারাদিন নোটিফিকেশন বারে থাকে
    public static final String PIN_CHANNEL_ID = "day-tasks-v1";
    static final int PIN_BASE = 70000;
    static final String PREFS = "class_alarm_store";
    static final String KEY_LIST = "alarms";
    static final String ACTION_FIRE = "com.palash.classroutine.CLASS_ALARM";
    static final String ACTION_TEST = "com.palash.classroutine.CLASS_ALARM_TEST";
    static final int REQ_NEXT = 4242;
    static final int REQ_TEST = 4243;
    static final int REQ_OPEN = 4244;

    /* জোরে বিপসহ notification channel (একবার তৈরি হলে আর বদলায় না) */
    public static void ensureChannel(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;
        // আগের channel গুলো (কোনো সেটিং ভুলভাবে বদলে গিয়ে থাকলে) মুছে নতুন করে তৈরি
        nm.deleteNotificationChannel("class-reminders");
        nm.deleteNotificationChannel("class-alarm-v1");
        nm.deleteNotificationChannel("class-alarm-v2");
        if (nm.getNotificationChannel(PIN_CHANNEL_ID) == null) {
            NotificationChannel pin = new NotificationChannel(
                PIN_CHANNEL_ID,
                "আজকের কাজ / Today's tasks",
                NotificationManager.IMPORTANCE_LOW
            );
            pin.setDescription("ক্যালেন্ডারে যেদিন কাজ আছে, সেদিন সারাদিন নোটিফিকেশন বারে থাকে");
            pin.setShowBadge(false);
            pin.setSound(null, null);
            pin.enableVibration(false);
            pin.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(pin);
        }
        String cid = channelId(ctx);
        // শব্দ বদলালে পুরোনো রিমাইন্ডার channel গুলো সরিয়ে ফেলা
        for (NotificationChannel old : nm.getNotificationChannels()) {
            String id = old.getId();
            if (id.startsWith("class-alarm-") && !id.equals(cid)) nm.deleteNotificationChannel(id);
        }
        if (nm.getNotificationChannel(cid) != null) return;
        NotificationChannel channel = new NotificationChannel(
            cid,
            "ক্লাস রিমাইন্ডার / Class reminders",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("ক্লাস শুরুর আগে জোরে বিপ দিয়ে মনে করিয়ে দেয়");
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[] { 0, 600, 250, 600, 250, 600 });
        channel.enableLights(true);
        channel.setLightColor(Color.BLUE);
        channel.setBypassDnd(true);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        // শব্দ channel দিয়ে নয়, অ্যাপ নিজে বাজায় (playSound), যাতে যেকোনো ফোনে বাছাই করা শব্দই বাজে
        channel.setSound(null, null);
        nm.createNotificationChannel(channel);
    }

    /* ব্যবহারকারীর বাছাই করা শব্দ (ফোনের নিজের রিংটোন/নোটিফিকেশন টোন); ফাঁকা থাকলে অ্যাপের বিপ */
    public static String savedSound(Context ctx) {
        return prefs(ctx).getString(KEY_SOUND, "");
    }

    public static String savedSoundTitle(Context ctx) {
        return prefs(ctx).getString(KEY_SOUND_TITLE, "");
    }

    public static Uri soundUri(Context ctx) {
        String u = savedSound(ctx);
        if (u != null && u.matches("android\\.resource://.*/raw/tone_[a-z]+")) return rawUri(ctx, u.substring(u.lastIndexOf('/') + 1));
        if (u != null && u.contains("/raw/class_beep")) return rawUri(ctx, DEFAULT_TONE);
        if (u != null && !u.isEmpty()) return Uri.parse(u);
        return rawUri(ctx, DEFAULT_TONE);
    }

    public static String channelId(Context ctx) {
        return CHANNEL_ID;
    }

    /* অ্যাপের raw শব্দের ঠিকানা resource id দিয়ে (নাম দিয়ে ঠিকানা কিছু ফোনে খোলে না) */
    public static Uri rawUri(Context ctx, String name) {
        int rid = ctx.getResources().getIdentifier(name, "raw", ctx.getPackageName());
        if (rid == 0) rid = ctx.getResources().getIdentifier(DEFAULT_TONE, "raw", ctx.getPackageName());
        return Uri.parse("android.resource://" + ctx.getPackageName() + "/" + rid);
    }

    private static MediaPlayer player;
    private static final Handler main = new Handler(Looper.getMainLooper());

    public static synchronized void stopSound() {
        if (player != null) {
            try { player.stop(); } catch (Exception ignored) {}
            try { player.release(); } catch (Exception ignored) {}
            player = null;
        }
    }

    /* শব্দ একবার বাজানো (সর্বোচ্চ maxMs), অ্যালার্মের ভলিউমে; done শেষে ডাকা হয় */
    public static synchronized void playSound(Context ctx, Uri uri, long maxMs, Runnable done) {
        stopSound();
        Context app = ctx.getApplicationContext();
        MediaPlayer mp = new MediaPlayer();
        try {
            mp.setAudioAttributes(new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build());
            mp.setDataSource(app, uri);
            mp.prepare();
        } catch (Exception e) {
            try { mp.release(); } catch (Exception ignored) {}
            // বাছাই করা শব্দ খুলতে না পারলে অ্যাপের বিপ
            mp = MediaPlayer.create(app, rawUri(app, DEFAULT_TONE));
            if (mp == null) {
                // শেষ চেষ্টা: Android-এর Ringtone দিয়ে বাজানো
                try {
                    android.media.Ringtone rt = android.media.RingtoneManager.getRingtone(app, uri);
                    if (rt != null) {
                        rt.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
                        rt.play();
                        main.postDelayed(rt::stop, maxMs);
                    }
                } catch (Exception ignored) {}
                if (done != null) done.run();
                return;
            }
        }
        player = mp;
        final MediaPlayer cur = mp;
        final Runnable fin = new Runnable() {
            boolean ran = false;
            public void run() {
                if (ran) return;
                ran = true;
                synchronized (ClassAlarmScheduler.class) { if (player == cur) stopSound(); }
                if (done != null) done.run();
            }
        };
        cur.setOnCompletionListener(m -> fin.run());
        cur.start();
        main.postDelayed(fin, maxMs);
    }

    public static void setSound(Context ctx, String uri, String title) {
        prefs(ctx).edit().putString(KEY_SOUND, uri == null ? "" : uri).putString(KEY_SOUND_TITLE, title == null ? "" : title).apply();
        ensureChannel(ctx);
    }

    static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static JSONArray load(Context ctx) {
        try {
            return new JSONArray(prefs(ctx).getString(KEY_LIST, "[]"));
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    static void save(Context ctx, JSONArray list) {
        prefs(ctx).edit().putString(KEY_LIST, list.toString()).apply();
    }

    public static void replaceAll(Context ctx, JSONArray list) {
        save(ctx, list);
        scheduleNext(ctx);
    }

    public static void clear(Context ctx) {
        save(ctx, new JSONArray());
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(firePending(ctx));
    }

    static PendingIntent firePending(Context ctx) {
        Intent i = new Intent(ctx, ClassAlarmReceiver.class).setAction(ACTION_FIRE);
        return PendingIntent.getBroadcast(ctx, REQ_NEXT, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static PendingIntent openAppPending(Context ctx) {
        Intent open = new Intent(ctx, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(ctx, REQ_OPEN, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    public static boolean canExact(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        return am != null && am.canScheduleExactAlarms();
    }

    /* তালিকার সবচেয়ে কাছের ভবিষ্যৎ রিমাইন্ডারের সময় (না থাকলে -1) */
    public static long nextTime(Context ctx) {
        return nextTime(ctx, false);
    }

    /* onlyAlarms = true হলে শুধু বিপ দেওয়া রিমাইন্ডার ধরা হয় (সেটিংসে "পরের রিমাইন্ডার" দেখানোর জন্য) */
    public static long nextTime(Context ctx, boolean onlyAlarms) {
        JSONArray list = load(ctx);
        long now = System.currentTimeMillis();
        long best = -1;
        for (int i = 0; i < list.length(); i++) {
            JSONObject o = list.optJSONObject(i);
            if (o == null) continue;
            if (onlyAlarms && !"alarm".equals(o.optString("kind", "alarm"))) continue;
            long at = o.optLong("at", 0);
            if (at > now && (best == -1 || at < best)) best = at;
        }
        return best;
    }

    static boolean isAlarmAt(Context ctx, long at) {
        JSONArray list = load(ctx);
        for (int i = 0; i < list.length(); i++) {
            JSONObject o = list.optJSONObject(i);
            if (o != null && o.optLong("at", 0) == at && "alarm".equals(o.optString("kind", "alarm"))) return true;
        }
        return false;
    }

    /* আগের "আজকের কাজ" নোটিফিকেশনগুলো সরানো (তালিকা নতুন করে বসানোর আগে) */
    public static void clearPins(Context ctx) {
        NotificationManagerCompat nmc = NotificationManagerCompat.from(ctx);
        for (int i = 0; i < 40; i++) nmc.cancel(PIN_BASE + i);
    }

    public static long scheduleNext(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return -1;
        PendingIntent pi = firePending(ctx);
        long next = nextTime(ctx);
        // ফোন বন্ধ থাকায় সময় পেরিয়ে যাওয়া কিছু থাকলে (যেমন আজকের কাজের নোটিফিকেশন) এখনই দেখানো
        JSONArray all = load(ctx);
        long now = System.currentTimeMillis();
        for (int i = 0; i < all.length(); i++) {
            JSONObject o = all.optJSONObject(i);
            if (o != null && o.optLong("at", 0) <= now) { next = now + 2000; break; }
        }
        if (next == -1) {
            am.cancel(pi);
            return -1;
        }
        setAt(ctx, am, next, pi, isAlarmAt(ctx, next));
        return next;
    }

    static void setAt(Context ctx, AlarmManager am, long at, PendingIntent pi) {
        setAt(ctx, am, at, pi, true);
    }

    static void setAt(Context ctx, AlarmManager am, long at, PendingIntent pi, boolean clock) {
        try {
            if (canExact(ctx) && clock) {
                // অ্যালার্ম ঘড়ির মতো: সবচেয়ে নির্ভরযোগ্য, Doze মোডেও ঠিক সময়ে বাজে
                am.setAlarmClock(new AlarmManager.AlarmClockInfo(at, openAppPending(ctx)), pi);
            } else if (canExact(ctx) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            } else {
                am.set(AlarmManager.RTC_WAKEUP, at, pi);
            }
        } catch (SecurityException e) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            } else {
                am.set(AlarmManager.RTC_WAKEUP, at, pi);
            }
        }
    }

    /* অ্যালার্ম বাজলে: সময় হয়ে যাওয়া রিমাইন্ডারগুলো দেখানো, তালিকা থেকে বাদ দেওয়া, পরেরটা বসানো */
    public static void fireDue(Context ctx) {
        JSONArray list = load(ctx);
        JSONArray keep = new JSONArray();
        long now = System.currentTimeMillis();
        for (int i = 0; i < list.length(); i++) {
            JSONObject o = list.optJSONObject(i);
            if (o == null) continue;
            long at = o.optLong("at", 0);
            if (at <= now + 30000) {
                String kind = o.optString("kind", "alarm");
                int nid = o.optInt("id", (int) (at / 1000));
                if ("pin".equals(kind)) {
                    // দিনের কাজ: সেদিন শেষ না হওয়া পর্যন্ত দেখানো (ফোন বন্ধ থাকলেও পরে চালু হলে)
                    if (now < o.optLong("until", at + 86400000L)) showPin(ctx, nid, o.optString("title"), o.optString("body"), o.optString("color", ""));
                } else if ("unpin".equals(kind)) {
                    NotificationManagerCompat.from(ctx).cancel(nid);
                } else if (at >= now - 15 * 60000) {
                    // ১৫ মিনিটের বেশি পুরোনো হলে আর দেখানো হয় না (যেমন ফোন বন্ধ ছিল)
                    show(ctx, nid, o.optString("title"), o.optString("body"), o.optString("color", ""));
                }
            } else {
                keep.put(o);
            }
        }
        save(ctx, keep);
        scheduleNext(ctx);
    }

    public static void scheduleTest(Context ctx, String title, String body, long delayMs) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent i = new Intent(ctx, ClassAlarmReceiver.class).setAction(ACTION_TEST);
        i.putExtra("title", title);
        i.putExtra("body", body);
        PendingIntent pi = PendingIntent.getBroadcast(ctx, REQ_TEST, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        setAt(ctx, am, System.currentTimeMillis() + delayMs, pi);
    }

    /* সারাদিনের কাজের নোটিফিকেশন: শব্দ নেই, সোয়াইপে সরে না, দিন শেষে নিজে সরে যায় */
    public static void showPin(Context ctx, int id, String title, String body, String color) {
        ensureChannel(ctx);
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, PIN_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_class)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setShowWhen(false)
            .setContentIntent(openAppPending(ctx));
        try {
            if (color != null && color.startsWith("#")) b.setColor(Color.parseColor(color));
        } catch (Exception ignored) {}
        try {
            NotificationManagerCompat.from(ctx).notify(id, b.build());
        } catch (SecurityException e) {
            // নোটিফিকেশনের অনুমতি বন্ধ
        }
    }

    public static void show(Context ctx, int id, String title, String body, String color) {
        ensureChannel(ctx);
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, channelId(ctx))
            .setSmallIcon(R.drawable.ic_stat_class)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true) // সোয়াইপে সরবে না
            .setAutoCancel(true) // চাপ দিলে সরবে
            .setWhen(System.currentTimeMillis())
            .setShowWhen(true)
            .setContentIntent(openAppPending(ctx));
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            // পুরোনো Android-এ channel নেই, তাই সরাসরি শব্দ দেওয়া
            b.setVibrate(new long[] { 0, 600, 250, 600, 250, 600 });
        }
        try {
            if (color != null && color.startsWith("#")) b.setColor(Color.parseColor(color));
        } catch (Exception ignored) {}
        try {
            NotificationManagerCompat.from(ctx).notify(id, b.build());
        } catch (SecurityException e) {
            // নোটিফিকেশনের অনুমতি বন্ধ
        }
        playSound(ctx, soundUri(ctx), 8000, null);
    }
}
