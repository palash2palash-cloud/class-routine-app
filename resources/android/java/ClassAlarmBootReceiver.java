package com.palash.classroutine;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/* ফোন চালু হলে, সময়/টাইমজোন বদলালে বা অ্যাপ আপডেট হলে পরের রিমাইন্ডার আবার বসানো */
public class ClassAlarmBootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        ClassAlarmScheduler.ensureChannel(context);
        ClassAlarmScheduler.scheduleNext(context);
    }
}
