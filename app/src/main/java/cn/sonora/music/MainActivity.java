package cn.sonora.music;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.content.Intent;
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
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.Collections;

public final class MainActivity extends Activity {
    private WebView web;
    private volatile boolean running = false;
    private AudioRecord recorder;
    private Thread audioThread;
    private boolean foreground = false;
    private boolean permissionRequestPending = false, startAfterResume = false;
    private String pendingBackup;
    private boolean fileRequestPending = false;
    private static final int MAX_BACKUP_BYTES = 4 * 1024 * 1024;
    private static final String ORIGIN = "https://appassets.androidplatform.net";
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(245,246,250));
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
    private static String quoteForJs(String value) {
        return JSONObject.quote(value).replace(Character.toString((char)0x2028), "\\u2028").replace(Character.toString((char)0x2029), "\\u2029");
    }
    private void notice(String message) {
        runOnUiThread(() -> { if(web!=null) web.evaluateJavascript("window.nativeNotice&&window.nativeNotice("+JSONObject.quote(message)+")",null); });
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request,result,data);
        if(request!=21 && request!=22)return;
        if(result!=RESULT_OK || data==null || data.getData()==null){pendingBackup=null;fileRequestPending=false;return;}
        final Uri uri=data.getData();
        final String export=pendingBackup;pendingBackup=null;
        new Thread(() -> {
            try {
                if(request==21) {
                    if(export==null)throw new IllegalStateException();
                    try(OutputStream output=getContentResolver().openOutputStream(uri,"wt")) {
                        if(output==null)throw new IllegalStateException();
                        output.write(export.getBytes(StandardCharsets.UTF_8));
                    }
                    notice("学习备份已导出。");
                } else {
                    ByteArrayOutputStream bytes=new ByteArrayOutputStream();
                    try(InputStream input=getContentResolver().openInputStream(uri)) {
                        if(input==null)throw new IllegalStateException();
                        byte[] buffer=new byte[8192];int count;
                        while((count=input.read(buffer))!=-1) {
                            if(bytes.size()+count>MAX_BACKUP_BYTES)throw new IllegalArgumentException("large");
                            bytes.write(buffer,0,count);
                        }
                    }
                    final String json=new String(bytes.toByteArray(),StandardCharsets.UTF_8);
                    runOnUiThread(() -> {if(web!=null)web.evaluateJavascript("window.nativeBackup&&window.nativeBackup("+quoteForJs(json)+")",null);});
                }
            } catch(IllegalArgumentException e){notice("备份超过4 MiB，无法导入。");}
            catch(Exception e){notice("文件读写失败，请选择有效备份或其他保存位置。");}
            finally {runOnUiThread(() -> fileRequestPending=false);}
        },"UserBackup").start();
    }
    private void event(String state) {
        runOnUiThread(() -> { if(web != null) web.evaluateJavascript("window.nativeState&&window.nativeState("+ JSONObject.quote(state) +")", null); });
    }
    public final class MicrophoneBridge {
        @JavascriptInterface public void exportData(String data) {
            if (data == null || data.getBytes(StandardCharsets.UTF_8).length > MAX_BACKUP_BYTES) { notice("备份超过4 MiB，无法导出。"); return; }
            runOnUiThread(() -> {
                if (!foreground || fileRequestPending) return;
                pendingBackup = data; fileRequestPending = true;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE); intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, "sonora-backup-" + new SimpleDateFormat("yyyyMMdd-HHmm", Locale.ROOT).format(new Date()) + ".json");
                try { startActivityForResult(intent, 21); } catch (Exception e) { pendingBackup=null; fileRequestPending=false; notice("没有可用的系统文件选择器。"); }
            });
        }
        @JavascriptInterface public void importData() {
            runOnUiThread(() -> {
                if (!foreground || fileRequestPending) return;
                fileRequestPending=true;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE); intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/json", "text/plain", "application/octet-stream"});
                try { startActivityForResult(intent, 22); } catch(Exception e) { fileRequestPending=false; notice("没有可用的系统文件选择器。"); }
            });
        }
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
        final int rate = 44100, size = 4096;
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
                short[] analysis = new short[size / 2];
                PitchDetector detector = new PitchDetector(rate / 2, size / 2);
                long deadline = SystemClock.elapsedRealtime() + 60000;
                long last = 0;
                try {
                    while (running && SystemClock.elapsedRealtime() < deadline) {
                        int count = active.read(frame, 0, size, AudioRecord.READ_BLOCKING);
                        if (count < 0) { if(running) event("error"); break; }
                        if (count != size) continue;
                        PitchDetector.prepareFrame(frame, analysis);
                        double hz = detector.detect(analysis);
                        if (SystemClock.elapsedRealtime() - last > 85 && running) {
                            last = SystemClock.elapsedRealtime();
                            final String js = "window.nativePitch&&window.nativePitch(" + hz + "," + detector.confidence + "," + detector.rms + ")";
                            runOnUiThread(() -> { if(running && web != null) web.evaluateJavascript(js, null); });
                        }
                    }
                } catch (Exception e) { if(running) event("error"); }
                finally { boolean ended=running; running=false; try { active.stop(); } catch(Exception ignored) {} active.release(); if(ended)event("stopped"); }
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
