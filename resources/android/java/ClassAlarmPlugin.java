package com.palash.classroutine;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
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
                list.put(c);
            }
            ClassAlarmScheduler.ensureChannel(ctx);
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

    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(status(getContext()));
    }

    private JSObject status(Context ctx) {
        JSObject r = new JSObject();
        r.put("count", ClassAlarmScheduler.load(ctx).length());
        r.put("next", ClassAlarmScheduler.nextTime(ctx));
        r.put("exact", ClassAlarmScheduler.canExact(ctx));
        r.put("enabled", NotificationManagerCompat.from(ctx).areNotificationsEnabled());
        int importance = -1;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = ctx.getSystemService(NotificationManager.class);
            NotificationChannel ch = nm != null ? nm.getNotificationChannel(ClassAlarmScheduler.CHANNEL_ID) : null;
            if (ch != null) importance = ch.getImportance();
        }
        r.put("channelImportance", importance);
        return r;
    }
}
