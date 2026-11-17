package cn.sonora.music;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.WindowInsets;
import android.widget.FrameLayout;
import android.view.ViewGroup;
import android.webkit.*;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.util.Collections;

public final class MainActivity extends Activity {
    private WebView web;
    private volatile boolean running = false;
    private AudioRecord recorder;
    private Thread audioThread;
    private boolean foreground = false;
    private boolean permissionRequestPending = false, startAfterResume = false;
    private static final String ORIGIN = "https://appassets.androidplatform.net";
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(246,245,239));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setBlockNetworkLoads(true);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setSupportMultipleWindows(false);
        WebView.setWebContentsDebuggingEnabled(false);
        web.addJavascriptInterface(new MicrophoneBridge(), "Sonora");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) { return true; }
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                String p = u.getPath();
                if ("https".equals(u.getScheme()) && "appassets.androidplatform.net".equals(u.getHost()) && p != null && p.matches("/assets/[a-zA-Z0-9_./-]+") && !p.contains("..")) {
                    try {
                        String mime = p.endsWith(".html") ? "text/html" : p.endsWith(".css") ? "text/css" : p.endsWith(".js") ? "application/javascript" : p.endsWith(".wav") ? "audio/wav" : p.endsWith(".svg") ? "image/svg+xml" : "application/octet-stream";
                        return new WebResourceResponse(mime, p.endsWith(".wav") ? null : "UTF-8", 200, "OK", Collections.singletonMap("X-Content-Type-Options","nosniff"), getAssets().open(p.substring(8)));
                    } catch (Exception ignored) { }
                }
                return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
            }
        });
        FrameLayout root = new FrameLayout(this);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        // Android 15 draws edge to edge: keep controls outside system bars.
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener((v, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                int bottom = Math.max(bars.bottom, insets.getInsets(WindowInsets.Type.ime()).bottom);
                v.setPadding(bars.left, bars.top, bars.right, bottom); return insets;
            });
        }
        root.requestApplyInsets();
        web.loadUrl(ORIGIN + "/assets/index.html");
    }
    private void event(String state) {
        runOnUiThread(() -> { if(web != null) web.evaluateJavascript("window.nativeState&&window.nativeState("+ JSONObject.quote(state) +")", null); });
    }
    public final class MicrophoneBridge {
        @JavascriptInterface public void close() { runOnUiThread(() -> finish()); }
        @JavascriptInterface public void start() {
            runOnUiThread(() -> {
                if (!foreground || running) return;
                if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                    permissionRequestPending = true;
                    requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, 7);
                } else startMic();
            });
        }
        @JavascriptInterface public void stop() { runOnUiThread(() -> { startAfterResume = false; stopMic(); }); }
    }
    @Override public void onRequestPermissionsResult(int req, String[] p, int[] results) {
        super.onRequestPermissionsResult(req,p,results);
        if (req == 7) {
            permissionRequestPending = false;
            if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) {
                if (foreground) startMic(); else startAfterResume = true;
            } else event("denied");
        }
    }
    private void startMic() {
        if (running || !foreground) return;
        if (audioThread != null && audioThread.isAlive()) { event("busy"); return; }
        final int rate = 22050, size = 2048;
        try {
            int min = AudioRecord.getMinBufferSize(rate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);
            if(min <= 0) { event("error"); return; }
            final AudioRecord active = new AudioRecord(MediaRecorder.AudioSource.MIC, rate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, Math.max(min, size * 4));
            recorder = active;
            if (active.getState() != AudioRecord.STATE_INITIALIZED) { active.release(); recorder=null; event("error"); return; }
            active.startRecording(); running = true; event("started");
            audioThread = new Thread(() -> {
                android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_AUDIO);
                short[] frame = new short[size];
                PitchDetector detector = new PitchDetector(rate, size);
                long last = 0;
                try {
                    while (running) {
                        int count = active.read(frame, 0, size, AudioRecord.READ_BLOCKING);
                        if (count < 0) { if(running) event("error"); break; }
                        if (count != size) continue;
                        double hz = detector.detect(frame);
                        if (SystemClock.elapsedRealtime() - last > 85 && running) {
                            last = SystemClock.elapsedRealtime();
                            final String js = "window.nativePitch&&window.nativePitch(" + hz + "," + detector.confidence + "," + detector.rms + ")";
                            runOnUiThread(() -> { if(running && web != null) web.evaluateJavascript(js, null); });
                        }
                    }
                } catch (Exception e) { if(running) event("error"); }
                finally { running=false; try { active.stop(); } catch(Exception ignored) {} active.release(); }
            }, "LocalPitch");
            audioThread.start();
        } catch (Exception e) { running=false; if(recorder!=null) { try{recorder.release();}catch(Exception ignored){} recorder=null; } event("error"); }
    }
    private void stopMic() {
        running = false;
        if (recorder != null) { try { recorder.stop(); } catch (Exception ignored) {} recorder=null; }
        event("stopped");
    }
    @Override protected void onResume() { super.onResume(); foreground = true; if(web!=null) web.onResume(); if(startAfterResume){startAfterResume=false;startMic();} }
    @Override protected void onPause() {
        foreground = false;
        if(!permissionRequestPending) {
            startAfterResume = false; stopMic();
            if(web!=null) web.evaluateJavascript("window.appPause&&window.appPause()",null);
        }
        if(web!=null) web.onPause();
        super.onPause();
    }
    @Override public void onBackPressed() { web.evaluateJavascript("window.appBack&&window.appBack()",null); }
    @Override protected void onDestroy() { stopMic(); web.removeJavascriptInterface("Sonora"); web.destroy(); web=null; super.onDestroy(); }
}
