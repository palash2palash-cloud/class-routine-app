package com.palash.classroutine;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/* অ্যালার্মের সময় হলে Android এটিকে ডাকে, অ্যাপ বন্ধ থাকলেও */
public class ClassAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (ClassAlarmScheduler.ACTION_TEST.equals(intent.getAction())) {
            ClassAlarmScheduler.show(context, 99999, intent.getStringExtra("title"), intent.getStringExtra("body"), "#4F46E5");
            ClassAlarmScheduler.scheduleNext(context);
            return;
        }
        ClassAlarmScheduler.fireDue(context);
    }
}
