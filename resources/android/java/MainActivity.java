package com.palash.classroutine;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/*
 * ক্লাসের রিমাইন্ডারের জন্য নিজস্ব notification channel তৈরি করে:
 *  - জোরে বিপ শব্দ (res/raw/class_beep.wav), Alarm ভলিউমে বাজে
 *  - স্ক্রিনের উপরে পপ-আপ (IMPORTANCE_HIGH), কম্পন
 * Android-এ একবার channel তৈরি হলে তার শব্দ আর বদলানো যায় না, তাই নতুন id ব্যবহার করা হয়েছে
 * এবং পুরোনো "class-reminders" channel মুছে ফেলা হয়।
 */
public class MainActivity extends BridgeActivity {

    public static final String CHANNEL_ID = "class-alarm-v1";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        createClassChannel();
        super.onCreate(savedInstanceState);
    }

    private void createClassChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null) return;
        nm.deleteNotificationChannel("class-reminders");
        if (nm.getNotificationChannel(CHANNEL_ID) != null) return;

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "ক্লাস রিমাইন্ডার / Class reminders",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("ক্লাস শুরুর আগে জোরে বিপ দিয়ে মনে করিয়ে দেয়");
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[] { 0, 500, 250, 500, 250, 500 });
        channel.enableLights(true);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        Uri sound = Uri.parse("android.resource://" + getPackageName() + "/raw/class_beep");
        AudioAttributes attrs = new AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(AudioAttributes.USAGE_ALARM)
            .build();
        channel.setSound(sound, attrs);
        nm.createNotificationChannel(channel);
    }
}
