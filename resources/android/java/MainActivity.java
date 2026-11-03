package com.palash.classroutine;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

/*
 * অ্যাপের মূল স্ক্রিন।
 *  - ClassAlarmPlugin: ক্লাসের রিমাইন্ডার নিজস্ব নেটিভ কোডে বসানো হয় (ClassAlarmScheduler দেখুন)
 *  - জোরে বিপসহ notification channel তৈরি
 *  - কিবোর্ড খুললে লেখার ঘর দেখা যাওয়ার ব্যবস্থা
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ClassAlarmPlugin.class);
        ClassAlarmScheduler.ensureChannel(this);
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

}
