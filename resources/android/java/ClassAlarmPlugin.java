package com.palash.classroutine;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.annotation.ActivityCallback;
import android.os.Build;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

/* ওয়েব অংশ (notify.js) থেকে রিমাইন্ডারের তালিকা নেটিভে পাঠানোর সেতু */
@CapacitorPlugin(name = "ClassAlarm")
public class ClassAlarmPlugin extends Plugin {

    @PluginMethod
    public void schedule(PluginCall call) {
        Context ctx = getContext();
        try {
            JSArray input = call.getArray("alarms", new JSArray());
            JSONArray list = new JSONArray();
            for (int i = 0; i < input.length(); i++) {
                JSONObject o = input.getJSONObject(i);
                JSONObject c = new JSONObject();
                c.put("id", o.optInt("id"));
                c.put("at", o.optLong("at"));
                c.put("title", o.optString("title"));
                c.put("body", o.optString("body"));
                c.put("color", o.optString("color", ""));
                // kind: alarm (বিপ দিয়ে), pin (সারাদিন নোটিফিকেশন বারে চুপচাপ), unpin (দিন শেষে সরানো)
                c.put("kind", o.optString("kind", "alarm"));
                if (o.has("until")) c.put("until", o.optLong("until"));
                list.put(c);
            }
            ClassAlarmScheduler.ensureChannel(ctx);
            ClassAlarmScheduler.clearPins(ctx);
            ClassAlarmScheduler.replaceAll(ctx, list);
            call.resolve(status(ctx));
        } catch (Exception e) {
            call.reject("schedule failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        ClassAlarmScheduler.clear(getContext());
        call.resolve(status(getContext()));
    }

    @PluginMethod
    public void test(PluginCall call) {
        Context ctx = getContext();
        ClassAlarmScheduler.ensureChannel(ctx);
        ClassAlarmScheduler.scheduleTest(ctx, call.getString("title", "Class Routine"), call.getString("body", ""), call.getInt("delay", 5000));
        call.resolve(status(ctx));
    }

    /* ফোনের নিজের শব্দের তালিকা খুলে একটা বাছাই করা (Android-এর রিংটোন পিকার) */
    @PluginMethod
    public void pickSound(PluginCall call) {
        Intent i = new Intent(RingtoneManager.ACTION_RINGTONE_PICKER);
        i.putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_ALL);
        i.putExtra(RingtoneManager.EXTRA_RINGTONE_TITLE, call.getString("title", "Reminder sound"));
        i.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, false);
        i.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, false);
        String cur = ClassAlarmScheduler.savedSound(getContext());
        if (cur != null && !cur.isEmpty()) i.putExtra(RingtoneManager.EXTRA_RINGTONE_EXISTING_URI, Uri.parse(cur));
        startActivityForResult(call, i, "onSoundPicked");
    }

    @ActivityCallback
    private void onSoundPicked(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Context ctx = getContext();
        Intent data = result.getData();
        Uri uri = data != null ? data.getParcelableExtra(RingtoneManager.EXTRA_RINGTONE_PICKED_URI) : null;
        if (result.getResultCode() != android.app.Activity.RESULT_OK || uri == null) {
            JSObject r = soundInfo(ctx);
            r.put("cancelled", true);
            call.resolve(r);
            return;
        }
        String title = "";
        try {
            Ringtone rt = RingtoneManager.getRingtone(ctx, uri);
            if (rt != null) title = rt.getTitle(ctx);
        } catch (Exception ignored) {}
        ClassAlarmScheduler.setSound(ctx, uri.toString(), title);
        call.resolve(soundInfo(ctx));
    }

    /* অ্যাপের নিজের বিপে ফিরে যাওয়া */
    @PluginMethod
    public void resetSound(PluginCall call) {
        ClassAlarmScheduler.setSound(getContext(), "", "");
        call.resolve(soundInfo(getContext()));
    }

    @PluginMethod
    public void getSound(PluginCall call) {
        call.resolve(soundInfo(getContext()));
    }

    /* অ্যাপের ভেতরের সুন্দর শব্দগুলোর একটা (res/raw/tone_*.ogg) বেছে নেওয়া */
    @PluginMethod
    public void setBuiltinSound(PluginCall call) {
        String name = call.getString("name", "");
        if (!name.matches("tone_[a-z]+")) { call.reject("bad name"); return; }
        Context ctx = getContext();
        ClassAlarmScheduler.setSound(ctx, "android.resource://" + ctx.getPackageName() + "/raw/" + name, call.getString("title", name));
        call.resolve(soundInfo(ctx));
    }

    private Ringtone playing;

    /* শব্দ একবার বাজিয়ে শোনানো: name দিলে অ্যাপের সেই শব্দ, না দিলে এখন বাছাই করা শব্দ */
    @PluginMethod
    public void previewSound(PluginCall call) {
        Context ctx = getContext();
        try {
            if (playing != null && playing.isPlaying()) playing.stop();
            String name = call.getString("name", "");
            Uri uri = name.matches("tone_[a-z]+")
                ? Uri.parse("android.resource://" + ctx.getPackageName() + "/raw/" + name)
                : ClassAlarmScheduler.soundUri(ctx);
            playing = RingtoneManager.getRingtone(ctx, uri);
            if (playing != null) playing.play();
        } catch (Exception ignored) {}
        call.resolve();
    }

    private JSObject soundInfo(Context ctx) {
        JSObject r = new JSObject();
        r.put("uri", ClassAlarmScheduler.savedSound(ctx));
        r.put("title", ClassAlarmScheduler.savedSoundTitle(ctx));
        return r;
    }

    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(status(getContext()));
    }

    private JSObject status(Context ctx) {
        JSObject r = new JSObject();
        r.put("count", ClassAlarmScheduler.load(ctx).length());
        r.put("next", ClassAlarmScheduler.nextTime(ctx, true));
        r.put("exact", ClassAlarmScheduler.canExact(ctx));
        r.put("enabled", NotificationManagerCompat.from(ctx).areNotificationsEnabled());
        int importance = -1;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = ctx.getSystemService(NotificationManager.class);
            NotificationChannel ch = nm != null ? nm.getNotificationChannel(ClassAlarmScheduler.channelId(ctx)) : null;
            if (ch != null) importance = ch.getImportance();
        }
        r.put("channelImportance", importance);
        return r;
    }
}
