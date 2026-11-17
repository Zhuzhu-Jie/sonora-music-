from pathlib import Path
import subprocess,time,json,re,os,shutil,sys,xml.etree.ElementTree as ET
from PIL import Image
root=Path(__file__).resolve().parents[1]
adb=os.environ.get('ANDROID_ADB') or shutil.which('adb') or str(Path(os.environ['ANDROID_HOME'])/'platform-tools/adb')
def run(*args,timeout=50,check=True):
 p=subprocess.run([adb,*args],capture_output=True,timeout=timeout)
 if check and p.returncode:raise RuntimeError(p.stderr.decode(errors='replace'))
 return p.stdout.decode(errors='replace')
for i in range(72):
 if run('shell','getprop','sys.boot_completed',check=False).strip()=='1':break
 if i%6==0:print('Waiting for first Android boot...',flush=True)
 time.sleep(5)
else:raise RuntimeError('Android first boot did not finish within 6 min')
print('Android boot complete',flush=True)
if '--skip-install' not in sys.argv:
 print(run('install','--no-incremental','-r',str(root/'build/sonora-1.0.0.apk'),timeout=90),flush=True)
else: print('Using APK already installed on device',flush=True)
run('shell','input','keyevent','224')
run('shell','wm','dismiss-keyguard',check=False)
run('logcat','-c')
print(run('shell','am','start','-W','-n','cn.sonora.music/.MainActivity',timeout=90),flush=True)
time.sleep(8)
(root/'build/android-home.png').write_bytes(subprocess.check_output([adb,'exec-out','screencap','-p']))
print('APK launch screenshot captured',flush=True)
focus=run('shell','dumpsys','window','windows')
assert re.search(r'mCurrentFocus=.*cn\.sonora\.music',focus),'App is not the focused window'
image=Image.open(root/'build/android-home.png').convert('RGB')
assert len(image.getcolors(image.width*image.height))>100,'Captured frame appears blank'
log=run('logcat','-d','-s','AndroidRuntime:E','chromium:E')
(root/'build/android-log.txt').write_text(log)
assert 'FATAL EXCEPTION' not in log,log
print('PASS: focused activity, nonblank frame and no Java crash; install checked when enabled, page contents require visual review',flush=True)
