package com.palash.classroutine;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
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
        fitWebViewAboveKeyboard();
    }

    /*
     * Android 15 (API 35) থেকে অ্যাপ পুরো স্ক্রিন জুড়ে আঁকে (edge-to-edge), তখন
     * adjustResize কাজ করে না এবং কিবোর্ড ওয়েবপেজের নিচের অংশ ঢেকে ফেলে।
     * Capacitor শুধু স্ট্যাটাস বার / নেভিগেশন বারের জন্য জায়গা ছাড়ে, কিবোর্ডের জন্য নয়।
     * তাই এখানে কিবোর্ড খুললে WebView-এর নিচে কিবোর্ডের সমান জায়গা ছাড়া হয়,
     * ফলে পেজটা কিবোর্ডের উপরে ছোট হয়ে বসে আর যে ঘরে লেখা হচ্ছে সেটা দেখা যায়।
     */
    private void fitWebViewAboveKeyboard() {
        if (Build.VERSION.SDK_INT < 35) return; // পুরোনো Android-এ adjustResize নিজেই কাজ করে
        if (getBridge() == null) return;
        final View webView = getBridge().getWebView();
        if (webView == null) return;
        ViewCompat.setOnApplyWindowInsetsListener(webView, (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            Insets ime = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
            ViewGroup.MarginLayoutParams mlp = (ViewGroup.MarginLayoutParams) v.getLayoutParams();
            mlp.leftMargin = bars.left;
            mlp.topMargin = bars.top;
            mlp.rightMargin = bars.right;
            mlp.bottomMargin = Math.max(bars.bottom, ime.bottom);
            v.setLayoutParams(mlp);
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(webView);
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
